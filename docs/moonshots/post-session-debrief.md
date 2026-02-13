# Workstream: Post-Session Debrief

**Codename:** The Feedback Loop
**Depends on:** Core system stable, lesson plans working, learner profiles populated

---

## The insight

There's a black hole in the system right now. The engine builds a plan. The educator teaches the lesson. Then... nothing. The engine's information about the learners is frozen at the last assessment. The lesson plan assumed certain things would happen — the engine has no idea what actually happened.

But the educator *does* know what happened. They watched it unfold. They saw who struggled, who sailed through, who helped others, who checked out, who had a breakthrough. They saw which sections ran long, which sections fell flat, which sections worked better than expected. They have exactly the information the engine needs to update its model of the learners and refine its approach for next time.

The post-session debrief closes this loop. The educator tells the engine what happened, and the engine updates everything — learner profiles, group dynamics, teaching notes for the domain — based on observational evidence.

This is the feature that makes the engine a *longitudinal* partner rather than a single-use tool. Without the debrief, each session is independent. With the debrief, each session builds on the last. The engine gets better at planning for this specific group, in this specific domain, with this specific educator — because it learns from what actually happened.

---

## What this is

A structured but conversational debrief flow that the educator completes after teaching a session. The engine guides the conversation, extracts actionable information, and updates the system's state.

**The debrief flow:**

1. **Overall check:** "How did the session go? On track, rough, or somewhere in between?" This sets the frame — the engine adjusts its questions based on whether it's investigating a success or diagnosing a problem.

2. **Section-by-section walkthrough:** The engine presents the lesson plan's sections one at a time and asks: "How did this section go?" For each section, it probes:
   - Did it take the expected time, or more/less?
   - Did students engage or disengage?
   - Were there any surprises — things that worked unexpectedly well, or things that fell apart?
   - Did you use the contingency plan? Did it work?

3. **Student-level observations:** "Any individual observations? Students who stood out — positively or negatively?" The educator shares what they noticed. The engine maps observations to learner profiles:
   - "James really struggled with joins" → lower confidence on joins in James's profile
   - "Maria helped three other students with filtering" → upgrade Maria's filtering to "can evaluate" (Bloom's level increase — she can teach it)
   - "Alex disengaged during the lecture section but came alive during hands-on" → affective note for future pairing and activity selection

4. **Unplanned moments:** "Did anything happen that wasn't in the plan?" These are often the most valuable data points — a student question that revealed a gap the engine didn't predict, a group dynamic that emerged, an activity that spontaneously worked better than the planned one.

5. **Educator reflection:** "What would you change if you taught this again?" This is both useful data for the engine and a professional development moment for the educator.

**What the engine does with debrief data:**

- **Updates learner profiles** with observational evidence. Observational evidence has lower confidence than assessment evidence (the educator's impression isn't the same as a tested result), but it's still informative and should shift the profile.
- **Adjusts group dynamics model** based on what the educator observed about interactions, pairings, and engagement.
- **Recalibrates future plans** for this group. If sections consistently run long, the engine adjusts its time estimates. If certain activity types consistently work well for this group, the engine favors them.
- **Generates teaching notes** for the domain (connects to the Teaching Notes workstream). If the joins section was a problem because the example data was confusing, that's a note that applies to future sessions on joins with any group.
- **Updates the lesson simulation model.** If the simulation predicted friction at minute 22 and the educator confirms it happened, the simulation's predictive model is validated. If the simulation missed something, that's a signal to refine.

---

## What this is not

- Not mandatory — an educator who doesn't have time for a debrief can skip it. The system works without it, just less well over time.
- Not a performance review — the engine isn't evaluating the educator. It's gathering information to improve future plans.
- Not a form to fill out — it's a conversation. The engine asks questions, the educator responds naturally. The engine does the work of extracting structured data from natural language.
- Not immediate — the educator might debrief right after the session, or the next morning, or three days later. The engine should be flexible about timing.
- Not requiring perfect memory — "I think section 3 ran long" is useful even without exact timestamps. The engine calibrates confidence based on the specificity of the educator's recall.

---

## Why this matters

Every great teacher-student relationship (and the engine-educator relationship should aspire to this) gets better over time because both parties learn from shared experience. Without the debrief, the engine starts from the same baseline every session. With it, the engine accumulates understanding of this group, this educator, this domain — and produces plans that are increasingly well-calibrated.

This is also one of the clearest demonstrations of the "AI teaching partner" value proposition. The engine isn't a static tool — it adapts, learns, remembers. That story is powerful for judges and for the long-term product vision.

---

## What to tell Claude Code

> Build a post-session debrief flow that closes the feedback loop between lesson execution and system state.
>
> **New capability in the educator chat:**
> When the educator indicates they've taught a session (or the engine notices enough time has passed since a lesson was planned), the engine should offer a debrief: "How did the session go? I'd love to learn from what happened so I can make the next plan even better."
>
> **Debrief conversation flow:**
> The engine should guide the debrief conversationally, not as a form:
>
> 1. Start with an open-ended overall question
> 2. Walk through the lesson plan section by section, asking about timing, engagement, and surprises
> 3. Ask about individual students — anyone who stood out
> 4. Ask about unplanned moments
> 5. Ask what the educator would change
>
> Be adaptive — if the educator gives detailed answers, ask fewer follow-ups. If they're brief, probe more. Respect their time.
>
> **Profile updates from debrief data:**
> Map the educator's observations to learner profile updates:
> - "[Student] struggled with [topic]" → lower confidence on related skills
> - "[Student] helped others with [topic]" → upgrade skill to higher Bloom's level (can evaluate/teach)
> - "[Student] disengaged during [activity type]" → affective note about activity type preferences
> - "The whole group struggled with [section]" → flag the prerequisite gap the engine may have missed
>
> Observational evidence should have lower confidence than assessment evidence. Tag all debrief-sourced profile updates as observational with a confidence discount.
>
> **System state updates:**
> - If timing estimates were wrong, adjust the engine's pacing model for this domain/group
> - If activities worked better or worse than expected, record this as a teaching note on the skill
> - If the educator modified the plan during delivery (skipped a section, added an activity), record the actual plan alongside the intended plan — the delta is informative
>
> **New SKILL.md section or standalone skill:**
> Add debrief methodology to the existing skills or create a new debrief-session SKILL.md: how to guide the conversation, what questions to ask at each stage, how to extract structured data from conversational responses, how to calibrate confidence on observational evidence.
>
> **Connect to curriculum sequencer:**
> If the curriculum sequencer (Workstream D) is built, the debrief should feed directly into curriculum adjustment. After debriefing Session 2, the engine should automatically re-evaluate the plan for Sessions 3–6 and surface any recommended changes: "Based on what you told me about Session 2, I'd recommend adding 10 minutes of review at the start of Session 3 and deferring the advanced topic to Session 4."
