import type { Query, SDKMessage } from "@anthropic-ai/claude-agent-sdk";

export interface Session {
  id: string;
  query: Query | null;
  createdAt: Date;
  lastActivity: Date;
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

  /** Clean up sessions older than maxAge (ms). Default 4 hours. */
  cleanup(maxAge = 4 * 60 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > maxAge) {
        this.remove(id);
        removed++;
      }
    }
    return removed;
  }
}
