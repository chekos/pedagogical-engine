# Lesson Plan: Basic Plotting with Matplotlib

**Prepared for:** Educator
**Date:** 2026-02-12
**Domain:** python-data-analysis

---

## Session Overview

| Field | Value |
|---|---|
| **Topic** | Creating basic plots (line, bar, scatter, histogram) using matplotlib |
| **Audience** | 5 continuing education students (ages 22-55), mixed skill levels |
| **Setting** | Computer lab with workstations, projector, whiteboard |
| **Duration** | 30 minutes |
| **The one thing** | Every student leaves able to write 4 lines of code that turn a DataFrame column into a visible chart |

### Learning Objectives

By the end of this session, students will be able to:

1. Create a line plot, bar chart, scatter plot, and histogram using matplotlib *(Bloom's: Application)*
2. Choose an appropriate plot type for a given data question *(Bloom's: Analysis)*
3. Customize plot titles, labels, and colors for readability and accessibility *(Bloom's: Application)*

### Group Skill Snapshot

Before you start, know your room:

- **Priya Sharma** -- Already has basic-plotting at application level (0.75). She will finish everything early. Your job is to keep her engaged with extension challenges, not to slow her down. Consider deploying her as a peer mentor for Alex.
- **Sofia Ramirez** -- Has basic-plotting at application level (0.70). Tableau expert, so she understands *what* charts to make -- she just needs the matplotlib syntax. Let her visualization instincts lead.
- **Marcus Johnson** -- Has basic-plotting at application level (0.60) but needs accessibility accommodations. Uses screen magnification and high-contrast mode. Strong Excel background. Prefers terminal over Jupyter. Make sure all projected code uses a large font and high-contrast color scheme.
- **Nkechi Okonkwo** -- Has basic-plotting at knowledge level only (0.40). PhD biology student, R expert. She knows *conceptually* what a histogram is and when to use one -- she just does not know the Python/matplotlib API. Bridge from R: "This is like `plot()` and `hist()` in R, but the syntax is..."
- **Alex Chen** -- No assessed plotting skills, and missing both prerequisites (import-pandas, install-packages). Career changer, beginner. Will need pre-written code templates to modify rather than blank-slate coding. Pair with Priya for the hands-on exercise.

### Prerequisite Audit Flags

**CRITICAL: Alex Chen is missing both direct prerequisites for basic-plotting.**
- `import-pandas` -- not assessed (Alex has not demonstrated ability to import pandas or load data)
- `install-packages` -- not assessed

**Mitigation strategy (built into the plan below):**
- Alex will work from a pre-loaded notebook with imports already done and a DataFrame already in memory
- The opening 2 minutes include a "run this cell to check your setup" step that catches import issues
- Pair Alex with Priya during the exercise so Alex can focus on the plotting code, not the setup

**Nkechi Okonkwo has a weak import-pandas score (0.55, knowledge level).**
- She can import pandas but gets confused by DataFrame vs Series
- The starter notebook sidesteps this by having the DataFrame pre-loaded, so she can focus on plotting

All other learners have sufficient prerequisites.

---

## Prerequisites Checklist

Students must have these BEFORE the session starts:

- [x] **Python 3.11 installed and working**
  - How: Pre-installed on all lab workstations
  - Verify: Open terminal, type `python --version`, see `3.11.x`

- [x] **Jupyter notebooks installed and launchable**
  - How: Pre-installed on all lab workstations
  - Verify: Open terminal, type `jupyter notebook`, browser opens

- [x] **pandas and matplotlib installed**
  - How: Pre-installed on all lab workstations
  - Verify: In a Jupyter cell, run `import pandas as pd; import matplotlib.pyplot as plt; print("Ready!")`

- [ ] **Starter notebook downloaded and open**
  - How: Distribute `basic-plotting-starter.ipynb` via USB drive or shared network folder (do NOT rely on a URL -- have a backup on USB in case WiFi hiccups)
  - Verify: Students see a notebook with 3 pre-filled cells and a DataFrame called `df` with columns: `month`, `sales`, `category`, `units`
  - **Prepare this before class:** The starter notebook should contain:
    - Cell 1: Imports (`import pandas as pd`, `import matplotlib.pyplot as plt`, `%matplotlib inline`)
    - Cell 2: A small inline DataFrame (15-20 rows of mock sales data with columns `month`, `sales`, `category`, `units`) -- do NOT load from an external CSV, embed it directly so there are zero file-path issues
    - Cell 3: `df.head()` so students see the data immediately

### Tool and Account Requirements

| Tool | Required? | Cost | Setup link |
|---|---|---|---|
| Python 3.11 | Yes | Free | Pre-installed |
| Jupyter Notebook | Yes | Free | Pre-installed |
| pandas | Yes | Free | Pre-installed |
| matplotlib | Yes | Free | Pre-installed |
| Starter notebook | Yes | Free | Distributed in class (USB/network) |

---

## Timed Session Plan

### Phase 1 -- Setup and Hook (5 minutes)

**[0:00-0:02] Opening -- Starter notebook check (2 min)**

Educator: As students settle in, project the instruction: "Open your starter notebook and run all three cells. Raise your hand if you see an error." Walk the room while they do this. Do not start teaching until everyone has a working notebook showing `df.head()` output.

Students: Opening notebooks, running cells, confirming setup.

Watch for: Alex will likely need help finding/opening the notebook. Walk to Alex's station first. If anyone gets an import error, it means matplotlib or pandas is not installed -- run `!pip install matplotlib pandas` in a Jupyter cell to fix it on the spot.

Time check: By 0:02, every student should see the DataFrame. If someone is still stuck, ask Priya or Sofia to help them while you start the hook.

**[0:02-0:05] Hook -- "What story does this data tell?" (3 min)**

Educator: Project `df.head(10)` on the screen. Ask: "Looking at this data, what questions could we answer? What would you want to see as a chart?" Write 3-4 student suggestions on the whiteboard. You are fishing for answers like "sales over time" (line), "sales by category" (bar), "relationship between units and sales" (scatter), "distribution of sales values" (histogram).

Students: Calling out questions. If they are quiet, cold-call gently: "Sofia, you work with data viz every day -- what chart would you make first?" Sofia's Tableau instincts will get the room talking.

Watch for: If you get fewer than 3 suggestions by 0:04, provide the rest yourself and move on. Do not let this stall.

Transition: "Great -- we are going to build all of these in the next 20 minutes. Four plot types, four lines of code each."

### Phase 2 -- Live Coding Demo (10 minutes)

**[0:05-0:08] Demo 1 -- Line plot (3 min)**

Educator: Type this live (do NOT paste -- students need to see you type it):

```python
plt.plot(df['month'], df['sales'])
plt.title('Monthly Sales')
plt.xlabel('Month')
plt.ylabel('Sales ($)')
plt.show()
```

Talk through each line as you type it: "plt.plot takes x and y. Title goes on top. Labels go on axes. Show renders it."

For Marcus: Use a large font in your Jupyter notebook (Ctrl/Cmd + to zoom) and mention: "Notice I'm adding labels to every axis -- this is not just good practice, it's essential for accessibility. Screen readers can read alt text, but axis labels are the first thing any viewer needs."

For Nkechi: Say briefly: "If you know R, `plt.plot()` is like `plot()` in base R. Same idea, slightly different syntax."

Students: Watching, then typing along.

Watch for: Alex may fall behind on typing. That is fine -- the starter notebook will have these as partially-filled cells in the exercise section. Do not wait for everyone to finish typing during the demo.

**[0:08-0:11] Demo 2 -- Bar chart (3 min)**

Educator: Type this live:

```python
category_sales = df.groupby('category')['sales'].sum()
category_sales.plot(kind='bar', color='steelblue')
plt.title('Total Sales by Category')
plt.ylabel('Sales ($)')
plt.show()
```

Key teaching point: "Notice we used the pandas `.plot()` method here instead of `plt.plot()`. Pandas wraps matplotlib -- either approach works. I am showing you both so you recognize them in the wild."

For Marcus: Say: "I picked 'steelblue' deliberately -- it has good contrast on a white background. When you are making your own charts, stick to dark, saturated colors. Avoid yellow-on-white or light gray."

Students: Watching. Some will type along.

Time check: By 0:11, you should be done with the bar chart. If you are behind, skip the verbal explanation of pandas `.plot()` vs `plt.plot()` -- they will discover both in the exercise.

**[0:11-0:15] Demos 3 and 4 -- Scatter and histogram (4 min)**

Educator: These go faster because the pattern is established. Type the scatter plot:

```python
plt.scatter(df['units'], df['sales'], color='darkgreen')
plt.title('Units vs Sales')
plt.xlabel('Units Sold')
plt.ylabel('Sales ($)')
plt.show()
```

Then the histogram:

```python
plt.hist(df['sales'], bins=8, color='coral', edgecolor='black')
plt.title('Distribution of Sales')
plt.xlabel('Sales ($)')
plt.ylabel('Frequency')
plt.show()
```

Key teaching point for scatter: "Scatter plots answer 'is there a relationship between two numbers?'"

Key teaching point for histogram: "Histograms answer 'how is one number distributed?' Notice the `bins` parameter -- try changing it later to see what happens."

For Nkechi: "In R this would be `hist(df$sales)`. Same concept, just `plt.hist()` with slightly different arguments."

Students: Watching. Pattern recognition should be kicking in -- they have seen the same structure four times now (plt.something, title, labels, show).

Watch for: If anyone says "I get it, they all follow the same pattern" -- that is exactly the insight you want. Reinforce it: "Exactly. Once you know the pattern, it is just swapping the function name and the arguments."

Transition: "You have seen me do it four times. Now it is your turn. You have 12 minutes."

### Phase 3 -- Hands-On Exercise (12 minutes)

**[0:15-0:27] Exercise -- "Four Charts Challenge" (12 min)**

Educator: Project the exercise instructions (these should also be in the starter notebook as markdown cells):

> **Four Charts Challenge (12 minutes)**
>
> Using the `df` DataFrame in your notebook, create:
> 1. A line plot of `units` over `month`
> 2. A bar chart of average `sales` by `category` (hint: `.groupby().mean()`)
> 3. A scatter plot of `month` vs `units`
> 4. A histogram of `units` with 6 bins
>
> **For each chart:** Add a title and axis labels.
>
> **Finished early?** Extension challenges:
> - Add `color` and `figsize` parameters to make your charts look polished
> - Create a 2x2 subplot grid with all four charts (`plt.subplots(2, 2)`)
> - Add a legend to your bar chart
> - Try `plt.style.use('seaborn-v0_8')` at the top and re-run all charts

Announce the pairings: "Alex, slide your chair over to Priya's workstation -- you two are working together. Everyone else, work individually but shout if you get stuck."

Students: Coding. This is the core of the lesson.

Watch for (minute-by-minute patrol route):

- **0:15-0:17**: Walk to Alex and Priya first. Confirm Alex has the starter cells open and can modify the first plot. Tell Priya: "Your job is to let Alex type. Guide with words, not by taking the keyboard." Check that Alex's first cell runs without error.

- **0:17-0:19**: Walk to Marcus. Confirm his screen magnification is showing the code clearly. If he is struggling with the Jupyter interface, remind him he can use `python` in the terminal and `plt.savefig('chart.png')` instead of `plt.show()` to save charts as files he can zoom into at full resolution. This is Marcus's preferred workflow.

- **0:19-0:21**: Check on Nkechi. If she is writing R syntax (`df$column`), gently redirect: "In Python, it is `df['column']` with square brackets and quotes." She will self-correct fast once reminded.

- **0:21-0:23**: Check on Sofia. She is probably already on chart 3 or 4. If she is done, point her to the extension challenges. Ask her: "Which plot type would you pick for this data if you were making a dashboard in Tableau? Can you make that same chart here?"

- **0:23-0:25**: Return to Alex and Priya. Alex should have at least 2 charts done by now. If Alex is stuck on chart 1, simplify: "Just get this one chart working. Copy the line plot code from the demo, change `sales` to `units`, and run it."

- **0:25-0:27**: Do a quick lap. Anyone stuck on a specific error, help them debug. Common errors:
  - `NameError: name 'plt' is not defined` -- they forgot to run the import cell. Run it.
  - `KeyError: 'Month'` -- capitalization mismatch. Check `df.columns` and match exactly.
  - Plot appears but is blank -- they forgot `plt.show()` or are in a non-inline matplotlib mode. Add `%matplotlib inline` at the top.

Time check: By 0:25, at least 3 of 5 students should have 2+ working charts. If fewer than that, you are okay -- the wrap-up will reinforce the pattern even for students who did not finish all four.

### Phase 4 -- Wrap-Up and Anchor (3 minutes)

**[0:27-0:30] Wrap-up -- Pattern reinforcement and takeaway (3 min)**

Educator: Get everyone's attention. Project a blank cell and write the "universal pattern" on the whiteboard or type it:

```
plt.<plot_type>(data)    # line / bar / scatter / hist
plt.title('...')          # always add a title
plt.xlabel('...')         # always label x
plt.ylabel('...')         # always label y
plt.show()                # render it
```

Say: "This is the one thing I want you to remember. Every matplotlib chart follows this five-line pattern. The only thing that changes is the first line."

Ask one closing question: "Quick show of hands -- who got at least one chart working?" (Everyone should raise a hand.) "Who got all four?" (Priya, Sofia, maybe Marcus and Nkechi.) Celebrate both.

For Alex specifically, if Alex got even one chart working, say: "Alex, you made a chart from raw data with four lines of code. Two weeks ago you had never written Python. That is real progress."

Students: Listening, absorbing the pattern.

Final instruction: "Your notebooks are yours to keep. The starter notebook has all the demo code in it. If you want to experiment more, try changing the data, the colors, or the chart types. No homework, but if you want to play with this, it is all right there."

---

## Activities

### Activity 1: Four Charts Challenge

| Field | Value |
|---|---|
| **Objective** | Create 4 different plot types from a real DataFrame using matplotlib |
| **Duration** | 12 minutes |
| **Format** | Individual (Alex paired with Priya) |
| **Materials** | Starter notebook with pre-loaded DataFrame |

**Instructions:**

1. Open the exercise section of your starter notebook (cells below the demo code)
2. Create a line plot of `units` over `month` -- add title and axis labels
3. Create a bar chart of average `sales` by `category` -- use `.groupby('category')['sales'].mean()` then `.plot(kind='bar')`
4. Create a scatter plot of `month` vs `units` -- use `plt.scatter()`
5. Create a histogram of `units` with 6 bins -- use `plt.hist()` with `bins=6`
6. For each chart, add `plt.title()`, `plt.xlabel()`, and `plt.ylabel()`

**Success criteria:**
- Minimum: 2 of 4 charts render without errors, with titles and axis labels
- Target: All 4 charts render with appropriate titles, labels, and readable colors
- Stretch: Subplot grid or style customization

**Common pitfalls:**
- `NameError: name 'plt' is not defined`: Student did not run the import cell. Fix: run cell 1 of the starter notebook.
- `KeyError` on column name: Capitalization mismatch between what they typed and the actual column name. Fix: run `print(df.columns)` to check.
- Bar chart fails because they did not groupby first: They tried `plt.bar(df['category'], df['sales'])` which plots every row, not aggregated. Fix: show the groupby pattern from the demo.
- Histogram shows one giant bar: Too few bins. Fix: increase `bins` parameter.
- Plot renders inline but is tiny: Fix: add `plt.figure(figsize=(8, 5))` before the plot command.

### Extension Activity: Subplot Grid (for fast finishers)

| Field | Value |
|---|---|
| **Objective** | Combine all 4 plots into a single 2x2 figure using subplots |
| **Duration** | Remaining time (usually 3-5 min for fast finishers) |
| **Format** | Individual |
| **Materials** | Same notebook |

**Instructions:**

```python
fig, axes = plt.subplots(2, 2, figsize=(12, 8))

axes[0, 0].plot(df['month'], df['units'])
axes[0, 0].set_title('Units Over Time')

axes[0, 1].bar(category_sales.index, category_sales.values)
axes[0, 1].set_title('Sales by Category')

axes[1, 0].scatter(df['units'], df['sales'])
axes[1, 0].set_title('Units vs Sales')

axes[1, 1].hist(df['units'], bins=6)
axes[1, 1].set_title('Unit Distribution')

plt.tight_layout()
plt.show()
```

**Success criteria:** A 2x2 grid renders with all four charts visible and labeled.

---

## Contingency Notes

### If students struggle with the basic plot syntax

Simplify to a single plot type. Say: "Everyone just focus on the line plot. Get this one working." Write the exact code on the whiteboard, character by character. Once everyone has one plot, decide if there is time for a second type.

### If Alex cannot get even the first chart working

Switch Alex to a "fill in the blank" approach. In the starter notebook, have pre-written cells with blanks:

```python
plt.plot(df['month'], df['____'])  # fill in the column name
plt.title('____')                   # fill in a title
plt.xlabel('Month')
plt.ylabel('____')                  # fill in the y-axis label
plt.show()
```

This reduces the cognitive load from "write code" to "fill in three blanks."

### If you are running behind at minute 15

Cut the scatter and histogram demos. Show only line and bar in the demo phase (saves 4 minutes). In the exercise, tell students: "Start with charts 1 and 2. If you finish those, try 3 and 4 -- the pattern is the same, just different function names."

### If Nkechi keeps writing R syntax

Give her this one-line cheat sheet on an index card or project it briefly:
- R: `df$column` -> Python: `df['column']`
- R: `plot(x, y)` -> Python: `plt.plot(x, y)`
- R: `hist(x)` -> Python: `plt.hist(x)`
- R: `barplot(table(x))` -> Python: `x.value_counts().plot(kind='bar')`

### If a student finishes all four charts in under 5 minutes

This will be Priya. Direct her to: (1) the subplot extension, (2) helping Alex, or (3) trying `plt.style.use('seaborn-v0_8')` and comparing the output. You can also challenge her: "Can you write a function that takes a column name and automatically picks the right chart type?"

### If tech fails (projector dies, Jupyter will not start)

- **Projector dies:** Use the whiteboard. Write the 5-line pattern by hand. Walk students through it verbally while they type on their own screens. This actually works fine -- the code is short enough.
- **Jupyter will not start on a workstation:** Have the student use a plain Python script instead. `plt.savefig('chart.png')` instead of `plt.show()`, then open the PNG. Marcus may actually prefer this workflow.
- **matplotlib not installed on a workstation:** Run `!pip install matplotlib` in Jupyter or `pip install matplotlib` in the terminal. Takes 30 seconds on lab WiFi.

### What to cut if you are short on time

Cut in this order (each saves the indicated time):

1. **Cut scatter and histogram demos** (save 4 min) -- Students can still attempt them in the exercise using the pattern from line/bar. The pattern transfers.
2. **Cut the extension challenges** (save 0 min of instruction, but stop directing fast finishers to it) -- Priya and Sofia will just finish earlier.
3. **Reduce exercise from 12 to 8 minutes** (save 4 min) -- Tell students to do charts 1 and 2 only. Most will still get through them.
4. **Cut the wrap-up pattern slide** (save 2 min, not recommended) -- This is the anchor. Only cut this if you are truly desperate. If you do cut it, at minimum say the pattern aloud: "Remember: plot, title, xlabel, ylabel, show."

---

## Accessibility Notes (Marcus Johnson)

These are not optional -- build them into your preparation:

1. **Projector font size:** Zoom your Jupyter notebook to at least 150% before class. Use Ctrl/Cmd + three times from default.
2. **High-contrast colors in all demo code:** Use `steelblue`, `darkgreen`, `coral` with `edgecolor='black'` -- avoid yellow, light gray, or pastel colors.
3. **Alt text habit:** When you show a chart on the projector, describe it aloud: "This line chart shows sales increasing from January through June, then dipping in July." Marcus benefits, and it teaches all students good data communication.
4. **Terminal alternative:** If Marcus prefers, he can run Python scripts in the terminal instead of Jupyter. The code is identical except `plt.savefig('myplot.png')` replaces `plt.show()`. Mention this option at the start.
5. **Starter notebook font:** If possible, set the notebook's default font size larger. In Jupyter, this can be done via the browser zoom or custom CSS.

---

## Recommended Pairings

| Pair | Rationale |
|---|---|
| **Alex + Priya** | Alex needs scaffolding; Priya is the most advanced and patient. Priya gets the challenge of mentoring, which exercises her synthesis-level skills. Tell Priya to guide verbally, not to type for Alex. |
| **Nkechi (solo, near Sofia)** | Nkechi is capable but needs to build Python muscle memory. Working solo forces her to type the syntax herself. Seat her near Sofia so she can glance over if stuck, but do not formally pair them -- Nkechi needs the repetition. |
| **Marcus (solo)** | Marcus has specific accessibility needs and prefers his own setup. Do not pair him unless he asks. Check on him during the patrol route to make sure his display is working. |
| **Sofia (solo)** | Sofia is intermediate and benefits from independent practice. Her Tableau instincts mean she will make good chart-type decisions -- she just needs the syntax practice. |

---

## Logistics and Links

| Resource | URL / Location |
|---|---|
| Python 3.11 docs | https://docs.python.org/3.11/ |
| matplotlib pyplot tutorial | https://matplotlib.org/stable/tutorials/pyplot.html |
| matplotlib color reference | https://matplotlib.org/stable/gallery/color/named_colors.html |
| pandas plotting docs | https://pandas.pydata.org/docs/user_guide/visualization.html |
| Starter notebook | Distribute via USB or shared network folder before class |
| High-contrast matplotlib styles | https://matplotlib.org/stable/gallery/style_sheets/style_sheets_reference.html |

---

## Preparation Checklist (do this before class)

- [ ] Create the starter notebook (`basic-plotting-starter.ipynb`) with:
  - Import cell (pandas, matplotlib, `%matplotlib inline`)
  - Inline DataFrame (15-20 rows, columns: month, sales, category, units)
  - `df.head()` cell
  - Empty exercise cells with markdown instructions
  - Fill-in-the-blank backup cells for Alex (hidden or at the bottom)
  - Extension challenge cells for fast finishers
- [ ] Copy starter notebook to USB drive (backup for WiFi issues)
- [ ] Test Jupyter on at least 2 workstations to confirm matplotlib renders inline
- [ ] Zoom projector Jupyter to 150%+ and verify readability from the back of the room
- [ ] Write the 5-line pattern on the whiteboard before students arrive (or have it ready to write during wrap-up)
- [ ] Print or prepare the R-to-Python cheat sheet for Nkechi (index card)

---

*Generated by the Pedagogical Reasoning Engine*
*Last updated: 2026-02-12*
