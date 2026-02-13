import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

const BLOOM_LEVELS = [
  "knowledge",
  "comprehension",
  "application",
  "analysis",
  "synthesis",
  "evaluation",
] as const;

const BLOOM_ORDER: Record<string, number> = {};
BLOOM_LEVELS.forEach((level, i) => {
  BLOOM_ORDER[level] = i;
});

const SkillSchema = z.object({
  id: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Skill ID must be lowercase kebab-case (e.g. 'plant-identification')"
    ),
  label: z.string().min(5, "Label must be at least 5 characters"),
  bloom_level: z.enum(BLOOM_LEVELS),
  assessable: z.boolean().default(true),
  dependencies: z.array(z.string()).default([]),
});

const EdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  confidence: z.number().min(0.1).max(1.0),
  type: z.enum(["prerequisite", "corequisite", "recommended"]).default("prerequisite"),
});

type Skill = z.infer<typeof SkillSchema>;
type Edge = z.infer<typeof EdgeSchema>;

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Detect circular dependencies using DFS */
function detectCycles(skills: Skill[], edges: Edge[]): string[][] {
  const cycles: string[][] = [];
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source)!.push(edge.target);
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  for (const s of skills) {
    color.set(s.id, WHITE);
    parent.set(s.id, null);
  }

  function dfs(u: string, path: string[]) {
    color.set(u, GRAY);
    for (const v of adjacency.get(u) ?? []) {
      if (color.get(v) === GRAY) {
        // Found a cycle — extract it
        const cycleStart = path.indexOf(v);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), v]);
        } else {
          cycles.push([...path, v]);
        }
      } else if (color.get(v) === WHITE) {
        dfs(v, [...path, v]);
      }
    }
    color.set(u, BLACK);
  }

  for (const s of skills) {
    if (color.get(s.id) === WHITE) {
      dfs(s.id, [s.id]);
    }
  }
  return cycles;
}

/** Find orphan skills (no incoming or outgoing edges) */
function findOrphans(skills: Skill[], edges: Edge[]): string[] {
  const connected = new Set<string>();
  for (const e of edges) {
    connected.add(e.source);
    connected.add(e.target);
  }
  return skills.filter((s) => !connected.has(s.id)).map((s) => s.id);
}

/** Find unreachable nodes (no path from any root skill) */
function findUnreachable(skills: Skill[], edges: Edge[]): string[] {
  // Root skills = those with no incoming prerequisite edges
  const hasIncoming = new Set<string>();
  for (const e of edges) {
    if (e.type === "prerequisite") {
      hasIncoming.add(e.target);
    }
  }
  const roots = skills.filter((s) => !hasIncoming.has(s.id)).map((s) => s.id);

  // BFS from roots through forward edges
  const reachable = new Set<string>(roots);
  const queue = [...roots];
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    adjacency.get(e.source)!.push(e.target);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of adjacency.get(current) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }

  return skills.filter((s) => !reachable.has(s.id)).map((s) => s.id);
}

/** Check Bloom's progression — dependencies should generally be at equal or lower Bloom's level */
function checkBloomProgression(skills: Skill[], edges: Edge[]): string[] {
  const warnings: string[] = [];
  const skillMap = new Map<string, Skill>();
  for (const s of skills) skillMap.set(s.id, s);

  for (const edge of edges) {
    if (edge.type !== "prerequisite") continue;
    const source = skillMap.get(edge.source);
    const target = skillMap.get(edge.target);
    if (!source || !target) continue;

    const sourceLevel = BLOOM_ORDER[source.bloom_level] ?? 0;
    const targetLevel = BLOOM_ORDER[target.bloom_level] ?? 0;

    if (sourceLevel > targetLevel) {
      warnings.push(
        `Bloom's regression: "${source.id}" (${source.bloom_level}) is a prerequisite for "${target.id}" (${target.bloom_level}), but the prerequisite has a HIGHER Bloom's level`
      );
    }
  }
  return warnings;
}

/** Check if graph is too flat (all skills at same Bloom's level) */
function checkFlatness(skills: Skill[]): string | null {
  const levels = new Set(skills.map((s) => s.bloom_level));
  if (levels.size === 1) {
    return `Graph is flat: all ${skills.length} skills are at "${[...levels][0]}" level. A well-structured domain should span multiple Bloom's levels.`;
  }
  if (levels.size === 2 && skills.length > 10) {
    return `Graph uses only ${levels.size} Bloom's levels (${[...levels].join(", ")}) across ${skills.length} skills. Consider adding more depth.`;
  }
  return null;
}

