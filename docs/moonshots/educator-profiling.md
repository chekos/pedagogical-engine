# Workstream: Educator Profiling

**Codename:** The Missing Profile
**Depends on:** Core system stable, educator interview flow working, post-session debrief (Workstream: Post-Session Debrief) ideally in place

---

## The insight

The engine profiles learners in exquisite detail — what they know, how deeply they know it, what their gaps are, how confident they are. It uses all of this to compose a lesson plan calibrated to the students.

Then it hands that plan to the educator as if all educators are the same.

They're not. A teacher who's brilliant at Socratic questioning should get a plan built around guided discussion and probing questions. A teacher who's a natural demonstrator should get a plan organized around live coding and worked examples. A teacher who struggles with group management should get a plan that minimizes complex multi-group configurations. A teacher who's new to the subject but great at facilitation should get a plan with more scaffolding in the content and more reliance on their facilitation skills.

The engine profiles learners because learner profiles drive better lesson plans. Educator profiles drive better lesson plans too — plans that are right not just for the students and the setting, but for *this specific teacher.*

---

## What this is

A profile of the educator that captures their teaching style, strengths, preferences, and growth areas — and integrates that profile into how the engine composes lesson plans.

**What the educator profile captures:**

- **Teaching style preferences:** Lecture vs. discussion vs. hands-on vs. Socratic vs. project-based. Not a single label but a distribution — "70% hands-on, 20% discussion, 10% lecture."
- **Strengths:** What this educator is particularly good at. Facilitation? Deep content knowledge? Building rapport? Managing complex activities? Improvising when plans go off-script?
- **Growth areas:** Where this educator is less comfortable. Large group management? Handling advanced questions outside their expertise? Time management? Keeping lectures engaging?
- **Content confidence:** How deeply the educator knows the subject they're teaching. An expert mathematician teaching calculus gets a different plan than a general teacher assigned to cover calculus. The expert gets concise content notes and more autonomy in how they explain things. The generalist gets detailed content scaffolding, suggested explanations, and "if a student asks X, here's how to answer."
- **Logistical patterns:** Does this educator consistently run over time? Do they tend to skip warm-ups and jump to content? Do they allocate too much time to discussion and not enough to practice? These patterns (learned from debriefs) shape how the engine calibrates timing and emphasis.

**How the profile is built:**

The engine doesn't hand the educator a questionnaire. It builds the profile gradually from three sources:

1. **Initial interview signals.** When the educator describes their context, they reveal teaching style. "I usually start with a hands-on exercise" is a data point. "I prefer to lecture for the first 20 minutes" is a data point. The engine captures these naturally.

2. **Explicit preferences.** The engine asks, in context: "Do you prefer to lead with theory or with hands-on practice?" "Are you comfortable facilitating small-group work, or do you prefer whole-class activities?" These are asked once and remembered.

3. **Debrief patterns.** Over time, the debriefs reveal what actually works for this educator. If they consistently report that discussion sections went well but lecture sections fell flat, the engine learns to lean on discussion. If they always run over on hands-on sections, the engine pads the timing.

**How the engine uses the educator profile:**

- **Activity selection:** Favor activity types that match the educator's strengths. A great facilitator gets more group discussion and Socratic questioning. A great demonstrator gets more live examples and worked problems.
- **Content scaffolding:** Adjust how much detail the lesson plan includes based on the educator's content confidence. High confidence → brief content notes, trust the educator to explain in their own way. Lower confidence → detailed talking points, suggested explanations, anticipated student questions with answers.
- **Timing calibration:** If the educator tends to run long on certain activity types, the engine preemptively adjusts the plan's time allocation.
- **Growth nudges:** Occasionally, the engine might suggest an activity type the educator doesn't usually use, with extra scaffolding. "You tend toward lecture for theory sections. For this topic, a 10-minute Socratic discussion might be more effective — here's a set of guiding questions you can use." This is the engine gently expanding the educator's range.
- **Contingency matching:** The fallback plans are calibrated to the educator. An educator who's good at improvisation gets open-ended contingencies ("pivot to a discussion about why this concept is hard"). An educator who prefers structure gets specific alternatives ("switch to this pre-built exercise").

