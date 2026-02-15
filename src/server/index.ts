import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import type { SDKMessage, PostToolUseFailureHookInput, PostToolUseHookInput, HookInput } from "@anthropic-ai/claude-agent-sdk";
import { SessionManager } from "./sessions/manager.js";
import { extractSessionContext, type SessionContext } from "./context-extractor.js";
import { createEducatorQuery, createAssessmentQuery, createLiveCompanionQuery } from "./agent.js";
import { parseLesson, lessonIdFromPath } from "./lib/lesson-parser.js";
import { exportRouter } from "./exports/router.js";
import { runSimulation } from "./tools/simulate-lesson.js";
import { runTensionAnalysis } from "./tools/analyze-tensions.js";
import { runTransferAnalysis } from "./tools/analyze-cross-domain-transfer.js";
import { DATA_DIR, parseGroupMembers, loadGroupLearners } from "./tools/shared.js";
import { warmToolLabels, getCreativeLabels } from "./tool-labels.js";
import { googleAuthRouter } from "./google/router.js";
import { googleAuth } from "./google/auth.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

// ─── Helpers ──────────────────────────────────────────────────────

/** Reject path-traversal attempts in user-supplied slug values */
function validateSlug(value: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

/** Convert free-form text to a URL/file-safe slug */
function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });
const wssLive = new WebSocketServer({ noServer: true, perMessageDeflate: false });

