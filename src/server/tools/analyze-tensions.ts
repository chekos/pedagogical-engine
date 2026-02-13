import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { loadGraph, type SkillGraph } from "./shared.js";
import { BLOOM_ORDER } from "./domain-utils.js";

const DATA_DIR = process.env.DATA_DIR || "./data";

// ─── Types ───────────────────────────────────────────────────────

interface Tension {
  type:
    | "dependency_ordering"
    | "scope_time_mismatch"
    | "prerequisite_gap"
    | "bloom_level_mismatch"
    | "constraint_violation";
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  evidence: Record<string, unknown>;
  suggestion: string;
}

interface LearnerSkillMap {
  name: string;
  id: string;
  skills: Map<string, number>;
}

// ─── Helpers ─────────────────────────────────────────────────────

function parseLearnerSkillsFromContent(content: string): Map<string, number> {
  const skills = new Map<string, number>();
  for (const section of ["## Assessed Skills", "## Inferred Skills"]) {
    const sectionContent = content.split(section)[1]?.split("##")[0] ?? "";
    for (const line of sectionContent.split("\n")) {
      const match = line.match(/^- (.+?):\s*([\d.]+)\s*confidence/i);
      if (match) {
        const existing = skills.get(match[1].trim()) ?? 0;
        skills.set(match[1].trim(), Math.max(existing, parseFloat(match[2])));
      }
    }
  }
  return skills;
}

async function loadGroupLearners(groupName: string): Promise<LearnerSkillMap[]> {
  const learnersDir = path.join(DATA_DIR, "learners");
  const learners: LearnerSkillMap[] = [];
  try {
    const files = await fs.readdir(learnersDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await fs.readFile(path.join(learnersDir, file), "utf-8");
      if (!content.includes(`| **Group** | ${groupName} |`)) continue;
      const nameMatch = content.match(/# Learner Profile: (.+)/);
      learners.push({
        name: nameMatch ? nameMatch[1] : file.replace(".md", ""),
        id: file.replace(".md", ""),
        skills: parseLearnerSkillsFromContent(content),
      });
    }
  } catch {
    // No learner files
  }
  return learners;
}

/** Check if teaching skills in the given sequence violates dependency ordering */
function checkDependencyOrdering(
  graph: SkillGraph,
  intendedSequence: string[]
): Tension[] {
  const tensions: Tension[] = [];
  const edgeMap = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    if (edge.type !== "prerequisite") continue;
    if (!edgeMap.has(edge.target)) edgeMap.set(edge.target, new Set());
    edgeMap.get(edge.target)!.add(edge.source);
  }

  for (let i = 0; i < intendedSequence.length; i++) {
    const skill = intendedSequence[i];
    const prereqs = edgeMap.get(skill);
    if (!prereqs) continue;

    for (const prereq of prereqs) {
      const prereqIndex = intendedSequence.indexOf(prereq);
      // Prereq appears AFTER the skill that depends on it
      if (prereqIndex > i) {
        const skillDef = graph.skills.find((s) => s.id === skill);
        const prereqDef = graph.skills.find((s) => s.id === prereq);
        tensions.push({
          type: "dependency_ordering",
          severity: "critical",
          title: `"${skillDef?.label ?? skill}" taught before its prerequisite`,
          detail: `You plan to cover "${skillDef?.label ?? skill}" before "${prereqDef?.label ?? prereq}", but the dependency graph shows that ${prereq} is a prerequisite for ${skill}. Students will encounter ${skill} without the foundation that ${prereq} provides.`,
          evidence: {
            skill,
            skillLabel: skillDef?.label,
            prerequisite: prereq,
            prereqLabel: prereqDef?.label,
            skillPosition: i + 1,
            prereqPosition: prereqIndex + 1,
          },
          suggestion: `Move "${prereqDef?.label ?? prereq}" before "${skillDef?.label ?? skill}" in your sequence, or add a brief review of ${prereq} concepts before introducing ${skill}.`,
        });
      }
    }
  }
  return tensions;
}

/** Estimate realistic pacing based on Bloom's level complexity */
function estimateMinutesPerSkill(bloomLevel: string, groupReadiness: number): number {
  // Base minutes by Bloom's level (higher = more time needed)
  const baseMinutes: Record<string, number> = {
    knowledge: 5,
    comprehension: 10,
    application: 15,
    analysis: 20,
    synthesis: 30,
    evaluation: 25,
  };
  const base = baseMinutes[bloomLevel] ?? 15;
  // Lower group readiness = more time needed (readiness 0-1 scale)
  const readinessMultiplier = 1 + (1 - groupReadiness) * 0.5;
  return Math.round(base * readinessMultiplier);
}

