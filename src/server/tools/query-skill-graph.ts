import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { loadGraph, type Skill, type SkillGraph } from "./shared.js";

/** BFS to find all prerequisites of a skill (traverse edges backwards) */
function findPrerequisites(
  graph: SkillGraph,
  skillId: string
): Array<{ id: string; confidence: number; depth: number }> {
  const result: Array<{ id: string; confidence: number; depth: number }> = [];
  const visited = new Set<string>();
  const queue: Array<{ id: string; confidence: number; depth: number }> = [
    { id: skillId, confidence: 1.0, depth: 0 },
  ];

  visited.add(skillId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    // Find all edges where this skill is the target (i.e., its prerequisites)
    const prereqEdges = graph.edges.filter((e) => e.target === current.id);

    for (const edge of prereqEdges) {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        const conf = current.confidence * edge.confidence;
        const entry = {
          id: edge.source,
          confidence: Math.round(conf * 100) / 100,
          depth: current.depth + 1,
        };
        result.push(entry);
        queue.push(entry);
      }
    }
  }

  return result;
}

/**
 * Given that a learner has demonstrated a skill, infer which prerequisite
 * skills they likely know, with confidence decay for multi-hop inference.
 * Uses max-confidence path when multiple paths exist.
 */
function inferFromDemonstration(
  graph: SkillGraph,
  skillId: string
): Array<{ id: string; confidence: number; path: string[] }> {
  const bestConfidence = new Map<string, number>();
  const bestPath = new Map<string, string[]>();

  // BFS backwards through dependency edges
  const queue: Array<{
    id: string;
    confidence: number;
    path: string[];
  }> = [];

  // Start from the demonstrated skill — find its prerequisites
  const directPrereqs = graph.edges.filter((e) => e.target === skillId);
  for (const edge of directPrereqs) {
    const conf = edge.confidence;
    queue.push({
      id: edge.source,
      confidence: conf,
      path: [skillId, edge.source],
    });
    bestConfidence.set(edge.source, conf);
    bestPath.set(edge.source, [skillId, edge.source]);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const prereqEdges = graph.edges.filter((e) => e.target === current.id);

    for (const edge of prereqEdges) {
      const newConf =
        Math.round(current.confidence * edge.confidence * 100) / 100;
      const existing = bestConfidence.get(edge.source) ?? 0;

      if (newConf > existing) {
        bestConfidence.set(edge.source, newConf);
        const newPath = [...current.path, edge.source];
        bestPath.set(edge.source, newPath);
        queue.push({ id: edge.source, confidence: newConf, path: newPath });
      }
    }
  }

  const result: Array<{ id: string; confidence: number; path: string[] }> = [];
  for (const [id, confidence] of bestConfidence.entries()) {
    result.push({ id, confidence, path: bestPath.get(id)! });
  }

  // Sort by confidence descending
  result.sort((a, b) => b.confidence - a.confidence);
  return result;
}

function listByLevel(
  graph: SkillGraph,
  bloomLevel: string
): Skill[] {
  return graph.skills.filter(
    (s) => s.bloom_level.toLowerCase() === bloomLevel.toLowerCase()
  );
}

export const querySkillGraphTool = tool(
  "query_skill_graph",
  "Query the skill dependency graph for a domain. Can find prerequisites, infer skills from demonstrated ability, list skills by Bloom's level, or return the full graph.",
  {
    domain: z.string().describe("Skill domain, e.g. 'python-data-analysis'"),
    operation: z
      .enum(["prerequisites", "infer_from", "list_by_level", "full_graph"])
      .describe("The graph operation to perform"),
    skillId: z
      .string()
      .optional()
      .describe("Skill ID (required for prerequisites and infer_from)"),
    bloomLevel: z
      .string()
      .optional()
      .describe(
        "Bloom's level (required for list_by_level): knowledge, comprehension, application, analysis, synthesis, evaluation"
      ),
  },
  async ({ domain, operation, skillId, bloomLevel }) => {
    const graph = await loadGraph(domain);

    switch (operation) {
      case "prerequisites": {
        if (!skillId) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "skillId is required for prerequisites operation" }),
              },
            ],
            isError: true,
          };
        }
        const skill = graph.skills.find((s) => s.id === skillId);
        const prereqs = findPrerequisites(graph, skillId);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  operation: "prerequisites",
                  skill: skill
                    ? { id: skill.id, label: skill.label, bloom_level: skill.bloom_level }
                    : { id: skillId },
                  prerequisites: prereqs.map((p) => {
                    const s = graph.skills.find((sk) => sk.id === p.id);
                    return {
                      id: p.id,
                      label: s?.label ?? p.id,
                      bloom_level: s?.bloom_level,
                      confidence: p.confidence,
                      depth: p.depth,
                    };
                  }),
                  totalPrerequisites: prereqs.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "infer_from": {
        if (!skillId) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "skillId is required for infer_from operation" }),
              },
            ],
            isError: true,
          };
        }
        const skill = graph.skills.find((s) => s.id === skillId);
        const inferred = inferFromDemonstration(graph, skillId);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  operation: "infer_from",
                  demonstratedSkill: skill
                    ? { id: skill.id, label: skill.label, bloom_level: skill.bloom_level }
                    : { id: skillId },
                  inferredSkills: inferred.map((i) => {
                    const s = graph.skills.find((sk) => sk.id === i.id);
                    return {
                      id: i.id,
                      label: s?.label ?? i.id,
                      bloom_level: s?.bloom_level,
                      confidence: i.confidence,
                      path: i.path,
                    };
                  }),
                  totalInferred: inferred.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_by_level": {
        if (!bloomLevel) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "bloomLevel is required for list_by_level operation" }),
              },
            ],
            isError: true,
          };
        }
        const skills = listByLevel(graph, bloomLevel);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  operation: "list_by_level",
                  bloomLevel,
                  skills: skills.map((s) => ({
                    id: s.id,
                    label: s.label,
                    bloom_level: s.bloom_level,
                    dependencies: s.dependencies,
                  })),
                  count: skills.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "full_graph": {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  operation: "full_graph",
                  domain,
                  skills: graph.skills.map((s) => ({
                    id: s.id,
                    label: s.label,
                    bloom_level: s.bloom_level,
                    assessable: s.assessable,
                    dependencies: s.dependencies,
                  })),
                  edges: graph.edges.map((e) => ({
                    source: e.source,
                    target: e.target,
                    confidence: e.confidence,
                    type: e.type,
                  })),
                  totalSkills: graph.skills.length,
                  totalEdges: graph.edges.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  }
);
