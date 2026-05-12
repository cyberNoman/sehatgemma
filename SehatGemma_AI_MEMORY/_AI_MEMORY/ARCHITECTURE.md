# 🏗️ ARCHITECTURE
> SehatGemma — Technical Architecture Reference

---

## SYSTEM OVERVIEW

```
┌─────────────────────────────────────────┐
│         REACT NATIVE APP (Expo)         │
│         E:\sehatgemma\app\App.js        │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │  Camera  │  │ Gallery  │  │ Voice │ │
│  │  Screen  │  │  Picker  │  │ Text  │ │
│  └────┬─────┘  └────┬─────┘  └───┬───┘ │
│       └─────────────┴────────────┘     │
│                    │                   │
│              FormData POST             │
│         /analyze endpoint              │
└─────────────────────────────────────────┘
                    │
              WiFi HTTP
              port 8000
                    │
┌─────────────────────────────────────────┐
│      FASTAPI BACKEND (Python)           │
│   E:\sehatgemma\backend\main.py         │
│   Running: 0.0.0.0:8000                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     GEMMA 4 AGENT CORE          │   │
│  │  POST http://localhost:11434    │   │
│  │         /api/generate           │   │
│  │  model: gemma4:e4b              │   │
│  │  think: False (speed!)          │   │
│  │  temperature: 0.1               │   │
│  └────────────┬────────────────────┘   │
│               │                        │
│         agent_action                   │
│               │                        │
│  ┌────────────▼────────────────────┐   │
│  │     TOOL EXECUTION ENGINE       │   │
│  │  analyze_meal → JSON response   │   │
│  │  log_glucose  → SQLite INSERT   │   │
│  │  emergency    → alert JSON      │   │
│  │  meal_plan    → PROMPT plan     │   │
│  └────────────┬────────────────────┘   │
│               │                        │
│  ┌────────────▼────────────────────┐   │
│  │     SQLITE DATABASE             │   │
│  │  sehatgemma.db                  │   │
│  │  - glucose_logs table           │   │
│  │  - meal_logs table              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    │
              localhost:11434
                    │
┌─────────────────────────────────────────┐
│         OLLAMA (Local LLM Server)       │
│         Model: gemma4:e4b               │
│         Size: 9.6GB on E drive          │
│         Location: E:\Eollama-models     │
└─────────────────────────────────────────┘
```

---

## KEY ENDPOINTS

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /health | Check backend is alive |
| POST | /analyze | Main agent endpoint (text + image) |
| GET | /glucose-history | Get last 50 glucose readings |
| GET | /meal-history | Get last 50 meal scans |
| GET | /weekly-report | Glucose trend + meal risk distribution |

---

## AGENT ROUTING LOGIC

```python
# Gemma 4 reads the input and decides:
"meri sugar 180 hai"     → agent_action: "log_glucose"    → SQLite logs 180
*photo of biryani*       → agent_action: "analyze_meal"   → Returns JSON
"chakkar aa raha hai"    → agent_action: "emergency_alert" → Returns hospital list
"diet plan chahiye"      → agent_action: "meal_plan"       → Returns PROMPT plan
```

---

## CRITICAL CONFIG VALUES

```python
# backend/main.py
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma4:e4b"
DB_PATH = "sehatgemma.db"

# In payload:
"think": False       # CRITICAL - removes 20s thinking delay
"temperature": 0.1   # Low = deterministic JSON
"num_predict": 500   # Limit output length
```

```javascript
// app/App.js
const BACKEND_URL = 'http://192.168.1.241:8000';  // LAPTOP IP:PORT
```

---

## STARTUP ORDER (ALWAYS FOLLOW THIS)

```
1. Start Ollama desktop app (tray icon)
2. cd E:\sehatgemma\backend
   .\venv\Scripts\activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
3. cd E:\sehatgemma\app
   npx expo start
4. Open Expo Go on phone → Scan QR
5. Test: curl http://localhost:8000/health
```

---

## WHAT MAKES THIS AGENTIC (NOT TRADITIONAL)

| Traditional App | SehatGemma Agent |
|---|---|
| User opens menu → taps "Log Glucose" | User says "meri sugar 180 hai" → auto-logged |
| User navigates to camera | Agent decides camera or text based on input |
| Static food database lookup | Gemma 4 reasons dynamically about any food |
| User must ask for advice | Agent proactively warns about risks |

---

## PRIVACY ARCHITECTURE

- **Zero cloud sync** — all data in SQLite on device
- **No telemetry** — nothing sent to external servers
- **Offline-first** — Gemma 4 runs locally via Ollama
- **AsyncStorage** — phone-side history, encrypted by OS
- **Burn option** — AsyncStorage.clear() wipes everything

---

## HACKATHON TECHNICAL JUSTIFICATION

```
Gemma 4 used: ✅ gemma4:e4b (4B parameter edge model)
Multimodal:   ✅ Vision (food photos) + Text (Urdu/English)
Tool calling: ✅ agent_action → tool execution
Offline:      ✅ Ollama local inference
Agentic:      ✅ Model decides action, backend executes
```
