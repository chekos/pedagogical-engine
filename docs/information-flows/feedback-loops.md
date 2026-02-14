# Feedback Loops: How the engine gets smarter

The engine doesn't just plan lessons — it learns from every session. Three feedback loops compound over time.

## The three loops

```mermaid
graph TD
    subgraph "Loop 1: Teaching Wisdom"
        L1[Teach a lesson] --> D1[Debrief]
        D1 --> TN[Teaching Notes<br/>timing, confusion points,<br/>success patterns]
        TN --> NL1[Next lesson uses wisdom<br/>"Based on 18 sessions,<br/>I've allocated 20 min instead of 15"]
        NL1 --> L1
    end

    subgraph "Loop 2: Educator Calibration"
        L2[Teach a lesson] --> D2[Debrief]
        D2 --> EP[Educator Profile<br/>timing adjustments,<br/>style preferences]
        EP --> NL2[Next lesson customized<br/>to educator's patterns]
        NL2 --> L2
    end

    subgraph "Loop 3: Learner Growth"
        A[Assessment] --> LP[Learner Profile<br/>skills + Bloom's levels]
        LP --> LS[Lesson targets gaps]
        LS --> RA[Re-assessment or<br/>next assessment]
        RA --> LP
    end

    style TN fill:#d97706,color:#fff
    style EP fill:#d97706,color:#fff
    style LP fill:#059669,color:#fff
```

## Loop 1: Teaching wisdom (domain-level)

Every debrief feeds observations into the domain's teaching notes. These notes accumulate confidence over time.

```mermaid
graph LR
    S1[Session 1<br/>groupby ran 5 min over] --> TN1["Teaching note created<br/>confidence: 0.4"]
    S5[Session 5<br/>groupby ran 7 min over] --> TN2["Confidence rises to 0.7<br/>confirmed in 5 sessions"]
    S18[Session 18<br/>same pattern] --> TN3["Confidence: 0.92<br/>'Allocate 20 min, not 15'"]
    TN3 --> LP[Lesson plan automatically<br/>adjusts timing]

    style TN1 fill:#fbbf24,color:#000
    style TN2 fill:#f59e0b,color:#000
    style TN3 fill:#d97706,color:#fff
    style LP fill:#7c3aed,color:#fff
```

**What gets tracked:**
- Timing patterns (which activities consistently run over/under)
- Confusion points (where learners consistently struggle)
- Success patterns (activities/metaphors that work reliably)
- Activity recommendations (what works for which group levels)
- Accessibility patterns (accommodations that helped)
- Group composition effects (how pairing strategies performed)

**How it's used:** Before composing a lesson, the engine queries teaching wisdom and cites it: *"Based on 18 previous sessions, groupby exercises run 5-8 minutes over for beginner-to-intermediate groups. I've allocated 20 minutes instead of 15."*

## Loop 2: Educator calibration (educator-level)

Each educator develops a profile over time. The engine learns their patterns and adapts.

```mermaid
graph LR
    Interview["First conversation<br/>'I like hands-on coding'"] --> P1["Profile created<br/>hands_on: 0.40"]
    Debrief1["Debrief: 'discussion<br/>section fell flat'"] --> P2["Discussion weight<br/>reduced to 0.15"]
    Debrief2["Debrief: 'hands-on<br/>ran +5 min again'"] --> P3["Timing pattern:<br/>hands_on: +5 min"]
    P3 --> Lesson["Next lesson:<br/>hands-on sections shortened by 5 min,<br/>more hands-on activities,<br/>fewer discussions"]

    style P1 fill:#fbbf24,color:#000
    style P2 fill:#f59e0b,color:#000
    style P3 fill:#d97706,color:#fff
    style Lesson fill:#7c3aed,color:#fff
```

**What gets calibrated:**
- Teaching style distribution (which activity types the educator prefers and excels at)
- Timing patterns (hands-on always runs +5 min? Shorten those sections.)
- Content confidence (expert in Python? Bullet points are enough. New to ecology? Full talking points.)
- Contingency style (structured fallbacks vs. open-ended pivots)

**How it's used:** The lesson composer loads the educator profile and customizes the plan. Two educators teaching the same group the same topic get different plans.

## Loop 3: Learner growth (learner-level)

Learner profiles track skill progression. Each assessment updates the profile, and each lesson targets remaining gaps.

```mermaid
graph LR
    A1["Assessment 1<br/>Alex: 6 skills at Knowledge level"] --> L1["Lesson 1 targets<br/>Alex's gaps with<br/>beginner track + mentor pairing"]
    L1 --> A2["Assessment 2<br/>Alex: 10 skills,<br/>some at Comprehension"]
    A2 --> L2["Lesson 2 adjusts:<br/>Alex moves to intermediate track"]

    style A1 fill:#dc2626,color:#fff
    style A2 fill:#dc2626,color:#fff
    style L1 fill:#7c3aed,color:#fff
    style L2 fill:#7c3aed,color:#fff
```

**What gets tracked per learner:**
- Assessed skills with confidence scores and Bloom's levels
- Inferred skills (predicted from dependency chains)
- Affective profile (confidence, motivation, social preferences)

**Bonus — cross-domain transfer:** When a learner has skills in one domain, the engine predicts partial readiness in another. Maya's evaluation-level ecology analysis skills suggest she might handle data analysis reasoning — but at lower confidence (capped at 0.55).

## The compounding effect

```mermaid
graph TD
    S1["Session 1<br/>Cold start: no wisdom,<br/>no educator profile,<br/>basic learner profiles"] --> S5["Session 5<br/>12 teaching notes,<br/>educator timing calibrated,<br/>learner profiles updated"]
    S5 --> S20["Session 20<br/>24 teaching notes (high confidence),<br/>5 cross-skill patterns detected,<br/>educator profile mature,<br/>learner growth tracked"]
    S20 --> S50["Session 50+<br/>Engine cites specific evidence,<br/>predicts friction before teaching,<br/>lesson plans feel 'dialed in'"]

    style S1 fill:#94a3b8,color:#fff
    style S5 fill:#64748b,color:#fff
    style S20 fill:#475569,color:#fff
    style S50 fill:#1e293b,color:#fff
```

The engine is designed so that every session makes the next one better. This is the flywheel.
