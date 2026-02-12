import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { SessionManager } from "./sessions/manager.js";
import { createEducatorQuery, createAssessmentQuery } from "./agent.js";

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
  const dataDir = process.env.DATA_DIR || "./data";
  const assessmentPath = `${dataDir}/assessments/${code}.md`;
  try {
    const fsModule = await import("fs/promises");
    await fsModule.access(assessmentPath);
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

// ─── WebSocket handler for educator chat ─────────────────────────
wss.on("connection", (ws: WebSocket) => {
  const sessionId = randomUUID();
  const session = sessionManager.create(sessionId);

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
      sessionManager.touch(sessionId);

      try {
        const q = await createEducatorQuery(parsed.message, {
          sessionId: session.id,
          resume: session.query ? session.id : undefined,
        });

        sessionManager.setQuery(sessionId, q);

        for await (const msg of q) {
          if (ws.readyState !== WebSocket.OPEN) break;

          // Forward relevant message types to the frontend
          switch (msg.type) {
            case "assistant": {
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
              ws.send(
                JSON.stringify({
                  type: "result",
                  subtype: msg.subtype,
                  result: msg.subtype === "success" ? msg.result : undefined,
                  costUsd: msg.total_cost_usd,
                  numTurns: msg.num_turns,
                  sessionId: msg.session_id,
                })
              );
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
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        console.error(`[ws] Error in session ${sessionId}:`, error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "error", error }));
        }
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
