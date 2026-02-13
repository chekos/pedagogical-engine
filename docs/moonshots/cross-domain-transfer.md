# Workstream: Cross-Domain Transfer

**Codename:** The Bridge
**Depends on:** Core system stable, at least two domains built (Workstream C), learner profiles with data

---

## The insight

Domains are isolated right now. A learner's Python profile says nothing about their ecology profile. But in reality, skills transfer. A student who can "design an experiment" in ecology shares deep cognitive structure with "design a data pipeline" in Python — both are synthesis-level skills requiring decomposition, sequencing, constraint handling, and evaluation of tradeoffs. A student who can "identify patterns in leaf shapes" exercises the same analytical muscle as "identify patterns in a dataset."

The engine's power is in its dependency graph and inference engine. Right now, inference only flows within a domain — knowing skill A within Python tells you about skill B within Python. Cross-domain transfer extends inference across domain boundaries. It says: knowing something in Domain X gives you partial information about Domain Y.

This is genuinely hard. It's not enough to say "analysis is analysis" — the transfer isn't 1:1. Analyzing leaf patterns doesn't make you good at analyzing SQL query results. But it does mean you understand what "looking for patterns" means, you have the metacognitive framework, and you're likely starting from comprehension level rather than zero. The engine needs to reason about *structural similarity between skills across domains* — same Bloom's level, similar dependency shape, similar cognitive operation — and generate cross-domain inferences with appropriate confidence decay.

This is the kind of reasoning that a 1M context window makes possible. Load two full domain graphs simultaneously. Let Opus reason about which nodes in Domain A are structurally analogous to which nodes in Domain B. No other model can hold both graphs with full learner histories and reason across them in a single session.

---

## What this is

A cross-domain inference layer that recognizes when a learner's skills in one domain carry information about their likely starting point in another domain.

**The mechanics:**

When an educator sets up a new domain for a group that already has profiles in another domain, the engine should:

1. Load both domain graphs
2. Identify structurally similar skills — same Bloom's level, analogous cognitive operation (analysis ↔ analysis, synthesis ↔ synthesis), similar position in dependency chain
3. Generate cross-domain inferences with decayed confidence — if a learner is confirmed at "design an experiment" (synthesis) in ecology, infer partial readiness for "design a pipeline" (synthesis) in Python, but at lower confidence than within-domain inference
4. Present these inferences to the educator: "Based on their ecology profiles, I estimate 3 of your students already have the analytical thinking prerequisites for data analysis. I'd still assess, but I'd start at a higher level."
5. Use cross-domain inferences to optimize assessment — don't start from scratch, start from the transfer predictions and validate or correct them

**The confidence model:**

Cross-domain confidence should be significantly lower than within-domain confidence. A reasonable starting framework:

- Same Bloom's level, same cognitive operation (e.g., "analyze X" in one domain → "analyze Y" in another): moderate confidence
- Same Bloom's level, different cognitive operation: low confidence
- Different Bloom's level: minimal to no transfer
- The more domain-specific the skill, the less it transfers. "Can open a terminal" transfers to nothing in ecology. "Can design an experiment with controls" transfers broadly.

The engine should reason about this, not apply rigid rules. This is exactly the kind of nuanced judgment Opus 4.6 is built for.

---

## What this is not

- Not claiming that skills are interchangeable across domains — a Python expert is not automatically an ecology expert
- Not replacing within-domain assessment — cross-domain transfer generates hypotheses that still need validation
- Not a fixed mapping table of "skill X in domain A = skill Y in domain B" — the reasoning is structural and contextual, not hardcoded
- Not a way to skip assessment — it's a way to make assessment smarter by starting from a better prior

---

## Why this matters

This is the feature that proves the primitives are truly universal. Right now, "universal" means the engine works in multiple domains. With cross-domain transfer, "universal" means *the domains talk to each other.* A learner isn't a blank slate in every new subject — they bring cognitive tools, analytical frameworks, and metacognitive skills from everything they've learned before.

This reflects how real learning works. A student who excels in music theory often picks up mathematics more quickly — not because notes are numbers, but because both require pattern recognition, symbolic reasoning, and structural thinking. A great teacher recognizes this. The engine should too.

For the hackathon, this creates a powerful demo moment. Show a student with a rich ecology profile entering a Python course. The engine says: "I already know some things about this student. They can design experiments, analyze patterns, and evaluate evidence. I predict they'll pick up data analysis faster than someone without this background. Let me start the assessment at a higher level." Then the assessment confirms it. The inference was correct because skills genuinely transfer.

---

## What to tell Claude Code

> Build a cross-domain transfer inference layer.
>
> When a learner has profiles in multiple domains, the engine should reason about skill transfer across domain boundaries. This is not a mapping table — it's a reasoning task. The engine should consider:
>
> - Bloom's taxonomy level alignment (synthesis skills in one domain may indicate readiness for synthesis-level thinking in another)
> - Cognitive operation similarity (analysis, evaluation, design, identification — these operations have domain-general components)
> - Dependency chain position (foundational skills are more domain-specific and transfer less; higher-order skills that compose multiple lower skills are more transferable)
> - The learner's demonstrated consistency (a learner who shows strong analytical skills across multiple ecology sub-topics is more likely to transfer that analytical capacity than one who showed it once)
>
> Implement this as a new reasoning capability that activates when:
> 1. A learner with an existing profile in Domain A is being assessed or placed in Domain B
> 2. An educator asks about a student's readiness for a new subject
> 3. The curriculum sequencer (if built) is planning across domains
>
> The cross-domain inferences should:
> - Have significantly lower confidence than within-domain inferences (these are hypotheses, not conclusions)
> - Be clearly labeled as cross-domain transfer in the learner profile (so the educator and the assessment agent know these are estimates)
> - Be used to optimize assessment start points (start higher if transfer predicts readiness, saving time)
> - Be validated or corrected by subsequent within-domain assessment
>
> Surface cross-domain insights to the educator naturally: "Maria has strong analytical skills from her ecology work. I'd expect her to pick up data pattern recognition faster than average. I'll start her assessment at a higher level to confirm."
>
> If the graph visualization (Workstream A) is available, show cross-domain links as a special edge type connecting nodes across two domain graphs side by side.
>
> Add a new section to the reason-dependencies SKILL.md covering cross-domain inference methodology — when it's valid, when it's not, and how to calibrate confidence.
