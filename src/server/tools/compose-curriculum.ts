import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, loadGraph, safePath, type SkillGraph } from "./shared.js";

interface LearnerSkill {
  id: string;
  confidence: number;
  type: "assessed" | "inferred";
}

interface GroupSkillProfile {
  totalLearners: number;
  skillCoverage: Record<string, { haveIt: number; fraction: number; avgConfidence: number }>;
}

const BLOOM_ORDER = ["knowledge", "comprehension", "application", "analysis", "synthesis", "evaluation"];

async function loadGroupProfile(groupName: string): Promise<{ domain: string; members: string[]; context: string }> {
  const groupPath = safePath(DATA_DIR, "groups", `${groupName}.md`);
  const content = await fs.readFile(groupPath, "utf-8");

  const domainMatch = content.match(/\*\*Domain\*\*\s*\|\s*(.+)/);
  const domain = domainMatch ? domainMatch[1].trim() : "";

  const members: string[] = [];
  const memberRegex = /`([a-z0-9-]+)`\)/g;
  let match;
  while ((match = memberRegex.exec(content)) !== null) {
    members.push(match[1]);
  }

  return { domain, members, context: content };
}

function parseLearnerSkills(content: string): LearnerSkill[] {
  const skills: LearnerSkill[] = [];
  const skillLineRegex = /^- (.+?):\s*([\d.]+)\s*confidence/im;

  // Parse assessed skills section
  const assessedSection = content.split("## Assessed Skills")[1]?.split("##")[0] ?? "";
  for (const line of assessedSection.split("\n")) {
    const match = line.match(skillLineRegex);
    if (match) {
      skills.push({ id: match[1].trim(), confidence: parseFloat(match[2]), type: "assessed" });
    }
  }

  // Parse inferred skills section
  const inferredSection = content.split("## Inferred Skills")[1]?.split("##")[0] ?? "";
  for (const line of inferredSection.split("\n")) {
    const match = line.match(skillLineRegex);
    if (match) {
      skills.push({ id: match[1].trim(), confidence: parseFloat(match[2]), type: "inferred" });
    }
  }

  return skills;
}

async function buildGroupSkillProfile(members: string[]): Promise<GroupSkillProfile> {
  const allSkills: Record<string, { haveIt: number; totalConf: number }> = {};
  let loadedCount = 0;

  for (const memberId of members) {
    try {
      const profilePath = safePath(DATA_DIR, "learners", `${memberId}.md`);
      const content = await fs.readFile(profilePath, "utf-8");
      const skills = parseLearnerSkills(content);
      loadedCount++;

      for (const skill of skills) {
        if (skill.confidence >= 0.5) {
          if (!allSkills[skill.id]) allSkills[skill.id] = { haveIt: 0, totalConf: 0 };
          allSkills[skill.id].haveIt++;
          allSkills[skill.id].totalConf += skill.confidence;
        }
      }
    } catch {
      // Learner file not found — skip
    }
  }

  const skillCoverage: GroupSkillProfile["skillCoverage"] = {};
  for (const [id, data] of Object.entries(allSkills)) {
    skillCoverage[id] = {
      haveIt: data.haveIt,
      fraction: loadedCount > 0 ? data.haveIt / loadedCount : 0,
      avgConfidence: data.haveIt > 0 ? data.totalConf / data.haveIt : 0,
    };
  }

  return { totalLearners: loadedCount, skillCoverage };
}

/** Find all skills on the path from current group level to target skills */
function findTeachingFrontier(
  graph: SkillGraph,
  targetSkillIds: string[],
  groupProfile: GroupSkillProfile
): string[] {
  const needed = new Set<string>();

  // BFS backwards from each target skill
  for (const targetId of targetSkillIds) {
    const queue = [targetId];
    const visited = new Set([targetId]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const coverage = groupProfile.skillCoverage[current];
      const groupHasIt = coverage && coverage.fraction >= 0.7;

      if (!groupHasIt) {
        needed.add(current);
        // Continue searching prerequisites
        const prereqEdges = graph.edges.filter((e) => e.target === current);
        for (const edge of prereqEdges) {
          if (!visited.has(edge.source)) {
            visited.add(edge.source);
            queue.push(edge.source);
          }
        }
      }
    }
  }

  return Array.from(needed);
}

