import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Accessibility commitment and conformance statement for the Pedagogical Engine",
};

export default function AccessibilityPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-heading text-text-primary mb-8">Accessibility Statement</h1>

      <div className="prose-lesson space-y-8 text-text-secondary">
        <section>
          <h2 className="text-xl font-heading text-text-primary mb-3">Our commitment</h2>
          <p className="leading-relaxed">
            The Pedagogical Engine is designed for educators in US public schools, universities, and institutions
            worldwide. We are committed to ensuring this tool is accessible to all users, including people with
            disabilities. Accessibility is not optional polish — it is a core requirement of the product.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading text-text-primary mb-3">Conformance target</h2>
          <p className="leading-relaxed">
            We target <strong className="text-text-primary">WCAG 2.2 Level AA</strong> conformance, which covers
            all Level A and Level AA success criteria across WCAG 2.0, 2.1, and 2.2. This standard is referenced by:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-1.5">
            <li><strong className="text-text-primary">ADA Title II</strong> — US Department of Justice final rule (April 2024) mandating WCAG 2.1 AA for public school digital content</li>
            <li><strong className="text-text-primary">Section 508</strong> of the Rehabilitation Act — applies to federally funded institutions</li>
            <li><strong className="text-text-primary">EN 301 549</strong> — European standard referencing WCAG 2.1 AA</li>
            <li><strong className="text-text-primary">European Accessibility Act (EAA)</strong> — effective June 2025</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading text-text-primary mb-3">Accessibility features</h2>
          <p className="leading-relaxed mb-3">The following accessibility features are implemented across the application:</p>

          <h3 className="text-lg font-heading text-text-primary mt-4 mb-2">Keyboard navigation</h3>
          <ul className="list-disc ml-6 space-y-1.5">
            <li>All interactive elements are reachable and operable via keyboard</li>
            <li>Skip navigation link available on every page (press Tab on page load)</li>
            <li>Visible focus indicators on all interactive elements</li>
            <li>Dropdown menus can be closed with the Escape key</li>
            <li>Chat input supports Enter to send and Shift+Enter for newlines</li>
          </ul>

          <h3 className="text-lg font-heading text-text-primary mt-4 mb-2">Screen reader support</h3>
          <ul className="list-disc ml-6 space-y-1.5">
            <li>Chat message areas use <code className="text-xs px-1 py-0.5 bg-surface-2 rounded">role=&quot;log&quot;</code> with <code className="text-xs px-1 py-0.5 bg-surface-2 rounded">aria-live=&quot;polite&quot;</code> so new messages are announced without interrupting</li>
            <li>Each message identifies the sender (You or Assistant) for screen readers</li>
            <li>Loading and thinking states are announced via status roles</li>
            <li>Error messages use alert roles for immediate announcement</li>
            <li>Progress bars have programmatically determinable values</li>
            <li>All decorative images and icons are marked with <code className="text-xs px-1 py-0.5 bg-surface-2 rounded">aria-hidden=&quot;true&quot;</code></li>
          </ul>

          <h3 className="text-lg font-heading text-text-primary mt-4 mb-2">Visual design</h3>
          <ul className="list-disc ml-6 space-y-1.5">
            <li>Text contrast ratios meet WCAG AA requirements (4.5:1 for normal text, 3:1 for large text)</li>
            <li>Information is never conveyed by color alone — icons, text labels, and patterns supplement color cues</li>
            <li>Light and dark mode both maintain accessible contrast ratios</li>
            <li>Content reflows at 320px width without horizontal scrolling</li>
            <li>Text is resizable up to 200% without loss of content</li>
          </ul>

          <h3 className="text-lg font-heading text-text-primary mt-4 mb-2">Motion and animation</h3>
          <ul className="list-disc ml-6 space-y-1.5">
            <li>All animations respect the <code className="text-xs px-1 py-0.5 bg-surface-2 rounded">prefers-reduced-motion</code> media query</li>
            <li>When reduced motion is preferred, animations are eliminated or minimized</li>
            <li>No content flashes more than 3 times per second</li>
          </ul>

          <h3 className="text-lg font-heading text-text-primary mt-4 mb-2">Semantic HTML</h3>
          <ul className="list-disc ml-6 space-y-1.5">
            <li>Proper heading hierarchy maintained across all pages</li>
            <li>HTML landmark regions used throughout (nav, main, header, footer)</li>
            <li>Form inputs have associated labels</li>
            <li>Language of the page is set (<code className="text-xs px-1 py-0.5 bg-surface-2 rounded">lang=&quot;en&quot;</code>)</li>
            <li>Tables include proper header markup with scope attributes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading text-text-primary mb-3">Known limitations</h2>
          <ul className="list-disc ml-6 space-y-1.5">
            <li>The interactive skill dependency graph (React Flow) relies on drag-and-zoom interactions that may not be fully accessible to keyboard-only users. An accessible data table alternative is being planned.</li>
            <li>Voice input features require browser support for the Web Speech API and may not be available in all browsers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading text-text-primary mb-3">Feedback</h2>
          <p className="leading-relaxed">
            If you encounter accessibility barriers or have suggestions for improvement, please contact us.
            We take accessibility feedback seriously and will work to resolve issues promptly.
          </p>
        </section>

        <section>
          <p className="text-xs text-text-tertiary mt-8">
            This statement was last updated on February 16, 2026.
          </p>
        </section>
      </div>
    </div>
  );
}
