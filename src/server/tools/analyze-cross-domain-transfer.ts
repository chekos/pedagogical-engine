import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { loadGraph, DATA_DIR, BLOOM_ORDER, parseLearnerProfile as sharedParseLearnerProfile, type Skill, type Edge, type SkillGraph } from "./shared.js";

// ─── Types ────────────────────────────────────────────────────────

interface LearnerSkill {
  skillId: string;
  confidence: number;
  bloomLevel: string;
  source: "assessed" | "inferred";
}

interface TransferCandidate {
  sourceSkill: {
    id: string;
    label: string;
    bloom_level: string;
    domain: string;
  };
  targetSkill: {
    id: string;
    label: string;
    bloom_level: string;
    domain: string;
  };
  transferConfidence: number;
  reasons: string[];
  transferType: "cognitive_operation" | "metacognitive" | "structural";
}

interface TransferSummary {
  learner: { id: string; name: string };
  sourceDomain: string;
  targetDomain: string;
  sourceGraph: { skills: Skill[]; edges: Edge[] };
  targetGraph: { skills: Skill[]; edges: Edge[] };
  learnerSourceSkills: LearnerSkill[];
  transferCandidates: TransferCandidate[];
  assessmentRecommendation: {
    startLevel: string;
    skipSkills: string[];
    focusSkills: string[];
    estimatedQuestionsReduced: number;
    narrative: string;
  };
  overallReadiness: {
    level: "high" | "moderate" | "low" | "none";
    score: number;
    explanation: string;
  };
}

// ─── Confidence model ─────────────────────────────────────────────

/**
 * Cross-domain transfer confidence is based on:
 * 1. Bloom's level alignment — same level transfers better
 * 2. Cognitive operation similarity — analysis↔analysis transfers more than analysis↔synthesis
 * 3. Dependency chain position — higher-order skills (many prereqs) transfer better
 * 4. Learner consistency — high confidence in source skill = more transferable
 *
 * Base transfer rate: 0.35 (significantly lower than within-domain inference)
 * Modifiers applied multiplicatively.
 */

const BASE_TRANSFER_RATE = 0.35;

const BLOOM_TRANSFER_MULTIPLIER: Record<string, number> = {
  exact_match: 1.0,       // same Bloom's level
  adjacent: 0.6,          // one level apart
  two_apart: 0.3,         // two levels apart
  distant: 0.0,           // 3+ levels apart — no meaningful transfer
};

// Cognitive operations that have domain-general components
// Skills at analysis+ level with these operations transfer across domains
const COGNITIVE_OPERATIONS = [
  "analyze", "evaluate", "design", "compare", "interpret",
  "identify", "explain", "construct", "critique", "plan",
] as const;

function getBloomDistance(levelA: string, levelB: string): number {
  const a = BLOOM_ORDER[levelA] ?? 0;
  const b = BLOOM_ORDER[levelB] ?? 0;
  return Math.abs(a - b);
}

function getBloomMultiplier(levelA: string, levelB: string): number {
  const dist = getBloomDistance(levelA, levelB);
  if (dist === 0) return BLOOM_TRANSFER_MULTIPLIER.exact_match;
  if (dist === 1) return BLOOM_TRANSFER_MULTIPLIER.adjacent;
  if (dist === 2) return BLOOM_TRANSFER_MULTIPLIER.two_apart;
  return BLOOM_TRANSFER_MULTIPLIER.distant;
}

/**
 * Estimate the "generality" of a skill based on its position in the graph.
 * Skills with more prerequisites (higher in the dependency chain) tend to
 * involve more abstract/generalizable cognitive operations.
 */
function computeSkillGenerality(
  skill: Skill,
  graph: SkillGraph
): number {
  // Count all transitive prerequisites (depth of the skill in the DAG)
  const visited = new Set<string>();
  const queue = [skill.id];
  visited.add(skill.id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const prereqs = graph.edges.filter((e) => e.target === current);
    for (const edge of prereqs) {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        queue.push(edge.source);
      }
    }
  }

  const prereqCount = visited.size - 1; // exclude the skill itself
  const totalSkills = graph.skills.length;

  // Normalize: skills with many prereqs relative to graph size are more general
  // Also factor in Bloom's level — higher Bloom's = more generalizable
  const depthScore = Math.min(prereqCount / Math.max(totalSkills * 0.5, 1), 1.0);
  const bloomScore = (BLOOM_ORDER[skill.bloom_level] ?? 0) / 5; // 0-1 scale

  return 0.4 * depthScore + 0.6 * bloomScore;
}

/**
 * Check if two skill labels share cognitive operation keywords.
 * E.g., "analyze data patterns" and "analyze habitat health" both involve "analyze".
 */
