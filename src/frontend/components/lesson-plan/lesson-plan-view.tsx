"use client";

import { useState } from "react";
import ExportButton from "@/components/export-button";

interface LessonPlanViewProps {
  content: string;
  /** Lesson file ID (e.g. "2026-02-12-pandas-groupby-tuesday-cohort") for enabling exports */
  lessonId?: string;
}

interface LessonSection {
  title: string;
  content: string;
  timing?: string;
}

function parseLessonPlan(raw: string): { title: string; sections: LessonSection[] } {
  const lines = raw.split("\n");
  let title = "Lesson Plan";
  const sections: LessonSection[] = [];
  let currentSection: LessonSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    // Top-level title
    const h1Match = line.match(/^# (.+)/);
    if (h1Match) {
      title = h1Match[1];
      continue;
    }

    // Section header
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);
    const headerMatch = h2Match || h3Match;

    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join("\n").trim();
        sections.push(currentSection);
      }

      // Extract timing from header like "## Activity Name (15 min)"
      const timingMatch = headerMatch[1].match(/(.+?)\s*\((\d+\s*min(?:utes?)?)\)\s*$/i);
      currentSection = {
        title: timingMatch ? timingMatch[1].trim() : headerMatch[1].trim(),
        content: "",
        timing: timingMatch ? timingMatch[2] : undefined,
      };
      contentLines = [];
      continue;
    }

    contentLines.push(line);
  }

  // Last section
  if (currentSection) {
    currentSection.content = contentLines.join("\n").trim();
    sections.push(currentSection);
  }

  // If no sections were found, treat the whole thing as one section
  if (sections.length === 0 && raw.trim()) {
    sections.push({ title: "Content", content: raw.trim() });
  }

  return { title, sections };
}

const SECTION_COLORS = [
  "border-l-indigo-400",
  "border-l-emerald-400",
  "border-l-amber-400",
  "border-l-rose-400",
  "border-l-cyan-400",
  "border-l-purple-400",
  "border-l-orange-400",
  "border-l-teal-400",
];

export default function LessonPlanView({ content, lessonId }: LessonPlanViewProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { title, sections } = parseLessonPlan(content);

  const totalMinutes = sections.reduce((sum, s) => {
    if (!s.timing) return sum;
    const match = s.timing.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  return (
    <div className="animate-slide-up rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-surface-2 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-text-tertiary">
                {sections.length} section{sections.length !== 1 ? "s" : ""}
              </span>
              {totalMinutes > 0 && (
                <span className="text-xs text-text-tertiary">
                  {totalMinutes} minutes total
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lessonId && (
            <>
              <ExportButton
                href={`/api/export/lesson/${lessonId}`}
                label="PDF"
                filename={`lesson-${lessonId}.pdf`}
                variant="ghost"
                size="sm"
              />
              <ExportButton
                href={`/api/export/lesson/${lessonId}/prerequisites`}
                label="Prereqs"
                filename={`prerequisites-${lessonId}.pdf`}
                variant="ghost"
                size="sm"
              />
            </>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-text-tertiary hover:text-text-primary transition-colors p-1"
          >
            <svg
              className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timeline */}
      {!collapsed && totalMinutes > 0 && (
        <div className="px-5 py-3 border-b border-border-subtle">
          <div className="flex rounded-full overflow-hidden h-2 bg-surface-3">
            {sections
              .filter((s) => s.timing)
              .map((s, i) => {
                const match = s.timing!.match(/(\d+)/);
                const min = match ? parseInt(match[1], 10) : 0;
                const pct = (min / totalMinutes) * 100;
                const colors = [
                  "bg-indigo-400",
                  "bg-emerald-400",
                  "bg-amber-400",
                  "bg-rose-400",
                  "bg-cyan-400",
                  "bg-purple-400",
                ];
                return (
                  <div
                    key={i}
                    className={`${colors[i % colors.length]} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${s.title}: ${s.timing}`}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* Sections */}
      {!collapsed && (
        <div className="divide-y divide-border-subtle">
          {sections.map((section, i) => (
            <div
              key={i}
              className={`px-5 py-4 border-l-3 ${SECTION_COLORS[i % SECTION_COLORS.length]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-primary">{section.title}</h4>
                {section.timing && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-3 text-text-secondary">
                    {section.timing}
                  </span>
                )}
              </div>
              <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
