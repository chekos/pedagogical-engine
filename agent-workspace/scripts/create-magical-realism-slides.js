const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Pedagogical Reasoning Engine";
pres.title = "Magical Realism in Latin American Literature";

// Color palette — dark, moody magical realism
const C = {
  bg: "0F1419",         // near-black
  bgCard: "1A2332",     // dark blue-gray card
  bgCardAlt: "1E2D3D",  // slightly lighter card
  teal: "0D9488",       // primary accent
  tealLight: "14B8A6",  // lighter teal for highlights
  gold: "D4A843",       // warm gold accent
  goldLight: "E8C468",  // lighter gold
  white: "F1F5F9",      // soft white (not pure)
  muted: "94A3B8",      // muted gray for secondary text
  mutedDark: "64748B",  // darker muted
  cream: "FFF8E7",      // warm cream for quote
};

// Factory functions for reusable options (avoid mutation issues)
const makeShadow = () => ({
  type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.4,
});

// ============================================================
// SLIDE 1 — Title Slide
// ============================================================
const s1 = pres.addSlide();
s1.background = { color: C.bg };

// Subtle top accent bar
s1.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.teal },
});

// Title
s1.addText("Magical Realism", {
  x: 0.8, y: 1.2, w: 8.4, h: 1.1,
  fontSize: 48, fontFace: "Georgia", bold: true,
  color: C.white, align: "left", margin: 0,
});

// Second line of title
s1.addText("in Latin American Literature", {
  x: 0.8, y: 2.2, w: 8.4, h: 0.7,
  fontSize: 30, fontFace: "Georgia", italic: true,
  color: C.tealLight, align: "left", margin: 0,
});

// Subtle horizontal divider
s1.addShape(pres.shapes.LINE, {
  x: 0.8, y: 3.15, w: 3.5, h: 0,
  line: { color: C.gold, width: 2 },
});

// Subtitle
s1.addText("From Definition to Recognition", {
  x: 0.8, y: 3.4, w: 8.4, h: 0.5,
  fontSize: 18, fontFace: "Calibri",
  color: C.muted, align: "left", margin: 0,
});

// Bottom tag
s1.addText("Guest Lecture — AP Spanish Literature", {
  x: 0.8, y: 4.8, w: 8.4, h: 0.4,
  fontSize: 13, fontFace: "Calibri",
  color: C.mutedDark, align: "left", margin: 0, charSpacing: 2,
});

// Bottom accent bar
s1.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.gold },
});

s1.addNotes(
  "Have this slide up as students settle in. Mr. Sanchez introduces you. " +
  "When he finishes, thank him, smile at the class, and deliver your one-sentence contract: " +
  "'By the end of this period, you're going to be able to spot magical realism in any passage someone puts in front of you.'"
);

// ============================================================
// SLIDE 2 — Definition
// ============================================================
const s2 = pres.addSlide();
s2.background = { color: C.bg };

// Top accent bar
s2.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.teal },
});

// Title
s2.addText("What is Magical Realism?", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.7,
  fontSize: 36, fontFace: "Georgia", bold: true,
  color: C.white, align: "left", margin: 0,
});

// Definition pieces — three separate text blocks for progressive reveal
s2.addText([
  { text: "A literary ", options: { fontSize: 22, fontFace: "Calibri", color: C.white } },
  { text: "mode", options: { fontSize: 22, fontFace: "Calibri", color: C.gold, bold: true, italic: true } },
  { text: "...", options: { fontSize: 22, fontFace: "Calibri", color: C.muted } },
], {
  x: 0.8, y: 1.25, w: 8.4, h: 0.45, margin: 0,
});

s2.addText("...where supernatural, fantastical, or mythical elements are woven into an otherwise realistic narrative...", {
  x: 0.8, y: 1.85, w: 8.4, h: 0.7,
  fontSize: 20, fontFace: "Calibri",
  color: C.muted, align: "left", margin: 0,
});

s2.addText("...and the characters treat the magic as completely normal.", {
  x: 0.8, y: 2.65, w: 8.4, h: 0.5,
  fontSize: 22, fontFace: "Calibri", bold: true,
  color: C.tealLight, align: "left", margin: 0,
});

// Quote card
s2.addShape(pres.shapes.RECTANGLE, {
  x: 0.8, y: 3.6, w: 8.4, h: 1.2,
  fill: { color: C.bgCard },
  shadow: makeShadow(),
});

