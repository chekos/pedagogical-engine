"use client";

import { useState } from "react";
import { BACKEND_URL } from "@/lib/constants";

interface ExportButtonProps {
  /** The export endpoint path, e.g. "/api/export/lesson/my-lesson-id" */
  href: string;
  /** Button label */
  label: string;
  /** Optional filename for the download */
  filename?: string;
  /** Button style variant */
  variant?: "primary" | "secondary" | "ghost";
  /** Size variant */
  size?: "sm" | "md";
}

export default function ExportButton({
  href,
  label,
  filename,
  variant = "secondary",
  size = "sm",
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}${href}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || getFilenameFromUrl(href);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const baseClasses =
    size === "sm"
      ? "px-3 py-1.5 text-xs rounded-lg"
      : "px-4 py-2 text-sm rounded-xl";

  const variantClasses =
    variant === "primary"
      ? "bg-accent text-white hover:bg-accent-muted"
      : variant === "ghost"
        ? "text-text-secondary hover:text-text-primary hover:bg-surface-2"
        : "border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2";

  return (
    <div className="inline-flex flex-col items-start">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 font-medium transition-all ${baseClasses} ${variantClasses} ${
          loading ? "opacity-50 cursor-wait" : ""
        }`}
      >
        {loading ? (
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        {label}
      </button>
      {error && <span className="text-[10px] text-red-400 mt-1" role="alert">{error}</span>}
    </div>
  );
}

function getFilenameFromUrl(href: string): string {
  const parts = href.split("/");
  const id = parts[parts.length - 1] || "export";
  return `${id}.pdf`;
}
