import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { SessionManager } from "./sessions/manager.js";
import { createEducatorQuery, createAssessmentQuery, createLiveCompanionQuery } from "./agent.js";
import { parseLesson, lessonIdFromPath } from "./lib/lesson-parser.js";
import { exportRouter } from "./exports/router.js";
import { runSimulation } from "./tools/simulate-lesson.js";
import { runTensionAnalysis } from "./tools/analyze-tensions.js";
import { runTransferAnalysis } from "./tools/analyze-cross-domain-transfer.js";
import { DATA_DIR, parseGroupMembers } from "./tools/shared.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

// ─── Helpers ──────────────────────────────────────────────────────

/** Reject path-traversal attempts in user-supplied slug values */
function validateSlug(value: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

const app = express();
app.use(express.json({ limit: "100kb" }));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/chat" });
const wssLive = new WebSocketServer({ server, path: "/ws/live" });
const sessionManager = new SessionManager();

// ─── Export routes (PDF generation) ──────────────────────────────
app.use("/api/export", exportRouter);

// ─── Health check ────────────────────────────────────────────────
app.get("/api/status", (_req, res) => {
  const sessions = sessionManager.list();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    sessions: sessions.length,
    activeSessions: sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
    })),
  });
});

// ─── Domain discovery (plugin architecture) ─────────────────────
app.get("/api/domains", async (_req, res) => {
  const domainsDir = path.join(DATA_DIR, "domains");
  try {
    const entries = await fs.readdir(domainsDir, { withFileTypes: true });
    const domainDirs = entries.filter((e) => e.isDirectory());

    const domains = await Promise.all(
      domainDirs.map(async (dir) => {
        const domainPath = path.join(domainsDir, dir.name);

        // Read manifest.json (optional — graceful fallback)
        let manifest: Record<string, unknown> = {};
        try {
          const raw = await fs.readFile(path.join(domainPath, "manifest.json"), "utf-8");
          manifest = JSON.parse(raw);
        } catch {
          // No manifest — build minimal metadata from skills.json
        }

        // Read skills.json for stats
        let skillCount = 0;
        let edgeCount = 0;
        let description = (manifest.description as string) || "";
        const bloomCounts: Record<string, number> = {};
        try {
          const skillsRaw = await fs.readFile(path.join(domainPath, "skills.json"), "utf-8");
          const skillsData = JSON.parse(skillsRaw);
          const skills = skillsData.skills || [];
          skillCount = skills.length;
          if (!description) description = skillsData.description || "";
          for (const s of skills) {
            const bl = s.bloom_level || "unknown";
            bloomCounts[bl] = (bloomCounts[bl] || 0) + 1;
          }
        } catch {
          // No skills.json — skip
        }

        try {
          const depsRaw = await fs.readFile(path.join(domainPath, "dependencies.json"), "utf-8");
          const depsData = JSON.parse(depsRaw);
          edgeCount = (depsData.edges || []).length;
        } catch {
          // No dependencies.json
        }

        // Check which plugin files exist
        const hasManifest = Object.keys(manifest).length > 0;
        const hasSkillMd = await fs.access(path.join(domainPath, "SKILL.md")).then(() => true).catch(() => false);
        const hasSampleLearners = await fs.readdir(path.join(domainPath, "sample-learners")).then((f) => f.length > 0).catch(() => false);

        return {
          slug: dir.name,
          name: (manifest.name as string) || dir.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          description,
          version: (manifest.version as string) || "1.0.0",
          author: (manifest.author as string) || "Unknown",
          tags: (manifest.tags as string[]) || [],
          audience: manifest.audience || null,
          icon: (manifest.icon as string) || "book",
          color: (manifest.color as string) || "#6366f1",
          featured: (manifest.featured as boolean) || false,
          stats: {
            skills: skillCount,
            dependencies: edgeCount,
            bloomLevels: Object.keys(bloomCounts).length,
            bloomDistribution: bloomCounts,
          },
          pluginCompleteness: {
            manifest: hasManifest,
            skills: skillCount > 0,
            dependencies: edgeCount > 0,
            teachingMethodology: hasSkillMd,
            sampleLearners: hasSampleLearners,
          },
        };
      })
    );

    // Sort: featured first, then by skill count
    domains.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.stats.skills - a.stats.skills;
    });

    res.json({ domains, count: domains.length });
  } catch (err) {
    console.error("[domains] Error scanning domains:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Failed to scan domains directory" });
  }
});

