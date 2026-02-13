# Assessment Integrity Strategies

A detailed reference for designing assessment questions that are inherently resistant
to gaming through the nature of the questions themselves — not through surveillance.

---

## Design principle: The honest path should be easier

Every question the engine asks should be designed so that engaging honestly is
faster and more natural than trying to look things up. A conversational probe
that references the student's own context, chains on their previous answers,
or asks them to explain *to* someone else is harder to fake than a definition
question that can be copied from Google.

---

## Strategy 1: Contextual synthesis

**What:** Ask the student to apply the skill to *their own* situation.

**Why it works:** You can't Google your own circumstances. The student has to
synthesize domain knowledge with personal context, which requires genuine understanding.

**Examples for data analysis domain:**

| Instead of... | Ask... |
|---|---|
| "What does pd.merge() do?" | "You mentioned you work with sales data. How would you combine your sales data with your customer database? Walk me through your thinking." |
| "What is a left join?" | "In your [data context], what would happen if some customers haven't made any purchases? How would you handle that when combining the data?" |
| "How do you filter a DataFrame?" | "Let's say you need to find all the [relevant items from their context] that meet a certain condition. How would you approach that?" |

**Implementation:**
1. In the first 1-2 questions, ask the student what kind of data they work with or are interested in
2. Use their answer to contextualize all subsequent questions
3. If they say "I'm just learning" or have no domain context, use a relatable scenario: "Imagine you're helping a friend who runs a small online shop..."

---

## Strategy 2: Chained reasoning

**What:** Design sequences where each question depends on the previous answer.

**Why it works:** Looking up answers independently produces inconsistencies. Each
answer constrains the space of valid follow-up answers, making it impossible to
piece together a coherent conversation from independent searches.

**Chain patterns:**

```
Q1: "How would you approach combining these two datasets?"
A1: [Student describes their approach]

Q2: "You mentioned [specific detail from their answer]. What happens if [edge case
    related to their chosen approach]?"
A2: [Must be consistent with Q1 answer]

Q3: "Given that [consequence from A2], how would you adjust your approach?"
A3: [Must account for both A1 and A2]
```

**Implementation:**
- Always reference the student's specific words from their previous answer
- Ask about consequences and edge cases of their stated approach
- If they change their approach mid-chain, that's informative (either good learning
  or inconsistency — the pattern analysis will distinguish these)

---

## Strategy 3: Explain-to-teach

**What:** Ask the student to explain a concept as if teaching someone else.

**Why it works:** Teaching requires deep comprehension — the ability to simplify,
find analogies, anticipate confusion, and structure an explanation. This is hard
to fake because you need to model another person's understanding.

**Prompt templates:**
- "If you had to explain [concept] to someone who's never seen a [relevant tool], how would you describe it?"
- "Your friend asks: 'Why would I ever need to [skill]?' What would you tell them?"
- "Imagine someone is confused about [concept]. They think [common misconception]. How would you help them understand?"

**What to listen for:**
- Analogies and metaphors (show deep understanding)
- Anticipating confusion (shows they understand common pitfalls)
- Structured explanation (introduction -> detail -> example)
- Acknowledging edge cases or limitations

---

## Strategy 4: Error diagnosis

**What:** Present flawed reasoning or code with a subtle error.

**Why it works:** Finding what's wrong requires understanding what's right. The
student can't look up "what's wrong with this code" because the code is unique to
this assessment.

**Example patterns for data analysis:**

```python
# "What's wrong with this approach?"
df_merged = df_customers.merge(df_orders, on='customer_id', how='inner')
missing_customers = df_merged[df_merged['order_id'].isna()]
```
*(Bug: inner join never produces NaN order_ids — should be left join)*

```python
# "Will this give you what you want?"
avg_by_group = df.groupby('category')['price'].sum() / len(df)
```
*(Bug: divides by total rows, not group sizes — should use .mean())*

**Implementation:**
- Create errors that are plausible (the kind a real beginner would make)
- The error should require understanding the concept, not just syntax
- Present the code as "a colleague's approach" — keep it non-threatening
- Vary error types: logic errors, wrong method choice, incorrect assumptions

---

## Strategy 5: Transfer probes

**What:** Ask the student to apply a concept in a different context.

