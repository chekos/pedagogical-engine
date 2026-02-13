# Workstream: Lesson Simulation

**Codename:** The Rehearsal
**Depends on:** Core system stable, skill graph visualization (Workstream A), lesson plan composition working

---

## The insight

The engine already has everything it needs to predict what will happen in a lesson before the educator walks into the room. It has the skill graph. It has every learner's profile — their confirmed skills, their inferred skills, their gaps. It has the lesson plan with its minute-by-minute structure. It knows which activities depend on which skills. It knows where the prerequisite chains break.

Right now, the engine builds the plan and hands it over. That's like a chess engine showing you the next move but not showing you the board three turns from now. The engine should show the educator what the lesson *looks like from each learner's perspective* — where the smooth moments are, where the friction will be, and where the plan might break down.

This isn't speculation. It's dependency graph traversal applied forward in time. If minute 22 introduces joins, and Maria's profile shows joins as unconfirmed with the filtering prerequisite also unconfirmed, then minute 22 is a predictable friction point for Maria. The engine knows this. It should say so.

---

## What this is

A simulation mode that walks through a composed lesson plan and models each learner's likely experience at each stage. For every section of the plan, the engine answers: "Who's ready for this? Who's going to struggle? Where are the bottleneck moments where multiple students hit the same wall at the same time?"

**The output is a annotated version of the lesson plan** — the same plan, but with a layer of prediction on top:

- Per-section learner readiness: for each timed section, which learners have the prerequisites and which don't
- Friction points: moments where the plan's assumptions about student knowledge don't match the group's actual profile
- Collision moments: when multiple learners hit the same gap simultaneously (these are the dangerous ones — the educator can't help everyone at once)
- Cascade risks: moments where falling behind in one section makes the next section impossible (because of dependency chains)
- Suggested pivots: for each friction point, what the educator can do — slow down, pair struggling students with strong ones, substitute an alternative activity, skip ahead and circle back

**The simulation should also produce a "confidence score" for the lesson plan as a whole** — how likely is it that the plan will run as written, given this specific group? A score of 0.9 means the group is well-matched. A score of 0.5 means the educator should expect significant deviation from the plan.

---

## What this is not

- Not a student-by-student prediction of behavior or personality — the engine doesn't know that James gets distracted after 20 minutes or that Maria asks a lot of questions. It reasons about skill readiness, not personality.
- Not a replacement for the educator's judgment — the simulation surfaces information, it doesn't make decisions. The educator decides what to do with the friction points.
- Not a probabilistic model with statistical rigor — the confidence values are heuristic, derived from the dependency graph's confidence edges. They're useful approximations, not guarantees.
- Not a separate product — it's a layer on top of the existing lesson plan. The educator should see the plan and the simulation together, not choose between them.

---

## Why this matters

Every experienced teacher does this in their head. They look at a lesson plan and think: "This part will be fine. This part is where I'll lose half the class. I need a backup plan for this section." But they do it based on intuition built over years of teaching the same students.

The engine can do this based on data — the actual skill profiles of the actual students, cross-referenced against the actual dependency requirements of the actual plan. It can do it for a teacher who's never met their students. It can do it for a group of 200 where no human could hold all the profiles in their head simultaneously.

This is the difference between "here's a plan" and "here's a plan, and here's what to watch for." It makes the educator more prepared, more confident, and more adaptive. It's the feature that makes an educator say "this thing actually thinks like a colleague."

---

## What to tell Claude Code

> Build a lesson simulation capability. After a lesson plan is composed, the engine should be able to "rehearse" it against the group's actual learner profiles.
>
> For each timed section of the lesson plan, cross-reference the section's skill requirements against every learner's profile. Identify:
>
> 1. **Learner readiness per section** — which learners have the prerequisites for this section's content, which have gaps. Show this as a simple ready/gap/partial status per learner per section.
>
> 2. **Friction points** — sections where 30%+ of the group has a prerequisite gap. Rank by severity (how many learners affected × how critical the gap is to the section's success).
>
> 3. **Collision moments** — sections where multiple learners will struggle simultaneously, overwhelming the educator's ability to provide individual support.
>
> 4. **Cascade risks** — if a section depends on skills that are taught in a previous section, and the previous section is itself a friction point, flag the cascade. "If the filtering section doesn't land, the joins section will also fail for these students."
>
> 5. **Pivot suggestions** — for each friction point, generate 2–3 options: reteach the prerequisite (with time cost), pair strong students with struggling ones, substitute an alternative activity that approaches the concept differently, or restructure the plan to address the gap earlier.
>
> 6. **Overall plan confidence** — a 0.0–1.0 score reflecting how well the plan matches the group. Derived from the proportion of learner-section pairs that are "ready" vs "gap."
>
> The simulation should be presented as an annotated layer on the lesson plan — not a separate document. The educator sees their plan with highlights, warnings, and suggestions inline.
>
> Also build a "simulation timeline" visualization — a horizontal timeline (the lesson duration) with learner lanes stacked vertically. Color-coded: green where the learner is on track, yellow where they might struggle, red where a prerequisite gap will likely block them. This makes friction points and cascade risks visually obvious.
>
> The simulation should update live if the educator modifies the plan. Change the order of sections, and the simulation recalculates.

---

## How this connects to the larger system

The simulation uses the same primitives as everything else — skill graph, learner profiles, dependencies, constraints. It doesn't require new data, just new reasoning over existing data. This is a pure demonstration of what the engine's five primitives can compose when you push the reasoning further.

If Workstream A (graph visualization) is built, the simulation can use the same visual language — nodes lighting up and dimming as you scrub through the lesson timeline.

If Workstream D (curriculum sequencer) is built, the simulation can work across the full curriculum — showing not just where a single lesson has friction, but where the multi-session arc has structural risks.

If Workstream E (live companion) is built, the simulation's predictions become the baseline that the companion compares reality against during actual teaching.
