"use client";

import { useState } from "react";
import type { CreatedFile } from "@/lib/api";
import { BACKEND_URL } from "@/lib/constants";

const FILE_TYPE_CONFIG: Record<
  CreatedFile["fileType"],
  { color: string; bgColor: string; label: string }
> = {
  doc: { color: "text-blue-400", bgColor: "bg-blue-500/10", label: "Document" },
  slides: { color: "text-yellow-400", bgColor: "bg-yellow-500/10", label: "Presentation" },
  sheet: { color: "text-green-400", bgColor: "bg-green-500/10", label: "Spreadsheet" },
  pdf: { color: "text-red-400", bgColor: "bg-red-500/10", label: "PDF" },
};

function FileTypeIcon({ fileType, className }: { fileType: CreatedFile["fileType"]; className?: string }) {
  const baseClass = `${className || "w-5 h-5"} ${FILE_TYPE_CONFIG[fileType].color}`;

  switch (fileType) {
    case "doc":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case "slides":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h16.5M3.75 3v-.75A.75.75 0 014.5 1.5h15a.75.75 0 01.75.75V3m0 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
      );
    case "sheet":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0-3.75c-.621 0-1.125.504-1.125 1.125" />
        </svg>
      );
    case "pdf":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
  }
}

interface FileCardProps {
  file: CreatedFile;
}

export default function FileCard({ file }: FileCardProps) {
  const [copied, setCopied] = useState(false);
  const config = FILE_TYPE_CONFIG[file.fileType];

  const handleCopyLink = async () => {
    if (!file.url) return;
    try {
      await navigator.clipboard.writeText(file.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className={`animate-slide-up rounded-xl ${config.bgColor} border border-border-subtle overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <FileTypeIcon fileType={file.fileType} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {file.title}
          </p>
          <p className="text-xs text-text-tertiary">
            {file.status === "uploaded" ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Uploaded to Google
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                Created locally
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Download button — always available for local files */}
          {file.downloadUrl && (
            <a
              href={`${BACKEND_URL}${file.downloadUrl}`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-text-primary transition-colors"
              aria-label={`Download ${file.title}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download
            </a>
          )}
          {/* Google link — when uploaded */}
          {file.status === "uploaded" && file.url && (
            <>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-text-primary transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Open in Google
              </a>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg hover:bg-white/10 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label={copied ? "Link copied" : "Copy link"}
              >
                {copied ? (
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for the sidebar
export function FileCardCompact({ file }: FileCardProps) {
  const config = FILE_TYPE_CONFIG[file.fileType];

  return (
    <div className="flex items-center gap-2 py-1">
      <FileTypeIcon fileType={file.fileType} className="w-4 h-4" />
      <span className="text-xs text-text-secondary truncate flex-1">{file.title}</span>
      {file.status === "uploaded" && file.url ? (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 text-[10px] ${config.color} hover:underline`}
        >
          Open
        </a>
      ) : file.downloadUrl ? (
        <a
          href={`${BACKEND_URL}${file.downloadUrl}`}
          download
          className="shrink-0 text-[10px] text-text-tertiary hover:text-text-secondary"
          title="Download"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </a>
      ) : (
        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400" />
      )}
    </div>
  );
}
