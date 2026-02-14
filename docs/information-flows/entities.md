# Entities and Relationships

The engine has 6 core entities. Everything else (assessments, debriefs, reasoning traces, teaching notes) are **events** that flow between them.

## The 6 entities

| Entity | What it is | File location |
|--------|-----------|---------------|
| **Domain** | A subject area defined as a skill graph (DAG of skills with Bloom's levels and dependencies) | `data/domains/{slug}/` |
| **Group** | A cohort of learners studying a domain together, with interview context (setting, constraints, affective notes) | `data/groups/{slug}.md` |
| **Learner** | An individual with assessed and inferred skill levels, belonging to a group | `data/learners/{id}.md` |
| **Educator** | A teaching profile — style preferences, strengths, timing patterns, content confidence | `data/educators/{id}.json` |
| **Lesson** | A timed, stage-directed plan for a specific group in a specific domain | `data/lessons/{id}.md` |
| **Assessment** | A session where a learner's skills are evaluated through conversation | `data/assessments/{code}.md` |

## How they connect

```mermaid
erDiagram
    DOMAIN {
        string slug PK "e.g. python-data-analysis"
        json skills "25 skills with Bloom's levels"
        json dependencies "48 directed edges"
        json manifest "audience, tags, setting"
        json teaching_notes "accumulated wisdom"
    }

    GROUP {
        string slug PK "e.g. tuesday-cohort"
        string domain FK "which domain"
        list members "learner IDs"
        string setting "classroom, field, online"
        text affective_context "confidence, dynamics"
        text constraints "time, accessibility"
    }

    LEARNER {
        string id PK "e.g. priya-sharma"
        string group FK "which group"
        string domain FK "which domain"
        list assessed_skills "skill + confidence + Bloom's"
        list inferred_skills "predicted from dependencies"
        text affective_profile "confidence, motivation"
    }

    EDUCATOR {
        string id PK "e.g. dr-sarah-chen"
        json teaching_style "% lecture, discussion, hands-on..."
        json strengths "with confidence scores"
        json timing_patterns "learned adjustments"
        json content_confidence "per domain"
    }

    LESSON {
        string id PK "date-topic-group slug"
        string domain FK "which domain"
        string group FK "which group"
        string educator FK "optional"
        int duration_min "session length"
        text plan "timed sections with stage directions"
    }

    ASSESSMENT {
        string code PK "8-char uppercase"
        string domain FK "which domain"
        string group FK "which group"
        list target_learners "who to assess"
        string status "active or completed"
        text context "why this assessment exists"
    }

    DOMAIN ||--o{ GROUP : "groups study a domain"
    GROUP ||--o{ LEARNER : "groups contain learners"
    DOMAIN ||--o{ LEARNER : "learners have skills in a domain"
    DOMAIN ||--o{ LESSON : "lessons teach domain skills"
    GROUP ||--o{ LESSON : "lessons are for a group"
    EDUCATOR |o--o{ LESSON : "educator optionally teaches"
    DOMAIN ||--o{ ASSESSMENT : "assessments check domain skills"
    GROUP ||--o{ ASSESSMENT : "assessments target a group"
    ASSESSMENT }o--o{ LEARNER : "assessments evaluate learners"
```

## What depends on what

Nothing exists in a vacuum. Here's the creation dependency order:

```mermaid
graph TD
    D[Domain] --> G[Group]
    D --> E[Educator]
    G --> L[Learner]
    D --> L
    G --> A[Assessment]
    D --> A
    L --> A
    G --> LP[Lesson Plan]
    D --> LP
    E -.->|optional| LP

    style D fill:#4f46e5,color:#fff
    style G fill:#0891b2,color:#fff
    style L fill:#059669,color:#fff
    style E fill:#d97706,color:#fff
    style A fill:#dc2626,color:#fff
    style LP fill:#7c3aed,color:#fff
```

**Domain** is the root — everything flows from having a skill graph. **Educator** is the one independent entity; it can exist before any domain does, but it only becomes useful when connected to a lesson.

## Multiplicity rules

- A domain can have **many groups** studying it (Tuesday cohort and Thursday cohort both learning Python)
- A group belongs to **one domain** (the Tuesday cohort studies python-data-analysis)
- A group has **many learners**; a learner belongs to **one group** (at the profile level)
- A domain can have **many lessons** (different topics, different days, different groups)
- A group can have **many lessons** over time (Week 1, Week 2, Week 3...)
- An educator can teach **many lessons** across different domains and groups
- A lesson has **one domain**, **one group**, and **optionally one educator**
- An assessment targets **one domain** and **one group**, but can assess **many learners**

## ID conventions

| Entity | Format | Example |
|--------|--------|---------|
| Domain | `kebab-case` | `python-data-analysis` |
| Group | `kebab-case` | `tuesday-cohort` |
| Learner | `kebab-case` | `priya-sharma` |
| Educator | `kebab-case` | `dr-sarah-chen` |
| Lesson | `date-topic-group` | `2026-02-12-pandas-groupby-tuesday-cohort` |
| Assessment | `8-char uppercase` | `TUE-2026-0211` |