function checkScopeTimeMismatch(
  graph: SkillGraph,
  targetSkills: string[],
  durationMinutes: number,
  learners: LearnerSkillMap[]
): Tension[] {
  const tensions: Tension[] = [];

  // Calculate average group readiness for each target skill
  let totalEstimatedMinutes = 0;
  const skillTimes: Array<{ skill: string; label: string; bloom: string; minutes: number }> = [];

  for (const skillId of targetSkills) {
    const skillDef = graph.skills.find((s) => s.id === skillId);
    if (!skillDef) continue;

    // Measure group readiness: what fraction of learners have the skill's prerequisites?
    let readinessSum = 0;
    for (const learner of learners) {
      const conf = learner.skills.get(skillId) ?? 0;
      readinessSum += conf;
    }
    const avgReadiness = learners.length > 0 ? readinessSum / learners.length : 0.5;

    const minutes = estimateMinutesPerSkill(skillDef.bloom_level, avgReadiness);
    totalEstimatedMinutes += minutes;
    skillTimes.push({
      skill: skillId,
      label: skillDef.label,
      bloom: skillDef.bloom_level,
      minutes,
    });
  }

  // Add 10 minutes for setup/intro and 5 for wrap-up
  const overhead = 15;
  totalEstimatedMinutes += overhead;

  if (totalEstimatedMinutes > durationMinutes) {
    const overBy = totalEstimatedMinutes - durationMinutes;
    const overPercentage = Math.round((overBy / durationMinutes) * 100);

    // Suggest which skills to cut (lowest priority = highest Bloom's level or already-known)
    const sortedByPriority = [...skillTimes].sort((a, b) => {
      // Prioritize cutting skills that are already well-known or highest Bloom's level
      const aOrder = BLOOM_ORDER[a.bloom] ?? 3;
      const bOrder = BLOOM_ORDER[b.bloom] ?? 3;
      return bOrder - aOrder; // Higher Bloom's first (cut those)
    });

    let minutesToCut = overBy;
    const suggestedCuts: string[] = [];
    for (const s of sortedByPriority) {
      if (minutesToCut <= 0) break;
      suggestedCuts.push(`"${s.label}" (~${s.minutes} min, ${s.bloom} level)`);
      minutesToCut -= s.minutes;
    }

    tensions.push({
      type: "scope_time_mismatch",
      severity: overPercentage > 30 ? "critical" : "warning",
      title: `${targetSkills.length} skills in ${durationMinutes} minutes is ${overPercentage}% over capacity`,
      detail: `Estimated time needed: ~${totalEstimatedMinutes} minutes (including ${overhead} min overhead). You have ${durationMinutes} minutes. This estimate accounts for Bloom's level complexity and the group's current readiness.`,
      evidence: {
        estimatedMinutes: totalEstimatedMinutes,
        availableMinutes: durationMinutes,
        overByMinutes: overBy,
        overPercentage,
        skillBreakdown: skillTimes,
      },
      suggestion: `Consider deferring: ${suggestedCuts.join(", ")}. This would bring the session within your time budget. Alternatively, convert some skills to "quick reference" handouts rather than teaching them live.`,
    });
  }

  return tensions;
}

