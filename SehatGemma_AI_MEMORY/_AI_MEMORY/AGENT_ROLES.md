# 🤖 AGENT ROLES — WHO DOES WHAT
> SehatGemma Multi-Agent Workflow

---

## THE TEAM

### 🧠 CLAUDE (claude.ai Pro) — CTO / Architect / Final Decisions
**Role:** System architect, code reviewer, mentor, final call on all decisions
**Use for:**
- Architecture decisions
- Code review and bug fixing
- Mentor guidance and scope control
- Kaggle writeup drafting
- Video script writing
- Reviewing work from other agents

**Current instruction:** Keep scope locked. Do not add features after May 12.
**Personality:** Honest, cuts scope ruthlessly, catches bugs others miss

---

### ⚡ KIMI K2.6 (Kimi Chat) — Bulk Builder
**Role:** Primary code generation, scaffold creation, rapid feature building
**Use for:**
- Writing full files and components
- Generating boilerplate fast
- Building features from spec
- React Native screens
- FastAPI endpoints

**Current instruction:** Build fast, let Claude review. No new features without Claude approval.
**Personality:** Fast, sometimes overambitious (learned to check with Claude first)

---

### 🔬 GEMINI CLI / Gemini AI Pro — Research + UI Analysis
**Role:** Domain research, medical data, competitive analysis, UI feedback
**Use for:**
- Pakistan diabetes research (already done — see RESEARCH.md)
- PROMPT clinical guidelines reference
- Pakistani food database
- UI/UX feedback on screens
- Video script fact-checking

**Current instruction:** Research is DONE. Only use for fact-checking now.
**Note:** Produced 2 research reports already injected into system prompt

---

### 🔧 DEEPSEEK V4 Pro (via OpenRouter CLI) — Polish / Mechanical Edits
**Role:** Code cleanup, refactoring, small fixes, optimization
**Use for:**
- Fixing specific bugs (pass exact error)
- Code optimization
- README writing
- Cleaning up messy code
- Port/config fixes

**Current instruction:** Mechanical edits only. No architectural decisions.

---

## WORKFLOW RULES

```
1. KIMI builds the feature
2. CLAUDE reviews and approves/fixes
3. DEEPSEEK polishes if needed
4. GEMINI fact-checks any medical claims
5. NOMAN ships it
```

---

## WHAT EACH AGENT MUST NEVER DO
- **KIMI:** Add features not on the KANBAN without Claude approval
- **GEMINI:** Write production code (research only)
- **DEEPSEEK:** Make architectural decisions
- **CLAUDE:** Write all the code alone (use Kimi for bulk building)

---

## CONTEXT SHARING
All agents read from `_AI_MEMORY/` folder before starting work.
Always update `CURRENT_STATUS.md` after completing a task.
Always log decisions in `DECISIONS_LOG.md`.
