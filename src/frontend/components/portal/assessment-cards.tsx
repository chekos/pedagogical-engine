"use client";

import Link from "next/link";
import type { PortalData } from "@/lib/api";

interface AssessmentCardsProps {
  data: PortalData;
}

/** Format an ISO date string to a human-readable date */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Format a domain slug to a readable label */
function domainLabel(domain: string): string {
  return domain.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AssessmentCards({ data }: AssessmentCardsProps) {
  const { assessments } = data;
  const hasAny =
    assessments.completed.length > 0 || assessments.pending.length > 0;

  return (
    <section aria-labelledby="assessments-heading">
      <h2
        id="assessments-heading"
        className="font-heading text-xl font-semibold text-text-primary mb-3"
      >
        Assessments
      </h2>

      {!hasAny ? (
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-5 text-text-secondary text-center">
          No assessments yet. Your educator will assign assessments when ready.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending assessments */}
          {assessments.pending.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Ready to Take
              </h3>
              <ul className="space-y-2" role="list">
                {assessments.pending.map((assessment) => (
                  <li key={assessment.code}>
                    <Link
                      href={`/assess/${assessment.code}`}
                      className="block rounded-xl border border-accent/30 bg-accent/5 p-4 hover:bg-accent/10 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">
                            {domainLabel(assessment.domain)}
                          </p>
                          <p className="text-sm text-text-secondary mt-0.5">
                            {assessment.description}
                          </p>
                        </div>
                        <span
                          className="shrink-0 ml-3 px-3 py-1 text-xs font-medium rounded-full bg-accent text-surface-0"
                          aria-label="Start assessment"
                        >
                          Start
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Completed assessments */}
          {assessments.completed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Completed
              </h3>
              <ul className="space-y-2" role="list">
                {assessments.completed.map((assessment) => (
                  <li
                    key={assessment.code}
                    className="rounded-xl border border-border-subtle bg-surface-1 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">
                          {domainLabel(assessment.domain)}
                        </p>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {assessment.summary}
                        </p>
                      </div>
                      <time
                        dateTime={assessment.date}
                        className="shrink-0 text-xs text-text-tertiary"
                      >
                        {formatDate(assessment.date)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
