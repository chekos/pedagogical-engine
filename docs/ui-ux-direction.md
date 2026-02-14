# UI/UX Design Direction: Pedagogical Engine

**Status:** The system works. Every feature is built. Now make it feel like something.

---

## The identity problem

The Pedagogical Engine is doing something no other education tool does — it *reasons* about teaching. But the interface doesn't communicate that. It looks like every other Next.js SaaS app: gray backgrounds, blue buttons, rounded cards, Inter font, Tailwind defaults. The visual language says "we shipped fast" when it should say "we think deeply."

The product's soul is in the reasoning — the dependency graph, the Bloom's calibration, the pushback, the meta-pedagogical transparency. The interface should make that reasoning *feel present* even when it's not being displayed. The educator should feel like they're working with something that thinks, not something that generates.

---

## Design philosophy: The Thoughtful Colleague

The UI should feel like sitting across from a brilliant colleague who has a whiteboard full of connected ideas, a deep understanding of your students, and the confidence to push back when you're wrong.

**Not clinical.** The dashboard-heavy SaaS aesthetic (charts, metrics, KPIs) makes educators feel surveilled, not supported. Data should feel like insight, not measurement.

**Not playful.** Education tech is plagued by infantile design — bright colors, rounded everything, cartoon illustrations. This is a professional tool for professionals.

**Not minimal to the point of emptiness.** The current teaching workspace is so clean it feels hollow. Empty space should feel intentional, like a pause in conversation — not like the page didn't load.

**The right feeling:** Warm authority. Like a well-organized notebook from someone who clearly thinks deeply. Like the design language of tools built for thoughtful professionals — Notion, Linear, Arc, Readwise. Information-dense when you need it, calm when you don't. Confident enough to have opinions.

---

## Visual identity

### Color system

Stop using Tailwind's default blue as the primary color. It's the most generic choice possible.

**Recommendation: A warm, deep palette anchored by a signature color.**

The signature color should be distinctive enough that someone who's seen the app once remembers it. Options to consider:

- **Deep indigo / ink** — cerebral, authoritative, academic without being stuffy. Works as both the primary action color and the dark mode background. Pairs with warm amber/gold for accents.
- **Forest / dark teal** — grounded, natural, works across education contexts from classrooms to outdoor ecology. Pairs with warm cream/sand.
- **Warm slate** — sophisticated, calm, lets the Bloom's taxonomy colors (which are already in the app) become the visual identity rather than fighting with a primary color.

The Bloom's taxonomy colors are already doing work in the dashboard. Lean into them as the system's visual signature — six colors representing depth of knowledge, used consistently across every screen. When an educator sees those colors, they should immediately think "depth of understanding." That color system *is* the brand.

