# Lesson Plan: Pandas GroupBy — "How Many X per Y?"

**Prepared for:** Tuesday Evening Cohort Educator
**Date:** 2026-02-12
**Domain:** python-data-analysis

---

## Session Overview

| Field | Value |
|---|---|
| **Topic** | pandas groupby with aggregation functions (mean, sum, count) |
| **Audience** | 5 continuing education students, ages 22-55, community college evening class |
| **Setting** | Computer lab, 20 workstations, projector, whiteboard. Python 3.11, Jupyter, pandas, matplotlib pre-installed. Reliable WiFi. |
| **Duration** | 90 minutes (hard stop — students commute) |
| **The one thing** | Students leave able to answer "how many X per Y?" and "what is the average X per Y?" questions using `df.groupby("Y")["X"].agg_function()` |

### Learning Objectives

By the end of this session, students will be able to:

1. Select columns and filter rows from a DataFrame using boolean indexing *(Bloom's: APPLICATION)* — prerequisite warm-up, not new for most
2. Use `df.groupby()` with `.count()`, `.sum()`, and `.mean()` to answer "how many / how much per category?" questions *(Bloom's: APPLICATION)* — the core skill
3. Chain a groupby result into a `.plot.bar()` call to visualize grouped summaries *(Bloom's: APPLICATION)* — connecting groupby to output
4. Interpret a grouped summary table and explain what it tells you about the data in plain English *(Bloom's: COMPREHENSION)* — the "so what?" skill

### Differentiation Strategy

This group has a wide skill spread. The plan uses a **two-track design** starting at minute 30:

| Track | Students | Focus | Why |
|---|---|---|---|
| **Track A: GroupBy** | Priya, Marcus, Sofia, Nkechi | `groupby()` with aggregation, visualization, multi-column groupby | Ready for the target skill (prereqs met or close) |
| **Track B: Foundations** | Alex (with Priya as peer mentor) | `select-filter-data` fundamentals, then a guided intro to groupby if time permits | Cannot realistically reach groupby in 90 min without the prerequisites |

Priya already knows groupby (0.80 confidence). She operates as a **peer mentor for Alex** during Track B and tackles **stretch challenges** during Track A activities. Do not leave her idle.

### Accessibility Notes (Woven Throughout)

Marcus has a visual impairment and uses screen magnification and high-contrast mode. Throughout this plan:
- All code examples produce **text output** (not just visual charts). Every plot is accompanied by the underlying numbers printed to the console.
- Avoid relying on color alone to convey information. When showing bar charts, also print the grouped DataFrame.
- Marcus prefers terminal over Jupyter. He works in `.py` scripts while others may use notebooks. Both paths are supported.
- Use `df.to_string()` for cleaner terminal output when DataFrames are wide.

### R-to-Python Bridge (For Nkechi)

Nkechi has extensive R experience and maps concepts fastest through equivalences. Code examples include R equivalent comments where relevant:
```python
# Python:  df.groupby("region")["revenue"].mean()
# R equiv: aggregate(revenue ~ region, data=df, FUN=mean)
# dplyr:   df %>% group_by(region) %>% summarise(mean_revenue = mean(revenue))
```

---

## Prerequisites Checklist

All software is pre-installed on lab workstations. These are **skill prerequisites**, verified during the session warm-up.

### Skill Prerequisites

- [ ] **Can load a CSV into a pandas DataFrame** (`import-pandas`)
  - Verify: Student can type `import pandas as pd; df = pd.read_csv("file.csv")` and get a DataFrame.
  - Status: All 5 students demonstrated this in Session 2. Nkechi is weakest here (0.55) — she knows the import but confuses DataFrame vs Series. Give her a 10-second reminder: "DataFrame = whole table. Series = one column."

- [ ] **Can inspect a DataFrame with `.head()`, `.info()`, `.shape`** (`inspect-dataframe`)
  - Verify: Student can answer "how many rows?" and "what columns exist?" by running inspect commands.
  - Status: Priya (0.85), Sofia (0.75), Marcus (0.70), Nkechi (0.45), Alex (not assessed).
  - Gap: Nkechi and Alex need support here. Covered in the warm-up.

- [ ] **Can select columns and filter rows** (`select-filter-data`) — PRIMARY PREREQUISITE
  - Verify: Student can write `df[df["column"] == "value"]` and `df[["col1", "col2"]]` without looking at a reference.
  - Status: Priya (0.80), Sofia (0.68 inferred), Marcus (0.50), Nkechi (0.41 inferred), Alex (not assessed).
  - **CRITICAL GAP:** 4/5 students have gaps here. The warm-up activity (minutes 5-25) addresses this directly. Alex's gap is too large for a warm-up to fix, which is why Track B exists.

- [ ] **Can define and call Python functions** (`python-functions`) — SECONDARY PREREQUISITE
  - Verify: Student understands that `.mean()` and `.sum()` are functions that take data and return a value.
  - Status: Priya (0.80), Nkechi (0.70), Sofia (0.65), Marcus (0.55), Alex (not assessed).
  - Mitigation: GroupBy uses built-in aggregation functions, not user-defined ones. Students do not need to write functions from scratch — they need to understand that `.mean()` means "calculate the average." This is addressed with a 60-second just-in-time explanation.

### Tool & Account Requirements

| Tool | Required? | Cost | Status |
|---|---|---|---|
| Python 3.11 | Yes | Free | Pre-installed on all workstations |
| pandas | Yes | Free | Pre-installed |
| matplotlib | Yes | Free | Pre-installed |
| Jupyter Notebook | Optional | Free | Pre-installed (Marcus may use terminal + .py files instead) |

---

## Materials To Prepare Before the Session

You need these ready before students arrive. Do not skip this section.

### 1. Dataset: `coffee_shop_sales.csv`

This dataset is designed for groupby exercises. It has clear categorical columns (store, drink_type, size) and numeric columns (quantity, revenue, rating) that beg the question "how many X per Y?"

Create this file and place it on every workstation's Desktop (or distribute via shared folder).

```csv
date,store,drink_type,size,quantity,revenue,rating
2026-01-06,Downtown,Latte,Large,45,247.50,4.5
2026-01-06,Downtown,Espresso,Small,62,186.00,4.2
2026-01-06,Campus,Latte,Medium,38,152.00,4.0
2026-01-06,Campus,Cold Brew,Large,29,159.50,4.7
2026-01-06,Suburbs,Latte,Small,18,63.00,3.5
2026-01-07,Downtown,Cold Brew,Large,51,280.50,4.6
2026-01-07,Downtown,Latte,Medium,40,180.00,4.3
2026-01-07,Campus,Espresso,Small,55,165.00,4.1
2026-01-07,Campus,Latte,Large,42,231.00,4.4
2026-01-07,Suburbs,Espresso,Medium,25,100.00,3.8
2026-01-08,Downtown,Espresso,Small,58,174.00,4.0
2026-01-08,Downtown,Cold Brew,Medium,35,157.50,4.5
2026-01-08,Campus,Cold Brew,Large,31,170.50,4.8
2026-01-08,Campus,Latte,Small,27,94.50,3.9
2026-01-08,Suburbs,Latte,Large,20,110.00,3.6
2026-01-09,Downtown,Latte,Large,48,264.00,4.4
2026-01-09,Campus,Espresso,Medium,50,200.00,4.2
2026-01-09,Campus,Cold Brew,Small,22,77.00,4.3
2026-01-09,Suburbs,Cold Brew,Large,15,82.50,3.7
2026-01-09,Suburbs,Espresso,Small,19,57.00,3.4
2026-01-10,Downtown,Cold Brew,Large,53,291.50,4.7
2026-01-10,Downtown,Espresso,Medium,44,176.00,4.1
2026-01-10,Campus,Latte,Large,39,214.50,4.5
2026-01-10,Campus,Espresso,Small,47,141.00,4.0
2026-01-10,Suburbs,Latte,Medium,21,84.00,3.5
```

This dataset is 25 rows — small enough to print and eyeball, large enough that you cannot answer "how many lattes did each store sell?" by scanning. That is the hook: groupby solves what your eyes cannot.

**Why coffee shop data:** Familiar to all ages. Clear categories. Intuitive questions ("which store sells the most?" "which drink is highest rated?"). No domain knowledge required.

### 2. Printed Handouts (one per student)

**Handout A: GroupBy Cheat Sheet** (see end of this plan)

**Handout B: Alex's Guided Worksheet** — A step-by-step worksheet for select-filter-data exercises that Alex works through with Priya. Print only 2 copies (Alex + Priya).

### 3. Pre-written starter notebook/script

Create `groupby_starter.py` (or `.ipynb`) with the loading code pre-written:

```python
import pandas as pd
import matplotlib.pyplot as plt

# Load the coffee shop sales data
df = pd.read_csv("coffee_shop_sales.csv")

# Quick look at the data
print(df.head())
print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")
print(df.info())
```

Students open this instead of typing boilerplate. Saves 3-4 minutes. Alex gets a separate starter file (see Track B materials below).

### 4. Alex's Track B starter file: `filter_practice.py`

```python
import pandas as pd

# Load the coffee shop sales data
df = pd.read_csv("coffee_shop_sales.csv")

# Let's look at all the data
print("=== ALL DATA ===")
print(df)
print()

# How many rows and columns?
print(f"This dataset has {df.shape[0]} rows and {df.shape[1]} columns")
print()

# What columns do we have?
print("=== COLUMNS ===")
print(list(df.columns))
print()

# -------------------------------------------
# EXERCISE 1: Select a single column
# -------------------------------------------
# Get just the 'store' column and print it.
# Hint: df["column_name"]
#
# YOUR CODE HERE:


# -------------------------------------------
# EXERCISE 2: Select multiple columns
# -------------------------------------------
# Get the 'store' and 'revenue' columns together.
# Hint: df[["column1", "column2"]]  <-- note the double brackets!
#
# YOUR CODE HERE:


# -------------------------------------------
# EXERCISE 3: Filter rows
# -------------------------------------------
# Show only rows where the store is "Downtown"
# Hint: df[df["column"] == "value"]
#
# YOUR CODE HERE:


# -------------------------------------------
# EXERCISE 4: Filter with numbers
# -------------------------------------------
# Show only rows where revenue is greater than 200
# Hint: df[df["column"] > number]
#
# YOUR CODE HERE:


# -------------------------------------------
# EXERCISE 5: Combine filter + select
# -------------------------------------------
# Show the drink_type and revenue columns, but ONLY
# for rows where the store is "Campus"
# Hint: first filter, then select columns from the result
#
# YOUR CODE HERE:


# -------------------------------------------
# BONUS: Your first groupby!
# -------------------------------------------
# If you get here, try this line and see what it prints:
# print(df.groupby("store")["revenue"].sum())
#
# What question does that answer?
# YOUR ANSWER (as a comment):
```

### 5. Whiteboard prep

Before students arrive, draw this on the whiteboard (or prepare a slide):

```
TODAY'S QUESTION: "How many ____ per ____?"

English:       "What is the total revenue PER store?"
Python:         df.groupby("store")["revenue"].sum()
                         ^              ^        ^
                    group BY this   THEN this  DO this

English:       "What is the average rating PER drink type?"
Python:         df.groupby("drink_type")["rating"].mean()
```

Leave this visible for the entire session. Point to it constantly.

---

## Timed Session Plan

---

### PHASE 1: OPENING + WARM-UP (0:00 - 0:25)

This phase has two jobs: (1) set context and energy, (2) shore up the select-filter-data prerequisite that 4/5 students are shaky on. Do not skip the warm-up — groupby will not stick if students cannot filter.

---

**[0:00 - 0:03] Welcome and Hook (3 min)**

Educator: As students settle in, have the whiteboard question visible: "How many ____ per ____?"

Say: "Good evening. Last session, you learned to load data and look at it. Tonight, you learn to *ask questions* of it. Specifically, you will learn to answer any question that sounds like 'how many X per Y' or 'what is the average X per Y.' By the end of tonight, you will be able to answer questions like: Which coffee shop location makes the most money? Which drink has the highest customer rating? One line of code. That is what we are building toward."

Do NOT open any code yet. This is a 30-second pitch, then move.

Students: Listening, settling in, opening their workstations.

Watch for: Latecomers. Do not restart. They will catch up during the warm-up exercise.

**[0:03 - 0:05] Distribute Materials and Orient (2 min)**

Educator: Hand out the GroupBy Cheat Sheet to everyone. Hand Alex and Priya the Track B guided worksheet (do this casually — walk it to them, do not announce it).

Say: "Open `groupby_starter.py` from your Desktop. Run it. You should see the first 5 rows of coffee shop sales data. Hold up your hand when you see it."

Students: Open and run the starter script. Verify they see the DataFrame.

Watch for: File-not-found errors. The CSV and the script must be in the same folder. If someone has trouble, solve it in 15 seconds or pair them with a neighbor.

Marcus note: If Marcus prefers terminal, he runs `python groupby_starter.py` directly. This works fine. Do not push Jupyter on him.

Time check: By 0:05, everyone should see data on screen. If not, keep going — stragglers will catch up during the warm-up.

---

**[0:05 - 0:15] Warm-Up: Select and Filter Review (10 min)**

*Target skill: select-filter-data (Bloom's: APPLICATION)*

This is a prerequisite warm-up, NOT new teaching. Frame it as review. But it is critical — 4/5 students need this reinforcement.

**I-Do (3 min):** Project your screen. Add to the starter script:

```python
# REVIEW: Selecting columns
# Get just the store and revenue columns
store_revenue = df[["store", "revenue"]]
print("=== Store and Revenue ===")
print(store_revenue)
print()

# REVIEW: Filtering rows
# Get only Downtown store sales
downtown = df[df["store"] == "Downtown"]
print("=== Downtown Only ===")
print(downtown)
print()

# REVIEW: Filter + select combo
# Downtown revenue only
downtown_revenue = df[df["store"] == "Downtown"]["revenue"]
print("=== Downtown Revenue ===")
print(downtown_revenue)
```

Run it. Point to each output. Say: "Selecting picks COLUMNS." (Gesture vertically.) "Filtering picks ROWS." (Gesture horizontally.) "You can chain them: filter first, then select."

For Nkechi, add verbally: "Nkechi, in R this would be `df[df$store == 'Downtown', 'revenue']` or with dplyr, `filter(df, store == 'Downtown') %>% select(revenue)`. Same idea, different syntax."

**You-Do (5 min):** "Your turn. In your script, write code to answer these two questions. You have 4 minutes."

Project these prompts:

```
QUESTION 1: Show all columns, but only for rows where drink_type is "Latte"
QUESTION 2: Show just the store and rating columns for sales with rating > 4.0
```

Walk the room. Check syntax. Common errors to watch for:
- Single `=` instead of `==` in the filter: "Remember, double equals for comparison."
- Forgetting quotes around "Latte": "String values need quotes."
- Single brackets instead of double for multi-column select: Show `df["col"]` vs `df[["col1","col2"]]` side by side on the whiteboard.

**Quick check (2 min):** "Who got Question 1? What does your output look like?" Ask someone to read their first row aloud. Confirm.

"Who got Question 2?" Confirm.

Answers:
```python
# Q1
lattes = df[df["drink_type"] == "Latte"]
print(lattes)

# Q2
high_rated = df[df["rating"] > 4.0][["store", "rating"]]
print(high_rated)
```

Watch for: Alex will likely struggle here. That is expected. Walk to Alex and Priya. Quietly say: "Alex, Priya is going to work with you on this. Start with the guided worksheet I gave you — it walks through these same ideas step by step." This is the Track B handoff. Do it calmly, without drawing attention.

Time check: By 0:15, you must be transitioning. If the warm-up is dragging, show the answers on screen, say "copy these down if you need them," and move.

---

**[0:15 - 0:25] The Bridge: From Filter to GroupBy (10 min)**

This is the pivotal teaching moment. You are building a conceptual bridge from what they know (filter) to what they are about to learn (groupby). Do not rush this.

**The Motivation Problem (3 min):**

Educator: Say: "You just filtered Downtown sales and got a list. Now I want to know: what is the total revenue for Downtown? You could add up the numbers by hand..."

Type on screen:
```python
downtown_revenue = df[df["store"] == "Downtown"]["revenue"]
print("Downtown total:", downtown_revenue.sum())
```

Run it. Show the answer.

"Great. Now what about Campus? And Suburbs?"

Type:
```python
campus_revenue = df[df["store"] == "Campus"]["revenue"]
print("Campus total:", campus_revenue.sum())

suburbs_revenue = df[df["store"] == "Suburbs"]["revenue"]
print("Suburbs total:", suburbs_revenue.sum())
```

Run it. Show all three totals.

"That works. But what if we had 50 stores? Or 500? Would you write 500 filter lines?"

Pause. Let the problem sink in.

For Marcus: "Marcus, imagine you have a pivot table in Excel — you drag 'store' to the row area and 'revenue' to the values area and pick 'sum.' That is exactly what we are about to do in one line of Python."

**The Reveal (3 min):**

"There is a better way. One line."

Type:
```python
# The groupby way
print(df.groupby("store")["revenue"].sum())
```

Run it. The output shows all three store totals in a clean table.

Point to the whiteboard diagram:
```
df.groupby("store")["revenue"].sum()
         ^              ^        ^
    group BY this   THEN this  DO this
```

Say: "Read it left to right. Group the data BY store. Look at the revenue column. SUM it up. One line. Same answer as three filter-and-sum operations."

For Nkechi: "In R, this is `aggregate(revenue ~ store, data=df, FUN=sum)` or with dplyr: `df %>% group_by(store) %>% summarise(total = sum(revenue))`. Same structure."

**Conceptual Check (2 min):**

"Before we practice, I want you to read this line to me in English."

Project:
```python
df.groupby("drink_type")["rating"].mean()
```

Ask: "What question does this answer? Say it in plain English."

Take 2-3 answers. The answer you want: "What is the average rating per drink type?" or "What is the mean rating for each kind of drink?"

If nobody gets it, read the whiteboard pattern aloud: "Group by drink_type, look at rating, calculate the mean. In English: what is the average rating per drink type?"

**Track Split (2 min):**

Say: "For the next 20 minutes, we are going to practice. Most of you will work through groupby exercises. Alex, you and Priya are going to keep building your filtering skills with the guided worksheet — and there is a bonus groupby problem at the end if you get there. Everyone is learning the same concepts; you are just taking different paths."

Assign pairs:
- **Alex + Priya:** Track B. Priya sits next to Alex. Priya helps Alex through the `filter_practice.py` worksheet. Priya uses downtime to work on the stretch challenges from Track A.
- **Nkechi + Sofia:** Track A partners. They sit together. Nkechi brings statistical intuition; Sofia brings visualization instincts. They will complement each other.
- **Marcus:** Track A, works solo. His screen magnification and accessibility setup make shoulder-to-shoulder pairing physically awkward. He gets the R-to-Python cheat sheet comments and a slightly different version of the exercises that prints all output as text (no visual-only charts). Check on him every 5-7 minutes.

Time check: By 0:25, the track split must be done and students must be moving to their positions. If you are behind, shorten the motivation problem — show only one manual filter instead of three.

---

### PHASE 2: HANDS-ON GROUPBY (0:25 - 0:55)

This is the core of the lesson. 30 minutes of active coding. Students should be typing for at least 25 of these 30 minutes. You circulate, troubleshoot, and redirect. Resist the urge to lecture.

---

**[0:25 - 0:40] Exercise Block 1: Basic GroupBy (15 min)**

*Target skill: pandas-groupby (Bloom's: APPLICATION)*

**Track A — Nkechi, Sofia, Marcus (and Priya when not helping Alex):**

Project these exercises. Students type them into their scripts.

```
EXERCISE 1 (2 min): Run this line and study the output.
    df.groupby("store")["revenue"].sum()
What question does it answer?

EXERCISE 2 (3 min): Modify the line to answer:
    "What is the AVERAGE revenue per store?"
Hint: change the aggregation function.

EXERCISE 3 (3 min): Write a new groupby to answer:
    "How many sales (rows) happened at each store?"
Hint: .count() counts rows.

EXERCISE 4 (4 min): Write groupby lines for EACH of these:
    a) Total quantity sold per drink type
    b) Average rating per store
    c) Total revenue per drink size (Small/Medium/Large)

EXERCISE 5 (3 min): CHALLENGE
    "What is the average revenue per store, but only
     for sales where rating > 4.0?"
    Hint: filter first, then groupby the result.
```

Expected answers:
```python
# Ex 1
print(df.groupby("store")["revenue"].sum())
# Answer: "What is the total revenue per store?"

# Ex 2
print(df.groupby("store")["revenue"].mean())

# Ex 3
print(df.groupby("store")["revenue"].count())
# or: print(df.groupby("store").size())

# Ex 4a
print(df.groupby("drink_type")["quantity"].sum())
# Ex 4b
print(df.groupby("store")["rating"].mean())
# Ex 4c
print(df.groupby("size")["revenue"].sum())

# Ex 5
high_rated = df[df["rating"] > 4.0]
print(high_rated.groupby("store")["revenue"].mean())
```

Marcus note: All these exercises produce text output. No visual barriers. If Marcus wants to see wider output, suggest `pd.set_option('display.width', 200)` at the top of his script.

Nkechi note: For each exercise, she can check her intuition by writing the R equivalent as a comment. Encourage this: "Nkechi, write the dplyr version as a comment above your Python line. That is a great way to learn."

Sofia note: She will want to plot things. Tell her: "Hold that thought — we are going to plot groupby results in the next exercise block. For now, focus on getting the numbers right."

Priya note: She should be with Alex during this block. If Alex is progressing well and Priya has downtime, she works on Exercises 4-5 independently.

Walk the room in this order every 5 minutes: Marcus (check accessibility), Alex+Priya (check Track B progress), Sofia+Nkechi (check they are not stuck).

Watch for:
- Forgetting quotes around string column names: `df.groupby(store)` instead of `df.groupby("store")`
- Trying to assign groupby to a variable but not printing it: "If you do not see output, add `print()` around your line."
- Confusion about count vs sum: "Count tells you how many rows. Sum adds up the numbers. Different questions."

Time check: By 0:40, most Track A students should have completed Exercises 1-4. Exercise 5 is a stretch — if only Priya and one other person get it, that is fine. Show the answer on screen and move.

**Track B — Alex (with Priya mentoring):**

Alex works through `filter_practice.py`. Priya sits next to him and helps, but does not type for him. The worksheet is self-paced with clear scaffolding.

Educator: Check on Alex at minute 30 and minute 37. At minute 30, Alex should be on Exercise 2 or 3. If he is stuck on Exercise 1, sit with him for 90 seconds and demonstrate the first one, then let him try Exercise 2.

At minute 37, if Alex has reached Exercise 4, tell Priya: "Great work. Alex, when you finish Exercise 5, try the bonus problem at the bottom — that is your first groupby."

If Alex has not reached Exercise 4 by minute 37, that is still good progress. He is building select-filter-data skills, which is exactly where he needs to be.

---

**[0:40 - 0:45] Quick Debrief + Stretch (5 min)**

Educator: "Pause your typing. Hands off keyboards."

Stand and stretch: "Stand up. Stretch your arms overhead. Roll your neck. Sit back down."

Quick comprehension check (2 min): "Without looking at your code, someone tell me: what is the difference between `.sum()` and `.count()` in a groupby?" Take 1-2 answers.

Then: "What does `.mean()` give you that `.sum()` does not?" Take 1-2 answers.

This is energy management. You are at the 45-minute mark — attention is dipping. The physical movement and verbal questions reset the room.

Priya redirect: If Priya has been mentoring Alex the whole time, publicly acknowledge it: "Priya has been doing great work helping Alex. Thanks, Priya." Then for the next block, let Priya work on her own stretch challenges. Alex can work independently or float to you for help.

Time check: By 0:45, you are back in seats and ready for Exercise Block 2.

---

**[0:45 - 0:55] Exercise Block 2: GroupBy + Visualization (10 min)**

*Target skills: pandas-groupby + basic-plotting (Bloom's: APPLICATION)*

**Track A — everyone except Alex (unless he reached the bonus):**

Project these exercises:

```
EXERCISE 6 (4 min): Visualize a groupby result.
    Run this code:

    df.groupby("store")["revenue"].sum().plot.bar()
    plt.title("Total Revenue by Store")
    plt.ylabel("Revenue ($)")
    plt.tight_layout()
    plt.savefig("revenue_by_store.png")
    plt.show()

    Then ALSO print the numbers:
    print(df.groupby("store")["revenue"].sum())

    Look at both. Does the chart match the numbers?

EXERCISE 7 (3 min): Create your OWN grouped bar chart.
    Pick any groupby from Exercises 1-4 and plot it.
    Add a title that describes what the chart shows.
    Save it as a PNG file.

EXERCISE 8 (3 min): STRETCH — Multi-column groupby
    What if you want revenue per store AND drink type?

    print(df.groupby(["store", "drink_type"])["revenue"].sum())

    Run it. What does the output look like?
    How is it different from grouping by just one column?
```

Expected answers:
```python
# Ex 6
df.groupby("store")["revenue"].sum().plot.bar()
plt.title("Total Revenue by Store")
plt.ylabel("Revenue ($)")
plt.tight_layout()
plt.savefig("revenue_by_store.png")
plt.show()
print(df.groupby("store")["revenue"].sum())

# Ex 7 — example
df.groupby("drink_type")["quantity"].sum().plot.bar()
plt.title("Total Quantity Sold by Drink Type")
plt.ylabel("Quantity")
plt.tight_layout()
plt.savefig("quantity_by_drink.png")
plt.show()

# Ex 8
print(df.groupby(["store", "drink_type"])["revenue"].sum())
# Output has a multi-level index (store + drink_type).
# Each combination gets its own row.
```

Marcus note: For Exercise 6, Marcus should focus on the printed numbers, not the chart. Tell him: "Marcus, the chart and the numbers show the same thing. If the chart is hard to read, the printed table is your source of truth."

Sofia note: This is Sofia's moment. She has strong viz instincts. She will likely want to customize the chart (colors, labels). Let her. If she asks about customization, point her to the cheat sheet — `plt.xlabel()`, `plt.ylabel()`, `plt.title()` are there.

Nkechi R bridge for Exercise 8:
```python
# Python: df.groupby(["store", "drink_type"])["revenue"].sum()
# dplyr:  df %>% group_by(store, drink_type) %>% summarise(total = sum(revenue))
```

Watch for:
- `plt.show()` blocking the script: If the plot window does not close automatically, students cannot see their printed output. Tell them to close the plot window, or add `plt.close()` after `plt.show()`.
- Multi-column groupby output is harder to read: Say "this is a preview — we will not go deep on multi-column groupby tonight. Just notice that you can group by more than one thing."

Time check: By 0:55, wrap up this block. If students are not done with Exercise 7, that is fine — they have the pattern. Show Exercise 8 on screen even if nobody attempted it, just to plant the seed.

**Track B — Alex:**

By this point Alex should be finishing the filter_practice.py worksheet. If he reached the bonus groupby problem, have him run it and tell you what he thinks the output means. That is a win.

If Alex finished early (unlikely but possible), have him try Exercise 6 from Track A with Priya's help.

---

### PHASE 3: APPLICATION + WRAP-UP (0:55 - 1:30)

---

**[0:55 - 1:15] Capstone Challenge: Coffee Shop Report (20 min)**

*Target skills: pandas-groupby + comprehension (Bloom's: APPLICATION + COMPREHENSION)*

This is the "put it all together" exercise. Students answer real business questions using groupby. This is where the learning lands.

Educator: Say: "You are now a data analyst. The coffee shop owner wants answers to four questions. Use groupby to answer each one. Write your code, run it, and write the answer in plain English as a comment."

Project (and it is on the cheat sheet):

```
THE COFFEE SHOP OWNER WANTS TO KNOW:

Q1: Which store has the highest total revenue?
    Write the groupby. Write the answer as a comment.

Q2: Which drink type has the highest average customer rating?
    Write the groupby. Write the answer as a comment.

Q3: What is the total quantity sold per drink size (Small/Medium/Large)?
    Write the groupby. Write a bar chart. Save it.

Q4: The owner is thinking about closing one store.
    Based on the data, which store would you recommend closing?
    Use at least TWO different groupby results to support your answer.
    Write your recommendation as a comment (2-3 sentences).
```

Expected answers:
```python
# Q1: Which store has the highest total revenue?
print(df.groupby("store")["revenue"].sum())
# Answer: Downtown has the highest total revenue.

# Q2: Which drink type has the highest average rating?
print(df.groupby("drink_type")["rating"].mean())
# Answer: Cold Brew has the highest average rating.

# Q3: Total quantity by size
size_qty = df.groupby("size")["quantity"].sum()
print(size_qty)
size_qty.plot.bar()
plt.title("Total Quantity Sold by Size")
plt.ylabel("Quantity")
plt.tight_layout()
plt.savefig("quantity_by_size.png")
plt.show()

# Q4: Which store to close?
print(df.groupby("store")["revenue"].sum())
print(df.groupby("store")["quantity"].sum())
print(df.groupby("store")["rating"].mean())
# Recommendation: I would recommend closing Suburbs.
# It has the lowest total revenue ($396.50), the lowest
# total quantity sold (93 units), and the lowest average
# customer rating (3.58). All three metrics point the same way.
```

**Differentiation within the capstone:**

- **Alex (Track B):** Give him a simplified version: "Alex, answer Q1 and Q2 only. For Q1, use the groupby line from the bonus problem on your worksheet. For Q2, change 'revenue' to 'rating' and 'sum' to 'mean'." Priya can help if needed, but by now she should be working on her own stretch challenge (see below).

- **Marcus:** Q1-Q3 are all text-output friendly. For Q3, he can skip the bar chart and just print the numbers. Q4 is a comprehension question that plays to his strength — 15 years of Excel-based data intuition. He will likely have the best answer in the room.

- **Sofia:** She will nail Q3 (visualization) and probably customize the chart. For Q4, encourage her to think about what a marketer would recommend, not just what the numbers say.

- **Nkechi:** She will pattern-match these to R instantly. Let her write both Python and R versions. For Q4, her statistical training will shine — she may want to talk about sample size being too small for real conclusions. Acknowledge that: "Good instinct, Nkechi. With only 25 rows, we would want more data. But for tonight, work with what we have."

- **Priya (stretch challenge):** She finishes Q1-Q4 fast. Give her this:

```
PRIYA'S STRETCH:
1. Use .agg() to get MULTIPLE aggregations at once:
   df.groupby("store")["revenue"].agg(["sum", "mean", "count"])

2. Create a grouped bar chart showing revenue by BOTH store
   and drink type:
   df.groupby(["store", "drink_type"])["revenue"].sum().unstack().plot.bar()
   plt.title("Revenue by Store and Drink Type")
   plt.tight_layout()
   plt.savefig("revenue_store_drink.png")
   plt.show()

3. Write a function that takes a column name and returns
   the groupby-sum for all stores:
   def store_summary(column):
       return df.groupby("store")[column].sum()
   print(store_summary("revenue"))
   print(store_summary("quantity"))
```

Walk the room during this block. Spend roughly:
- 2 min with Alex (check he is attempting Q1)
- 2 min with Marcus (check accessibility, answer questions)
- 3 min with Sofia+Nkechi (they may have questions about Q4)
- 1 min with Priya (give her the stretch if she is done)
- Repeat the loop

Watch for:
- Students who get Q1-Q2 right but freeze on Q4: "Q4 asks for your opinion backed by data. There is no single right answer. Start by running two groupby commands and comparing the stores."
- Students who forget to add `.sum()` or `.mean()` at the end of a groupby: "Your groupby is not finished. You told pandas HOW to group, but not WHAT to calculate. Add `.sum()` or `.mean()` at the end."
- Copy-paste errors from the cheat sheet: Encourage typing it out — muscle memory matters.

Time check: By 1:10, start wrapping up the capstone regardless of where students are. Say: "Finish the question you are on and save your file. We are going to share answers in 2 minutes."

---

**[1:15 - 1:22] Share and Discuss (7 min)**

Educator: "Let us hear some answers."

Q1 (1 min): "Which store has the highest total revenue?" Ask Marcus or Sofia. Confirm the answer (Downtown).

Q2 (1 min): "Which drink has the highest average rating?" Ask Nkechi. Confirm (Cold Brew).

Q4 (3 min): This is the interesting one. "Who wants to tell the coffee shop owner which store to close?"

Take 2-3 answers. Students will probably all say Suburbs. Ask: "Did anyone argue for keeping all three stores open?" (Unlikely, but if someone did, celebrate the contrarian thinking.)

Key teaching moment: "Notice what you just did. You did not guess. You did not use your gut. You wrote three lines of code, looked at the numbers, and made a data-driven recommendation. That is data analysis."

Alex check-in (2 min): "Alex, did you get to try a groupby?" If yes, ask him what question it answered. Celebrate it. If not, say: "Alex, you spent tonight mastering filtering, which is the foundation groupby is built on. Next session, you will be ready."

This is important — Alex must not feel like he failed. He worked on prerequisites, which is exactly the right pedagogical move.

---

**[1:22 - 1:27] Recap: The One Thing (5 min)**

Educator: Point to the whiteboard. The "how many X per Y?" pattern should still be visible.

Say: "If you remember one thing from tonight, it is this pattern."

Write on the whiteboard (or project):

```
df.groupby("category_column")["number_column"].agg_function()

.sum()   = total
.mean()  = average
.count() = how many
.min()   = smallest
.max()   = largest
```

"Any time someone asks you 'how many X per Y?' or 'what is the average X per Y?', you now know how to answer it in one line of Python."

"This works for any dataset. Coffee sales, student grades, hospital records, survey responses. The pattern is always the same."

For Nkechi, say: "Nkechi, this is pandas' version of `group_by() %>% summarise()` from dplyr. Same idea."

For Marcus, say: "Marcus, this is the Python equivalent of a pivot table with one row field and one value field."

---

**[1:27 - 1:30] Logistics and Close (3 min)**

Educator: "A few things before you go."

1. "Your script file is yours. Everything you wrote tonight is saved on your workstation. If you want a copy, email it to yourself or save it to a USB drive before you leave."

2. "The cheat sheet has every groupby pattern we used tonight, plus the R equivalents for Nkechi. Take it home."

3. "Next session, we will build on groupby. If you want to be prepared, look at the cheat sheet and try to write one groupby from memory before next time. That is optional — remember, no homework."

4. "Alex, you made great progress on filtering tonight. That is the foundation. If you want to practice before next session, try the first two exercises from tonight's groupby block — Priya can send you the code."

Say: "Thanks everyone. Good work tonight. See you next Tuesday."

Students: Save files, pack up, leave.

Watch for: Students who linger with questions. Answer them, but respect the 90-minute boundary for those who need to leave for their commute.

---

## Activities Summary

### Activity 1: Select/Filter Warm-Up

| Field | Value |
|---|---|
| **Objective** | Reinforce select-filter-data as prerequisite for groupby |
| **Duration** | 10 minutes |
| **Format** | I-Do (3 min), You-Do (5 min), Quick Check (2 min) |
| **Materials** | `groupby_starter.py`, projector |

**Instructions:** Educator demonstrates column selection and row filtering with the coffee shop dataset. Students write two filter operations independently.

**Success criteria:** Students can write `df[df["column"] == "value"]` and `df[["col1", "col2"]]` without looking at a reference.

**Common pitfalls:**
- Single `=` vs double `==`: "One equals assigns. Two equals compares."
- Missing quotes around string values: Remind them strings always need quotes.
- Single vs double bracket confusion: Draw both on whiteboard side by side.

---

### Activity 2: Bridge — From Filter to GroupBy

| Field | Value |
|---|---|
| **Objective** | Motivate groupby by showing the pain of repeated filtering |
| **Duration** | 10 minutes |
| **Format** | Guided demonstration with class participation |
| **Materials** | Projector, whiteboard diagram |

**Instructions:** Show the "manual way" (three separate filters + sums), then reveal the one-line groupby equivalent. Students translate a groupby line into plain English.

**Success criteria:** At least 3 students can say what `df.groupby("drink_type")["rating"].mean()` does in plain English.

**Common pitfalls:**
- Students see groupby as "magic" without understanding the steps: The three-filter-then-sum demo grounds it in something they already know.
- Nkechi tries to write R syntax: Proactively give her the Python-R mapping.

---

### Activity 3: Exercise Block 1 — Basic GroupBy

| Field | Value |
|---|---|
| **Objective** | Practice groupby with .sum(), .mean(), .count() on different columns |
| **Duration** | 15 minutes |
| **Format** | Individual practice with pair support (Sofia+Nkechi paired, Marcus solo, Alex+Priya on Track B) |
| **Materials** | Exercise prompts (projected), cheat sheet |

**Instructions:** 5 progressive exercises from reading groupby output to writing groupby lines to combining filter + groupby.

**Success criteria:** Students complete at least Exercises 1-4. Exercise 5 (filter + groupby combo) is stretch.

**Common pitfalls:**
- Forgetting the aggregation function: `df.groupby("store")["revenue"]` alone returns a GroupBy object, not data. Must add `.sum()` etc.
- Column name typos: "Copy the column name from `df.columns` output if you are unsure of spelling."
- Confusion between what to group by vs what to aggregate: "Group by the CATEGORY. Aggregate the NUMBER."

---

### Activity 4: Exercise Block 2 — GroupBy + Visualization

| Field | Value |
|---|---|
| **Objective** | Chain groupby results into bar charts |
| **Duration** | 10 minutes |
| **Format** | Individual with pair support |
| **Materials** | Exercise prompts (projected), matplotlib, cheat sheet |

**Instructions:** Plot a groupby result as a bar chart. Create a custom chart. Preview multi-column groupby.

**Success criteria:** Students produce at least one saved bar chart PNG showing a grouped summary.

**Common pitfalls:**
- `plt.show()` blocks script execution: "Close the plot window to continue." Or add `plt.close()` after.
- Chart is too squished: Add `plt.tight_layout()` before `plt.savefig()`.
- Multi-column groupby output is confusing: "Just notice the pattern for now. We will come back to this."

---

### Activity 5: Capstone Challenge — Coffee Shop Report

| Field | Value |
|---|---|
| **Objective** | Answer real business questions using groupby, synthesize into a recommendation |
| **Duration** | 20 minutes |
| **Format** | Individual with educator circulation |
| **Materials** | Capstone prompt (projected), all previous code as reference |

**Instructions:** Answer 4 business questions. Q1-Q3 are mechanical (write the groupby, report the answer). Q4 requires judgment (recommend which store to close using multiple groupby results).

**Success criteria:**
- Track A students: complete Q1-Q3 and attempt Q4.
- Track B (Alex): complete Q1 and attempt Q2.
- Priya: complete all 4 + attempt stretch challenges.

**Common pitfalls:**
- Freezing on Q4: "Start by running at least two groupby commands. Compare the stores. Which one looks weakest?"
- Copying answers instead of running code: "Run it yourself. The output might be different if you have a typo in your code."

---

### Activity 6 (Track B): Alex's Filter Practice

| Field | Value |
|---|---|
| **Objective** | Build select-filter-data skill with scaffolded exercises |
| **Duration** | 30 minutes (minutes 25-55, concurrent with Track A) |
| **Format** | Paired — Alex coding, Priya mentoring |
| **Materials** | `filter_practice.py` worksheet |

**Instructions:** 5 progressive exercises on selecting columns and filtering rows, with a bonus groupby teaser at the end.

**Success criteria:** Alex completes Exercises 1-4 independently (with Priya available for hints, not answers). Reaching the bonus groupby problem is a significant win.

**Common pitfalls:**
- Alex gets overwhelmed and shuts down: "Alex, just do the next exercise. Do not think about all of them. One at a time."
- Priya does the typing for Alex: Quietly remind Priya: "Let Alex type. You can point to the hint, but his fingers need the practice."

---

## Contingency Notes

### If students struggle with the select/filter warm-up (minutes 5-15)

The groupby lesson depends on this. If more than 2 Track A students cannot write a basic filter by minute 15, spend 5 more minutes on it (cut from Exercise Block 2 later). Show the pattern on the whiteboard:

```
df[df["column"] == "value"]    <-- memorize this shape
```

Have them type it 3 times with different column/value pairs. Repetition builds muscle memory.

### If the bridge demo does not land (minutes 15-25)

If students do not see why groupby is better than manual filtering, try the Excel analogy: "Imagine you have a spreadsheet. You want the total revenue for each of 50 stores. Would you create 50 separate filtered views and add them up by hand? Or would you use a pivot table? GroupBy is the pivot table."

### If Marcus cannot read the groupby output

The default pandas output may be too small or low-contrast. Add this to the top of his script:
```python
pd.set_option('display.width', 200)
pd.set_option('display.max_columns', 20)
pd.set_option('display.max_rows', 50)
```

If the terminal font is too small, help him increase the terminal font size. On macOS: Cmd+Plus. On most Linux terminals: Ctrl+Plus.

### If Nkechi keeps writing R syntax

Do not correct her harshly. Say: "That is the right R code. In Python, the equivalent is..." and show the translation. Over time, the Python syntax will become natural. The R knowledge is an asset, not a problem.

### If Alex gets frustrated or shuts down

Priya should recognize this. If it happens: "Alex, take a 2-minute break. Get some water. When you come back, start from the exercise you completed successfully — re-run it. Seeing it work again rebuilds confidence."

If Priya is unavailable, the educator should spend 2-3 minutes with Alex. Do one exercise together, with Alex typing and the educator narrating: "Type df, open bracket, open bracket, quote, store, quote, close bracket, close bracket. Now run it. What do you see?"

### If Priya is bored

She knows groupby already. The peer mentoring role should keep her engaged through minute 40. After that, the stretch challenges (multi-column groupby, `.agg()`, writing functions) give her new material. If she finishes everything, ask her to write a "mini tutorial" for Alex explaining groupby in her own words — teaching is the highest form of learning.

### If you are running behind at minute 30

You are in Exercise Block 1. Cut Exercises 4c and 5 from Track A. Show them on screen. Move straight to Exercise Block 2 at minute 40.

### If you are running behind at minute 45

You are at the debrief. Cut the debrief entirely — just do the physical stretch (1 min) and move to Exercise Block 2. Cut Exercise 8 (multi-column groupby) from Block 2. You need to protect the capstone time.

### If you are running behind at minute 60

You are in trouble. Cut Exercise Block 2 entirely. Show one grouped bar chart on screen (30 seconds). Move straight to the capstone. Reduce the capstone to Q1, Q2, and Q4 only (skip Q3/the chart). You still have 30 minutes for capstone + wrap-up. The lesson is salvageable.

### If tech fails (projector dies)

Use the whiteboard. Write the groupby pattern:
```
df.groupby("column")["value"].sum()
```
Students still have their workstations. Dictate the exercises verbally. The cheat sheet handout has all the patterns. This is clunky but workable.

### If tech fails (workstations crash / Python not working)

Pair students on working machines. With 20 workstations and 5 students, you can afford failures. If more than 3 are down, switch to a whiteboard-only conceptual session: write groupby expressions on the board, have students predict the output verbally, then show the answer. Not ideal, but the conceptual learning still happens.

---

## What To Cut If You Are Short on Time

Priority order (cut from the bottom first):

| Priority | What to Cut | Time Saved | Impact |
|---|---|---|---|
| CUT FIRST | Exercise 8 (multi-column groupby) | 3 min | Low — it is a preview, not essential |
| CUT SECOND | Exercise 5 (filter + groupby combo) | 3 min | Low — Exercise Block 2 covers combining skills |
| CUT THIRD | Capstone Q3 (bar chart) | 4 min | Medium — but they already plotted in Block 2 |
| CUT FOURTH | Physical stretch / debrief at minute 40 | 5 min | Medium — energy management suffers |
| CUT FIFTH | Share and Discuss section (minute 75) | 5 min | Medium — students miss the "so what" moment but keep hands-on time |
| CUT SIXTH | Reduce capstone to Q1 + Q4 only | 8 min | High — but Q4 is the real learning moment, so protect it |

**Never cut:**
- The bridge demo (minutes 15-25). Without it, groupby is just syntax memorization.
- The capstone Q4 (business recommendation). It is the only exercise that requires comprehension, not just application. It is the proof that students learned something, not just copied something.
- Alex's Track B entirely. He needs differentiated instruction. Cutting it means he sits through a lesson he cannot follow.

---

## Logistics & Links

| Resource | URL / Location |
|---|---|
| `coffee_shop_sales.csv` | Placed on each workstation Desktop by educator before class |
| `groupby_starter.py` | Placed on each workstation Desktop by educator before class |
| `filter_practice.py` (Alex's worksheet) | Placed on Alex's workstation by educator before class |
| GroupBy Cheat Sheet (printed) | One per student, handed out at minute 3 |
| Alex's Guided Worksheet (printed) | Two copies — Alex and Priya, handed out at minute 3 |
| pandas groupby documentation | https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.groupby.html |
| pandas aggregation functions | https://pandas.pydata.org/docs/reference/groupby.html#computations-descriptive-stats |
| matplotlib bar chart docs | https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.bar.html |
| Python 3.11 docs | https://docs.python.org/3.11/ |
| Practice datasets (optional) | https://www.kaggle.com/datasets |

---

## GroupBy Cheat Sheet (Print One Per Student)

### The Pattern

```
ENGLISH:    "What is the [total/average/count] of [NUMBER COLUMN] per [CATEGORY COLUMN]?"

PYTHON:     df.groupby("CATEGORY")["NUMBER"].agg_function()

EXAMPLE:    df.groupby("store")["revenue"].sum()
                      ^              ^        ^
                 group BY this   LOOK at this  DO this
```

### Aggregation Functions

```python
.sum()       # Total            "What is the total revenue per store?"
.mean()      # Average          "What is the average rating per drink?"
.count()     # How many         "How many sales per store?"
.min()       # Smallest         "What was the lowest revenue per store?"
.max()       # Largest          "What was the highest rating per drink?"
.median()    # Middle value     "What is the median quantity per size?"
```

### Common Patterns

```python
# Basic groupby
df.groupby("store")["revenue"].sum()

# Groupby + filter first
high_rated = df[df["rating"] > 4.0]
high_rated.groupby("store")["revenue"].mean()

# Groupby + bar chart
df.groupby("store")["revenue"].sum().plot.bar()
plt.title("Total Revenue by Store")
plt.ylabel("Revenue ($)")
plt.tight_layout()
plt.savefig("chart.png")
plt.show()

# Multiple aggregations at once
df.groupby("store")["revenue"].agg(["sum", "mean", "count"])

# Group by TWO columns
df.groupby(["store", "drink_type"])["revenue"].sum()
```

### For R Users (Nkechi's Bridge)

```
PYTHON                                          R (dplyr)
------                                          ---------
df.groupby("store")["revenue"].sum()            df %>% group_by(store) %>% summarise(total = sum(revenue))
df.groupby("store")["revenue"].mean()           df %>% group_by(store) %>% summarise(avg = mean(revenue))
df.groupby("store")["revenue"].count()          df %>% group_by(store) %>% summarise(n = n())
df.groupby("store")["revenue"].agg(["sum",      df %>% group_by(store) %>%
    "mean", "count"])                               summarise(total=sum(revenue),
                                                             avg=mean(revenue), n=n())

PYTHON                                          R (base)
------                                          --------
df.groupby("store")["revenue"].sum()            aggregate(revenue ~ store, data=df, FUN=sum)
df[df["store"]=="Downtown"]                     subset(df, store=="Downtown")
df[["store","revenue"]]                         df[, c("store","revenue")]
```

### For Excel Users (Marcus's Bridge)

```
GROUPBY in Python              =  PIVOT TABLE in Excel
df.groupby("store")            =  Drag "store" to Rows
["revenue"]                    =  Drag "revenue" to Values
.sum()                         =  Set Value Field Settings to "Sum"

df[df["store"]=="Downtown"]    =  Filter the column for "Downtown"
df[["store","revenue"]]        =  Hide all columns except store & revenue
```

### Quick Reference

```
"How many ____ per ____?"           df.groupby("____")["____"].count()
"What is the total ____ per ____?"  df.groupby("____")["____"].sum()
"What is the average ____ per ___?" df.groupby("____")["____"].mean()
"Show me a chart of ____ per ____"  df.groupby("____")["____"].sum().plot.bar()
```

---

## Prerequisite Gap Analysis

### Assessed gaps against `pandas-groupby` prerequisites

| Student | select-filter-data | python-functions | Ready for groupby? |
|---|---|---|---|
| Priya | 0.80 (solid) | 0.80 (solid) | YES — already knows groupby. Use as peer mentor. |
| Sofia | 0.68 (inferred, needs reinforcement) | 0.65 (adequate) | YES with warm-up — the 10-min filter review should be sufficient. |
| Marcus | 0.50 (knowledge only, not application) | 0.55 (comprehension) | BORDERLINE — the warm-up and Excel analogies are critical for him. Monitor closely. |
| Nkechi | 0.41 (inferred, weak) | 0.70 (adequate) | BORDERLINE — weak on pandas syntax but strong on concepts. The R bridge helps her skip the syntax gap. |
| Alex | not assessed (prereqs not met) | not assessed | NO — python-control-flow is only 0.30. Cannot reach groupby in 90 min. Track B is the right call. |

### Risk assessment

- **Highest risk:** Marcus freezes during Exercise Block 1 because his filter skills are not automated enough. Mitigation: The Excel analogy grounds the concept; the cheat sheet gives him copy-paste patterns; you check on him every 5-7 minutes.
- **Second risk:** Nkechi writes R syntax and gets errors. Mitigation: R-to-Python bridge on the cheat sheet. Proactive verbal bridges during demos.
- **Third risk:** Alex feels left behind on Track B. Mitigation: Frame Track B as "building the foundation." Check on him. Celebrate any progress. The bonus groupby problem gives him a taste of the main topic.

---

*Generated by the Pedagogical Reasoning Engine*
*Last updated: 2026-02-12*
