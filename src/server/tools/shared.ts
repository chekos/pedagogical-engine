import fs from "fs/promises";
import path from "path";

export const AGENT_WORKSPACE = process.env.AGENT_WORKSPACE || "./agent-workspace";
export const DATA_DIR = process.env.DATA_DIR || `${AGENT_WORKSPACE}/data`;

// Re-export BLOOM_ORDER from domain-utils for convenience
export { BLOOM_ORDER } from "./domain-utils.js";

// ─── Core Types ──────────────────────────────────────────────

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

export interface SkillEntry {
  skillId: string;
  confidence: number;
  bloomLevel: string;
  source: "assessed" | "inferred";
}

export interface LearnerProfile {
  name: string;
  group: string;
  domain: string;
  skills: SkillEntry[];
  affective: {
    confidence: string;
    socialDynamics: string;
  } | null;
}

export interface GroupLearner {
  id: string;
  name: string;
  content: string;
  profile: LearnerProfile;
}

// ─── Teaching Wisdom Types ───────────────────────────────────

export interface TeachingNote {
  id: string;
  skillId: string;
  type: string;
  observation: string;
  confidence: number;
  sessionCount: number;
  confirmedIn: string[];
  context: Record<string, unknown>;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeachingPattern {
  id: string;
  type: string;
  title: string;
  description: string;
  affectedSkills: string[];
  confidence: number;
  sessionCount: number;
  recommendation: string;
  createdAt: string;
}

export interface TeachingNotesData {
  domain: string;
  version: string;
  sessionCount: number;
  lastUpdated: string;
  notes: TeachingNote[];
  patterns: TeachingPattern[];
}

// ─── Tool Response Helper ────────────────────────────────────

/** Standardized MCP tool response. All tools should use this instead of manual object construction. */
export function toolResponse(payload: unknown, isError = false) {
  const result: {
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  } = {
    content: [
      { type: "text" as const, text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) },
    ],
  };
  if (isError) result.isError = true;
  return result;
}

// ─── Path Safety ─────────────────────────────────────────────

/** Resolve a path and verify it stays within the expected base directory */
export function safePath(baseDir: string, ...segments: string[]): string {
  const resolved = path.resolve(baseDir, ...segments);
  const resolvedBase = path.resolve(baseDir);
  if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
    throw new Error(`Path traversal detected: ${segments.join("/")}`);
  }
  return resolved;
}

// ─── Graph Loading ───────────────────────────────────────────

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

// ─── Learner Profile Parsing ─────────────────────────────────

/** Parse a learner profile markdown file into structured data.
 *  This is the canonical parser — all tools should use this instead of local regex. */
export function parseLearnerProfile(content: string): LearnerProfile {
  const nameMatch = content.match(/# Learner Profile: (.+)/);
  const name = nameMatch ? nameMatch[1].trim() : "Unknown";

  const groupMatch = content.match(/\| \*\*Group\*\* \| (.+?) \|/);
  const group = groupMatch ? groupMatch[1].trim() : "";

  const domainMatch = content.match(/\| \*\*Domain\*\* \| (.+?) \|/);
  const domain = domainMatch ? domainMatch[1].trim() : "";

  const skills: SkillEntry[] = [];

  // Parse assessed skills section
  const assessedSection = content.split("## Assessed Skills")[1]?.split("##")[0] ?? "";
  for (const line of assessedSection.split("\n")) {
    const match = line.match(/^- (.+?):\s*([\d.]+)\s*confidence.*?(?:at\s+(\w+)\s+level)?/i);
    if (match) {
      skills.push({
        skillId: match[1].trim(),
        confidence: parseFloat(match[2]),
        bloomLevel: match[3] ?? "unknown",
        source: "assessed",
      });
    }
  }

  // Parse inferred skills section
  const inferredSection = content.split("## Inferred Skills")[1]?.split("##")[0] ?? "";
  for (const line of inferredSection.split("\n")) {
    const match = line.match(/^- (.+?):\s*([\d.]+)\s*confidence/i);
    if (match) {
      skills.push({
        skillId: match[1].trim(),
        confidence: parseFloat(match[2]),
        bloomLevel: "inferred",
        source: "inferred",
      });
    }
  }

  // Parse affective profile if present
  let affective: LearnerProfile["affective"] = null;
  if (content.includes("## Affective Profile")) {
    const section = content.split("## Affective Profile")[1]?.split(/\n## /)[0] ?? "";
    const confMatch = section.match(/\*\*Confidence:\*\*\s*(.+?)(?=\n|$)/);
    const socialMatch = section.match(/\*\*Social dynamics:\*\*\s*(.+?)(?=\n-\s*\*\*|$)/s);
    affective = {
      confidence: confMatch ? confMatch[1].trim() : "",
      socialDynamics: socialMatch ? socialMatch[1].trim() : "",
    };
  }

  return { name, group, domain, skills, affective };
}

// ─── Group Loading ───────────────────────────────────────────

/** Load all learner profiles belonging to a group. Scans the learners directory. */
export async function loadGroupLearners(groupName: string): Promise<GroupLearner[]> {
  const learnersDir = path.join(DATA_DIR, "learners");
  const learners: GroupLearner[] = [];

  let files: string[];
  try {
    files = await fs.readdir(learnersDir);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "ENOENT") return [];
    throw err;
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const content = await fs.readFile(path.join(learnersDir, file), "utf-8");
    if (!content.includes(`| **Group** | ${groupName} |`)) continue;

    const profile = parseLearnerProfile(content);
    learners.push({
      id: file.replace(".md", ""),
      name: profile.name,
      content,
      profile,
    });
  }

  return learners;
}

/** Parse group members from a group markdown file */
export function parseGroupMembers(content: string): Array<{ id: string; name: string }> {
  const members: Array<{ id: string; name: string }> = [];
  const memberRegex = /- (.+?) \(`([^)]+)`\)/g;
  let match;
  while ((match = memberRegex.exec(content)) !== null) {
    members.push({ id: match[2], name: match[1] });
  }
  return members;
}
