# 🎬 SehatGemma — 3-Minute Demo Video Storyboard
## Gemma 4 Good Hackathon — Production Guide

---

## 📋 PRE-FILMING CHECKLIST

### Equipment Needed
- [ ] **Phone with Expo Go** (the app running on it)
- [ ] **Laptop** running Ollama + Uvicorn backend (for Tier 2 demo)
- [ ] **Second phone or camera** to film the demo phone
- [ ] **Tripod or stable surface** (shaky footage = instant rejection)
- [ ] **Raspberry Pi 4** (optional — for the "brain in pocket" shot)

### App Setup Before Filming
- [ ] Ensure `offlineDatabase.js` has 101 foods working
- [ ] Test Demo Mode button works (tap → 3 foods cycle through)
- [ ] Test Voice Input modal opens
- [ ] Test language toggle (English ↔ Urdu)
- [ ] Have 1-2 food photos in phone gallery (biryani, haleem)

### Environment Setup
- [ ] Film in a **well-lit room** with minimal background noise
- [ ] Close all unnecessary browser tabs and apps on laptop
- [ ] Have a **white wall or clean background** behind you
- [ ] Wear a solid-color shirt (no logos, no busy patterns)

---

## 🎥 SHOT-BY-SHOT BREAKDOWN

### SHOT 1: INTRO — THE PROBLEM (0:00-0:15)
| Element | Detail |
|---------|--------|
| **Duration** | 15 seconds |
| **Camera** | Face + torso, centered |
| **Background** | Clean wall or Pakistan flag |
| **Audio** | Direct to camera |

**Script (memorize this):**
> "In Pakistan, 33 million people have diabetes — the third highest in the world. Most don't even know it. And when Eid comes, every grandmother serves biryani. But for a diabetic, one plate of biryani is a glucose bomb."

**Visual cues:**
- Start with a serious expression
- On "33 million" — hold up 3 fingers
- On "biryani" — slight smile, then back to serious

---

### SHOT 2: THE PAIN POINTS (0:15-0:30)
| Element | Detail |
|---------|--------|
| **Duration** | 15 seconds |
| **Camera** | Same as Shot 1 |
| **Audio** | Direct to camera |

**Script:**
> "Existing apps need internet. Need cloud. Need English. Need money. My aunt in a village has none of these."

**Visual cues:**
- Count on fingers: "internet" (1), "cloud" (2), "English" (3), "money" (4)
- On "my aunt" — hand on heart, show emotion

---

### SHOT 3: INTRODUCE SEHATGEMMA (0:30-0:45)
| Element | Detail |
|---------|--------|
| **Duration** | 15 seconds |
| **Camera** | Cut to phone screen (screen recording or overhead shot) |
| **Audio** | Voiceover |

**Script:**
> "So we built SehatGemma. Powered by Google's Gemma 4 — the most capable open model family. Running entirely offline."

**Visual cues:**
- Show app icon / splash screen on phone
- On "Gemma 4" — show the "Powered by Gemma 4" badge
- On "entirely offline" — show the disclaimer screen with "I Understand" button

---

### 🔥 SHOT 4: THE WOW MOMENT — DEMO MODE (0:45-1:15)
**⚠️ THIS IS THE MAKE-OR-BREAK SHOT. Film it in ONE CONTINUOUS TAKE. No cuts.**

| Element | Detail |
|---------|--------|
| **Duration** | 30 seconds |
| **Camera** | Over-the-shoulder OR screen recording of phone |
| **Audio** | Voiceover (live or recorded) |

**Script (narrate as you tap):**
> "Watch this. I'm turning off WiFi. Airplane mode is ON." 

*[Show yourself swiping down, tapping airplane mode icon]*

> "Google.com — not loading. No internet." 

*[Show browser with "No internet" error]*

> "But SehatGemma? Watch."

*[Open SehatGemma app. Accept disclaimer. Home screen appears]*

> "I tap 'Quick Demo.' Three Pakistani foods. Four seconds. Watch the risk scores."

*[Tap Demo Mode button. Screen cycles through:]*
- **Biryani** → HIGH risk (red badge) → "Swap to cauliflower rice"
- **Saag + Makai Roti** → LOW risk (green badge) → "Already optimal"  
- **Gulab Jamun** → HIGH risk (red badge) → "ZERO for diabetics"

> "Biryani — HIGH risk. Saag — LOW. Gulab Jamun — HIGH. All offline. All in Urdu. All in 4 seconds."

**Critical filming notes:**
- Film the phone screen clearly — judges must SEE the risk badges
- If screen recording: use iOS/Android built-in recorder
- If overhead camera: use a tripod, ensure no glare on phone screen
- The airplane mode toggle MUST be visible — this proves offline
- The browser "No internet" page MUST be visible

---

### SHOT 5: SHOW THE "BRAIN" — RASPBERRY PI (1:15-1:45)
| Element | Detail |
|---------|--------|
| **Duration** | 30 seconds |
| **Camera** | Cut to Raspberry Pi + you holding it |

**Script:**
> "How? This Raspberry Pi in my pocket." 

*[Hold up Pi 4, show the board]*

> "Seventy-five dollars. Four gigabytes of RAM. Running Google Gemma 4 2B via Ollama. It creates its own WiFi hotspot." 

