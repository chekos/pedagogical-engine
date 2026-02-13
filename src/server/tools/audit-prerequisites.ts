import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, loadGroupLearners, toolResponse } from "./shared.js";

export const auditPrerequisitesTool = tool(
  "audit_prerequisites",
  "Cross-reference lesson requirements against group profiles and constraints. Flags skill gaps, missing prerequisites, and logistics needs.",
  {
    domain: z.string().describe("Skill domain"),
    groupName: z.string().describe("Group slug"),
    targetSkills: z
      .array(z.string())
      .describe("Skills the lesson aims to teach"),
    constraints: z
      .object({
        duration: z.string().optional().describe("e.g. '90 minutes'"),
        setting: z.string().optional().describe("e.g. 'computer lab'"),
        tools: z
          .array(z.string())
          .optional()
          .describe("Available tools/software"),
        connectivity: z
          .string()
          .optional()
          .describe("e.g. 'reliable wifi', 'no internet'"),
      })
      .optional()
      .describe("Lesson constraints from interview"),
  },
  async ({ domain, groupName, targetSkills, constraints }) => {
    const domainDir = path.join(DATA_DIR, "domains", domain);

    // Load skill graph
    let skills: Array<{
      id: string;
      label: string;
      bloom_level: string;
      dependencies: string[];
    }>;
    let edges: Array<{
      source: string;
      target: string;
      confidence: number;
    }>;

    try {
      const [skillsRaw, depsRaw] = await Promise.all([
        fs.readFile(path.join(domainDir, "skills.json"), "utf-8"),
        fs.readFile(path.join(domainDir, "dependencies.json"), "utf-8"),
      ]);
      skills = JSON.parse(skillsRaw).skills;
      edges = JSON.parse(depsRaw).edges;
    } catch {
      return toolResponse({ error: `Domain '${domain}' not found` }, true);
    }

    // Find all prerequisites for target skills (BFS)
    const allPrereqs = new Set<string>();
    const queue = [...targetSkills];
    const visited = new Set<string>(targetSkills);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const prereqEdges = edges.filter((e) => e.target === current);
      for (const edge of prereqEdges) {
        allPrereqs.add(edge.source);
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push(edge.source);
        }
      }
    }

    // Load learner profiles for the group
    const learnerGaps: Array<{
      name: string;
      id: string;
      missingPrereqs: string[];
      weakPrereqs: Array<{ skill: string; confidence: number }>;
    }> = [];

    const groupLearners = await loadGroupLearners(groupName);
    for (const gl of groupLearners) {
      // Build skill map from parsed profile (take max confidence across assessed/inferred)
      const learnerSkills = new Map<string, number>();
      for (const s of gl.profile.skills) {
        const existing = learnerSkills.get(s.skillId) ?? 0;
        learnerSkills.set(s.skillId, Math.max(existing, s.confidence));
      }

      const missing: string[] = [];
      const weak: Array<{ skill: string; confidence: number }> = [];

      for (const prereq of allPrereqs) {
        const conf = learnerSkills.get(prereq);
        if (conf === undefined) {
          missing.push(prereq);
        } else if (conf < 0.6) {
          weak.push({ skill: prereq, confidence: conf });
        }
      }

      learnerGaps.push({
        name: gl.name,
        id: gl.id,
        missingPrereqs: missing,
        weakPrereqs: weak,
      });
    }

    // Compute group-level gaps
    const prereqCoverage: Record<
      string,
      { covered: number; total: number; percentage: string }
    > = {};
    for (const prereq of allPrereqs) {
      const covered = learnerGaps.filter(
        (l) =>
          !l.missingPrereqs.includes(prereq) &&
          !l.weakPrereqs.some((w) => w.skill === prereq)
      ).length;
      prereqCoverage[prereq] = {
        covered,
        total: learnerGaps.length,
        percentage:
          learnerGaps.length > 0
            ? `${Math.round((covered / learnerGaps.length) * 100)}%`
            : "N/A",
      };
    }

    // Flag critical gaps (prerequisites where most students are missing)
    const criticalGaps = Object.entries(prereqCoverage)
      .filter(([, v]) => v.total > 0 && v.covered / v.total < 0.5)
      .map(([skillId, v]) => {
        const s = skills.find((sk) => sk.id === skillId);
        return {
          skillId,
          label: s?.label ?? skillId,
          coverage: v.percentage,
          recommendation:
            v.covered === 0
              ? "CRITICAL: No learners have this prerequisite. Add pre-session prep or teach it first."
              : "WARNING: Most learners are missing this. Consider a review segment.",
        };
      });

    // Logistics check
    const logisticsIssues: string[] = [];
    if (constraints) {
      // Check if target skills require tools
      const targetSkillDefs = targetSkills
        .map((id) => skills.find((s) => s.id === id))
        .filter(Boolean);

      if (
        targetSkillDefs.some(
          (s) =>
            s!.id.includes("jupyter") ||
            s!.id.includes("pandas") ||
            s!.id.includes("plotting")
        )
      ) {
        if (
          constraints.tools &&
          !constraints.tools.some(
            (t) =>
              t.toLowerCase().includes("python") ||
              t.toLowerCase().includes("jupyter")
          )
        ) {
          logisticsIssues.push(
            "Target skills require Python/Jupyter but not listed in available tools."
          );
        }
        if (constraints.connectivity === "no internet") {
          logisticsIssues.push(
            "Installing packages may require internet access. Ensure packages are pre-installed."
          );
        }
      }
    }

    return toolResponse({
      domain,
      group: groupName,
      targetSkills,
      prerequisites: [...allPrereqs],
      prerequisiteCount: allPrereqs.size,
      criticalGaps,
      learnerGaps: learnerGaps.map((l) => ({
        name: l.name,
        missingCount: l.missingPrereqs.length,
        weakCount: l.weakPrereqs.length,
        missingPrereqs: l.missingPrereqs,
        weakPrereqs: l.weakPrereqs,
      })),
      prereqCoverage,
      logisticsIssues,
      feasible: criticalGaps.length === 0,
      constraints: constraints ?? {},
    });
  }
);