function findSharedOperations(labelA: string, labelB: string): string[] {
  const wordsA = labelA.toLowerCase().split(/\s+/);
  const wordsB = labelB.toLowerCase().split(/\s+/);
  return COGNITIVE_OPERATIONS.filter(
    (op) =>
      wordsA.some((w) => w.startsWith(op)) &&
      wordsB.some((w) => w.startsWith(op))
  );
}

// ─── Learner profile parsing ──────────────────────────────────────

function parseLearnerProfile(content: string): {
  id: string;
  name: string;
  domains: Set<string>;
  skills: LearnerSkill[];
} {
  const profile = sharedParseLearnerProfile(content);

  const idMatch = content.match(/\| \*\*ID\*\* \| ([^ |]+)/);
  const id = idMatch?.[1]?.trim() ?? "unknown";

  const domains = new Set<string>();
  if (profile.domain) domains.add(profile.domain);

  const skills: LearnerSkill[] = profile.skills.map((s) => ({
    skillId: s.skillId,
    confidence: s.confidence,
    bloomLevel: s.bloomLevel,
    source: s.source,
  }));

  // Check for cross-domain sections (e.g., "## Domain: outdoor-ecology")
  const domainSections = content.matchAll(
    /## Domain: ([^\n]+)\n\n([\s\S]*?)(?=\n## |\n$)/g
  );
  for (const section of domainSections) {
    const domainName = section[1].trim();
    domains.add(domainName);
    const lines = section[2].split("\n").filter((l) => l.startsWith("- "));
    for (const line of lines) {
      const match = line.match(
        /- ([^:]+): ([\d.]+) confidence.*?(?:demonstrated at (\w+) level)?/
      );
      if (match) {
        skills.push({
          skillId: match[1].trim(),
          confidence: parseFloat(match[2]),
          bloomLevel: match[3] || "unknown",
          source: line.includes("(inferred)") ? "inferred" : "assessed",
        });
      }
    }
  }

  return { id, name: profile.name, domains, skills };
}

// ─── Core transfer analysis ───────────────────────────────────────

function analyzeTransfer(
  sourceGraph: SkillGraph,
  targetGraph: SkillGraph,
  sourceDomain: string,
  targetDomain: string,
  learnerSkills: LearnerSkill[]
): TransferCandidate[] {
  const candidates: TransferCandidate[] = [];

  // Only consider skills the learner actually has (assessed, confidence > 0.5)
  const demonstratedSkills = learnerSkills.filter(
    (s) => s.confidence >= 0.5 && s.source === "assessed"
  );

  for (const learnerSkill of demonstratedSkills) {
    const sourceSkill = sourceGraph.skills.find(
      (s) => s.id === learnerSkill.skillId
    );
    if (!sourceSkill) continue;

    const sourceGenerality = computeSkillGenerality(sourceSkill, sourceGraph);

    // Domain-specific foundational skills don't transfer
    // (e.g., "open-terminal" is Python-specific, "identify-common-trees" is ecology-specific)
    if (sourceGenerality < 0.2) continue;

    for (const targetSkill of targetGraph.skills) {
      // Same Bloom's level check
      const bloomMultiplier = getBloomMultiplier(
        sourceSkill.bloom_level,
        targetSkill.bloom_level
      );
      if (bloomMultiplier === 0) continue;

      // Shared cognitive operations
      const sharedOps = findSharedOperations(
        sourceSkill.label,
        targetSkill.label
      );

      // Structural similarity (both high in dependency chain)
      const targetGenerality = computeSkillGenerality(targetSkill, targetGraph);

      // Compute transfer confidence
      let transferConf = BASE_TRANSFER_RATE;
      transferConf *= bloomMultiplier;
      transferConf *= learnerSkill.confidence; // Scale by source confidence
      transferConf *= (0.5 + 0.5 * sourceGenerality); // More general = more transferable

      const reasons: string[] = [];
      let transferType: TransferCandidate["transferType"] = "structural";

      if (sharedOps.length > 0) {
        transferConf *= 1.3; // Boost for shared cognitive operations
        transferType = "cognitive_operation";
        reasons.push(
          `Shared cognitive operation: ${sharedOps.join(", ")}`
        );
      }

      if (
        sourceGenerality > 0.6 &&
        targetGenerality > 0.6
      ) {
        transferConf *= 1.2; // Boost when both skills are high-order
        transferType = sharedOps.length > 0 ? "cognitive_operation" : "metacognitive";
        reasons.push(
          "Both are high-order skills requiring composition of multiple sub-skills"
        );
      }

      if (bloomMultiplier === 1.0) {
        reasons.push(
          `Same Bloom's level: ${sourceSkill.bloom_level}`
        );
      } else {
        reasons.push(
          `Adjacent Bloom's levels: ${sourceSkill.bloom_level} -> ${targetSkill.bloom_level}`
        );
      }

      reasons.push(
        `Source skill confidence: ${learnerSkill.confidence}`
      );

      // Cap at reasonable maximum for cross-domain transfer
      transferConf = Math.min(transferConf, 0.55);
      transferConf = Math.round(transferConf * 100) / 100;

      // Only include meaningful transfer candidates (above noise threshold)
      if (transferConf >= 0.10) {
        candidates.push({
          sourceSkill: {
            id: sourceSkill.id,
            label: sourceSkill.label,
            bloom_level: sourceSkill.bloom_level,
            domain: sourceDomain,
          },
          targetSkill: {
            id: targetSkill.id,
            label: targetSkill.label,
            bloom_level: targetSkill.bloom_level,
            domain: targetDomain,
          },
          transferConfidence: transferConf,
          reasons,
          transferType,
        });
      }
    }
  }

  // Sort by transfer confidence (highest first), then deduplicate target skills
  // keeping only the strongest transfer for each target skill
  candidates.sort((a, b) => b.transferConfidence - a.transferConfidence);

  const bestPerTarget = new Map<string, TransferCandidate>();
  for (const c of candidates) {
    const existing = bestPerTarget.get(c.targetSkill.id);
    if (!existing || c.transferConfidence > existing.transferConfidence) {
      bestPerTarget.set(c.targetSkill.id, c);
    }
  }

  return Array.from(bestPerTarget.values()).sort(
    (a, b) => b.transferConfidence - a.transferConfidence
  );
}

