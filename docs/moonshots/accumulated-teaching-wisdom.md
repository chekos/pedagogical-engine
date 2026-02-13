# Workstream: Accumulated Teaching Wisdom

**Codename:** The Thousand Teachers
**Depends on:** Core system stable, post-session debrief (Workstream: Post-Session Debrief) in place, at least one domain with multiple sessions taught

---

## The insight

The best lesson plans come from teachers who have taught the same topic dozens of times. Not because they have a magic template, but because they've accumulated wisdom: "This exercise always takes longer than you think." "Students always confuse this concept with that one." "This analogy lands with adults but not with teenagers." "If you don't do the hands-on before minute 20, you lose them."

Right now, the engine starts fresh every time it composes a plan. It has the skill graph, the learner profiles, the constraints. But it doesn't have *teaching history* — the accumulated pattern of what works and what doesn't, refined across many educators teaching similar content to similar groups.

The post-session debrief gives the engine feedback from individual sessions. This workstream is about aggregating that feedback into durable, transferable wisdom that improves every future plan — not just for this educator, but for every educator using this domain.

This is the flywheel. Every session taught through the engine makes the engine better at composing plans for that domain. The 100th educator to teach Python data analysis gets a dramatically better plan than the first one — not because the engine has more training data, but because it has 99 sessions worth of teaching notes, timing calibrations, and pattern observations attached to the skill graph.

---

## What this is

A teaching knowledge layer that accumulates observations, patterns, and wisdom at the domain level, attached to specific skills and activities in the skill graph.

**Teaching notes:**
Structured observations attached to skills or skill clusters. Generated from post-session debriefs, educator reflections, and the engine's own analysis of patterns across sessions.

Examples:
- Skill: "Can perform a SQL JOIN" → Teaching note: "In 7 of 10 sessions, the joins exercise ran over by 5+ minutes. Consider allocating 20 minutes instead of 15 for groups below application level."
- Skill: "Can identify native plants by leaf shape" → Teaching note: "Hands-on identification works significantly better than image-based exercises. If possible, bring physical samples or teach during a walk."
- Skill: "Can design a normalized database schema" → Teaching note: "Students consistently confuse normalization with optimization. Address this distinction explicitly before the exercise."
- Activity type: "Pair programming" → Teaching note: "Works well when skill gap between partners is 1 Bloom's level. Falls apart when gap is 2+ levels — the stronger student does all the work."

**Pattern detection:**
The engine should look for recurring patterns across sessions and surface them proactively:

- **Timing patterns:** "The data cleaning section runs long in 80% of sessions. Adjust default allocation."
- **Confusion patterns:** "Students consistently struggle with the transition from filtering to joining. Consider adding a bridging exercise."
- **Success patterns:** "Groups that do a 5-minute pair discussion before the hands-on exercise perform better on the subsequent assessment."
- **Failure patterns:** "The lecture section in the middle of the session has negative engagement in 60% of debriefs. Consider replacing with interactive demonstration."
- **Group composition patterns:** "Groups with wide skill variance benefit from jigsaw activities. Homogeneous groups benefit from shared challenges."

**Wisdom integration:**
When the engine composes a new lesson plan, it should consult the accumulated teaching notes for the relevant skills and incorporate them:

- Adjust timing estimates based on historical patterns
- Add warnings or suggestions based on common pitfalls
- Recommend activities that have historically worked for similar groups
- Avoid approaches that have consistently failed

The educator should see this: "Based on experience from [N] previous sessions, I've adjusted the timing for the joins section and added a bridging exercise before it. This pattern consistently improves outcomes."

---

## What this is not

- Not machine learning — the engine doesn't train a model on session data. It accumulates structured notes, detects patterns through reasoning, and applies them through its existing composition logic
- Not a static database of "best practices" — the notes are empirical, derived from actual sessions, and attached to specific skills in specific domains
- Not overriding the engine's per-group reasoning — teaching notes are inputs to the composition, not rules. A note that says "this section runs long" is adjusted for a group that's unusually advanced
- Not requiring massive data — even 3–5 sessions of debrief data start generating useful patterns. The value compounds but starts early
- Not centralized across all users by default — for the hackathon, teaching notes are per-deployment. The vision for the product is a shared wisdom layer across all educators using a domain, but that's a post-hackathon feature with privacy and consent implications

---

## Why this matters

This is the compounding advantage. Every other AI education tool generates plans from scratch using general knowledge. This engine generates plans from the skill graph, the learner profiles, AND the accumulated wisdom of every session ever taught through the system for this domain.

After 100 sessions, the engine knows: this skill takes 20 minutes to teach, not 15. This activity works for advanced groups but not beginners. This transition is where educators consistently lose the room. This analogy lands with teenagers. This exercise needs physical materials, not just slides.

No individual teacher has 100 sessions of structured data. The engine does. That's the flywheel.

For the hackathon, even demonstrating the concept with seed data is powerful: "In a production system, this would accumulate wisdom from every educator who teaches this domain. Here's what that looks like after 50 sessions."

---

## What to tell Claude Code

> Build a teaching wisdom accumulation layer that captures patterns from post-session debriefs and integrates them into future lesson plan composition.
>
> **Teaching notes data structure:**
> Create a teaching notes system attached to the domain. Notes live alongside the skill graph:
> - `data/domains/{domain}/teaching-notes.json` — accumulated notes keyed by skill ID and activity type
> - Each note has: observation text, source (which session/debrief), confidence (based on how many sessions confirm the pattern), applicable context (group level, group size, setting)
>
> **Pattern detection:**
> After each debrief is processed, the engine should scan for patterns across all debriefs for this domain:
> - Timing discrepancies: skills where the actual time consistently differs from the planned time
> - Engagement patterns: activity types or formats that consistently correlate with positive or negative debrief feedback
> - Confusion points: skills or transitions where educators consistently report student struggle
> - Success patterns: approaches that consistently receive positive feedback
>
> When a pattern reaches sufficient confidence (e.g., confirmed in 3+ sessions), promote it to a teaching note.
>
> **Integration with lesson composition:**
> When the engine composes a lesson plan, it should:
> 1. Load the domain's teaching notes
> 2. For each skill in the plan, check for relevant notes
> 3. Adjust timing, activity selection, and structure based on accumulated wisdom
> 4. Surface the relevant notes to the educator: "I've adjusted the joins section based on patterns from previous sessions — it tends to run long for groups at this level"
>
> **Seed data:**
> For the demo, seed the python-data-analysis domain with realistic teaching notes that simulate what the system would accumulate after 20–30 sessions. Include timing adjustments, common confusion points, activity recommendations, and pattern observations. Make them specific and useful enough that the lesson plan is visibly improved by their presence.
>
> **Transparency:**
> The educator should be able to see the teaching notes for their domain: "Show me what you've learned about teaching data cleaning." The engine should present the accumulated wisdom in a readable form.
>
> **Educator contribution:**
> Beyond the debrief, educators should be able to directly add teaching notes: "Remember this for next time — the dataset I used was too clean. Use a messier one." These direct notes have high confidence because the educator is explicitly flagging something.
>
> Connect this to the meta-pedagogical layer — when the engine explains a decision, it should cite teaching notes where relevant: "I allocated 20 minutes for joins instead of 15 because 7 previous sessions reported the section running over."
