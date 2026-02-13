"use client";

import { useState, useCallback } from "react";
import QRCodeDisplay from "@/components/assessment/qr-code";
import { BACKEND_URL, FRONTEND_URL } from "@/lib/constants";
import { ErrorBanner } from "@/components/ui/loading";
import { NavBar } from "@/components/ui/nav-bar";
import { Footer } from "@/components/ui/footer";

interface AssessmentLink {
  code: string;
  url: string;
  embedUrl: string;
  group: string;
  domain: string;
  created: string;
}

interface LearnerLink {
  learnerId: string;
  learnerName: string;
  code: string;
  url: string;
  embedUrl: string;
}

export default function ShareAssessmentPage() {
  const [groupName, setGroupName] = useState("tuesday-cohort");
  const [domain, setDomain] = useState("python-data-analysis");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single group link
  const [groupLink, setGroupLink] = useState<AssessmentLink | null>(null);

  // Batch individual links
  const [batchLinks, setBatchLinks] = useState<LearnerLink[]>([]);

  // Copied state for feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateGroupLink = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/assess/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName, domain }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setGroupLink(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  }, [groupName, domain]);

  const generateBatchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/assess/generate-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName, domain }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setBatchLinks(data.links);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate batch links"
      );
    } finally {
      setLoading(false);
    }
  }, [groupName, domain]);

  const copyToClipboard = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    },
    []
  );

  const getEmailTemplate = (name: string, code: string, url: string) =>
    `Hey ${name},\n\nPlease complete this quick 5-minute skill check before our session. It's not a test — just helps me plan a session that's right for you.\n\n${url}\nCode: ${code}\n\nThanks!`;

  const getTextTemplate = (name: string, code: string, url: string) =>
    `Hi ${name}! Quick favor — complete this 5-min skill check before our session: ${url} (code: ${code}). Not a test, just helps me plan better!`;

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <NavBar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Config */}
        <div className="bg-surface-1 rounded-2xl border border-border-subtle p-6 mb-8">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            Assessment Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="group-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                Group
              </label>
              <input
                id="group-name"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-0 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label htmlFor="domain-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                Domain
              </label>
              <input
                id="domain-name"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-0 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={generateGroupLink}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-muted disabled:opacity-50 transition-colors"
            >
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Generate Group Link
            </button>
            <button
              onClick={generateBatchLinks}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-text-primary text-sm font-medium hover:bg-surface-2 disabled:opacity-50 transition-colors"
            >
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Generate Individual Links for All Students
            </button>
          </div>

          <div aria-live="assertive" aria-atomic="true">
            {error && (
              <div className="mt-3 animate-fade-in" role="alert">
                <ErrorBanner message={error} />
              </div>
            )}
          </div>
        </div>

        {/* Group Link Result */}
        {groupLink && (
          <div className="bg-surface-1 rounded-2xl border border-border-subtle p-6 mb-8 animate-fade-in">
            <h2 className="text-sm font-semibold text-text-primary mb-4">
              Group Assessment Link
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
              {/* QR Code */}
              <div className="flex-shrink-0">
                <QRCodeDisplay url={groupLink.url} size={180} />
                <p className="text-xs text-text-tertiary text-center mt-2">
                  Scan to start assessment
                </p>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                    Access Code
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="text-2xl font-mono font-bold text-text-primary tracking-wider">
                      {groupLink.code}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(groupLink.code, "group-code")
                      }
                      className="text-xs text-accent hover:text-accent-muted transition-colors"
                    >
                      {copiedId === "group-code" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                    Direct Link
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-text-secondary break-all">
                      {groupLink.url}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(groupLink.url, "group-url")
                      }
                      className="flex-shrink-0 text-xs text-accent hover:text-accent-muted transition-colors"
                    >
                      {copiedId === "group-url" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Message templates */}
                <div className="pt-2 border-t border-border-subtle">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                    Share Templates
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          getEmailTemplate(
                            "[Student]",
                            groupLink.code,
                            groupLink.url
                          ),
                          "group-email"
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-text-secondary hover:bg-surface-2 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {copiedId === "group-email"
                        ? "Copied!"
                        : "Copy Email Template"}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          getTextTemplate(
                            "[Student]",
                            groupLink.code,
                            groupLink.url
                          ),
                          "group-text"
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-text-secondary hover:bg-surface-2 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      {copiedId === "group-text"
                        ? "Copied!"
                        : "Copy Text Template"}
                    </button>
                  </div>
                </div>

                {/* Embed code */}
                <div className="pt-2 border-t border-border-subtle">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                    Embed Widget
                  </p>
                  <div className="flex items-start gap-2">
                    <pre className="flex-1 text-[11px] font-mono text-text-secondary bg-surface-0 border border-border-subtle rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">{`<iframe src="${groupLink.embedUrl}" width="400" height="600" style="border:none;border-radius:12px" title="Skill Assessment"></iframe>`}</pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<iframe src="${groupLink.embedUrl}" width="400" height="600" style="border:none;border-radius:12px" title="Skill Assessment"></iframe>`,
                          "group-embed"
                        )
                      }
                      className="flex-shrink-0 text-xs text-accent hover:text-accent-muted transition-colors mt-1"
                    >
                      {copiedId === "group-embed" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <a
                    href="/assess/embed-demo"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-muted mt-2 transition-colors"
                  >
                    View embed demo
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Links */}
        {batchLinks.length > 0 && (
          <div className="bg-surface-1 rounded-2xl border border-border-subtle p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">
                Individual Assessment Links ({batchLinks.length} students)
              </h2>
              <button
                onClick={() => {
                  const all = batchLinks
                    .map(
                      (l) =>
                        `${l.learnerName}\nCode: ${l.code}\nLink: ${l.url}\nEmbed: ${l.embedUrl}\n`
                    )
                    .join("\n");
                  copyToClipboard(all, "batch-all");
                }}
                className="text-xs text-accent hover:text-accent-muted transition-colors"
              >
                {copiedId === "batch-all" ? "Copied all!" : "Copy all"}
              </button>
            </div>

            <div className="space-y-4">
              {batchLinks.map((link) => (
                <div
                  key={link.learnerId}
                  className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-surface-0 rounded-xl border border-border-subtle"
                >
                  {/* QR code (small) */}
                  <QRCodeDisplay url={link.url} size={100} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {link.learnerName}
                    </p>
                    <p className="text-xs text-text-tertiary font-mono mt-0.5">
                      Code: {link.code}
                    </p>
                    <p className="text-xs text-text-tertiary truncate mt-0.5">
                      {link.url}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(link.url, link.learnerId)}
                      className="text-xs text-accent hover:text-accent-muted"
                    >
                      {copiedId === link.learnerId ? "Copied!" : "Copy link"}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          getEmailTemplate(
                            link.learnerName,
                            link.code,
                            link.url
                          ),
                          `email-${link.learnerId}`
                        )
                      }
                      className="text-xs text-text-secondary hover:text-text-primary"
                    >
                      {copiedId === `email-${link.learnerId}`
                        ? "Copied!"
                        : "Email"}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          getTextTemplate(
                            link.learnerName,
                            link.code,
                            link.url
                          ),
                          `text-${link.learnerId}`
                        )
                      }
                      className="text-xs text-text-secondary hover:text-text-primary"
                    >
                      {copiedId === `text-${link.learnerId}`
                        ? "Copied!"
                        : "Text"}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<iframe src="${link.embedUrl}" width="400" height="600" style="border:none;border-radius:12px" title="Skill Assessment"></iframe>`,
                          `embed-${link.learnerId}`
                        )
                      }
                      className="text-xs text-text-secondary hover:text-text-primary"
                    >
                      {copiedId === `embed-${link.learnerId}`
                        ? "Copied!"
                        : "Embed"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
