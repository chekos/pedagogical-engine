# Workstream: The Affective Dimension

**Codename:** The Human Layer
**Depends on:** Core system stable, educator interview flow working

---

## The insight

The engine models learning as a graph of skills with dependencies. That's the cognitive architecture of learning. But learning has an affective architecture too — confidence, anxiety, motivation, social dynamics, past experiences — and that architecture shapes what happens in a classroom just as powerfully as whether someone knows how to write a for loop.

A student who failed publicly last time they tried Python has a confidence blocker. The skill graph says they have the prerequisites. Their emotional state says they'll freeze when you hand them a keyboard. A group where two students have a social conflict won't benefit from being paired, no matter how complementary their skill profiles are. A student who's taking the course because their boss made them will engage differently than one who chose to be there.

The engine can't detect all of this on its own. But it can *ask about it.* And once it knows, it can factor it into every decision it makes — pairing, activity selection, pacing, tone of the lesson plan, warm-up design, the stakes level of exercises.

---

## What this is

An affective constraint system that captures emotional and social context about learners and groups, and weaves that context into the engine's reasoning.

**New constraint types:**

- **Confidence level** per learner per skill area — not skill level, but how the learner *feels* about the skill area. A learner can be competent but unconfident, or incompetent but overconfident. Both matter for lesson design.
- **Motivation type** — intrinsic (they want to learn), extrinsic (they need to for work/school), social (they're here because someone else is). Shapes how the engine frames activities and objectives.
- **Social dynamics** — known conflicts, existing friendships, power dynamics (teacher's pet, class clown, quiet student). Shapes pairing recommendations.
- **Past experiences** — previous failures, breakthroughs, relevant emotional history with the subject. "James had a bad experience with a Python workshop last year where he felt publicly humiliated." This shapes activity design — lower the stakes early, build confidence gradually.
- **Accessibility and comfort** — beyond physical accessibility (already a constraint), emotional comfort: anxiety around speaking publicly, discomfort with competition, preference for collaborative vs. individual work.

**How the engine uses affective data:**

- **Pairing recommendations** account for social dynamics, not just skill complementarity. Don't pair students who have conflict. Don't pair a low-confidence student with a high-dominance student — they'll disengage.
- **Activity selection** accounts for confidence and motivation. A group with low confidence in the subject gets low-stakes warm-ups before challenging content. A group with high motivation gets pushed further, faster.
- **Lesson plan tone** adapts to the group's affective profile. The stage direction might read: "Start with a win — give them an exercise they'll definitely succeed at. Build confidence before introducing the challenging material."
- **Warm-up design** is informed by past experiences. If students have had bad experiences with the subject, the warm-up explicitly addresses it: "You might have tried Python before and found it frustrating. That's normal. Today we're starting from a different angle."
- **Stakes calibration** throughout the lesson — early activities are low-stakes (no wrong answers, exploration), building to higher-stakes activities (present your solution, teach your partner) only after confidence is established.

---

## What this is not

- Not the engine playing therapist — it captures and uses emotional context, it doesn't diagnose or treat emotional problems
- Not mandatory — if the educator doesn't share affective information, the engine works fine without it. The cognitive layer (skill graph, dependencies, Bloom's) is still the foundation
- Not invasive — the engine doesn't ask students directly about their emotional state. It asks the *educator* — the person who knows the students and can share relevant context
- Not overriding skill-based reasoning — a student's confidence level doesn't change what they know. It changes how the engine approaches them. A low-confidence competent student still gets advanced activities, but framed differently than for a high-confidence competent student
- Not a label that follows the student forever — affective data is session-contextual. Confidence changes. Social dynamics shift. The engine should re-ask about affective context for each new planning cycle

---

## Why this matters

This is the difference between a plan that's technically correct and a plan that actually works. Every experienced teacher thinks about the emotional dimension. They know which students need encouragement, which need challenge, which need to be separated, which need to be paired. They design their lessons around this knowledge as much as around the content.

The engine already thinks like a teacher about skills and dependencies. Adding the affective dimension makes it think like a teacher about *people*. That's the full picture.

For the hackathon, this humanizes the demo. When the engine's lesson plan says "Start with a low-stakes exercise because James had a bad experience last time" — judges feel the difference between this and a generic AI curriculum generator.

---

## What to tell Claude Code

> Add an affective dimension to the engine's reasoning.
>
> **Interview expansion:**
> Update the interview-educator SKILL.md to include affective questions. These should come naturally in the interview flow, not as a separate "emotional assessment" section:
>
> - "Are there any students who are particularly anxious or unconfident about this subject?"
> - "Has anyone in the group had a negative experience with this topic before?"
> - "Are there any interpersonal dynamics I should know about — students who work well together, or students who should probably not be paired?"
> - "What's the general motivation level? Are they here because they want to be, or because they have to be?"
> - "Anyone who's particularly quiet or tends to disengage? Anyone who tends to dominate group discussions?"
>
> These questions should be asked when the educator seems receptive and the information would materially affect the plan. Don't ask all of them every time — use judgment.
>
> **New constraint type:**
> Add an affective constraint type to the constraint system. Affective constraints are always soft (never hard) — they influence decisions but don't block them. They attach to individual learners or to the group.
>
> **Reasoning integration:**
> When composing lesson plans:
> - Pairing recommendations should check affective constraints alongside skill complementarity. Flag conflicts, avoid pairing low-confidence learners with high-dominance learners.
> - Activity design should account for group confidence level. Low-confidence groups get more scaffolding, lower-stakes early activities, explicit confidence-building moments.
> - Lesson plan stage direction should include affective notes: "This is where James might disengage — check in with him directly" or "This activity builds confidence — make sure everyone gets a small win before moving on."
> - Warm-up selection should be informed by past experiences. A group with bad prior experiences gets an explicitly de-stressing opener.
>
> **Learner profile expansion:**
> Add optional affective fields to the learner profile: confidence_level (per skill area or overall), motivation_type, social_notes, past_experiences. These are populated from the educator interview, not from student assessment.
>
> The affective data should feel like a natural part of the engine's reasoning, not a bolted-on module. When the engine explains a pairing decision (meta-pedagogical layer), it should be able to reference both skill complementarity AND social dynamics: "I paired Maria with Alex because their skills complement each other and you mentioned they work well together."
