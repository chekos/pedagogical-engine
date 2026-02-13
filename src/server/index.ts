import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { SessionManager } from "./sessions/manager.js";
import { createEducatorQuery, createAssessmentQuery } from "./agent.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const DATA_DIR = process.env.DATA_DIR || "./data";

// ─── Helpers ──────────────────────────────────────────────────────

/** Reject path-traversal attempts in user-supplied slug values */
function validateSlug(value: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

/** Parse group members from a group markdown file */
function parseGroupMembers(content: string): Array<{ id: string; name: string }> {
  const memberRegex = /- .+ \(`([^)]+)`\)/g;
  const members: Array<{ id: string; name: string }> = [];
  let match;
  while ((match = memberRegex.exec(content)) !== null) {
    const id = match[1];
    const lineMatch = content.substring(match.index).match(/- ([^(]+) \(/);
    const name = lineMatch ? lineMatch[1].trim() : id;
    members.push({ id, name });
  }
  return members;
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
const sessionManager = new SessionManager();

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
  wss.close(() => {
    server.close(() => {
      console.log("[shutdown] Server closed.");
      process.exit(0);
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
║  Health:    http://localhost:${PORT}/api/status             ║
║  Assess:    POST http://localhost:${PORT}/api/assess        ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export { app, server };
