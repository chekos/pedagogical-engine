"use client";

import type { PortalData } from "@/lib/api";
import { getPortalStrings, t } from "@/lib/portal-i18n";

interface EducatorNotesProps {
  data: PortalData;
}

/** Format an ISO date string to a human-readable date in the portal language */
function formatDate(dateStr: string, lang: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat(lang, {
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
  const s = getPortalStrings(data.language);

  if (notes.length === 0) return null;

  return (
    <section aria-labelledby="notes-heading">
      <h2
        id="notes-heading"
        className="font-heading text-xl font-semibold text-text-primary mb-3"
      >
        {s.notesFromEducator}
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
                    aria-label={s.pinned}
                  >
                    {s.pinned}
                  </span>
                )}
                {note.audienceHint !== "general" && (
                  <span className="text-xs text-text-tertiary">
                    {t(s.forAudience, { audience: note.audienceHint })}
                  </span>
                )}
              </div>
              <time
                dateTime={note.createdAt}
                className="text-xs text-text-tertiary shrink-0"
              >
                {formatDate(note.createdAt, data.language)}
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
