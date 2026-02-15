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
  creativeLabels?: Record<string, string>;
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

export interface StreamDeltaMessage {
  type: "stream_delta";
  text: string;
}

export interface SessionContextMessage {
  type: "session_context";
  context: {
    groupName: string | null;
    domain: string | null;
    constraints: string[];
    learnerNames: string[];
    skillsDiscussed: string[];
  };
}

export interface CreatedFile {
  filePath: string;
  title: string;
  fileType: "doc" | "slides" | "sheet" | "pdf";
  status: "local" | "uploaded";
  url?: string;
  fileId?: string;
  toolUseId?: string;
  downloadUrl?: string;
}

export interface FileCreatedMessage {
  type: "file_created";
  file: CreatedFile;
  toolUseId?: string;
}

export type ServerMessage =
  | AssistantMessage
  | ResultMessage
  | SystemMessage
  | SessionMessage
  | ErrorMessage
  | ToolProgressMessage
  | StreamDeltaMessage
  | SessionContextMessage
  | FileCreatedMessage;

// ─── Configuration ─────────────────────────────────────────────

import { BACKEND_URL, WS_URL } from "./constants";

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
  private _sessionId: string | null = null;

  constructor(options: ChatClientOptions) {
    this.options = options;
  }

  get sessionId(): string | null {
    return this._sessionId;
  }

  connect(reconnectSessionId?: string): void {
    this.intentionalClose = false;
    this.options.onStatusChange("connecting");

    const url = reconnectSessionId
      ? `${WS_URL}/ws/chat?sessionId=${encodeURIComponent(reconnectSessionId)}`
      : `${WS_URL}/ws/chat`;

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
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
        if (msg.type === "session" && "sessionId" in msg) {
          this._sessionId = msg.sessionId;
        }
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
      this.connect(this._sessionId ?? undefined);
    }, delay);
  }
}

// ─── Live Companion WebSocket Client ────────────────────────────