function generateAssessmentRecommendation(
  candidates: TransferCandidate[],
  targetGraph: SkillGraph
): TransferSummary["assessmentRecommendation"] {
  const strongTransfers = candidates.filter((c) => c.transferConfidence >= 0.25);
  const moderateTransfers = candidates.filter(
    (c) => c.transferConfidence >= 0.15 && c.transferConfidence < 0.25
  );

  const skipSkills = strongTransfers
    .filter((c) => c.transferConfidence >= 0.35)
    .map((c) => c.targetSkill.id);

  const focusSkills = targetGraph.skills
    .filter((s) => !skipSkills.includes(s.id))
    .filter(
      (s) => !candidates.some((c) => c.targetSkill.id === s.id && c.transferConfidence >= 0.25)
    )
    .map((s) => s.id);

  // Determine start level based on strongest transfers
  let startLevel = "knowledge";
  if (strongTransfers.some((c) => c.targetSkill.bloom_level === "synthesis" || c.targetSkill.bloom_level === "evaluation")) {
    startLevel = "analysis";
  } else if (strongTransfers.some((c) => c.targetSkill.bloom_level === "analysis")) {
    startLevel = "application";
  } else if (strongTransfers.length > 0) {
    startLevel = "comprehension";
  }

  const totalSkills = targetGraph.skills.length;
  const estimatedReduction = Math.min(
    Math.floor(strongTransfers.length * 0.7 + moderateTransfers.length * 0.3),
    Math.floor(totalSkills * 0.4)
  );

  let narrative: string;
  if (strongTransfers.length >= 3) {
    narrative = `This learner's ${candidates[0]?.sourceSkill.domain} experience suggests strong cognitive readiness for several ${candidates[0]?.targetSkill.domain} skills. I'd start assessment at ${startLevel} level and expect them to pick up ${strongTransfers.length} skills faster than a complete beginner. Still need to verify domain-specific knowledge, but the analytical frameworks transfer.`;
  } else if (strongTransfers.length > 0) {
    narrative = `Some transferable skills from ${candidates[0]?.sourceSkill.domain}: the learner has demonstrated ${strongTransfers.map((c) => c.sourceSkill.bloom_level).join("/")} level thinking that partially applies here. I'd start assessment slightly higher and validate.`;
  } else if (moderateTransfers.length > 0) {
    narrative = `Limited but detectable transfer from ${candidates[0]?.sourceSkill.domain}. The learner isn't starting from zero — they have general ${moderateTransfers[0]?.transferType} skills that give them a slight head start. Assessment should still be comprehensive.`;
  } else {
    narrative = "No significant cross-domain transfer detected. Recommend standard assessment from the beginning.";
  }

  return {
    startLevel,
    skipSkills,
    focusSkills: focusSkills.slice(0, 10), // Top 10
    estimatedQuestionsReduced: estimatedReduction,
    narrative,
  };
}