// Handle WebSocket upgrades manually to prevent Express from
// also responding on the same socket (which corrupts the WS stream).
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url!, `http://localhost:${PORT}`).pathname;

  if (pathname === "/ws/chat") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else if (pathname === "/ws/live") {
    wssLive.handleUpgrade(request, socket, head, (ws) => {
      wssLive.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});
const sessionManager = new SessionManager();

// In-memory map for assessment session persistence: "code:learnerName" → sessionId
const assessmentSessions = new Map<string, string>();

// ─── Export routes (PDF generation) ──────────────────────────────
app.use("/api/export", exportRouter);

// ─── File download (agent-workspace files) ──────────────────────
const AGENT_WORKSPACE = path.resolve(
  import.meta.dirname ?? process.cwd(),
  import.meta.dirname ? "../.." : ".",
  "agent-workspace"
);

const DOWNLOADABLE_EXTENSIONS = new Set([".docx", ".pptx", ".xlsx", ".pdf"]);

app.get("/api/files/*", async (req, res) => {
  // Extract the relative path after /api/files/
  const relativePath = (req.params as Record<string, string>)[0];
  if (!relativePath) {
    res.status(400).json({ error: "No file path specified" });
    return;
  }

  // Resolve and validate path is within agent-workspace
  const resolvedPath = path.resolve(AGENT_WORKSPACE, relativePath);
  if (!resolvedPath.startsWith(AGENT_WORKSPACE + path.sep) && resolvedPath !== AGENT_WORKSPACE) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Only serve known file types
  const ext = path.extname(resolvedPath).toLowerCase();
  if (!DOWNLOADABLE_EXTENSIONS.has(ext)) {
    res.status(403).json({ error: "File type not allowed" });
    return;
  }

  try {
    await fs.access(resolvedPath);
    const filename = path.basename(resolvedPath);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(resolvedPath);
  } catch {
    res.status(404).json({ error: "File not found" });
  }
});

// ─── Google OAuth routes ─────────────────────────────────────────
app.use("/api/auth/google", googleAuthRouter);

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

// ─── User identity ──────────────────────────────────────────────
app.get("/api/user", async (_req, res) => {
  const userPath = path.join(DATA_DIR, "user.md");
  try {
    const content = await fs.readFile(userPath, "utf-8");
    // Extract name from frontmatter or first heading
    const nameMatch = content.match(/^(?:name|Name):\s*(.+)$/m) || content.match(/^#\s+(.+)$/m);
    const name = nameMatch?.[1]?.trim() || null;
    // Extract educator profile ID if referenced
    const profileMatch = content.match(/(?:educator.profile|Educator Profile):\s*(.+)$/im);
    const educatorProfileId = profileMatch?.[1]?.trim() || null;
    res.json({ exists: true, name, educatorProfileId, content });
  } catch {
    res.json({ exists: false });
  }
});

app.get("/api/user/greeting", async (_req, res) => {
  const userPath = path.join(DATA_DIR, "user.md");
  try {
    const content = await fs.readFile(userPath, "utf-8");

    // Gather context: recent lessons, domains, teaching wisdom
    const contextParts: string[] = [`User profile:\n${content}`];

    // Recent lessons (last 3)
    const lessonsDir = path.join(DATA_DIR, "lessons");
    try {
      const lessonFiles = await fs.readdir(lessonsDir);
      const recent = lessonFiles.filter(f => f.endsWith(".md")).slice(-3);
      if (recent.length > 0) {
        contextParts.push(`Recent lesson plans: ${recent.map(f => f.replace(".md", "")).join(", ")}`);
      }
    } catch { /* no lessons yet */ }

    // Available domains
    const domainsDir = path.join(DATA_DIR, "domains");
    try {
      const domainDirs = await fs.readdir(domainsDir);
      if (domainDirs.length > 0) {
        contextParts.push(`Available domains: ${domainDirs.join(", ")}`);
      }
    } catch { /* no domains */ }

    // Recent debriefs (last debrief file)
    const debriefsDir = path.join(DATA_DIR, "debriefs");
    try {
      const debriefFiles = await fs.readdir(debriefsDir);
      const latest = debriefFiles.filter(f => f.endsWith(".md")).pop();
      if (latest) {
        const debriefContent = await fs.readFile(path.join(debriefsDir, latest), "utf-8");
        const excerpt = debriefContent.slice(0, 300);
        contextParts.push(`Most recent debrief (${latest.replace(".md", "")}):\n${excerpt}`);
      }
    } catch { /* no debriefs */ }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const nameMatch = content.match(/^(?:name|Name):\s*(.+)$/m);
      const name = nameMatch?.[1]?.trim();
      const h = new Date().getHours();
      const tod = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
      res.json({ greeting: name ? `${tod}, ${name}.` : `${tod}.`, subtext: "What are we working on?" });
      return;
    }

    const h = new Date().getHours();
    const timeOfDay = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `You are generating the welcome screen copy for a pedagogical reasoning engine — an AI teaching partner. The educator just opened the app. Generate a warm, brief greeting.

Context:
- Time of day: ${timeOfDay}
${contextParts.join("\n\n")}

Rules:
- Return ONLY a JSON object with two fields: "greeting" (1 short sentence, include their name if available) and "subtext" (1-2 sentences referencing something specific from their context — a recent lesson, a domain they work with, a student group, or something from a debrief. Make it feel like a colleague who remembers what you were working on.)
- Be warm and specific, not generic. Reference actual names and topics from the context.
- Do NOT include time-of-day pleasantries in the subtext — that goes in the greeting.
- Keep it concise. This is display copy, not a conversation.`,
        }],
      }),
    });

    if (!response.ok) throw new Error(`Haiku API error: ${response.status}`);
    const data = await response.json();
    const text: string = data.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json({ greeting: parsed.greeting, subtext: parsed.subtext });
    } else {
      throw new Error("Could not parse greeting");
    }
  } catch {
    // No user.md or generation failed — return null so frontend uses its default
    res.json({ greeting: null, subtext: null });
  }
});