// ─── Single domain detail ────────────────────────────────────────
app.get("/api/domains/:slug", async (req, res) => {
  const { slug } = req.params;
  if (!validateSlug(slug)) {
    res.status(400).json({ error: "Invalid domain slug" });
    return;
  }

  const domainPath = path.join(DATA_DIR, "domains", slug);
  try {
    await fs.access(domainPath);
  } catch {
    res.status(404).json({ error: `Domain '${slug}' not found` });
    return;
  }

  try {
    // Read all plugin files
    const [manifestRaw, skillsRaw, depsRaw, skillMd] = await Promise.all([
      fs.readFile(path.join(domainPath, "manifest.json"), "utf-8").catch(() => "{}"),
      fs.readFile(path.join(domainPath, "skills.json"), "utf-8").catch(() => '{"skills":[]}'),
      fs.readFile(path.join(domainPath, "dependencies.json"), "utf-8").catch(() => '{"edges":[]}'),
      fs.readFile(path.join(domainPath, "SKILL.md"), "utf-8").catch(() => null),
    ]);

    const manifest = JSON.parse(manifestRaw);
    const skillsData = JSON.parse(skillsRaw);
    const depsData = JSON.parse(depsRaw);

    // Read sample learners
    let sampleLearners: string[] = [];
    try {
      const files = await fs.readdir(path.join(domainPath, "sample-learners"));
      sampleLearners = files.filter((f) => f.endsWith(".md"));
    } catch {
      // No sample learners directory
    }

    res.json({
      slug,
      manifest,
      skills: skillsData.skills || [],
      edges: depsData.edges || [],
      teachingMethodology: skillMd,
      sampleLearners,
    });
  } catch (err) {
    console.error(`[domains] Error loading domain ${slug}:`, err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Failed to load domain" });
  }
});

// ─── Assessment validation endpoint ───────────────────────────────
app.get("/api/assess/:code", async (req, res) => {
  const { code } = req.params;
  if (!validateSlug(code)) {
    res.status(400).json({ valid: false, error: "Invalid assessment code" });
    return;
  }
  const assessmentPath = path.join(DATA_DIR, "assessments", `${code}.md`);
  try {
    await fs.access(assessmentPath);
    res.json({ valid: true, code });
  } catch {
    res.status(404).json({ valid: false, error: `Assessment '${code}' not found` });
  }
});

// ─── Assessment link generation (for share page) ────────────────
app.post("/api/assess/generate", async (req, res) => {
  const { groupName, domain, targetSkills, learnerIds } = req.body;

  if (!groupName || !domain) {
    res.status(400).json({ error: "Missing required fields: groupName, domain" });
    return;
  }
  if (!validateSlug(groupName) || !validateSlug(domain)) {
    res.status(400).json({ error: "Invalid groupName or domain (alphanumeric, hyphens, underscores only)" });
    return;
  }

  const assessmentsDir = path.join(DATA_DIR, "assessments");
  await fs.mkdir(assessmentsDir, { recursive: true });

  const code = nanoid(8).toUpperCase();
  const now = new Date();

  const assessmentContent = `# Assessment Session: ${code}

| Field | Value |
|---|---|
| **Code** | ${code} |
| **Group** | ${groupName} |
| **Domain** | ${domain} |
| **Created** | ${now.toISOString()} |
| **Status** | active |

## Target Skills

${targetSkills && targetSkills.length > 0 ? targetSkills.map((s: string) => `- ${s}`).join("\n") : "_Full domain assessment_"}

## Target Learners

${learnerIds && learnerIds.length > 0 ? learnerIds.map((id: string) => `- ${id}`).join("\n") : "_All group members_"}

## Completed Assessments

_None yet._
`;

  await fs.writeFile(
    path.join(assessmentsDir, `${code}.md`),
    assessmentContent,
    "utf-8"
  );

  res.json({
    code,
    url: `${FRONTEND_URL}/assess/${code}`,
    embedUrl: `${FRONTEND_URL}/assess/embed/${code}`,
    group: groupName,
    domain,
    created: now.toISOString(),
  });
});

// ─── Batch assessment link generation ────────────────────────────
app.post("/api/assess/generate-batch", async (req, res) => {
  const { groupName, domain } = req.body;

  if (!groupName || !domain) {
    res.status(400).json({ error: "Missing required fields: groupName, domain" });
    return;
  }
  if (!validateSlug(groupName) || !validateSlug(domain)) {
    res.status(400).json({ error: "Invalid groupName or domain (alphanumeric, hyphens, underscores only)" });
    return;
  }

  // Read group file to get member list
  const groupPath = path.join(DATA_DIR, "groups", `${groupName}.md`);
  let groupContent: string;
  try {
    groupContent = await fs.readFile(groupPath, "utf-8");
  } catch {
    res.status(404).json({ error: `Group '${groupName}' not found` });
    return;
  }

  const members = parseGroupMembers(groupContent);
  if (members.length === 0) {
    res.status(400).json({ error: "No members found in group" });
    return;
  }

  const assessmentsDir = path.join(DATA_DIR, "assessments");
  await fs.mkdir(assessmentsDir, { recursive: true });

  const links = await Promise.all(members.map(async (member) => {
    const code = nanoid(8).toUpperCase();
    const now = new Date();

    const assessmentContent = `# Assessment Session: ${code}

| Field | Value |
|---|---|
| **Code** | ${code} |
| **Group** | ${groupName} |
| **Domain** | ${domain} |
| **Created** | ${now.toISOString()} |
| **Status** | active |
| **Learner** | ${member.id} |

## Target Skills

_Full domain assessment_

## Target Learners

- ${member.id}

## Completed Assessments

_None yet._
`;

    await fs.writeFile(
      path.join(assessmentsDir, `${code}.md`),
      assessmentContent,
      "utf-8"
    );

    return {
      learnerId: member.id,
      learnerName: member.name,
      code,
      url: `${FRONTEND_URL}/assess/${code}`,
      embedUrl: `${FRONTEND_URL}/assess/embed/${code}`,
    };
  }));

  res.json({ group: groupName, domain, links });
});

// ─── Assessment status endpoint (for dashboard) ─────────────────
app.get("/api/assess/status/:groupName/:domain", async (req, res) => {
  const { groupName, domain } = req.params;

  if (!validateSlug(groupName) || !validateSlug(domain)) {
    res.status(400).json({ error: "Invalid groupName or domain" });
    return;
  }

  // Read group file
  const groupPath = path.join(DATA_DIR, "groups", `${groupName}.md`);
  let groupContent: string;
  try {
    groupContent = await fs.readFile(groupPath, "utf-8");
  } catch {
    res.status(404).json({ error: `Group '${groupName}' not found` });
    return;
  }

  const members = parseGroupMembers(groupContent);

  // Check each learner's assessment status (parallel)
  const learnersDir = path.join(DATA_DIR, "learners");

  const learnerStatuses = await Promise.all(members.map(async (member) => {
    const learnerPath = path.join(learnersDir, `${member.id}.md`);
    try {
      const content = await fs.readFile(learnerPath, "utf-8");

      const hasAssessedSkills =
        content.includes("## Assessed Skills") &&
        !content.includes("_No skills assessed yet._");

      const skills: Record<string, { confidence: number; type: string }> = {};

      if (hasAssessedSkills) {
        // Parse assessed skills
        const assessedSection = content.split("## Assessed Skills")[1]?.split("##")[0] ?? "";
        const skillLines = assessedSection.split("\n").filter((l) => l.startsWith("- ") && l.includes(":"));
        for (const line of skillLines) {
          const skillMatch = line.match(/- ([^:]+): ([\d.]+) confidence/);
          if (skillMatch) {
            skills[skillMatch[1]] = { confidence: parseFloat(skillMatch[2]), type: "assessed" };
          }
        }

        // Parse inferred skills
        if (content.includes("## Inferred Skills")) {
          const inferredSection = content.split("## Inferred Skills")[1]?.split("##")[0] ?? "";
          const inferredLines = inferredSection.split("\n").filter((l) => l.startsWith("- ") && l.includes(":"));
          for (const line of inferredLines) {
            const skillMatch = line.match(/- ([^:]+): ([\d.]+) confidence/);
            if (skillMatch) {
              skills[skillMatch[1]] = { confidence: parseFloat(skillMatch[2]), type: "inferred" };
            }
          }
        }
      }

      const lastMatch = content.match(/\| \*\*Last assessed\*\* \| (.+) \|/);
      const skillCount = Object.keys(skills).length;

      return {
        id: member.id,
        name: member.name,
        status: (hasAssessedSkills ? "completed" : "not_started") as "completed" | "not_started" | "in_progress",
        skillCount,
        lastAssessed: lastMatch ? lastMatch[1] : null,
        skills,
      };
    } catch {
      return {
        id: member.id,
        name: member.name,
        status: "not_started" as const,
        skillCount: 0,
        lastAssessed: null,
        skills: {} as Record<string, { confidence: number; type: string }>,
      };
    }
  }));

  // Check active assessment sessions (parallel file reads)
  const assessmentsDir = path.join(DATA_DIR, "assessments");
  let activeSessions: Array<{ code: string; created: string; learner?: string }> = [];
  try {
    const files = await fs.readdir(assessmentsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));
    const contents = await Promise.all(
      mdFiles.map((file) => fs.readFile(path.join(assessmentsDir, file), "utf-8"))
    );
    activeSessions = contents
      .filter(
        (content) =>
          content.includes(`| **Group** | ${groupName} |`) &&
          content.includes("| **Status** | active |")
      )
      .map((content) => {
        const codeMatch = content.match(/\| \*\*Code\*\* \| (.+) \|/);
        const createdMatch = content.match(/\| \*\*Created\*\* \| (.+) \|/);
        const learnerMatch = content.match(/\| \*\*Learner\*\* \| (.+) \|/);
        return codeMatch
          ? {
              code: codeMatch[1],
              created: createdMatch ? createdMatch[1] : "unknown",
              learner: learnerMatch ? learnerMatch[1] : undefined,
            }
          : null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  } catch {
    // No assessment files
  }

  // Load skill graph for group skill profile
  let skillNames: string[] = [];
  try {
    const skillsPath = path.join(DATA_DIR, "domains", domain, "skills.json");
    const skillsRaw = await fs.readFile(skillsPath, "utf-8");
    const { skills } = JSON.parse(skillsRaw);
    skillNames = skills.map((s: { id: string }) => s.id);
  } catch {
    // No skill graph
  }

  const total = learnerStatuses.length;
  const completed = learnerStatuses.filter((l) => l.status === "completed").length;
  const notStarted = learnerStatuses.filter((l) => l.status === "not_started").length;

  res.json({
    group: groupName,
    domain,
    summary: {
      total,
      completed,
      notStarted,
      inProgress: total - completed - notStarted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
    learners: learnerStatuses,
    activeSessions,
    skillNames,
  });
});

// ─── Assessment integrity report (educator-facing) ───────────────
app.get("/api/assess/integrity/:groupName/:domain", async (req, res) => {
  const { groupName, domain } = req.params;

  if (!validateSlug(groupName) || !validateSlug(domain)) {
    res.status(400).json({ error: "Invalid groupName or domain" });
    return;
  }

  // Read group file
  const groupPath = path.join(DATA_DIR, "groups", `${groupName}.md`);
  let groupContent: string;
  try {
    groupContent = await fs.readFile(groupPath, "utf-8");
  } catch {
    res.status(404).json({ error: `Group '${groupName}' not found` });
    return;
  }

  const members = parseGroupMembers(groupContent);
  const learnersDir = path.join(DATA_DIR, "learners");

  // Parse integrity data from each learner profile
  const integrityReports = await Promise.all(members.map(async (member) => {
    const learnerPath = path.join(learnersDir, `${member.id}.md`);
    try {
      const content = await fs.readFile(learnerPath, "utf-8");

      // Extract integrity section
      let integrityLevel: string | null = null;
      let integrityModifier: number | null = null;
      let integrityNotes = "";
      let flaggedSkills: string[] = [];

      if (content.includes("## Assessment Integrity Notes")) {
        const section = content.split("## Assessment Integrity Notes")[1]?.split(/\n## (?!Assessment)/)[0] ?? "";
        integrityNotes = section.trim();

        // Parse integrity level
        const levelMatch = section.match(/\*\*Integrity level:\*\*\s*(\w+)/);
        if (levelMatch) integrityLevel = levelMatch[1];

        // Parse modifier
        const modMatch = section.match(/modifier:\s*([\d.]+)/);
        if (modMatch) integrityModifier = parseFloat(modMatch[1]);

        // Parse per-skill flags
        const skillLines = section.match(/^- .+: modifier [\d.]+.*$/gm);
        if (skillLines) {
          flaggedSkills = skillLines.map(line => {
            const m = line.match(/^- (.+?): modifier/);
            return m ? m[1] : "";
          }).filter(Boolean);
        }
      }

      // Check if integrity-adjusted confidence values exist
      const hasIntegrityAdjusted = content.includes("integrity-adjusted");

      // Count assessed skills
      let assessedCount = 0;
      if (content.includes("## Assessed Skills")) {
        const assessedSection = content.split("## Assessed Skills")[1]?.split("##")[0] ?? "";
        assessedCount = (assessedSection.match(/^- /gm) ?? []).length;
      }

      const lastMatch = content.match(/\| \*\*Last assessed\*\* \| (.+) \|/);

      return {
        id: member.id,
        name: member.name,
        integrityLevel: integrityLevel ?? (assessedCount > 0 ? "not_analyzed" : "not_assessed"),
        integrityModifier,
        integrityNotes,
        flaggedSkills,
        hasIntegrityAdjusted,
        assessedSkillCount: assessedCount,
        lastAssessed: lastMatch ? lastMatch[1] : null,
      };
    } catch {
      return {
        id: member.id,
        name: member.name,
        integrityLevel: "not_assessed" as const,
        integrityModifier: null,
        integrityNotes: "",
        flaggedSkills: [],
        hasIntegrityAdjusted: false,
        assessedSkillCount: 0,
        lastAssessed: null,
      };
    }
  }));

  // Compute group-level summary
  const assessed = integrityReports.filter(r => r.integrityLevel !== "not_assessed");
  const highIntegrity = assessed.filter(r => r.integrityLevel === "high").length;
  const moderateIntegrity = assessed.filter(r => r.integrityLevel === "moderate").length;
  const lowIntegrity = assessed.filter(r => r.integrityLevel === "low").length;
  const notAnalyzed = assessed.filter(r => r.integrityLevel === "not_analyzed").length;

  res.json({
    group: groupName,
    domain,
    summary: {
      total: members.length,
      assessed: assessed.length,
      notAssessed: members.length - assessed.length,
      highIntegrity,
      moderateIntegrity,
      lowIntegrity,
      notAnalyzed,
    },
    learners: integrityReports,
  });
});

// ─── Assessment endpoint (HTTP POST for student assessments) ─────
app.post("/api/assess", async (req, res) => {
  const { code, learnerName, message } = req.body;

  if (!code || !learnerName || !message) {
    res.status(400).json({
      error: "Missing required fields: code, learnerName, message",
    });
    return;
  }

  // Validate learnerName to prevent prompt injection
  if (typeof learnerName !== "string" || learnerName.length > 50 || !/^[a-zA-Z\s'-]+$/.test(learnerName)) {
    res.status(400).json({ error: "Invalid learner name (letters, spaces, hyphens, apostrophes only, max 50 chars)" });
    return;
  }
  if (!validateSlug(code)) {
    res.status(400).json({ error: "Invalid assessment code" });
    return;
  }

  try {
    const q = await createAssessmentQuery(code, learnerName, message);
    const messages: SDKMessage[] = [];

    for await (const msg of q) {
      messages.push(msg);
    }

    // Extract the assistant's text response
    const assistantMessages = messages.filter((m) => m.type === "assistant");
    const resultMessages = messages.filter((m) => m.type === "result");

    res.json({
      messages: assistantMessages.map((m) => {
        if (m.type === "assistant") {
          const textBlocks = m.message.content.filter(
            (b: { type: string }) => b.type === "text"
          );
          return {
            type: "assistant",
            text: textBlocks.map((b: { text: string }) => b.text).join("\n"),
          };
        }
        return m;
      }),
      result: resultMessages[0] ?? null,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    // Distinguish between "not found" and server errors
    if (error.includes("not found")) {
      res.status(404).json({ error });
    } else {
      res.status(500).json({ error });
    }
  }
});

// ─── Lesson plan endpoints ────────────────────────────────────────

/** List all lesson plans with metadata */
app.get("/api/lessons", async (_req, res) => {
  const lessonsDir = path.join(DATA_DIR, "lessons");
  try {
    const files = await fs.readdir(lessonsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const lessons = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fs.readFile(path.join(lessonsDir, file), "utf-8");
        const parsed = parseLesson(content);
        return {
          id: lessonIdFromPath(file),
          ...parsed.meta,
          sectionCount: parsed.sections.length,
          objectiveCount: parsed.objectives.length,
        };
      })
    );

    res.json({ lessons });
  } catch {
    res.json({ lessons: [] });
  }
});

/** Get a specific lesson plan with full parsed data */
app.get("/api/lessons/:id", async (req, res) => {
  const { id } = req.params;
  // Sanitize: reject path traversal attempts
  if (id.includes("/") || id.includes("\\") || id.includes("..")) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }
  const lessonPath = path.join(DATA_DIR, "lessons", `${id}.md`);
  try {
    const content = await fs.readFile(lessonPath, "utf-8");
    const parsed = parseLesson(content);
    res.json({ lesson: parsed });
  } catch {
    res.status(404).json({ error: `Lesson '${id}' not found` });
  }
});

/** Save section feedback from live companion */
app.post("/api/lessons/:id/feedback", async (req, res) => {
  const { id } = req.params;
  // Sanitize: reject path traversal attempts
  if (id.includes("/") || id.includes("\\") || id.includes("..")) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }
  const { sectionId, feedback, notes, elapsedMin } = req.body;

  if (!sectionId || !feedback) {
    res.status(400).json({ error: "Missing sectionId or feedback" });
    return;
  }

  // Append feedback to a session log file
  const logDir = path.join(DATA_DIR, "live-sessions");
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch { /* exists */ }

  const logPath = path.join(logDir, `${id}-${new Date().toISOString().slice(0, 10)}.jsonl`);
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    sectionId,
    feedback,
    notes: notes || "",
    elapsedMin: elapsedMin ?? null,
  });

  try {
    await fs.appendFile(logPath, entry + "\n");
    res.json({ saved: true });
  } catch {
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

// ─── Lesson simulation endpoint ──────────────────────────────────
app.get("/api/simulate/:lessonId", async (req, res) => {
  const { lessonId } = req.params;
  if (lessonId.includes("/") || lessonId.includes("\\") || lessonId.includes("..")) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const domain = (req.query.domain as string) || "";
  const groupName = (req.query.group as string) || "";

  if (!domain || !groupName) {
    // Try to extract from lesson plan metadata
    const lessonPath = path.join(DATA_DIR, "lessons", `${lessonId}.md`);
    try {
      const content = await fs.readFile(lessonPath, "utf-8");
      const parsed = parseLesson(content);
      const effectiveDomain = domain || parsed.meta.domain || "";
      const effectiveGroup = groupName || parsed.meta.group || "";

      if (!effectiveDomain || !effectiveGroup) {
        res.status(400).json({
          error: "Missing domain or group. Provide as query params: ?domain=xxx&group=yyy",
        });
        return;
      }

      // Normalize group name to slug
      const groupSlug = effectiveGroup
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!groupSlug) {
        res.status(400).json({ error: "Invalid group name after normalization" });
        return;
      }

      try {
        const result = await runSimulation(lessonId, effectiveDomain, groupSlug);
        res.json({ simulation: result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
      }
    } catch {
      res.status(404).json({ error: `Lesson '${lessonId}' not found` });
    }
    return;
  }

  if (!validateSlug(domain) || !validateSlug(groupName)) {
    res.status(400).json({ error: "Invalid domain or group slug" });
    return;
  }

  try {
    const result = await runSimulation(lessonId, domain, groupName);
    res.json({ simulation: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// ─── Pedagogical tension analysis endpoint ───────────────────────
app.post("/api/tensions", async (req, res) => {
  const { domain, groupName, targetSkills, durationMinutes, constraints } = req.body;

  if (!domain || !groupName || !targetSkills || !Array.isArray(targetSkills)) {
    res.status(400).json({ error: "Missing required fields: domain, groupName, targetSkills (array)" });
    return;
  }
  if (!validateSlug(domain) || !validateSlug(groupName)) {
    res.status(400).json({ error: "Invalid domain or groupName (alphanumeric, hyphens, underscores only)" });
    return;
  }

  try {
    const result = await runTensionAnalysis({
      domain,
      groupName,
      targetSkills,
      durationMinutes,
      constraints,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[tensions] Error:", message);
    res.status(500).json({ error: message });
  }
});

// ─── Debrief endpoints ───────────────────────────────────────────

/** List all debriefs */
app.get("/api/debriefs", async (_req, res) => {
  const debriefDir = path.join(DATA_DIR, "debriefs");
  try {
    const files = await fs.readdir(debriefDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const debriefs = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fs.readFile(path.join(debriefDir, file), "utf-8");
        const lessonMatch = content.match(/\| \*\*Lesson\*\* \| (.+) \|/);
        const groupMatch = content.match(/\| \*\*Group\*\* \| (.+) \|/);
        const domainMatch = content.match(/\| \*\*Domain\*\* \| (.+) \|/);
        const dateMatch = content.match(/\| \*\*Date\*\* \| (.+) \|/);
        const ratingMatch = content.match(/\| \*\*Overall rating\*\* \| (.+) \|/);

        return {
          id: file.replace(/\.md$/, ""),
          lessonId: lessonMatch?.[1] ?? "",
          group: groupMatch?.[1] ?? "",
          domain: domainMatch?.[1] ?? "",
          date: dateMatch?.[1] ?? "",
          overallRating: ratingMatch?.[1] ?? "",
        };
      })
    );

    res.json({ debriefs });
  } catch {
    res.json({ debriefs: [] });
  }
});

/** Get a specific debrief by lesson ID */
app.get("/api/debriefs/:lessonId", async (req, res) => {
  const { lessonId } = req.params;
  if (lessonId.includes("/") || lessonId.includes("\\") || lessonId.includes("..")) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const debriefDir = path.join(DATA_DIR, "debriefs");
  try {
    const files = await fs.readdir(debriefDir);
    const matching = files.filter(
      (f) => f.startsWith(lessonId) && f.endsWith(".md")
    );
    if (matching.length === 0) {
      res.status(404).json({ error: `No debrief found for lesson '${lessonId}'` });
      return;
    }
    // Return the most recent debrief
    matching.sort().reverse();
    const content = await fs.readFile(
      path.join(debriefDir, matching[0]),
      "utf-8"
    );
    res.json({ debrief: content, filename: matching[0] });
  } catch {
    res.status(404).json({ error: "No debriefs directory found" });
  }
});

/** Check if a lesson is ready for debrief (has a plan, no debrief yet) */
app.get("/api/debrief-ready/:lessonId", async (req, res) => {
  const { lessonId } = req.params;
  if (lessonId.includes("/") || lessonId.includes("\\") || lessonId.includes("..")) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  // Check lesson exists
  const lessonPath = path.join(DATA_DIR, "lessons", `${lessonId}.md`);
  let lessonExists = false;
  try {
    await fs.access(lessonPath);
    lessonExists = true;
  } catch {
    // Lesson not found
  }

  // Check if debrief already exists
  let hasDebrief = false;
  try {
    const debriefDir = path.join(DATA_DIR, "debriefs");
    const files = await fs.readdir(debriefDir);
    hasDebrief = files.some(
      (f) => f.startsWith(lessonId) && f.endsWith(".md")
    );
  } catch {
    // No debriefs directory
  }

  // Parse lesson for section data (needed for debrief form)
  let lessonData = null;
  if (lessonExists) {
    const content = await fs.readFile(lessonPath, "utf-8");
    const parsed = parseLesson(content);
    lessonData = {
      meta: parsed.meta,
      sections: parsed.sections.map((s) => ({
        id: s.id,
        title: s.title,
        phase: s.phase,
        startMin: s.startMin,
        endMin: s.endMin,
        durationMin: s.durationMin,
      })),
      objectives: parsed.objectives,
    };
  }

  res.json({
    lessonId,
    lessonExists,
    hasDebrief,
    readyForDebrief: lessonExists && !hasDebrief,
    lesson: lessonData,
  });
});

// ─── Educator profile endpoints ───────────────────────────────────

/** List all educator profiles */
app.get("/api/educators", async (_req, res) => {
  const educatorsDir = path.join(DATA_DIR, "educators");
  try {
    const files = await fs.readdir(educatorsDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const educators = await Promise.all(
      jsonFiles.map(async (file) => {
        const raw = await fs.readFile(path.join(educatorsDir, file), "utf-8");
        const data = JSON.parse(raw);
        return {
          id: data.id,
          name: data.name,
          bio: data.bio,
          session_count: data.session_count,
          debrief_count: data.debrief_count,
          teaching_style: data.teaching_style,
          strengths: data.strengths,
          growth_areas: data.growth_areas,
          content_confidence: data.content_confidence,
          domains: Object.keys(data.content_confidence || {}),
        };
      })
    );

    res.json({ educators, count: educators.length });
  } catch {
    res.json({ educators: [], count: 0 });
  }
});

/** Get a specific educator profile */
app.get("/api/educators/:id", async (req, res) => {
  const { id } = req.params;
  if (!validateSlug(id)) {
    res.status(400).json({ error: "Invalid educator ID" });
    return;
  }

  const profilePath = path.join(DATA_DIR, "educators", `${id}.json`);
  try {
    const raw = await fs.readFile(profilePath, "utf-8");
    const profile = JSON.parse(raw);
    res.json({ profile });
  } catch {
    res.status(404).json({ error: `Educator profile '${id}' not found` });
  }
});

/** Get educator context analysis for a specific lesson setup */
app.get("/api/educators/:id/context", async (req, res) => {
  const { id } = req.params;
  const domain = req.query.domain as string;
  const skills = req.query.skills as string;

  if (!validateSlug(id)) {
    res.status(400).json({ error: "Invalid educator ID" });
    return;
  }

  const profilePath = path.join(DATA_DIR, "educators", `${id}.json`);
  try {
    const raw = await fs.readFile(profilePath, "utf-8");
    const profile = JSON.parse(raw);

    // Build a context summary
    const domainConfidence = domain ? profile.content_confidence?.[domain] : null;
    const styleEntries = Object.entries(profile.teaching_style as Record<string, number>)
      .sort(([, a], [, b]) => (b as number) - (a as number));

    res.json({
      educator: { id: profile.id, name: profile.name },
      domain: domain || null,
      domainExpertise: domainConfidence?.level ?? "unknown",
      topStyles: styleEntries.slice(0, 3).map(([style, pct]) => ({
        style,
        percentage: Math.round((pct as number) * 100),
      })),
      strengths: profile.strengths,
      growth_areas: profile.growth_areas,
      timing_patterns: profile.timing_patterns,
      preferences: profile.preferences,
    });
  } catch {
    res.status(404).json({ error: `Educator profile '${id}' not found` });
  }
});

// ─── Teaching wisdom endpoints ────────────────────────────────────

/** Get teaching wisdom for a domain — notes, patterns, stats */
app.get("/api/wisdom/:domain", async (req, res) => {
  const { domain } = req.params;
  if (!validateSlug(domain)) {
    res.status(400).json({ error: "Invalid domain slug" });
    return;
  }

  const notesPath = path.join(DATA_DIR, "domains", domain, "teaching-notes.json");
  try {
    const raw = await fs.readFile(notesPath, "utf-8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch {
    res.status(404).json({
      error: `No teaching wisdom found for domain '${domain}'`,
      domain,
      notes: [],
      patterns: [],
      sessionCount: 0,
    });
  }
});

/** Get teaching wisdom for specific skills */
app.get("/api/wisdom/:domain/skills", async (req, res) => {
  const { domain } = req.params;
  const skillIdsParam = req.query.ids as string | undefined;
  const noteType = req.query.type as string | undefined;

  if (!validateSlug(domain)) {
    res.status(400).json({ error: "Invalid domain slug" });
    return;
  }

  const notesPath = path.join(DATA_DIR, "domains", domain, "teaching-notes.json");
  try {
    const raw = await fs.readFile(notesPath, "utf-8");
    const data = JSON.parse(raw);

    let notes = data.notes || [];
    let patterns = data.patterns || [];

    if (skillIdsParam) {
      const skillIds = skillIdsParam.split(",").map((s: string) => s.trim());
      notes = notes.filter((n: { skillId: string }) => skillIds.includes(n.skillId));
      patterns = patterns.filter((p: { affectedSkills: string[] }) =>
        p.affectedSkills.some((s: string) => skillIds.includes(s))
      );
    }

    if (noteType) {
      notes = notes.filter((n: { type: string }) => n.type === noteType);
    }

    res.json({
      domain,
      sessionCount: data.sessionCount,
      lastUpdated: data.lastUpdated,
      notes,
      patterns,
    });
  } catch {
    res.json({ domain, sessionCount: 0, notes: [], patterns: [] });
  }
});

// ─── Meta-pedagogical reasoning endpoints ─────────────────────────

/** Get reasoning traces for a lesson plan */
app.get("/api/reasoning/:lessonId", async (req, res) => {
  const { lessonId } = req.params;
  if (lessonId.includes("/") || lessonId.includes("\\") || lessonId.includes("..")) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const tracesPath = path.join(DATA_DIR, "reasoning-traces", `${lessonId}.json`);
  try {
    const raw = await fs.readFile(tracesPath, "utf-8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch {
    res.status(404).json({ error: `No reasoning traces found for lesson '${lessonId}'` });
  }
});

/** List all lessons that have reasoning traces */
app.get("/api/reasoning", async (_req, res) => {
  const tracesDir = path.join(DATA_DIR, "reasoning-traces");
  try {
    const files = await fs.readdir(tracesDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const lessons = await Promise.all(
      jsonFiles.map(async (file) => {
        const raw = await fs.readFile(path.join(tracesDir, file), "utf-8");
        const data = JSON.parse(raw);
        return {
          lessonId: data.lessonId,
          domain: data.domain,
          groupName: data.groupName,
          traceCount: data.traceCount,
          createdAt: data.createdAt,
          decisionTypes: data.traces.reduce(
            (acc: Record<string, number>, t: { decisionType: string }) => {
              acc[t.decisionType] = (acc[t.decisionType] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        };
      })
    );

    res.json({ lessons, count: lessons.length });
  } catch {
    res.json({ lessons: [], count: 0 });
  }
});

/** Get a specific reasoning trace by lesson ID and trace ID */
app.get("/api/reasoning/:lessonId/:traceId", async (req, res) => {
  const { lessonId, traceId } = req.params;
  if (lessonId.includes("/") || lessonId.includes("\\") || lessonId.includes("..")) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const tracesPath = path.join(DATA_DIR, "reasoning-traces", `${lessonId}.json`);
  try {
    const raw = await fs.readFile(tracesPath, "utf-8");
    const data = JSON.parse(raw);
    const trace = (data.traces || []).find(
      (t: { id: string }) => t.id === traceId
    );
    if (!trace) {
      res.status(404).json({ error: `Trace '${traceId}' not found in lesson '${lessonId}'` });
      return;
    }
    res.json({ trace, lessonId: data.lessonId, domain: data.domain });
  } catch {
    res.status(404).json({ error: `No reasoning traces found for lesson '${lessonId}'` });
  }
});

// ─── Cross-domain transfer endpoints ──────────────────────────────

/** Analyze cross-domain transfer for a learner */
app.get("/api/transfer/:learnerId", async (req, res) => {
  const { learnerId } = req.params;
  const sourceDomain = req.query.source as string;
  const targetDomain = req.query.target as string;

  if (!learnerId || !validateSlug(learnerId)) {
    res.status(400).json({ error: "Invalid learner ID" });
    return;
  }
  if (!sourceDomain || !validateSlug(sourceDomain)) {
    res.status(400).json({ error: "source query param required (e.g. ?source=outdoor-ecology)" });
    return;
  }
  if (!targetDomain || !validateSlug(targetDomain)) {
    res.status(400).json({ error: "target query param required (e.g. &target=python-data-analysis)" });
    return;
  }

  try {
    const result = await runTransferAnalysis({
      learnerId,
      sourceDomain,
      targetDomain,
    });
    res.json(result);
  } catch (e) {
    const message = (e as Error).message;
    console.error("[transfer]", message);
    if (message.includes("not found") || message.includes("no assessed skills")) {
      res.status(404).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

/** List available learners for transfer analysis */
app.get("/api/transfer-learners", async (_req, res) => {
  try {
    const learnersDir = path.join(DATA_DIR, "learners");
    const files = await fs.readdir(learnersDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const learners = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fs.readFile(path.join(learnersDir, file), "utf-8");
        const idMatch = content.match(/\| \*\*ID\*\* \| ([^ |]+)/);
        const nameMatch = content.match(/\| \*\*Name\*\* \| ([^|]+)/);
        const domainMatch = content.match(/\| \*\*Domain\*\* \| ([^|]+)/);
        const skillCount = (content.match(/^- [^:]+: [\d.]+ confidence/gm) || []).length;
        return {
          id: idMatch?.[1]?.trim() ?? file.replace(".md", ""),
          name: nameMatch?.[1]?.trim() ?? file.replace(".md", ""),
          domain: domainMatch?.[1]?.trim() ?? "unknown",
          skillCount,
        };
      })
    );

    res.json({ learners: learners.filter((l) => l.skillCount > 0) });
  } catch {
    res.json({ learners: [] });
  }
});

// ─── WebSocket handler for educator chat ─────────────────────────
wss.on("connection", (ws: WebSocket) => {
  const sessionId = randomUUID();
  const session = sessionManager.create(sessionId);
  let processing = false;

  console.log(`[ws] New educator session: ${sessionId}`);

  // Send session ID to client
  ws.send(
    JSON.stringify({
      type: "session",
      sessionId,
    })
  );

  ws.on("message", async (data: Buffer) => {
    let parsed: { type: string; message?: string; sessionId?: string };
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", error: "Invalid JSON" }));
      return;
    }

    if (parsed.type === "message" && parsed.message) {
      if (processing) {
        ws.send(JSON.stringify({ type: "error", error: "Still processing the previous message. Please wait." }));
        return;
      }

      processing = true;
      sessionManager.touch(sessionId);

      try {
        // Close previous query if it exists to avoid resource leaks
        const prevQuery = session.query;
        if (prevQuery) {
          try { prevQuery.close(); } catch { /* already finished */ }
        }

        const q = await createEducatorQuery(parsed.message, {
          sessionId: session.id,
          resume: prevQuery ? session.id : undefined,
        });

        sessionManager.setQuery(sessionId, q);

        for await (const msg of q) {
          if (ws.readyState !== WebSocket.OPEN) break;

          // Forward relevant message types to the frontend
          switch (msg.type) {
            case "assistant": {
              // Handle SDK-level errors (rate limit, auth, etc.)
              if (msg.error) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    error: `API error: ${msg.error}`,
                  })
                );
                break;
              }

              const textBlocks = msg.message.content.filter(
                (b: { type: string }) => b.type === "text"
              );
              const toolUseBlocks = msg.message.content.filter(
                (b: { type: string }) => b.type === "tool_use"
              );

              ws.send(
                JSON.stringify({
                  type: "assistant",
                  text: textBlocks
                    .map((b: { text: string }) => b.text)
                    .join("\n"),
                  toolUses: toolUseBlocks.map(
                    (b: { name: string; input: unknown; id: string }) => ({
                      name: b.name,
                      input: b.input,
                      id: b.id,
                    })
                  ),
                  sessionId: msg.session_id,
                })
              );
              break;
            }

            case "result": {
              // Reset processing BEFORE sending the result to the client,
              // so the client can immediately send a follow-up message
              // without hitting the "still processing" guard.
              processing = false;

              const payload: Record<string, unknown> = {
                type: "result",
                subtype: msg.subtype,
                costUsd: msg.total_cost_usd,
                numTurns: msg.num_turns,
                sessionId: msg.session_id,
              };
              if (msg.subtype === "success") {
                payload.result = msg.result;
              } else {
                payload.errors = msg.errors;
              }
              ws.send(JSON.stringify(payload));
              break;
            }

            case "system": {
              if (msg.subtype === "init") {
                ws.send(
                  JSON.stringify({
                    type: "system",
                    subtype: "init",
                    tools: msg.tools,
                    model: msg.model,
                    skills: msg.skills,
                    agents: msg.agents,
                  })
                );
              }
              break;
            }

            case "tool_progress": {
              ws.send(
                JSON.stringify({
                  type: "tool_progress",
                  toolName: msg.tool_name,
                  toolUseId: msg.tool_use_id,
                  elapsed: msg.elapsed_time_seconds,
                })
              );
              break;
            }
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        console.error(`[ws] Error in session ${sessionId}:`, error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "error", error }));
        }
      } finally {
        processing = false;
      }
    }
  });

  ws.on("close", () => {
    console.log(`[ws] Session disconnected: ${sessionId}`);
    sessionManager.remove(sessionId);
  });

  ws.on("error", (err) => {
    console.error(`[ws] Error in session ${sessionId}:`, err.message);
  });
});

// ─── WebSocket handler for live teaching companion ───────────────
wssLive.on("connection", (ws: WebSocket, req) => {
  const sessionId = randomUUID();
  const session = sessionManager.create(sessionId);
  let processing = false;
  let lessonId: string | null = null;

  // Parse lessonId from query string: /ws/live?lessonId=xxx
  const url = new URL(req.url ?? "", `http://localhost:${PORT}`);
  lessonId = url.searchParams.get("lessonId");

  console.log(`[ws/live] New live session: ${sessionId}, lesson: ${lessonId}`);

  ws.send(JSON.stringify({ type: "session", sessionId }));

  ws.on("message", async (data: Buffer) => {
    let parsed: { type: string; message?: string; sectionContext?: string };
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", error: "Invalid JSON" }));
      return;
    }

    if (parsed.type === "message" && parsed.message) {
      if (processing) {
        ws.send(JSON.stringify({ type: "error", error: "Still processing. Please wait." }));
        return;
      }

      processing = true;
      sessionManager.touch(sessionId);

      try {
        const prevQuery = session.query;
        if (prevQuery) {
          try { prevQuery.close(); } catch { /* already finished */ }
        }

        const q = await createLiveCompanionQuery(
          parsed.message,
          lessonId ?? "",
          {
            sessionId: session.id,
            resume: prevQuery ? session.id : undefined,
            sectionContext: parsed.sectionContext,
          }
        );

        sessionManager.setQuery(sessionId, q);

        for await (const msg of q) {
          if (ws.readyState !== WebSocket.OPEN) break;

          switch (msg.type) {
            case "assistant": {
              if (msg.error) {
                ws.send(JSON.stringify({ type: "error", error: `API error: ${msg.error}` }));
                break;
              }
              const textBlocks = msg.message.content.filter(
                (b: { type: string }) => b.type === "text"
              );
              const text = textBlocks.map((b: { text: string }) => b.text).join("\n");
              if (text.trim()) {
                ws.send(JSON.stringify({ type: "assistant", text, sessionId: msg.session_id }));
              }
              break;
            }
            case "result": {
              processing = false;
              ws.send(JSON.stringify({
                type: "result",
                subtype: msg.subtype,
                ...(msg.subtype === "success" ? { result: msg.result } : { errors: msg.errors }),
              }));
              break;
            }
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        console.error(`[ws/live] Error in session ${sessionId}:`, error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "error", error }));
        }
      } finally {
        processing = false;
      }
    }
  });

  ws.on("close", () => {
    console.log(`[ws/live] Session disconnected: ${sessionId}`);
    sessionManager.remove(sessionId);
  });

  ws.on("error", (err) => {
    console.error(`[ws/live] Error in session ${sessionId}:`, err.message);
  });
});

// ─── Periodic cleanup ────────────────────────────────────────────
setInterval(() => {
  const removed = sessionManager.cleanup();
  if (removed > 0) {
    console.log(`[cleanup] Removed ${removed} stale sessions`);
  }
}, 15 * 60 * 1000); // Every 15 minutes

// ─── Graceful shutdown ────────────────────────────────────────────
function shutdown(signal: string) {
  console.log(`\n[shutdown] Received ${signal}. Cleaning up sessions...`);
  for (const session of sessionManager.list()) {
    sessionManager.remove(session.id);
  }
  wssLive.close(() => {
    wss.close(() => {
      server.close(() => {
        console.log("[shutdown] Server closed.");
        process.exit(0);
      });
    });
  });
  // Force exit after 5 seconds if graceful shutdown hangs
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ─── Start server ────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  Pedagogical Reasoning Engine — Backend Server           ║
║                                                          ║
║  HTTP:      http://localhost:${PORT}                       ║
║  WebSocket: ws://localhost:${PORT}/ws/chat                 ║
║  Live WS:   ws://localhost:${PORT}/ws/live                 ║
║  Health:    http://localhost:${PORT}/api/status             ║
║  Lessons:   http://localhost:${PORT}/api/lessons            ║
║  Assess:    POST http://localhost:${PORT}/api/assess        ║
║  Exports:   GET http://localhost:${PORT}/api/export/...     ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export { app, server };
