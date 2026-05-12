# 📋 KANBAN BOARD
> SehatGemma Hackathon Sprint — May 12-17, 2026

---

## 🔴 BACKLOG (P0 — Must Ship)

- [ ] **FIX:** App.js BACKEND_URL → `http://192.168.1.241:8000`
- [ ] App opens on phone (Expo Go scan)
- [ ] Food photo from gallery → risk result on screen
- [ ] Glucose logbook: type 180 → saves → shows in list
- [ ] Voice text: type "meri sugar 180 hai" → agent logs it
- [ ] Emergency screen: shows 1122, hospital, last reading
- [ ] Privacy screen: dark theme, 3 badges, burn button
- [ ] Medical disclaimer: appears on first launch only
- [ ] History screen: shows past food scans with photos

---

## 🟡 IN PROGRESS

- [ ] App.js connected to backend (port mismatch fix)
- [ ] Expo QR code running on `exp://192.168.1.241:8081`

---

## 🟢 DONE

- [x] Backend FastAPI running on port 8000
- [x] Gemma4:e4b responding in Ollama
- [x] Biryani → HIGH RISK → Urdu JSON confirmed
- [x] SQLite tables created (glucose_logs, meal_logs)
- [x] Research injected (PROMPT, Pakistani food DB)
- [x] 7-screen design from Google Stitch
- [x] App.js converted to React Native (all 7 screens)
- [x] Folder structure: app/ + backend/

---

## 📹 VIDEO PIPELINE (May 14)

- [ ] Prepare real Pakistani food (biryani, roti, chai)
- [ ] Put phone in AIRPLANE MODE for demo
- [ ] Film diabetic family member scene (0:00-0:30)
- [ ] Film food photo → HIGH RISK result (0:30-1:00)
- [ ] Film you speaking to camera with stats (1:00-1:45)
- [ ] Show terminal + Ollama offline proof (1:45-2:00)
- [ ] Film glucose voice logging (2:00-2:20)
- [ ] Film Privacy Sentinel screen (2:20-2:40)
- [ ] Closing shot — teaching neighbor (2:40-3:00)
- [ ] Edit in CapCut → export 1080p
- [ ] Upload to YouTube (unlisted first, then public)

---

## 📝 KAGGLE WRITEUP (May 15)

- [ ] Problem statement (use research stats)
- [ ] Solution description (agentic not traditional)
- [ ] How Gemma 4 is used (multimodal + tool routing)
- [ ] Architecture diagram
- [ ] Impact metrics
- [ ] Technical depth (think:False, quantization, offline)
- [ ] Prize track justification

---

## 🐙 GITHUB (May 15)

- [ ] Create repo: `sehatgemma-kaggle`
- [ ] Push backend/ folder
- [ ] Push app/ folder
- [ ] Write README.md (English + Urdu)
- [ ] Add screenshots
- [ ] Add APK download link
- [ ] Add YouTube video link

---

## 📱 APK BUILD (May 16)

```cmd
cd E:\sehatgemma\app
eas build --platform android --profile preview
```

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`
- [ ] Configure: `eas build:configure`
- [ ] Build APK
- [ ] Test APK on fresh phone

---

## 🏁 SUBMISSION (May 17)

- [ ] Kaggle writeup finalized
- [ ] GitHub repo public
- [ ] Video URL added
- [ ] APK link added
- [ ] Submit on Kaggle before 11:59 PM UTC
