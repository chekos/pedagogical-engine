import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR } from "../tools/shared.js";

const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

const TOKEN_PATH = path.join(DATA_DIR, "auth", "google-tokens.json");
const CACHE_TTL_MS = 60_000;

interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

interface AuthStatus {
  connected: boolean;
  email: string | null;
  services: string[];
}

// CSRF state entries: state string → { createdAt }
const pendingStates = new Map<string, { createdAt: number }>();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export class GoogleAuthManager {
  private client: InstanceType<typeof google.auth.OAuth2> | null = null;
  private cachedStatus: AuthStatus | null = null;
  private cacheTimestamp = 0;

  /** Lazy-init the OAuth2 client so env vars are read at first use, not at import time */
  private ensureClient(): InstanceType<typeof google.auth.OAuth2> {
    if (this.client) return this.client;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/auth/google/callback";

    if (!clientId || !clientSecret) {
      console.warn(
        "[google-auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google integration disabled"
      );
    }

    this.client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Auto-persist refreshed tokens
    this.client.on("tokens", (tokens) => {
      this.saveTokensMerge(tokens as Record<string, unknown>).catch((err) => {
        console.error("[google-auth] Failed to persist refreshed tokens:", err);
      });
    });

    return this.client;
  }

  getClient() {
    return this.ensureClient();
  }

  /** Generate the Google OAuth consent URL with CSRF state */
  generateAuthUrl(): { url: string; state: string } {
    // Cleanup expired states
    const now = Date.now();
    for (const [s, entry] of pendingStates) {
      if (now - entry.createdAt > STATE_EXPIRY_MS) pendingStates.delete(s);
    }

    const state = crypto.randomUUID();
    pendingStates.set(state, { createdAt: now });

    const url = this.ensureClient().generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      state,
      prompt: "consent",
    });

    return { url, state };
  }

  /** Validate CSRF state from callback */
  validateState(state: string): boolean {
    if (!pendingStates.has(state)) return false;
    pendingStates.delete(state);
    return true;
  }

  /** Exchange authorization code for tokens */
  async handleCallback(code: string): Promise<void> {
    const client = this.ensureClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    await this.saveTokens(tokens as TokenData);
    this.invalidateCache();
  }

  /** Load tokens from disk on startup */
  async loadTokens(): Promise<boolean> {
    try {
      const raw = await fs.readFile(TOKEN_PATH, "utf-8");
      const tokens = JSON.parse(raw) as TokenData;
      this.ensureClient().setCredentials(tokens);
      console.log("[google-auth] Loaded tokens from disk");
      return true;
    } catch {
      return false;
    }
  }

  /** Save tokens to disk */
  private async saveTokens(tokens: TokenData): Promise<void> {
    const dir = path.dirname(TOKEN_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf-8");
  }

  /** Merge new tokens (from refresh) with existing ones on disk */
  private async saveTokensMerge(
    tokens: Record<string, unknown>
  ): Promise<void> {
    let existing: Record<string, unknown> = {};
    try {
      const raw = await fs.readFile(TOKEN_PATH, "utf-8");
      existing = JSON.parse(raw);
    } catch {
      // No existing file
    }
    const merged = { ...existing, ...tokens };
    await this.saveTokens(merged as unknown as TokenData);
    this.invalidateCache();
  }

  /** Get connection status (cached with TTL) */
  async getStatus(forceRefresh = false): Promise<AuthStatus> {
    const now = Date.now();
    if (!forceRefresh && this.cachedStatus && now - this.cacheTimestamp < CACHE_TTL_MS) {
      return this.cachedStatus;
    }

    const client = this.ensureClient();
    const credentials = client.credentials;
    if (!credentials.access_token && !credentials.refresh_token) {
      const status: AuthStatus = { connected: false, email: null, services: [] };
      this.cachedStatus = status;
      this.cacheTimestamp = now;
      return status;
    }

    try {
      // Try to get user email to verify connection
      const oauth2 = google.oauth2({ version: "v2", auth: client });
      const { data } = await oauth2.userinfo.get();

      const services: string[] = [];
      const scope = credentials.scope || "";
      if (scope.includes("documents")) services.push("docs");
      if (scope.includes("spreadsheets")) services.push("sheets");
      if (scope.includes("drive")) services.push("drive");
      if (scope.includes("classroom")) services.push("classroom");

      const status: AuthStatus = {
        connected: true,
        email: data.email || null,
        services,
      };
      this.cachedStatus = status;
      this.cacheTimestamp = now;
      return status;
    } catch {
      const status: AuthStatus = { connected: false, email: null, services: [] };
      this.cachedStatus = status;
      this.cacheTimestamp = now;
      return status;
    }
  }

  /** Clear cached status */
  invalidateCache(): void {
    this.cachedStatus = null;
    this.cacheTimestamp = 0;
  }

  /** Disconnect — delete tokens and clear credentials */
  async disconnect(): Promise<void> {
    const client = this.ensureClient();
    client.revokeCredentials().catch(() => {
      // Best effort — revocation may fail if tokens are already expired
    });
    client.setCredentials({});
    this.invalidateCache();
    try {
      await fs.unlink(TOKEN_PATH);
    } catch {
      // File may not exist
    }
  }
}

// Singleton instance
export const googleAuth = new GoogleAuthManager();
