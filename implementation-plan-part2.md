# Implementation Plan: Pedagogical Reasoning Engine

**Builder:** chekos
**Hackathon:** Built with Opus 4.6 — Cerebral Valley × Anthropic (Feb 10–16, 2026)
**Capacity model:** Unlimited parallel Claude Code sessions. The bottleneck is vision, not engineering.

---

## How to read this plan

This is organized into **parallel workstreams**, not sequential sessions. Each workstream can be its own Claude Code instance running simultaneously. Dependencies between workstreams are marked explicitly — if Workstream C depends on Workstream A, don't start C until A is committed.

Within each workstream, tasks are ordered. Across workstreams, everything runs in parallel unless noted.

The plan has three tiers:

- **Tier 1: Core system** — The functional prototype. What you already built in 40 minutes.
- **Tier 2: Differentiators** — Features that make this a paradigm demonstration, not just a working app. This is where you win the hackathon.
- **Tier 3: Vision features** — Things that show where this goes in 6 months. Even partially implemented, they tell the story of what's possible.

---

# Tier 1: Core System (already built or nearly there)

If your 40-minute sprint covered the original Sessions 1–6, you have the scaffold, skill graph, pedagogical skills, backend, frontend, and basic integration. Review what's working and what's rough, then move to Tier 2.

**Workstream 0: Core stabilization**

One Claude Code session to audit and harden what exists:

> Review the entire codebase. Fix any broken tool calls, WebSocket issues, or rendering problems. Make sure the golden path works cleanly: educator interview → assessment → lesson plan composition → iteration. Don't add features — stabilize what's there. Run through the flow 3 times and fix everything that breaks.

This is the foundation everything else builds on. Get it solid before launching Tier 2 workstreams.

---

# Tier 2: Differentiators

These are the features that make judges stop and think "this is different." Each workstream is independent and can run as its own Claude Code session in parallel.

---

## Workstream A: Live Dependency Inference Visualization

**Depends on:** Tier 1 complete
**Why it matters:** The dependency inference engine is the core technical innovation. But right now it's invisible — it happens in JSON files. Make it visible and the demo becomes unforgettable.

**What to tell Claude Code:**

