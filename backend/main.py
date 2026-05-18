from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import List
import httpx
import base64
import json
import re
import sqlite3
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor

# ==================== CONFIG ====================
OLLAMA_URL  = "http://localhost:11434/api/generate"
MODEL       = "gemma4:e2b"          # switch to gemma4:e4b if pulled
DB_PATH     = "sehatgemma.db"
HOST        = "192.168.10.11"       # WiFi LAN IP — update if network changes
PORT        = 8001
MAX_IMG_MB  = 5                     # reject images larger than 5 MB

# Thread pool for synchronous SQLite calls (keeps async event loop free)
_db_pool = ThreadPoolExecutor(max_workers=4)

# One persistent httpx client for the whole server lifetime
_http: httpx.AsyncClient = None


# ==================== LIFESPAN (startup / shutdown) ====================
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _http
    # ── STARTUP ──────────────────────────────────────────────────
    init_db()
    _http = httpx.AsyncClient(
        timeout=httpx.Timeout(120.0),
        limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
    )
    # Warm Gemma into RAM before the first patient request
    print(f"[WARMUP] Loading {MODEL} ...")
    try:
        await _http.post(OLLAMA_URL, json={
            "model": MODEL, "prompt": "ready", "stream": False,
            "keep_alive": "15m", "options": {"num_predict": 1}
        }, timeout=60.0)
        print(f"[WARMUP] {MODEL} loaded and hot in memory")
    except Exception as e:
        print(f"[WARN] Model pre-load failed ({e}). First request may be slow.")

    print(f"[READY] SehatGemma backend ready")
    print(f"[READY] Listening on  http://0.0.0.0:{PORT}")
    print(f"[READY] Phone connects to  http://{HOST}:{PORT}")
    print(f"[CONFIG] Ollama at  http://localhost:11434")

    yield

    # ── SHUTDOWN ─────────────────────────────────────────────────
    await _http.aclose()
    _db_pool.shutdown(wait=False)


