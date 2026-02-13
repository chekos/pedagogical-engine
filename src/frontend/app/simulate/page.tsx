"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/lib/constants";

interface LessonListItem {
  id: string;
  title: string;
  domain: string;
  group: string;
  date: string;
}

export default function SimulateIndexPage() {
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/lessons`)
      .then((res) => res.json())
      .then((data) => {
        setLessons(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.lessons || []).map((l: any) => {
            if (typeof l === "string") {
              return { id: l, title: l, domain: "", group: "", date: "" };
            }
            return {
              id: l.id || "",
              title: l.title || l.id || "",
              domain: l.domain || "",
              group: l.group || "",
              date: l.date || "",
            };
          })
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface-0">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary">
            Pedagogical Engine
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/teach"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Teach
          </Link>
          <Link
            href="/lessons"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Lessons
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            Lesson Simulation
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Rehearse a lesson plan against your group&apos;s actual learner
            profiles. See where the friction will be before you walk into the
            room.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {!loading && lessons.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-tertiary">No lesson plans found.</p>
            <p className="text-sm text-text-tertiary mt-1">
              Use the{" "}
              <Link href="/teach" className="text-accent hover:underline">
                educator chat
              </Link>{" "}
              to compose a lesson plan first.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/simulate/${lesson.id}`}
              className="block rounded-xl border border-border bg-surface-1 p-5 hover:border-accent/30 hover:bg-surface-2 transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {lesson.date && `${lesson.date} · `}
                    {lesson.domain && `${lesson.domain} · `}
                    {lesson.group}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium">Simulate</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
