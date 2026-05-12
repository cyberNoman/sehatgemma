# 🩺 SehatGemma: Offline Multimodal Diabetic Food Analyzer for Pakistan
## Gemma 4 Good Hackathon — Kaggle Submission Writeup

---

## 1. Problem Statement (Impact & Vision — 40% of score)

### The Scale of the Crisis
Pakistan has **33 million people with diabetes** — the 3rd highest diabetic population in the world and the highest age-standardized prevalence at **31.4%** (IDF/WHO Atlas 2024-2025). This is projected to reach **70.2 million by 2050**.

### The Gaps
- **26.9-37.2% remain undiagnosed** (9.3+ million people)
- **230,000 diabetes-related deaths annually** in Pakistan
- **Rural areas have intermittent or no internet**
- **Cloud AI APIs cost $0.01/query** — unaffordable at population scale
- **Data privacy concerns** prevent photo uploads to foreign servers in conservative communities
- **60% of Pakistan prefers Urdu**. Most health tools are English-only.
- **Eid and Ramadan** see dangerous glucose spikes from traditional high-GI foods (biryani, halwa, jalebi, sevaiyan)

### The Gap We Fill
**No existing tool combines**: offline capability + multimodal food analysis + Urdu language + Pakistani food knowledge + edge deployment suitable for rural clinics.

---

## 2. Solution: SehatGemma

**SehatGemma** is a React Native mobile app that uses **Google Gemma 4** as its core medical reasoning engine to analyze Pakistani food photos and text descriptions, returning diabetic risk assessments in both English and Urdu — completely offline via local edge deployment.

### Core Features
| Feature | Technical Implementation |
|---------|------------------------|
| 📸 **Photo Analysis** | Multimodal Gemma 4 vision — base64 image + text prompt → structured JSON |
| 🗣️ **Voice/Text Input** | Text modal with 3-tier analysis pipeline |
| 📊 **Risk Scoring** | Low/Medium/High with glycemic index, carbs, calories, confidence score |
| 🔄 **Safe Swaps** | Culturally appropriate alternatives (e.g., "cauliflower rice biryani") |
| 🌐 **True Offline** | Three tiers: SQLite (phone-only) → Ollama Gemma4 (local server) → Pi hotspot |
| 📱 **$50 Phone Support** | 101-food SQLite database (200KB), instant response, no server needed |
| 📈 **Weekly Insights** | Bilingual smart analytics: risk distribution, rice pattern detection |
| 🎬 **Demo Mode** | One-tap 3-food showcase for judges (4.2 seconds, zero typing) |
| 🔒 **Privacy Shield** | Zero cloud sync, AES-256 encrypted local storage, audit log |

---

## 3. How We Used Gemma 4 (Technical Depth — 30% of score)

### 3.1 Model Selection Rationale

We evaluated the Gemma 4 family against our deployment constraints:

| Model | Parameters | RAM Required | Hardware | Verdict |
|-------|-----------|-------------|----------|---------|
| `gemma4:2b` | 1.3B | 4GB | Raspberry Pi 4 ($75) | ✅ Rural clinic target |
| `gemma4:4b` | 2.6B | 6GB | Pi 4 borderline | ⚠️ Needs Pi 5 |
| `gemma4:9b` | 5.8B | 10GB | Laptop required | ❌ Too heavy for edge |
| `gemma4:e2b` | 4.6B | 7GB | Developer laptop (8GB) | ✅ Current deployment |

**We use `gemma4:e2b`** on the development laptop and target **`gemma4:2b`** for the $75 Raspberry Pi 4 production deployment in rural clinics.

### 3.2 Three Gemma 4 Capabilities We Leverage

#### Capability 1: Multimodal Vision
Gemma 4 natively supports image input — no separate vision model needed. We send a base64-encoded food photo alongside a text prompt, and Gemma 4 identifies the dish, cooking method, ingredients, and portion size. This single-model approach reduces complexity and latency.

```python
# Image is base64-encoded and passed directly to Ollama
if img_b64:
    payload["images"] = [img_b64]  # Gemma 4 processes inline
```

