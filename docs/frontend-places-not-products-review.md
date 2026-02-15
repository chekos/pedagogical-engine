# Frontend Review: "Build Places, Not Products"

Evaluation of the Pedagogical Engine frontend through the lens of Lucas Crespo's
["Build Places, Not Products"](https://every.to/source-code/build-places-not-products) article.

**Date:** 2026-02-14

---

## Article summary

Crespo argues that when AI commoditizes functionality, the products that win are the ones that feel like **places you want to inhabit**, not just tools you use. Three principles:

1. **Define the feeling, not features** — start with emotional intent
2. **Give the internet texture** — introduce tactile, handcrafted materiality
3. **Every surface is the product** — atmospheric consistency from landing page through every interaction

---

## What we're doing well

### Intentional typography creates identity

The three-font system — Source Serif 4 for headings, DM Sans for body, IBM Plex Mono for code — is a real design choice. The serif headings give the app a bookish, pedagogical gravity that distinguishes it from the typical SaaS sans-serif monoculture. It *means* something for a teaching tool.

### The color palette has a point of view

The warm, papery light mode (`#faf9f7`, `#f5f3f0`) and the deep near-black dark mode (`#0a0a0b`) are considered, not default. The Bloom's taxonomy color spectrum (`bloom-remember` through `bloom-create`) threading through the whole UI is domain-specific visual language that no other product would have.

### The live teaching companion feels like a room

The `/teach/live/` page — with its session timer, section cards, time warnings, voice-first input, and section feedback buttons — has a sense of *being somewhere*. The large mic button, the "Your teaching companion is ready" empty state, the auto-speak responses. This page comes closest to the "place" concept. It feels like a teacher's cockpit during a live class.

---

## Where it falls short

### 1. The landing page is competent, not atmospheric

The homepage follows the standard SaaS layout — hero, three feature cards, four link cards, footer. The copy is good ("Teaching, reasoned." is sharp), but the structure is indistinguishable from a hundred Tailwind templates. The `SkillGraphVisual` SVG is a nice touch, but it's a small, static illustration — it doesn't set a mood.

**What's missing:** a *feeling* when you land. The papery warm tones are already there in the CSS — they just need to be *felt* more on the surface that makes the first impression.

### 2. Every surface is not yet the product

The NavBar is purely functional — text links, a dropdown, a theme toggle. The Footer is two lines of text. These are the "hallways" of the app, and right now they feel like hallways. Compare this to the live teaching page, which has real personality.

The chat interface at `/teach` loads a full-screen `ChatInterface` with zero preamble — no welcome state, no visual cue about what kind of conversation this will be. For the most important page in the app, the entry moment is empty.

### 3. The texture is flat

The inference cascade animations (`cascadeIn`, `glowExpand`, `inferencePulse`) in the skill graph have real personality. But the rest of the app uses the standard `rounded-xl border border-border-subtle bg-surface-0 p-6 hover:shadow-md transition-shadow` card pattern everywhere. Every card, every link, every section — same radius, same border, same hover. It's clean, but clean is what Crespo warns about: "The internet doesn't have to look like an office park."

### 4. The Bloom's color system is underused

Six colors representing cognitive levels, but they mostly show up as icon backgrounds and graph node fills. They could thread through page backgrounds, animate as a learner progresses, appear as accent borders on cards based on complexity. Right now it's decoration. It could be *wayfinding*.

---

## The core tension

The backend is extraordinary — 9 moonshot features, 36 MCP tools, accumulated teaching wisdom, pedagogical disagreement, cross-domain transfer. The *thinking* is deep. But the frontend is presenting this depth through a standard component library shell. It's like having a brilliant teacher lecturing in a generic conference room.

The live teaching page shows we *know* how to build a place — it has rhythm (the timer), feedback loops (section cards that change color), urgency (time warnings), and a sense of presence (voice-first, "Your companion is ready"). The question is whether we can bring that same sense of inhabiting a space to the rest of the surfaces.

---

## Priority recommendations

### 1. Give `/teach` an entry experience (highest impact)

When an educator opens the chat, before they type anything, the page should communicate the *feeling* of sitting down with a knowledgeable colleague who already knows your students. A warm welcome state that references their last session, their domain, their teaching style. Make the most-used page feel like arriving somewhere, not booting up a tool.

### 2. Make the Bloom's palette structural

Use Bloom's colors as wayfinding, not just decoration. Cards could carry subtle accent borders based on cognitive depth. Page sections could shift warmth as complexity increases. The colors already exist — let them do more work.

### 3. Break the card monoculture

Not every surface needs the same `rounded-xl border` treatment. Feature cards, navigation links, dashboard entries, and chat elements serve different purposes — let them look different. Vary the visual weight.

### 4. Add atmosphere to the hallways

The nav and footer are opportunities. A nav that subtly reflects where you are (teaching vs. analyzing vs. exploring) or a footer that surfaces a recent teaching insight would make even the connective tissue feel inhabited.

---

## Sources

- [Build Places, Not Products — Lucas Crespo, Every](https://every.to/source-code/build-places-not-products)
- [Lucas Crespo on X](https://x.com/lucas__crespo/status/2012238081567375626)
