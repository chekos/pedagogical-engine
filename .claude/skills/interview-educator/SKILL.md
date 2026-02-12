# Skill: Interview Educator

Use this skill when an educator arrives and describes what they want to teach.
Before composing any output — lesson plan, assessment, or roster analysis — you
must interview the educator to capture the full context. Never jump to generation.

## When to activate

- Educator says "I want to teach..." or "Help me plan..."
- A new group or session is being set up
- Context is missing for lesson composition or assessment

## Interview methodology

### Principles

1. **Ask one question at a time.** Never dump a list of questions.
2. **Acknowledge what was shared** before asking the next question.
3. **Don't repeat** — if the educator already told you something, don't ask again.
4. **Infer when possible** — if they say "90-minute workshop," you don't need to ask
   "how much time do you have?"
5. **Be conversational**, not bureaucratic. This is a dialogue, not a form.

### Required fields

You must capture ALL of the following before proceeding to lesson composition.
Read `templates/interview-checklist.md` for the full checklist with probe questions.

| Field | Description | Example |
|---|---|---|
| **Topic** | What the educator wants to teach | "Data cleaning with pandas" |
| **Audience** | Who the learners are | "My Tuesday evening cohort — 12 adult learners" |
| **Prior knowledge** | What learners already know (or link to group profile) | "Most can write basic Python but haven't used pandas" |
| **Setting** | Where this is happening | "In-person computer lab" / "Over Zoom" / "In a park" |
| **Duration** | How much time is available | "90 minutes" |
| **Tools & connectivity** | What tech is available | "All have laptops, reliable Wi-Fi" |
| **Goals** | What success looks like for the educator | "Students can clean a messy dataset independently" |
| **Constraints** | Anything that limits options | "No paid subscriptions" / "One student is colorblind" |

### Question patterns

**Opening:** Start by understanding intent.
- "What are you hoping to teach, and what does success look like?"
- "Tell me about your students — who are they and what do they already know?"

**Deepening:** Fill in gaps naturally.
- "Where will this session happen — in-person, online, something else?"
- "How much time do you have?"
- "Will students need any specific tools or accounts set up beforehand?"

**Probing for constraints:** Surface hidden requirements.
- "Any accessibility needs I should know about?"
- "Does everyone have reliable internet access?"
- "Are there any paid tools or subscriptions involved?"

**Closing:** Confirm readiness.
- "Let me make sure I have this right: [summary]. Anything I'm missing?"

### Stopping conditions

Stop interviewing and proceed to composition when:

1. All required fields have been captured (directly or inferred)
2. The educator confirms the summary is accurate
3. OR the educator says something like "that's everything" or "let's go"

If a required field is still missing, ask for it before proceeding — but frame it
as the last thing you need, not as a blocker.

### What to do with the data

- Write interview results to the group file: `data/groups/{group-name}.md`
- Create or update learner profiles if names/details are provided
- Build the constraint set for downstream tools
- Pass the complete context to the lesson-agent or assessment-agent as needed

## Reference files

- `templates/interview-checklist.md` — Full checklist with probe questions per field
