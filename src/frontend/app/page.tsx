import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary">Pedagogical Engine</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/teach"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Teach
          </Link>
          <Link
            href="/assess/enter"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Assess
          </Link>
          <Link
            href="/lessons"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Lessons
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/domains"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Domains
          </Link>
          <Link
            href="/wisdom"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Wisdom
          </Link>
          <Link
            href="/disagree"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Disagree
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
            Teaching, reasoned.
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
            An AI teaching partner that thinks like an experienced educator.
            Plan lessons grounded in what your students actually know.
          </p>

          {/* Feature pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              "Skill dependency graphs",
              "Bloom's taxonomy",
              "Adaptive assessment",
              "Dependency inference",
              "Stage-directed lesson plans",
              "Pedagogical pushback",
              "Accumulated teaching wisdom",
            ].map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface-2 text-text-secondary border border-border-subtle"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/teach"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-muted transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              I&apos;m an educator
            </Link>
            <Link
              href="/assess/enter"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text-primary text-sm font-medium hover:bg-surface-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              I&apos;m a student
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text-primary text-sm font-medium hover:bg-surface-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View skill analytics
            </Link>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section className="border-t border-border-subtle px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Describe your context",
                desc: "Tell the engine about your students, topic, duration, and constraints. It interviews you like a teaching partner would.",
              },
              {
                step: "02",
                title: "Assess skill levels",
                desc: "Students complete adaptive assessments. The engine maps their skills using dependency graphs and Bloom's taxonomy.",
              },
              {
                step: "03",
                title: "Get a real lesson plan",
                desc: "Receive a stage-directed lesson plan calibrated to your group's actual skill distribution. Minute-by-minute guidance.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent text-xs font-bold mb-3">
                  {item.step}
                </span>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-xs text-text-tertiary">
            Built with Opus 4.6 &mdash; Cerebral Valley x Anthropic Hackathon
          </span>
          <span className="text-xs text-text-tertiary">Feb 2026</span>
        </div>
      </footer>
    </div>
  );
}