**Why it works:** Transfer requires abstract understanding — the student must
separate the concept from the specific tool/syntax they learned it in. If they
only memorized "how to do X in pandas," they can't transfer it.

**Transfer patterns:**

| Known context | Transfer to... |
|---|---|
| Filter in Python | "How would you do this in a spreadsheet?" |
| Pandas groupby | "If you had to explain the logic to a SQL developer, what would the equivalent be?" |
| Python functions | "If you were writing instructions for a human assistant to do this manually, what steps would you give them?" |
| Data visualization | "If you couldn't show a chart, how would you describe this pattern in words?" |

---

## Response pattern analysis

### What to track

The assessment agent tracks these patterns **silently** — never revealing the
tracking to the student.

#### 1. Response depth score

Rate each response on a 1-3 scale:

| Score | Pattern | Example |
|---|---|---|
| 1 (minimal) | Short, correct but bare | "I'd use a left join" |
| 2 (adequate) | Correct with some reasoning | "I'd use a left join to keep all customers" |
| 3 (deep) | Correct with full reasoning, edge cases, alternatives | "I'd use a left join because I want to keep all customers even if they haven't purchased. Then I'd check for nulls..." |

**Aggregate:** Average depth across all responses. >2.0 = strong signal of genuine understanding.

#### 2. Consistency score

Track consistency across the conversation:

- **Conceptual consistency:** Does the student use concepts correctly across questions?
  If they explain joins perfectly in Q3 but seem confused about filtering in Q5
  (which is simpler), that's inconsistent.

- **Vocabulary consistency:** Do they use consistent terminology? Genuine learners
  develop a personal vocabulary; someone looking things up might use different
  terminology sources per question.

- **Skill level consistency:** Does their demonstrated Bloom's level stay consistent
  or follow a natural progression? Jumping from evaluation-level to knowledge-level
  is a flag.

**Scoring:** Count the number of inconsistencies. 0-1 = high consistency. 2-3 = moderate. 4+ = low.

#### 3. Engagement quality

- **Elaboration without prompting:** Does the student add context, examples, or
  qualifications without being asked? Genuine learners often do this.
- **Self-correction:** Does the student catch and fix their own mistakes? This is
  a strong signal of genuine understanding.
- **Appropriate uncertainty:** Does the student say "I'm not sure about this part"
  when the topic is genuinely difficult? Appropriate uncertainty is a positive signal.

### Integrity confidence modifier

Combine the three scores into a modifier applied to skill confidence:

```
integrityModifier = (depthScore/3 * 0.4) + (consistencyScore * 0.35) + (engagementScore * 0.25)

// Where:
// depthScore: 1-3 average
// consistencyScore: 1.0 (high), 0.7 (moderate), 0.4 (low)
// engagementScore: 1.0 (strong signals), 0.7 (neutral), 0.4 (concerning)

// Apply to confidence:
// adjustedConfidence = rawConfidence * integrityModifier
```

---

## What to write in the learner profile

### High integrity (modifier >= 0.8)

No special note needed. The confidence values speak for themselves.

### Moderate integrity (0.6 <= modifier < 0.8)

Add a note in the profile:

```markdown
## Assessment Integrity Notes

Assessment confidence: moderate. Some responses were brief, which may indicate
the student knows more than demonstrated or was not fully engaged. Consider a
brief follow-up conversation to verify data manipulation skills.
```

### Low integrity (modifier < 0.6)

Add a stronger note:

```markdown
## Assessment Integrity Notes

Assessment confidence: low. Significant inconsistencies observed between
demonstrated skill levels across the conversation. Recommend an in-person
verification of the following skills before building lesson activities on them:
- pandas-merge-join (demonstrated synthesis-level understanding but struggled
  with prerequisite filtering concepts)
- handle-missing-data (gave correct terminology but couldn't apply to their
  own context)

This is NOT a judgment of the student's character. It simply means the
assessment results should be verified before being relied upon for lesson planning.
```

---

## Key rules

1. **Never tell the student** they are being evaluated for integrity
2. **Never accuse** or imply dishonesty
3. **Always maintain** the warm, conversational tone
4. **Use the modifier** to adjust confidence, not to pass/fail
5. **The educator decides** what to do with the information — the engine just surfaces it
6. **Err on the side of** giving the student the benefit of the doubt
