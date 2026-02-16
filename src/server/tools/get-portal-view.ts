import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import {
  DATA_DIR,
  toolResponse,
  parseLearnerProfile,
  loadGraph,
} from "./shared.js";

/** Scan all learner profiles to find one matching a portal code */
async function findLearnerByPortalCode(
  portalCode: string
): Promise<{ id: string; content: string } | null> {
  const learnersDir = path.join(DATA_DIR, "learners");
  let files: string[];
  try {
    files = await fs.readdir(learnersDir);
  } catch {
    return null;
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const content = await fs.readFile(
      path.join(learnersDir, file),
      "utf-8"
    );
    if (content.includes(`| **Portal Code** | ${portalCode} |`)) {
      return { id: file.replace(".md", ""), content };
    }
  }
  return null;
}

/** Load educator-shared notes for a learner */
async function loadNotes(
  learnerId: string
): Promise<
  Array<{
    id: string;
    createdAt: string;
    content: string;
    audienceHint: string;
    pinned: boolean;
  }>
> {
  const notesDir = path.join(DATA_DIR, "notes", learnerId);
  let files: string[];
  try {
    files = await fs.readdir(notesDir);
  } catch {
    return [];
  }

  const noteResults = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => {
        try {
          const raw = await fs.readFile(path.join(notesDir, f), "utf-8");
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
  );
  const notes = noteResults.filter((n) => n !== null);

  // Sort: pinned first, then reverse chronological
  notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return notes;
}

/** Load assessments that reference this learner */
async function loadAssessments(
  learnerId: string,
  groupId: string
): Promise<{
  completed: Array<{
    code: string;
    domain: string;
    date: string;
    summary: string;
  }>;
  pending: Array<{
    code: string;
    domain: string;
    description: string;
    assessUrl: string;
  }>;
}> {
  const assessmentsDir = path.join(DATA_DIR, "assessments");
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
  const completed: Array<{
    code: string;
    domain: string;
    date: string;
    summary: string;
  }> = [];
  const pending: Array<{
    code: string;
    domain: string;
    description: string;
    assessUrl: string;
  }> = [];

  let files: string[];
  try {
    files = await fs.readdir(assessmentsDir);
  } catch {
    return { completed, pending };
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const content = await fs.readFile(
      path.join(assessmentsDir, file),
      "utf-8"
    );

    // Check if this assessment involves the learner (by ID or group membership)
    const isTargeted =
      content.includes(`- ${learnerId}`) ||
      (content.includes(`| **Group** | ${groupId} |`) &&
        content.includes("_All group members_"));

    if (!isTargeted) continue;

    const codeMatch = content.match(/\| \*\*Code\*\* \| (.+?) \|/);
    const domainMatch = content.match(/\| \*\*Domain\*\* \| (.+?) \|/);
    const statusMatch = content.match(/\| \*\*Status\*\* \| (.+?) \|/);
    const code = codeMatch?.[1]?.trim() ?? "";
    const domain = domainMatch?.[1]?.trim() ?? "";
    const status = statusMatch?.[1]?.trim() ?? "";

    // Check if this learner has completed this assessment
    const learnerCompletionMatch = content.match(
      new RegExp(`- ${learnerId}: Completed (.+?) —(.+)`)
    );

    if (learnerCompletionMatch) {
      completed.push({
        code,
        domain,
        date: learnerCompletionMatch[1].trim(),
        summary: learnerCompletionMatch[2].trim(),
      });
    } else if (status === "active") {
      pending.push({
        code,
        domain,
        description: `Assessment on ${domain.replace(/-/g, " ")}`,
        assessUrl: `${frontendUrl}/assess/${code}`,
      });
    }
  }

  return { completed, pending };
}

export const getPortalViewTool = tool(
  "get_portal_view",
  "Render a learner's portal page data. Looks up learner by portal_code, loads skill graph position, assessment history, and shared notes. Returns structured JSON for frontend rendering.",
  {
    portalCode: z
      .string()
      .describe("The learner's portal code (e.g. 'priya-tuesday-7x3k')"),
    language: z
      .string()
      .optional()
      .describe("ISO 639-1 language code (e.g. 'en', 'es', 'zh'). Defaults to 'en'."),
    audience: z
      .enum(["learner", "parent", "employer", "general"])
      .optional()
      .describe(
        "Who is viewing the portal. Affects how content is framed. Defaults to 'learner'."
      ),
  },
  async ({ portalCode, language, audience }) => {
    const lang = language ?? "en";
    const aud = audience ?? "learner";

    // 1. Find the learner by portal code
    const learner = await findLearnerByPortalCode(portalCode);
    if (!learner) {
      return toolResponse(
        { error: `No learner found with portal code '${portalCode}'` },
        true
      );
    }

    // 2. Parse the learner profile
    const profile = parseLearnerProfile(learner.content);

    // 3. Load the skill graph for the learner's domain
    let skillGraph: { skills: Array<{ id: string; label: string; bloom_level: string; dependencies: string[] }>; edges: Array<{ source: string; target: string }> } | null = null;
    if (profile.domain) {
      try {
        const graph = await loadGraph(profile.domain);
        skillGraph = {
          skills: graph.skills.map((s) => ({
            id: s.id,
            label: s.label,
            bloom_level: s.bloom_level,
            dependencies: s.dependencies,
          })),
          edges: graph.edges.map((e) => ({
            source: e.source,
            target: e.target,
          })),
        };
      } catch {
        // Domain doesn't have a skill graph
      }
    }

    // 4. Build skill map data
    const assessedSkillIds = new Set(
      profile.skills
        .filter((s) => s.source === "assessed")
        .map((s) => s.skillId)
    );
    const inferredSkillIds = new Set(
      profile.skills
        .filter((s) => s.source === "inferred")
        .map((s) => s.skillId)
    );

    const skillMap = {
      assessed: profile.skills
        .filter((s) => s.source === "assessed")
        .map((s) => ({
          skillId: s.skillId,
          confidence: s.confidence,
          bloomLevel: s.bloomLevel,
          soloDemonstrated: s.soloDemonstrated,
        })),
      inferred: profile.skills
        .filter((s) => s.source === "inferred")
        .map((s) => ({
          skillId: s.skillId,
          confidence: s.confidence,
        })),
      next: [] as Array<{ skillId: string; label: string; bloomLevel: string }>,
    };

    // Determine "next" skills — unassessed skills whose dependencies are all assessed/inferred
    if (skillGraph) {
      const knownSkillIds = new Set([...assessedSkillIds, ...inferredSkillIds]);
      for (const skill of skillGraph.skills) {
        if (knownSkillIds.has(skill.id)) continue;
        const allDepsKnown =
          skill.dependencies.length === 0 ||
          skill.dependencies.every((d) => knownSkillIds.has(d));
        if (allDepsKnown) {
          skillMap.next.push({
            skillId: skill.id,
            label: skill.label,
            bloomLevel: skill.bloom_level,
          });
        }
      }
    }

    // 5. Load assessments
    const assessments = await loadAssessments(learner.id, profile.group);

    // 6. Load educator notes
    const notes = await loadNotes(learner.id);

    // 7. Build a progress narrative from structured data
    // This provides contextual data for AI rendering on the frontend,
    // or a fallback text-based narrative
    const totalSkills = skillGraph?.skills.length ?? 0;
    const assessedCount = skillMap.assessed.length;
    const inferredCount = skillMap.inferred.length;
    const nextCount = skillMap.next.length;

    const progressData = {
      learnerName: profile.name,
      domain: profile.domain,
      totalSkillsInDomain: totalSkills,
      assessedCount,
      inferredCount,
      knownCount: assessedCount + inferredCount,
      nextSteps: skillMap.next.slice(0, 3),
      topSkills: skillMap.assessed
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5),
      growthAreas: skillMap.assessed
        .filter((s) => s.confidence < 0.7)
        .sort((a, b) => a.confidence - b.confidence)
        .slice(0, 3),
    };

    // 8. Build the portal view response
    return toolResponse({
      portalCode,
      language: lang,
      audience: aud,
      learner: {
        id: learner.id,
        name: profile.name,
        domain: profile.domain,
        group: profile.group,
      },
      progressData,
      skillMap,
      assessments,
      notes: notes.map((n) => ({
        id: n.id,
        createdAt: n.createdAt,
        content: n.content,
        audienceHint: n.audienceHint,
        pinned: n.pinned,
      })),
      skillGraph: skillGraph
        ? {
            totalSkills: skillGraph.skills.length,
            skills: skillGraph.skills.map((s) => ({
              id: s.id,
              label: s.label,
              bloomLevel: s.bloom_level,
              status: assessedSkillIds.has(s.id)
                ? "assessed"
                : inferredSkillIds.has(s.id)
                  ? "inferred"
                  : "unassessed",
              confidence:
                profile.skills.find((ps) => ps.skillId === s.id)
                  ?.confidence ?? null,
            })),
          }
        : null,
    });
  }
);