*[Point to the Pi's WiFi antenna or show terminal with `ollama run gemma4:2b`]*

> "The phone connects directly to this. No router. No internet. No cloud bill."

*[Show phone connecting to Pi's WiFi network if possible, or show terminal output]*

**Setup alternatives:**
- If no Pi 4: Show the laptop running `ollama list` and the uvicorn terminal with logs
- Say: "Or any old laptop. Here's mine running Gemma 4 e2b — 7 billion parameters, right here, no internet."

---

### SHOT 6: SHOW THE FALLBACK — OFFLINE DATABASE (1:45-2:15)
| Element | Detail |
|---------|--------|
| **Duration** | 30 seconds |
| **Camera** | Phone screen (voice modal) |

**Script:**
> "No Pi? No laptop? No problem."

*[Show phone with airplane mode still ON. Open voice modal. Type "biryani" into text input. Tap Analyze.]*

> "One hundred one Pakistani foods are pre-loaded in the app. Instant answer. Zero server needed."

*[Result screen shows instantly — HIGH risk for biryani, with Urdu explanation]*

> "Works on a fifty-dollar Android phone. The entire database is 200 kilobytes. That's smaller than one WhatsApp photo."

**Visual cues:**
- Show the text being typed
- Show the instant result (no loading spinner needed — it's instant)
- Scroll through the result: risk badge, Urdu explanation, safe swap suggestion

---

### SHOT 7: SHOW MULTIMODAL — PHOTO + VOICE + TEXT (2:15-2:45)
| Element | Detail |
|---------|--------|
| **Duration** | 30 seconds |
| **Camera** | Mix of phone screen + face |

**Script:**
> "And it's not just text. It's multimodal."

*[Cut to gallery. Pick a food photo — biryani or haleem. Tap it.]*

> "Take a photo of your food. Gemma 4 analyzes it — identifies the dish, cooking method, ingredients, portion size."

*[Show Agent Thinking screen briefly, then result]*

> "Type 'gulab jamun.' Voice 'samosa.' Photo of haleem."

*[Quickly show voice modal with text input, then maybe a photo]*

> "All analyzed. All in Urdu. All offline."

**Visual cues:**
- The gallery pick → result flow is important
- Show Agent Thinking animation briefly — it looks cool
- Show the result with Urdu text visible

---

### SHOT 8: CLOSE WITH VISION (2:45-3:00)
| Element | Detail |
|---------|--------|
| **Duration** | 15 seconds |
| **Camera** | Face + torso, centered (same as Shot 1) |
| **Background** | Clean wall, confident posture |

**Script (deliver with conviction):**
> "SehatGemma. Because good health shouldn't need good internet. Built with Gemma 4. For Pakistan."

*[Pause — let it land]*

> "For every diabetic who deserves to know what they're eating."

*[Hold for 2 seconds. Cut.]*

**Visual cues:**
- Look directly into camera
- Speak slowly on the last line
- Don't smile on the last line — it's a serious mission statement
- Add a title card at the end: "SehatGemma • صحت جیما • github.com/cyberNoman/sehatgemma"

---

## 🎬 POST-PRODUCTION NOTES

### Editing
- **NO background music** — it distracts from the demo
- **NO fancy transitions** — simple cuts only. Judges trust raw footage more.
- **NO stock footage** — every frame must be real
- **Subtitles**: Add English subtitles (for Urdu audio) or Urdu subtitles (for English audio)
- **Title card**: 3 seconds at the end with project name + GitHub URL

### Duration Check
| Section | Target | Max |
|---------|--------|-----|
| Shots 1-2 (Problem) | 30s | 35s |
| Shot 3 (Intro) | 15s | 20s |
| Shot 4 (Demo — CRITICAL) | 30s | 40s |
| Shot 5 (Pi/Brain) | 30s | 35s |
| Shot 6 (Fallback) | 30s | 30s |
| Shot 7 (Multimodal) | 30s | 30s |
| Shot 8 (Close) | 15s | 20s |
| **TOTAL** | **3:00** | **3:30 max** |

### The One Thing That Wins
**Shot 4 must be ONE CONTINUOUS TAKE. No cuts.**

Judges see hundreds of videos. Most are fake demos with jump cuts hiding failures. A single continuous shot that shows:
1. Airplane mode ON
2. Browser fails to load google.com
3. SehatGemma app launches
4. Demo Mode works instantly
5. Urdu + English results appear

...that's the video that wins. It proves the app is real, offline, and working.

---

## 🔴 TROUBLESHOOTING DURING FILMING

| Problem | Fix |
|---------|-----|
| Demo Mode doesn't cycle | Restart app, ensure offlineDB is loaded (console check) |
| Backend 500 error | Restart uvicorn, check Ollama is running (`ollama list`) |
| Phone can't reach laptop | Check both on same WiFi, verify IP in App.js line 17 |
| Glare on phone screen | Move phone to different angle, use matte screen protector |
| Audio too quiet | Use external mic or record voiceover separately |
| Airplane mode disables WiFi | Keep WiFi ON, turn off cellular data — show "No internet" via browser |

---

## 📤 FINAL DELIVERABLE

Upload to YouTube as **Unlisted** (not Private — judges need access).

**Video Title:** `SehatGemma: Offline AI Diabetic Food Analyzer — Gemma 4 Good Hackathon 2026`

**Description:**
```
SehatGemma uses Google Gemma 4 to analyze Pakistani food for diabetic risk — completely offline. 
No internet. No cloud. No API bills. Just a phone and a $75 Raspberry Pi running Gemma 4 2B via Ollama.

101 Pakistani foods pre-loaded. Urdu + English. Works on $50 phones.

🔗 GitHub: https://github.com/cyberNoman/sehatgemma
🏆 Gemma 4 Good Hackathon — May 2026
#Gemma4Good #Gemma4 #Ollama #Diabetes #Pakistan #HealthTech
```

---

*Film this today. 6 days to deadline. This 3-minute video is 50% of your score.*