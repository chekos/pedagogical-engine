"use client";

import { useCallback, useEffect, useState } from "react";

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

interface PostMessageEvent {
  source: string;
  event: string;
  code?: string;
  learnerName?: string;
  covered?: number;
  total?: number;
  messageCount?: number;
  error?: string;
}

export default function EmbedDemoPage() {
  const [assessmentCode, setAssessmentCode] = useState("TUE-2026-0211");
  const [embedUrl, setEmbedUrl] = useState("");
  const [events, setEvents] = useState<
    Array<{ time: string; event: string; data: string }>
  >([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setEmbedUrl(`${FRONTEND_URL}/assess/embed/${assessmentCode}`);
  }, [assessmentCode]);

  // Listen for postMessage events from the embedded widget
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const data = e.data as PostMessageEvent;
      if (data?.source !== "pedagogical-engine") return;

      const time = new Date().toLocaleTimeString();
      const { source: _source, event, ...rest } = data;
      setEvents((prev) => [
        { time, event, data: JSON.stringify(rest, null, 2) },
        ...prev.slice(0, 19),
      ]);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="400"
  height="600"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);"
  allow="clipboard-write"
  title="Skill Assessment"
></iframe>`;

  const listenerCode = `<script>
window.addEventListener("message", (e) => {
  if (e.data?.source !== "pedagogical-engine") return;

  switch (e.data.event) {
    case "assessment:started":
      console.log("Assessment started for", e.data.learnerName);
      break;
    case "assessment:progress":
      console.log(\`Progress: \${e.data.covered}/\${e.data.total}\`);
      break;
    case "assessment:completed":
      console.log("Assessment complete!", e.data);
      // Handle completion — update your LMS, show a message, etc.
      break;
    case "assessment:error":
      console.error("Assessment error:", e.data.error);
      break;
  }
});
</script>`;

  const copyToClipboard = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    []
  );

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <header className="border-b border-border-subtle px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <a
            href="/"
            aria-label="Back to home"
            className="text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </a>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              Embeddable Assessment Widget
            </h1>
            <p className="text-sm text-text-secondary">
              Embed skill assessments in any website, LMS, or course platform
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Code input */}
        <div className="bg-surface-1 rounded-2xl border border-border-subtle p-6 mb-8">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Configure
          </h2>
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label
                htmlFor="demo-code"
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                Assessment Code
              </label>
              <input
                id="demo-code"
                type="text"
                value={assessmentCode}
                onChange={(e) => setAssessmentCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <p className="text-xs text-text-tertiary pb-2">
              Enter any valid assessment code to preview the widget
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live preview */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              Live Preview
            </h2>
            <div className="bg-surface-2 rounded-2xl p-6 flex items-center justify-center min-h-[650px]">
              {embedUrl && (
                <iframe
                  src={embedUrl}
                  width="380"
                  height="600"
                  style={{
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  }}
                  allow="clipboard-write"
                  title="Skill Assessment Widget Preview"
                />
              )}
            </div>
          </div>

          {/* Code snippets & event log */}
          <div className="space-y-6">
            {/* Embed code */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-text-primary">
                  Embed Code
                </h2>
                <button
                  onClick={() => copyToClipboard(iframeCode, "iframe")}
                  className="text-xs text-accent hover:text-accent-muted transition-colors"
                >
                  {copiedId === "iframe" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="bg-surface-1 border border-border-subtle rounded-xl p-4 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre-wrap">
                {iframeCode}
              </pre>
            </div>

            {/* PostMessage listener */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-text-primary">
                  postMessage Listener
                </h2>
                <button
                  onClick={() => copyToClipboard(listenerCode, "listener")}
                  className="text-xs text-accent hover:text-accent-muted transition-colors"
                >
                  {copiedId === "listener" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="bg-surface-1 border border-border-subtle rounded-xl p-4 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre-wrap">
                {listenerCode}
              </pre>
            </div>

            {/* Live event log */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-2">
                Event Log{" "}
                <span className="text-xs font-normal text-text-tertiary">
                  (live postMessage events)
                </span>
              </h2>
              <div className="bg-surface-1 border border-border-subtle rounded-xl p-4 max-h-64 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-4">
                    Start the assessment in the widget to see events here...
                  </p>
                ) : (
                  <div className="space-y-2">
                    {events.map((evt, i) => (
                      <div
                        key={i}
                        className="text-xs font-mono border-b border-border-subtle pb-2 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-text-tertiary">{evt.time}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              evt.event.includes("completed")
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : evt.event.includes("error")
                                  ? "bg-red-500/10 text-red-400"
                                  : evt.event.includes("progress")
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "bg-accent/10 text-accent"
                            }`}
                          >
                            {evt.event}
                          </span>
                        </div>
                        <pre className="text-text-tertiary whitespace-pre-wrap">
                          {evt.data}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Integration notes */}
            <div className="bg-surface-1 rounded-xl border border-border-subtle p-4">
              <h3 className="text-xs font-semibold text-text-primary mb-2">
                Integration Notes
              </h3>
              <ul className="text-xs text-text-secondary space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">&#x2022;</span>
                  The widget is fully responsive — set any width/height
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">&#x2022;</span>
                  Supports light and dark mode via{" "}
                  <code className="text-[10px] bg-surface-2 px-1 py-0.5 rounded">
                    prefers-color-scheme
                  </code>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">&#x2022;</span>
                  All events include{" "}
                  <code className="text-[10px] bg-surface-2 px-1 py-0.5 rounded">
                    source: &quot;pedagogical-engine&quot;
                  </code>{" "}
                  for filtering
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">&#x2022;</span>
                  Use{" "}
                  <code className="text-[10px] bg-surface-2 px-1 py-0.5 rounded">
                    /assess/embed/enter
                  </code>{" "}
                  to show the code entry form inside the widget
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