> Build a real-time skill dependency graph visualization as a React component. Use d3-force for the graph layout.
>
> **The graph itself:**
> - Each skill is a node. Size reflects Bloom's level (higher = larger).
> - Dependency edges are directed arrows.
> - Nodes have four states: unknown (gray), assessed-confirmed (green), assessed-gap (red), inferred (blue with pulsing animation). Inferred nodes should show their confidence value.
> - When a learner is assessed on a high-level skill and passes, animate the inference cascade — watch prerequisite nodes light up blue one by one, propagating down the dependency chain. This is the money shot.
>
> **Integration:**
> - Embed as a tool result component in the educator chat. When the agent runs an assessment or shows a learner profile, render the graph.
> - Also available as a standalone view at /graph/[domain] showing the full domain skill graph.
> - Support toggling between individual learner view and group overlay (all learners' states superimposed, using opacity to show distribution).
>
> **Interaction:**
> - Click a node to see skill details, which learners have it, which don't.
> - Hover an edge to see the inference confidence.
> - Zoom, pan, drag nodes.

**Demo impact:** During the live demo, the educator asks the agent to assess a student. The graph appears. The student answers one question correctly. Five nodes cascade from gray to blue in real-time. The audience *sees* the inference. This is the moment that sells the concept.

---

## Workstream B: Domain Builder — Create Skill Graphs Through Conversation

**Depends on:** Tier 1 complete
**Why it matters:** The proof-of-concept domain is pre-built. A domain builder proves the primitives are truly universal — any educator can create a skill graph for their subject through conversation, no technical knowledge required.

**What to tell Claude Code:**

> Build a domain builder flow accessible from the educator chat. When an educator says "I want to teach something new" or "let me set up my subject area," the agent enters domain-building mode.
>
> **The flow:**
> 1. Agent interviews the educator about their subject: "What are you teaching? What are the key skills students need? What does a beginner know vs an expert?"
> 2. Agent proposes a skill graph — a list of skills with suggested Bloom's levels and dependencies.
> 3. Agent presents the graph visually (using the Workstream A visualization if available, otherwise a structured text representation).
> 4. Educator iterates: "You're missing X," "Y actually depends on Z," "Split this skill into two."
> 5. Agent saves the finalized domain to data/domains/{domain-name}/.
>
> **Technical implementation:**
> - New MCP tool: create_domain — writes skills.json and dependencies.json
> - New MCP tool: update_domain — modifies an existing domain graph
> - The agent uses the reason-dependencies skill to validate the graph (no circular dependencies, reasonable inference chains, proper Bloom's level progression).
> - Domain validation: warn if skills have no dependencies (orphans), if the graph is too flat (everything at one Bloom's level), or if there are unreachable nodes.
>
> **Build a second domain live during the session to test it.** Have Claude Code play the role of an educator describing outdoor ecology or culinary techniques, and verify the agent builds a reasonable graph.

**Demo impact:** "I didn't build this skill graph. The system built it by interviewing a teacher. Any teacher, any subject. The same primitives work for Python, for ecology, for cooking, for music."

---

## Workstream C: Multi-Domain Proof

**Depends on:** Tier 1 complete (can run parallel with B if domains are manually created)
**Why it matters:** One domain is a demo. Three domains is a thesis. The claim is "universal primitives" — prove it.

**What to tell Claude Code:**

> Create two additional skill domains that are dramatically different from python-data-analysis:
>
> **Domain 2: Outdoor Ecology** (for the park naturalist persona)
> - 15–20 skills: plant identification, animal tracking, habitat assessment, water quality testing, orienteering, field journaling, ecosystem analysis
> - Bloom's levels from "can identify 3 local tree species" (knowledge) to "can design a habitat restoration plan" (synthesis)
> - Dependencies that show meaningful inference: if someone can assess water quality, they can read a testing kit, understand pH, identify common pollutants
> - Constraints that are unique to this domain: outdoor setting, no internet, physical materials needed, weather-dependent
>
> **Domain 3: Culinary Fundamentals** (for the homeschool parent persona)
> - 15–20 skills: knife skills, heat control, flavor balancing, dough making, food safety, meal planning, recipe scaling
> - Bloom's levels from "can identify kitchen tools by name" (knowledge) to "can design a balanced weekly meal plan for dietary restrictions" (synthesis)
> - Dependencies: if someone can make a roux, they can control heat, measure ingredients, stir continuously, identify thickening
> - Constraints unique: kitchen setting, equipment requirements, allergen considerations, age-appropriate safety
>
> For each domain, also create 3–4 sample learner profiles at different levels.
>
> Then test: run the full golden path (interview → assessment → lesson plan) for each domain. Make sure the lesson plans feel genuinely different — a park ecology lesson should have "hike to the creek, 10 minutes" not "open your laptops."

**Demo impact:** Three side-by-side lesson plans from three wildly different domains, all generated by the same engine with the same five primitives. This is the Claude Code analogy made concrete.

---

## Workstream D: Curriculum Sequencer — Multi-Session Planning

**Depends on:** Tier 1 complete
**Why it matters:** A single lesson plan is useful. A sequenced curriculum that tracks progression across sessions is transformative. This moves from "AI tool" to "AI teaching partner."

**What to tell Claude Code:**

> Build a curriculum sequencing capability. An educator should be able to say "I have 6 sessions with this group over 3 weeks" and get a full curriculum arc.
>
> **New MCP tool: compose_curriculum**
> - Input: group profile, domain, number of sessions, session duration, overall learning objectives
> - Process:
>   1. Map the target skills onto the dependency graph
>   2. Identify the critical path — what must be learned in what order based on dependencies
>   3. Estimate how many sessions each skill cluster requires based on group's current level
>   4. Distribute skills across sessions, respecting dependencies (don't teach skill B in session 3 if its prerequisite skill A isn't covered until session 4)
>   5. Build individual lesson plans for each session using the existing compose_lesson_plan tool
>   6. Add cross-session connectors: "Session 2 opens with a 5-minute review of Session 1's key concept"
> - Output: A curriculum document with session-by-session plans, a progression map, and milestone checkpoints
>
> **New MCP tool: advance_curriculum**
> - After a session is taught, the educator reports how it went. The agent updates learner profiles and adjusts the remaining curriculum. If the group moved faster than expected, compress. If they struggled, add a remediation session.
>
> **Visualization:**
> - A timeline/Gantt-style view showing skills mapped across sessions
> - Color-coded by readiness: green (group is ready), yellow (some prerequisites missing), red (not yet accessible)
>
> **New SKILL.md: sequence-curriculum** in .claude/skills/
> - Methodology for curriculum design: spiral curriculum approach, spaced repetition, interleaving, prerequisite chains
> - How to estimate pace based on group skill levels
> - When to add review sessions vs push forward

**Demo impact:** Show a 6-session curriculum arc. Zoom into any individual session — it's a fully stage-directed lesson plan. Zoom out — it's a coherent learning journey. Show what happens when you tell the system "Session 2 ran long, they didn't finish the exercise" — watch the remaining sessions reorganize.

---

## Workstream E: Real-Time Teaching Companion

**Depends on:** Tier 1 complete + lesson plans working well
**Why it matters:** The system isn't just for planning — it's a partner during the actual teaching. This shows the long-term vision.

**What to tell Claude Code:**

> Build a teaching companion mode at /teach/live/[lesson-id]. This is a simplified interface the educator uses *during* the lesson — on a phone or tablet at the front of the room.
>
> **Features:**
> - Shows the current lesson plan with a progress indicator — "you are here" marker
> - Time-aware nudges: "You have 12 minutes left in this section. Consider wrapping up the discussion."
> - Quick-ask: Educator taps a button and voice-types or types a question: "Three students are stuck on merging dataframes. What should I do?" Agent responds with an immediate pivot suggestion based on the lesson plan, group profile, and skill graph.
> - Post-section notes: After each section, educator can tap "went well" / "struggled" / "skipped" — the system logs this for curriculum adjustment.
> - Emergency pivots: "This isn't working. Give me a 10-minute alternative activity for this concept."
>
> **Design:** Mobile-first. Large tap targets. Minimal text. The educator is standing in front of a class, not sitting at a desk. Think teleprompter, not word processor.
>
> **Technical:**
> - New WebSocket endpoint or mode: /ws/live
> - Loads the specific lesson plan and group profile
> - Timer integration — knows what section should be active based on elapsed time
> - All suggestions are context-aware: the agent knows the lesson plan, the group, the domain, and what's happened so far in the session

**Demo impact:** Show the lesson plan on one screen. Show the live companion on a phone-sized viewport next to it. Walk through a simulated lesson in fast-forward — "Section 1 done, went well. Section 2, students are struggling." Watch the companion adapt in real-time.

---

## Workstream F: Assessment Experience Polish

**Depends on:** Tier 1 complete
**Why it matters:** The student assessment is the other face of the product. If it feels like a test, students resist. If it feels like a conversation, they engage.

**What to tell Claude Code:**

> Redesign the student assessment experience to be engaging and low-stakes.
>
> **Assessment flow improvements:**
> - Start with a warm, friendly introduction: "Hey! Your instructor wants to know what you already know so they can make the session more useful for you. This isn't a test — there are no grades. Just tell me what you know."
> - Adaptive pacing — if the student is breezing through, move faster. If they're hesitating, slow down and reassure.
> - Progress indicator showing "we've covered 4 of 6 skill areas" — gives the student a sense of completion
> - At the end, show the student their own skill map: "Here's what you know! Here's what we'll be working on." This builds buy-in for the session.
>
> **Shareable assessment links:**
> - Generate QR codes (use a library, not an API) alongside the URL + access code
> - Batch generation: educator can generate links for all students in a group at once
> - Email/text templates the educator can copy: "Hey [name], please complete this 5-minute skill check before our Tuesday session: [link]"
>
> **Assessment dashboard for educators:**
> - Real-time status: which students have completed, which haven't, which are in progress
> - Visual summary as results come in — watch the group skill profile build up student by student
> - Deadline reminders: "3 of 5 students haven't completed yet. Send a reminder?"

**Demo impact:** Show the educator generating links, then switch to the student view. Show a conversational, non-threatening assessment. Switch back to the educator view — watch the results appear in real-time with the skill graph updating.

---

## Workstream G: Export and Artifacts

**Depends on:** Tier 1 complete + lesson plans working
**Why it matters:** Educators need to carry these artifacts into their actual teaching. Files they can print, share, and reference.

**What to tell Claude Code:**

> Build export capabilities for all major outputs.
>
> **Lesson plan PDF:**
> - Beautifully formatted PDF export of any lesson plan
> - Includes: header with title/date/group, prerequisites checklist, timed session plan with clear visual hierarchy, contingency notes, logistics section
> - Print-friendly: proper margins, page breaks, no wasted space
> - Use a PDF generation library (puppeteer, or react-pdf)
>
> **Student skill report:**
> - Individual PDF showing a learner's skill profile
> - Visual skill map (simplified version of the d3 graph, but static)
> - Strengths, gaps, recommended focus areas
> - Shareable with the student or their parent/manager
>
> **Group summary report:**
> - PDF overview of group skill distribution
> - Common gaps, pairing recommendations, readiness assessment
> - Useful for reporting to administrators or stakeholders
>
> **Curriculum document:**
> - If Workstream D is built, export the full multi-session curriculum as a single document
> - Table of contents, session-by-session plans, progression map
>
> **Prerequisites handout:**
> - Auto-generated document the educator can send to students before the session
> - "Before Tuesday's session, please: install Python, create a free Anthropic account, download this dataset"
> - Checklist format with links

**Demo impact:** Show the educator receiving a lesson plan in the chat, then clicking "Export PDF." Open the PDF — it looks professional enough to hand to a school principal or a conference organizer. This bridges AI output → real-world artifact.

---

## Workstream H: Analytics and Insights Dashboard

**Depends on:** Tier 1 complete + some assessment data
**Why it matters:** Shows the system's value over time, not just per session. Educators who use this weekly should see patterns they couldn't see before.

**What to tell Claude Code:**

> Build an analytics dashboard at /insights.
>
> **Individual learner analytics:**
> - Skill acquisition over time — line chart showing skills confirmed across sessions
> - Bloom's level distribution — are they stuck at "knowledge" or progressing to "application" and beyond?
> - Comparison to group average
> - Predicted readiness for upcoming topics
>
> **Group analytics:**
> - Skill distribution heatmap — skills on one axis, learners on the other, colored by proficiency
> - Gap analysis — which skills have the widest gap between strongest and weakest student?
> - Cohort progression over time — is the group advancing together or fragmenting?
> - Pairing effectiveness — if you recommended pair work, did both partners improve?
>
> **Educator analytics:**
> - Which lesson plans worked well vs needed heavy iteration?
> - Which topics consistently cause student struggle?
> - Time allocation — are lessons running over on certain sections?
>
> Use recharts or similar for the visualizations. Real data from the assessment results in data/learners/. Seed enough data to make the charts meaningful.

---

# Tier 3: Vision Features

These demonstrate where the product goes after the hackathon. Even partially implemented, they expand the story.

---

## Workstream I: Voice Interface

**Depends on:** Tier 1 complete
**Why it matters:** Educators multitask. A voice-first interface for the teaching companion and even for initial planning is the natural modality.

**What to tell Claude Code:**

> Add voice input/output to the educator chat and teaching companion.
>
> - Use the Web Speech API (browser-native, no API keys) for speech-to-text
> - Add a microphone button to the chat interface — tap to speak instead of type
> - For the live teaching companion (Workstream E), voice should be the primary input
> - Optional: use a TTS API to read back key parts of the agent's response (lesson plan summaries, time warnings)
>
> Keep text as the fallback. Voice is additive, not required.

---

## Workstream J: Collaborative Multi-Educator

**Depends on:** Tier 1 complete
**Why it matters:** Co-teaching, teaching teams, department coordination. Shows the system scales beyond individual use.

**What to tell Claude Code:**

> Enable multiple educators to share groups, learner profiles, and lesson plans.
>
> - Shared group ownership — two educators can access the same Tuesday cohort
> - Lesson plan handoff — "I taught sessions 1–3, here's where the group is. You're taking sessions 4–6."
> - Collaborative curriculum planning — two educators in the same chat, building a plan together
> - Conflict resolution — if two educators update the same learner profile, merge intelligently
>
> For the hackathon, even a simple version (shared filesystem, multiple sessions pointing at the same group) demonstrates the concept.

---

## Workstream K: Plugin Architecture for Domains

**Depends on:** Workstream B (domain builder)
**Why it matters:** Shows the platform play. Third parties can contribute domains, constraint types, assessment strategies.

**What to tell Claude Code:**

> Design a plugin system for domain knowledge. A domain plugin is a directory with:
> - skills.json + dependencies.json (the skill graph)
> - A SKILL.md file with domain-specific teaching methodology
> - Sample learner profiles for testing
> - A manifest.json with metadata (name, author, description, version)
>
> Build a plugin discovery page at /domains that lists available domains. Educators can browse and select which domains they want to use. New domains can be added by dropping a directory into data/domains/.
>
> If time permits, build a "domain marketplace" concept UI — even if it's just a static page with the 3–4 domains you've built. The visual tells the story.

---

## Workstream L: Embeddable Assessment Widget

**Depends on:** Workstream F (assessment polish)
**Why it matters:** Shows distribution potential. The assessment doesn't have to live on your site — it can be embedded in an LMS, a Slack bot, a course website.

**What to tell Claude Code:**

> Build an embeddable version of the student assessment as an iframe widget.
>
> - Generate an embed code alongside the shareable link: `<iframe src="https://yourapp.com/assess/embed/[code]" />`
> - The embedded version is self-contained — no navigation, just the assessment chat
> - Responsive sizing
> - Post-completion, send results back to the parent page via postMessage API
> - Show this working embedded in a simple demo HTML page

---

# Execution Strategy

## Parallelization map

```
Tier 1 (Core) ← must be stable first
  │
  ├── Workstream A (Graph viz)
  ├── Workstream B (Domain builder)
  ├── Workstream C (Multi-domain) ← can use B's output or manual domains
  ├── Workstream D (Curriculum sequencer)
  ├── Workstream E (Live companion)
  ├── Workstream F (Assessment polish)
  ├── Workstream G (Exports)
  └── Workstream H (Analytics dashboard)
        │
        ├── Workstream I (Voice)
        ├── Workstream J (Multi-educator)
        ├── Workstream K (Plugin architecture)
        └── Workstream L (Embeddable widget)
```

All Tier 2 workstreams can run in parallel once Tier 1 is stable. Tier 3 workstreams can start anytime but are lower priority.

## Recommended priority for demo impact

If you're optimizing for what makes judges react:

| Rank | Workstream | Why |
|------|-----------|-----|
| 1 | **A: Graph visualization** | Makes the core innovation visible. The cascade animation is the demo's climax. |
| 2 | **B: Domain builder** | Proves universality. "Any teacher, any subject" becomes real when they watch it happen. |
| 3 | **C: Multi-domain** | Three domains side-by-side is the thesis statement. |
| 4 | **D: Curriculum sequencer** | Shows depth beyond single sessions. Makes it a platform, not a tool. |
| 5 | **G: Exports** | Bridges AI → real world. Judges can hold the PDF. |
| 6 | **F: Assessment polish** | The other face of the product. QR codes + real-time status = polished. |
| 7 | **E: Live companion** | Shows the long-term vision. Even a rough version tells the story. |
| 8 | **H: Analytics** | Pretty charts, but less central to the core pitch. |

## Demo script outline

With all Tier 2 features built, the demo tells this story:

1. **Open:** "What if AI could think like a teacher?" (30 sec)
2. **Domain creation:** Build a skill graph for outdoor ecology through conversation. Show the graph visualize as it's built. (2 min)
3. **Educator interview:** "I'm a park naturalist with a group of 12 middle schoolers for a 2-hour trail walk." Watch the agent interview. (2 min)
4. **Assessment:** Generate QR codes. Show a student completing the assessment. Watch the skill graph light up with inference cascades. (2 min)
5. **Lesson plan:** Agent composes a trail-based ecology lesson with stage direction. "By minute 40, you should be at the creek. If the group is slow, skip the soil sampling and go straight to water quality." Export as PDF. (2 min)
6. **Universality proof:** Side-by-side — the same engine producing a Python data analysis workshop, an outdoor ecology hike, and a culinary fundamentals session. Same primitives, completely different outputs. (1 min)
7. **Curriculum:** Zoom out to a 6-session curriculum. Show progression tracking. Show adaptation when a session doesn't go as planned. (1 min)
8. **Close:** "Five primitives. Any teacher. Any subject. Any setting." (30 sec)

Total: ~11 minutes. Tight for a hackathon demo — trim to fit the format.

---

*Launch all Tier 2 workstreams in parallel. Each is a Claude Code session with full context (CLAUDE.md + docs/ + existing codebase). Review outputs, merge, iterate.*