# ==================== APP ====================
app = FastAPI(title="SehatGemma API", version="2.0", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=500)   # compress JSON responses
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== DATABASE ====================
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS glucose_logs (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        value     INTEGER,
        timestamp TEXT,
        notes     TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS meal_logs (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        food_name_en TEXT,
        food_name_ur TEXT,
        sugar_risk   TEXT,
        confidence   INTEGER,
        timestamp    TEXT,
        carbs_g      INTEGER
    )""")
    conn.commit()
    conn.close()


async def db_run(query: str, params: tuple = (), fetch: str = None):
    """Execute SQLite in a thread pool — never blocks the async loop."""
    def _sync():
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute(query, params)
        result = None
        if fetch == "all":
            result = [dict(r) for r in c.fetchall()]
        elif fetch == "one":
            row = c.fetchone()
            result = dict(row) if row else None
        conn.commit()
        conn.close()
        return result
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_db_pool, _sync)


# ==================== HELPERS ====================
def clean_json(text: str) -> dict | None:
    """Strip markdown fences and extract the first valid JSON object."""
    text = text.strip()
    # Remove ```json ... ``` wrappers
    if "```" in text:
        m = re.findall(r"```(?:json)?\s*([\s\S]*?)```", text)
        if m:
            text = m[-1].strip()
    # Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Fallback: find outermost { }
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    return None


async def ollama(payload: dict, timeout: float = 45.0) -> str:
    """Single Ollama call with shared HTTP client. Raises on network error."""
    resp = await _http.post(OLLAMA_URL, json=payload, timeout=timeout)
    resp.raise_for_status()
    return resp.json().get("response", "")


def _base_payload(system: str, prompt: str, num_predict: int = 250) -> dict:
    return {
        "model": MODEL,
        "system": system,
        "prompt": prompt,
        "stream": False,
        "think": False,          # disables 20-second reasoning delay
        "keep_alive": "15m",     # keeps model hot in VRAM between requests
        "options": {
            "temperature": 0.1,
            "num_predict": num_predict,
            "repeat_penalty": 1.1,
        },
    }


# ==================== AGENT TOOLS ====================
async def tool_log_glucose(value: int, notes: str = "") -> dict:
    await db_run(
        "INSERT INTO glucose_logs (value, timestamp, notes) VALUES (?, ?, ?)",
        (value, datetime.now().isoformat(), notes)
    )
    return {"status": "logged", "value": value,
            "message": f"Glucose {value} mg/dL recorded."}


def tool_emergency_alert() -> dict:
    return {
        "status": "emergency",
        "message_en": "EMERGENCY: Contact your doctor immediately. If severe, go to Aga Khan, Jinnah, or local DHQ hospital.",
        "message_ur": "ایمرجنسی: فوری ڈاکٹر سے رابطہ کریں۔ شدید ہو تو قریبی ہسپتال جائیں۔",
        "actions": [
            "Call emergency contact",
            "Check last glucose reading",
            "Stay seated — do not stand",
            "Chest pain / breathlessness → call 1122"
        ],
        "nearest_facilities": ["Aga Khan Hospital", "Jinnah Hospital", "Local DHQ / THQ"]
    }


def tool_meal_plan() -> dict:
    return {
        "status": "meal_plan",
        "breakfast": "2 boiled eggs + 1 roti (15g carbs) + cucumber",
        "lunch":     "1 cup moong dal (27g carbs) + 1 roti + salad",
        "dinner":    "Grilled chicken + 1 roti + karela sabzi",
        "snacks":    "Small apple (15g carbs) or unsalted nuts",
        "total_carbs": "~85-100g / day",
        "note": "Based on PROMPT guidelines for T2DM without complications"
    }


# ==================== SYSTEM PROMPTS ====================
SYSTEM_PROMPT = """You are SehatGemma, an AI nutrition and diabetes assistant for Pakistan.
Follow PROMPT national clinical guidelines. Advice must be culturally appropriate.

PROMPT targets: No complications Fasting 80-120 mg/dL, HbA1c 6.5-7.0%.

RULES:
- Simple language for low health literacy
- Always give carb count and portion size
- Suggest Pakistani culturally appropriate swaps
- For high-risk: briefly mention retinopathy/nephropathy risk

STRICT JSON OUTPUT — no markdown, no text outside JSON:
{
  "food_name_en": "string",
  "food_name_ur": "string",
  "sugar_risk": "low|medium|high",
  "explanation_en": "string",
  "explanation_ur": "string",
  "swap_suggestion_en": "string",
  "swap_suggestion_ur": "string",
  "confidence": 0-100,
  "carbs_g": number,
  "calories_estimate": "string",
  "key_ingredients": ["string"],
  "agent_action": "analyze_meal"
}"""

FOOD_DATA_CONTEXT = """VERIFIED FOOD DATA (per typical portion):
Naan: 66g carbs GI75 HIGH | Roti: 18g carbs GI62 MEDIUM | Biryani: 80g carbs GI70 HIGH
Haleem: 65g carbs GI65 HIGH | Nihari: 30g carbs GI15 MEDIUM | Dal Chawal: 70g carbs GI68 HIGH
Moong Dal: 27g carbs GI30 LOW | Saag+Makai Roti: 30g carbs GI45 LOW | Aloo Paratha: 45g carbs GI80 HIGH
Samosa: 20g carbs GI75 HIGH | Gulab Jamun: 25g sugar GI95 HIGH | Sweet Lassi: 30g sugar GI60 HIGH
Salted Lassi: 8g carbs LOW | Rooh Afza: 40g sugar GI90 HIGH | Zarda: 80g sugar GI88 HIGH
Seekh Kebab: 5g carbs GI10 LOW | Tandoori Chicken: 2g carbs GI5 LOW | Raita: 5g carbs GI15 LOW
Dates(2): 15g sugar GI42 MEDIUM | Karela: 4g carbs GI14 LOW | Methi: 5g carbs LOW
Chai+sugar: 10g sugar HIGH | Doodh patti no sugar: 5g carbs LOW | Oats: 27g carbs GI55 MEDIUM
Eggs(2): 1g carbs GI0 LOW | Chana Chaat: 27g carbs GI35 LOW | Cake: 52g carbs GI82 HIGH

Complications: Retinopathy 32.9% | Nephropathy 14-31.4% | Neuropathy 10.8-59.6%"""


CHAT_SYSTEM_PROMPT = """You are SehatGemma, a friendly diabetes health assistant for Pakistan.
Pakistan: 31.4% prevalence, 33 million diabetics, projected 70 million by 2050.
Follow PROMPT national clinical guidelines.

PROMPT targets:
- No complications: Fasting 80-120 mg/dL, HbA1c 6.5-7.0%
- With CKD/CCF: Fasting 80-160 mg/dL, HbA1c 7.0-7.5%
- Elderly: HbA1c <8.0%

Food knowledge (verified, per typical portion):
- Biryani: 80g carbs, GI 70, HIGH — white rice spikes in 30-45 min
- Haleem: 65g carbs, GI 65, HIGH — wheat-heavy restaurant version
- Nihari: 30g carbs (maida thickener), MEDIUM — skip the naan
- Naan: 66g carbs, HIGH — worse than roti, avoid
- Roti (1 medium): 18g carbs, MEDIUM — preferred, use multigrain
- Moong Dal: 27g carbs, LOW — excellent fiber, stable glucose
- Karela: 4g carbs, LOW — lowers blood sugar clinically
- Lassi sweet: 30g sugar, HIGH — liquid sugar, very fast absorption
- Gulab Jamun (1 pc): 25g sugar, HIGH — 15-min spike
- Cake/Pastry: 52g carbs, HIGH — 30g sugar per slice
- Tandoori Chicken: 2g carbs, LOW — perfect meal
- Seekh Kebab: 5g carbs, LOW — excellent protein
- Saag + Makai Roti: 30g carbs, LOW — best diabetic meal in Pakistan

Rules:
- NEVER return JSON — converse naturally like a helpful doctor
- Max 3-4 sentences — mobile screen is small
- Always mention carb count or GI when discussing food
- Urdu requests: mix Roman Urdu with Arabic script naturally
- Glucose number mentioned → acknowledge + advise vs PROMPT target
- Emergency symptoms (chakkar, dizzy, chest pain, behosh, blurred) → advise call 1122 immediately
- Suggest Pakistani culturally appropriate food swaps"""


MENU_SCAN_PROMPT = """You are SehatGemma analyzing a RESTAURANT MENU for a diabetic Pakistani patient.
Read every food item visible in the menu photo. Rate each for Type 2 diabetes risk.

CRITICAL: Return ONLY valid JSON. Absolutely no text outside the JSON object.

{
  "items": [
    {
      "name_en": "Biryani",
      "name_ur": "بریانی",
      "risk": "high",
      "carbs_g": 80,
      "note_en": "White rice spikes glucose in 30-45 min",
      "note_ur": "چاول شوگر تیزی سے بڑھاتے ہیں"
    }
  ],
  "best_choice_en": "Order: Seekh Kebab + Raita + Salad — low carb, safe",
  "best_choice_ur": "آرڈر کریں: سیکھ کباب + رائتہ + سلاد",
  "avoid_en": "Avoid: Biryani, Naan, sweetened drinks — all spike glucose fast",
  "avoid_ur": "پرہیز: بریانی، نان، میٹھے مشروبات"
}

Rules:
- risk must be exactly "high", "medium", or "low"
- List EVERY item visible — not just Pakistani foods
- Unclear menu photo → items: [], explain in best_choice_en
- note_en and note_ur: one short sentence each"""


# ==================== /analyze ====================
@app.post("/analyze")
async def analyze(
    file:          UploadFile = File(None),
    text:          str        = Form(""),
    language:      str        = Form("en"),
    glucose_level: str        = Form(None),
):
    # Encode image if provided
    img_b64 = None
    if file:
        raw_bytes = await file.read()
        if len(raw_bytes) > MAX_IMG_MB * 1024 * 1024:
            return _error_result("Image too large. Please use a smaller photo.")
        img_b64 = base64.b64encode(raw_bytes).decode()

    # Build prompt
    parts = [f"Language: {language}."]
    if glucose_level:
        parts.append(f"Patient last glucose: {glucose_level} mg/dL.")
    if img_b64:
        parts.append("Look at this food image carefully. Identify the Pakistani food item and analyze its diabetes risk.")
        if text:
            parts.append(f"User also said: {text}.")
    elif text:
        parts.append(f"Analyze this food for diabetes risk: {text}.")
        parts.append(FOOD_DATA_CONTEXT)
    else:
        parts.append("Analyze the food in this image for diabetes risk.")
    parts.append("Reply with STRICT JSON only. No text outside the JSON object.")
    user_prompt = "\n".join(parts)

    payload = _base_payload(SYSTEM_PROMPT, user_prompt, num_predict=700 if img_b64 else 600)
    if img_b64:
        payload["images"] = [img_b64]

    try:
        raw = await ollama(payload, timeout=45.0)
    except Exception as e:
        return _error_result(f"Ollama unreachable: {e}")

    result = clean_json(raw)
    if not result:
        result = _fallback_result()

    # Run agent tools
    action = result.get("agent_action", "analyze_meal")
    if action == "log_glucose":
        nums = re.findall(r'\d+', text)
        if nums:
            result["tool_result"] = await tool_log_glucose(int(nums[0]), text)
    elif action == "emergency_alert":
        result["tool_result"] = tool_emergency_alert()
    elif action == "meal_plan":
        result["tool_result"] = tool_meal_plan()

    # Persist to DB (non-blocking)
    food = result.get("food_name_en", "")
    if food and food not in ("Unknown", "Connection Failed"):
        await db_run(
            """INSERT INTO meal_logs
               (food_name_en, food_name_ur, sugar_risk, confidence, timestamp, carbs_g)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (food, result.get("food_name_ur"), result.get("sugar_risk"),
             result.get("confidence"), datetime.now().isoformat(), result.get("carbs_g", 0))
        )

    return result


