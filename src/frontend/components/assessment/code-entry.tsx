"use client";

import { useState } from "react";

interface CodeEntryProps {
  initialCode?: string;
  onSubmit: (code: string, name: string) => void;
}

export default function CodeEntry({ initialCode = "", onSubmit }: CodeEntryProps) {
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
    <div className="min-h-screen flex items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-md">
        {/* Friendly wave illustration */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">👋</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Hey there!
          </h1>
          <p className="text-base text-text-secondary mt-3 leading-relaxed max-w-sm mx-auto">
            Your instructor wants to learn what you already know so they can
            make your session more useful.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Not a test &mdash; no grades, no pressure
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-text-secondary mb-1.5">
              Assessment Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g. TUE-2026-0212"
              className="w-full rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent font-mono tracking-wider text-center text-lg transition-all"
              autoFocus
            />
            <p className="text-xs text-text-tertiary mt-1 text-center">
              Your instructor shared this code with you
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1.5">
              Your First Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="What should we call you?"
              className="w-full rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-accent text-white py-3.5 text-sm font-medium hover:bg-accent-muted transition-colors flex items-center justify-center gap-2"
          >
            Let&apos;s get started
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </form>

        <p className="text-xs text-text-tertiary text-center mt-6">
          Takes about 5 minutes. You can take your time.
        </p>
      </div>
    </div>
  );
}