function checkPrerequisiteGaps(
  graph: SkillGraph,
  targetSkills: string[],
  learners: LearnerSkillMap[]
): Tension[] {
  const tensions: Tension[] = [];

  // Find all prerequisites for target skills
  const allPrereqs = new Set<string>();
  const queue = [...targetSkills];
  const visited = new Set<string>(targetSkills);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of graph.edges) {
      if (edge.target === current && edge.type === "prerequisite") {
        allPrereqs.add(edge.source);
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push(edge.source);
        }
      }
    }
  }

  // For each prerequisite, check how many learners are missing it
  for (const prereq of allPrereqs) {
    // Skip if this prereq is also a target skill (it'll be taught)
    if (targetSkills.includes(prereq)) continue;

    const prereqDef = graph.skills.find((s) => s.id === prereq);
    const missing: string[] = [];
    const weak: Array<{ name: string; confidence: number }> = [];

    for (const learner of learners) {
      const conf = learner.skills.get(prereq);
      if (conf === undefined) {
        missing.push(learner.name);
      } else if (conf < 0.5) {
        weak.push({ name: learner.name, confidence: conf });
      }
    }

    const atRisk = missing.length + weak.length;
    if (atRisk === 0) continue;

    const atRiskPct = Math.round((atRisk / learners.length) * 100);

    // Which target skills depend on this prereq?
    const affectedTargets = targetSkills.filter((t) => {
      // BFS from prereq to see if it reaches this target
      const q = [prereq];
      const v = new Set([prereq]);
      while (q.length > 0) {
        const c = q.shift()!;
        for (const edge of graph.edges) {
          if (edge.source === c && edge.type === "prerequisite") {
            if (edge.target === t) return true;
            if (!v.has(edge.target)) {
              v.add(edge.target);
              q.push(edge.target);
            }
          }
        }
      }
      return false;
    });

    if (atRiskPct >= 40) {
      tensions.push({
        type: "prerequisite_gap",
        severity: atRiskPct >= 60 ? "critical" : "warning",
        title: `${atRisk} of ${learners.length} learners lack "${prereqDef?.label ?? prereq}"`,
        detail: `${missing.length > 0 ? `Not assessed: ${missing.join(", ")}. ` : ""}${weak.length > 0 ? `Low confidence: ${weak.map((w) => `${w.name} (${w.confidence})`).join(", ")}. ` : ""}This prerequisite feeds into: ${affectedTargets.map((t) => graph.skills.find((s) => s.id === t)?.label ?? t).join(", ")}.`,
        evidence: {
          prerequisite: prereq,
          prereqLabel: prereqDef?.label,
          missing,
          weak,
          atRisk,
          atRiskPercentage: atRiskPct,
          affectedTargets,
        },
        suggestion:
          atRiskPct >= 60
            ? `Assess "${prereqDef?.label ?? prereq}" before the session, or add a 10-15 minute prerequisite review at the start. Without this foundation, ${affectedTargets.length} of your planned topics will be built on shaky ground.`
            : `Consider a quick (5 min) check-in on "${prereqDef?.label ?? prereq}" at session start. Pair at-risk learners with someone strong in this area.`,
      });
    }
  }

  return tensions;
}

function checkBloomLevelMismatch(
  graph: SkillGraph,
  targetSkills: string[],
  learners: LearnerSkillMap[]
): Tension[] {
  const tensions: Tension[] = [];

  for (const skillId of targetSkills) {
    const skillDef = graph.skills.find((s) => s.id === skillId);
    if (!skillDef) continue;

    const targetBloom = BLOOM_ORDER[skillDef.bloom_level] ?? 0;
    if (targetBloom < 4) continue; // Only flag synthesis (4) and evaluation (5) level skills

    // Check group's demonstrated Bloom's level
    // Find the highest confirmed Bloom's level for each learner (based on their assessed skills)
    const learnerMaxBlooms: number[] = [];
    for (const learner of learners) {
      let maxBloom = 0;
      for (const [sid, conf] of learner.skills) {
        if (conf >= 0.6) {
          const sDef = graph.skills.find((s) => s.id === sid);
          if (sDef) {
            maxBloom = Math.max(maxBloom, BLOOM_ORDER[sDef.bloom_level] ?? 0);
          }
        }
      }
      learnerMaxBlooms.push(maxBloom);
    }

    const avgMaxBloom = learnerMaxBlooms.length > 0
      ? learnerMaxBlooms.reduce((a, b) => a + b, 0) / learnerMaxBlooms.length
      : 0;

    const bloomGap = targetBloom - avgMaxBloom;

    if (bloomGap >= 2) {
      const bloomNames = Object.entries(BLOOM_ORDER)
        .sort(([, a], [, b]) => a - b)
        .map(([name]) => name);

      const avgLevelName = bloomNames[Math.round(avgMaxBloom)] ?? "knowledge";

      const learnersBelow = learnerMaxBlooms.filter((b) => b < targetBloom - 1).length;
      const belowPct = Math.round((learnersBelow / learners.length) * 100);

      tensions.push({
        type: "bloom_level_mismatch",
        severity: bloomGap >= 3 ? "critical" : "warning",
        title: `"${skillDef.label}" requires ${skillDef.bloom_level} level — group is mostly at ${avgLevelName}`,
        detail: `This skill is at Bloom's ${skillDef.bloom_level} level (${targetBloom + 1}/6), but ${belowPct}% of the group has only demonstrated skills up to ${avgLevelName} level. That's a ${bloomGap}-level gap. Students need to build through intermediate levels before they can meaningfully engage with ${skillDef.bloom_level}-level activities.`,
        evidence: {
          skill: skillId,
          skillBloom: skillDef.bloom_level,
          groupAvgBloom: avgLevelName,
          bloomGap,
          learnersBelow,
          belowPercentage: belowPct,
        },
        suggestion: `Add scaffolding activities at the ${bloomNames[targetBloom - 1] ?? "application"} level before attempting ${skillDef.bloom_level}-level work. For example, have students practice ${bloomNames[targetBloom - 1]} tasks first, then build to ${skillDef.bloom_level} in the second half of the session.`,
      });
    }
  }

  return tensions;
}

