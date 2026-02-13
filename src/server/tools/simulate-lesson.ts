import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { loadGraph, DATA_DIR, type Skill, type SkillGraph } from "./shared.js";

// ─── Types ──────────────────────────────────────────────────────

interface LearnerSkillProfile {
  id: string;
  name: string;
  assessed: Record<string, number>; // skillId -> confidence
  inferred: Record<string, number>;
}

interface SectionSkillRequirement {
  sectionIndex: number;
  sectionTitle: string;
  startMin: number;
  endMin: number;
  requiredSkills: string[]; // skill IDs mentioned/needed in this section
  taughtSkills: string[]; // skills being taught in this section
}

type LearnerReadiness = "ready" | "partial" | "gap";

interface LearnerSectionStatus {
  learnerId: string;
  learnerName: string;
  readiness: LearnerReadiness;
  confidence: number; // 0.0-1.0, average confidence across required skills
  missingSkills: string[];
  weakSkills: Array<{ skillId: string; confidence: number }>;
}

interface FrictionPoint {
  sectionIndex: number;
  sectionTitle: string;
  startMin: number;
  severity: number; // 0.0–1.0
  affectedCount: number;
  totalCount: number;
  affectedLearners: Array<{ id: string; name: string; missingSkills: string[] }>;
  description: string;
}

interface CollisionMoment {
  sectionIndex: number;
  sectionTitle: string;
  startMin: number;
  simultaneousGaps: number;
  commonGapSkills: string[];
  description: string;
}

interface CascadeRisk {
  upstreamSection: number;
  upstreamTitle: string;
  downstreamSection: number;
  downstreamTitle: string;
  affectedLearners: string[];
  chainedSkills: string[];
  description: string;
}

interface PivotSuggestion {
  sectionIndex: number;
  type: "reteach" | "pair" | "substitute" | "restructure";
  description: string;
  timeCostMin: number;
}

interface SimulationResult {
  lessonId: string;
  lessonTitle: string;
  groupName: string;
  domain: string;
  overallConfidence: number;
  sectionAnalysis: Array<{
    sectionIndex: number;
    sectionTitle: string;
    startMin: number;
    endMin: number;
    requiredSkills: string[];
    taughtSkills: string[];
    learnerStatuses: LearnerSectionStatus[];
    readyCount: number;
    partialCount: number;
    gapCount: number;
  }>;
  frictionPoints: FrictionPoint[];
  collisionMoments: CollisionMoment[];
  cascadeRisks: CascadeRisk[];
  pivotSuggestions: PivotSuggestion[];
}

// ─── Helpers ────────────────────────────────────────────────────

/** Parse learner profile markdown into a skill map */
function parseLearnerProfile(content: string): { assessed: Record<string, number>; inferred: Record<string, number> } {
  const assessed: Record<string, number> = {};
  const inferred: Record<string, number> = {};

  // Parse assessed skills
  const assessedSection = content.split("## Assessed Skills")[1]?.split("##")[0] ?? "";
  for (const line of assessedSection.split("\n")) {
    const match = line.match(/^- ([^:]+):\s*([\d.]+)\s*confidence/);
    if (match) {
      assessed[match[1].trim()] = parseFloat(match[2]);
    }
  }

  // Parse inferred skills
  const inferredSection = content.split("## Inferred Skills")[1]?.split("##")[0] ?? "";
  for (const line of inferredSection.split("\n")) {
    const match = line.match(/^- ([^:]+):\s*([\d.]+)\s*confidence/);
    if (match) {
      inferred[match[1].trim()] = parseFloat(match[2]);
    }
  }

  return { assessed, inferred };
}

/** Parse group members from group markdown */
function parseGroupMembers(content: string): Array<{ id: string; name: string }> {
  const members: Array<{ id: string; name: string }> = [];
  const memberRegex = /- (.+?) \(`([^)]+)`\)/g;
  let match;
  while ((match = memberRegex.exec(content)) !== null) {
    members.push({ id: match[2], name: match[1] });
  }
  return members;
}

/** Extract skills mentioned in a lesson section based on skill IDs and labels */
function extractSectionSkills(
  sectionContent: string,
  sectionTitle: string,
  allSkills: Skill[]
): { required: string[]; taught: string[] } {
  const required: Set<string> = new Set();
  const taught: Set<string> = new Set();
  const text = (sectionTitle + " " + sectionContent).toLowerCase();

  for (const skill of allSkills) {
    const idLower = skill.id.toLowerCase();
    const labelLower = skill.label.toLowerCase();

    // Check for explicit skill ID references (e.g., `select-filter-data`)
    if (text.includes(idLower) || text.includes("`" + idLower + "`")) {
      // If "target skill" or "teaching" language present, it's being taught
      if (
        text.includes("target skill") ||
        text.includes("you-do") ||
        text.includes("exercise") ||
        text.includes("practice")
      ) {
        taught.add(skill.id);
      }
      required.add(skill.id);
    }

    // Check for label fragments (e.g., "groupby", "filter", "select columns")
    const keywords = extractKeywords(skill.id);
    for (const kw of keywords) {
      if (kw.length >= 4 && text.includes(kw)) {
        required.add(skill.id);
        break;
      }
    }
  }

  return { required: [...required], taught: [...taught] };
}

