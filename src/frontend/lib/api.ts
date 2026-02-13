// ─── Types ─────────────────────────────────────────────────────

export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AssistantMessage {
  type: "assistant";
  text: string;
  toolUses: ToolUse[];
  sessionId?: string;
}

export interface ResultMessage {
  type: "result";
  subtype: "success" | string;
  result?: string;
  errors?: string[];
  costUsd?: number;
  numTurns?: number;
  sessionId?: string;
}

export interface SystemMessage {
  type: "system";
  subtype: "init";
  tools?: string[];
  model?: string;
  skills?: string[];
  agents?: string[];
}

export interface SessionMessage {
  type: "session";
  sessionId: string;
}

export interface ErrorMessage {
  type: "error";
  error: string;
}

export interface ToolProgressMessage {
  type: "tool_progress";
  toolName: string;
  toolUseId: string;
  elapsed: number;
}

export type ServerMessage =
  | AssistantMessage
  | ResultMessage
  | SystemMessage
  | SessionMessage
  | ErrorMessage
  | ToolProgressMessage;

// ─── Configuration ─────────────────────────────────────────────

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000";

// ─── WebSocket Client ──────────────────────────────────────────

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface ChatClientOptions {
  onMessage: (msg: ServerMessage) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export class ChatClient {
  private ws: WebSocket | null = null;
  private options: ChatClientOptions;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private intentionalClose = false;

  constructor(options: ChatClientOptions) {
    this.options = options;
  }

  connect(): void {
    this.intentionalClose = false;
    this.options.onStatusChange("connecting");

    let socket: WebSocket;
    try {
      socket = new WebSocket(`${WS_URL}/ws/chat`);
    } catch {
      this.options.onStatusChange("error");
      this.scheduleReconnect();
      return;
    }

    this.ws = socket;

    socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.options.onStatusChange("connected");
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        this.options.onMessage(msg);
      } catch {
        // Ignore malformed messages
      }
    };

    socket.onclose = () => {
      // Only clear this.ws if it's still the same socket (prevents race
      // where a reconnect has already created a newer socket)
      if (this.ws === socket) {
        this.ws = null;
        if (!this.intentionalClose) {
          this.options.onStatusChange("disconnected");
          this.scheduleReconnect();
        }
      }
    };

    socket.onerror = () => {
      if (this.ws === socket) {
        this.options.onStatusChange("error");
      }
    };
  }

  send(message: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "message", message }));
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.options.onStatusChange("disconnected");
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// ─── Assessment HTTP Client ────────────────────────────────────

export interface AssessmentResponse {
  messages: Array<{ type: string; text: string }>;
  result: ResultMessage | null;
}

export async function sendAssessmentMessage(
  code: string,
  learnerName: string,
  message: string
): Promise<AssessmentResponse> {
  const res = await fetch(`${BACKEND_URL}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, learnerName, message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Health Check ──────────────────────────────────────────────

export async function checkBackendStatus(): Promise<{
  status: string;
  sessions: number;
}> {
  const res = await fetch(`${BACKEND_URL}/api/status`);
  if (!res.ok) throw new Error("Backend unavailable");
  return res.json();
}