function checkConstraintViolations(
  graph: SkillGraph,
  targetSkills: string[],
  constraints: Record<string, string | string[] | undefined>
): Tension[] {
  const tensions: Tension[] = [];

  const connectivity = (constraints.connectivity as string) ?? "";
  const setting = (constraints.setting as string) ?? "";
  const tools = (constraints.tools as string[]) ?? [];
  const toolsLower = tools.map((t) => t.toLowerCase());

  for (const skillId of targetSkills) {
    const skillDef = graph.skills.find((s) => s.id === skillId);
    if (!skillDef) continue;

    // Internet-dependent skills in offline settings
    if (
      connectivity.toLowerCase().includes("no internet") ||
      connectivity.toLowerCase().includes("offline")
    ) {
      if (
        skillId.includes("install-packages") ||
        skillId.includes("import-pandas") ||
        skillDef.label.toLowerCase().includes("install")
      ) {
        tensions.push({
          type: "constraint_violation",
          severity: "critical",
          title: `"${skillDef.label}" may require internet — but connectivity is "${connectivity}"`,
          detail: `Installing packages typically requires an internet connection. If packages aren't pre-installed, this activity will fail in an offline environment.`,
          evidence: {
            skill: skillId,
            constraint: "connectivity",
            constraintValue: connectivity,
          },
          suggestion: `Ensure all required packages (pandas, matplotlib, etc.) are pre-installed on student machines before the session. Include this in the prerequisites checklist.`,
        });
      }
    }

    // Tool requirements
    if (
      (skillId.includes("jupyter") || skillId.includes("use-jupyter")) &&
      toolsLower.length > 0 &&
      !toolsLower.some((t) => t.includes("jupyter"))
    ) {
      tensions.push({
        type: "constraint_violation",
        severity: "warning",
        title: `"${skillDef.label}" requires Jupyter — not listed in available tools`,
        detail: `The available tools are: ${tools.join(", ")}. Jupyter is not explicitly listed. If students don't have Jupyter installed, this skill can't be practiced.`,
        evidence: {
          skill: skillId,
          constraint: "tools",
          required: "Jupyter",
          available: tools,
        },
        suggestion: `Add Jupyter to the prerequisites checklist, or plan a Python-script-based alternative for students without Jupyter.`,
      });
    }

    // Paid subscription requirements
    if (
      skillDef.label.toLowerCase().includes("api") ||
      skillDef.label.toLowerCase().includes("cloud")
    ) {
      tensions.push({
        type: "constraint_violation",
        severity: "info",
        title: `"${skillDef.label}" may require paid accounts or API keys`,
        detail: `This skill involves APIs or cloud services. Verify that all students have the necessary accounts and that no hidden costs (API keys requiring credit cards, etc.) will block participation.`,
        evidence: {
          skill: skillId,
          constraint: "subscriptions",
        },
        suggestion: `List all required accounts/subscriptions in the prerequisites. Provide free-tier alternatives if possible.`,
      });
    }
  }

  // Check duration constraint
  if (setting.toLowerCase().includes("outdoor") || setting.toLowerCase().includes("park")) {
    const techSkills = targetSkills.filter(
      (s) =>
        s.includes("jupyter") ||
        s.includes("pandas") ||
        s.includes("plotting") ||
        s.includes("python")
    );
    if (techSkills.length > 0) {
      tensions.push({
        type: "constraint_violation",
        severity: "warning",
        title: `Computer-based skills planned for an outdoor setting`,
        detail: `${techSkills.length} skills require a computer, but the setting is "${setting}". Consider whether students will have laptops, power, and visibility in an outdoor environment.`,
        evidence: {
          setting,
          techSkills,
        },
        suggestion: `Either bring laptops with sufficient battery, or redesign activities as conceptual/paper-based exercises for the outdoor portion and save hands-on coding for an indoor follow-up.`,
      });
    }
  }

  return tensions;
}

