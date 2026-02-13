# Advanced Workstreams: The Reasoning Frontier

**Context:** The core system is built. These nine workstreams push the engine from "functional prototype" to "paradigm demonstration." Each one is a reasoning problem, not an engineering problem — they give Opus 4.6 richer context and harder questions.

---

## The workstreams

| # | Codename | What it does |
|---|----------|-------------|
| 1 | **The Rehearsal** | Lesson simulation — predict friction points before teaching |
| 2 | **The Colleague Who Pushes Back** | Pedagogical disagreement — the engine has opinions and defends them |
| 3 | **The Bridge** | Cross-domain transfer — skills carry across subjects |
| 4 | **The Why Behind the What** | Meta-pedagogical layer — the engine explains its own reasoning |
| 5 | **The Honest Signal** | Assessment integrity — designing ungameable assessments |
| 6 | **The Human Layer** | Affective dimension — emotional and social context of learning |
| 7 | **The Feedback Loop** | Post-session debrief — close the loop between teaching and planning |
| 8 | **The Thousand Teachers** | Accumulated teaching wisdom — the system gets smarter with use |
| 9 | **The Missing Profile** | Educator profiling — adapt plans to the teacher, not just the students |

---

## How they connect

These aren't independent features. They form a reinforcing system where each workstream makes the others more powerful.

```
                    ┌─────────────────────┐
                    │   Educator arrives   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Interview + [6]   │◄── Affective dimension
                    │   [9] Educator      │    enriches the interview
                    │   profile captured  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Assessment + [5]  │◄── Integrity layer shapes
                    │   [3] Cross-domain  │    the questions
                    │   priors applied    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Lesson composed   │
                    │   [2] Pushback      │◄── Engine disagrees if needed
                    │   [4] Meta layer    │◄── Engine explains decisions
                    │   [8] Wisdom used   │◄── Past sessions inform plan
                    │   [9] Educator fit  │◄── Plan fits the teacher
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   [1] Simulation    │◄── Predict before teaching
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Lesson taught     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   [7] Debrief       │
                    │   feeds → [8] Wisdom│◄── What happened becomes
                    │   feeds → [9] Prof  │    what the system knows
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Next session is   │
                    │   better than the   │
                    │   last one          │
                    └─────────────────────┘
```

**The flywheel:** Workstreams 7 (Debrief) → 8 (Wisdom) → 9 (Educator Profile) form a feedback loop. Every session taught makes the next session's plan better — better calibrated to the group, better informed by what works in this domain, better fitted to this educator's style.

**The depth stack:** Workstreams 1 (Simulation) + 2 (Disagreement) + 4 (Meta Layer) form a reasoning depth stack. The engine doesn't just compose plans — it predicts outcomes, pushes back on bad ideas, and explains every decision. This is the difference between a tool and a partner.

**The integrity chain:** Workstreams 5 (Assessment Integrity) + 3 (Cross-Domain Transfer) make assessment smarter. Assessments are harder to game and faster to complete because the engine designs better questions and starts from better priors.

**The human chain:** Workstreams 6 (Affective) + 9 (Educator Profile) add the human dimension. The engine doesn't just reason about skills and dependencies — it reasons about people, emotions, relationships, and teaching identity.

---

## Parallelization

All nine workstreams can run as parallel Claude Code sessions once the core system is stable. None depend on each other for initial implementation — they enhance each other when combined, but each stands alone as a valuable addition.

**Recommended parallel batches:**

**Batch 1 (immediate — highest demo impact):**
- Workstream 1: Lesson Simulation
- Workstream 2: Pedagogical Disagreement
- Workstream 5: Assessment Integrity
- Workstream 6: Affective Dimension

These four make the existing demo dramatically more impressive without requiring new infrastructure. They enrich the engine's existing reasoning.

**Batch 2 (builds the flywheel):**
- Workstream 7: Post-Session Debrief
- Workstream 8: Accumulated Teaching Wisdom
- Workstream 9: Educator Profiling

These three form the feedback loop. Build them together — they're most powerful as a system.

**Batch 3 (expands the thesis):**
- Workstream 3: Cross-Domain Transfer
- Workstream 4: Meta-Pedagogical Layer

These two deepen the intellectual contribution. Cross-domain transfer proves universality at a deeper level. The meta layer makes the engine a teacher of teachers.

---

## What to give each Claude Code session

Each workstream document is self-contained and can be handed directly to a Claude Code session along with:

1. The project's `CLAUDE.md`
2. The docs/ directory (especially north-star.md and technical-engine-spec.md)
3. The workstream document itself

The workstream document contains the "What to tell Claude Code" section that serves as the session's primary directive. Claude Code has the full context of the project philosophy from CLAUDE.md and the technical architecture from docs/, plus the specific guidance from the workstream document.

---

## Demo impact when combined

With all nine workstreams implemented, the demo tells a story no other AI education product can tell:

1. **The engine builds a skill graph** through conversation with a teacher (existing Workstream B)
2. **It interviews the educator** about their students — including emotional context and social dynamics [6]
3. **It profiles the educator** — understanding their teaching style and strengths [9]
4. **It assesses students** with questions designed to resist gaming [5], starting from cross-domain priors [3]
5. **It composes a plan** tailored to these students, this teacher, this setting — using accumulated wisdom from past sessions [8]
6. **It pushes back** if the teacher's ambitions don't match the group's readiness [2]
7. **It explains every decision** when asked [4]
8. **It simulates the lesson** — showing the teacher where friction will happen before they walk in the room [1]
9. **After teaching, it debriefs** — closing the loop and making the next plan better [7]

That's not a tool. That's a teaching partner.

---

## File listing

```
workstreams/
├── index.md                        ← this file
├── lesson-simulation.md            ← Workstream 1: The Rehearsal
├── pedagogical-disagreement.md     ← Workstream 2: The Colleague Who Pushes Back
├── cross-domain-transfer.md        ← Workstream 3: The Bridge
├── meta-pedagogical-layer.md       ← Workstream 4: The Why Behind the What
├── assessment-integrity.md         ← Workstream 5: The Honest Signal
├── affective-dimension.md          ← Workstream 6: The Human Layer
├── post-session-debrief.md         ← Workstream 7: The Feedback Loop
├── accumulated-teaching-wisdom.md  ← Workstream 8: The Thousand Teachers
└── educator-profiling.md           ← Workstream 9: The Missing Profile
```
