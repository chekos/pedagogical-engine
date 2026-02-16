# Specification: Learner Portal

**Project:** AI-Native Knowledge Engine for Educators
**Builder:** chekos
**Status:** Feature spec — ready for implementation

---

## What this is

A read-only, code-accessed page where a learner can see their own progress, completed and pending assessments, and educator-shared notes — rendered in whatever language they choose, adapted to whoever is looking at it.

No account. No login. No PII stored. The learner's persistent code is their key. They can share it with parents, classmates, coaches, or prospective employers. Anyone with the code sees the same underlying data, but the AI renders it for the audience and language context.

This is the learner-facing projection of a primitive that already exists: the learner profile. The engine already tracks assessed skills, inferred skills, group membership, and assessment history. The portal gives that data a face.

---

## Why this matters

An educator's job doesn't end at lesson delivery. Educators communicate progress to learners, advocate for them with families, write recommendations, and help them see what they're capable of. Today, those workflows live in fragmented tools — gradebooks, email threads, PDF report cards, verbal parent conferences.

The learner portal collapses all of that into one living artifact. The educator tells the engine "share a progress note with Maria" and it appears on Maria's page. Maria shares her code with her parents. Her parents see the same data rendered in Spanish with age-appropriate framing for a parent audience. Later, Maria shares the same code with an internship application — and the page renders a capability narrative instead of a report card.

This is what AI-native means. The data is structured. The presentation is composed on the fly from that structure, adapted to context. One primitive, infinite projections.

---

## Core design principles

**Read-only with smart links.** The learner page never mutates data. It's a window, not a form. But it contains links to actions that already exist elsewhere in the system — primarily assessment links. A pending assessment shows as a card with a link to `/assess/[assessment-code]`, prepopulated. The learner clicks, gets taken to the existing assessment flow. The portal is a dashboard with doorways.

**Persistent codes, not accounts.** A learner gets one code per group membership. The code is generated when the educator creates the learner in a group and never changes unless the educator explicitly regenerates it. The code is the only access mechanism — no email, no password, no OAuth. This is a deliberate choice: it keeps the system accessible to learners of any age, any tech literacy, any institutional context. A 7-year-old can bookmark their page. A parent can save the link. An employer can click it in an application.

**Educator-controlled visibility.** All engine-known data (assessed skills, inferred skills, skill map position, assessment history) is visible on the learner page by default. Educator notes are opt-in — they appear on the learner page only when the educator explicitly shares them. The educator can also mark specific notes with an audience hint (e.g., "for parents," "for the learner," "for employers") which the rendering engine uses to frame the content appropriately. The educator never loses control of what's public.

**AI-rendered, not templated.** The page content is generated from structured data at request time, not stored as HTML. This is what makes multilingual support, audience adaptation, and capability narratives possible without any additional features. The engine reads the learner profile JSON, the shared notes, and the request context (language preference, audience hint if present), and composes the page content. Same data, different rendering every time if the context changes.

---

## Data structures

### Learner profile extensions

The existing `LearnerProfile` gains fields for portal access:

```
LearnerProfile {
  // ... existing fields ...
  id: unique identifier
  name: string
  assessed_skills: [{skill_id, confidence, method, timestamp}]
  inferred_skills: [{skill_id, confidence, inference_chain}]
  constraints: [personal constraints]

  // New fields for portal
  portal_code: string (persistent, unique, URL-safe — e.g., "maria-tue-7x3k")
  portal_code_generated_at: timestamp
  groups: [group_id] (back-reference for multi-group learners)
}
```

The `portal_code` is generated once when the learner is created in a group. Format: `{name_slug}-{group_slug}-{random_4char}` — human-readable enough to share verbally ("my code is maria-tue-7x3k") but unique enough to avoid collisions.

### Educator notes

A new data type — notes the educator chooses to share with the learner's portal.

```
SharedNote {
  id: unique identifier
  learner_id: LearnerProfile ID
  group_id: Group ID
  created_at: timestamp
  created_by: educator session ID
  content: string (the educator's message — can be rich text)
  audience_hint: learner | parent | employer | general (optional, defaults to general)
  pinned: boolean (stays at top of portal)
}
```

Notes are stored in the filesystem alongside learner data:

```
data/
  learners/
    maria-rodriguez.json          # Learner profile (with portal_code)
  notes/
    maria-rodriguez/
      note-2026-02-12-001.json    # Shared note
      note-2026-02-14-002.json    # Another shared note
```

The educator creates notes conversationally: "Share a note with Maria — tell her she did great on the pandas assessment and should practice merge operations before next week." The engine composes the note from that intent and writes it to the filesystem. The educator can review and approve before it's shared, or trust the engine to post it directly.

### Assessment references

The portal needs to display both completed and pending assessments. These already exist in the system:

```
data/
  assessments/
    TUE-2026-0212.json    # Assessment session (has its own access code)
```

The portal reads assessment files that reference the learner and displays them as cards — completed assessments show results and date, pending assessments show a link to `/assess/[code]` with the code prepopulated.

---

## Frontend: The learner page

### Route: `/learner/[portal-code]`