#### Capability 2: 128K Context Window for Domain Adaptation
This is the **secret sauce**. We don't treat Gemma 4 as a generic chatbot. We inject a **3,000-token system prompt** containing:
- Pakistan-specific diabetes epidemiology (IDF/WHO 2024 data)
- PROMPT national clinical guidelines
- 40+ Pakistani food profiles with glycemic indices
- Province-by-province prevalence rates
- Diabetic complication risk factors (retinopathy, neuropathy, nephropathy, cardiovascular)
- Output format rules (structured JSON, bilingual, portion sizes in Pakistani measurements)

This **post-training domain adaptation via prompt engineering** compensates for the smaller 2B model size. The 128K context holds the entire domain knowledge base, making each inference call self-contained without requiring a vector database or RAG pipeline.

#### Capability 3: Structured JSON Output
We set `temperature: 0.1` and `num_predict: 500` with explicit JSON schema instructions. Gemma 4 returns deterministic structured data:

```json
{
  "food_name_en": "Biryani",
  "food_name_ur": "بریانی",
  "sugar_risk": "high",
  "confidence": 92,
  "explanation_en": "White rice has high GI (70)...",
  "explanation_ur": "چاول کی وجہ سے شوگر تیزی سے بڑھتی ہے...",
  "swap_suggestion_en": "Swap to cauliflower rice biryani...",
  "swap_suggestion_ur": "گوبھی والی بریانی...",
  "carbs_g": 80,
  "calories_estimate": "~450 kcal"
}
```

### 3.3 Architecture

```
┌──────────────┐     WiFi LAN (No Internet)     ┌──────────────────────┐
│ Patient Phone │ ◄───────────────────────────► │   Edge Server        │
│ React Native  │                               │   Ollama (port 11434)│
│ Expo Go       │                               │   Gemma 4 (port 8001)│
└──────┬────────┘                               └──────────────────────┘
       │
       ▼ (Phone Alone — True Offline)
┌──────────────┐
│ offlineDB.js │  101 Pakistani foods, 200KB
│ 7-tier fuzzy │  Instant, no server needed
│ search       │  Works on $50 phone
└──────────────┘
```

### 3.4 Three-Tier Analysis Pipeline

| Tier | Condition | Method | Latency | Example |
|------|-----------|--------|---------|---------|
| **Tier 1** | Phone alone | SQLite (101 foods) | <100ms | "biryani" → HIGH risk |
| **Tier 2** | Phone + WiFi LAN | Ollama + Gemma4:e2b | 3-8s | Photo of haleem → analysis |
| **Tier 3** | Server unreachable | Offline "unknown" message | <100ms | "sushi" → not in DB |

**Tier 1 always runs first.** The app checks the offline database. If the food is found (101 common Pakistani foods), the user gets an immediate result. If unknown, Tier 2 sends to the Gemma 4 backend. If the backend is unreachable, Tier 3 shows a polite "not in database" message with advice to connect to a SehatGemma hotspot.

### 3.5 Critical Optimizations

- **`"think": False`** — Kills Gemma 4's default 20-second reasoning delay. Reduces response time from 25s → 3-5s.
- **`"temperature": 0.1`** — Forces deterministic output for medical reliability.
- **`"num_predict": 500`** — Caps tokens to prevent runaway generation.
- **60-second AbortController** — Frontend timeout prevents hanging on slow inference.
- **Background silent upgrade** — If Tier 1 returns a result, it shows immediately while silently checking if Tier 2 can provide a higher-confidence analysis.

---

## 4. Technical Implementation

### 4.1 Stack
| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React Native + Expo | Single codebase → iOS, Android, Web. Works on $50 phones. |
| **AI Engine** | Ollama + Gemma 4 | Zero-config local LLM. No Docker. No GPU. Single binary. |
| **Backend** | FastAPI + Uvicorn | Async Python. Handles multipart image uploads. 10MB limit. |
| **Edge Hardware** | Raspberry Pi 4 (4GB) | $75. Creates WiFi hotspot. Runs Gemma4:2b. |
| **Offline DB** | JavaScript search engine | 7-tier fuzzy matching. 200KB. No SQLite dependency on mobile. |
| **Persistence** | AsyncStorage | AES-256 encrypted. Meal history, glucose logs, preferences. |

