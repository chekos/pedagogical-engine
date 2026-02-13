# Workstream: Assessment Integrity

**Codename:** The Honest Signal
**Depends on:** Core system stable, assessment flow working

---

## The insight

The assessment engine asks a student questions to determine what they know. The student has ChatGPT in another tab. The student has Google. The student might have a friend next to them. In 2026, the assumption that a student answers assessment questions using only their own knowledge is naive.

But here's the thing — the engine's assessment is conversational, not multiple-choice. That's already more robust. A multiple-choice question has one right answer that can be looked up instantly. A conversational probe can follow up, ask for elaboration, change the context, and detect shallow understanding. The engine has the dependency graph, which means it can ask questions that *chain* — where the answer to question 2 depends on how you answered question 1, making it impossible to look up answers independently.

Push this further. The engine should design assessments that are inherently resistant to gaming — not through proctoring or surveillance, but through the *nature of the questions themselves.* Questions that require synthesis of the student's own context. Questions where speed and engagement patterns are informative. Questions that probe understanding at a depth that surface-level lookup can't satisfy.

The goal isn't to catch cheaters. It's to design assessments where the honest path is easier than the dishonest path, and where even a student who tries to game the system reveals useful information about what they actually know.

---

## What this is

An assessment integrity layer that influences how the assessment agent designs and conducts evaluations. It shapes the *kinds* of questions asked, the *patterns* the engine looks for in responses, and the *adaptive strategy* the engine uses when it detects potential gaming.

**Question design principles:**

- **Contextual synthesis questions:** Instead of "What does pd.merge() do?" ask "You mentioned you work with sales data. How would you combine your sales data with your customer database? Walk me through your thinking." This requires the student to synthesize their own context with the skill — you can't Google your own situation.

- **Chained reasoning:** Each question builds on the previous answer. "You said you'd use a left join. What happens to the rows in the customer table that don't match? How would that affect your analysis?" The dependency between questions means each answer must be consistent with the previous ones — looking up answers independently produces inconsistencies.

- **Explain-to-teach questions:** "If you had to explain what filtering does to someone who's never seen a spreadsheet, how would you describe it?" This tests comprehension at a level that simple recall or lookup can't satisfy. The student has to model another person's understanding.

- **Error diagnosis questions:** Show a piece of (hypothetical) code or reasoning with a subtle error. "What's wrong with this approach?" This tests application-level understanding — the student needs to actually understand the concept to spot the issue, not just define it.

- **Transfer questions:** "You know how to filter data in Python. If you had to do the same thing in a spreadsheet with no code, how would you approach it?" This tests whether the student understands the concept abstractly or only knows the syntax.

**Response pattern analysis:**

The engine should pay attention to patterns in how students respond — not to play gotcha, but to calibrate confidence:

- **Response latency patterns:** A student who answers foundational questions instantly but takes a long time on application questions likely has knowledge-level understanding but not application-level. A student who takes equally long on everything might be looking things up. A student who answers complex questions faster than simple ones has deep fluency. These patterns are informative.

- **Engagement depth:** Short, correct answers vs. elaborated, nuanced answers carry different information about Bloom's level. "Yes, I'd use a left join" vs. "I'd use a left join because I want to keep all customers even if they haven't made a purchase yet, and then I'd check for nulls in the sales columns" — both are correct, but they indicate different depth.

- **Consistency across the conversation:** If a student demonstrates synthesis-level understanding on one question but struggles with a prerequisite on the next, that's a signal. Either the knowledge is fragile or the earlier answer wasn't genuine.

---

## What this is not

- Not surveillance or proctoring — the engine doesn't monitor browser tabs, screen record, or use cameras
- Not adversarial — the assessment should still feel conversational, friendly, and low-stakes. The integrity layer shapes the questions, not the tone
- Not accusatory — the engine never says "I think you're cheating." It simply designs questions that elicit honest signals and calibrates confidence based on response patterns
- Not punitive — even if the engine suspects gaming, the consequence is "lower confidence in the assessment" not "student is flagged." The educator sees "I'm less confident about James's self-reported skill level — consider verifying in person"
- Not a lie detector — the engine is reasoning about understanding depth, not about honesty as a character trait

---

## Why this matters

Assessment is the foundation of everything the engine does. The skill profiles drive lesson plan composition, pairing recommendations, curriculum sequencing — everything. If the assessments aren't reliable, nothing built on them is reliable.

In a world where every student has access to AI, the old approaches to assessment (test questions with known right answers, proctoring, time pressure) don't work. The new approach is: design assessments where genuine understanding is the easiest path to a good outcome. Make the assessment a *conversation* that's more natural and less stressful to engage with honestly than to try to game.

For the hackathon, this demonstrates depth of thinking about a problem that everyone in education is grappling with. It shows the engine isn't naive about the world it operates in.

---

## What to tell Claude Code

> Enhance the assessment engine with an integrity layer that designs assessments resistant to gaming through the nature of the questions themselves.
>
> Update the assess-skills SKILL.md with a new section on assessment integrity methodology:
>
> **Question design strategies:**
> 1. Contextual synthesis — ask the student to apply the skill to their own situation or context. "You mentioned you're analyzing [thing they said earlier]. How would you approach [skill] in that context?"
> 2. Chained reasoning — design question sequences where each answer depends on the previous. Make it impossible to answer questions independently.
> 3. Explain-to-teach — "How would you explain this to someone who doesn't know anything about it?" Tests comprehension depth beyond recall.
> 4. Error diagnosis — present flawed reasoning or examples and ask what's wrong. Tests application-level understanding.
> 5. Transfer probes — ask the student to apply a concept in a different context than the one they learned it in.
>
> **Response pattern awareness:**
> The assessment agent should track (without revealing to the student):
> - Response depth — is the student elaborating or giving minimal answers?
> - Consistency — do answers across the conversation tell a coherent story about the student's understanding?
> - Engagement patterns — does the student's comfort level match what you'd expect at their demonstrated level?
>
> These patterns should influence the confidence values assigned to assessed skills. High depth + high consistency = high confidence. Minimal answers + inconsistency = lower confidence, flagged for the educator.
>
> **When confidence is low:**
> Don't flag the student. Instead, note in the learner profile that the assessment confidence is below threshold, with a recommendation for the educator: "James's assessment showed some inconsistencies in the data manipulation section. Consider a brief in-person check before building activities on those skills."
>
> **The assessment should still feel warm and conversational.** The integrity layer shapes what questions are asked, not how they're asked. The student should feel like they're having a helpful conversation, not being interrogated.
>
> If the assessment generates a question that can be answered with a simple Google search and doesn't chain on previous context, that's a design failure. Every question should require synthesis, context, or chained reasoning.
