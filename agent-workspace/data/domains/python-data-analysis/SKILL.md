# Teaching Methodology: Python Data Analysis

## Domain context
This domain covers Python-based data analysis from absolute beginner (opening a terminal) through advanced pipeline design. Learners range from career switchers to scientists adding Python to their toolbox.

## Teaching principles
- **Build on the REPL loop.** Every concept should be immediately testable in a notebook or terminal. Never lecture for more than 5 minutes without a hands-on exercise.
- **Real data from day one.** Use messy, authentic datasets — not toy examples. Learners should encounter missing values, type mismatches, and encoding issues early.
- **Error messages are teachers.** When a learner hits a traceback, walk them through reading it. Don't just fix it for them.
- **Scaffold with questions, not instructions.** Instead of "use `df.groupby()`," ask "how would you find the average salary by department?"

## Assessment strategies
- **Beginner (knowledge/comprehension):** Ask learners to read code and predict output. "What does this print?" reveals understanding without requiring typing fluency.
- **Intermediate (application/analysis):** Give a dataset and a question. "Find the month with the highest sales." Observe their approach, not just their answer.
- **Advanced (synthesis/evaluation):** Present a messy real-world dataset and ask them to formulate their own questions, clean the data, and present findings.

## Common misconceptions
- Confusing assignment (`=`) with equality (`==`)
- Thinking `import pandas` gives access to `pd.read_csv` without aliasing
- Applying string methods to numeric columns without conversion
- Expecting `df.drop()` to modify in place

## Dependency inference notes
- If a learner can use `groupby`, they almost certainly understand selection/filtering
- Comfort with Jupyter implies comfort with running Python scripts
- Plotting skill strongly predicts basic pandas comprehension
- Pipeline design implies all intermediate skills — test it last, skip if confirmed

## Constraints
- Requires: computer with Python installed, internet for package installation
- Duration: 2–3 hours for a workshop covering basics through groupby
- Accessibility: screen reader compatible if using terminal/text editor; Jupyter has limitations
