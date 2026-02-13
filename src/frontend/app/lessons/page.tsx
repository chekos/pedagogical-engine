"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ExportButton from "@/components/export-button";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

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
    <div className="min-h-screen bg-surface-0">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-text-primary">Pedagogical Engine</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/teach" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Teach
          </Link>
          <Link href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/domains" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Domains
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Lesson Plans</h1>
          <p className="text-sm text-text-secondary mt-1">
            Generated lesson plans with PDF export. Download lesson plans, prerequisites handouts, and more.
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

        <div className="space-y-3">
          {lessons.map((lessonId) => {
            const parts = lessonId.split("-");
            const date = parts.slice(0, 3).join("-");
            const title = parts.slice(3).join(" ").replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <div
                key={lessonId}
                className="rounded-xl border border-border bg-surface-1 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {title || lessonId}
                  </h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {date} &middot; {lessonId}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
      </main>
    </div>
  );
}