# ==================== /chat ====================
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    language: str = "en"
    context: str = ""

@app.post("/chat")
async def chat(req: ChatRequest):
    # Build multi-turn prompt (last 6 messages for context)
    history_text = "".join(
        f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}\n"
        for m in req.history[-6:]
    )
    parts = [f"Language: {req.language}."]
    if req.context:
        parts.append(f"Patient context: {req.context}.")
    if history_text:
        parts.append(f"\nConversation:\n{history_text}")
    parts.append(f"\nUser: {req.message}\nAssistant:")
    prompt = " ".join(parts)

    payload = _base_payload(CHAT_SYSTEM_PROMPT, prompt, num_predict=220)
    payload["options"]["temperature"] = 0.35

    try:
        raw = await ollama(payload, timeout=30.0)
    except Exception:
        return {
            "response_en": "Backend offline. Ask me about biryani, roti, haleem — 101 foods available offline.",
            "response_ur": "بیک اینڈ بند ہے۔ بریانی، روٹی، حلیم — آف لائن جواب دوں گا۔",
            "tool_result": None
        }

    # Agent tool detection
    tool_result = None
    msg_lower = req.message.lower()
    emergency_kw = ["chakkar", "dizzy", "chest pain", "bekhudi", "blurred vision",
                    "foot wound", "unconscious", "behosh"]
    glucose_kw   = ["sugar", "glucose", "fasting", "mg", "reading", "level"]

    if any(k in msg_lower for k in emergency_kw):
        tool_result = tool_emergency_alert()
    else:
        nums = re.findall(r'\b(\d{2,3})\b', req.message)
        if nums and any(k in msg_lower for k in glucose_kw):
            tool_result = await tool_log_glucose(int(nums[0]), req.message)

    return {"response_en": raw.strip(), "response_ur": raw.strip(), "tool_result": tool_result}


