# Skill: Compose Lesson

Use this skill when building a lesson plan for an educator. A lesson plan is not
a curriculum outline — it's a stage-directed session plan with minute-by-minute
beats, transitions, prerequisites, and contingency instructions.

## When to activate

- The educator interview is complete (all required fields captured)
- Educator says "build the lesson" or "create the plan"
- The lesson-agent subagent is composing a plan

## Prerequisites for composition

Before composing, verify you have:

1. **Complete interview data** — topic, audience, prior knowledge, setting,
   duration, tools, goals, constraints (use interview-educator skill if missing)
2. **Group profile** — learner profiles with skill assessments (or at minimum,
   the educator's description of what students know)
3. **Skill graph** — the relevant domain loaded from `data/domains/{domain}/`

If any of these are missing, stop and gather them first.

## Output structure

Read `templates/lesson-plan-template.md` for the full output format. Every
lesson plan includes these sections:

### 1. Session overview
- Topic, audience, setting, duration
- Learning objectives mapped to Bloom's taxonomy levels
- The "one thing" — the single most important outcome

### 2. Prerequisites checklist
- What students need BEFORE the session starts
- Software installations with specific versions and links
- Account setups with signup URLs
- Pre-reading or preparation tasks
- Physical materials (if applicable)
- Each item has a "how to verify" note

### 3. Timed session plan (stage direction)
- Minute-by-minute beats with transitions
- Written like stage direction: what the educator does, what students do, what
  to watch for
- Time checks ("by minute 14, you should be transitioning to...")
- Energy management (don't put the hardest thing after the longest lecture)

### 4. Activities
- Calibrated to the group's assessed skill level
- Paired or grouped activities use complementary skills
- Each activity has: objective, time, instructions, success criteria, common pitfalls

### 5. Contingency notes
- "If students struggle with X, pivot to Y"
- "If you're running behind, cut Z — it's the least critical"
- "If a student finishes early, have them try this extension"

### 6. Logistics & links
- All URLs, tools, and resources mentioned in the plan
- Setup verification steps
- Contact/support resources if tech fails

## Pedagogical pushback — the colleague who pushes back

Before composing any lesson plan, you MUST analyze the educator's intent for
pedagogical tensions. Use the `analyze_pedagogical_tensions` tool with the
intended target skills, group, domain, duration, and constraints. This is not
optional — it's how you think.

### When to push back

- **Dependency ordering violations.** If the educator's intended skill sequence
  breaks prerequisite chains, explain which chains break, which learners are
  affected, and propose a reordering. Show the dependency path being violated.
- **Scope-time mismatch.** If the number of skills exceeds what's feasible in
  the available time (based on Bloom's level complexity and group readiness),
  say so. Propose a reduced scope with rationale for what to cut and keep.
- **Prerequisite gap risk.** If learner profiles show unconfirmed prerequisites,
  quantify the risk — "3 of 5 learners have not confirmed skill X." Propose:
  assess first, or add a review segment (with time cost).
- **Bloom's level mismatch.** If the educator wants synthesis-level activities
  for a group mostly at knowledge/comprehension, explain the gap and suggest
  scaffolding intermediate activities first.
- **Constraint violations.** If the plan requires resources that conflict with
  stated constraints (tools, connectivity, subscriptions), flag them early.

### How to push back

1. State what the educator is asking for
2. State what the data shows that creates tension
3. Present specific evidence (which skills, which learners, which dependencies)
4. Propose an alternative with clear rationale
5. Defer to the educator: "I've shared my reasoning. You know your students
   better than I do. What would you like to do?"

### When NOT to push back

- Style preferences (lecture vs discussion) — that's the educator's call
- Domain content choices the engine can't evaluate
- Interpersonal dynamics not visible in the data
- Repeatedly on the same point — if the educator overrides, respect it. Once
  is advice, twice is nagging.

### Tone

Collaborative, evidence-based, respectful. Like a trusted colleague: "I can do
what you're asking, but let me show you what I'm seeing, and then you decide."

## Teaching wisdom integration

Before composing, query the domain's accumulated teaching wisdom using
`query_teaching_wisdom`. This returns notes and patterns from previous sessions
that should inform your plan:

### How to apply teaching wisdom

1. **Timing adjustments.** If notes say a section consistently runs long (e.g.,
   "groupby exercises run 5-8 min over for beginner groups"), adjust the time
   allocation in your plan. Cite the wisdom: "Allocated 20 min instead of 15
   based on patterns from 18 previous sessions."

2. **Activity selection.** If success patterns recommend a specific approach (e.g.,
   "warm-up exercises using the same dataset dramatically improve outcomes"),
   incorporate it. If failure patterns warn against an approach (e.g., "lecture
   sections in mid-session lose engagement"), avoid it.

3. **Confusion point prevention.** If notes identify common confusion points
   (e.g., "students confuse DataFrame vs Series return from groupby"), add
   explicit exercises or explanations that address the confusion proactively.

4. **Group composition notes.** If patterns describe optimal pairing strategies
   (e.g., "pair programming works when gap is 1 Bloom's level, not 2+"), apply
   them to your pairing recommendations.

5. **Contingency calibration.** Teaching wisdom helps you predict which
   contingencies are most likely to be needed. Prioritize contingency planning
   for sections that frequently use contingency plans.

### Transparency

When teaching wisdom influences your plan, tell the educator:
- "Based on experience from [N] previous sessions, I've [specific adjustment]."
- "Teaching notes suggest [observation]. I've incorporated this by [action]."
- Include a "Teaching Wisdom Applied" section at the end of the plan listing
  which notes influenced which decisions.

### When to ignore wisdom

Teaching wisdom is input, not rules. Override it when:
- The educator has specific reasons for a different approach
- The group profile contradicts the pattern (e.g., an advanced group where
  timing notes apply only to beginners)
- The setting is different from the pattern's context

## Educator profile integration

Before composing, check if an educator profile is available using
`load_educator_profile`. If a profile exists, call `analyze_educator_context`
with the educator ID, domain, and target skills. This returns actionable
customization for the lesson plan:

### How to apply the educator profile

1. **Activity type weighting.** Weight activities toward the educator's preferred
   styles. If they're 40% hands-on and 5% lecture, the plan should be mostly
   hands-on exercises with minimal lecture. Don't force activity types the
   educator is uncomfortable with unless there's a pedagogical reason.

2. **Content scaffolding depth.** Adjust detail level based on content confidence:
   - **Expert educator:** Brief bullet points, trust them to explain in their
     own words. Focus the plan on timing and structure.
   - **Intermediate educator:** Key talking points and anticipated tough questions.
     Reference notes for complex topics.
   - **Novice educator:** Full talking points, suggested explanations, anticipated
     student questions with prepared answers, step-by-step walkthroughs.

3. **Timing calibration.** If the educator consistently runs over on hands-on
   sections, pre-shorten those sections in the plan. If they cut discussions
   short, allocate slightly less time. Cite the pattern: "I've pre-shortened
   the hands-on section by 5 min because your sessions tend to run long there."

4. **Contingency matching.** Match contingency style to the educator:
   - **Improvisers** get open-ended contingencies: "Pivot to a discussion about
     why this is hard."
   - **Structuralists** get specific alternatives: "Switch to exercise Y
     (detailed instructions below)."

5. **Growth nudges.** Occasionally suggest an activity type the educator doesn't
   usually use, with extra scaffolding. Frame it as an opportunity, not a
   correction: "You tend toward lecture for theory sections. For this topic, a
   10-minute Socratic discussion might be more effective — I've included guiding
   questions in case you want to try it."

### Transparency

When the educator profile influences the plan, tell the educator:
- "I've weighted toward hands-on activities based on your teaching style profile."
- "Since you're deeply expert in this domain, I've kept content notes brief."
- "I've pre-shortened the hands-on section by 5 min based on your timing patterns."
- Include an "Educator Profile Applied" section at the end of the plan listing
  which customizations were made and why.

### Two plans, same group

The money shot for this feature: show that the same group, same topic, same
constraints produces different plans for different educators. Dr. Chen gets a
plan built around structured explanations and worked examples. Marcus gets a plan
built around pair programming and guided discussion. Both achieve the same
learning objectives.

## Composition principles

### Think like a stage director

A lesson plan is a performance script. The educator is the performer. You're
the director writing stage notes.

- **Timing is everything.** Don't just list topics in order. Specify when
  transitions happen and what happens if they're late.
- **Energy has a shape.** Don't front-load all the hard stuff. Don't end with
  a lecture. Alternate between active and passive.
- **Transitions are explicit.** "Now we're going to..." is a transition. Write
  it into the plan. Smooth transitions keep momentum.

### Calibrate to the group

- **Skill-level calibration:** If 80% of the group has a skill, don't teach it —
  provide a quick reference card for the 20% who don't.
- **Pacing calibration:** Faster groups need extension activities. Slower groups
  need more scaffolding. Build both into the plan.
- **Pairing recommendations:** If the roster data supports it, recommend specific
  pairings based on complementary skills, SOLO level complementarity, AND
  affective compatibility (see below).

### Calibrate to SOLO distribution

When learner profiles include `solo_demonstrated` data, use it to design
activities that push learners up the SOLO ladder — not just to new skills,
but to deeper structural understanding of existing ones.

#### Activity design by SOLO level

**Prestructural / Unistructural learners** — need structured exposure:
- Guided exercises with one clear right answer
- Step-by-step walkthroughs, not open-ended tasks
- Focus on building vocabulary and identifying single relevant aspects

**Multistructural learners** — know the parts, need to connect them:
- Design activities that explicitly require integration: "How does X
  relate to Y?" / "When would you choose A over B?"
- Pair with relational-level peers who model connected reasoning
- Use compare-and-contrast exercises, case studies with trade-offs
- Stage direction: "By minute 20, check that pairs have moved past
  listing options to discussing trade-offs."

**Relational learners** — solid understanding, push toward transfer:
- Design activities that require generalization: "When would you NOT
  use this approach?" / "How would this apply in a different context?"
- Independent or small-group work on messy real-world problems
- Extension prompts that push toward extended abstract thinking

**Extended Abstract learners** — ready for mentoring and creation:
- Mentor roles: pair with multistructural learners (explaining _why_
  deepens their own understanding)
- Open-ended design challenges with novel constraints
- Teaching moments: have them explain their reasoning to the group

#### SOLO-informed pairing

SOLO level complementarity is a powerful pairing signal:
- **Multi + Relational** = the best pairing: the multistructural learner
  has vocabulary the relational learner can build on, and explaining the
  connections pushes the relational learner to articulate their framework
- **Uni + Multi** = useful for basic scaffolding
- **Relational + Extended Abstract** = both benefit from deeper discussion
- **Pre + anyone** = needs educator attention, not just a peer
- **Same level** = less productive than complementary levels

#### Reporting SOLO in the plan

When SOLO data influences the plan, be transparent:
- "3 of 5 learners are at multistructural level on data cleaning — the
  group exercise emphasizes trade-offs and context-dependent choices
  rather than introducing more functions."
- "I paired Sofia with Marcus because her relational understanding of
  visualization can scaffold his multistructural knowledge into connected
  reasoning."
- Include a "SOLO Distribution" note in the plan showing where the group
  sits structurally on the target skills.

### Weave in the affective dimension

If affective data is available (from `## Affective Profile` in learner profiles
or `## Affective Context` in the group file), use it to shape the plan:

- **Pairing decisions** account for social dynamics, not just skill complementarity.
  Don't pair learners the educator flagged as conflicting. Don't pair a
  low-confidence learner with a high-dominance learner — the low-confidence
  learner will disengage. Reference affective data in pairing rationale:
  "I paired Sofia with Nkechi because their skills complement each other and
  they have good rapport."
- **Activity stakes** calibrated to group confidence. A group with low confidence
  gets low-stakes warm-ups before challenging content. Start with a guaranteed
  win. A group with high motivation gets pushed further, faster.
- **Stage direction includes affective notes.** "This is where Marcus might get
  frustrated — check in with him quietly, not publicly." "Alex freezes when
  put on the spot — use private check-ins instead of calling on him."
- **Warm-up design** informed by past experiences. If learners have had bad
  experiences with the subject, the warm-up explicitly addresses it: "You
  might have tried this before and found it frustrating. Today we're
  starting from a different angle."
- **Contingency notes** include affective contingencies: "If Alex shuts down,
  have him re-run something that already worked to rebuild confidence."

Affective data is always soft — it influences decisions but doesn't override
skill-based reasoning. A low-confidence competent learner still gets advanced
activities, but framed differently than for a high-confidence competent learner.

### Timing beats

Use this format for the timed plan:

```
**[0:00–0:05] Opening — Set context (5 min)**
Educator: Welcome the group. State the session goal in one sentence.
Students: Listening, settling in.
Watch for: Latecomers — don't restart, briefly catch them up during the first activity.

**[0:05–0:15] Concept introduction — What is data cleaning? (10 min)**
Educator: Show a messy dataset on screen. Ask "what's wrong with this data?"
Students: Call out issues they notice (missing values, typos, inconsistent formats).
Watch for: If fewer than 3 students respond, cold-call gently: "Maria, what do you see in row 5?"
Time check: By 0:12, you should have at least 4 issues identified. If not, provide 2 and move on.
```

### Prerequisite auditing

Before finalizing the plan, audit:

- Does every tool in the plan match the constraints? (No paid tools if budget is
  constrained. No internet-dependent tools if connectivity is unreliable.)
- Can students realistically complete the prerequisites before the session?
- Are there any "hidden" prerequisites (e.g., needing an API key that requires
  credit card)?

### Contingency planning

For every major activity, ask:
- What if students can't do this? (Scaffold down)
- What if students breeze through this? (Extend up)
- What if tech fails? (Analog fallback)

## Meta-pedagogical reasoning traces

When composing a lesson plan, generate reasoning traces alongside each major
decision. These traces capture the "why" behind the "what" — they're what
powers the engine's ability to explain itself when educators ask.

### When to generate traces

Generate a reasoning trace for every decision involving:

1. **Ordering** — why activities appear in a particular sequence
2. **Timing** — why a section gets N minutes instead of M
3. **Pairing** — why specific learners are paired (or left solo)
4. **Activity choice** — why a discussion instead of a lecture, why hands-on
   before theory
5. **Content depth** — why the plan has full talking points vs. brief bullets
6. **Contingency design** — why specific backup plans were chosen

### Trace structure

Each trace must include:

- **What was decided** — one sentence describing the decision
- **Why** — the pedagogical reasoning, grounded in specific evidence
- **Evidence** — which primitives drove the decision:
  - Skill graph references (dependency chains, skill IDs)
  - Learner profile references (by name, with their specific data)
  - Bloom's taxonomy levels (group average vs. activity target)
  - Constraints that shaped the decision
  - Teaching wisdom notes that influenced it
  - Educator profile factors that customized it
- **Alternatives considered** — what other option(s) were considered and why
  they were rejected (this is critical — it shows the reasoning is genuine)
- **What would change** — what would need to be different for the decision
  to go the other way (this helps educators evaluate whether to override)

### How to store traces

After composing the lesson plan, call `store_reasoning_traces` with the full
set of traces. This stores them alongside the lesson plan for later retrieval.

### How traces are used

When an educator asks "why" about any part of a plan:
1. The agent calls `explain_pedagogical_reasoning` with the lesson ID and
   question
2. The tool retrieves stored traces and relevant evidence
3. The agent composes a natural, conversational explanation
4. If the educator keeps asking about the same type of decision, the agent
   calls `analyze_meta_pedagogical_patterns` to detect the pattern and
   offer to teach the underlying pedagogical principle

### Tone of explanations

Natural, specific, grounded. Like explaining to a colleague:
- "I put the hands-on exercise first because 80% of your group is already at
  application level on the prerequisites — they learn more from doing first."
- "If your group were mostly at knowledge level, I'd flip it — they'd need
  the framework before they could make sense of the activity."

Never defensive. Always defer: "I've shared my reasoning. You know your
students better than I do. What would you like to do?"

## Reference files

- `templates/lesson-plan-template.md` — Full output format with all sections
