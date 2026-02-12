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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">Skill Assessment</h1>
          <p className="text-sm text-text-secondary mt-2">
            Enter your assessment code and name to begin
          </p>
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
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1.5">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="First and last name"
              className="w-full rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-accent text-white py-3 text-sm font-medium hover:bg-accent-muted transition-colors"
          >
            Start Assessment
          </button>
        </form>

        <p className="text-xs text-text-tertiary text-center mt-6">
          Your assessment code was provided by your educator
        </p>
      </div>
    </div>
  );
}