**Background:** Move away from pure white (#ffffff) and pure gray. Use warm tones — very light cream or warm gray for light mode. The current dark mode on the dashboard works because it has warmth (it's not pure black).

### Typography

The current font (likely Inter or system default) is invisible. Typography is the fastest way to create character.

**Recommendation:** A distinctive serif or semi-serif for headings, paired with a clean sans-serif for body text. This signals "we're an education tool that takes ideas seriously" — academic confidence without being dusty.

Options:
- **Headings:** Fraunces, Literata, Source Serif Pro, or even a slightly unconventional choice like Instrument Serif
- **Body:** Inter is fine for body text, but consider DM Sans, Plus Jakarta Sans, or Satoshi for slightly more character
- **Monospace for data/codes:** JetBrains Mono or IBM Plex Mono for skill IDs, assessment codes, technical elements

The tagline "Teaching, reasoned." deserves a typeface that makes you pause. A well-chosen serif does that.

### Spatial rhythm and density

The current screens oscillate between too empty (teaching workspace) and too dense (meta page). Establish a consistent rhythm:

- **Generous padding on containers, tight spacing within them.** Cards should breathe externally but be information-dense internally. This is the Notion/Linear pattern — calm frame, rich content.
- **Consistent maximum width.** Some screens go full-width, others are constrained. Pick a max-width (probably ~1200px for content, wider for data visualizations) and stick with it.
- **Vertical rhythm based on content hierarchy.** Major sections get significant spacing. Sub-elements within sections are tight. This creates scannable pages.

### Micro-interactions and life

The app currently feels static. Small animations add the feeling that the system is *thinking*:

- Subtle transitions when navigating between pages
- The skill graph nodes should have gentle idle animation — very slight floating or pulsing. They're alive, not frozen.
- When the agent is processing in the chat, show something more expressive than a loading spinner. A brief animation that suggests reasoning — maybe the Bloom's colors cycling, or a subtle node-connection animation.
- Tool result cards in the chat should slide in with a slight build, not just appear.

---

## Screen-by-screen direction

### Landing page — currently the weakest

**Problems:**
- The tag pills list builder vocabulary, not educator value. "Skill dependency graphs" means nothing to a teacher.
- The three-step "How it works" section is the most overused SaaS pattern. Every product has it.
- Three competing CTAs ("I'm an educator" / "I'm a student" / "View skill analytics") dilute the primary action.
- The navigation has 10 items. That's an internal sitemap, not a navigation.

**Direction:**
The landing page should do one thing: make an educator feel understood, then give them one clear action.

- **Hero:** Keep "Teaching, reasoned." — it's strong. But the subtitle should speak to the educator's pain, not describe features. Something like: "You know your students. You know your subject. This engine handles the complexity of putting the two together — so you can focus on what you actually do in the room."
- **Replace the tag pills** with a single compelling visual — a still from the skill graph, an animated dependency cascade, or a side-by-side of "what a generic AI gives you" vs "what this gives you." Show, don't list.
- **Replace the three-step section** with a single, scrollable demo walkthrough — a condensed version of the golden path. The educator sees: interview → graph building → lesson plan output. Not as steps with icons, but as actual screenshots or an embedded demo video.
- **One primary CTA:** "Start planning" (goes to /teach). Secondary links for "I'm a student" and "Explore the engine" can be smaller, lower.
- **Navigation:** Collapse to 4–5 items maximum for the public-facing nav. Group the feature pages (Simulate, Wisdom, Meta, Disagree, Transfer, Educators) under a single "Features" or "Explore" dropdown — or remove them from the nav entirely and make them discoverable from within the app. The nav right now tells judges "we built 10 pages" when it should tell them "here's what you need."

### Teaching workspace — the primary experience

**Problems:**
- "Ready to plan" is passive. The empty state doesn't create energy or direction.
- The three prompt suggestions are good but floating in a void.
- The microphone button and "Voice off" label feel bolted on.
- The connection status ("Connected 3c3fbbba") is dev information showing in the UI.

**Direction:**
This is where educators spend most of their time. It should feel like opening a well-designed notebook.

- **Empty state should have warmth and direction.** Instead of a centered icon with "Ready to plan," consider a brief, conversational greeting that sets expectations: "I'm your teaching partner. Tell me what you're planning — who you're teaching, what you're covering, what you're working with — and I'll help you build something grounded in what your students actually know." This is the voice of the product.
- **Prompt suggestions should feel like conversation starters**, not buttons. Style them as quotes or thought bubbles rather than pills. They should feel like things a colleague might say to kick off a planning session.
- **Remove the connection status** from the UI. Nobody needs to see it.
- **The voice button** should be more integrated — maybe as an icon inside the input field (like the mic icon in Google Search), not a separate button with a label.
- **When the conversation is active:** Messages from the engine should have more character than standard chat bubbles. Consider a subtle left-border color (using Bloom's colors or the signature color) to distinguish the engine's messages. Tool results (lesson plans, assessments, graphs) should feel like the engine is laying documents on the table between you — integrated cards with real hierarchy, not just formatted text.
- **Session context sidebar (optional):** A collapsible sidebar showing the current session's context — group name, domain, constraints gathered so far, number of learners assessed. This gives the educator a sense of what the engine "knows" at any point in the conversation.

### Skill analytics dashboard — already strong, refine

**Problems:**
- The dark mode is strong but disconnected from the rest of the app's visual language.
- The learner tabs (Priya, Marcus, Sofia, Alex, Nkechi) are small and easy to miss.
- "Auto-cycle learners" is a feature label, not a human action.
- The Bloom's taxonomy legend is in a separate box — it could be more integrated.

**Direction:**
This is the screen to build the visual language FROM. Let the rest of the app learn from this one.

- **Keep the dark mode** for this screen. Data visualization reads better on dark. But make the transition from light (teaching workspace) to dark (dashboard) feel intentional — a deliberate shift into "analysis mode."
- **Make the learner tabs more prominent.** Larger, with a mini skill summary visible on each tab so you can compare without clicking.
- **The skill graph itself is excellent.** Add subtle interaction improvements: hover states that highlight the full dependency chain of a node (not just the node itself), click to see the learner's specific assessment history for that skill, and ability to filter by Bloom's level.
- **The "Auto-cycle learners" feature** should be renamed to something human — "Watch all students" or just a play button that cycles through profiles.
- **Add a group overlay mode** that shows all learners' states superimposed on the same graph, using opacity to show distribution. This is the "group view" that the overview tab presumably shows, but it should be visually powerful — seeing the entire group's knowledge state at once on the dependency graph.

### Pedagogical disagreement page — reframe entirely

**Problems:**
- It's currently a demo page, not a tool. The scenario cards are examples, not workflows.
- The five-step explanation at the bottom is educational but makes this feel like a documentation page, not a feature.

**Direction:**
This shouldn't be its own page at all. Pedagogical pushback should be woven into the teaching workspace — it happens *during* the conversation, not on a separate screen. The educator says something the engine disagrees with, and the pushback appears as a distinct message type in the chat — maybe with a different visual treatment (a yellow/amber border? a specific icon?) that signals "I want to push back on this."

If you want a standalone page that *demonstrates* the pushback capability (for judges, for marketing), it should be interactive — not static cards. Let the visitor type an educator statement and see the engine's pushback live. Or show a pre-recorded conversation where the pushback happens naturally.

The current page is the best *copy* on the site ("Most AI tools are sycophantic") but it's trapped in a static layout.

### Domain marketplace — polish the story

**Problems:**
- The domain cards are information-rich but visually uniform. Five identical card shapes with different numbers.
- The "Create your own domain plugin" section at the bottom mixes developer documentation (file structure) with a conversational CTA ("Build a domain via conversation"). These are two different audiences.

**Direction:**
- **Give each domain a visual identity.** The icons are a start, but consider domain-specific color accents or background illustrations. Python Data Analysis could have a subtle data visualization motif. Outdoor Ecology could have an organic pattern. The domains should feel *different from each other* — that's the whole point of "any teacher, any subject."
- **The Bloom's distribution bars are great** — they're the best information-dense element in the app. Make them slightly larger and more prominent. They tell the story of each domain's depth.
- **Separate the "create your own" section** into two paths: the conversational builder (for educators) and the manual plugin spec (for developers). They should look different and live in different parts of the page, or on different sub-pages.
- **Add learner/session counts** if available — "Used by 3 educators, 47 learners assessed" gives social proof and makes domains feel alive.

### Lesson plans list — add dimension

**Problems:**
- Every row is identical. No visual distinction between domains, groups, complexity, or recency.
- The action buttons (Debrief, Rehearse, Go Live, Lesson PDF, Prerequisites) are the right actions but they have no hierarchy. They're all the same size, all in a row.

**Direction:**
- **Add domain and group context to each row.** A small colored chip for the domain, the group name, and the number of learners. The educator should be able to scan and see "this was my Tuesday Python group, this was my ecology field trip."
- **Visual freshness indicator.** Recent/active lessons should look different from archived ones. Lessons that haven't been debriefed should have a subtle nudge.
- **Prioritize the primary action.** For a lesson that hasn't been taught yet, "Go Live" should be dominant. For one that's been taught but not debriefed, "Debrief" should be dominant. The buttons should adapt to the lesson's state.
- **Consider a card layout instead of a list** for 5–10 lessons. Cards allow for more information density per item — show a mini skill map, the group name, the date, the domain, and the primary action.

### Meta-pedagogical page — restructure the hierarchy

**Problems:**
- Intellectually the strongest content on the site, but visually the most overwhelming.
- Eight expandable traces all at the same visual weight. No clear reading order.
- The "Pedagogical Principles at Work" section at the bottom is key but gets buried.

**Direction:**
- **Lead with the principles, not the traces.** Flip the page: start with the "Pedagogical Principles at Work" cards — these are the framework. Then show the specific traces as evidence of those principles in action. The educator's mental model should be: "here are the principles → here's how they played out in this plan."
- **Visual categorization of traces.** The traces are already categorized (ORDERING, TIMING, PAIRING, etc.) but they all look the same. Give each category a distinct visual treatment — an icon, a color, something that makes it scannable. An educator should be able to glance at the page and see "2 ordering decisions, 1 timing decision, 1 pairing decision" without reading.
- **Progressive disclosure within traces.** The expanded trace text is long and detailed. Consider a two-level expansion: first click shows a one-line summary ("Hands-on before lecture because group is at application level"), second click shows the full reasoning chain. Most educators want the summary; deep thinkers want the full trace.
- **Connect to the lesson plan.** Each trace should link to the specific section of the lesson plan it explains. "This decision shaped minutes 8–12 of the plan" with a link to see that section highlighted.

### Educator profiles — tighten the narrative

**Problems:**
- The page is long and scrolling. Everything is presented at equal weight.
- The comparison section at the top ("Same Plan, Two Different Teachers") is the most compelling element but it's a small card among many.

**Direction:**
- **Lead with the comparison.** This is the page's thesis: the same content produces different plans for different teachers. Make this the hero. Show the two educators side by side with their style distributions, then below show the *resulting lesson plans* side by side. Let the visitor see the cause and effect.
- **Collapse the detailed profile into tabs or sections** that expand on demand. The educator doesn't need to see Teaching Style Distribution, Strengths, Growth Areas, Content Confidence, Timing Patterns, Growth Nudges, and Preferences all at once. Group them: "How I teach" (style + preferences), "My strengths" (strengths + content confidence), "What the engine has learned" (timing patterns + growth nudges).
- **Make the timing patterns more visual.** "Discussion: -3 min" is useful but could be a bar chart showing planned vs actual time per activity type. Make the patterns *visible*, not just readable.

### Embeddable widget page — fine as is

This is for developers. It's functional and clear. Low priority for the design pass.

---

## User journeys to test

Once the design direction is implemented, walk through these journeys to find remaining rough edges:

### Journey 1: First-time educator, cold start
The educator has never seen the system. They land on the homepage. They click "Start planning." They describe their context. The engine interviews them. They complete the interview. The engine asks about assessment. They generate assessment links. They come back after assessments are done. The engine composes a lesson plan. They iterate on it.

**What to watch for:** Does the educator feel guided or lost? Is the transition from marketing (landing page) to working (teaching workspace) smooth? Does the interview feel like a conversation or a form? When the lesson plan appears, does the educator immediately see its value, or do they need to study it?

### Journey 2: The return visit
The educator taught a lesson. They come back to debrief. They start planning the next session for the same group. The engine should remember the group, reference the last session, and show growth.

**What to watch for:** Does the system feel continuous or does it feel like starting over? Can the educator find their previous lesson plans easily? Does the debrief flow feel natural? When planning the next session, does the engine reference the debrief data?

### Journey 3: The skeptic
An educator who doesn't trust AI. They try to trip up the system — teaching topics out of dependency order, cramming too much into too little time, skipping assessment. They want to see if the engine just does what they say or actually has opinions.

**What to watch for:** Does the pushback feel helpful or annoying? Is the evidence specific enough to be convincing? If the educator overrides the pushback, does the engine gracefully comply? Does the educator come away thinking "this thing actually understands teaching" or "this thing is just following rules"?

### Journey 4: The multi-domain explorer
An educator who teaches multiple subjects (common in homeschool, K-8, or multi-disciplinary settings). They set up one domain, assess their students, plan a lesson. Then they switch to a different domain for the same students. They want to see if the system recognizes transfer.

**What to watch for:** Is domain switching smooth? Does the cross-domain transfer actually surface? Does the educator understand what the engine is inferring and why? Do the lesson plans for different domains feel genuinely different, not just the same template with different vocabulary?

### Journey 5: The judge's walkthrough
A hackathon judge with 5 minutes. They land on the homepage, click around, maybe try one interaction. They need to understand what this is and why it matters within 2 minutes.

**What to watch for:** Can someone understand the value proposition from the landing page alone? Is there a single click path that shows the most impressive capability? If they only see one screen, which screen would you want it to be? Is the README sufficient context, or does the app need to explain itself?

### Journey 6: The student taking an assessment
A student receives a link from their teacher. They enter the code. They complete the assessment. They see their results.

**What to watch for:** Is the assessment entry intuitive? Does the conversation feel low-stakes and conversational, or like a test? At the end, does the student feel informed about their own skill state? Is there a clear "you're done" moment?

---

## Implementation approach

This is not one Claude Code session. It's a design system overhaul. Here's how to structure it:

### Session 1: Design system foundation
> Establish the visual foundation across the entire app. Don't redesign any individual page yet — just change the bones.
>
> - Typography: Choose and implement the heading + body font pair. Update the global styles.
> - Color system: Replace the default blue with the signature palette. Implement the Bloom's taxonomy colors as CSS variables / Tailwind theme extensions used consistently everywhere.
> - Background warmth: Replace pure white/gray backgrounds with warm variants.
> - Spacing rhythm: Establish consistent max-widths, section spacing, and card padding.
> - Navigation: Collapse to 4–5 items. Group feature pages under a dropdown or remove from nav.
> - Page transitions: Add subtle transitions between routes.
>
> Don't change any page layouts or content yet. Just change how everything *feels*.

### Session 2: Landing page redesign
> Redesign the landing page following the direction doc. One hero, one CTA, one visual, one scrollable walkthrough. Kill the tag pills and three-step section. Make the first impression match the product's intelligence.

### Session 3: Teaching workspace redesign
> Redesign the teaching workspace — the primary experience. Warm empty state, conversational prompt starters, integrated voice, richer message rendering, tool result cards with hierarchy. Optional: session context sidebar.

### Session 4: Dashboard and data screens
> Polish the skill analytics dashboard (already strong — refine, don't rebuild). Apply learnings to the meta page (restructure hierarchy, progressive disclosure). Apply to educator profiles (lead with comparison, collapse details).

### Session 5: Secondary screens
> Domain marketplace (domain-specific visual identity, split create paths). Lesson plans list (add dimension, adaptive primary actions). Any remaining screens.

### Session 6: User journey testing
> Walk through all six user journeys. Fix everything that breaks the flow. Focus on transitions between screens, empty states, error states, and moments where the user might get confused.

---

## The one thing that matters most

If you do nothing else from this document, do this: **give the app a distinctive typeface for headings.** A single typographic choice — a good serif for "Teaching, reasoned." and all page titles — instantly separates the app from every other Next.js SaaS template. It's the highest-impact, lowest-effort change, and it signals that someone made a deliberate design choice.

Everything else is refinement. The typography is identity.