---

## What this is not

- Not evaluating the educator — the profile exists to make the plans better, not to judge the teacher
- Not assuming deficiency — having a teaching style is not a weakness. Preferring lecture over discussion is a preference, not a problem. The engine adapts to the educator, it doesn't try to change them
- Not surveillance — the profile is built from what the educator shares (interview, preferences, debriefs). The engine doesn't monitor or score the educator's performance
- Not a single fixed label — the profile is contextual. An educator might be a confident expert in Python but a nervous generalist in ecology. The profile adapts per domain
- Not replacing professional development — the engine can nudge growth ("try a Socratic approach here"), but it's not a coaching tool for educators. It's a planning tool that happens to know what its user is good at

---

## Why this matters

Every educator who's ever used a curriculum guide or a lesson plan template has had the experience of: "This is well-designed but it's not *me.* I can't teach this way." The plan calls for a lively group discussion but the teacher is an introverted expert who shines in one-on-one and detailed explanation. The plan calls for a structured lecture but the teacher is a freewheeling improviser who loses energy from a script.

A lesson plan that ignores the educator's strengths is like a suit that ignores the wearer's measurements. It might be beautifully constructed but it doesn't fit.

The educator profile makes the plan fit. Same content objectives, same student needs, same constraints — but the *how* is tailored to the person delivering it.

For the hackathon, this is a subtle but profound demo moment. Show two lesson plans for the same group, same topic, same constraints — but one for a lecture-style educator and one for a hands-on facilitator. They're different plans that achieve the same objectives. The judges realize: this system isn't generating a plan for the *topic.* It's generating a plan for *this teacher, these students, this moment.*

---

## What to tell Claude Code

> Build an educator profiling system that captures teaching style, strengths, and patterns — then uses that profile to customize how lesson plans are composed.
>
> **Profile data structure:**
> Add educator profiles to the data layer. An educator profile lives at `data/educators/{id}.json` and contains:
> - teaching_style: distribution across activity types (lecture, discussion, hands-on, socratic, project-based, demonstration)
> - strengths: list of teaching strengths with confidence (facilitation, content_expertise, improvisation, group_management, rapport_building, time_management)
> - content_confidence: per-domain confidence level (how well does this educator know the subject?)
> - preferences: explicit preferences captured from interview (format, pacing, group work comfort)
> - timing_patterns: learned adjustments from debriefs (tends to run +5 min on hands-on, -3 min on lecture)
> - growth_notes: areas where the engine might suggest gentle expansion
>
> **Profile building:**
> The profile should build gradually and naturally:
>
> 1. During the first educator interview, capture initial signals from how they describe their teaching. If they say "I usually do a live demo" — that's a data point for demonstration style preference.
> 2. Ask 2–3 explicit preference questions during the first session: style preference, comfort with group activities, content confidence in this domain. Don't make it feel like a questionnaire — weave it into the interview.
> 3. After each debrief, update the profile based on what worked and what didn't. Activity types that consistently get positive feedback increase in the preference distribution.
>
> **Lesson plan customization:**
> When composing a lesson plan, the engine should load the educator's profile and adjust:
>
> - Activity types weighted toward the educator's strengths and preferences
> - Content scaffolding depth based on content confidence (expert gets bullet points, generalist gets full talking points with anticipated Q&A)
> - Timing adjusted for known patterns (if they always run long on discussions, pre-shorten discussion slots)
> - Contingency plans matched to the educator's comfort zone (improvisers get open-ended pivots, structuralists get specific alternatives)
> - Occasional growth nudge: "For this section, I'd normally suggest a lecture based on your preference, but a Socratic discussion might be more effective here. I've included guiding questions in case you want to try it."
>
> **Transparency:**
> The educator should be able to ask "what does my profile look like?" and see their teaching style distribution, strengths, and any timing calibrations. They should be able to correct it: "Actually, I've been working on my facilitation — bump that up."
>
> **Demo setup:**
> For the demo, create two educator profiles with different styles. Show the engine composing lesson plans for the same group, same topic, same constraints — but for each educator. The plans should be visibly different in activity selection, content detail level, and pacing, while achieving the same learning objectives. This is the money shot for this workstream.
