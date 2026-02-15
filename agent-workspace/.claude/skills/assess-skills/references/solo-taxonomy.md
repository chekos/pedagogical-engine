# SOLO Taxonomy Reference

**Structure of Observed Learning Outcomes** (Biggs & Collis, 1982)

SOLO classifies the *structural complexity* of a learner's response — what you
can directly observe in what they say or write. Unlike Bloom's (which describes
internal cognitive processes), every SOLO level is defined by visible qualities
of the output.

Use this reference to classify learner responses during assessment.

---

## The Five SOLO Levels

### 1. Prestructural

The response misses the point entirely. The learner may restate the question,
provide unrelated information, or demonstrate a fundamental misunderstanding.
There is no relevant understanding visible.

**Structural markers:**
- Response is off-topic or tautological
- Restates the question in different words without answering it
- Provides unrelated information from a different domain
- Shows fundamental confusion about what is being asked

**Example — missing data in pandas:**
> Q: "How would you handle missing values in a pandas DataFrame?"
> A: "I would use Python to do data analysis."

The response doesn't address missing values at all — it's a vague restatement
of the general domain.

---

### 2. Unistructural

The response addresses one relevant aspect correctly but narrowly. The learner
has picked up a single piece of relevant knowledge and offers it without
elaboration or connection to other aspects.

**Structural markers:**
- Exactly one relevant element mentioned
- No elaboration or qualification
- Correct but incomplete — addresses only a fragment of the skill
- Often a single function name, a single step, or a single fact

**Example — missing data in pandas:**
> Q: "How would you handle missing values in a pandas DataFrame?"
> A: "You can use dropna() to remove them."

One correct, relevant technique. No alternatives, no context for when to use it,
no connection to the broader problem.

---

### 3. Multistructural

The response addresses several relevant aspects but treats them as an
independent list without integration. The learner knows multiple pieces but
hasn't connected them into a coherent framework.

**Structural markers:**
- Multiple relevant elements mentioned (typically 2-4)
- Listed sequentially or with "and" / "or" connectors
- No explanation of *when* to use each, *why* to prefer one, or *how* they relate
- Each element could stand alone — removing one doesn't affect the others
- May use "you can also" or "another way is" phrasing

**Example — missing data in pandas:**
> Q: "How would you handle missing values in a pandas DataFrame?"
> A: "You can use dropna() to remove rows, fillna() to replace them with a
> value, or interpolate() to estimate them."

Three correct techniques. But no guidance on choosing between them — they're
presented as interchangeable options when they're not.

---

### 4. Relational

The response integrates aspects into a coherent structure, showing how elements
relate to each other and to the broader context. The learner has organized their
knowledge into a framework where the parts connect meaningfully.

**Structural markers:**
- Elements are connected by reasoning ("because", "depends on", "in the case of")
- Trade-offs or conditions are articulated ("if X then Y, but if Z then W")
- The response has a logical flow — removing one element would break the argument
- Context shapes which approach is recommended
- Shows awareness that different situations call for different approaches

**Example — missing data in pandas:**
> Q: "How would you handle missing values in a pandas DataFrame?"
> A: "It depends on why the data is missing and what you're trying to do. If the
> missing data is random and you have enough rows, dropna() is fine. If the
> missing values are meaningful — like survey non-responses — you might want to
> flag them separately. For time series data, interpolation makes more sense
> than filling with a mean because it preserves temporal patterns."

The three techniques from the multistructural response are now connected to
contexts. The choice of method is *driven* by the situation. The learner shows
structural understanding of the problem space.

---

### 5. Extended Abstract

The response generalizes beyond the specific context, showing transfer to novel
situations or principled reasoning that transcends the immediate question. The
learner applies their knowledge framework to new domains, identifies higher-order
patterns, or reasons from underlying principles.

**Structural markers:**
- Generalizes to contexts not mentioned in the question
- References underlying principles or theoretical frameworks
- Connects to other domains or areas of practice
- Shows metacognitive awareness (reasoning about reasoning)
- May critique the question itself or reframe the problem
- Discusses implications beyond the immediate task

