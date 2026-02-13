# Workstream: Pedagogical Disagreement

**Codename:** The Colleague Who Pushes Back
**Depends on:** Core system stable, lesson plan composition working

---

## The insight

Right now the engine is a servant. The educator says "teach joins before filtering" and the engine does it. The educator says "cover 8 topics in 90 minutes" and the engine tries its best. The educator says "don't assess the students, just give me a plan" and the engine complies.

A real teaching partner doesn't do this. A real colleague says: "I hear you, but I'd push back on that. Here's why." Not to override the educator, but to bring expertise they might not have — expertise about the dependency structure of the knowledge, the realistic pace of learning, the consequences of skipping prerequisites.

The engine has this expertise. The dependency graph knows that teaching joins before filtering will confuse students because joins require filtering as a prerequisite. The skill distribution knows that covering 8 topics in 90 minutes is unrealistic because 4 of those topics are at synthesis level for a group that hasn't confirmed application-level prerequisites. The assessment data knows that skipping assessment means the lesson plan will be calibrated to assumptions, not reality.

The engine should say all of this. Not aggressively. Not condescendingly. The way a trusted colleague does — "I can do what you're asking, but let me show you what I'm seeing, and then you decide."

---

## What this is

A pedagogical reasoning mode where the engine explains its decisions, identifies disagreements with the educator's intent, and makes the case for alternatives. The engine should have opinions grounded in the primitives — dependency structure, Bloom's taxonomy, learner profiles, constraint feasibility — and be willing to articulate and defend them.

**When the engine should push back:**

- **Ordering conflicts:** The educator wants to teach skills out of dependency order. The engine explains which prerequisite chains break and what the consequences are for specific learners.
- **Scope overload:** The educator wants to cover more material than the time allows. The engine estimates realistic pacing based on the group's skill level and proposes cuts, with rationale for which topics to defer.
- **Prerequisite gaps:** The educator wants to skip assessment or assume students know something. The engine shows the risk — "If these 3 students don't actually know filtering, here's how the rest of your lesson falls apart."
- **Activity-level mismatch:** The educator wants to do synthesis-level activities with a group that hasn't confirmed application-level prerequisites. The engine explains the Bloom's taxonomy progression and suggests scaffolding.
- **Constraint violations:** The educator wants to use a tool that requires internet in an offline setting, or assign pre-work that requires a paid subscription they haven't confirmed all students have.

**How the engine should push back:**

- State what the educator is asking for
- State what the engine sees in the data that creates tension
- Present the specific evidence (which skills, which learners, which dependencies)
- Propose an alternative with clear rationale
- Defer to the educator's final decision — "I've shared my reasoning. You know your students better than I do. What would you like to do?"

**When the engine should NOT push back:**

- On style preferences — if the educator wants lecture over discussion, that's their call
- On domain content — the engine doesn't know whether Python or R is better for this group's career goals
- On interpersonal dynamics it can't see — the educator might have reasons for pairings that aren't in the data
- Repeatedly — if the educator has heard the concern and overridden it, respect that. Once is advice, twice is nagging.

---

## What this is not

- Not the engine being difficult or obstructionist — every pushback is grounded in specific data and comes with an alternative
- Not the engine overriding the educator — the educator always has final say
- Not the engine being opinionated about pedagogy in the abstract — its opinions are derived from the primitives (dependency structure, learner data, constraints), not from pedagogical ideology
- Not a separate mode the educator turns on — this is the engine's default behavior. A good colleague doesn't wait to be asked for their opinion on things that affect the plan's success

---

## Why this matters

Most AI tools are sycophantic. They do what you ask. Education is a domain where this is actively harmful — a bad lesson plan that the AI helped you build faster is still a bad lesson plan.

The engine's value isn't speed. It's reasoning. And reasoning means sometimes the answer is "I wouldn't do it that way, and here's why." This is what separates a tool from a partner. This is what makes an educator trust the system — not because it always agrees, but because when it agrees, the agreement means something.

For the hackathon specifically, this is differentiation. Every AI education demo shows the AI doing what the teacher asks. Showing the AI respectfully disagreeing with the teacher, grounding the disagreement in data, and the teacher going "oh, you're right" — that's a moment judges will remember.

---

## What to tell Claude Code

> Implement pedagogical pushback as a core behavior of the engine, not a separate feature.
>
> During lesson plan composition, the engine should actively evaluate the educator's intent against the evidence from the skill graph, learner profiles, and constraints. When it identifies a conflict, it should surface it conversationally in the educator chat — before or during plan composition, not after.
>
> Specific triggers for pushback:
>
> 1. **Dependency ordering violations.** If the educator's intended topic sequence breaks prerequisite chains in the skill graph, explain which chains break, which learners are affected, and propose a reordering. Show the dependency graph path that's being violated.
>
> 2. **Scope-time mismatch.** If the number of skills to cover exceeds what the engine estimates is feasible in the available time (based on Bloom's level complexity and group readiness), say so. Propose a reduced scope with rationale for what to cut and what to keep. The reasoning should reference specific skills and their Bloom's levels.
>
> 3. **Prerequisite gap risk.** If the group's profiles show unconfirmed prerequisites for the planned content, flag the risk. Quantify it — "3 of 5 learners have not confirmed skill X, which is a prerequisite for the main topic." Propose: assess first, or add a prerequisite review to the start of the session (with time cost).
>
> 4. **Bloom's level mismatch.** If the educator wants synthesis-level activities for a group that's mostly at knowledge/comprehension level, explain the gap and suggest scaffolding — intermediate activities that build application-level confidence before attempting synthesis.
>
> 5. **Constraint violations.** If the plan requires resources (tools, connectivity, subscriptions, time, physical materials) that conflict with stated constraints, flag them early. Don't build a plan that can't be executed.
>
> The tone should be: collaborative, evidence-based, respectful of the educator's autonomy. Present the reasoning, propose alternatives, defer to the educator's decision. Never repeat a pushback the educator has already overridden.
>
> When the educator asks "why did you structure it this way?" the engine should be able to articulate its reasoning in terms of the primitives — not "because the template says so" but "because your group's skill profile shows X, the dependency graph requires Y, and your time constraint means Z."
>
> This behavior should be woven into the compose-lesson SKILL.md and the main agent's system prompt, not implemented as a separate tool. It's how the engine thinks, not what the engine does.
