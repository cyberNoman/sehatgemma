# 🚨 ALERTS & BLOCKERS
> Read before every session. Clear each item when resolved.

---

## 🔴 P0 BLOCKERS (Must fix before anything else)

### ALERT-001: App.js port mismatch
**Status:** OPEN
**Problem:** App.js has `port:5000` but backend runs on `port:8000`
**Fix:** In `E:\sehatgemma\app\App.js` line 16:
```javascript
const BACKEND_URL = 'http://192.168.1.241:8000';
```
**Owner:** Noman
**Blocks:** Everything frontend

---

### ALERT-002: App.js in wrong folder
**Status:** OPEN (may be resolved)
**Problem:** App.js was in `backend/` folder instead of `app/` folder
**Fix:** Ensure App.js exists at `E:\sehatgemma\app\App.js`
**Command to verify:**
```cmd
dir E:\sehatgemma\app\App.js
```
**Owner:** Noman

---

## 🟡 P1 WARNINGS (Fix today)

### WARN-001: Expo SDK version mismatch
**Status:** MONITORING
**Problem:** If Expo Go app is SDK 54 but project is SDK 51 → incompatible
**Fix:** 
```cmd
cd E:\sehatgemma\app
npx expo install --fix
```
**Owner:** Noman

### WARN-002: Ollama must be running before backend
**Status:** RECURRING
**Problem:** If Ollama desktop app is closed, backend crashes on first /analyze call
**Fix:** Always start Ollama FIRST, then uvicorn
**Prevention:** Add to startup routine

---

## 🟢 RESOLVED ALERTS

| ID | Problem | Fixed By | Date |
|----|---------|----------|------|
| ALERT-000 | gemma4:e4b hung for 1 hour | Used `think:False` in API | May 11 |
| ALERT-003 | gemma4:e2b gave "0.5" response | Switched to e4b | May 11 |
| ALERT-004 | PowerShell curl syntax wrong | Used curl.exe or browser /docs | May 11 |
| ALERT-005 | Ollama CLI conflicted with desktop app | Use desktop app only | May 11 |

---

## ⏰ DEADLINE ALERTS

| Date | Milestone | Status |
|------|-----------|--------|
| May 12 (TODAY) | App running on phone | ⚠️ In progress |
| May 13 | All screens functional | ⬜ Not started |
| May 14 | Video filmed and edited | ⬜ Not started |
| May 15 | Kaggle writeup submitted | ⬜ Not started |
| May 17 | FINAL SUBMISSION | ⬜ Not started |
| **May 18 11:59 PM UTC** | **HARD DEADLINE** | **⚠️ 6 DAYS** |

---

## 🔒 SCOPE LOCK VIOLATIONS (Do not implement)

If any agent or Noman tries to add these, REJECT immediately:
- Ambient voice detection
- Real-time background alerts  
- LiteRT on-device conversion (stretch only if core done)
- Province map interactive screen
- Tutorial robot
- Flutter rewrite
- Blockchain data logging (someone suggested this, say no)