// ─── Main Tool ───────────────────────────────────────────────────

export const analyzeTensionsTool = tool(
  "analyze_pedagogical_tensions",
  "Analyze an educator's lesson intent against the skill graph, learner profiles, and constraints to identify pedagogical tensions — dependency ordering violations, scope-time mismatches, prerequisite gaps, Bloom's level mismatches, and constraint violations. Returns specific, evidence-based concerns with suggested alternatives. Use this BEFORE or DURING lesson composition to enable the engine to push back respectfully on plans that may not serve learners well.",
  {
    domain: z.string().describe("Skill domain slug"),
    groupName: z.string().describe("Group slug"),
    targetSkills: z
      .array(z.string())
      .describe("Skills the educator intends to cover, in intended teaching order"),
    durationMinutes: z
      .number()
      .optional()
      .describe("Session duration in minutes (e.g. 90)"),
    constraints: z
      .object({
        connectivity: z.string().optional().describe("e.g. 'reliable wifi', 'no internet'"),
        setting: z.string().optional().describe("e.g. 'computer lab', 'outdoor park'"),
        tools: z.array(z.string()).optional().describe("Available tools/software"),
      })
      .optional()
      .describe(
        "Lesson constraints from interview (connectivity, setting, tools, etc.)"
      ),
  },
  async ({ domain, groupName, targetSkills, durationMinutes, constraints }) => {
    // Load graph
    let graph: SkillGraph;
    try {
      graph = await loadGraph(domain);
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Domain '${domain}' not found`,
            }),
          },
        ],
        isError: true,
      };
    }

    // Load learner profiles
    const learners = await loadGroupLearners(groupName);

    // Run all tension checks
    const tensions: Tension[] = [];

    // 1. Dependency ordering
    tensions.push(...checkDependencyOrdering(graph, targetSkills));

    // 2. Scope-time mismatch
    if (durationMinutes) {
      tensions.push(
        ...checkScopeTimeMismatch(graph, targetSkills, durationMinutes, learners)
      );
    }

    // 3. Prerequisite gaps
    if (learners.length > 0) {
      tensions.push(
        ...checkPrerequisiteGaps(graph, targetSkills, learners)
      );
    }

    // 4. Bloom's level mismatch
    if (learners.length > 0) {
      tensions.push(
        ...checkBloomLevelMismatch(graph, targetSkills, learners)
      );
    }

    // 5. Constraint violations
    if (constraints) {
      const constraintRecord: Record<string, string | string[] | undefined> = {
        connectivity: constraints.connectivity,
        setting: constraints.setting,
        tools: constraints.tools,
      };
      tensions.push(
        ...checkConstraintViolations(graph, targetSkills, constraintRecord)
      );
    }

    // Sort: critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    tensions.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    // Build summary
    const criticalCount = tensions.filter((t) => t.severity === "critical").length;
    const warningCount = tensions.filter((t) => t.severity === "warning").length;
    const infoCount = tensions.filter((t) => t.severity === "info").length;

    const summary =
      tensions.length === 0
        ? "No pedagogical tensions detected. The plan aligns well with the skill graph, learner profiles, and constraints."
        : `Found ${tensions.length} tension${tensions.length === 1 ? "" : "s"}: ${criticalCount} critical, ${warningCount} warning${warningCount === 1 ? "" : "s"}, ${infoCount} info. ${criticalCount > 0 ? "Critical issues should be addressed before proceeding." : "Review the warnings and consider the suggestions."}`;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              domain,
              group: groupName,
              targetSkills,
              durationMinutes: durationMinutes ?? null,
              tensionCount: tensions.length,
              summary,
              critical: criticalCount,
              warnings: warningCount,
              info: infoCount,
              tensions,
              learnersAnalyzed: learners.length,
              recommendation:
                criticalCount > 0
                  ? "I'd recommend addressing the critical tensions before building this lesson plan. I can do what you're asking, but the data suggests these issues will significantly impact the session's success."
                  : warningCount > 0
                    ? "The plan is workable, but I want to flag some concerns. Here's what I'm seeing in the data — you decide what to adjust."
                    : "The plan looks solid. The skill graph, learner profiles, and constraints all align well with your intent.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
