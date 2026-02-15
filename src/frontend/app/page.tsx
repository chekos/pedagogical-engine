import Link from "next/link";
import { NavBar } from "@/components/ui/nav-bar";
import { Footer } from "@/components/ui/footer";
import { SkillGraphVisual } from "@/components/landing/skill-graph";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-0">
      <NavBar />

      {/* Paper grain texture */}
      <svg className="grain" aria-hidden="true">
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="max-w-[1000px] mx-auto text-center">
            <SkillGraphVisual />

            <h1 className="mt-6 text-5xl md:text-6xl font-heading text-text-primary tracking-tight leading-[1.1]">
              Teaching, reasoned.
            </h1>

            <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              You know your students. You know your subject. This engine handles
              the complexity of putting the two together&nbsp;&mdash; so you can
              focus on what actually happens in the room.
            </p>

            {/* Primary CTA */}
            <div className="mt-10">
              <Link
                href="/teach"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-accent text-white text-base font-medium hover:bg-accent-muted transition-colors"
              >
                Start planning
              </Link>
            </div>

            {/* Secondary CTAs */}
            <div className="mt-4 flex items-center justify-center gap-6">
              <Link
                href="/assess/share"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors underline underline-offset-4 decoration-border-subtle hover:decoration-text-tertiary"
              >
                Take an assessment
              </Link>
              <Link
                href="/domains"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors underline underline-offset-4 decoration-border-subtle hover:decoration-text-tertiary"
              >
                Explore the engine
              </Link>
            </div>
          </div>
        </section>

        {/* What makes this different — typographic statements */}
        <section className="px-6 py-16 md:py-24">
          <div className="max-w-3xl mx-auto space-y-14 md:space-y-20">
            <div className="border-l-2 border-bloom-understand pl-6 md:pl-8">
              <h3 className="text-2xl md:text-3xl font-heading text-text-primary leading-snug">
                It maps what students know.
              </h3>
              <p className="mt-3 text-base md:text-lg text-text-secondary leading-relaxed">
                Not a quiz&nbsp;&mdash; a conversation that builds a dependency graph
                of actual understanding. What they know, what they almost know,
                and what&apos;s blocking them.
              </p>
            </div>

            <div className="border-l-2 border-bloom-analyze pl-6 md:pl-8">
              <h3 className="text-2xl md:text-3xl font-heading text-text-primary leading-snug">
                Every lesson comes with reasoning traces.
              </h3>
              <p className="mt-3 text-base md:text-lg text-text-secondary leading-relaxed">
                Why this order. Why this pairing. Why 15 minutes here
                and 5 there. And it will push back if your plan has gaps.
              </p>
            </div>

            <div className="border-l-2 border-bloom-apply pl-6 md:pl-8">
              <h3 className="text-2xl md:text-3xl font-heading text-text-primary leading-snug">
                It learns from every session.
              </h3>
              <p className="mt-3 text-base md:text-lg text-text-secondary leading-relaxed">
                Debrief after teaching and the engine gets smarter. Timing
                patterns, what worked, what didn&apos;t. Your accumulated
                teaching wisdom, formalized.
              </p>
            </div>
          </div>
        </section>

        {/* See it in action */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading text-text-primary text-center mb-12">
              See it in action
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Link
                href="/dashboard?domain=python-data-analysis"
                className="group border-l-2 border-bloom-evaluate p-6 hover:border-l-4 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-bloom-evaluate/15 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-bloom-evaluate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                  Skill Graph
                </h3>
                <p className="text-sm text-text-secondary">
                  Interactive dependency graph with learner skill overlay
                </p>
              </Link>

              <Link
                href="/teach/live/tuesday-cohort-lesson-1"
                className="group border-l-2 border-bloom-create p-6 hover:border-l-4 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-bloom-create/15 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-bloom-create" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                  Live Teaching
                </h3>
                <p className="text-sm text-text-secondary">
                  Voice-first companion for real-time lesson delivery
                </p>
              </Link>

              <Link
                href="/assess/share"
                className="group border-l-2 border-bloom-understand p-6 hover:border-l-4 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-bloom-understand/15 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-bloom-understand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                  Assessment
                </h3>
                <p className="text-sm text-text-secondary">
                  Adaptive skill assessment via conversational interface
                </p>
              </Link>

              <Link
                href="/wisdom"
                className="group border-l-2 border-bloom-analyze p-6 hover:border-l-4 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-bloom-analyze/15 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-bloom-analyze" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                  Teaching Wisdom
                </h3>
                <p className="text-sm text-text-secondary">
                  Accumulated insights that compound across sessions
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Hackathon line */}
        <div className="text-center pb-6">
          <p className="text-xs text-text-tertiary">
            Built for Cerebral Valley x Anthropic Hackathon 2026
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