/** Full validation of a domain graph */
export function validateDomain(skills: Skill[], edges: Edge[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check skill IDs are unique
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    errors.push(`Duplicate skill IDs: ${[...new Set(dupes)].join(", ")}`);
  }

  // Check all edge references exist
  const idSet = new Set(ids);
  for (const edge of edges) {
    if (!idSet.has(edge.source)) {
      errors.push(`Edge references unknown source skill: "${edge.source}"`);
    }
    if (!idSet.has(edge.target)) {
      errors.push(`Edge references unknown target skill: "${edge.target}"`);
    }
  }

  // Check for self-loops
  for (const edge of edges) {
    if (edge.source === edge.target) {
      errors.push(`Self-loop: "${edge.source}" depends on itself`);
    }
  }

  // Check for circular dependencies
  const cycles = detectCycles(skills, edges);
  for (const cycle of cycles) {
    errors.push(`Circular dependency: ${cycle.join(" → ")}`);
  }

  // Check for duplicate edges
  const edgeKeys = new Set<string>();
  for (const edge of edges) {
    const key = `${edge.source}→${edge.target}`;
    if (edgeKeys.has(key)) {
      warnings.push(`Duplicate edge: ${key}`);
    }
    edgeKeys.add(key);
  }

  // Warnings: orphans, unreachable, Bloom's, flatness
  const orphans = findOrphans(skills, edges);
  if (orphans.length > 0) {
    warnings.push(
      `Orphan skills (no connections): ${orphans.join(", ")}. Consider adding dependencies.`
    );
  }

  if (errors.length === 0) {
    const unreachable = findUnreachable(skills, edges);
    if (unreachable.length > 0) {
      warnings.push(
        `Unreachable skills (no path from roots): ${unreachable.join(", ")}`
      );
    }
  }

  const bloomWarnings = checkBloomProgression(skills, edges);
  warnings.push(...bloomWarnings);

  const flatWarning = checkFlatness(skills);
  if (flatWarning) warnings.push(flatWarning);

  // Check skill dependencies match edges
  for (const skill of skills) {
    for (const dep of skill.dependencies) {
      if (!idSet.has(dep)) {
        errors.push(
          `Skill "${skill.id}" lists unknown dependency "${dep}"`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export const createDomainTool = tool(
  "create_domain",
  "Create a new skill domain with skills and dependency edges. Validates the graph for circular dependencies, Bloom's level progression, orphan skills, and unreachable nodes. Writes skills.json and dependencies.json to data/domains/{domain}/.",
  {
    domain: z
      .string()
      .regex(
        /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
        "Domain name must be lowercase kebab-case"
      )
      .describe("Domain identifier (e.g. 'outdoor-ecology')"),
    description: z
      .string()
      .describe("Human-readable description of this skill domain"),
    skills: z
      .array(SkillSchema)
      .min(3, "Domain must have at least 3 skills")
      .describe("Array of skill objects with id, label, bloom_level, assessable, dependencies"),
    edges: z
      .array(EdgeSchema)
      .min(2, "Domain must have at least 2 dependency edges")
      .describe("Array of dependency edges with source, target, confidence, type"),
    overwrite: z
      .boolean()
      .default(false)
      .describe("If true, overwrite an existing domain. Default false."),
  },
  async ({ domain, description, skills, edges, overwrite }) => {
    // Validate the graph
    const validation = validateDomain(skills, edges);

    if (!validation.valid) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                domain,
                errors: validation.errors,
                warnings: validation.warnings,
                message:
                  "Domain graph has errors that must be fixed before saving. Review the errors and resubmit.",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    // Check if domain already exists
    const domainDir = path.join(DATA_DIR, "domains", domain);
    try {
      await fs.access(domainDir);
      if (!overwrite) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: false,
                  domain,
                  error: `Domain "${domain}" already exists. Set overwrite: true to replace it.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch {
      // Domain doesn't exist yet — good
    }

    // Ensure directory exists
    await fs.mkdir(domainDir, { recursive: true });

    // Build skills.json
    const skillsData = {
      domain,
      version: "1.0.0",
      description,
      skills: skills.map((s) => ({
        id: s.id,
        label: s.label,
        bloom_level: s.bloom_level,
        assessable: s.assessable,
        dependencies: s.dependencies,
      })),
    };

    // Build dependencies.json
    const depsData = {
      domain,
      version: "1.0.0",
      description: `Directed dependency edges between ${domain} skills. Source is the prerequisite; target is the dependent skill.`,
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
        confidence: e.confidence,
        type: e.type,
      })),
    };

    // Write files
    await Promise.all([
      fs.writeFile(
        path.join(domainDir, "skills.json"),
        JSON.stringify(skillsData, null, 2) + "\n"
      ),
      fs.writeFile(
        path.join(domainDir, "dependencies.json"),
        JSON.stringify(depsData, null, 2) + "\n"
      ),
    ]);

    // Compute summary stats
    const bloomDist: Record<string, number> = {};
    for (const s of skills) {
      bloomDist[s.bloom_level] = (bloomDist[s.bloom_level] || 0) + 1;
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              domain,
              path: `data/domains/${domain}/`,
              stats: {
                totalSkills: skills.length,
                totalEdges: edges.length,
                bloomDistribution: bloomDist,
                rootSkills: skills
                  .filter(
                    (s) =>
                      !edges.some(
                        (e) => e.target === s.id && e.type === "prerequisite"
                      )
                  )
                  .map((s) => s.id),
                leafSkills: skills
                  .filter(
                    (s) =>
                      !edges.some(
                        (e) => e.source === s.id && e.type === "prerequisite"
                      )
                  )
                  .map((s) => s.id),
              },
              warnings: validation.warnings,
              message: `Domain "${domain}" created successfully with ${skills.length} skills and ${edges.length} edges.`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