function computeOverallReadiness(
  candidates: TransferCandidate[]
): TransferSummary["overallReadiness"] {
  if (candidates.length === 0) {
    return { level: "none", score: 0, explanation: "No transferable skills detected between these domains." };
  }

  const avgConf =
    candidates.reduce((sum, c) => sum + c.transferConfidence, 0) /
    candidates.length;
  const strongCount = candidates.filter((c) => c.transferConfidence >= 0.3).length;
  const score = Math.round(
    (avgConf * 0.6 + Math.min(strongCount / 5, 1) * 0.4) * 100
  ) / 100;

  let level: TransferSummary["overallReadiness"]["level"];
  let explanation: string;

  if (score >= 0.4) {
    level = "high";
    explanation = `Strong cross-domain readiness. ${strongCount} skills show significant transfer potential. The learner's cognitive frameworks from the source domain will accelerate their learning.`;
  } else if (score >= 0.25) {
    level = "moderate";
    explanation = `Moderate readiness. Some thinking patterns transfer, particularly at higher Bloom's levels. The learner has a head start on analytical and evaluative tasks but will need full instruction on domain-specific content.`;
  } else if (score >= 0.1) {
    level = "low";
    explanation = `Limited transfer. The domains share some structural similarities but the learner's existing skills are too domain-specific to provide significant advantage. Minor benefit to metacognitive awareness.`;
  } else {
    level = "none";
    explanation = "No meaningful transfer detected. The domains require distinct skill sets.";
  }

  return { level, score, explanation };
}

// ─── Reusable core logic ──────────────────────────────────────────

export async function runTransferAnalysis(params: {
  learnerId: string;
  sourceDomain: string;
  targetDomain: string;
}): Promise<TransferSummary> {
  const { learnerId, sourceDomain, targetDomain } = params;

  // Load learner profile
  const learnerPath = path.join(DATA_DIR, "learners", `${learnerId}.md`);
  const learnerContent = await fs.readFile(learnerPath, "utf-8");

  // Load both domain graphs
  const [sourceGraph, targetGraph] = await Promise.all([
    loadGraph(sourceDomain),
    loadGraph(targetDomain),
  ]);

  // Parse learner profile
  const learner = parseLearnerProfile(learnerContent);

  // Filter to source domain skills
  const sourceSkillIds = new Set(sourceGraph.skills.map((s) => s.id));
  const learnerSourceSkills = learner.skills.filter((s) =>
    sourceSkillIds.has(s.skillId)
  );

  if (learnerSourceSkills.length === 0) {
    throw new Error(
      `Learner '${learnerId}' has no assessed skills in '${sourceDomain}'. Cannot analyze transfer without source skills.`
    );
  }

  // Fill in bloom levels from the graph for skills that didn't parse them
  for (const ls of learnerSourceSkills) {
    if (ls.bloomLevel === "unknown") {
      const graphSkill = sourceGraph.skills.find((s) => s.id === ls.skillId);
      if (graphSkill) ls.bloomLevel = graphSkill.bloom_level;
    }
  }

  // Run transfer analysis
  const candidates = analyzeTransfer(
    sourceGraph,
    targetGraph,
    sourceDomain,
    targetDomain,
    learnerSourceSkills
  );

  const assessmentRec = generateAssessmentRecommendation(
    candidates,
    targetGraph
  );

  const readiness = computeOverallReadiness(candidates);

  return {
    learner: { id: learner.id, name: learner.name },
    sourceDomain,
    targetDomain,
    sourceGraph: { skills: sourceGraph.skills, edges: sourceGraph.edges },
    targetGraph: { skills: targetGraph.skills, edges: targetGraph.edges },
    learnerSourceSkills,
    transferCandidates: candidates,
    assessmentRecommendation: assessmentRec,
    overallReadiness: readiness,
  };
}

// ─── MCP Tool ─────────────────────────────────────────────────────

export const analyzeCrossDomainTransferTool = tool(
  "analyze_cross_domain_transfer",
  "Analyze cross-domain skill transfer for a learner. Given a learner with assessed skills in one domain (source), predict which skills in another domain (target) they may have partial readiness for. Uses Bloom's taxonomy alignment, cognitive operation similarity, and dependency chain analysis to generate transfer hypotheses with decayed confidence. Cross-domain inferences are always lower confidence than within-domain inferences — they are hypotheses for smarter assessment, not conclusions.",
  {
    learnerId: z.string().describe("Learner's file ID (without .md)"),
    sourceDomain: z
      .string()
      .describe("Domain where the learner has existing skills"),
    targetDomain: z
      .string()
      .describe("Domain where we want to predict readiness"),
  },
  async ({ learnerId, sourceDomain, targetDomain }) => {
    try {
      const summary = await runTransferAnalysis({
        learnerId,
        sourceDomain,
        targetDomain,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: (err as Error).message,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);
