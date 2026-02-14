# Bloom's Taxonomy Reference

Six levels of cognitive complexity, from lowest to highest. Use this reference
to calibrate assessment questions to the appropriate depth.

---

## Level 1: Knowledge (Remember)

**What it means:** The learner can recall facts, terms, concepts, or procedures.

**Verbs:** define, list, name, recall, recognize, identify, state, describe

**Question patterns:**
- "What is a DataFrame?"
- "Name three methods you can call on a pandas DataFrame."
- "What does the `cd` command do?"
- "List the basic Python data types."

**Assessment approach:** Direct recall. Short answers. No problem-solving required.

**Confidence signal:** Immediate, accurate recall = high confidence. Hesitation with
partial recall = moderate confidence. Cannot recall = no confidence.

---

## Level 2: Comprehension (Understand)

**What it means:** The learner can explain ideas or concepts in their own words.

**Verbs:** explain, summarize, paraphrase, interpret, classify, compare, describe

**Question patterns:**
- "Explain in your own words what happens when you run `df.groupby('category').mean()`."
- "What's the difference between `.loc` and `.iloc`?"
- "Why would you use a function instead of writing the same code twice?"
- "Describe what missing data looks like in a pandas DataFrame."

**Assessment approach:** Ask for explanations, not just definitions. The learner
should demonstrate they understand *why*, not just *what*.

**Confidence signal:** Clear, accurate explanation in their own words = high.
Repeats textbook definition without elaboration = moderate. Cannot explain = low.

---

## Level 3: Application (Apply)

**What it means:** The learner can use knowledge in a new situation.

**Verbs:** apply, use, demonstrate, execute, implement, solve, compute

**Question patterns:**
- "Write a line of code that filters this DataFrame to only rows where price > 100."
- "Show me how you'd install the pandas library."
- "Given this dataset, use groupby to find the average salary by department."
- "Navigate to the project directory and run the analysis script."

**Assessment approach:** Give a concrete task. The learner must DO something, not
just describe it. Provide data or context for them to work with.

**Confidence signal:** Produces correct, working solution independently = high.
Needs one hint but then completes it = moderate. Cannot complete even with hints = low.

---

## Level 4: Analysis (Analyze)

**What it means:** The learner can break information into parts, identify patterns,
and understand relationships.

**Verbs:** analyze, compare, contrast, examine, differentiate, investigate, categorize

**Question patterns:**
- "Look at this dataset. What data quality issues do you notice?"
- "Why might this visualization be misleading?"
- "Compare these two approaches to handling missing data. What are the tradeoffs?"
- "This analysis produces unexpected results. What could be causing the issue?"

**Assessment approach:** Present something complex and ask the learner to decompose
it. Good analysis questions have no single right answer — they test the ability to
reason about structure.

**Confidence signal:** Identifies multiple issues/patterns with clear reasoning = high.
Identifies surface-level issues = moderate. Cannot identify meaningful patterns = low.

---

## Level 5: Synthesis (Create)

**What it means:** The learner can combine elements to form a new, coherent whole.

**Verbs:** design, compose, construct, develop, formulate, create, produce, build

**Question patterns:**
- "Design a data cleaning pipeline for this messy dataset."
- "Write a reusable function that automates this common analysis pattern."
- "Create a notebook that tells the story of what this data reveals."
- "How would you structure an analysis of customer churn using this data?"

**Assessment approach:** Open-ended creation tasks. The learner must combine multiple
skills and make design decisions. There are many valid solutions.

**Confidence signal:** Produces a coherent, well-structured solution that
demonstrates multiple skills = high. Produces something that works but is disorganized
or misses key elements = moderate. Cannot get started or produces fragmented work = low.

---

## Level 6: Evaluation (Evaluate)

**What it means:** The learner can make and defend judgments based on criteria.

**Verbs:** evaluate, judge, justify, critique, recommend, defend, assess, argue

**Question patterns:**
- "Here are two approaches to this analysis. Which is better, and why?"
- "A colleague proposes using a bar chart for this data. Is that appropriate? What would you recommend instead?"
- "This data pipeline has a subtle flaw. Can you identify it and explain why it matters?"
- "Given the constraints (time, team skills, data quality), which analysis approach would you recommend?"

**Assessment approach:** Present options and ask for reasoned judgment. The learner
must weigh tradeoffs, apply criteria, and defend their position.

**Confidence signal:** Provides nuanced judgment with multiple supporting reasons = high.
Picks a side but with shallow reasoning = moderate. Cannot distinguish between options
or makes unsupported claims = low.

---

## Using Bloom's levels in assessment

### Mapping skills to levels

Every skill in the domain graph has a `bloom_level` property. When assessing that
skill, use question patterns from the corresponding level.

### Progressive depth

If you need to determine the exact depth of a learner's knowledge for a concept:
1. Start at the skill's assigned Bloom's level
2. If they succeed, try one level higher
3. If they fail, try one level lower
4. The highest level they consistently demonstrate is their depth for that skill

### Recording depth

In the learner profile, record both the skill AND the demonstrated Bloom's level:
```
- pandas-groupby: 0.9 confidence — demonstrated at Application level
- interpret-distributions: 0.6 confidence — demonstrated at Comprehension but
  struggled with Analysis
```
