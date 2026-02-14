import type { CreatedFile } from "./api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string; // serialized as ISO string
  toolUses?: Array<{ id: string; name: string; input: Record<string, unknown> }>;
}

interface SessionState {
  messages: ChatMessage[];
  creativeLabels: Record<string, string>;
  createdFiles: Record<string, CreatedFile>;
  savedAt: number;
}

const PREFIX = "teach-session:";

export function saveSessionState(
  sessionId: string,
  state: { messages: ChatMessage[]; creativeLabels: Record<string, string>; createdFiles: Record<string, CreatedFile> }
): void {
  try {
    const data: SessionState = {
      messages: state.messages,
      creativeLabels: state.creativeLabels,
      createdFiles: state.createdFiles,
      savedAt: Date.now(),
    };
    localStorage.setItem(PREFIX + sessionId, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — degrade silently
  }
}

export function loadSessionState(sessionId: string): SessionState | null {
  try {
    const raw = localStorage.getItem(PREFIX + sessionId);
    if (!raw) return null;
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function clearSessionState(sessionId: string): void {
  try {
    localStorage.removeItem(PREFIX + sessionId);
  } catch {
    // ignore
  }
}

export function pruneOldSessions(keepCount = 10): void {
  try {
    const entries: Array<{ key: string; savedAt: number }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      try {
        const data = JSON.parse(localStorage.getItem(key)!) as SessionState;
        entries.push({ key, savedAt: data.savedAt ?? 0 });
      } catch {
        // corrupt entry — remove it
        localStorage.removeItem(key);
      }
    }
    if (entries.length <= keepCount) return;
    entries.sort((a, b) => b.savedAt - a.savedAt); // newest first
    for (const entry of entries.slice(keepCount)) {
      localStorage.removeItem(entry.key);
    }
  } catch {
    // ignore
  }
}
