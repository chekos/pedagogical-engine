"use client";

/**
 * Skip navigation link — visually hidden until focused via keyboard.
 * Allows keyboard users to skip past the navigation to main content.
 * WCAG 2.4.1 (Bypass Blocks)
 */
export function SkipLink({ href = "#main-content", children = "Skip to main content" }: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-white focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-accent"
    >
      {children}
    </a>
  );
}
