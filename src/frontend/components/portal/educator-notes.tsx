"use client";

import type { PortalData } from "@/lib/api";

interface EducatorNotesProps {
  data: PortalData;
}

/** Format an ISO date string to a human-readable date */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function EducatorNotes({ data }: EducatorNotesProps) {
  const { notes } = data;

  if (notes.length === 0) return null;

  return (
    <section aria-labelledby="notes-heading">
      <h2
        id="notes-heading"
        className="font-heading text-xl font-semibold text-text-primary mb-3"
      >
        Notes from Your Educator
      </h2>

      <ul className="space-y-3" role="list">
        {notes.map((note) => (
          <li
            key={note.id}
            className={`rounded-xl border p-4 ${
              note.pinned
                ? "border-accent/40 bg-accent/5"
                : "border-border-subtle bg-surface-1"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {note.pinned && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                    aria-label="Pinned note"
                  >
                    Pinned
                  </span>
                )}
                {note.audienceHint !== "general" && (
                  <span className="text-xs text-text-tertiary">
                    For {note.audienceHint}s
                  </span>
                )}
              </div>
              <time
                dateTime={note.createdAt}
                className="text-xs text-text-tertiary shrink-0"
              >
                {formatDate(note.createdAt)}
              </time>
            </div>
            <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words">
              {note.content}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
