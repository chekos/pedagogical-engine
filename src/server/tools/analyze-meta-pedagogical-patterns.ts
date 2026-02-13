import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

/**
 * Meta-pedagogical pattern analysis tool: detects when an educator's
 * questions reveal a pattern (they keep asking about the same type of
 * decision) and surfaces the underlying pedagogical principle.
 *
 * This is what makes the engine a mentor, not just a planner — it teaches
 * the educator about teaching.
 */

interface QuestionRecord {
  timestamp: string;
  question: string;
  decisionType: string;
  lessonId: string;
  topic?: string;
}

interface PedagogicalPrinciple {
  id: string;
  name: string;
  relatedDecisionTypes: string[];
  description: string;
  framework: string;
  example: string;
  deeperReading: string;
}

// The pedagogical principles the engine can teach
const PEDAGOGICAL_PRINCIPLES: PedagogicalPrinciple[] = [
  {
    id: "bloom-activity-ordering",
    name: "Bloom's Taxonomy and Activity Ordering",
    relatedDecisionTypes: ["ordering", "activity_choice"],
    description:
      "The Bloom's level of the group relative to the activity determines whether to lead with theory or practice. When most learners are already at application level or higher on the prerequisites, they learn more from doing first and abstracting second (inductive learning). When most are at knowledge/comprehension level, they need the conceptual framework first before they can make sense of hands-on work (deductive learning).",
    framework:
      "Check the group's assessed Bloom's levels on the prerequisite skills. If 60%+ are at application or higher → lead with practice. If 60%+ are at knowledge/comprehension → lead with theory. Mixed groups → provide a quick conceptual anchor (3-5 min) then dive into practice with scaffolding.",
    example:
      "If your group already knows how to import pandas and create DataFrames (application level), starting with a hands-on 'explore this messy dataset' exercise before explaining cleaning techniques is more effective than lecturing first. They already have the foundation to learn by doing.",
    deeperReading:
      "Bloom, B.S. (1956). Taxonomy of Educational Objectives. Prince & Felder (2006) on inductive vs. deductive teaching.",
  },
  {
    id: "timing-calibration",
    name: "Evidence-Based Timing Calibration",
    relatedDecisionTypes: ["timing"],
    description:
      "Activity timing should be calibrated based on three factors: (1) the Bloom's complexity of the skill being taught, (2) the group's readiness level for that skill, and (3) accumulated evidence from prior sessions. Higher Bloom's levels (synthesis, evaluation) need more time than lower levels (knowledge, comprehension). Groups with lower readiness need more time. And if teaching wisdom says a section consistently runs 5 minutes over, pre-allocate that time.",
    framework:
      "Base time = Bloom's level baseline (knowledge: 5min, comprehension: 10min, application: 15min, analysis: 20min, synthesis: 30min, evaluation: 25min). Adjust +50% for groups with low readiness. Adjust based on teaching wisdom patterns. Always include 2-3 min buffer for transitions.",
    example:
      "A 'basic plotting' activity (application level) has a 15-min base. If the group has low readiness (most haven't done prerequisites), adjust to ~22 min. If teaching wisdom from 18 sessions says this section runs 5 min over for beginners, pre-allocate 20 min instead of the standard 15.",
    deeperReading:
      "Wiggins & McTighe (2005). Understanding by Design. Ambrose et al. (2010). How Learning Works.",
  },
  {
    id: "pairing-strategy",
    name: "Skill-Complementary Pairing",
    relatedDecisionTypes: ["pairing"],
    description:
      "Effective pairing matches learners with complementary skills — not just 'strong with weak.' The ideal pair has a 1 Bloom's level gap (not 2+), complementary strengths (one is strong where the other is developing), and compatible working dynamics. The more advanced partner gets the challenge of explaining (which exercises synthesis-level skills), while the developing partner gets scaffolding from a near-peer.",
    framework:
      "1 Bloom's level gap → great pair. 2+ levels → the advanced partner does all the work. Same level → they may both get stuck at the same point. Also consider affective compatibility: don't pair a low-confidence learner with a high-dominance one. Consider social dynamics from the affective profile.",
    example:
      "Pairing Alex (beginner, no plotting skills) with Priya (advanced, application level) works because Priya can guide while Alex types. But tell Priya: 'Guide with words, not by taking the keyboard.' Priya exercises synthesis skills (explaining) while Alex gets near-peer scaffolding.",
    deeperReading:
      "Vygotsky, L.S. (1978). Zone of Proximal Development. Topping (2005). Peer tutoring and assessment.",
  },
  {
    id: "content-depth-calibration",
    name: "Content Depth Based on Educator Expertise",
    relatedDecisionTypes: ["content_depth"],
    description:
      "The detail level of a lesson plan should match the educator's expertise in the domain. An expert educator doesn't need full talking points — they need timing cues and structural scaffolding. A novice educator needs the full script: talking points, anticipated questions with prepared answers, and step-by-step walkthroughs. This isn't about the educator's overall teaching ability — it's about their comfort with the specific content.",
    framework:
      "Expert → bullets, timing focus, trust them to explain in their own words. Proficient → key talking points, anticipated tough questions. Intermediate → full talking points, reference notes for complex topics. Novice → complete script with anticipated student questions and prepared answers.",
    example:
      "Dr. Chen (expert in python-data-analysis) gets a plan focused on timing and group management. Marcus Rodriguez (intermediate in the same domain) gets the same learning objectives but with full talking points and anticipated student questions with prepared answers.",
    deeperReading:
      "Shulman, L.S. (1986). Those who understand: Knowledge growth in teaching. Pedagogical Content Knowledge (PCK).",
  },
  {
    id: "contingency-design",
    name: "Contingency Planning as Pedagogical Design",
    relatedDecisionTypes: ["contingency"],
    description:
      "Contingencies aren't just backup plans — they're pedagogical design. Every major activity should have three contingency directions: scaffold down (if students struggle), extend up (if students breeze through), and analog fallback (if tech fails). The choice of contingency style should also match the educator's preference: improvisers get open-ended pivots, structuralists get specific alternatives with full instructions.",
    framework:
      "For each activity: (1) What if they can't do this? → Scaffold down: simplify, break into smaller steps, provide templates. (2) What if they breeze through? → Extend up: add complexity, pair with struggling peer, introduce next skill. (3) What if tech fails? → Analog fallback: whiteboard, paper, verbal walkthrough.",
    example:
      "For a plotting exercise: Scaffold down → 'fill in the blank' code templates. Extend up → subplot grid challenge. Tech failure → draw the chart types on the whiteboard, discuss when to use each, return to code later.",
    deeperReading:
      "Lemov, D. (2015). Teach Like a Champion 2.0. Tomlinson, C.A. (2001). Differentiated instruction.",
  },
  {
    id: "energy-management",
    name: "Session Energy Management",
    relatedDecisionTypes: ["ordering", "timing"],
    description:
      "Lessons have an energy arc. Front-loading all difficult material creates fatigue and disengagement. Ending with a lecture after active work feels deflating. The optimal pattern alternates between active and passive, peaks in the middle third, and ends with a consolidation activity that feels like progress — not more new content.",
    framework:
      "Opening (10-15%): low-stakes warm-up, hook. Build-up (20-30%): introduce new concepts, moderate engagement. Peak (30-40%): hardest/most active work — hands-on exercises, group activities. Cool-down (15-20%): consolidate learning, pattern reinforcement, 'the one thing' anchor. Never put the hardest content last. Never end with a lecture.",
    example:
      "In a 30-min session: 0-5 min (hook, setup), 5-15 min (live demos — moderate engagement), 15-27 min (hands-on exercise — peak activity), 27-30 min (wrap-up, pattern reinforcement). The exercise is the peak, not the end.",
    deeperReading:
      "Jensen, E. (2008). Brain-Based Learning. Sousa, D.A. (2011). How the Brain Learns.",
  },
];

