from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import httpx
import base64
import json
import re
import sqlite3
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma4:e2b"

# ==================== DATABASE ====================
DB_PATH = "sehatgemma.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS glucose_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value INTEGER,
        timestamp TEXT,
        notes TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS meal_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_name_en TEXT,
        food_name_ur TEXT,
        sugar_risk TEXT,
        confidence INTEGER,
        timestamp TEXT,
        carbs_g INTEGER
    )''')
    conn.commit()
    conn.close()

init_db()

# ==================== JSON CLEANER ====================
def clean_json_response(text: str) -> dict:
    text = text.strip()
    if "```" in text:
        matches = re.findall(r"```(?:json)?\s*([\s\S]*?)```", text)
        if matches:
            text = matches[-1].strip()
    try:
        return json.loads(text)
    except:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end+1])
            except:
                pass
    return None

# ==================== RESEARCH-INJECTED SYSTEM PROMPT ====================
SYSTEM_PROMPT = """You are SehatGemma, an AI nutrition and diabetes assistant built for Pakistan. 
You follow Pakistan's PROMPT national clinical guidelines. All advice must be culturally appropriate for Pakistani patients.

PAKISTAN DIABETES CONTEXT (from IDF/WHO 2024-2025):
- Pakistan has the world's highest age-standardized diabetes prevalence: 31.4%
- 33-36 million adults currently affected; projected 70.2 million by 2050
- 26.9-37.2% of diabetics remain undiagnosed (9.3+ million people)
- 230,000 diabetes-related deaths annually
- Direct cost per patient: $332 USD/year
- 19% of low-income earnings spent on diabetes management
- 46-70% of patients have poor diabetes knowledge

PROVINCIAL PREVALENCE:
- Sindh: 32.3% (Karachi highest urban density)
- Punjab: 30.2% (rapid urbanization)
- Baluchistan: 29.5% (limited healthcare access)
- KPK: 13.2% (emerging obesity in youth)

PROMPT GLYCEMIC TARGETS:
- Without complications: Fasting 80-120 mg/dl, HbA1c 6.5-7.0%
- With comorbidities (CKD, CCF): Fasting 80-160 mg/dl, HbA1c 7.0-7.5%
- Elderly / high hypo risk: Individualized, HbA1c <8.0%

PAKISTANI FOOD DATABASE (carbohydrate counting per typical portion):
- Naan (1 piece, 133g): 66g carbs, HIGH GI, significant spike
- Tandoori Roti (1 medium, 33g): 15g carbs, MODERATE GI, preferred
- Biryani (1 cup, 160g): 27g carbs, HIGH risk (fat+carb combo)
- Haleem (1 cup, 214g): 30g carbs, MODERATE (high protein/fiber, slower absorption)
- Nihari (1 cup, 240g): 7g carbs, LOW carb but HIGH lipid
- Moong Dal (1 cup, 185g): 27g carbs, STABLE (high fiber)
- Paratha: HIGH risk (refined flour + excessive oil)
- Lassi (sweetened): HIGH sugar risk
- Doodh Patti (no sugar): LOW risk
- Chai (with sugar): HIGH sugar spike
- Small Apple (100g): 15g carbs, good snack
- Karela (bitter gourd): LOW carb, beneficial for glycemic control
- Methi (fenugreek): LOW carb, beneficial

COMPLICATION RISKS TO MENTION:
- Diabetic Retinopathy: 32.9% prevalence (leading cause of preventable blindness)
- Diabetic Nephropathy/CKD: 14-31.4% prevalence
- Diabetic Neuropathy: 10.8-59.6% prevalence
- Coronary Artery Disease: 8.8% prevalence
- Hypertension comorbidity: 65.7% of diabetics

DIETARY WARNINGS FOR PAKISTAN:
- Per capita sugar consumption: 31.7-33 kg/year (nearly double India, 5x China/Bangladesh)
- Per capita edible oil: 22 kg/year (palm oil dominant)
- "Tarka" cooking and deep-frying are major contributors
- Refined carbs (maida, white rice) trigger persistent hyperglycemia

RESPONSE RULES:
- Keep language simple. 46-70% of patients have poor health literacy.
- Always mention portion sizes and carb counts when possible.
- Reference PROMPT guidelines for glycemic targets.
- Suggest culturally appropriate swaps (roti instead of naan, barley instead of white flour).
- For high-risk foods, warn about retinopathy, nephropathy, and neuropathy risks.

JSON RESPONSE FORMAT (STRICT - no markdown, no extra text):
{
  "food_name_en": "English name",
  "food_name_ur": "Urdu name in Roman or Arabic script",
  "sugar_risk": "low|medium|high",
  "explanation_en": "Simple explanation with carb count and PROMPT reference",
  "explanation_ur": "Simple Urdu explanation",
  "swap_suggestion_en": "Healthier Pakistani alternative with portion",
  "swap_suggestion_ur": "Urdu alternative with portion",
  "confidence": 85,
  "carbs_g": 15,
  "calories_estimate": "~450 kcal",
  "key_ingredients": ["wheat", "oil"],
  "agent_action": "analyze_meal"
}

AGENT ACTION RULES:
- If user mentions glucose/sugar numbers (e.g., "meri sugar 180 hai", "my fasting is 140"), set agent_action to "log_glucose" and extract the number
- If user mentions emergency symptoms (chakkar, bekhudi, dizzy, blurred vision, chest pain, foot wound), set agent_action to "emergency_alert"
- If user asks for meal plan or diet advice, set agent_action to "meal_plan"
- Default: analyze_meal"""

# ==================== AGENT TOOLS ====================
def tool_log_glucose(value: int, notes: str = ""):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO glucose_logs (value, timestamp, notes) VALUES (?, ?, ?)",
              (value, datetime.now().isoformat(), notes))
    conn.commit()
    conn.close()
    return {"status": "logged", "value": value, "message": f"Glucose {value} mg/dL recorded."}

def tool_emergency_alert():
    return {
        "status": "emergency",
        "message_en": "EMERGENCY: Please contact your doctor immediately. If severe, go to nearest hospital (Aga Khan, Jinnah, or local DHQ).",
        "message_ur": "ایمرجنسی: فوری طور پر ڈاکٹر سے رابطہ کریں۔ اگر شدید ہے تو قریب ترین ہسپتال جائیں۔",
        "actions": [
            "Call emergency contact",
            "Check last glucose reading",
            "Stay seated, do not stand",
            "If chest pain or severe shortness of breath, call 1122"
        ],
        "nearest_facilities": ["Aga Khan Hospital", "Jinnah Hospital", "Local DHQ / THQ"]
    }

def tool_meal_plan():
    return {
        "status": "meal_plan",
        "breakfast": "1 egg + 1 medium roti (15g carbs) + cucumber",
        "lunch": "1 cup moong dal (27g carbs) + 1 roti + salad",
        "dinner": "Grilled chicken + 1 roti + karela sabzi",
        "snacks": "Small apple (15g carbs) or unsalted nuts",
        "total_carbs": "~90-100g",
        "note": "Based on PROMPT guidelines for T2DM without complications"
    }

# ==================== MAIN ENDPOINTS ====================
@app.post("/analyze")
async def analyze(
    file: UploadFile = File(None),
    text: str = Form(""),
    language: str = Form("en"),
    glucose_level: str = Form(None)
):
    img_b64 = None
    if file:
        contents = await file.read()
        img_b64 = base64.b64encode(contents).decode()
    
    user_prompt = f"Language: {language}. "
    if glucose_level:
        user_prompt += f"Patient glucose: {glucose_level} mg/dL. "
    if text:
        user_prompt += f"User said: {text}. "
    if not text and not img_b64:
        user_prompt += "Analyze this Pakistani food."
    
    # CRITICAL FIX: "think": False kills 20s reasoning delay
    payload = {
        "model": MODEL,
        "prompt": user_prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "think": False,  # <-- ADDED: Kills 20s thinking delay
        "options": {
            "temperature": 0.1,
            "num_predict": 500,
        }
    }
    if img_b64:
        payload["images"] = [img_b64]
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(OLLAMA_URL, json=payload, timeout=120.0)
        resp.raise_for_status()
        data = resp.json()
    
    raw = data.get("response", "")
    result = clean_json_response(raw)
    
    if not result:
        result = {
            "food_name_en": "Unknown",
            "food_name_ur": "نامعلوم",
            "sugar_risk": "unknown",
            "explanation_en": "Could not analyze. Please try again with a clearer photo or description.",
            "explanation_ur": "تجزیہ نہیں ہو سکا۔ براہ کرم واضح تصویر یا تفصیل دیں۔",
            "swap_suggestion_en": "Try simple home-cooked Pakistani food",
            "swap_suggestion_ur": "سادہ گھریلو پاکستانی کھانا آزمائیں",
            "confidence": 0,
            "carbs_g": 0,
            "calories_estimate": "N/A",
            "key_ingredients": [],
            "agent_action": "analyze_meal",
            "raw_debug": raw[:200]
        }
    
    # EXECUTE AGENT TOOLS
    action = result.get("agent_action", "analyze_meal")
    
    if action == "log_glucose":
        numbers = re.findall(r'\d+', text)
        if numbers:
            glucose_val = int(numbers[0])
            tool_result = tool_log_glucose(glucose_val, text)
            result["tool_result"] = tool_result
    
    elif action == "emergency_alert":
        tool_result = tool_emergency_alert()
        result["tool_result"] = tool_result
    
    elif action == "meal_plan":
        tool_result = tool_meal_plan()
        result["tool_result"] = tool_result
    
    # Log meal to DB
    if file or (result.get("food_name_en") and result.get("food_name_en") != "Unknown"):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""INSERT INTO meal_logs (food_name_en, food_name_ur, sugar_risk, confidence, timestamp, carbs_g)
                     VALUES (?, ?, ?, ?, ?, ?)""",
                  (result.get("food_name_en"), result.get("food_name_ur"), 
                   result.get("sugar_risk"), result.get("confidence"), 
                   datetime.now().isoformat(), result.get("carbs_g", 0)))
        conn.commit()
        conn.close()
    
    return result

@app.get("/glucose-history")
def glucose_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM glucose_logs ORDER BY timestamp DESC LIMIT 50")
    rows = c.fetchall()
    conn.close()
    return {"logs": [{"id": r[0], "value": r[1], "timestamp": r[2], "notes": r[3]} for r in rows]}

@app.get("/meal-history")
def meal_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM meal_logs ORDER BY timestamp DESC LIMIT 50")
    rows = c.fetchall()
    conn.close()
    return {"logs": [{"id": r[0], "food_name_en": r[1], "food_name_ur": r[2], 
                     "sugar_risk": r[3], "confidence": r[4], "timestamp": r[5], "carbs_g": r[6]} for r in rows]}

@app.get("/weekly-report")
def weekly_report():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT value, timestamp FROM glucose_logs ORDER BY timestamp DESC LIMIT 7")
    glucose_rows = c.fetchall()
    c.execute("SELECT sugar_risk, COUNT(*) FROM meal_logs GROUP BY sugar_risk")
    risk_rows = c.fetchall()
    conn.close()
    return {
        "recent_glucose": [{"value": r[0], "timestamp": r[1]} for r in glucose_rows],
        "meal_risk_distribution": {r[0]: r[1] for r in risk_rows},
        "message": "Based on PROMPT guidelines. Consult your doctor for clinical decisions."
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "model": MODEL, "timestamp": datetime.now().isoformat()}

# ==================== STARTUP ====================
if __name__ == "__main__":
    import uvicorn
    print("🚀 SehatGemma Backend Starting...")
    print("📡 URL: http://0.0.0.0:8000")
    print("🤖 Ollama: http://localhost:11434")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)