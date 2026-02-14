"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const BENEFITS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Google Docs",
    description: "Export lesson plans directly to formatted Google Docs — ready to print or share.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
      </svg>
    ),
    title: "Google Sheets",
    description: "Import rosters from Sheets and export assessment results as skill matrices.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    title: "Google Classroom",
    description: "Sync student rosters from your Classroom courses automatically.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    title: "Share & Collaborate",
    description: "Share lesson plans and reports with colleagues directly from the engine.",
  },
];

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const initialStep = parseInt(searchParams.get("step") || "1", 10);
  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);

  // Check if already connected on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/google/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.connected) {
          setEmail(data.email);
          setServices(data.services || []);
          setStep(3);
        }
      })
      .catch(() => {});
  }, []);

  // When step changes to 3, re-check status
  useEffect(() => {
    if (step === 3 && !email) {
      fetch(`${API_BASE}/api/auth/google/status`)
        .then((r) => r.json())
        .then((data) => {
          if (data.connected) {
            setEmail(data.email);
            setServices(data.services || []);
          }
        })
        .catch(() => {});
    }
  }, [step, email]);

  const handleConnect = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/google/start`);
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                s === step
                  ? "bg-accent"
                  : s < step
                    ? "bg-accent/50"
                    : "bg-surface-3"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Value prop */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-heading font-bold text-text-primary">
                Connect Google Workspace
              </h1>
              <p className="text-sm text-text-secondary">
                Bring the engine into your existing workflow. Export, import, and
                share — without leaving the conversation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl border border-border-subtle bg-surface-1 p-4 space-y-2"
                >
                  <div className="text-accent">{b.icon}</div>
                  <p className="text-sm font-medium text-text-primary">
                    {b.title}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {b.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConnect}
                className="w-full py-3 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-muted transition-colors"
              >
                Connect with Google
              </button>
              <Link
                href="/teach"
                className="block w-full py-3 rounded-lg bg-surface-1 border border-border-subtle text-text-secondary text-sm font-medium text-center hover:bg-surface-2 transition-colors"
              >
                Skip for now
              </Link>
            </div>

            <p className="text-xs text-text-tertiary text-center">
              You can connect later from any conversation. We only request
              access to files you create through the engine.
            </p>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-heading font-bold text-text-primary">
                Connected
              </h1>
              {email && (
                <p className="text-sm text-text-secondary">{email}</p>
              )}
            </div>

            {/* Service checklist */}
            <div className="rounded-xl border border-border-subtle bg-surface-1 p-4 space-y-3">
              {["docs", "sheets", "drive", "classroom"].map((svc) => {
                const active = services.includes(svc);
                const labels: Record<string, string> = {
                  docs: "Google Docs",
                  sheets: "Google Sheets",
                  drive: "Google Drive",
                  classroom: "Google Classroom",
                };
                return (
                  <div key={svc} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        active
                          ? "bg-green-500/20 text-green-500"
                          : "bg-surface-3 text-text-tertiary"
                      }`}
                    >
                      {active ? (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        active ? "text-text-primary" : "text-text-tertiary"
                      }`}
                    >
                      {labels[svc] || svc}
                    </span>
                  </div>
                );
              })}
            </div>

            <Link
              href="/teach"
              className="block w-full py-3 rounded-lg bg-accent text-white text-sm font-medium text-center hover:bg-accent-muted transition-colors"
            >
              Start planning
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