# ==================== /scan-menu ====================
@app.post("/scan-menu")
async def scan_menu(
    file:     UploadFile = File(None),
    language: str        = Form("en"),
):
    if not file:
        return _menu_error("No image provided", "تصویر نہیں ملی")

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_IMG_MB * 1024 * 1024:
        return _menu_error("Image too large. Use a closer crop.", "تصویر بہت بڑی ہے۔")

    img_b64 = base64.b64encode(raw_bytes).decode()
    payload = _base_payload(MENU_SCAN_PROMPT,
                            f"Language: {language}. Read every item on this menu. Rate each for diabetes risk.",
                            num_predict=900)
    payload["images"] = [img_b64]

    try:
        raw = await ollama(payload, timeout=90.0)
    except Exception:
        return _menu_error("Backend timeout. Try again.", "دوبارہ کوشش کریں۔")

    result = clean_json(raw)
    if not result or "items" not in result:
        return _menu_error("Could not read menu clearly. Take a brighter, closer photo.",
                           "مینو واضح نہیں۔ قریب سے روشن تصویر لیں۔")
    return result


# ==================== READ-ONLY ENDPOINTS ====================
@app.get("/glucose-history")
async def glucose_history():
    rows = await db_run(
        "SELECT id, value, timestamp, notes FROM glucose_logs ORDER BY timestamp DESC LIMIT 50",
        fetch="all"
    )
    return {"logs": rows or []}

