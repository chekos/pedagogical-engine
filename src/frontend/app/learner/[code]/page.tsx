"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchPortalData, type PortalData } from "@/lib/api";
import LanguageSelector from "@/components/portal/language-selector";
import ProgressNarrative from "@/components/portal/progress-narrative";
import SkillMap from "@/components/portal/skill-map";
import AssessmentCards from "@/components/portal/assessment-cards";
import EducatorNotes from "@/components/portal/educator-notes";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; data: PortalData };

export default function LearnerPortalPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // Derive language and audience from URL query params
  const language = searchParams.get("lang") || "en";
  const audience = searchParams.get("audience") || "learner";

  const loadPortal = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await fetchPortalData(code, language, audience);
      setState({ status: "loaded", data });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Failed to load portal data",
      });
    }
  }, [code, language, audience]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  // Update URL query params — keeps defaults clean (no ?lang=en&audience=learner)
  const handleLanguageChange = (lang: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (lang === "en") params.delete("lang");
    else params.set("lang", lang);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleAudienceChange = (aud: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (aud === "learner") params.delete("audience");
    else params.set("audience", aud);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-surface-0 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="border-b border-border-subtle bg-surface-1">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Pedagogical Engine
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector value={language} onChange={handleLanguageChange} />
            {/* Audience selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="portal-audience"
                className="text-sm text-text-secondary font-medium"
              >
                View as
              </label>
              <select
                id="portal-audience"
                value={audience}
                onChange={(e) => handleAudienceChange(e.target.value)}
                className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:bg-surface-2 dark:text-text-primary"
                aria-label="Select audience perspective"
              >
                <option value="learner">Learner</option>
                <option value="parent">Parent</option>
                <option value="employer">Employer</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-8">
        {state.status === "loading" && (
          <div className="flex items-center justify-center py-20" role="status">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                Loading your progress&hellip;
              </p>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div
            className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6 text-center"
            role="alert"
          >
            <h1 className="font-heading text-xl font-semibold text-text-primary mb-2">
              Portal Not Found
            </h1>
            <p className="text-sm text-text-secondary mb-4">
              {state.message}
            </p>
            <p className="text-xs text-text-tertiary">
              Check that your portal code is correct. If you received a link,
              make sure it was copied completely.
            </p>
          </div>
        )}

        {state.status === "loaded" && (
          <div className="space-y-8">
            {/* Learner identity header */}
            <div>
              <h1 className="font-heading text-3xl font-bold text-text-primary">
                {state.data.learner.name}
              </h1>
              <p className="text-text-secondary mt-1">
                {state.data.learner.domain
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                {state.data.learner.group && (
                  <>
                    {" "}
                    &middot;{" "}
                    {state.data.learner.group
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </>
                )}
              </p>
            </div>

            {/* Progress narrative */}
            <ProgressNarrative data={state.data} />

            {/* Skill map */}
            <SkillMap data={state.data} />

            {/* Assessments */}
            <AssessmentCards data={state.data} />

            {/* Educator notes */}
            <EducatorNotes data={state.data} />

            {/* Footer */}
            <footer className="border-t border-border-subtle pt-6 pb-8 text-center">
              <p className="text-xs text-text-tertiary">
                This page is read-only. Your progress is updated by your
                educator.
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Portal code:{" "}
                <code className="font-mono text-text-secondary">
                  {state.data.portalCode}
                </code>
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
