import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR } from "./shared.js";

// --- Constants ---

export const BLOOM_LEVELS = [
  "knowledge",
  "comprehension",
  "application",
  "analysis",
  "synthesis",
  "evaluation",
] as const;

export const BLOOM_ORDER: Record<string, number> = {};
BLOOM_LEVELS.forEach((level, i) => {
  BLOOM_ORDER[level] = i;
});

export const DEFAULT_EDGE_CONFIDENCE = 0.85;

export const MAX_SKILLS = 500;
export const MAX_EDGES = 2000;

// --- Schemas ---

export const DomainNameSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    "Domain name must be lowercase kebab-case"
  );

export const SkillSchema = z.object({
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

export const EdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  confidence: z.number().min(0.1).max(1.0),
  type: z.enum(["prerequisite", "corequisite", "recommended"]).default("prerequisite"),
});

export type Skill = z.infer<typeof SkillSchema>;
export type Edge = z.infer<typeof EdgeSchema>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// --- I/O Helpers ---

export function domainDir(domain: string): string {
  return path.join(DATA_DIR, "domains", domain);
}

export async function loadDomain(domain: string) {
  const dir = domainDir(domain);
  const [skillsRaw, depsRaw, manifestRaw] = await Promise.all([
    fs.readFile(path.join(dir, "skills.json"), "utf-8"),
    fs.readFile(path.join(dir, "dependencies.json"), "utf-8"),
    fs.readFile(path.join(dir, "manifest.json"), "utf-8").catch(() => null),
  ]);
  const skillsData = JSON.parse(skillsRaw);
  const depsData = JSON.parse(depsRaw);
  const manifestData = manifestRaw ? JSON.parse(manifestRaw) : null;
  return {
    skillsData,
    depsData,
    manifestData,
    skills: skillsData.skills as Skill[],
    edges: depsData.edges as Edge[],
  };
}

export async function saveDomain(
  domain: string,
  skillsData: Record<string, unknown>,
  depsData: Record<string, unknown>,
  manifestData?: Record<string, unknown>
) {
  const dir = domainDir(domain);
  const writes: Promise<void>[] = [
    fs.writeFile(
      path.join(dir, "skills.json"),
      JSON.stringify(skillsData, null, 2) + "\n"
    ),
    fs.writeFile(
      path.join(dir, "dependencies.json"),
      JSON.stringify(depsData, null, 2) + "\n"
    ),
  ];
  if (manifestData) {
    writes.push(
      fs.writeFile(
        path.join(dir, "manifest.json"),
        JSON.stringify(manifestData, null, 2) + "\n"
      )
    );
  }
  await Promise.all(writes);
}

// --- Graph Validation ---

/** Detect circular dependencies using DFS with stack-based path tracking */
function detectCycles(skills: Skill[], edges: Edge[]): string[][] {
  const cycles: string[][] = [];
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source)!.push(edge.target);
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const s of skills) {
    color.set(s.id, WHITE);
  }

  const pathStack: string[] = [];
  const onStack = new Set<string>();

  function dfs(u: string) {
    color.set(u, GRAY);
    pathStack.push(u);
    onStack.add(u);

    for (const v of adjacency.get(u) ?? []) {
      if (color.get(v) === GRAY && onStack.has(v)) {
        const cycleStart = pathStack.indexOf(v);
        cycles.push([...pathStack.slice(cycleStart), v]);
      } else if (color.get(v) === WHITE) {
        dfs(v);
      }
    }

    pathStack.pop();
    onStack.delete(u);
    color.set(u, BLACK);
  }

  for (const s of skills) {
    if (color.get(s.id) === WHITE) {
      dfs(s.id);
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
  const hasIncoming = new Set<string>();
  for (const e of edges) {
    if (e.type === "prerequisite") {
      hasIncoming.add(e.target);
    }
  }
  const roots = skills.filter((s) => !hasIncoming.has(s.id)).map((s) => s.id);

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

  // Check skill IDs are unique — O(n) with Set
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const s of skills) {
    if (seen.has(s.id)) dupes.push(s.id);
    seen.add(s.id);
  }
  if (dupes.length > 0) {
    errors.push(`Duplicate skill IDs: ${[...new Set(dupes)].join(", ")}`);
  }

  // Check all edge references exist
  const idSet = seen;
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

/** Compute summary stats for a domain — single-pass edge scanning */
export function computeDomainStats(skills: Skill[], edges: Edge[]) {
  const bloomDist: Record<string, number> = {};
  for (const s of skills) {
    bloomDist[s.bloom_level] = (bloomDist[s.bloom_level] || 0) + 1;
  }

  const hasIncoming = new Set<string>();
  const hasOutgoing = new Set<string>();
  for (const e of edges) {
    if (e.type === "prerequisite") {
      hasIncoming.add(e.target);
      hasOutgoing.add(e.source);
    }
  }

  return {
    totalSkills: skills.length,
    totalEdges: edges.length,
    bloomDistribution: bloomDist,
    rootSkills: skills.filter((s) => !hasIncoming.has(s.id)).map((s) => s.id),
    leafSkills: skills.filter((s) => !hasOutgoing.has(s.id)).map((s) => s.id),
  };
}

// --- Manifest Generation ---

export interface ManifestOverrides {
  name?: string;
  tags?: string[];
  audience?: { level?: string; ages?: string; setting?: string };
  icon?: string;
  color?: string;
  author?: string;
  license?: string;
  featured?: boolean;
}

/**
 * Build a manifest.json for a domain.
 * - New domains: generates from overrides + defaults + computed stats.
 * - Existing manifests: preserves all fields, refreshes stats + updatedAt.
 */
export function buildManifest(
  domain: string,
  description: string,
  skills: Skill[],
  edges: Edge[],
  overrides: ManifestOverrides = {},
  existingManifest?: Record<string, unknown>
): Record<string, unknown> {
  const bloomLevels = new Set(skills.map((s) => s.bloom_level)).size;
  const now = new Date().toISOString();

  // Updating an existing manifest — preserve fields, refresh stats
  if (existingManifest && Object.keys(existingManifest).length > 0) {
    return {
      ...existingManifest,
      stats: {
        skills: skills.length,
        dependencies: edges.length,
        bloomLevels,
      },
      updatedAt: now,
    };
  }

  // New manifest — apply defaults then overrides
  const defaultName = domain
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    name: overrides.name || defaultName,
    slug: domain,
    version: "1.0.0",
    description,
    author: overrides.author || "Pedagogical Engine Team",
    license: overrides.license || "MIT",
    tags: overrides.tags || [],
    audience: overrides.audience || null,
    stats: {
      skills: skills.length,
      dependencies: edges.length,
      bloomLevels,
    },
    icon: overrides.icon || "book",
    color: overrides.color || "#6366f1",
    featured: overrides.featured ?? false,
    createdAt: now,
    updatedAt: now,
  };
}
