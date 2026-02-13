import fs from "fs/promises";
import path from "path";

export const DATA_DIR = process.env.DATA_DIR || "./data";

export interface Skill {
  id: string;
  label: string;
  bloom_level: string;
  assessable: boolean;
  dependencies: string[];
}

export interface Edge {
  source: string;
  target: string;
  confidence: number;
  type: string;
}

export interface SkillGraph {
  skills: Skill[];
  edges: Edge[];
}

/** Resolve a path and verify it stays within the expected base directory */
export function safePath(baseDir: string, ...segments: string[]): string {
  const resolved = path.resolve(baseDir, ...segments);
  const resolvedBase = path.resolve(baseDir);
  if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
    throw new Error(`Path traversal detected: ${segments.join("/")}`);
  }
  return resolved;
}

export async function loadGraph(domain: string): Promise<SkillGraph> {
  const domainDir = safePath(DATA_DIR, "domains", domain);
  const [skillsRaw, depsRaw] = await Promise.all([
    fs.readFile(path.join(domainDir, "skills.json"), "utf-8"),
    fs.readFile(path.join(domainDir, "dependencies.json"), "utf-8"),
  ]);
  const skillsData = JSON.parse(skillsRaw);
  const depsData = JSON.parse(depsRaw);
  return { skills: skillsData.skills, edges: depsData.edges };
}