export interface LiveClientOptions {
  lessonId: string;
  onMessage: (msg: ServerMessage) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export class LiveClient {
  private ws: WebSocket | null = null;
  private options: LiveClientOptions;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private intentionalClose = false;

  constructor(options: LiveClientOptions) {
    this.options = options;
  }

  connect(): void {
    this.intentionalClose = false;
    this.options.onStatusChange("connecting");

    let socket: WebSocket;
    try {
      socket = new WebSocket(
        `${WS_URL}/ws/live?lessonId=${encodeURIComponent(this.options.lessonId)}`
      );
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

  send(message: string, sectionContext?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "message", message, sectionContext }));
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

// ─── Lesson HTTP Client ───────────────────────────────────────

export interface LessonMeta {
  title: string;
  group: string;
  date: string;
  domain: string;
  duration: number;
  topic: string;
  oneThing: string;
}

export interface LessonSection {
  id: string;
  phase: string;
  title: string;
  startMin: number;
  endMin: number;
  durationMin: number;
  content: string;
  activities: string[];
}

export interface ParsedLesson {
  meta: LessonMeta;
  sections: LessonSection[];
  objectives: string[];
  fullMarkdown: string;
}

export async function fetchLesson(id: string): Promise<ParsedLesson> {
  const res = await fetch(`${BACKEND_URL}/api/lessons/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Lesson '${id}' not found`);
  const data = await res.json();
  return data.lesson;
}

export async function submitSectionFeedback(
  lessonId: string,
  sectionId: string,
  feedback: "went-well" | "struggled" | "skipped",
  elapsedMin?: number,
  notes?: string
): Promise<void> {
  await fetch(`${BACKEND_URL}/api/lessons/${encodeURIComponent(lessonId)}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sectionId, feedback, elapsedMin, notes }),
  });
}

// ─── Assessment HTTP Client ────────────────────────────────────

export interface AssessmentResponse {
  messages: Array<{ type: string; text: string }>;
  result: ResultMessage | null;
  assessmentComplete?: boolean;
  coveredSkills?: Array<{ skillId: string; skillLabel: string }>;
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

// ─── Simulation HTTP Client ───────────────────────────────────

export interface LearnerSectionStatus {
  learnerId: string;
  learnerName: string;
  readiness: "ready" | "partial" | "gap";
  confidence: number;
  missingSkills: string[];
  weakSkills: Array<{ skillId: string; confidence: number }>;
}

export interface FrictionPoint {
  sectionIndex: number;
  sectionTitle: string;
  startMin: number;
  severity: number;
  affectedCount: number;
  totalCount: number;
  affectedLearners: Array<{ id: string; name: string; missingSkills: string[] }>;
  description: string;
}

export interface CollisionMoment {
  sectionIndex: number;
  sectionTitle: string;
  startMin: number;
  simultaneousGaps: number;
  commonGapSkills: string[];
  description: string;
}

export interface CascadeRisk {
  upstreamSection: number;
  upstreamTitle: string;
  downstreamSection: number;
  downstreamTitle: string;
  affectedLearners: string[];
  chainedSkills: string[];
  description: string;
}

export interface PivotSuggestion {
  sectionIndex: number;
  type: "reteach" | "pair" | "substitute" | "restructure";
  description: string;
  timeCostMin: number;
}

export interface SectionAnalysis {
  sectionIndex: number;
  sectionTitle: string;
  startMin: number;
  endMin: number;
  requiredSkills: string[];
  taughtSkills: string[];
  learnerStatuses: LearnerSectionStatus[];
  readyCount: number;
  partialCount: number;
  gapCount: number;
}

export interface SimulationResult {
  lessonId: string;
  lessonTitle: string;
  groupName: string;
  domain: string;
  overallConfidence: number;
  sectionAnalysis: SectionAnalysis[];
  frictionPoints: FrictionPoint[];
  collisionMoments: CollisionMoment[];
  cascadeRisks: CascadeRisk[];
  pivotSuggestions: PivotSuggestion[];
}

export async function fetchSimulation(
  lessonId: string,
  domain?: string,
  group?: string
): Promise<SimulationResult> {
  const params = new URLSearchParams();
  if (domain) params.set("domain", domain);
  if (group) params.set("group", group);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(
    `${BACKEND_URL}/api/simulate/${encodeURIComponent(lessonId)}${qs}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.simulation;
}

// ─── Assessment Integrity Report ─────────────────────────────

export interface IntegrityLearnerReport {
  id: string;
  name: string;
  integrityLevel: "high" | "moderate" | "low" | "not_analyzed" | "not_assessed";
  integrityModifier: number | null;
  integrityNotes: string;
  flaggedSkills: string[];
  hasIntegrityAdjusted: boolean;
  assessedSkillCount: number;
  lastAssessed: string | null;
}

export interface IntegrityReport {
  group: string;
  domain: string;
  summary: {
    total: number;
    assessed: number;
    notAssessed: number;
    highIntegrity: number;
    moderateIntegrity: number;
    lowIntegrity: number;
    notAnalyzed: number;
  };
  learners: IntegrityLearnerReport[];
}

export async function fetchIntegrityReport(
  groupName: string,
  domain: string
): Promise<IntegrityReport> {
  const res = await fetch(
    `${BACKEND_URL}/api/assess/integrity/${encodeURIComponent(groupName)}/${encodeURIComponent(domain)}`
  );
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

// ─── Domain & Group Discovery ─────────────────────────────────

export interface DomainSummary {
  slug: string;
  name: string;
  description: string;
  stats: { skills: number; dependencies: number };
}

export interface DomainDetail {
  slug: string;
  skills: Array<{
    id: string;
    label: string;
    bloom_level: string;
    assessable: boolean;
    dependencies: string[];
  }>;
  edges: Array<{
    source: string;
    target: string;
    confidence: number;
    type: string;
  }>;
}

export interface GroupSummary {
  slug: string;
  name: string;
  domain: string;
  memberCount: number;
  members: Array<{ id: string; name: string }>;
}

export interface GroupStatus {
  group: string;
  domain: string;
  summary: {
    total: number;
    completed: number;
    notStarted: number;
    completionRate: number;
  };
  learners: Array<{
    id: string;
    name: string;
    status: "completed" | "not_started" | "in_progress";
    skillCount: number;
    skills: Record<string, { confidence: number; type: string; soloLevel?: string }>;
  }>;
  skillNames: string[];
}

export async function fetchDomains(): Promise<DomainSummary[]> {
  const res = await fetch(`${BACKEND_URL}/api/domains`);
  if (!res.ok) throw new Error("Failed to fetch domains");
  const data = await res.json();
  return data.domains;
}

export async function fetchDomainDetail(slug: string): Promise<DomainDetail> {
  const res = await fetch(`${BACKEND_URL}/api/domains/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`Domain '${slug}' not found`);
  const data = await res.json();
  return data;
}

export async function fetchGroups(): Promise<GroupSummary[]> {
  const res = await fetch(`${BACKEND_URL}/api/groups`);
  if (!res.ok) throw new Error("Failed to fetch groups");
  const data = await res.json();
  return data.groups;
}

export async function fetchGroupStatus(
  group: string,
  domain: string
): Promise<GroupStatus> {
  const res = await fetch(
    `${BACKEND_URL}/api/assess/status/${encodeURIComponent(group)}/${encodeURIComponent(domain)}`
  );
  if (!res.ok) throw new Error(`Group status not found for ${group}/${domain}`);
  return res.json();
}
