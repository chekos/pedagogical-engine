# Lesson Plan: Python Data Analysis: End-to-End Pipeline Workshop

**Prepared for:** Educator (python-workshop)
**Date:** 2026-02-12
**Domain:** python-data-analysis

---

## Session Overview

| Field | Value |
|---|---|
| **Topic** | End-to-end data analysis pipeline in Python |
| **Audience** | 5 students -- mix of beginners and career switchers |
| **Setting** | In-person, laptops, Python pre-installed |
| **Duration** | 90 minutes (hard stop) |
| **The one thing** | Students see the full arc of data analysis -- from a raw CSV to a written mini-report -- so they know what the whole journey looks like before diving deep into any one piece. |

### Learning Objectives

By the end of this session, students will be able to:

1. Navigate directories and set up a working project folder for data analysis *(Bloom's: APPLICATION)*
2. Create, run, and install packages for a Python data analysis script *(Bloom's: APPLICATION)*
3. Load a CSV file into a pandas DataFrame and inspect its structure using head, info, describe, and shape *(Bloom's: COMPREHENSION)*
4. Create a basic histogram or bar chart from DataFrame data using matplotlib *(Bloom's: APPLICATION)*
5. Filter rows and select columns from a DataFrame using boolean indexing *(Bloom's: APPLICATION)*
6. Identify and fill missing values in a DataFrame *(Bloom's: APPLICATION)*
7. Fill in a pre-structured analysis report template to produce a coherent data narrative *(Bloom's: SYNTHESIS -- scaffolded)*

### Accommodation Notes (Woven Throughout)

One student has limited English proficiency but can read English. Every phase of this lesson includes:
- **Written instructions** projected or printed alongside verbal explanation
- **Visual diagrams** for pipeline overview and each pandas operation
- **Code shown on screen** before spoken about -- never the reverse
- **Labeled screenshots** in the cheat sheet handout

At no point should a critical instruction exist only as speech.

---

## Prerequisites Checklist

Students must have these BEFORE the session starts:

- [ ] **Python 3.9+ installed**
  - How: Pre-installed by educator on all laptops
  - Verify: Open terminal, type `python --version` or `python3 --version`. Must show 3.9 or higher.

- [ ] **A working terminal application**
  - How: Terminal (macOS), Command Prompt or PowerShell (Windows), or GNOME Terminal (Linux)
  - Verify: Student can open the terminal and see a command prompt.

- [ ] **A text editor installed**
  - How: Any editor works -- VS Code recommended, but Notepad/TextEdit is fine for this workshop
  - Verify: Student can create and save a `.py` file.

- [ ] **Internet access**
  - How: Required for `pip install` during the session
  - Verify: Open a browser and load https://pypi.org

### Tool and Account Requirements

| Tool | Required? | Cost | Setup link |
|---|---|---|---|
| Python 3.9+ | Yes | Free | https://www.python.org/downloads/ |
| pip (comes with Python) | Yes | Free | Included with Python |
| pandas | Yes (installed during session) | Free | https://pandas.pydata.org/ |
| matplotlib | Yes (installed during session) | Free | https://matplotlib.org/ |
| Text editor (any) | Yes | Free | https://code.visualstudio.com/ (recommended) |
| Terminal application | Yes | Free | Built into OS |

---

## Materials To Prepare Before The Session

You need to prepare and distribute these materials. Do not skip this section.

### 1. Sample CSV file: `sales_data.csv`

Create this file and make it available via USB drive, shared folder, or download link. Every student must have a copy.

```csv
date,product,region,units_sold,revenue,customer_rating
2025-01-15,Widget A,North,150,4500.00,4.2
2025-01-15,Widget B,South,80,3200.00,3.8
2025-01-16,Widget A,East,,4200.00,4.5
2025-01-16,Widget C,North,200,6000.00,
2025-01-17,Widget B,West,95,3800.00,4.1
2025-01-17,Widget A,South,130,3900.00,3.9
2025-01-18,Widget C,East,175,,4.7
2025-01-18,Widget A,North,,4800.00,4.3
2025-01-19,Widget B,South,110,4400.00,
2025-01-19,Widget C,West,160,4800.00,4.0
2025-01-20,Widget A,East,140,4200.00,4.4
2025-01-20,Widget B,North,70,2800.00,3.6
```

This dataset is intentionally small (12 rows) so students can see the whole thing. It has missing values in `units_sold`, `revenue`, and `customer_rating` columns -- exactly what they will find and fix.

### 2. Pipeline Diagram (printed or projected)

Draw or print a simple left-to-right flow diagram:

```
[Raw CSV] --> [Load into Python] --> [Explore the data] --> [Clean & Transform] --> [Visualize] --> [Report]
   |               |                      |                       |                    |              |
 sales_data.csv   pd.read_csv()     .head() .info()        .fillna() filter       .plot.bar()    template
                                    .describe() .shape      select columns         .hist()        fill-in
```

Print this on A4/letter paper. Give one copy to each student. This is the "map" they will follow throughout the session.

### 3. Cheat Sheet Handout (printed)

See the "Cheat Sheet" section at the end of this plan. Print one copy per student.

### 4. Report Template File: `report_template.py`

Create this file. Students will fill it in during the final phase.

```python
# ============================================
# MY DATA ANALYSIS REPORT
# ============================================
# Name: _______________
# Date: _______________
# Dataset: sales_data.csv

# --- SECTION 1: What is this data? ---
# This dataset contains ______ rows and ______ columns.
# The columns are: ______________________________
# The data covers dates from ________ to ________.

# --- SECTION 2: What did I find? ---
# The product with the highest total revenue is: __________
# The average customer rating is: __________
# There were ______ missing values in the dataset.
# I handled the missing values by: __________________________

# --- SECTION 3: My visualization ---
# I created a __________ chart showing ________________________.
# The chart tells us that _____________________________________.

# --- SECTION 4: One thing I would investigate next ---
# If I had more time, I would look at ________________________
# because __________________________________________________.

print("Report complete!")
```

### 5. Pre-written Script File: `analysis.py`

This is the master script that students will build incrementally. You type it live; they follow along. Have it ready so you can recover if you make typos.

```python
import pandas as pd
import matplotlib.pyplot as plt

# Load the data
df = pd.read_csv("sales_data.csv")

# Explore
print(df.head())
print(df.shape)
print(df.info())
print(df.describe())

# Visualize
df["units_sold"].hist()
plt.title("Distribution of Units Sold")
plt.xlabel("Units Sold")
plt.ylabel("Frequency")
plt.savefig("histogram.png")
plt.show()

# Filter
north_sales = df[df["region"] == "North"]
print(north_sales)

high_rated = df[df["customer_rating"] > 4.0]
print(high_rated)

# Handle missing data
print(df.isnull().sum())
df["units_sold"] = df["units_sold"].fillna(df["units_sold"].median())
df["revenue"] = df["revenue"].fillna(df["revenue"].median())
df["customer_rating"] = df["customer_rating"].fillna(df["customer_rating"].mean())
print(df.isnull().sum())
```

---

## Timed Session Plan

---

### PHASE 1: OPENING AND SETUP (0:00 -- 0:10)

---

**[0:00 -- 0:03] Welcome and Pipeline Overview (3 min)**

Educator: Welcome the group. Hold up (or project) the pipeline diagram. Say one sentence: "Today we are going to take a raw data file and turn it into a mini-report -- we will touch every step of this pipeline, from loading data to writing up what we found."

Point to each stage on the diagram as you name it. Do not explain each stage yet -- just name them. This is a 30-second flyover, not a lecture.

Hand out the pipeline diagram and cheat sheet to every student now. Do not wait.

Students: Listening, receiving handouts, settling in.

Watch for: Students who are still setting up laptops. Do not wait for them. They will catch up during the first hands-on step. If someone does not have the CSV file yet, prioritize getting it to them during the next beat.

Accommodation: The pipeline diagram is the visual anchor for the limited-English student. Point to it frequently throughout the session. Every time you move to a new phase, physically point to where you are on the diagram.

**[0:03 -- 0:07] Navigate Directories and Set Up Project (4 min)**

*Target skill: navigate-directories (Bloom's: APPLICATION)*

Educator: Project your terminal. Type each command and show the output. Narrate what you are doing, but keep it brief. The commands should be visible on screen for at least 5 seconds each.

```
cd Desktop
mkdir data-workshop
cd data-workshop
pwd
ls
```

Say: "We just created a folder called data-workshop on the Desktop and moved into it. This is where all our files will live today."

Students: Open their terminals and follow along. They should end up inside a `data-workshop` folder.

Quick check: "Hold up your hand when your terminal shows `data-workshop` in the path." Scan the room. If more than 2 students are stuck, walk the room and help. If only 1, ask a neighbor to help them.

Watch for: Windows users may need `dir` instead of `ls`, and path separators differ. If you have a mix of Mac and Windows, show both on screen:
- Mac/Linux: `cd ~/Desktop && mkdir data-workshop && cd data-workshop`
- Windows: `cd %USERPROFILE%\Desktop && mkdir data-workshop && cd data-workshop`

Time check: You must be done with this by 0:07. If students are struggling with terminals, do not spend more than 4 minutes here. Say: "If your folder is not set up yet, that is okay -- I will come help you during the next step. For now, just watch."

**[0:07 -- 0:10] Create and Run a Python Script (3 min)**

*Target skill: run-python-script (Bloom's: APPLICATION)*

Educator: In the terminal, still projected, create a test file:

```
echo "print('Hello, data!')" > test.py
python test.py
```

Show the output: `Hello, data!`

Say: "That is how you run a Python script. You write it in a file, then you tell Python to run it. Every script we write today will work this way."

Students: Create `test.py` and run it. They should see `Hello, data!` in their terminal.

Quick check: "Who sees 'Hello, data!' on their screen?" Thumbs up.

Watch for: If `python` does not work, try `python3`. This is the single most common gotcha. Have this written on the board or projected:
```
If "python test.py" does not work, try:
  python3 test.py
```

Accommodation: This command is on the cheat sheet. Point to it.

Contingency: If more than 2 students cannot run Python at all, you have a pre-installation problem. Stop and troubleshoot for up to 3 minutes. If it is not resolved, pair those students with someone whose Python works -- they share a screen for the rest of the session.

---

### PHASE 2: INSTALL AND IMPORT (0:10 -- 0:20)

---

**[0:10 -- 0:14] Install pandas and matplotlib (4 min)**

*Target skill: install-packages (Bloom's: APPLICATION)*

Educator: Project terminal. Type:

```
pip install pandas matplotlib
```

Say: "pip is Python's package installer. pandas is for working with data tables. matplotlib is for making charts. This is the only install command you need today."

Show the output scrolling. Point out the "Successfully installed" line at the end.

Students: Run the same command in their terminals.

Quick check: "When you see 'Successfully installed' or 'Requirement already satisfied,' raise your hand."

Watch for:
- `pip` not found: try `pip3 install pandas matplotlib`
- Permission errors: try `pip install --user pandas matplotlib`
- Slow downloads: this is the biggest time risk in this phase. If WiFi is slow, have a backup plan: bring a USB drive with wheel files or use `--no-deps` for minimal install.

Have this written/projected:
```
If "pip install" does not work, try:
  pip3 install pandas matplotlib

If permission error:
  pip install --user pandas matplotlib
```

Time check: If installs are not done by 0:14, move on. Students whose installs are still running can catch up -- pip runs in the background. Tell them: "Let it finish. Move to the next step with me."

**[0:14 -- 0:20] Import pandas and Load CSV (6 min)**

*Target skills: import-pandas (Bloom's: APPLICATION)*

Educator: Make sure every student has `sales_data.csv` in their `data-workshop` folder. If distributing by USB, do it now while you talk. If via download link, project the link in large text on screen.

Create `analysis.py` on screen:

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("sales_data.csv")
print(df)
```

Say: "Line 1 imports pandas and gives it the short name `pd`. Line 2 imports matplotlib's plotting tools. Line 3 reads our CSV file and stores it in a variable called `df` -- that stands for DataFrame, which is pandas' word for a data table. Line 4 prints the whole table."

Run it: `python analysis.py`

Show the output. Point to the table structure -- rows, columns, the index numbers on the left.

Students: Create `analysis.py` with the same content. Run it. They should see the full table printed.

Quick check: "Can you see a table with columns like 'product', 'region', and 'revenue'? Thumbs up."

Watch for:
- `FileNotFoundError`: the CSV is not in the right folder. Help them move it or use the full path.
- Typos in the filename: `sales_data.csv` not `sales-data.csv` or `salesdata.csv`

Accommodation: The table output itself is visual -- the limited-English student can verify they have the right output by comparing columns. Show the expected output on a slide or printout alongside the code.

Just-in-time concept -- variables: Say briefly: "The word `df` is a variable -- it is a name we gave to our data. Think of it as a label on a box. The box holds the data table. We will use this name `df` for the rest of the session."

Time check: By 0:20, every student must have a working `analysis.py` that prints the data table. If they do not, pair them with a neighbor and move on.

---

### PHASE 3: EXPLORE (0:20 -- 0:45)

This is the meatiest phase. You have 25 minutes. The energy should be high here because students are seeing results for the first time.

---

**[0:20 -- 0:30] Inspect the DataFrame (10 min)**

*Target skill: inspect-dataframe (Bloom's: COMPREHENSION)*

**I-Do (3 min):** Add these lines to `analysis.py` on screen, one at a time. Run each one and show the output:

```python
print("--- HEAD ---")
print(df.head())

print("--- SHAPE ---")
print(df.shape)

print("--- INFO ---")
print(df.info())

print("--- DESCRIBE ---")
print(df.describe())
```

For each command, say ONE sentence about what it does:
- `.head()`: "Shows the first 5 rows -- a quick preview."
- `.shape`: "Tells you how many rows and columns -- this data has 12 rows and 6 columns."
- `.info()`: "Shows each column's name, how many non-null values, and the data type."
- `.describe()`: "Gives statistics -- mean, min, max -- for numeric columns."

Project a visual summary (draw on whiteboard or show slide):
```
.head()     -->  "What does the data look like?"
.shape      -->  "How big is it?"
.info()     -->  "What types are the columns?"
.describe() -->  "What are the basic stats?"
```

**We-Do (4 min):** Students add these lines to their own `analysis.py` and run the script. Walk the room.

Ask the group three questions (point to projected output):
1. "How many rows does this dataset have?" (12)
2. "Which columns have missing values?" (Look at the non-null counts in `.info()` -- units_sold, revenue, customer_rating)
3. "What is the average revenue?" (Look at `.describe()`)

Accommodation: These questions are factual and the answers are visible on screen. The limited-English student can find the answers by reading the output. Point directly to where the answer is in the output.

**You-Do Quick Challenge (3 min):** "Without looking at the cheat sheet, can you tell me: how many missing values does the `customer_rating` column have?" Students look at their `.info()` output and answer. (Answer: 3 missing -- 9 non-null out of 12 rows.)

Watch for: Students who run the whole script and get overwhelmed by the output. Suggest: "Scroll up to find each section. Look for the '--- HEAD ---' and '--- SHAPE ---' labels we added."

Time check: By 0:30, move on. The inspect skills are comprehension-level -- students will reinforce them in later phases.

**[0:30 -- 0:40] Create a Basic Plot (10 min)**

*Target skill: basic-plotting (Bloom's: APPLICATION)*

**I-Do (3 min):** Add to `analysis.py`:

```python
# Create a histogram
df["units_sold"].hist()
plt.title("Distribution of Units Sold")
plt.xlabel("Units Sold")
plt.ylabel("Frequency")
plt.savefig("histogram.png")
plt.show()
```

Run it. A plot window should appear. Also show the saved `histogram.png` file.

Say: "We just made our first chart. It is a histogram -- it shows how many times each range of 'units sold' appears in the data. Notice the NaN values are automatically skipped."

Draw attention to the saved file: "We also saved it as an image. This is important for your report later."

**We-Do (4 min):** Students add the plotting code and run it. Walk the room.

Then say: "Now change `units_sold` to `revenue` and run it again. What does the new histogram show?"

Students modify and re-run. Walk the room and check.

**You-Do Quick Challenge (3 min):** "Create a bar chart instead of a histogram. Replace `.hist()` with `.plot.bar()`. But first -- what column should you try it on? Hint: bar charts work well for categories, not numbers."

The answer: try `df["product"].value_counts().plot.bar()`. Show this on screen after 2 minutes.

```python
df["product"].value_counts().plot.bar()
plt.title("Sales Count by Product")
plt.savefig("bar_chart.png")
plt.show()
```

Accommodation: The visual output (the chart itself) is the primary feedback. Point to the chart and the data it represents. Use the pipeline diagram: point to the "Visualize" box.

Watch for: Students whose plot window does not appear. Common fix: they might need `plt.show()` or their backend might save but not display. Tell them: "Check your folder for `histogram.png` -- open it in your file browser."

Time check: By 0:40, move to transformation. If you are behind, skip the bar chart challenge and just show it on screen. Students can try it after class.

**[0:40 -- 0:45] Energy Reset -- Stand and Share (5 min)**

Educator: You are 45 minutes in. Brains are getting tired. This is intentional.

Say: "Stand up. Turn to a neighbor. Show them one thing from your output that surprised you or that you found interesting. You have 2 minutes."

Students: Stand, pair up, share screens or point at output.

After 2 minutes, ask 1-2 volunteers to share with the group. Keep it to 30 seconds each.

This is not filler. It serves three purposes:
1. Physical movement resets energy for the second half.
2. Articulating findings is pre-work for the report phase.
3. You can gauge comprehension by listening to what they say.

Accommodation: The limited-English student can point to their screen rather than explain verbally. Pair them with a patient neighbor if possible.

---

### PHASE 4: TRANSFORM (0:45 -- 1:10)

---

**[0:45 -- 0:57] Filter Rows and Select Columns (12 min)**

*Target skill: select-filter-data (Bloom's: APPLICATION)*

**I-Do (4 min):** Add to `analysis.py`:

```python
# Filter: only North region
north_sales = df[df["region"] == "North"]
print("--- NORTH SALES ---")
print(north_sales)

# Filter: high-rated products (rating > 4.0)
high_rated = df[df["customer_rating"] > 4.0]
print("--- HIGH RATED ---")
print(high_rated)

# Select specific columns
product_revenue = df[["product", "revenue"]]
print("--- PRODUCT AND REVENUE ---")
print(product_revenue)
```

Visual aid -- project or draw:
```
FILTER (rows):    df[df["column"] == "value"]     "Keep only rows where..."
                  df[df["column"] > number]        "Keep only rows where..."

SELECT (columns): df[["col1", "col2"]]            "Keep only these columns"
```

Say: "Filtering picks ROWS. Selecting picks COLUMNS. That is the key difference." Hold up hands horizontally for rows, vertically for columns.

**We-Do (4 min):** Students add the code and run. Then ask them to try their own filter:

"Filter the data to show only Widget B products. Write the line yourself."

Answer: `widget_b = df[df["product"] == "Widget B"]`

Walk the room. Check syntax.

**You-Do Quick Challenge (4 min):** "Can you combine them? Show me only the `product` and `revenue` columns for rows where `revenue` is greater than 4000."

Answer:
```python
high_revenue = df[df["revenue"] > 4000][["product", "revenue"]]
print(high_revenue)
```

Show the answer on screen after 3 minutes. Do not let this drag.

Accommodation: The filter/select visual aid (projected) uses minimal English. The pattern `df[df["X"] == "Y"]` is the same every time -- emphasize the visual pattern, not the English explanation.

Just-in-time concept -- boolean indexing: Say only this: "The part inside the brackets, `df['region'] == 'North'`, creates a list of True and False. True rows are kept. False rows are dropped. That is all you need to know for today." Do NOT go deeper. This is a breadth workshop.

Watch for: Double brackets confusion. `df["column"]` (single) selects one column as a Series. `df[["col1", "col2"]]` (double) selects multiple columns as a DataFrame. This WILL trip someone up. When it does, show both on screen side by side.

Time check: By 0:57, move on. If you are behind, skip the combination challenge. Show it on screen and move.

**[0:57 -- 1:10] Handle Missing Data (13 min)**

*Target skill: handle-missing-data (Bloom's: APPLICATION)*

**I-Do (4 min):** Add to `analysis.py`:

```python
# Find missing values
print("--- MISSING VALUES ---")
print(df.isnull().sum())

# Fill missing values
df["units_sold"] = df["units_sold"].fillna(df["units_sold"].median())
df["revenue"] = df["revenue"].fillna(df["revenue"].median())
df["customer_rating"] = df["customer_rating"].fillna(df["customer_rating"].mean())

print("--- AFTER FILLING ---")
print(df.isnull().sum())
print(df)
```

Visual aid:
```
FIND missing:    df.isnull().sum()          "How many blanks in each column?"
FILL missing:    df["col"].fillna(value)    "Replace blanks with this value"

Common fill strategies:
  .median()  -->  middle value (good for numbers with outliers)
  .mean()    -->  average (good for ratings)
  0          -->  zero (only if zero makes sense!)
```

Say: "Step 1: Find the holes. Step 2: Fill them with a reasonable value. We used the median for units and revenue because medians are not thrown off by extreme values. We used the mean for ratings because they are on a 1-5 scale."

**We-Do (5 min):** Students add the code and run. They should see the "before" counts (with missing values) and "after" counts (all zeros).

Ask: "Look at your BEFORE output. Which column had the most missing values?" Students check. (Answer: all three have the same number -- 2 or 3 each. But `customer_rating` has 3.)

Then say: "Now look at the AFTER output. Confirm that all columns show 0 missing values."

**You-Do Quick Challenge (4 min):** "What if we wanted to fill missing `units_sold` with 0 instead of the median? Would that be a good idea? Talk to your neighbor for 1 minute."

After 1 minute, take answers. Guide them: "Filling with 0 would mean 'no sales happened' -- but that is probably not true. The data is just missing. The median is a better guess because it represents a typical sales number."

This is a comprehension check disguised as a discussion. It touches on analysis thinking without requiring formal Bloom's ANALYSIS level skill.

Accommodation: The `.isnull().sum()` output is a table of numbers -- easy to read regardless of English level. Point to the zeros in the "after" output. The visual aid on screen carries the explanation.

Watch for: Students who overwrite their original data accidentally. Remind them: "We are modifying `df` directly. In a real project, you might want to save the original first. For today, this is fine."

Time check: By 1:10, you MUST move to the report phase. If you are behind, skip the discussion question and just show the fill operation. The report phase needs at least 12 minutes.

---

### PHASE 5: REPORT (1:10 -- 1:25)

---

**[1:10 -- 1:12] Transition to Report Phase (2 min)**

Educator: Point to the pipeline diagram. You are at the last stage. Say: "We have loaded, explored, visualized, and cleaned our data. The last step is the most important in the real world: telling someone what you found."

Distribute `report_template.py` (or have students create it). If distributing, use the same method as the CSV.

Say: "This is a fill-in-the-blank template. You will fill in the blanks using the output from your analysis. Every answer is somewhere in the output you already generated."

**[1:12 -- 1:22] Fill In the Report Template (10 min)**

*Target skill: build-analysis-narrative (Bloom's: SYNTHESIS -- scaffolded)*

**I-Do (2 min):** Fill in the first blank together on screen:

```python
# This dataset contains __12__ rows and __6__ columns.
```

Say: "Where did I find this? From `.shape`. It told us (12, 6)."

Fill in one more:
```python
# The columns are: __date, product, region, units_sold, revenue, customer_rating__
```

Say: "Where did I find this? From `.info()` or from printing `df.head()`."

**You-Do (8 min):** Students fill in the rest independently. Walk the room. Help where needed.

The blanks they need to fill:
- Number of rows and columns (from `.shape`)
- Column names (from `.info()` or `.head()`)
- Date range (from the data -- `2025-01-15` to `2025-01-20`)
- Product with highest total revenue (they can eyeball or sum -- either is fine)
- Average customer rating (from `.describe()`)
- Number of missing values (from `.isnull().sum()` before filling)
- How they handled missing values ("filled with median/mean")
- What chart they created ("histogram of units sold")
- What the chart shows (their interpretation)
- One thing they would investigate next (open-ended)

Watch for: Students who are paralyzed by the open-ended questions (Sections 3 and 4). Walk over and say: "Just write one sentence. There is no wrong answer. What did the histogram show you?" Help them form a sentence.

Accommodation: The template itself is the accommodation -- it provides structure, uses simple English, and the answers are numbers or short phrases. The limited-English student should be able to fill in most blanks by copying from their output. For the sentence-based questions (Sections 3 and 4), offer to help them write in their preferred language or accept keywords instead of full sentences.

Time check: By 1:22, ask students to save their files. If some are not done, that is okay. The template is theirs to finish after the session.

**[1:22 -- 1:25] Share One Finding (3 min)**

Educator: "Who wants to share one thing they wrote in their report? Just one sentence."

Take 2-3 volunteers. Celebrate each answer. This is the payoff moment -- they are doing data analysis.

If no one volunteers, read yours: "I found that Widget C had the highest revenue per unit. I would want to investigate whether that is because of the price or the volume."

---

### PHASE 6: WRAP-UP (1:25 -- 1:30)

---

**[1:25 -- 1:28] Recap the Pipeline (3 min)**

Educator: Hold up the pipeline diagram one final time. Point to each stage:

"Today you did ALL of this:
1. Set up a project folder (point)
2. Installed packages (point)
3. Loaded a CSV file into pandas (point)
4. Explored it with head, shape, info, describe (point)
5. Made a histogram and a bar chart (point)
6. Filtered and selected data (point)
7. Found and filled missing values (point)
8. Wrote a mini-report about your findings (point)"

Say: "You have seen the full pipeline. Next time, we will go deeper into any one of these steps. But now you know what the whole journey looks like."

**[1:28 -- 1:30] Resources and Next Steps (2 min)**

Educator: Project or hand out the following (also on the cheat sheet):

- "Your `analysis.py` file is yours. Take it home. Run it again. Change things."
- "The cheat sheet has every command we used today."
- "If you want to practice: download any CSV from https://www.kaggle.com/datasets and try the same steps."

Accommodation: Ensure the limited-English student has the printed cheat sheet and their own files saved. These written materials are their reference for self-study.

---

## Activities Summary

### Activity 1: Setup and Hello World

| Field | Value |
|---|---|
| **Objective** | Navigate directories, create project folder, run a Python script |
| **Duration** | 7 minutes |
| **Format** | Individual, follow-along |
| **Materials** | Terminal, text editor |

**Instructions:** Follow the educator's terminal commands to create `data-workshop/` and run `test.py`.

**Success criteria:** Student sees `Hello, data!` printed in terminal.

**Common pitfalls:**
- `python` not found: Use `python3` instead
- Wrong directory: Use `pwd` (Mac/Linux) or `cd` (Windows) to check location

---

### Activity 2: Install and Load Data

| Field | Value |
|---|---|
| **Objective** | Install pandas/matplotlib, load CSV, print DataFrame |
| **Duration** | 10 minutes |
| **Format** | Individual, follow-along |
| **Materials** | Terminal, `sales_data.csv` |

**Instructions:** Run `pip install pandas matplotlib`. Create `analysis.py` with import and read_csv. Run and verify.

**Success criteria:** Student sees the full 12-row data table printed in terminal.

**Common pitfalls:**
- `FileNotFoundError`: CSV not in same folder as script. Fix: `ls` to check, move file if needed.
- `pip` vs `pip3`: try both
- Slow network: let install run in background, proceed with code

---

### Activity 3: Inspect the DataFrame

| Field | Value |
|---|---|
| **Objective** | Use head, shape, info, describe to understand data structure |
| **Duration** | 10 minutes |
| **Format** | Individual with group discussion |
| **Materials** | `analysis.py`, projected visual summary |

**Instructions:** Add inspection commands to `analysis.py`, run, answer three questions about the output.

**Success criteria:** Student can identify the number of rows, which columns have missing values, and the average revenue.

**Common pitfalls:**
- Output is long and overwhelming: add section labels (we do this in the code)
- Confusion between `.info()` and `.describe()`: info is about structure, describe is about statistics

---

### Activity 4: Create a Plot

| Field | Value |
|---|---|
| **Objective** | Create a histogram and a bar chart |
| **Duration** | 10 minutes |
| **Format** | Individual with challenge extension |
| **Materials** | `analysis.py`, matplotlib |

**Instructions:** Add histogram code. Run. Then modify to create a bar chart of product counts.

**Success criteria:** Student has a saved `histogram.png` file and can explain what it shows.

**Common pitfalls:**
- Plot window blocks script execution: close the window to continue, or use `plt.savefig()` before `plt.show()`
- No plot appears: check matplotlib backend, fall back to saved file

---

### Activity 5: Filter and Select

| Field | Value |
|---|---|
| **Objective** | Filter rows by condition, select specific columns |
| **Duration** | 12 minutes |
| **Format** | Individual with partner check |
| **Materials** | `analysis.py`, visual aid for filter vs. select |

**Instructions:** Add filter and select code. Run. Try custom filter (Widget B). Try combination (high revenue products and columns).

**Success criteria:** Student can write a filter expression `df[df["column"] == "value"]` without copying from the screen.

**Common pitfalls:**
- Single `=` instead of `==`: "One equals is assignment, two equals is comparison."
- Forgetting quotes around string values: `"North"` not `North`
- Double bracket confusion: show side-by-side

---

### Activity 6: Handle Missing Data

| Field | Value |
|---|---|
| **Objective** | Find and fill missing values |
| **Duration** | 13 minutes |
| **Format** | Individual with partner discussion |
| **Materials** | `analysis.py`, visual aid for fill strategies |

**Instructions:** Use `isnull().sum()` to find missing values. Use `fillna()` with median/mean. Verify all nulls are gone.

**Success criteria:** Student's "AFTER FILLING" output shows 0 for all columns.

**Common pitfalls:**
- Forgetting to reassign: `df["col"] = df["col"].fillna(...)` -- the `df["col"] =` part is required
- Confusion about median vs. mean: keep it simple -- "median is the middle number, mean is the average"

---

### Activity 7: Fill In Report Template

| Field | Value |
|---|---|
| **Objective** | Synthesize findings into a structured report |
| **Duration** | 10 minutes |
| **Format** | Individual, with educator help |
| **Materials** | `report_template.py`, all previous output |

**Instructions:** Fill in every blank in the template using data from your analysis output.

**Success criteria:** Student has filled in at least 6 of the 10 blanks. Sentences in Sections 3-4 can be short or use keywords.

**Common pitfalls:**
- Paralysis on open-ended questions: prompt with "What did your histogram show?"
- Copying numbers wrong: encourage students to run the script and read from terminal, not from memory

---

## Contingency Notes

### If students struggle with terminal/directory navigation (Phase 1)

Do not spend more than 5 minutes on this. If students cannot navigate, have them create files on their Desktop directly and skip the `mkdir` step. The folder structure is not critical to the learning goals.

### If pip install fails or is very slow

Backup plan: bring a USB drive with pre-installed packages as wheel files. Or, if you have a shared network drive, pre-install pandas and matplotlib on all laptops before the session. Command for offline install:
```
pip install --no-index --find-links=/path/to/wheels pandas matplotlib
```

### If plot windows do not appear (matplotlib backend issues)

Tell students to check their folder for the saved PNG file. Add `matplotlib.use('Agg')` at the top of the script before importing pyplot. This forces file-only output. The chart will be saved but not displayed in a window.

### If you are running behind at 0:45

You are entering the Transform phase. Cut the "combine filter and select" challenge (saves 4 min). Show it on screen and move directly to missing data handling.

### If you are running behind at 1:05

You are deep in Transform. Cut the missing-data discussion question about "would filling with 0 be a good idea?" (saves 3 min). Just show the fill operation and move to the Report phase.

### If you are running behind at 1:15

You are in the Report phase. Fill in the first 3 blanks together on screen. Tell students to finish the rest at home. Do NOT skip the report phase entirely -- even filling in 3 blanks demonstrates the synthesis concept.

### If a student finishes every activity early

Redirect them to help a neighbor. If no neighbor needs help, give them extension challenges:
1. "Can you create a plot that shows total revenue by region?" (`df.groupby("region")["revenue"].sum().plot.bar()`)
2. "Can you filter for products that have BOTH high revenue (>4000) and high rating (>4.0)?" (`df[(df["revenue"] > 4000) & (df["customer_rating"] > 4.0)]`)
3. "Can you add a title to every section of your report template?"

### If tech fails completely (projector, WiFi, etc.)

Use the whiteboard. Write the pipeline diagram by hand. Write commands on the board. Students can still type on their laptops without the projector -- read commands from the board. The session is still viable. You lose the "follow along with my screen" flow, but the cheat sheet handout carries the code.

---

## What To Cut If You Are Short on Time

Priority order (cut from the bottom up):

| Priority | Activity | Time saved | Impact |
|---|---|---|---|
| CUT FIRST | Bar chart challenge in Phase 3 | 3 min | Low -- histogram is sufficient |
| CUT SECOND | Combine filter+select challenge in Phase 4 | 4 min | Low -- individual filter/select is enough |
| CUT THIRD | Missing data discussion question | 3 min | Medium -- but the concept is still covered by the code |
| CUT FOURTH | Stand-and-share energy break | 5 min | Medium -- energy management suffers, but time is recovered |
| CUT LAST | Report template (NEVER cut entirely) | Reduce to 5 min | Do at least 3 blanks together |

**Never cut:** The inspect phase (it is foundational) or the report phase (it is the payoff that demonstrates the full pipeline).

---

## Logistics and Links

| Resource | URL / Location |
|---|---|
| Python download | https://www.python.org/downloads/ |
| pandas documentation | https://pandas.pydata.org/docs/ |
| matplotlib documentation | https://matplotlib.org/stable/contents.html |
| pip troubleshooting | https://pip.pypa.io/en/stable/installation/ |
| Practice datasets | https://www.kaggle.com/datasets |
| VS Code (recommended editor) | https://code.visualstudio.com/ |
| `sales_data.csv` | Distributed by educator (USB / shared folder / download link) |
| `report_template.py` | Distributed by educator (USB / shared folder / download link) |
| Pipeline diagram | Printed handout (educator prepares) |
| Cheat sheet | Printed handout (see below) |

---

## Cheat Sheet: Python Data Analysis Commands

*Print one copy per student. This is their take-home reference.*

### Terminal Commands
```
cd folder_name          Change into a folder
cd ..                   Go up one folder
mkdir folder_name       Create a new folder
pwd                     Print current folder path (Mac/Linux)
ls                      List files in folder (Mac/Linux)
dir                     List files in folder (Windows)
python script.py        Run a Python script
pip install package     Install a Python package
```

### Pandas -- Loading Data
```python
import pandas as pd                    # Import pandas
df = pd.read_csv("file.csv")          # Load a CSV file
```

### Pandas -- Inspecting Data
```python
df.head()              # First 5 rows
df.head(10)            # First 10 rows
df.shape               # (rows, columns)
df.info()              # Column names, types, non-null counts
df.describe()          # Statistics for numeric columns
df.columns             # List of column names
```

### Pandas -- Filtering and Selecting
```python
df[df["col"] == "value"]               # Filter rows where col equals value
df[df["col"] > number]                 # Filter rows where col > number
df[["col1", "col2"]]                   # Select specific columns
df[df["col"] > number][["col1"]]       # Filter then select
```

### Pandas -- Missing Data
```python
df.isnull().sum()                      # Count missing values per column
df["col"].fillna(value)                # Fill missing with a specific value
df["col"].fillna(df["col"].median())   # Fill missing with the median
df["col"].fillna(df["col"].mean())     # Fill missing with the mean
```

### Matplotlib -- Plotting
```python
import matplotlib.pyplot as plt        # Import matplotlib

df["col"].hist()                       # Histogram
df["col"].value_counts().plot.bar()    # Bar chart
plt.title("My Title")                  # Add title
plt.xlabel("X Label")                  # Add x-axis label
plt.ylabel("Y Label")                  # Add y-axis label
plt.savefig("chart.png")              # Save chart to file
plt.show()                             # Display chart
```

### Quick Patterns
```
"How big is my data?"          -->  df.shape
"What does it look like?"      -->  df.head()
"Any missing values?"          -->  df.isnull().sum()
"Show me only North region"    -->  df[df["region"] == "North"]
"Make a chart"                 -->  df["col"].hist()  or  .plot.bar()
```

---

## Prerequisite Gap Warning

**This group has no prior assessment data.** The skill levels described in this plan are based on the educator's interview description ("mix of beginners and career switchers"). The plan is calibrated conservatively:

- All activities use explicit follow-along instructions (no assumed prior knowledge)
- The report template is fully scaffolded (fill-in-the-blank, not open-ended)
- Extension challenges exist for students who are ahead of the group
- Every skill that has prerequisite dependencies in the skill graph (e.g., `select-filter-data` depends on `python-control-flow`) is taught as a recipe pattern rather than requiring the prerequisite

**Skills with unmet formal prerequisites in this session:**
- `import-pandas` requires `python-variables-types` -- addressed with a 30-second just-in-time explanation of variables
- `select-filter-data` requires `python-control-flow` -- addressed by teaching filter as a copy-paste pattern, not requiring loop/conditional understanding
- `build-analysis-narrative` requires `exploratory-data-analysis`, `use-jupyter`, and `explain-analysis-choices` -- addressed entirely through scaffolded template; students fill in blanks rather than constructing narrative from scratch

If you plan to teach this group again, run a skill assessment before the next session to calibrate properly.

---

*Generated by the Pedagogical Reasoning Engine*
*Last updated: 2026-02-12*