/** Topological sort of skills respecting dependency edges */
function topologicalSort(graph: SkillGraph, skillIds: string[]): string[] {
  const skillSet = new Set(skillIds);
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const id of skillIds) {
    inDegree[id] = 0;
    adj[id] = [];
  }

  for (const edge of graph.edges) {
    if (skillSet.has(edge.source) && skillSet.has(edge.target)) {
      adj[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  }

  // Sort by Bloom's level as tiebreaker
  const queue = skillIds
    .filter((id) => (inDegree[id] || 0) === 0)
    .sort((a, b) => {
      const sa = graph.skills.find((s) => s.id === a);
      const sb = graph.skills.find((s) => s.id === b);
      return BLOOM_ORDER.indexOf(sa?.bloom_level || "") - BLOOM_ORDER.indexOf(sb?.bloom_level || "");
    });

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const next of adj[current] || []) {
      inDegree[next]--;
      if (inDegree[next] === 0) {
        queue.push(next);
        // Re-sort queue by Bloom's level
        queue.sort((a, b) => {
          const sa = graph.skills.find((s) => s.id === a);
          const sb = graph.skills.find((s) => s.id === b);
          return BLOOM_ORDER.indexOf(sa?.bloom_level || "") - BLOOM_ORDER.indexOf(sb?.bloom_level || "");
        });
      }
    }
  }

  return sorted;
}

/** Find the critical path length (longest dependency chain) */
function criticalPathLength(graph: SkillGraph, skillIds: string[]): number {
  const skillSet = new Set(skillIds);
  const memo: Record<string, number> = {};

  function longestPath(id: string, visiting: Set<string>): number {
    if (memo[id] !== undefined) return memo[id];
    if (visiting.has(id)) return 1; // cycle detected — break it
    visiting.add(id);

    const dependents = graph.edges
      .filter((e) => e.source === id && skillSet.has(e.target))
      .map((e) => e.target);

    if (dependents.length === 0) {
      memo[id] = 1;
    } else {
      memo[id] = 1 + Math.max(...dependents.map((d) => longestPath(d, visiting)));
    }
    visiting.delete(id);
    return memo[id];
  }

  let maxLen = 0;
  for (const id of skillIds) {
    maxLen = Math.max(maxLen, longestPath(id, new Set()));
  }
  return maxLen;
}