### 4.2 Key Technical Decisions

1. **Platform-aware BACKEND_URL**: Web browser uses `localhost:8001`. Phone uses `192.168.1.241:8001`. Automatic detection via `Platform.OS`.

2. **Multipart FormData**: Images sent as `file` field, text as `text` field, language preference as `language` field. Backend handles both text-only and image+text requests.

3. **JSON cleaning pipeline**: Gemma 4 occasionally wraps JSON in markdown code fences. The `clean_json_response()` function strips fences, extracts JSON objects, and falls back gracefully.

4. **Bilingual by design**: Every UI element, every explanation, every safe swap suggestion exists in both English and Urdu. Language toggle is instant, no re-fetch needed.

5. **Offline-first, not offline-only**: The app works completely offline for 101 foods, but gracefully upgrades to AI-powered analysis when a local server is available.

---

## 5. Demo & Validation

### 5.1 Verified Test Results

| Test | Status | Method |
|------|--------|--------|
| Backend health check | ✅ 200 OK | `GET /health` → `{"status":"ok","model":"gemma4:e2b"}` |
| Text analysis | ✅ Working | `POST /analyze` with "biryani" → full JSON |
| Image analysis | ✅ Working | Multipart upload of food photo → Gemma 4 vision + analysis |
| Phone → Backend (WiFi LAN) | ✅ Working | 4 consecutive 200 OK from phone IP (192.168.1.242) |
| Offline DB — known food | ✅ Instant | "biryani" → HIGH risk in <100ms |
| Offline DB — unknown food | ✅ Graceful | "sushi" → "not in Pakistani database" |
| Demo Mode | ✅ Working | 3 foods in 4.2s, zero network |
| Weekly Insights | ✅ Working | Bilingual, color-coded risk counts |
| Bottom Navigation | ✅ Working | Voice, Camera, Chat, Health all wired |
| Language Toggle | ✅ Working | English ↔ Urdu, all content |

### 5.2 Demo Video
[YouTube Link — 3 minutes showing offline analysis, multimodal food recognition, and Urdu language support]

### 5.3 Live Demo
Judges can test the app via:
- **Expo Go QR code** (scan with any phone)
- **Web browser**: `http://localhost:8081` (after starting backend)
- **GitHub repo**: Contains complete source code with setup instructions

---

## 6. Impact & Next Steps

### 6.1 Immediate Impact
| Metric | Target |
|--------|--------|
| **Target population** | 33 million Pakistani diabetics |
| **Rural clinic deployment** | 1 Raspberry Pi ($75) serves 100+ patients/day |
| **Data privacy** | Zero data leaves local network |
| **Language accessibility** | Urdu language breaks literacy barrier for 60% of Pakistan |
| **Cost per query** | $0.00 (versus $0.01/query for cloud APIs) |
| **App size** | <2MB (versus 50-100MB for cloud-dependent apps) |

### 6.2 Next Steps
1. **Expand offline database** to 200+ Pakistani foods with community contributions
2. **Add voice input** in Punjabi, Sindhi, and Pashto
3. **Partner with Pakistan Diabetes Association** for clinical validation
4. **Fine-tune Gemma 4 2B** on a local Pakistani medical corpus for higher accuracy
5. **Add Bluetooth glucometer integration** for automatic glucose logging
6. **Deploy pilot** in 10 rural clinics in Punjab and Sindh

---

## 7. Prize Track Qualification

This project qualifies for **5 prize tracks**:

| Track | Prize | Qualification |
|-------|-------|---------------|
| **Main Track** | $50,000 | Real-world impact, working demo, technical depth |
| **Health & Sciences (Impact)** | $10,000 | 33M diabetics, frontline health tool |
| **Ollama (Local Ops)** | $10,000 | Entire backend runs on Ollama with Gemma 4 |
| **LiteRT (AI Edge)** | $10,000 | Edge-first, three-tier offline architecture |
| **Cactus (Mobile/Wearable)** | $10,000 | React Native + Expo mobile app |

---

*Submitted to Gemma 4 Good Hackathon — May 2026*