// ─── AI-generated group names ───────────────────────────────────
app.get("/api/generate-group-name", async (_req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: generate a simple random name without AI
      const adjectives = ["morning", "autumn", "coastal", "meadow", "summit", "river", "cedar", "lunar", "coral", "ember"];
      const nouns = ["cohort", "circle", "squad", "crew", "bunch", "pack", "team", "band", "guild", "flock"];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      res.json({ name: `${adj}-${noun}` });
      return;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 30,
        messages: [
          {
            role: "user",
            content:
              "Generate a single creative two-word cohort name for a class of students, like 'tuesday-cohort' or 'morning-sparrows' or 'autumn-coders'. Use lowercase with a hyphen. Just the name, nothing else.",
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const name = (data.content?.[0]?.text || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    res.json({ name: name || "morning-cohort" });
  } catch (err) {
    // Fallback on any error
    const fallbacks = ["sunrise-learners", "maple-cohort", "tidal-crew", "ember-circle", "pine-squad"];
    res.json({ name: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
  }
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

// ─── Group discovery ──────────────────────────────────────────────
app.get("/api/groups", async (_req, res) => {
  const groupsDir = path.join(DATA_DIR, "groups");
  try {
    const files = await fs.readdir(groupsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const groups = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fs.readFile(path.join(groupsDir, file), "utf-8");
        const slug = file.replace(/\.md$/, "");

        const nameMatch = content.match(/^# Group: (.+)$/m);
        const domainMatch = content.match(/\| \*\*Domain\*\* \| ([^ |]+)/);
        let members = parseGroupMembers(content);

        // Fallback: scan learner profiles if group file has no members listed
        if (members.length === 0) {
          const scanned = await loadGroupLearners(slug);
          members = scanned.map((l) => ({ id: l.id, name: l.name }));
        }

        return {
          slug,
          name: nameMatch?.[1]?.trim() ?? slug,
          domain: domainMatch?.[1]?.trim() ?? "",
          memberCount: members.length,
          members: members.map((m) => ({ id: m.id, name: m.name })),
        };
      })
    );

    res.json({ groups, count: groups.length });
  } catch (err) {
    console.error("[groups] Error scanning groups:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Failed to scan groups directory" });
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
    const content = await fs.readFile(assessmentPath, "utf-8");

    // Extract domain from assessment file
    const domainMatch = content.match(/\| \*\*Domain\*\* \| ([^ |]+)/);
    const domain = domainMatch?.[1]?.trim() ?? "";

    // Load skill labels from domain skill graph
    let skillAreas: string[] = [];
    if (domain) {
      try {
        const skillsPath = path.join(DATA_DIR, "domains", domain, "skills.json");
        const skillsRaw = await fs.readFile(skillsPath, "utf-8");
        const { skills } = JSON.parse(skillsRaw);
        skillAreas = (skills as Array<{ label: string }>).map(
          (s) => s.label
        );
      } catch {
        // No skill graph — leave empty
      }
    }

    // Extract context if present
    const contextMatch = content.match(/## Assessment Context\n\n([\s\S]*?)(?=\n##|\n$)/);
    const context = contextMatch?.[1]?.trim() ?? null;

    res.json({ valid: true, code, domain, skillAreas, context });
  } catch {
    res.status(404).json({ valid: false, error: `Assessment '${code}' not found` });
  }
});

// ─── Assessment link generation (for share page) ────────────────
app.post("/api/assess/generate", async (req, res) => {
  const { groupName: rawGroup, domain: rawDomain, targetSkills, learnerIds, context } = req.body;

  if (!rawGroup || !rawDomain) {
    res.status(400).json({ error: "Missing required fields: groupName, domain" });
    return;
  }

  const groupName = slugify(rawGroup);
  const domain = slugify(rawDomain);

  if (!groupName || !domain) {
    res.status(400).json({ error: "Group name and domain must contain at least one letter or number" });
    return;
  }

  const assessmentsDir = path.join(DATA_DIR, "assessments");
  await fs.mkdir(assessmentsDir, { recursive: true });

  const code = nanoid(8).toUpperCase();
  const now = new Date();

  const contextSection = context
    ? `\n## Assessment Context\n\n${context}\n`
    : "";

  const assessmentContent = `# Assessment Session: ${code}

| Field | Value |
|---|---|
| **Code** | ${code} |
| **Group** | ${groupName} |
| **Domain** | ${domain} |
| **Created** | ${now.toISOString()} |
| **Status** | active |
${contextSection}
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

  // Check if the domain has a skill graph
  let domainExists = false;
  try {
    await fs.access(path.join(DATA_DIR, "domains", domain, "skills.json"));
    domainExists = true;
  } catch {}

  res.json({
    code,
    url: `${FRONTEND_URL}/assess/${code}`,
    embedUrl: `${FRONTEND_URL}/assess/embed/${code}`,
    group: groupName,
    domain,
    domainExists,
    created: now.toISOString(),
  });
});

// ─── Batch assessment link generation ────────────────────────────
app.post("/api/assess/generate-batch", async (req, res) => {
  const { groupName: rawGroup, domain: rawDomain, context } = req.body;

  if (!rawGroup || !rawDomain) {
    res.status(400).json({ error: "Missing required fields: groupName, domain" });
    return;
  }

  const groupName = slugify(rawGroup);
  const domain = slugify(rawDomain);

  if (!groupName || !domain) {
    res.status(400).json({ error: "Group name and domain must contain at least one letter or number" });
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

  let members = parseGroupMembers(groupContent);
  if (members.length === 0) {
    const scanned = await loadGroupLearners(groupName);
    members = scanned.map((l) => ({ id: l.id, name: l.name }));
  }
  if (members.length === 0) {
    res.status(400).json({ error: "No members found in group" });
    return;
  }

  const assessmentsDir = path.join(DATA_DIR, "assessments");
  await fs.mkdir(assessmentsDir, { recursive: true });

  const batchContextSection = context
    ? `\n## Assessment Context\n\n${context}\n`
    : "";

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
${batchContextSection}
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

  let members = parseGroupMembers(groupContent);

  // Fallback: scan learner profiles if group file has no members listed
  if (members.length === 0) {
    const scanned = await loadGroupLearners(groupName);
    members = scanned.map((l) => ({ id: l.id, name: l.name }));
  }

  // Check each learner's assessment status (parallel)
  const learnersDir = path.join(DATA_DIR, "learners");

  const learnerStatuses = await Promise.all(members.map(async (member) => {
    const learnerPath = path.join(learnersDir, `${member.id}.md`);
    try {
      const content = await fs.readFile(learnerPath, "utf-8");

      const hasAssessedSkills =
        content.includes("## Assessed Skills") &&
        !content.includes("_No skills assessed yet._");

      const skills: Record<string, { confidence: number; type: string; soloLevel?: string }> = {};

      if (hasAssessedSkills) {
        // Parse assessed skills (including SOLO sub-bullets)
        const assessedSection = content.split("## Assessed Skills")[1]?.split("##")[0] ?? "";
        const allLines = assessedSection.split("\n");
        for (let li = 0; li < allLines.length; li++) {
          const line = allLines[li];
          const skillMatch = line.match(/^- ([^:]+): ([\d.]+) confidence/);
          if (skillMatch) {
            const entry: { confidence: number; type: string; soloLevel?: string } = {
              confidence: parseFloat(skillMatch[2]),
              type: "assessed",
            };
            // Look ahead for solo_demonstrated on indented sub-bullets
            for (let lj = li + 1; lj < allLines.length && allLines[lj].match(/^\s+-/); lj++) {
              const soloMatch = allLines[lj].match(/solo_demonstrated:\s*(\w+)/);
              if (soloMatch) entry.soloLevel = soloMatch[1];
            }
            skills[skillMatch[1]] = entry;
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

  let members = parseGroupMembers(groupContent);
  if (members.length === 0) {
    const scanned = await loadGroupLearners(groupName);
    members = scanned.map((l) => ({ id: l.id, name: l.name }));
  }
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
    // Build session key and look up existing session
    const sessionKey = `${code}:${learnerName}`;
    const existingSessionId = assessmentSessions.get(sessionKey);

    const q = await createAssessmentQuery(code, learnerName, message, {
      sessionId: existingSessionId ?? randomUUID(),
      resume: existingSessionId,
    });
    const messages: SDKMessage[] = [];

    for await (const msg of q) {
      messages.push(msg);
      // Store session ID from the first message that carries one
      if ("session_id" in msg && msg.session_id) {
        assessmentSessions.set(sessionKey, msg.session_id as string);
      }
    }

    // Extract the assistant's text response
    const assistantMessages = messages.filter((m) => m.type === "assistant");
    const resultMessages = messages.filter((m) => m.type === "result");

    // Detect completion: scan for assess_learner tool use in assistant messages
    let assessmentComplete = false;
    for (const m of assistantMessages) {
      if (m.type === "assistant") {
        const toolUseBlocks = m.message.content.filter(
          (b: { type: string; name?: string }) =>
            b.type === "tool_use" && b.name === "mcp__pedagogy__assess_learner"
        );
        if (toolUseBlocks.length > 0) {
          assessmentComplete = true;
          break;
        }
      }
    }

    // Extract covered skills from report_assessment_progress tool calls
    const coveredSkills: Array<{ skillId: string; skillLabel: string }> = [];
    for (const m of assistantMessages) {
      if (m.type === "assistant") {
        for (const b of m.message.content) {
          if (
            b.type === "tool_use" &&
            b.name === "mcp__pedagogy__report_assessment_progress"
          ) {
            const inp = b.input as { skillId?: string; skillLabel?: string };
            if (inp.skillId && inp.skillLabel) {
              coveredSkills.push({ skillId: inp.skillId, skillLabel: inp.skillLabel });
            }
          }
        }
      }
    }

    const mappedMessages = assistantMessages.map((m) => {
      if (m.type === "assistant") {
        const textBlocks = m.message.content.filter(
          (b: { type: string }) => b.type === "text"
        );
        return {
          type: "assistant" as const,
          text: textBlocks.map((b: { text: string }) => b.text).join("\n"),
        };
      }
      return { type: m.type, text: "" };
    });

    res.json({
      messages: mappedMessages.filter((m) => m.text.trim() !== ""),
      result: resultMessages[0] ?? null,
      assessmentComplete,
      coveredSkills,
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

      // Normalize domain and group names to slugs
      const domainSlug = effectiveDomain
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      let groupSlug = effectiveGroup
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!groupSlug) {
        res.status(400).json({ error: "Invalid group name after normalization" });
        return;
      }

      // If the slugified group doesn't exist as a file, find a group that matches the domain
      const groupPath = path.join(DATA_DIR, "groups", `${groupSlug}.md`);
      try {
        await fs.access(groupPath);
      } catch {
        // Group file doesn't exist — scan for a group matching this domain
        const groupFiles = await fs.readdir(path.join(DATA_DIR, "groups"));
        let found = false;
        for (const gf of groupFiles) {
          if (!gf.endsWith(".md")) continue;
          const gc = await fs.readFile(path.join(DATA_DIR, "groups", gf), "utf-8");
          const domainMatch = gc.match(/\| \*\*Domain\*\* \| ([^ |]+)/);
          if (domainMatch && domainMatch[1].trim() === domainSlug) {
            groupSlug = gf.replace(/\.md$/, "");
            found = true;
            break;
          }
        }
        if (!found) {
          res.status(404).json({ error: `No group found for domain '${effectiveDomain}'` });
          return;
        }
      }

      try {
        const result = await runSimulation(lessonId, domainSlug, groupSlug);
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
wss.on("connection", (ws: WebSocket, req: import("http").IncomingMessage) => {
  // Check for reconnection: ?sessionId=... in the upgrade URL
  const reqUrl = new URL(req.url ?? "", `http://localhost:${PORT}`);
  const reconnectId = reqUrl.searchParams.get("sessionId");
  const existingSession = reconnectId ? sessionManager.get(reconnectId) : undefined;
  const isReconnect = !!(existingSession && existingSession.disconnectedAt !== null);

  const sessionId = isReconnect ? existingSession!.id : randomUUID();
  const session = isReconnect ? existingSession! : sessionManager.create(sessionId);
  sessionManager.setWs(sessionId, ws);
  let processing = false;

  console.log(`[ws] ${isReconnect ? "Reconnected" : "New"} educator session: ${sessionId}`);

  // Send session ID and creative tool labels to client
  const creativeLabels = getCreativeLabels();
  ws.send(
    JSON.stringify({
      type: "session",
      sessionId,
      ...(Object.keys(creativeLabels).length > 0 && { creativeLabels }),
    })
  );

  // On reconnect, replay the accumulated context so the sidebar repopulates
  if (isReconnect) {
    ws.send(JSON.stringify({ type: "session_context", context: session.context }));
  }

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

        // Per-query state for result-based correction
        const failedToolIds = new Set<string>();
        let turnToolUses: Array<{ name: string; input: Record<string, unknown>; id: string }> = [];
        let turnPreContext: SessionContext = { ...session.context };

        // Hook: when a pedagogy tool fails, re-extract context excluding failed tools
        const postToolUseFailureHook = async (hookInput: HookInput) => {
          const input = hookInput as PostToolUseFailureHookInput;
          if (!input.tool_name.startsWith("mcp__pedagogy__")) return { continue: true };

          failedToolIds.add(input.tool_use_id);

          // Re-extract context from scratch, excluding failed tools
          const successfulUses = turnToolUses.filter(t => !failedToolIds.has(t.id));
          const correctedContext = extractSessionContext(
            successfulUses.map(t => ({ name: t.name, input: t.input })),
            turnPreContext,
          );
          sessionManager.updateContext(sessionId, correctedContext);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "session_context", context: correctedContext }));
          }

          return { continue: true };
        };

        // Hook: detect file creation (Write/Bash) and Google upload (export tools)
        const FILE_EXTENSIONS = /\.(?:docx|pptx|xlsx|pdf)$/i;
        const EXT_TO_TYPE: Record<string, string> = {
          ".docx": "doc", ".pptx": "slides", ".xlsx": "sheet", ".pdf": "pdf",
        };
        const BASH_FILE_REGEX = /(?:['"`]|[\s=])([^\s'"`:]+\.(?:docx|pptx|xlsx|pdf))(?:['"`\s]|$)/gi;
        const EXPORT_TOOLS: Record<string, { fileType: string; idKey: string; urlKey: string }> = {
          "mcp__pedagogy__export_lesson_to_docs": { fileType: "doc", idKey: "fileId", urlKey: "url" },
          "mcp__pedagogy__export_lesson_to_slides": { fileType: "slides", idKey: "presentationId", urlKey: "presentationUrl" },
          "mcp__pedagogy__export_assessments_to_sheets": { fileType: "sheet", idKey: "spreadsheetId", urlKey: "spreadsheetUrl" },
        };

        /** Convert a file path (absolute or relative to agent-workspace) to a download URL path */
        const toDownloadUrl = (filePath: string): string => {
          // If absolute, strip the agent-workspace prefix to get a relative path
          const awPrefix = AGENT_WORKSPACE + path.sep;
          const relativePath = filePath.startsWith(awPrefix)
            ? filePath.slice(awPrefix.length)
            : filePath.startsWith("/")
              ? filePath // absolute but not in workspace — pass through (won't resolve)
              : filePath; // already relative to agent-workspace
          return `/api/files/${relativePath}`;
        };

        const postToolUseHook = async (hookInput: HookInput) => {
          const input = hookInput as PostToolUseHookInput;
          if (ws.readyState !== WebSocket.OPEN) return { continue: true };

          // Stage 1: Detect local file creation from Write tool
          if (input.tool_name === "Write") {
            const filePath = (input.tool_input as { file_path?: string }).file_path || "";
            if (FILE_EXTENSIONS.test(filePath)) {
              const ext = path.extname(filePath).toLowerCase();
              const title = path.basename(filePath, ext);
              ws.send(JSON.stringify({
                type: "file_created",
                file: { filePath, title, fileType: EXT_TO_TYPE[ext], status: "local", downloadUrl: toDownloadUrl(filePath) },
                toolUseId: input.tool_use_id,
              }));
            }
          }

          // Stage 1: Detect local file creation from Bash tool
          if (input.tool_name === "Bash") {
            const command = (input.tool_input as { command?: string }).command || "";
            const matches = [...command.matchAll(BASH_FILE_REGEX)];
            for (const match of matches) {
              const filePath = match[1];
              const ext = path.extname(filePath).toLowerCase();
              const title = path.basename(filePath, ext);
              ws.send(JSON.stringify({
                type: "file_created",
                file: { filePath, title, fileType: EXT_TO_TYPE[ext], status: "local", downloadUrl: toDownloadUrl(filePath) },
                toolUseId: input.tool_use_id,
              }));
            }
          }

          // Stage 2: Detect Google upload from export tools
          const exportMeta = EXPORT_TOOLS[input.tool_name];
          if (exportMeta) {
            try {
              const toolInput = input.tool_input as { filePath?: string; title?: string };
              const response = typeof input.tool_response === "string"
                ? JSON.parse(input.tool_response)
                : input.tool_response;
              // MCP tool responses wrap in { content: [{ text: JSON.stringify(payload) }] }
              const payload = JSON.parse(response?.content?.[0]?.text || "{}");

              if (!payload.error) {
                ws.send(JSON.stringify({
                  type: "file_created",
                  file: {
                    filePath: toolInput.filePath || "",
                    title: toolInput.title || payload.title || "",
                    fileType: exportMeta.fileType,
                    status: "uploaded",
                    url: payload[exportMeta.urlKey],
                    fileId: payload[exportMeta.idKey],
                  },
                  toolUseId: input.tool_use_id,
                }));
              }
            } catch {
              // Failed to parse export tool response — skip silently
            }
          }

          return { continue: true };
        };

        const q = await createEducatorQuery(parsed.message, {
          sessionId: session.id,
          resume: prevQuery ? session.id : undefined,
          hooks: {
            PostToolUse: [{ hooks: [postToolUseHook] }],
            PostToolUseFailure: [{ hooks: [postToolUseFailureHook] }],
          },
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

              // Extract and emit session context from tool_use blocks (optimistic)
              if (toolUseBlocks.length > 0) {
                turnPreContext = { ...session.context }; // snapshot before optimistic update
                const mapped = toolUseBlocks.map((b: { name: string; input: unknown; id: string }) => ({
                  name: b.name,
                  input: b.input as Record<string, unknown>,
                  id: b.id,
                }));
                turnToolUses.push(...mapped);

                const updatedContext = extractSessionContext(
                  mapped.map((t: { name: string; input: Record<string, unknown> }) => ({ name: t.name, input: t.input })),
                  session.context,
                );
                sessionManager.updateContext(sessionId, updatedContext);
                ws.send(JSON.stringify({ type: "session_context", context: updatedContext }));
              }
              break;
            }

            case "result": {
              // Clear per-turn state
              turnToolUses = [];
              failedToolIds.clear();
              turnPreContext = { ...session.context };

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

            case "stream_event": {
              const event = (msg as { event: { type: string; delta?: { type: string; text?: string } } }).event;
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
                ws.send(JSON.stringify({
                  type: "stream_delta",
                  text: event.delta.text,
                }));
              }
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
    console.log(`[ws] Session disconnected: ${sessionId} (kept for reconnection)`);
    sessionManager.disconnect(sessionId);
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

// ─── Load Google OAuth tokens on startup ──────────────────────────
googleAuth.loadTokens().catch(() => {
  // No tokens yet — that's expected on first run
});

// ─── Generate creative tool labels on startup ────────────────────
warmToolLabels().catch(() => {
  // Silently fall back — frontend has deterministic humanizers
});

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
