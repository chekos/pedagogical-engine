"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface GoogleConnectCardProps {
  reason: string;
  onConnected?: () => void;
}

export default function GoogleConnectCard({
  reason,
  onConnected,
}: GoogleConnectCardProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "connected" | "error">("idle");

  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/google/status`);
      const data = await res.json();
      if (data.connected) {
        setStatus("connected");
        onConnected?.();
      }
    } catch {
      // Ignore — will retry
    }
  }, [onConnected]);

  const handleConnect = useCallback(async () => {
    setStatus("pending");

    // Fetch a fresh auth URL from the server (not from tool input — tool output isn't exposed to frontend)
    let authUrl: string;
    try {
      const res = await fetch(`${API_BASE}/api/auth/google/start`);
      const data = await res.json();
      authUrl = data.url;
    } catch {
      setStatus("error");
      return;
    }

    if (!authUrl) {
      setStatus("error");
      return;
    }

    const popup = window.open(
      authUrl,
      "google-oauth",
      "width=500,height=700,left=200,top=100"
    );

    // Poll for popup close
    const interval = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(interval);
        checkConnection();
      }
    }, 500);
  }, [checkConnection]);

  // Also listen for localStorage signal from callback page
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "google-oauth-connected" && e.newValue === "true") {
        localStorage.removeItem("google-oauth-connected");
        setStatus("connected");
        onConnected?.();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [onConnected]);

  if (status === "connected") {
    return (
      <div className="animate-fade-in rounded-xl border border-green-500/30 bg-green-500/5 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-text-primary">
            Google account connected
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-xl border border-accent/30 bg-accent/5 p-4 md:p-5 space-y-4">
      {/* Header with Google icon */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-border-subtle">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">
            Connect Google Account
          </p>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            {reason}
          </p>
        </div>
      </div>

      {/* Connect button */}
      <button
        type="button"
        onClick={handleConnect}
        disabled={status === "pending"}
        className={`
          w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
          ${
            status === "pending"
              ? "bg-surface-2 text-text-tertiary cursor-wait"
              : "bg-accent text-white hover:bg-accent-muted cursor-pointer"
          }
        `}
      >
        {status === "pending" ? (
          <span className="animate-pulse-subtle">Waiting for authorization...</span>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect with Google
          </>
        )}
      </button>

      {status === "error" && (
        <p className="text-xs text-red-400">
          Connection failed. Please try again.
        </p>
      )}
    </div>
  );
}
