# Skill: Post-Session Debrief

Use this skill when an educator has finished teaching a lesson and wants to
reflect on what happened. The debrief closes the feedback loop between lesson
execution and system state — it's what turns the engine from a single-use
tool into a longitudinal teaching partner.

## When to activate

- The educator says they've finished teaching a session
- The educator wants to debrief or reflect on a lesson they taught
- Enough time has passed since a lesson was planned that it's likely been taught
- The engine notices a lesson plan exists but no debrief has been recorded

## Debrief conversation flow

The debrief is a **conversation**, not a form. Guide it naturally through five
stages. Be adaptive — if the educator gives detailed answers, ask fewer
follow-ups. If they're brief, probe more. Respect their time.

### Stage 1: Overall check (1 question)

Start open-ended: "How did the session go overall?"

Listen for the frame — was this a success, a struggle, or mixed? Adjust your
follow-up questions accordingly:
- Success frame → ask what worked and why, probe for surprises
- Struggle frame → be empathetic first, then ask what happened
- Mixed frame → ask about the highs and lows

### Stage 2: Section-by-section walkthrough

Present the lesson plan's sections one at a time. For each section, ask:
- Did it take the expected time, or more/less?
- Did students engage or disengage?
- Were there surprises — things that worked unexpectedly well, or fell apart?
- Did you use the contingency plan? Did it work?

**Adaptive pacing:** If the educator gives a quick "that went fine" for a
section, move on. If they have a story to tell, let them tell it. Don't
ask all four sub-questions for every section.

### Stage 3: Student-level observations

"Any individual observations? Students who stood out — positively or
negatively?"

Map observations to learner profiles:
- "[Student] struggled with [topic]" → lower confidence on related skills
- "[Student] helped others with [topic]" → upgrade to higher Bloom's level
  (can evaluate/teach)
- "[Student] disengaged during [activity type]" → affective note about
  preferences
- "[Student] had a breakthrough" → significant confidence boost

### Stage 4: Unplanned moments

"Did anything happen that wasn't in the plan?"

These are often the most valuable data points:
- A student question that revealed a gap the engine didn't predict
- A group dynamic that emerged
- An activity that spontaneously worked better than the planned one
- A teaching moment that arose from a mistake or confusion

### Stage 5: Educator reflection

"What would you change if you taught this again?"

This is both useful data for the engine and a professional development
moment for the educator. Listen for:
- Timing adjustments
- Activity modifications
- Pacing changes
- Different sequencing
- New prerequisite requirements

## Extracting structured data

The debrief conversation produces natural language. The engine must extract
structured data from it:

### Learner profile updates

For each student observation, produce:
```
{
  learnerId: string,
  skillId: string,         // mapped from topic mention
  confidenceChange: number, // -0.2 to +0.3 (observational range)
  bloomLevelChange?: string, // if Bloom's level should shift
  evidenceType: "observational",
  note: string             // the educator's exact words
}
```

**Observational confidence discount:** All debrief-sourced updates carry a
confidence discount vs. assessment evidence:
- Assessment evidence: direct confidence value (e.g., 0.85)
- Observational evidence: max confidence change of +/- 0.3 per debrief
- Multiple observations of the same pattern across debriefs accumulate

### Timing adjustments

For each section with timing feedback:
```
{
  sectionId: string,
  plannedDuration: number,
  actualDuration: number | "similar" | "longer" | "shorter",
  notes: string
}
```

### Teaching notes

Domain-level insights that apply to future sessions:
```
{
  domain: string,
  skillId: string,
  noteType: "what_worked" | "what_struggled" | "prerequisite_gap" | "activity_idea",
  note: string
}
```

## Confidence calibration

Observational evidence is softer than assessment evidence. Calibrate
confidence based on the specificity of the educator's recall:

- **High specificity:** "Marcus got stuck on line 14 of the groupby exercise
  because he didn't understand that groupby returns a GroupBy object, not a
  DataFrame" → confidence change of 0.2-0.3
- **Medium specificity:** "Marcus struggled with groupby" → confidence
  change of 0.1-0.15
- **Low specificity:** "I think some students had trouble with that section"
  → confidence change of 0.05-0.1, applied to whole group

## What to do with debrief data

1. **Update learner profiles** with observational evidence (tagged as such)
2. **Record timing deltas** — if sections consistently run long/short, adjust
   the engine's pacing model for this domain/group
3. **Record teaching notes** on skills — what worked, what didn't, for
   future lesson composition
4. **Record the debrief itself** — save to `data/debriefs/{lesson-id}.md`
   as a structured document
5. **Generate a summary** — after the debrief conversation, produce a summary
   showing what was updated, what was learned, and what changes will inform
   future plans

## Tone

Warm, supportive, curious. Like a teaching coach asking "tell me about your
day" — not an evaluator filling out a rubric. The educator should feel heard,
not interrogated.

Never evaluate the educator's teaching. Never say "you should have done X."
The engine is gathering information, not giving grades.