// Gold left accent on quote card
s2.addShape(pres.shapes.RECTANGLE, {
  x: 0.8, y: 3.6, w: 0.06, h: 1.2,
  fill: { color: C.gold },
});

s2.addText([
  { text: '"', options: { fontSize: 40, fontFace: "Georgia", color: C.gold } },
  { text: "Nobody freaks out. Nobody says 'that's impossible.'\nThe magic is just... Tuesday.", options: { fontSize: 17, fontFace: "Georgia", italic: true, color: C.cream } },
], {
  x: 1.15, y: 3.7, w: 7.7, h: 1.0, margin: 0, valign: "middle",
});

// Bottom accent bar
s2.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.gold },
});

s2.addNotes(
  "Build this piece by piece. Pause between each line. " +
  "Give the concrete example from Cien años de soledad — a character ascends to heaven while hanging laundry. " +
  "The narrator describes it the same way you'd describe someone going to the store. " +
  "That flat, matter-of-fact tone is the signature."
);

// ============================================================
// SLIDE 3 — The 5 Key Devices
// ============================================================
const s3 = pres.addSlide();
s3.background = { color: C.bg };

// Top accent bar
s3.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.teal },
});

// Title
s3.addText("How It Works on the Page", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.7,
  fontSize: 36, fontFace: "Georgia", bold: true,
  color: C.white, align: "left", margin: 0,
});

// 5 devices — compact rows with number accent
const devices = [
  { num: "1", title: "Matter-of-Fact Narration", desc: "The narrator describes the impossible as ordinary" },
  { num: "2", title: "Mythic or Circular Time", desc: "Past and future collapse; time loops" },
  { num: "3", title: "Symbolic / Enchanted Objects", desc: "Ordinary objects carry supernatural weight" },
  { num: "4", title: "Sensory Overload", desc: "Lush, dense prose that makes magic feel physical" },
  { num: "5", title: "Unresolved Supernatural", desc: "The magic is never explained. It just is." },
];

const deviceStartY = 1.15;
const deviceHeight = 0.68;
const deviceGap = 0.1;

devices.forEach((d, i) => {
  const y = deviceStartY + i * (deviceHeight + deviceGap);

  // Card background
  s3.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: y, w: 8.4, h: deviceHeight,
    fill: { color: i % 2 === 0 ? C.bgCard : C.bgCardAlt },
  });

  // Number circle
  s3.addShape(pres.shapes.OVAL, {
    x: 1.05, y: y + 0.12, w: 0.44, h: 0.44,
    fill: { color: C.teal },
  });
  s3.addText(d.num, {
    x: 1.05, y: y + 0.12, w: 0.44, h: 0.44,
    fontSize: 16, fontFace: "Calibri", bold: true,
    color: C.white, align: "center", valign: "middle", margin: 0,
  });

  // Device title
  s3.addText(d.title, {
    x: 1.7, y: y + 0.05, w: 7.0, h: 0.3,
    fontSize: 17, fontFace: "Calibri", bold: true,
    color: C.goldLight, align: "left", margin: 0,
  });

  // Description
  s3.addText(d.desc, {
    x: 1.7, y: y + 0.35, w: 7.0, h: 0.28,
    fontSize: 14, fontFace: "Calibri",
    color: C.muted, align: "left", margin: 0,
  });
});

// Bottom accent bar
s3.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.gold },
});

s3.addNotes(
  "Spend ~2 minutes per device with a concrete example from García Márquez or Esquivel. " +
  "If running behind by minute 16, cut devices 4 and 5 to one sentence each. " +
  "The passage walkthrough will reinforce these devices through the text itself."
);

// ============================================================
// SLIDE 4 — What It Is NOT
// ============================================================
const s4 = pres.addSlide();
s4.background = { color: C.bg };

// Top accent bar
s4.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.teal },
});

// Title
s4.addText("What Magical Realism Is NOT", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.7,
  fontSize: 36, fontFace: "Georgia", bold: true,
  color: C.white, align: "left", margin: 0,
});

// Two side-by-side contrast cards
const cardW = 3.9;
const cardH = 2.9;
const cardY = 1.3;

// LEFT CARD — Not Fantasy
s4.addShape(pres.shapes.RECTANGLE, {
  x: 0.8, y: cardY, w: cardW, h: cardH,
  fill: { color: C.bgCard },
  shadow: makeShadow(),
});

// Teal top accent on left card
s4.addShape(pres.shapes.RECTANGLE, {
  x: 0.8, y: cardY, w: cardW, h: 0.06,
  fill: { color: C.teal },
});

