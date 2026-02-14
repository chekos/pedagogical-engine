"use client";

import { useEffect } from "react";
import type { ConnectionStatus } from "@/lib/api";

export interface SessionContext {
  groupName: string | null;
  domain: string | null;
  constraints: string[];
  learnersAssessed: number;
  learnerNames: string[];
  skillsDiscussed: string[];
}

export const EMPTY_SESSION_CONTEXT: SessionContext = {
  groupName: null,
  domain: null,
  constraints: [],
  learnersAssessed: 0,
  learnerNames: [],
  skillsDiscussed: [],
};

interface SessionContextSidebarProps {
  context: SessionContext;
  connectionStatus: ConnectionStatus;
  collapsed: boolean;
  onToggle: () => void;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium mb-1.5">
      {children}
    </h3>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-text-tertiary italic">{children}</p>
  );
}

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connected: "bg-green-400",
  connecting: "bg-yellow-400",
  disconnected: "bg-gray-400",
  error: "bg-red-400",
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: "Connected",
  connecting: "Connecting...",
  disconnected: "Disconnected",
  error: "Error",
};

export default function SessionContextSidebar({
  context,
  connectionStatus,
  collapsed,
  onToggle,
}: SessionContextSidebarProps) {
  // Close on Escape key
  useEffect(() => {
    if (collapsed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, onToggle]);

  const hasAnyContext =
    context.groupName ||
    context.domain ||
    context.constraints.length > 0 ||
    context.learnersAssessed > 0 ||
    context.skillsDiscussed.length > 0;

  return (
    <>
      {/* Toggle button — always visible on the right edge */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Show session context" : "Hide session context"}
        className={`absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 items-center justify-center bg-surface-1 border border-r-0 border-border-subtle rounded-l-lg hover:bg-surface-2 transition-all duration-300 hidden md:flex ${
          collapsed ? "right-0" : "right-[280px]"
        }`}
      >
        <svg
          className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Sidebar panel */}
      <div
        className={`absolute right-0 top-0 h-full z-10 bg-surface-1 border-l border-border-subtle transition-all duration-300 ease-in-out overflow-hidden ${
          collapsed ? "w-0 opacity-0" : "w-[280px] opacity-100"
        } hidden md:block`}
      >
        <div className="w-[280px] h-full overflow-y-auto px-4 py-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base text-text-primary">Session</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[connectionStatus]}`} />
              <span className="text-[10px] text-text-tertiary">{STATUS_LABEL[connectionStatus]}</span>
            </div>
          </div>

          {!hasAnyContext && (
            <div className="pt-2">
              <EmptyHint>
                Context will appear here as the conversation unfolds — group, domain, constraints, skills discussed.
              </EmptyHint>
            </div>
          )}

          {/* Group */}
          {context.groupName && (
            <div>
              <SectionHeading>Group</SectionHeading>
              <p className="text-sm font-medium text-text-primary">{context.groupName}</p>
              {context.learnersAssessed > 0 && (
                <p className="text-xs text-text-secondary mt-1">
                  {context.learnersAssessed} learner{context.learnersAssessed !== 1 ? "s" : ""} assessed
                </p>
              )}
              {context.learnerNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {context.learnerNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-surface-2 text-text-secondary"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Domain */}
          {context.domain && (
            <div>
              <SectionHeading>Domain</SectionHeading>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                {context.domain.replace(/-/g, " ")}
              </span>
            </div>
          )}

          {/* Constraints */}
          {context.constraints.length > 0 && (
            <div>
              <SectionHeading>Constraints</SectionHeading>
              <ul className="space-y-1">
                {context.constraints.map((c, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                    <span className="text-text-tertiary mt-0.5 shrink-0">·</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills discussed */}
          {context.skillsDiscussed.length > 0 && (
            <div>
              <SectionHeading>Skills Discussed</SectionHeading>
              <div className="flex flex-wrap gap-1">
                {context.skillsDiscussed.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-surface-2 text-text-secondary font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {!collapsed && (
        <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-label="Session context">
          <div className="absolute inset-0 bg-black/30" onClick={onToggle} aria-hidden="true" />
          <div className="absolute right-0 top-0 h-full w-[280px] bg-surface-1 border-l border-border-subtle animate-slide-in-right overflow-y-auto px-4 py-5 space-y-5">
            {/* Close button */}
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base text-text-primary">Session</h2>
              <button onClick={onToggle} aria-label="Close session context" className="p-1 text-text-tertiary hover:text-text-primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[connectionStatus]}`} />
              <span className="text-[10px] text-text-tertiary">{STATUS_LABEL[connectionStatus]}</span>
            </div>

            {!hasAnyContext && (
              <EmptyHint>
                Context will appear here as the conversation unfolds.
              </EmptyHint>
            )}

            {context.groupName && (
              <div>
                <SectionHeading>Group</SectionHeading>
                <p className="text-sm font-medium text-text-primary">{context.groupName}</p>
                {context.learnersAssessed > 0 && (
                  <p className="text-xs text-text-secondary mt-1">
                    {context.learnersAssessed} learner{context.learnersAssessed !== 1 ? "s" : ""} assessed
                  </p>
                )}
                {context.learnerNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {context.learnerNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-surface-2 text-text-secondary"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {context.domain && (
              <div>
                <SectionHeading>Domain</SectionHeading>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  {context.domain.replace(/-/g, " ")}
                </span>
              </div>
            )}

            {context.constraints.length > 0 && (
              <div>
                <SectionHeading>Constraints</SectionHeading>
                <ul className="space-y-1">
                  {context.constraints.map((c, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                      <span className="text-text-tertiary mt-0.5 shrink-0">·</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {context.skillsDiscussed.length > 0 && (
              <div>
                <SectionHeading>Skills Discussed</SectionHeading>
                <div className="flex flex-wrap gap-1">
                  {context.skillsDiscussed.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-surface-2 text-text-secondary font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