/** Extract meaningful keywords from a skill ID */
function extractKeywords(skillId: string): string[] {
  return skillId
    .split("-")
    .filter((w) => w.length >= 4);
}

/** Get learner's effective confidence for a skill (assessed > inferred > 0) */
function getSkillConfidence(
  learner: LearnerSkillProfile,
  skillId: string
): number {
  return learner.assessed[skillId] ?? learner.inferred[skillId] ?? 0;
}

/** Determine readiness status for a learner on a set of required skills */
function assessReadiness(
  learner: LearnerSkillProfile,
  requiredSkills: string[],
  taughtSkills: string[]
): LearnerSectionStatus {
  if (requiredSkills.length === 0) {
    return {
      learnerId: learner.id,
      learnerName: learner.name,
      readiness: "ready",
      confidence: 1.0,
      missingSkills: [],
      weakSkills: [],
    };
  }

  // Only check prerequisite skills (skills that are required but NOT being taught in this section)
  const prereqSkills = requiredSkills.filter((s) => !taughtSkills.includes(s));
  if (prereqSkills.length === 0) {
    return {
      learnerId: learner.id,
      learnerName: learner.name,
      readiness: "ready",
      confidence: 1.0,
      missingSkills: [],
      weakSkills: [],
    };
  }

  const confidences = prereqSkills.map((s) => getSkillConfidence(learner, s));
  const avgConfidence =
    confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

  const missingSkills = prereqSkills.filter(
    (s) => getSkillConfidence(learner, s) < 0.3
  );
  const weakSkills = prereqSkills
    .filter((s) => {
      const c = getSkillConfidence(learner, s);
      return c >= 0.3 && c < 0.6;
    })
    .map((s) => ({ skillId: s, confidence: getSkillConfidence(learner, s) }));

  let readiness: LearnerReadiness;
  if (avgConfidence >= 0.6 && missingSkills.length === 0) {
    readiness = "ready";
  } else if (avgConfidence >= 0.35 || missingSkills.length <= 1) {
    readiness = "partial";
  } else {
    readiness = "gap";
  }

  return {
    learnerId: learner.id,
    learnerName: learner.name,
    readiness,
    confidence: Math.round(avgConfidence * 100) / 100,
    missingSkills,
    weakSkills,
  };
}

/** Find common gap skills across multiple learners */
function findCommonGaps(
  statuses: LearnerSectionStatus[]
): string[] {
  const gapCounts: Record<string, number> = {};
  for (const s of statuses) {
    for (const skill of [...s.missingSkills, ...s.weakSkills.map((w) => w.skillId)]) {
      gapCounts[skill] = (gapCounts[skill] || 0) + 1;
    }
  }
  return Object.entries(gapCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([skill]) => skill);
}

