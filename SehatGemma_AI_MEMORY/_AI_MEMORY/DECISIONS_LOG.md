# 📝 DECISIONS LOG
> All major decisions made during SehatGemma build

---

## FORMAT
`[DATE] [WHO DECIDED] DECISION — REASON`

---

## MAY 7, 2026

**[May 7] [Claude + Kimi] → Health track chosen over Education**
Reason: Health has immediate life-or-death stakes. Judges react more emotionally to mortality statistics than learning dashboards. Pakistan diabetes rate is uniquely compelling.

**[May 7] [Kimi] → SehatGemma concept created**
Reason: Offline food photo → diabetes risk analysis. Uniquely positioned for Pakistan rural population. Uses Gemma 4 multimodal strengths.

**[May 7] [Claude] → Ollama on laptop (NOT LiteRT on phone)**
Reason: LiteRT on Android in 11 days = 3-4 weeks of senior ML engineer work. Demo looks identical either way. Saves build time for video and writeup.

---

## MAY 8-9, 2026

**[May 8] [Kimi + Claude] → React Native + Expo chosen (not Flutter)**
Reason: React Native code already written. Switching = 4 days rewriting. Expo Go = instant phone testing without APK build.

**[May 9] [Claude] → Medical disclaimer as Screen 1 (mandatory)**
Reason: Safety & Trust prize judges penalize health apps without visible disclaimers. Also legal protection. Kimi initially missed this.

**[May 10] [Noman] → Google Stitch used for design**
Reason: 7 screens generated in under 1 hour. Design quality 9.5/10. Better than anything buildable by hand in the time available.

---

## MAY 11, 2026

**[May 11] [Noman + Claude] → gemma4:e4b confirmed as final model**
Reason: gemma4:e2b gave "0.5" response (quality fail). gemma4:31b-cloud = not offline. gemma4:e4b = 5-8 seconds locally, good quality, Gemma 4 branded.

**[May 11] [Claude] → `think: False` parameter added**
Reason: Without this, e4b takes 23.9 seconds (thinking mode). With it, 5-8 seconds. Critical for demo video.

**[May 11] [Claude + Kimi] → Gemini research injected into system prompt**
Reason: Noman had 2 Gemini research reports on Pakistan diabetes. Injecting real data (31.4%, PROMPT guidelines, carb counts) makes Gemma 4 medically accurate without fine-tuning.

**[May 11] [Claude] → Port 8000 (not 5000)**
Reason: uvicorn command uses --port 8000. main.py `__main__` block also uses 8000. App.js must match.

---

## MAY 12, 2026

**[May 12] [Claude] → App.js converted from Stitch HTML to React Native**
Reason: Stitch exports HTML/CSS, not React Native. Manual conversion done faithfully preserving all 7 screens, exact colors, and design intent.

**[May 12] [All agents agreed] → Scope LOCKED. No new features.**
Reason: 6 days left. Every day spent on features = less time for video and writeup. Video is 30% of the score. Code review complete.

---

## PENDING DECISIONS

- [ ] Video filming location (home vs outdoor)
- [ ] Kaggle writeup tone (technical vs story-first)
- [ ] APK name on Play Store (future)
- [ ] Post-hackathon: pharma partnership vs NGO grant path
