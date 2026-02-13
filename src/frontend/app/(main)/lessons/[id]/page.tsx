"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ExportButton from "@/components/export-button";
import { BACKEND_URL } from "@/lib/constants";

interface LessonData {
  meta: {
    title: string;
    group: string;
    date: string;
    domain: string;
    duration: number;
    topic: string;
    oneThing: string;
  };
  objectives: string[];
  sections: { title: string; body: string }[];
  fullMarkdown: string;
}

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/lessons/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Lesson not found");
        return res.json();
      })
      .then((data) => {
        setLesson(data.lesson);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 mb-4">{error || "Lesson not found"}</p>
        <Link href="/lessons" className="text-accent hover:underline text-sm">
          Back to lessons
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <Link href="/lessons" className="hover:text-text-primary transition-colors">
            Lessons
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{lesson.meta.title || id}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/debrief/${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            Debrief
          </Link>
          <Link
            href={`/simulate/${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
          >
            Rehearse
          </Link>
          <Link
            href={`/teach/live/${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20 hover:bg-green-500/20 transition-colors"
          >
            Go Live
          </Link>
          <ExportButton
            href={`/api/export/lesson/${id}`}
            label="PDF"
            filename={`lesson-${id}.pdf`}
            variant="primary"
            size="sm"
          />
          <ExportButton
            href={`/api/export/lesson/${id}/prerequisites`}
            label="Prerequisites"
            filename={`prerequisites-${id}.pdf`}
            variant="secondary"
            size="sm"
          />
        </div>
      </div>

      {/* Lesson content */}
      <article className="prose-lesson">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {lesson.fullMarkdown}
        </ReactMarkdown>
      </article>
    </div>
  );
}
