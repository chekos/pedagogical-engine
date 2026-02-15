"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ExportButton from "@/components/export-button";
import { BACKEND_URL } from "@/lib/constants";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/export/lessons`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load lessons");
        return res.json();
      })
      .then((data) => {
        setLessons(data.lessons || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div>
        <div className="mb-8 border-l-2 border-bloom-apply pl-4">
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>Lesson Plans</h1>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">
            Your teaching sessions — review, rehearse, or go live.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
            {error}. Make sure the backend server is running on port 3000.
          </div>
        )}

        {!loading && !error && lessons.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-tertiary">No lesson plans found.</p>
            <p className="text-sm text-text-tertiary mt-1">
              Use the <Link href="/teach" className="text-accent hover:underline">educator chat</Link> to compose a lesson plan.
            </p>
          </div>
        )}

        <div className="divide-y divide-border-subtle">
          {lessons.map((lessonId) => {
            const parts = lessonId.split("-");
            const date = parts.slice(0, 3).join("-");
            const title = parts.slice(3).join(" ").replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <div
                key={lessonId}
                className="border-l-[3px] border-bloom-apply py-4 pl-4 pr-2 flex items-center justify-between gap-4 hover:bg-surface-1/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <Link href={`/lessons/${lessonId}`} className="group">
                    <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                      {title || lessonId}
                    </h3>
                  </Link>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {date}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/debrief/${lessonId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Debrief
                  </Link>
                  <Link
                    href={`/simulate/${lessonId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Rehearse
                  </Link>
                  <Link
                    href={`/teach/live/${lessonId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20 hover:bg-green-500/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
                    </svg>
                    Go Live
                  </Link>
                  <ExportButton
                    href={`/api/export/lesson/${lessonId}`}
                    label="Lesson PDF"
                    filename={`lesson-${lessonId}.pdf`}
                    variant="primary"
                    size="sm"
                  />
                  <ExportButton
                    href={`/api/export/lesson/${lessonId}/prerequisites`}
                    label="Prerequisites"
                    filename={`prerequisites-${lessonId}.pdf`}
                    variant="secondary"
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}
