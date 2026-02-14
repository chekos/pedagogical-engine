import type { Query, SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { WebSocket } from "ws";
import { type SessionContext, EMPTY_SESSION_CONTEXT } from "../context-extractor.js";

export interface Session {
  id: string;
  query: Query | null;
  createdAt: Date;
  lastActivity: Date;
  context: SessionContext;
  ws: WebSocket | null;
  disconnectedAt: Date | null;
}

/**
 * Maps WebSocket connections to Agent SDK sessions.
 * Each educator gets a persistent session for multi-turn conversations.
 */
export class SessionManager {
  private sessions = new Map<string, Session>();

  create(sessionId: string): Session {
    const session: Session = {
      id: sessionId,
      query: null,
      createdAt: new Date(),
      lastActivity: new Date(),
      context: { ...EMPTY_SESSION_CONTEXT, constraints: [], learnerNames: [], skillsDiscussed: [] },
      ws: null,
      disconnectedAt: null,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  setQuery(sessionId: string, q: Query): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.query = q;
      session.lastActivity = new Date();
    }
  }

  touch(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  updateContext(sessionId: string, context: SessionContext): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context = context;
    }
  }

  setWs(sessionId: string, ws: WebSocket): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ws = ws;
      session.disconnectedAt = null;
      session.lastActivity = new Date();
    }
  }

  disconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ws = null;
      session.disconnectedAt = new Date();
    }
  }

  remove(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session?.query) {
      try { session.query.close(); } catch { /* already finished */ }
    }
    this.sessions.delete(sessionId);
  }

  list(): Session[] {
    return [...this.sessions.values()];
  }

  /**
   * Clean up sessions older than maxAge (ms). Default 4 hours.
   * Also removes disconnected sessions past the grace period (default 5 min).
   */
  cleanup(maxAge = 4 * 60 * 60 * 1000, disconnectGrace = 5 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;
    for (const [id, session] of this.sessions.entries()) {
      // Remove sessions that exceeded the overall max age
      if (now - session.lastActivity.getTime() > maxAge) {
        this.remove(id);
        removed++;
        continue;
      }
      // Remove disconnected sessions past the grace period
      if (session.disconnectedAt && now - session.disconnectedAt.getTime() > disconnectGrace) {
        this.remove(id);
        removed++;
      }
    }
    return removed;
  }
}
