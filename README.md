# 🩺 SehatGemma — Offline Multimodal Diabetic Food Analyzer for Pakistan

[![Gemma 4](https://img.shields.io/badge/Powered%20by-Gemma%204-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/gemma)
[![Ollama](https://img.shields.io/badge/Local%20AI-Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)

> **Gemma 4 Good Hackathon (May 2026) — Health & Sciences · Ollama Local Ops · LiteRT AI Edge · Cactus Mobile**

---

> ## 💔 Why I Built This
>
> In 2023, I was a Master's student in the UK when my father was diagnosed with a bone infection in his foot — a direct complication of uncontrolled diabetes. The doctors in London told us the infection could spread. We almost lost him.
>
> Every day from my student room, I was Googling: *"how many carbs in biryani," "is roti safe for diabetics," "daily sugar limit for Type 2."* I was manually tracking everything for him — food, glucose readings, what he could and couldn't eat.
>
> There was no app that understood Pakistani food. No tool that worked offline. Nothing in Urdu. Nothing built for someone like my father.
>
> So I built it. **SehatGemma** — so no family has to go through what mine did. So Pakistan's 33 million diabetics can point their phone at any food and instantly know if it's safe.
>
> — **Nouman Riaz**, MSc Cybersecurity · Builder · Son

---

## 🌍 The Problem

**Pakistan has 33 million diabetics — the 3rd highest in the world.** 70% are undiagnosed. In rural areas:
- 📡 **Internet is intermittent or non-existent**
- 💰 **Cloud AI APIs cost $0.01/query** (unaffordable at scale)
- 🔒 **Data privacy concerns** prevent photo uploads to foreign servers
- 🗣️ **Language barrier**: 60% prefer Urdu explanations
- 🍛 **Eid and Ramadan** see dangerous glucose spikes from traditional foods

**The gap:** No existing tool combines offline capability + multimodal food analysis + Urdu language + Pakistani food knowledge.

---

## ✅ The Solution

**SehatGemma** is a React Native mobile app that uses **Google Gemma 4** as its medical reasoning engine to analyze Pakistani food photos and text, returning diabetic risk assessments in Urdu — **completely offline via local edge deployment.**

### Key Features

| Feature | Description |
|---------|-------------|
| 📸 **Multimodal Vision** | Snap a photo → Gemma 4 identifies food + full diabetes analysis |
| 🎤 **Voice Input + TTS** | Speak food name → result read aloud in English or Urdu |
| 💬 **AI Chat** | Conversational Gemma 4 — ask anything about food, glucose, diet |
| 📋 **Menu Scanner** | Photo a restaurant menu → every item rated for diabetes risk |
| 📊 **Risk Scoring** | Low / Medium / High with carbs, GI, calories, confidence score |
| 🔄 **Safe Swaps** | Culturally appropriate Pakistani alternatives for every high-risk food |
| 🌐 **True Offline** | Three-tier architecture — works with zero internet |
| 📱 **$50 Phone Support** | 102-food SQLite database (200KB) for lowest-end Android phones |
| 📈 **Weekly Insights** | Bilingual analytics tracking meal risk patterns over time |
| 📡 **Live Status Dot** | Green = Gemma AI active · Orange = Offline DB mode |
| 📤 **WhatsApp Share** | One tap shares bilingual health card to family WhatsApp group |
| 🔒 **Privacy Shield** | Zero cloud sync · All data stays on device · Audit log |
| 🎓 **Tutorial Carousel** | First-launch onboarding — explains the app in 3 slides |

---

## 🏗️ Architecture

```
┌─────────────────┐     WiFi/Hotspot      ┌─────────────────────────┐
│  Patient Phone   │ ◄──────────────────► │   Edge Server           │
│  React Native    │    No Internet       │   Ollama (port 11434)   │
│  Expo APK        │    Needed            │   Gemma 4:e2b (7.2GB)  │
│                  │                      │   FastAPI (port 8001)   │
└────────┬─────────┘                      └─────────────────────────┘
         │
         ▼ (True Offline — No Server)
┌─────────────────┐
│   SQLite DB     │  102 Pakistani foods
│   offlineDB.js  │  200KB, instant, $50 phone
└─────────────────┘
```

### Three-Tier Offline Strategy

| Tier | Condition | Method | Speed | Hardware |
|------|-----------|--------|-------|----------|
| **Tier 1** | Phone alone, no server | SQLite database (102 foods) | <100ms | $50 phone |
| **Tier 2** | Phone + laptop WiFi | Ollama Gemma4:e2b (7.2GB) | 3-8 sec | Any laptop |
| **Tier 3** | Phone + Pi hotspot | Ollama Gemma4:2b (1.3B) | 3-5 sec | Raspberry Pi 4 ($75) — target deployment |

**Tier 1 always runs first.** If the food is in the offline database, the user gets an answer in <100ms. If unknown, Tier 2/3 is tried silently in the background.

---

## 🧠 How We Used Gemma 4

### Model Selection

| Model | Size | RAM | Verdict |
|-------|------|-----|---------|
| Gemma 4:e2b | 4.6B params | 7.2GB | ✅ Laptop / demo device |
| Gemma 4:2b | 1.3B params | 4GB | ✅ Raspberry Pi 4 target |
| Gemma 4:e4b | 9.6B params | ~12GB | ⚠️ Laptop with 16GB+ |

### Three Gemma 4 Capabilities We Leverage

1. **Multimodal Vision** — Food photos analyzed natively. Base64-encoded image + text prompt → structured JSON analysis. No separate vision model needed.

2. **128K Context Window** — Holds our entire 3,000-token system prompt with 40+ Pakistani food profiles, PROMPT clinical guidelines, provincial prevalence data, and complication risk factors.

3. **Structured JSON Output** — `temperature: 0.1` forces deterministic, medically reliable responses with exact carb counts, GI values, and bilingual explanations.

### Key Optimization: `think: False`
Disables Gemma 4's internal reasoning chain — drops response time from **25 seconds → 3-5 seconds** with no quality loss for structured food analysis tasks.

### Backend API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze` | POST | Food photo or text → full diabetes risk analysis |
| `/chat` | POST | Multi-turn conversational Gemma 4 (bilingual) |
| `/scan-menu` | POST | Restaurant menu photo → item-by-item risk rating |
| `/glucose-history` | GET | Retrieve saved glucose readings |
| `/weekly-report` | GET | Aggregated meal risk + glucose trend data |
| `/health` | GET | Backend status check |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.10+** with pip
- **Ollama** installed ([ollama.com](https://ollama.com))
- **Android phone** with the SehatGemma APK installed

### Setup

```bash
# 1. Pull the model
ollama pull gemma4:e2b

# 2. Start backend (Terminal 1)
cd sehatgemma/backend
pip install fastapi uvicorn httpx python-multipart
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 3. Start frontend dev server (Terminal 2)
cd sehatgemma/app
npm install
npx expo start --offline

# 4. Update your WiFi IP in app/App.js line 18:
#    'http://YOUR_LAPTOP_IP:8001'
#    Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
```

### Verify Everything Works

```bash
# Health check
curl http://localhost:8001/health
# → {"status":"ok","model":"gemma4:e2b","timestamp":"..."}

# Text analysis
curl -X POST http://localhost:8001/analyze \
  -F "text=biryani" -F "language=en"
# → {"food_name_en":"Biryani","sugar_risk":"high","carbs_g":80,"confidence":95,...}

# Chat
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"is roti better than naan?","language":"en"}'
# → {"response_en":"Yes, roti is much better...","response_ur":"..."}
```

---

## 📱 App Screens (12 Total)

| Screen | Purpose |
|--------|---------|
| **Tutorial** | First-launch 3-slide onboarding carousel |
| **Disclaimer** | Medical disclaimer (required) |
| **Home** | Main hub — camera, gallery, voice, menu scan, emergency |
| **Loading** | Animated "Gemma is thinking..." with pulsing AI brain |
| **Result** | Full analysis — risk badge, explanation (EN+UR), safe swap, TTS button |
| **Voice Input** | Type or speak food name — chips for common queries — auto-analyzes |
| **Chat** | Conversational Gemma 4 — multi-turn, bilingual, emergency detection |
| **Menu Scanner** | Camera → restaurant menu → all items rated with risk colors |
| **Glucose Log** | Manual glucose entry + history chart |
| **History** | All past food analyses with timestamps |
| **How It Helps** | Educational screen — 8 benefits explained |
| **Privacy Shield** | Data transparency — what's stored, where, audit log |
| **Emergency** | One-tap emergency contact + nearest hospitals (Aga Khan, Jinnah, DHQ) |

---

## 📊 Offline Database — 102 Pakistani Foods

| Category | Count | Examples |
|----------|-------|---------|
| **Meat** | 15 | Karahi, Qorma, Tikka Boti, Seekh Kebab, Tandoori Chicken |
| **Fruit** | 12 | Guava (GI 12), Apple, Pomegranate, Papaya, Banana |
| **Vegetables** | 12 | Bhindi, Baingan, Karela, Palak, Aloo Gobi, Shaljam |
| **Dessert** | 12 | Jalebi, Barfi, Gulab Jamun, Cake/Pastry, Ras Malai |
| **Herbs** | 9 | Cinnamon (reduces glucose 18-29%), Turmeric, Garlic |
| **Drinks** | 8 | Green Tea, Lemon Water, Rooh Afza (NEVER), Doodh Patti |
| **Snacks** | 8 | Chaat, Samosa, Pakora, Bun Kebab |
| **Lentils** | 7 | Chana Dal (GI 8), Lobia, Haleem, Moong Dal |
| **Rice** | 6 | Brown Rice, Biryani, Matar Pulao, Nihari |
| **Bread** | 5 | Roti/Chapati, Naan, Paratha, Makai Roti |
| **Breakfast** | 5 | Halwa Puri, Daliya, Oats, Eggs |
| **Dairy** | 3 | Dahi, Paneer, Raita |
| **TOTAL** | **102** | Every major Pakistani food covered |

Each food entry includes: risk level, glycemic index, bilingual explanation (EN + UR), safe swap, portion advice, carbs (grams), calorie estimate, and fuzzy search aliases.

---

## 🧪 Verified Working

| Test | Status |
|------|--------|
| `GET /health` | ✅ |
| `POST /analyze` text — biryani → HIGH, 80g carbs, 95% conf | ✅ |
| `POST /analyze` text — karela → LOW, 4g carbs, 95% conf | ✅ |
| `POST /analyze` image — food photo → real JSON (not fallback) | ✅ |
| `POST /chat` — conversational Gemma 4 response | ✅ |
| `POST /scan-menu` — menu photo → items list with risk | ✅ |
| Phone → Backend (WiFi LAN) — 200 OK from phone IP | ✅ |
| Offline DB — known food instant result | ✅ |
| TTS — results read aloud in English + Urdu | ✅ |
| Voice input — chips + keyboard mic (native STT in dev build) | ✅ |
| System share — bilingual health card to any app | ✅ |
| Language toggle — English ↔ Urdu all screens | ✅ |

---

## 🎯 Prize Track Alignment

| Track | How SehatGemma Qualifies |
|-------|--------------------------|
| **Main Track** | Working demo for 33M+ Pakistani diabetics · real clinical data · personal story behind the build |
| **Health & Sciences** | Follows Pakistan PROMPT national guidelines · bilingual Urdu/English medical output · diabetes complications data |
| **Ollama Local Ops** | 100% local inference via Ollama + Gemma 4 · zero cloud calls · keep_alive warmup · persistent httpx client |
| **LiteRT AI Edge** | Edge-first offline architecture · deployable on $75 Raspberry Pi 4 · 102-food SQLite fallback (200KB) |
| **Cactus Mobile** | React Native + Expo SDK 54 · APK built and tested on physical Android device |

---

## 📁 Project Structure

```
sehatgemma/
├── app/
│   ├── App.js              # Full app — 12 screens, all components (~2200 lines)
│   ├── offlineDatabase.js  # 102 Pakistani foods, 7-tier fuzzy search engine
│   ├── app.json            # Expo config — permissions, usesCleartextTraffic
│   ├── eas.json            # EAS build profiles (preview APK)
│   └── package.json        # Dependencies incl. expo-speech, expo-speech-recognition
├── backend/
│   ├── main.py             # FastAPI — /analyze /chat /scan-menu /health (~550 lines)
│   └── requirements.txt    # Python dependencies
└── README.md
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native + Expo SDK 54 |
| **AI Engine** | Ollama + Gemma 4 (gemma4:e2b) |
| **Backend** | FastAPI + Uvicorn + httpx (async, persistent client) |
| **Offline DB** | JavaScript fuzzy search — 102 foods, 200KB |
| **TTS** | expo-speech — reads results in English + Urdu |
| **Voice Input** | expo-speech-recognition — native STT |
| **Storage** | AsyncStorage (local, zero cloud) |
| **Languages** | English + Urdu — every label, explanation, UI element |

---

## ⚠️ Setup Notes

1. **WiFi IP** — Update `BACKEND_URL` in `app/App.js` line 18 to your laptop's local WiFi IP. Find it with `ipconfig` on Windows.

2. **Windows Firewall** — Allow port 8001 inbound:
   ```powershell
   New-NetFirewallRule -DisplayName "SehatGemma" -Direction Inbound -Protocol TCP -LocalPort 8001 -Action Allow
   ```

3. **Same network** — Phone and laptop must be on the same WiFi for backend connection.

4. **Offline mode** — If no backend, app uses 102-food local database automatically.

---

## 🤝 Builder

**Nouman Riaz** — MSc Cybersecurity · Founder, AGENATION.IO · Pakistan  
Solo build. Father has Type 2 diabetes. This project is personal.

---

## 📜 License

MIT — Free for clinics, hospitals, NGOs, and personal use.

---

## 🙏 Acknowledgments

- **Google Gemma 4** — Open-weight multimodal LLM that makes this possible
- **Ollama** — Zero-config local LLM deployment
- **Pakistan PROMPT Guidelines** — National clinical standards for diabetes care
- **IDF/WHO 2024-2025** — Epidemiology data behind our impact metrics

---

*Built with ❤️ for Pakistan. Because 33 million diabetics deserve to know what they're eating — with or without internet.*