/** Generate pivot suggestions for a friction point */
function generatePivots(
  friction: FrictionPoint,
  graph: SkillGraph,
  learners: LearnerSkillProfile[]
): PivotSuggestion[] {
  const suggestions: PivotSuggestion[] = [];
  const sectionIdx = friction.sectionIndex;

  // 1. Reteach prerequisite
  if (friction.affectedLearners.length > 0) {
    const commonMissing = friction.affectedLearners
      .flatMap((l) => l.missingSkills)
      .reduce<Record<string, number>>((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

    const topMissing = Object.entries(commonMissing)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    for (const [skillId, count] of topMissing) {
      const skill = graph.skills.find((s) => s.id === skillId);
      suggestions.push({
        sectionIndex: sectionIdx,
        type: "reteach",
        description: `Spend 3-5 minutes reteaching "${skill?.label ?? skillId}" — ${count} learner(s) need this prerequisite before they can engage with this section.`,
        timeCostMin: 5,
      });
    }
  }

  // 2. Pair strong with struggling
  const strong = learners.filter((l) => {
    const allSkills = { ...l.assessed, ...l.inferred };
    return friction.affectedLearners.every((a) => a.id !== l.id) &&
      Object.values(allSkills).some((c) => c >= 0.7);
  });

  if (strong.length > 0 && friction.affectedCount <= strong.length) {
    suggestions.push({
      sectionIndex: sectionIdx,
      type: "pair",
      description: `Pair struggling learners with stronger peers: ${strong.map((s) => s.name).slice(0, 3).join(", ")} can mentor during this section.`,
      timeCostMin: 0,
    });
  }

  // 3. Substitute activity
  suggestions.push({
    sectionIndex: sectionIdx,
    type: "substitute",
    description: `Offer a scaffolded version of this activity for struggling learners — pre-written code templates they modify instead of writing from scratch.`,
    timeCostMin: 2,
  });

  return suggestions;
}

// ─── Parse lesson plan sections for skill extraction ───────────

interface ParsedSection {
  index: number;
  title: string;
  startMin: number;
  endMin: number;
  content: string;
}

function parseLessonSections(markdown: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  // Match timed section headers: **[H:MM - H:MM] Title (N min)**
  const sectionRegex =
    /\*\*\[(\d+):(\d+)\s*-\s*(\d+):(\d+)\]\s*(.+?)\s*\((\d+)\s*min\)\*\*/g;
  const matches: Array<{
    startMin: number;
    endMin: number;
    title: string;
    matchIndex: number;
    matchEnd: number;
  }> = [];

  let m;
  while ((m = sectionRegex.exec(markdown)) !== null) {
    matches.push({
      startMin: parseInt(m[1]) * 60 + parseInt(m[2]),
      endMin: parseInt(m[3]) * 60 + parseInt(m[4]),
      title: m[5].trim(),
      matchIndex: m.index,
      matchEnd: m.index + m[0].length,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const s = matches[i];
    const nextStart = matches[i + 1]?.matchIndex ?? markdown.length;
    const content = markdown.slice(s.matchEnd, nextStart);

    sections.push({
      index: i,
      title: s.title,
      startMin: s.startMin,
      endMin: s.endMin,
      content,
    });
  }

  return sections;
}

// ─── Main simulation logic ──────────────────────────────────────

async function runSimulation(
  lessonId: string,
  domain: string,
  groupName: string
): Promise<SimulationResult> {
  // 1. Load skill graph
  const graph = await loadGraph(domain);

  // 2. Load group members
  const groupPath = path.join(DATA_DIR, "groups", `${groupName}.md`);
  const groupContent = await fs.readFile(groupPath, "utf-8");
  const members = parseGroupMembers(groupContent);

  if (members.length === 0) {
    throw new Error(`No members found in group '${groupName}'. Check group file format.`);
  }

  // 3. Load learner profiles
  const learners: LearnerSkillProfile[] = [];
  for (const member of members) {
    try {
      const profilePath = path.join(DATA_DIR, "learners", `${member.id}.md`);
      const profileContent = await fs.readFile(profilePath, "utf-8");
      const { assessed, inferred } = parseLearnerProfile(profileContent);
      learners.push({
        id: member.id,
        name: member.name,
        assessed,
        inferred,
      });
    } catch {
      // Learner profile not found — treat as empty
      learners.push({
        id: member.id,
        name: member.name,
        assessed: {},
        inferred: {},
      });
    }
  }

  // 4. Load and parse lesson plan
  const lessonPath = path.join(DATA_DIR, "lessons", `${lessonId}.md`);
  const lessonContent = await fs.readFile(lessonPath, "utf-8");
  const sections = parseLessonSections(lessonContent);

  // Extract title
  const titleMatch = lessonContent.match(/^#\s+(?:Lesson Plan:\s*)?(.+)/m);
  const lessonTitle = titleMatch?.[1]?.trim() ?? lessonId;

  // 5. Analyze each section
  const sectionAnalysis = sections.map((section) => {
    const { required, taught } = extractSectionSkills(
      section.content,
      section.title,
      graph.skills
    );

    const learnerStatuses = learners.map((learner) =>
      assessReadiness(learner, required, taught)
    );

    return {
      sectionIndex: section.index,
      sectionTitle: section.title,
      startMin: section.startMin,
      endMin: section.endMin,
      requiredSkills: required,
      taughtSkills: taught,
      learnerStatuses,
      readyCount: learnerStatuses.filter((s) => s.readiness === "ready").length,
      partialCount: learnerStatuses.filter((s) => s.readiness === "partial").length,
      gapCount: learnerStatuses.filter((s) => s.readiness === "gap").length,
    };
  });

  // 6. Identify friction points (30%+ of group has gaps)
  const frictionPoints: FrictionPoint[] = [];
  for (const section of sectionAnalysis) {
    const struggling = section.learnerStatuses.filter(
      (s) => s.readiness === "gap" || s.readiness === "partial"
    );
    const frictionRatio = struggling.length / learners.length;

    if (frictionRatio >= 0.3) {
      const severity =
        frictionRatio *
        (1 -
          struggling.reduce((sum, s) => sum + s.confidence, 0) /
            struggling.length);

      frictionPoints.push({
        sectionIndex: section.sectionIndex,
        sectionTitle: section.sectionTitle,
        startMin: section.startMin,
        severity: Math.round(severity * 100) / 100,
        affectedCount: struggling.length,
        totalCount: learners.length,
        affectedLearners: struggling.map((s) => ({
          id: s.learnerId,
          name: s.learnerName,
          missingSkills: [
            ...s.missingSkills,
            ...s.weakSkills.map((w) => w.skillId),
          ],
        })),
        description: `${struggling.length}/${learners.length} learners will struggle at minute ${section.startMin}: ${struggling.map((s) => s.learnerName).join(", ")}`,
      });
    }
  }

  // Sort by severity
  frictionPoints.sort((a, b) => b.severity - a.severity);

  // 7. Identify collision moments (multiple simultaneous gaps on same skill)
  const collisionMoments: CollisionMoment[] = [];
  for (const section of sectionAnalysis) {
    const gapLearners = section.learnerStatuses.filter(
      (s) => s.readiness === "gap"
    );
    if (gapLearners.length >= 2) {
      const commonGaps = findCommonGaps(gapLearners);
      if (commonGaps.length > 0) {
        collisionMoments.push({
          sectionIndex: section.sectionIndex,
          sectionTitle: section.sectionTitle,
          startMin: section.startMin,
          simultaneousGaps: gapLearners.length,
          commonGapSkills: commonGaps,
          description: `${gapLearners.length} learners hit the same wall at minute ${section.startMin} — shared gap in: ${commonGaps.join(", ")}. You cannot help them all at once.`,
        });
      }
    }
  }

  // 8. Detect cascade risks
  const cascadeRisks: CascadeRisk[] = [];
  for (let i = 1; i < sectionAnalysis.length; i++) {
    const current = sectionAnalysis[i];
    const previous = sectionAnalysis[i - 1];

    // If the previous section teaches skills that are prerequisites for this section
    const chainedSkills = current.requiredSkills.filter((s) =>
      previous.taughtSkills.includes(s)
    );

    if (chainedSkills.length > 0 && previous.gapCount > 0) {
      // Learners who struggled in the previous section will cascade
      const cascadeLearners = previous.learnerStatuses
        .filter((s) => s.readiness === "gap" || s.readiness === "partial")
        .map((s) => s.learnerName);

      if (cascadeLearners.length > 0) {
        cascadeRisks.push({
          upstreamSection: previous.sectionIndex,
          upstreamTitle: previous.sectionTitle,
          downstreamSection: current.sectionIndex,
          downstreamTitle: current.sectionTitle,
          affectedLearners: cascadeLearners,
          chainedSkills,
          description: `If "${previous.sectionTitle}" doesn't land for ${cascadeLearners.join(", ")}, they will also struggle with "${current.sectionTitle}" because it depends on skills taught in the previous section: ${chainedSkills.join(", ")}.`,
        });
      }
    }
  }

  // 9. Generate pivot suggestions for each friction point
  const pivotSuggestions: PivotSuggestion[] = [];
  for (const friction of frictionPoints) {
    pivotSuggestions.push(...generatePivots(friction, graph, learners));
  }

  // 10. Calculate overall plan confidence
  let totalReady = 0;
  let totalPairs = 0;
  for (const section of sectionAnalysis) {
    if (section.requiredSkills.length > 0) {
      totalReady += section.readyCount;
      totalPairs += learners.length;
    }
  }
  const overallConfidence =
    totalPairs > 0
      ? Math.round((totalReady / totalPairs) * 100) / 100
      : 1.0;

  return {
    lessonId,
    lessonTitle,
    groupName,
    domain,
    overallConfidence,
    sectionAnalysis,
    frictionPoints,
    collisionMoments,
    cascadeRisks,
    pivotSuggestions,
  };
}

// ─── MCP Tool Definition ────────────────────────────────────────

export const simulateLessonTool = tool(
  "simulate_lesson",
  "Simulate a lesson plan against a group's learner profiles. Cross-references each timed section's skill requirements against every learner's profile to identify readiness gaps, friction points, collision moments, cascade risks, and pivot suggestions. Returns an annotated simulation with an overall confidence score.",
  {
    lessonId: z
      .string()
      .describe(
        "Lesson plan filename (without .md extension), e.g. '2026-02-12-pandas-groupby-tuesday-cohort'"
      ),
    domain: z.string().describe("Skill domain, e.g. 'python-data-analysis'"),
    groupName: z.string().describe("Group slug, e.g. 'tuesday-cohort'"),
  },
  async ({ lessonId, domain, groupName }) => {
    try {
      const result = await runSimulation(lessonId, domain, groupName);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: message }),
          },
        ],
        isError: true,
      };
    }
  }
);

// Also export the simulation runner for use by the HTTP API
export { runSimulation };
export type { SimulationResult, LearnerSectionStatus, FrictionPoint, CollisionMoment, CascadeRisk, PivotSuggestion };