A new frontend surface. Simpler than the educator workspace, richer than the assessment page.

**What the learner sees on arrival:**

A personalized page with their name, their group(s), and their progress — rendered as a narrative, not a data dump. The skill map appears as a visual trail or progress map with clear "you are here" positioning. No raw JSON, no Bloom's taxonomy jargon. Just: "Here's what you can do. Here's what you're working toward. Here's what's next."

**Page sections:**

**Progress narrative** — AI-rendered summary of where the learner stands. Uses the skill graph to show capabilities as a connected story, not a flat list. "You've demonstrated you can load and explore data with pandas. Your next step is data cleaning — filtering missing values and handling duplicates." The narrative adapts to the learner's language preference and the audience context.

**Skill map visualization** — A visual representation of the learner's position in the skill graph. Assessed skills highlighted, inferred skills shown with lighter confidence indicators, unassessed areas visible but muted. This is the "trail map" — you can see where you are, where you've been, and where the path goes. Not every learner will engage with this, but for visual learners and for parents/employers, it's powerful.

**Assessments** — Two categories: completed and pending. Completed assessments show the date, the domain, and a brief summary of what was demonstrated. Pending assessments show as action cards: "Your educator has assigned an assessment on Data Cleaning Fundamentals" with a button that links to `/assess/[assessment-code]`. The button is a link, not a form submission — the portal stays read-only.

**Educator notes** — Chronological feed of notes the educator has shared. Pinned notes appear at the top. Each note shows date and content, rendered in the learner's language. If the note has an audience hint that doesn't match the current context, it's still visible but the rendering might adjust framing (e.g., a note hinted "for parents" still shows to the learner, but might be rendered slightly differently than when a parent views the same page).

**Language selector** — A simple toggle at the top. The learner picks their language; the page re-renders all AI-composed content in that language. The underlying data doesn't change. This isn't translation — it's re-composition from structured data.

### Rendering approach

The page is not pre-rendered or cached. When a learner visits `/learner/[portal-code]`, the frontend hits a backend endpoint that:

1. Looks up the learner profile by portal code
2. Loads their skill graph position, assessment history, and shared notes
3. Composes the page content via an Agent SDK query — a focused, read-only rendering query
4. Returns structured sections (progress narrative, skill map data, assessment list, notes) to the frontend
5. The frontend renders the structured response as React components

The rendering query uses a specialized prompt (or skill) that knows how to compose learner-facing content from profile data. It receives the language preference and any audience context as parameters.

**Performance consideration:** Full AI rendering on every page load is expensive. For the initial build, this is fine — it demonstrates the AI-native approach. For production, we'd cache rendered content and invalidate when the learner profile updates. But the cache is an optimization, not a requirement. The architecture should support both.

---

## Backend: New tools and endpoints

### New MCP tool: `generate_portal_code`

Called when the educator creates a learner or when they want to regenerate a code.

```
generate_portal_code {
  input: {
    learner_id: string
    group_id: string
  }
  behavior:
    - Generate URL-safe code: {name_slug}-{group_slug}-{random_4char}
    - Write portal_code to learner profile JSON
    - Return the code and full portal URL
}
```

### New MCP tool: `share_note_with_learner`

Called when the educator wants to post a note to a learner's portal.

```
share_note_with_learner {
  input: {
    learner_id: string
    group_id: string
    content: string (educator's intent — the engine composes the actual note)
    audience_hint: learner | parent | employer | general (optional)
    pinned: boolean (optional, defaults to false)
  }
  behavior:
    - Compose the note content from the educator's intent
    - Write to data/notes/{learner_id}/note-{timestamp}.json
    - Return confirmation with note preview
}
```

### New MCP tool: `get_portal_view`

Called by the backend when a learner visits their portal page. This is the rendering engine.

```
get_portal_view {
  input: {
    portal_code: string
    language: string (ISO 639-1, e.g., "es", "en", "zh")
    audience: learner | parent | employer | general (optional, defaults to learner)
  }
  behavior:
    - Look up learner profile by portal_code
    - Load skill graph, assessment history, shared notes
    - Compose all sections: progress narrative, skill map data, assessments, notes
    - Render in requested language with audience-appropriate framing
    - Return structured JSON for frontend rendering
}
```

### New HTTP endpoint: `/api/portal/[code]`

Serves the learner portal data. Accepts query parameters for language and audience context.

```
GET /api/portal/maria-tue-7x3k?lang=es&audience=parent

Response: {
  learner: { name, groups },
  progress_narrative: "Maria ha demostrado que puede cargar y explorar datos...",
  skill_map: { assessed: [...], inferred: [...], next: [...] },
  assessments: {
    completed: [{ date, domain, summary, bloom_levels_demonstrated }],
    pending: [{ domain, description, assess_url: "/assess/TUE-2026-0212" }]
  },
  notes: [
    { date, content_rendered, pinned, audience_hint }
  ]
}
```

---

## Educator workflow integration

The portal doesn't exist in isolation. It extends the educator's existing conversation with the engine.

### Creating portal codes