export const analyzeMetaPedagogicalPatternsTool = tool(
  "analyze_meta_pedagogical_patterns",
  "Analyze the educator's questions about lesson plans to detect patterns that reveal opportunities for teaching pedagogical principles. When an educator repeatedly asks about the same type of decision (e.g., keeps asking about activity ordering), this tool identifies the pattern and suggests the underlying principle to teach. Returns the pedagogical principle with framework, examples, and a natural way to offer the teaching moment.",
  {
    educatorId: z
      .string()
      .optional()
      .describe("Educator ID (if known) to load question history"),
    currentQuestion: z.string().describe("The current question being asked"),
    currentDecisionType: z
      .enum([
        "ordering",
        "timing",
        "pairing",
        "activity_choice",
        "content_depth",
        "contingency",
        "general",
      ])
      .describe("The type of decision being questioned"),
    questionHistory: z
      .array(
        z.object({
          question: z.string(),
          decisionType: z.string(),
          lessonId: z.string().optional(),
        })
      )
      .optional()
      .describe(
        "Previous questions in this session (if tracking in memory)"
      ),
  },
  async ({
    educatorId,
    currentQuestion,
    currentDecisionType,
    questionHistory,
  }) => {
    // 1. Load stored question history if educator ID is available
    let storedHistory: QuestionRecord[] = [];
    if (educatorId) {
      const historyPath = path.join(
        DATA_DIR,
        "meta-pedagogical",
        `${educatorId}-questions.json`
      );
      try {
        const raw = await fs.readFile(historyPath, "utf-8");
        storedHistory = JSON.parse(raw).questions || [];
      } catch {
        // No stored history
      }
    }

    // 2. Combine session history with stored history
    const allQuestions = [
      ...storedHistory,
      ...(questionHistory || []).map((q) => ({
        ...q,
        timestamp: new Date().toISOString(),
      })),
      {
        timestamp: new Date().toISOString(),
        question: currentQuestion,
        decisionType: currentDecisionType,
        lessonId: "current",
      },
    ];

    // 3. Count decision types across all questions
    const typeCounts: Record<string, number> = {};
    for (const q of allQuestions) {
      typeCounts[q.decisionType] =
        (typeCounts[q.decisionType] || 0) + 1;
    }

    // 4. Detect patterns (3+ questions about the same type = pattern)
    const patternThreshold = 3;
    const detectedPatterns: Array<{
      decisionType: string;
      count: number;
      principle: PedagogicalPrinciple;
      teachingMomentSuggestion: string;
    }> = [];

    for (const [dtype, count] of Object.entries(typeCounts)) {
      if (count >= patternThreshold || dtype === currentDecisionType) {
        const principle = PEDAGOGICAL_PRINCIPLES.find((p) =>
          p.relatedDecisionTypes.includes(dtype)
        );
        if (principle) {
          const isRepeat = count >= patternThreshold;
          detectedPatterns.push({
            decisionType: dtype,
            count,
            principle,
            teachingMomentSuggestion: isRepeat
              ? `You've asked about ${dtype.replace(/_/g, " ")} decisions ${count} times now. There's a framework I use for this — ${principle.name}. Would you like me to walk you through it? It might help you evaluate my plans more quickly.`
              : `Since you're curious about this ${dtype.replace(/_/g, " ")} decision, here's the framework behind it: ${principle.name}.`,
          });
        }
      }
    }

    // 5. Also find the principle most relevant to the current question
    const currentPrinciple = PEDAGOGICAL_PRINCIPLES.find((p) =>
      p.relatedDecisionTypes.includes(currentDecisionType)
    );

    // 6. Store the question for future pattern detection
    if (educatorId) {
      const historyDir = path.join(DATA_DIR, "meta-pedagogical");
      await fs.mkdir(historyDir, { recursive: true });
      const historyPath = path.join(
        historyDir,
        `${educatorId}-questions.json`
      );
      const updatedHistory = {
        educatorId,
        lastUpdated: new Date().toISOString(),
        questionCount: allQuestions.length,
        questions: allQuestions.slice(-50), // Keep last 50
      };
      await fs.writeFile(
        historyPath,
        JSON.stringify(updatedHistory, null, 2),
        "utf-8"
      );
    }

    const result = {
      currentQuestion,
      currentDecisionType,
      totalQuestionsAnalyzed: allQuestions.length,
      questionTypeCounts: typeCounts,
      patternsDetected: detectedPatterns.length > 0,
      patterns: detectedPatterns,
      currentPrinciple: currentPrinciple
        ? {
            name: currentPrinciple.name,
            description: currentPrinciple.description,
            framework: currentPrinciple.framework,
            example: currentPrinciple.example,
            deeperReading: currentPrinciple.deeperReading,
          }
        : null,
      guidance:
        "If a pattern is detected (the educator keeps asking about the same type of decision), " +
        "NATURALLY offer to teach the underlying principle. Don't be condescending — frame it as: " +
        "'I've noticed you've been asking about [topic]. There's a framework I use for this. " +
        "Want me to walk you through it?' If no pattern is detected, still reference the " +
        "relevant principle in your explanation, but briefly — don't lecture unprompted.",
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);