@app.get("/meal-history")
async def meal_history():
    rows = await db_run(
        "SELECT * FROM meal_logs ORDER BY timestamp DESC LIMIT 50",
        fetch="all"
    )
    return {"logs": rows or []}

@app.get("/weekly-report")
async def weekly_report():
    glucose = await db_run(
        "SELECT value, timestamp FROM glucose_logs ORDER BY timestamp DESC LIMIT 7",
        fetch="all"
    )
    risk = await db_run(
        "SELECT sugar_risk, COUNT(*) as count FROM meal_logs GROUP BY sugar_risk",
        fetch="all"
    )
    return {
        "recent_glucose": glucose or [],
        "meal_risk_distribution": {r["sugar_risk"]: r["count"] for r in (risk or [])},
        "message": "Based on PROMPT guidelines. Consult your doctor for clinical decisions."
    }

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model": MODEL,
        "host": HOST,
        "port": PORT,
        "timestamp": datetime.now().isoformat()
    }


# ==================== FALLBACK HELPERS ====================
def _error_result(reason: str = "") -> dict:
    return {
        "food_name_en": "Analysis Failed",
        "food_name_ur": "تجزیہ ناکام",
        "sugar_risk": "unknown",
        "explanation_en": f"Could not analyze. {reason}",
        "explanation_ur": "تجزیہ نہیں ہو سکا۔ دوبارہ کوشش کریں۔",
        "swap_suggestion_en": "Check backend connection and retry.",
        "swap_suggestion_ur": "دوبارہ کوشش کریں۔",
        "confidence": 0, "carbs_g": 0, "calories_estimate": "N/A",
        "key_ingredients": [], "agent_action": "analyze_meal",
    }

def _fallback_result() -> dict:
    return {
        "food_name_en": "Unknown Food",
        "food_name_ur": "نامعلوم کھانا",
        "sugar_risk": "unknown",
        "explanation_en": "Could not identify food. Try a clearer photo or describe the food by name.",
        "explanation_ur": "کھانا پہچانا نہیں گیا۔ واضح تصویر لیں یا نام لکھیں۔",
        "swap_suggestion_en": "Try describing the food by name in the Voice tab.",
        "swap_suggestion_ur": "Voice ٹیب میں کھانے کا نام لکھیں۔",
        "confidence": 0, "carbs_g": 0, "calories_estimate": "N/A",
        "key_ingredients": [], "agent_action": "analyze_meal",
    }

def _menu_error(msg_en: str, msg_ur: str) -> dict:
    return {
        "items": [],
        "best_choice_en": msg_en,
        "best_choice_ur": msg_ur,
        "avoid_en": "",
        "avoid_ur": "",
    }


# ==================== ENTRY POINT ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True, workers=1)
