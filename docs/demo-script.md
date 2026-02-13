# Demo Script — 3 Minutes

**Story:** "What if assessment took 5 minutes instead of 50?"

---

## ACT 1: The Graph (0:00–0:40)

**Open on:** `/graph/python-data-analysis` — full skill graph, no learner selected. 25 nodes, 48 edges, dark theme. Let it breathe for 2 seconds. This is the visual hook.

**Narrate:** "This is a skill graph for Python data analysis. 25 skills, 48 dependencies, organized by Bloom's taxonomy. Every node is a skill. Every edge means 'you need this before you can do that.'"

**Click "Cascade Demo" mode.** Show the before state — one skill assessed (pandas groupby).

**Trigger the cascade.** Watch inference ripple through the graph — nodes lighting up yellow as the engine infers downstream skills from one answer.

**Narrate:** "Priya answered ONE question about pandas groupby. From that single answer, the engine inferred 12 other skills — filtering, variables, functions, terminal — with confidence scores that decay over distance. That's dependency inference. One question did the work of twelve."

**Click Priya** in the learner selector. Show her graph: mostly green and yellow.
**Click Alex.** Mostly gray. Same assessment, fewer inferences — because his answers placed him lower on the chain.

**Narrate:** "Same assessment adapts to what it learns. Priya's 4 answers covered 18 skills. Alex's 4 answers covered 6. The engine tests efficiently because it reasons about structure."

---

## ACT 2: The Plan (0:40–1:20)

**Navigate to:** `/lessons` — show a composed lesson plan.

**Narrate:** "Once it knows the group, it composes a lesson plan. Not bullet points — stage direction. Minute-by-minute timing, differentiated activities, transition cues."

**Show a specific timing beat** in the plan — something like "By minute 14, if the warmup isn't done, skip the extension."

**Navigate to:** `/simulate` — pick that same lesson. Show the simulation results.

**Narrate:** "Before you teach, you can simulate the lesson against the group. It predicts that Sofia will struggle at minute 22 — her data cleaning is at Remember level, not Apply. It flags that the hands-on section will run over for Marcus. It tells you where the energy drops."

**Show the timeline view** with learner lanes and red/amber/green cells.

---

## ACT 3: The Brain (1:20–2:00)

**Navigate to:** `/disagree` — pick "Everything in 45 Minutes" scenario.

**Narrate:** "And if you ask for something unreasonable, it pushes back." Show the tension analysis — scope overload, prerequisite gaps, specific students cited.

**Navigate to:** `/meta` — expand a reasoning trace.

**Narrate:** "Ask it why it made any decision and it shows the actual reasoning chain. Not a hallucination — the stored trace from composition. Which graph paths it traversed, which profiles it checked, what alternatives it rejected."

---

## ACT 4: The Flywheel (2:00–2:30)

Quick montage — 10 seconds each, narrate over:

**`/wisdom`** — "After 23 sessions, it knows hands-on exercises run 3 minutes over for evening cohorts."

**`/profile`** — "It learns educator style. Same lesson, two teachers, two different plans."

**`/transfer`** — "A biology PhD's analysis skills partially predict data science readiness. Cross-domain inference."

**Narrate:** "Every session makes the next one better. That's the flywheel."

---

## ACT 5: The Close (2:30–3:00)

**Back to the graph.** Auto-cycle mode on — learners sweeping through, skills lighting up.

**Narrate:** "27 custom tools. 4 domains. 3 subagents. Educator profiling, assessment integrity, affective context, post-session debriefs. Built in a week with Opus 4.6 and the Agent SDK."

"Most AI teaching tools generate content. This one reasons about teaching — and then reasons about its own reasoning."

**End on the graph animation.**

---

## Assets to Pre-Prepare

1. **Frontend running on localhost:3001** (backend not needed for demo data pages)
2. **Browser tabs pre-opened:**
   - `/graph/python-data-analysis`
   - `/lessons` (with a lesson visible)
   - `/simulate` (with results loaded)
   - `/disagree` (with "Everything in 45 Minutes" selected)
   - `/meta` (with a lesson's traces loaded)
   - `/wisdom`
   - `/profile`
   - `/transfer`
   - `/dashboard` (auto-cycle ready)
3. **Screen recording software** (if pre-recording, OBS or similar)

## Key Transitions

- Graph → Lessons: "Once it knows the group..."
- Lessons → Simulate: "Before you teach..."
- Simulate → Disagree: "And if you ask for something unreasonable..."
- Disagree → Meta: "Ask it why..."
- Meta → Wisdom/Profile/Transfer: quick montage
- Back to Graph: "27 tools. Built in a week."

## What NOT to Do

- Don't show the chat interface (`/teach`) — too slow for 3 min, judges have seen chatbots
- Don't explain the architecture diagram — show the working system instead
- Don't try to run anything live against the API — use pre-seeded demo data
- Don't read text on screen — narrate over it, let visuals do the work