s4.addText([
  { text: "\u2260 ", options: { fontSize: 28, color: C.teal, bold: true } },
  { text: "Fantasy", options: { fontSize: 28, color: C.white, bold: true } },
], {
  x: 1.1, y: cardY + 0.25, w: cardW - 0.6, h: 0.5, margin: 0,
});

s4.addText(
  "Fantasy has rules, a magic system, a separate world.\n\nMagical realism has no rules \u2014 magic is embedded in THIS world.",
  {
    x: 1.1, y: cardY + 0.9, w: cardW - 0.6, h: 2.0,
    fontSize: 15, fontFace: "Calibri",
    color: C.muted, align: "left", valign: "top", margin: 0,
  }
);

// RIGHT CARD — Not Surrealism
s4.addShape(pres.shapes.RECTANGLE, {
  x: 5.3, y: cardY, w: cardW, h: cardH,
  fill: { color: C.bgCard },
  shadow: makeShadow(),
});

// Gold top accent on right card
s4.addShape(pres.shapes.RECTANGLE, {
  x: 5.3, y: cardY, w: cardW, h: 0.06,
  fill: { color: C.gold },
});

s4.addText([
  { text: "\u2260 ", options: { fontSize: 28, color: C.gold, bold: true } },
  { text: "Surrealism", options: { fontSize: 28, color: C.white, bold: true } },
], {
  x: 5.6, y: cardY + 0.25, w: cardW - 0.6, h: 0.5, margin: 0,
});

s4.addText(
  "Surrealism is dreamlike and disorienting.\n\nMagical realism is grounded and matter-of-fact. The narrator is not surprised.",
  {
    x: 5.6, y: cardY + 0.9, w: cardW - 0.6, h: 2.0,
    fontSize: 15, fontFace: "Calibri",
    color: C.muted, align: "left", valign: "top", margin: 0,
  }
);

// Bottom accent bar
s4.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.gold },
});

s4.addNotes(
  "This is a quick aside — 1-2 minutes max. " +
  "Plant the seed; students will develop the distinction further throughout the AP course. " +
  "If a student asks about non-Latin American magical realism (Rushdie, Morrison, Murakami), give a 30-second acknowledgment and refocus."
);

// ============================================================
// SLIDE 5 — Passage Analysis Framework
// ============================================================
const s5 = pres.addSlide();
s5.background = { color: C.bg };

// Top accent bar
s5.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.teal },
});

// Title
s5.addText("Your Magical Realism Detector", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.7,
  fontSize: 36, fontFace: "Georgia", bold: true,
  color: C.white, align: "left", margin: 0,
});

// Three question cards
const questions = [
  { num: "1", text: "Where does something impossible happen?" },
  { num: "2", text: "How does the narrator treat it?\n(Amazed or matter-of-fact?)" },
  { num: "3", text: "Which specific devices can you identify?" },
];

const qStartY = 1.2;
const qHeight = 1.0;
const qGap = 0.18;

questions.forEach((q, i) => {
  const y = qStartY + i * (qHeight + qGap);

  // Card
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: y, w: 8.4, h: qHeight,
    fill: { color: C.bgCard },
    shadow: makeShadow(),
  });

  // Left accent
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: y, w: 0.06, h: qHeight,
    fill: { color: C.teal },
  });

  // Number
  s5.addText(q.num, {
    x: 1.15, y: y, w: 0.6, h: qHeight,
    fontSize: 36, fontFace: "Georgia", bold: true,
    color: C.gold, align: "center", valign: "middle", margin: 0,
  });

  // Question text
  s5.addText(q.text, {
    x: 1.85, y: y, w: 6.9, h: qHeight,
    fontSize: 20, fontFace: "Calibri", bold: true,
    color: C.white, align: "left", valign: "middle", margin: 0,
  });
});

// Footer callout
s5.addText("Use these three questions on ANY passage.", {
  x: 0.8, y: 4.85, w: 8.4, h: 0.35,
  fontSize: 14, fontFace: "Calibri", italic: true,
  color: C.muted, align: "center", margin: 0,
});

// Bottom accent bar
s5.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.gold },
});

s5.addNotes(
  "This slide stays up during the passage walkthrough. " +
  "Students refer back to these questions as they analyze the Esquivel excerpt. " +
  "Walk through each question with the passage: first find the impossible thing, " +
  "then examine the narrator's tone, then name the devices."
);

// ============================================================
// Write file
// ============================================================
const outPath = "data/exports/slides/2026-02-14-magical-realism-slides.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("Saved to " + outPath);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