Portal codes are generated automatically when the educator creates learners in a group. The educator doesn't need to think about it — when they say "add Maria to my Tuesday cohort," the engine creates the learner profile *and* the portal code, and can share it with the educator to distribute.

The educator can also ask: "What's Maria's portal link?" or "Regenerate portal codes for all my Tuesday students" — natural language commands that map to the `generate_portal_code` tool.

### Sharing notes

This is conversational. The educator says:

- "Tell Maria she's ready to move on to data visualization"
- "Share a note with James's parents — he's been doing excellent work on the data cleaning module and I'd recommend he explore the advanced track"
- "Post a note for all my Tuesday students: next week we're covering merge operations, please review the pandas documentation beforehand"

The engine composes the note from the educator's intent, writes it to the filesystem, and confirms. Batch operations (post to all students in a group) are natural extensions — the engine iterates over group members and creates individual notes.

### Checking portal state

The educator can ask: "What does Maria's portal page look like right now?" and the engine calls `get_portal_view` with the educator's context, rendering a preview in the chat. This lets the educator verify what their learners see before sharing codes.

---

## Audience adaptation examples

The same underlying data, rendered differently:

**Learner (age 14, viewing in English):**
"You've shown you can load CSV files into pandas and explore data with `.head()`, `.describe()`, and `.info()`. Nice work! Your next challenge is data cleaning — learning to spot and handle missing values. Your educator has assigned an assessment to see where you stand."

**Parent (viewing in Spanish):**
"Maria ha demostrado competencia en carga y exploración de datos usando Python y pandas. Puede importar archivos de datos y usar funciones básicas de exploración con confianza. La siguiente etapa en su aprendizaje es limpieza de datos — una habilidad fundamental para el análisis. Su educador ha asignado una evaluación para determinar su nivel actual en esta área."

**Employer (viewing in English):**
"This learner has demonstrated proficiency in data loading and exploration using Python and the pandas library, including file I/O operations, data inspection, and summary statistics generation. Assessment evidence indicates application-level competency (Bloom's taxonomy). Currently developing data cleaning capabilities including null value handling and deduplication."

Same profile. Same skill graph position. Three different compositions. No templates — the engine reasons about the audience each time.

---

## Repository additions

```
pedagogical-engine/
  src/
    frontend/
      app/
        learner/
          [code]/
            page.tsx              # Learner portal page
        ...
      components/
        portal/
          progress-narrative.tsx   # AI-rendered progress summary
          skill-map.tsx           # Visual skill graph position
          assessment-cards.tsx    # Completed and pending assessments
          educator-notes.tsx      # Shared notes feed
          language-selector.tsx   # Language toggle
        ...
    server/
      tools/
        generate-portal-code.ts   # Create/regenerate portal codes
        share-note-with-learner.ts  # Post educator notes to portal
        get-portal-view.ts        # Render portal content for a learner
        ...
  data/
    notes/                        # Educator-shared notes (new directory)
      {learner-id}/
        note-{timestamp}.json
    ...
```

---

## Accessibility notes

The learner portal is a public-facing page that may be accessed by learners of any age, parents with varying tech literacy, and potentially employers or institutional reviewers. WCAG 2.2 AA compliance is non-negotiable — this is a page that serves the public-school use case where ADA Title II requirements apply.

Key considerations: the progress narrative must work with screen readers (proper ARIA landmarks, heading hierarchy), the skill map visualization needs a text alternative (the progress narrative serves this purpose), assessment action links must be keyboard-navigable and clearly labeled, and the language selector must be accessible and not rely solely on flag icons.

The AI-rendered content should be composed with plain language principles — especially when the audience is a learner or parent. Bloom's taxonomy jargon stays in the engine; the portal speaks in human terms.

---

## Scope and phasing

**Phase 1 — Core portal (implement now):**
- Portal code generation (automatic on learner creation + manual regeneration)
- Learner page with progress narrative and assessment cards
- Educator note sharing (individual notes, conversational workflow)
- Language selector with AI re-rendering
- Basic skill map (text-based or simple visual)

**Phase 2 — Enhanced communication:**
- Batch notes (post to all group members)
- Audience-adaptive rendering (parent, employer, general modes)
- Pinned notes and note management
- Educator preview ("show me what Maria's page looks like")

**Phase 3 — Living portfolio:**
- Cross-group view (learner in multiple groups sees unified progress)
- Exportable capability narratives (PDF/link for applications)
- Skill progression timeline (how capabilities grew over sessions)
- QR code generation for physical distribution (printed cards for young learners)

---

## What this is NOT

- Not a student-facing chatbot — the learner doesn't talk to the engine through this page
- Not an LMS dashboard — no course completion percentages, no modules, no due dates
- Not a gradebook — no letter grades, no GPA, no class rank
- Not a social profile — no learner-to-learner interaction, no comments, no likes
- Not an account system — no email, no password, no personal data collection

It's a window into the learner profile primitive, rendered by AI for whoever is looking. A living, multilingual, audience-adaptive progress page that the learner controls by sharing (or not sharing) their code.

---

*Extends the Pedagogical Reasoning Engine. For changes that affect core primitives, update North Star first.*