**Example — missing data in pandas:**
> Q: "How would you handle missing values in a pandas DataFrame?"
> A: "The handling strategy should be driven by your analysis goals and the
> data-generating process. Missing data mechanisms — whether MCAR, MAR, or
> MNAR — determine which approaches are statistically valid. In production
> pipelines, you'd also want to track missingness rates as a data quality
> signal, not just patch them silently."

The response transcends pandas-specific techniques to reason about the
statistical theory of missing data, and connects to production engineering
practices. The learner isn't just answering about pandas — they're reasoning
from principles.

---

## The Bloom's × SOLO Matrix

Bloom's defines the cognitive level of the *skill itself*. SOLO evaluates the
structural quality of the *learner's response*. Together they create a
two-dimensional assessment.

```
                    SOLO Level of Response
                    Pre  Uni  Multi  Rel  ExtAbs
Bloom's Level  ┌────────────────────────────────┐
of Skill       │                                │
               │  Remember    ·    ✓    ✓    ✓  │
               │  Understand  ·    ·    ✓    ✓  │
               │  Apply       ·    ·    ✓    ✓  │
               │  Analyze     ·    ·    ·    ✓    ✓
               │  Evaluate    ·    ·    ·    ✓    ✓
               │  Create      ·    ·    ·    ·    ✓
               └────────────────────────────────┘

               · = unexpected/insufficient
               ✓ = expected/appropriate
```

### Reading the matrix

**Match:** The SOLO level falls in the ✓ zone for the skill's Bloom's level.
The learner's response quality is appropriate for the skill being tested.
Record confidence normally.

**Below expectation (· zone):** The SOLO level is lower than expected. The
learner's response lacks the structural complexity the skill demands. This
signals gaps — probe prerequisites.

**Above expectation:** The SOLO level exceeds what the Bloom's level requires
(e.g., extended abstract response to a remember-level question). This signals
the learner may have deeper understanding than the question probed. Skip ahead
to higher-level skills to find their actual frontier.

### Expected SOLO minimums by Bloom's level

| Bloom's level | Minimum SOLO | Proficient SOLO | Rationale |
|---|---|---|---|
| Remember | Unistructural | Multistructural | Recall requires at least one correct element |
| Understand | Multistructural | Relational | Explanation needs multiple connected ideas |
| Apply | Multistructural | Relational | Execution needs awareness of multiple steps/considerations |
| Analyze | Relational | Relational | Structural decomposition requires integration |
| Evaluate | Relational | Extended Abstract | Judgment requires integrated framework, mastery generalizes |
| Create | Extended Abstract | Extended Abstract | Novel creation requires principled generalization |

---

## Using SOLO in Assessment Decisions

### SOLO matches or exceeds expectation
- Confidence is high for this skill
- Infer prerequisites via dependency graph (standard decay)
- Move to adjacent or higher skills

### SOLO falls below expectation
- Confidence should be reduced
- Do NOT infer prerequisites — the learner may have gaps below
- Traverse DOWN the dependency chain to find where structural understanding begins

### SOLO significantly exceeds expectation
- The learner may be more advanced than the skill graph suggests
- Test higher-level skills to find their actual frontier
- Adjust confidence upward — this learner's understanding has depth

### SOLO level influences confidence mapping

| SOLO vs. expected | Confidence effect |
|---|---|
| At or above proficient | Full confidence (0.85-1.0) |
| At minimum | Moderate confidence (0.5-0.7) |
| Below minimum | Low confidence (0.1-0.3) |
| Prestructural | Skill not met (0.0-0.1) |

---

## Recording SOLO in Learner Profiles

When recording assessment results, include both Bloom's and SOLO:

```markdown
## Assessed Skills
- pandas-handle-missing-data: 0.85 confidence — bloom_target: application, solo_demonstrated: relational
  - Evidence: Learner connected method choice to data context and analysis goals
```

The `bloom_target` comes from the skill graph (what the skill demands).
The `solo_demonstrated` comes from the assessment agent's evaluation (what the response showed).
The `evidence_summary` captures what structural features the agent observed.
