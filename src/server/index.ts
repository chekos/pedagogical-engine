import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { SessionManager } from "./sessions/manager.js";
import { createEducatorQuery, createAssessmentQuery, createLiveCompanionQuery } from "./agent.js";
import { parseLesson, lessonIdFromPath } from "./lib/lesson-parser.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

const app = express();
app.use(express.json());

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

const DATA_DIR = process.env.DATA_DIR || "./data";

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/chat" });
const wssLive = new WebSocketServer({ server, path: "/ws/live" });
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
  const assessmentPath = path.join(DATA_DIR, "assessments", `${code}.md`);
  try {
    await fs.access(assessmentPath);
    res.json({ valid: true, code });
  } catch {
    res.status(404).json({ valid: false, error: `Assessment '${code}' not found` });
  }
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
╚══════════════════════════════════════════════════════════╝
  `);
});

export { app, server };