/** Distribute skills across sessions */
function distributeSkillsToSessions(
  graph: SkillGraph,
  sortedSkills: string[],
  numberOfSessions: number,
  sessionDuration: number
): Array<{ skills: string[]; bloomFocus: string; reviewSkills: string[] }> {
  // Estimate skills per session based on duration and group level
  const effectiveMinutes = sessionDuration * 0.65; // Account for opening, closing, transitions
  const avgSkillsPerSession = Math.max(1, Math.floor(effectiveMinutes / 18)); // ~18 min per skill on average

  const sessions: Array<{ skills: string[]; bloomFocus: string; reviewSkills: string[] }> = [];
  let skillIndex = 0;

  for (let s = 0; s < numberOfSessions && skillIndex < sortedSkills.length; s++) {
    const sessionSkills: string[] = [];
    const isLastSession = s === numberOfSessions - 1;
    const maxForThis = isLastSession
      ? sortedSkills.length - skillIndex // Pack remaining into last session
      : avgSkillsPerSession;

    for (let i = 0; i < maxForThis && skillIndex < sortedSkills.length; i++) {
      sessionSkills.push(sortedSkills[skillIndex]);
      skillIndex++;
    }

    // Determine Bloom's focus for this session
    const bloomLevels = sessionSkills.map((id) => {
      const skill = graph.skills.find((sk) => sk.id === id);
      return skill?.bloom_level || "knowledge";
    });
    const bloomCounts: Record<string, number> = {};
    for (const bl of bloomLevels) {
      bloomCounts[bl] = (bloomCounts[bl] || 0) + 1;
    }
    const bloomFocus = Object.entries(bloomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "application";

    // Review skills from previous session (spaced repetition)
    const reviewSkills: string[] = [];
    if (s > 0 && sessions[s - 1]) {
      // Review 1-2 key skills from previous session
      const prevSkills = sessions[s - 1].skills;
      reviewSkills.push(...prevSkills.slice(0, Math.min(2, prevSkills.length)));
    }

    sessions.push({ skills: sessionSkills, bloomFocus, reviewSkills });
  }

  // If there are leftover sessions (more sessions than needed), distribute review sessions
  while (sessions.length < numberOfSessions) {
    const reviewFrom = sessions[sessions.length - 1]?.skills || [];
    sessions.push({
      skills: [],
      bloomFocus: "application",
      reviewSkills: reviewFrom.slice(0, 3),
    });
  }

  return sessions;
}

/** Determine readiness status for a skill given the group profile */
function skillReadiness(
  skillId: string,
  graph: SkillGraph,
  groupProfile: GroupSkillProfile,
  taughtSoFar: Set<string>
): "ready" | "partial" | "blocked" {
  const prereqEdges = graph.edges.filter((e) => e.target === skillId);
  if (prereqEdges.length === 0) return "ready";

  let metCount = 0;
  for (const edge of prereqEdges) {
    const coverage = groupProfile.skillCoverage[edge.source];
    const groupHasIt = (coverage && coverage.fraction >= 0.7) || taughtSoFar.has(edge.source);
    if (groupHasIt) metCount++;
  }

  if (metCount === prereqEdges.length) return "ready";
  if (metCount > 0) return "partial";
  return "blocked";
}

export const composeCurriculumTool = tool(
  "compose_curriculum",
  "Compose a multi-session curriculum that sequences skills across sessions respecting dependencies, estimates pacing, and adds cross-session connectors. Writes the curriculum to data/curricula/ and returns structured curriculum data.",
  {
    title: z.string().describe("Curriculum title"),
    domain: z.string().describe("Skill domain"),
    groupName: z.string().describe("Group slug"),
    numberOfSessions: z.number().int().min(2).max(20).describe("Number of teaching sessions"),
    sessionDuration: z.number().int().min(30).max(180).describe("Duration per session in minutes"),
    objectives: z.array(z.string()).describe("Overall learning objectives"),
    targetSkills: z.array(z.string()).optional().describe("Specific target skill IDs. If omitted, infers from objectives and domain graph."),
    constraints: z.string().optional().describe("Additional scheduling or pedagogical constraints"),
    curriculumContent: z.string().optional().describe("Full Markdown content of the curriculum if agent composed it using the skill. If omitted, the tool generates a structured curriculum automatically."),
  },
  async ({
    title,
    domain,
    groupName,
    numberOfSessions,
    sessionDuration,
    objectives,
    targetSkills: targetSkillInput,
    constraints,
    curriculumContent,
  }) => {
    // Load graph and group
    let graph: SkillGraph;
    try {
      graph = await loadGraph(domain);
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Domain '${domain}' not found or has invalid skill data` }),
          },
        ],
        isError: true,
      };
    }

    let groupData: { domain: string; members: string[]; context: string };
    try {
      groupData = await loadGroupProfile(groupName);
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Group '${groupName}' not found` }),
          },
        ],
        isError: true,
      };
    }

    const groupProfile = await buildGroupSkillProfile(groupData.members);

    // Determine target skills
    let targetSkills = targetSkillInput || [];
    if (targetSkills.length === 0) {
      // Default: target the highest Bloom's level skills in the domain
      targetSkills = graph.skills
        .filter((s) => BLOOM_ORDER.indexOf(s.bloom_level) >= 3) // analysis and above
        .map((s) => s.id);
    }

    // Validate target skills exist in the graph
    const graphSkillIds = new Set(graph.skills.map((s) => s.id));
    const unknownSkills = targetSkills.filter((id) => !graphSkillIds.has(id));
    if (unknownSkills.length > 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Unknown skill IDs not found in ${domain} graph: ${unknownSkills.join(", ")}`,
              validSkillIds: Array.from(graphSkillIds),
            }),
          },
        ],
        isError: true,
      };
    }

    // Find the teaching frontier — skills the group needs to learn
    const neededSkills = findTeachingFrontier(graph, targetSkills, groupProfile);

    // Topological sort respecting dependencies
    const sortedSkills = topologicalSort(graph, neededSkills);

    // Critical path analysis
    const critPath = criticalPathLength(graph, neededSkills);
    const minSessionsNeeded = Math.ceil(critPath / Math.max(1, Math.floor(sessionDuration * 0.65 / 18)));

    // Distribute skills across sessions
    const sessionPlan = distributeSkillsToSessions(
      graph, sortedSkills, numberOfSessions, sessionDuration
    );

    // Build readiness map for each session
    const taughtSoFar = new Set<string>();
    // Add skills the group already has
    for (const [skillId, coverage] of Object.entries(groupProfile.skillCoverage)) {
      if (coverage.fraction >= 0.7) taughtSoFar.add(skillId);
    }

    const sessionsWithReadiness = sessionPlan.map((session, idx) => {
      const skillDetails = session.skills.map((skillId) => {
        const skill = graph.skills.find((s) => s.id === skillId);
        const readiness = skillReadiness(skillId, graph, groupProfile, taughtSoFar);
        return {
          id: skillId,
          label: skill?.label || skillId,
          bloom_level: skill?.bloom_level || "unknown",
          readiness,
        };
      });

      // Mark these skills as taught for subsequent sessions
      for (const skillId of session.skills) {
        taughtSoFar.add(skillId);
      }

      const reviewDetails = session.reviewSkills.map((skillId) => {
        const skill = graph.skills.find((s) => s.id === skillId);
        return { id: skillId, label: skill?.label || skillId };
      });

      return {
        session: idx + 1,
        bloomFocus: session.bloomFocus,
        skills: skillDetails,
        reviewSkills: reviewDetails,
        milestone: skillDetails.length > 0
          ? `Students can ${skillDetails[skillDetails.length - 1].label.toLowerCase()}`
          : `Review and consolidate skills from previous sessions`,
      };
    });

    // Generate curriculum markdown
    const now = new Date();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    let markdown = curriculumContent;
    if (!markdown) {
      markdown = generateCurriculumMarkdown({
        title,
        domain,
        groupName,
        numberOfSessions,
        sessionDuration,
        objectives,
        constraints,
        targetSkills,
        neededSkills: sortedSkills,
        criticalPathLength: critPath,
        minSessionsNeeded,
        sessions: sessionsWithReadiness,
        groupProfile,
        graph,
        created: now.toISOString(),
      });
    }

    // Write to disk
    const curriculaDir = path.join(DATA_DIR, "curricula");
    await fs.mkdir(curriculaDir, { recursive: true });
    const filename = `${slug}.md`;
    const filePath = path.join(curriculaDir, filename);
    await fs.writeFile(filePath, markdown, "utf-8");

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              title,
              file: filePath,
              filename,
              domain,
              group: groupName,
              numberOfSessions,
              sessionDuration,
              objectives,
              targetSkills,
              totalSkillsToTeach: sortedSkills.length,
              criticalPathLength: critPath,
              minSessionsRecommended: minSessionsNeeded,
              sessions: sessionsWithReadiness,
              created: now.toISOString(),
              constraints: constraints ?? "none",
              curriculumContent: markdown,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ─── Markdown generation ─────────────────────────────────────────

interface CurriculumData {
  title: string;
  domain: string;
  groupName: string;
  numberOfSessions: number;
  sessionDuration: number;
  objectives: string[];
  constraints?: string;
  targetSkills: string[];
  neededSkills: string[];
  criticalPathLength: number;
  minSessionsNeeded: number;
  sessions: Array<{
    session: number;
    bloomFocus: string;
    skills: Array<{ id: string; label: string; bloom_level: string; readiness: string }>;
    reviewSkills: Array<{ id: string; label: string }>;
    milestone: string;
  }>;
  groupProfile: GroupSkillProfile;
  graph: SkillGraph;
  created: string;
}

function generateCurriculumMarkdown(data: CurriculumData): string {
  const lines: string[] = [];

  lines.push(`# Curriculum: ${data.title}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|---|---|");
  lines.push(`| **Group** | ${data.groupName} |`);
  lines.push(`| **Domain** | ${data.domain} |`);
  lines.push(`| **Sessions** | ${data.numberOfSessions} |`);
  lines.push(`| **Duration per session** | ${data.sessionDuration} minutes |`);
  lines.push(`| **Total teaching time** | ${data.numberOfSessions * data.sessionDuration} minutes |`);
  lines.push(`| **Created** | ${data.created} |`);
  lines.push(`| **Status** | draft |`);
  lines.push("");

  // Overview
  lines.push("## Overview");
  lines.push("");
  lines.push("### Learning Objectives");
  for (const obj of data.objectives) {
    lines.push(`- ${obj}`);
  }
  lines.push("");

  if (data.constraints) {
    lines.push(`### Constraints`);
    lines.push(`${data.constraints}`);
    lines.push("");
  }

  lines.push("### Analysis");
  lines.push(`- **Skills to teach:** ${data.neededSkills.length}`);
  lines.push(`- **Critical path length:** ${data.criticalPathLength} skills deep`);
  lines.push(`- **Minimum sessions needed:** ${data.minSessionsNeeded}`);
  lines.push(`- **Sessions allocated:** ${data.numberOfSessions}`);
  if (data.numberOfSessions < data.minSessionsNeeded) {
    lines.push(`- **Warning:** ${data.numberOfSessions} sessions may not be enough. Consider reducing scope or adding ${data.minSessionsNeeded - data.numberOfSessions} more sessions.`);
  } else if (data.numberOfSessions > data.minSessionsNeeded + 2) {
    lines.push(`- **Note:** Extra sessions available for deeper practice, review, or extension activities.`);
  }
  lines.push("");

  // Progression map
  lines.push("## Progression Map");
  lines.push("");
  lines.push("| Session | Bloom's Focus | Skills | Readiness |");
  lines.push("|---|---|---|---|");
  for (const session of data.sessions) {
    const skillNames = session.skills.map((s) => s.label.split(" ").slice(1, 5).join(" ")).join(", ");
    const readinessEmoji = session.skills.every((s) => s.readiness === "ready")
      ? "Ready"
      : session.skills.some((s) => s.readiness === "blocked")
      ? "Blocked"
      : "Partial";
    const reviewNote = session.reviewSkills.length > 0 ? ` (+${session.reviewSkills.length} review)` : "";
    lines.push(
      `| Session ${session.session} | ${session.bloomFocus} | ${skillNames || "Review & consolidation"}${reviewNote} | ${readinessEmoji} |`
    );
  }
  lines.push("");

  // Session-by-session plans
  lines.push("## Session Plans");
  lines.push("");

  for (const session of data.sessions) {
    lines.push(`### Session ${session.session}: ${session.bloomFocus.charAt(0).toUpperCase() + session.bloomFocus.slice(1)}-Level Focus`);
    lines.push("");
    lines.push(`**Duration:** ${data.sessionDuration} minutes`);
    lines.push(`**Bloom's focus:** ${session.bloomFocus}`);
    lines.push("");

    if (session.reviewSkills.length > 0) {
      lines.push(`**Opening review (5 min):** Review from previous session:`);
      for (const rs of session.reviewSkills) {
        lines.push(`- ${rs.label}`);
      }
      lines.push("");
    }

    if (session.skills.length > 0) {
      lines.push("**Target skills:**");
      lines.push("");
      lines.push("| Skill | Bloom's Level | Readiness |");
      lines.push("|---|---|---|");
      for (const skill of session.skills) {
        const readinessLabel =
          skill.readiness === "ready" ? "Ready" :
          skill.readiness === "partial" ? "Some prerequisites missing" :
          "Prerequisites not yet covered";
        lines.push(`| ${skill.label} | ${skill.bloom_level} | ${readinessLabel} |`);
      }
      lines.push("");
    } else {
      lines.push("**Focus:** Review and consolidation of previously taught skills.");
      lines.push("");
    }

    lines.push(`**Milestone:** ${session.milestone}`);
    lines.push("");

    // Session outline
    const effectiveMinutes = data.sessionDuration;
    const reviewTime = session.reviewSkills.length > 0 ? 5 : 0;
    const closingTime = 5;
    const teachingTime = effectiveMinutes - reviewTime - closingTime;
    const minutesPerSkill = session.skills.length > 0 ? Math.floor(teachingTime / session.skills.length) : teachingTime;

    lines.push("**Outline:**");
    let currentMin = 0;

    if (reviewTime > 0) {
      lines.push(`- [${currentMin}:00–${currentMin + reviewTime}:00] Opening review — connect to previous session`);
      currentMin += reviewTime;
    }

    for (const skill of session.skills) {
      const endMin = currentMin + minutesPerSkill;
      lines.push(`- [${currentMin}:00–${endMin}:00] ${skill.label} (${skill.bloom_level})`);
      currentMin = endMin;
    }

    lines.push(`- [${currentMin}:00–${effectiveMinutes}:00] Wrap-up, questions, preview next session`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Adaptation notes
  lines.push("## Adaptation Notes");
  lines.push("");
  lines.push("### If the group is ahead of schedule");
  lines.push("- Compress review segments from 5 min to 2 min");
  lines.push("- Add extension activities or move skills forward from later sessions");
  lines.push("- Increase Bloom's level depth (move from application to analysis on current skills)");
  lines.push("");
  lines.push("### If the group falls behind");
  lines.push("- Extend review segments and add scaffolding");
  lines.push("- Split complex skills across two sessions instead of one");
  lines.push("- Prioritize prerequisite skills and defer advanced topics");
  lines.push("- Consider adding a remediation session focused on the most common gaps");
  lines.push("");
  lines.push("### Compressible sessions");

  const compressible = data.sessions.filter((s) =>
    s.skills.every((sk) => sk.readiness === "ready") && s.skills.length <= 2
  );
  if (compressible.length > 0) {
    for (const s of compressible) {
      lines.push(`- Session ${s.session} — skills are at ready status, could be compressed`);
    }
  } else {
    lines.push("- No sessions are easily compressible without cutting content");
  }
  lines.push("");

  return lines.join("\n");
}
