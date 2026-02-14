# Inference Patterns Reference

Worked examples showing how dependency inference operates on the skill graph.
Use these patterns as templates for reasoning about learner skills.

---

## Pattern 1: Single demonstration, deep inference chain

**Scenario:** A learner demonstrates they can run a pandas groupby operation.

**Demonstrated skill:** `pandas-groupby` (Application level)

**Dependency chain:**
```
open-terminal (0.95)
  └→ navigate-directories (0.95)
      └→ run-python-script (0.95)
          ├→ python-variables-types (0.90)
          │   └→ python-control-flow (0.90)
          │       └→ python-functions (0.85)
          │           └→ pandas-groupby (0.90) ← DEMONSTRATED
          └→ install-packages (0.80)
              └→ import-pandas (0.90)
                  └→ inspect-dataframe (0.95)
                      └→ select-filter-data (0.90)
                          └→ pandas-groupby ← DEMONSTRATED
```

**Inferred skills (via best path to each):**

| Skill | Confidence | Path |
|---|---|---|
| select-filter-data | 0.90 | pandas-groupby → select-filter-data |
| python-functions | 0.70 | pandas-groupby → python-functions |
| inspect-dataframe | 0.86 | pandas-groupby → select-filter-data → inspect-dataframe |
| import-pandas | 0.81 | ... → inspect-dataframe → import-pandas |
| python-control-flow | 0.60 | ... → python-functions → python-control-flow |
| install-packages | 0.65 | ... → import-pandas → install-packages |
| python-variables-types | 0.54 | ... → python-control-flow → python-variables-types |
| run-python-script | 0.51 | ... → python-variables-types → run-python-script |
| navigate-directories | 0.49 | ... → run-python-script → navigate-directories |
| install-python | 0.46 | ... → run-python-script → install-python |
| open-terminal | 0.46 | ... → navigate-directories → open-terminal |

**Note:** open-terminal and install-python drop below 0.5 confidence through
this chain alone. If we also test `basic-plotting` and they pass, the additional
path through install-packages raises open-terminal's confidence via the max rule.

---

## Pattern 2: Failure triggers downward traversal

**Scenario:** A learner is asked to perform an EDA and struggles.

**Failed skill:** `exploratory-data-analysis` (Analysis level)

**What to test next:** The immediate prerequisites of EDA:
1. `interpret-distributions` — Can they read a histogram?
2. `identify-data-quality-issues` — Can they spot problems in data?
3. `pandas-groupby` — Can they aggregate data?
4. `basic-plotting` — Can they create a chart?

**If they pass `pandas-groupby` but fail `interpret-distributions`:**
- Infer downstream skills from pandas-groupby (see Pattern 1)
- The gap is in the Analysis level — they can USE the tools but can't
  INTERPRET the output
- Test `basic-plotting` to see if they can at least create visualizations
- If yes: the gap is specifically in statistical interpretation, not in tooling

**Teaching implication:** This learner needs instruction on reading and
interpreting statistical visualizations, not on how to use pandas.

---

## Pattern 3: Multiple demonstrations reinforce confidence

**Scenario:** A learner demonstrates both `pandas-groupby` AND `handle-missing-data`.

**Both skills share prerequisite:** `inspect-dataframe`

**Confidence from pandas-groupby path:**
```
pandas-groupby → select-filter-data (0.90) → inspect-dataframe (0.95)
Confidence: 0.90 × 0.95 = 0.86
```

**Confidence from handle-missing-data path:**
```
handle-missing-data → inspect-dataframe (0.90)
Confidence: 0.90
```

**Result:** `inspect-dataframe` confidence = max(0.86, 0.90) = **0.90**

The multiple paths converge and reinforce. This is why testing multiple branches
is valuable even after successful inference — it strengthens the confidence of
shared prerequisites.

---

## Pattern 4: Efficient assessment path for a full domain

**Goal:** Assess the entire python-data-analysis domain (25 skills) in minimum questions.

**Optimal assessment order:**

1. **Start with `pandas-groupby`** (Application level, infers 11+ skills)
   - Pass → 11 skills inferred. Move to step 2.
   - Fail → Drop to `select-filter-data`, then follow the chain down.

2. **Test `exploratory-data-analysis`** (Analysis level, different branch)
   - Pass → Infers interpret-distributions, identify-data-quality-issues,
     basic-plotting (plus reinforces pandas-groupby prerequisites).
   - Fail → Test interpret-distributions and identify-data-quality-issues separately.

3. **Test `build-analysis-narrative`** (Synthesis level)
   - Pass → Infers use-jupyter, explain-analysis-choices, plus EDA chain.
   - Fail → The gap is at the Synthesis level.

4. **Test `design-data-pipeline`** (Synthesis level, capstone)
   - Pass → Infers write-reusable-analysis-functions, reshape-data,
     pandas-merge-join, plus everything below.
   - Fail → Test the individual prerequisites that weren't already assessed.

5. **Test `critique-visualization`** (Evaluation level, independent branch)
   - This skill is only reachable through basic-plotting + interpret-distributions.
     If those are already inferred, one question covers it.

**Best case:** 4–5 questions assess all 25 skills.
**Worst case (complete beginner):** 8–10 questions to find the boundary.

---

## Pattern 5: Group gap analysis for lesson planning

**Scenario:** Educator wants to teach "data cleaning with pandas" to a group of 8.

**Target skills:** handle-missing-data, identify-data-quality-issues

**Prerequisites for these skills:**
- open-terminal
- navigate-directories / install-python
- run-python-script
- install-packages
- python-variables-types
- import-pandas
- inspect-dataframe

**Group assessment results:**

| Learner | import-pandas | inspect-dataframe | handle-missing-data |
|---|---|---|---|
| Alex | 0.90 | 0.85 | not assessed |
| Jordan | 0.90 | 0.80 | 0.70 |
| Sam | 0.50 | not assessed | not assessed |
| Pat | 0.85 | 0.90 | not assessed |
| ... | ... | ... | ... |

**Analysis:**
- **6/8 learners** can import pandas (>0.7 confidence) — no need to teach this
- **5/8 learners** can inspect DataFrames — brief review is sufficient
- **1/8 learners** (Sam) is below threshold on import-pandas — they need
  prerequisite support
- **Recommendation:** Send Sam a pre-session setup guide. Start the session with
  a 5-minute DataFrame inspection warm-up, then move to missing data handling.

**Pairing suggestion:** Pair Sam with Jordan (who already has handle-missing-data
skills) for the hands-on exercise.
