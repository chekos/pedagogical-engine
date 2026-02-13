"use client";

import { useState } from "react";

interface EmbedCodeEntryProps {
  initialCode?: string;
  onSubmit: (code: string, name: string) => void;
}

/**
 * Minimal code entry form for iframe embedding.
 * Compact layout, no decorative elements — fits in small containers.
 */
export default function EmbedCodeEntry({
  initialCode = "",
  onSubmit,
}: EmbedCodeEntryProps) {
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Please enter your assessment code");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    onSubmit(code.trim(), name.trim());
  };

  return (
    <div className="flex items-center justify-center h-screen bg-surface-0 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-5">
          <h1 className="text-lg font-semibold text-text-primary">
            Skill Check
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Quick conversation — not a test, no grades
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="embed-code"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Assessment Code
            </label>
            <input
              id="embed-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g. TUE-2026-0212"
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent font-mono tracking-wider text-center transition-all"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="embed-name"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Your First Name
            </label>
            <input
              id="embed-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="What should we call you?"
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          <div aria-live="assertive" aria-atomic="true">
            {error && (
              <p
                className="text-xs text-red-400 text-center animate-fade-in"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-accent text-white py-2.5 text-sm font-medium hover:bg-accent-muted transition-colors flex items-center justify-center gap-2"
          >
            Start
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
