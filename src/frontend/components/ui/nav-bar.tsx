"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";

const PRIMARY_LINKS = [
  { href: "/teach", label: "Teach" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lessons", label: "Lessons" },
  { href: "/domains", label: "Domains" },
];

const EXPLORE_LINKS = [
  { href: "/simulate", label: "Simulate" },
  { href: "/wisdom", label: "Wisdom" },
  { href: "/profile", label: "Educators" },
  { href: "/meta", label: "Meta" },
  { href: "/disagree", label: "Disagree" },
  { href: "/transfer", label: "Transfer" },
];

// Each section maps to a Bloom's taxonomy level for wayfinding color cues
const SECTION_BLOOM: Record<string, string> = {
  "/teach": "var(--bloom-understand)",
  "/dashboard": "var(--bloom-evaluate)",
  "/lessons": "var(--bloom-apply)",
  "/domains": "var(--bloom-analyze)",
  "/simulate": "var(--bloom-apply)",
  "/wisdom": "var(--bloom-evaluate)",
  "/profile": "var(--bloom-understand)",
  "/meta": "var(--bloom-analyze)",
  "/disagree": "var(--bloom-create)",
  "/transfer": "var(--bloom-remember)",
};

export function NavBar() {
  const pathname = usePathname();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isExploreActive = EXPLORE_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(href + "/")
  );

  // Find the Bloom color for the currently active explore sub-page (if any)
  const activeExploreBloom = EXPLORE_LINKS.find(
    ({ href }) => pathname === href || pathname.startsWith(href + "/")
  );
  const exploreBloomColor = activeExploreBloom
    ? SECTION_BLOOM[activeExploreBloom.href]
    : undefined;

  const closeDropdown = useCallback(() => {
    setExploreOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExploreOpen(false);
      }
    }
    if (exploreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [exploreOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!exploreOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDropdown();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [exploreOpen, closeDropdown]);

  // Close on route change
  useEffect(() => {
    setExploreOpen(false);
  }, [pathname]);

  return (
    <nav aria-label="Main navigation" className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-0">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pedagogical Engine home">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center" aria-hidden="true">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary">
            Pedagogical Engine
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {PRIMARY_LINKS.map(({ href, label }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          const bloomColor = SECTION_BLOOM[href];
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`text-sm relative ${
                isActive
                  ? "font-medium"
                  : "text-text-secondary hover:text-text-primary transition-colors"
              }`}
              style={isActive ? { color: bloomColor } : undefined}
            >
              {label}
              {isActive && (
                <span
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: bloomColor }}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}

        {/* Explore dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            ref={triggerRef}
            onClick={() => setExploreOpen((prev) => !prev)}
            onMouseEnter={() => setExploreOpen(true)}
            aria-expanded={exploreOpen}
            aria-haspopup="true"
            className={`text-sm flex items-center gap-1 transition-colors relative ${
              isExploreActive
                ? "font-medium"
                : "text-text-secondary hover:text-text-primary"
            }`}
            style={isExploreActive && exploreBloomColor ? { color: exploreBloomColor } : undefined}
          >
            Explore
            {isExploreActive && (
              <span
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ backgroundColor: exploreBloomColor }}
                aria-hidden="true"
              />
            )}
            <svg
              className={`w-3.5 h-3.5 transition-transform ${exploreOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {exploreOpen && (
            <div
              role="menu"
              tabIndex={-1}
              aria-label="Explore pages"
              className="absolute right-0 top-full mt-2 w-44 py-1.5 bg-surface-1 border border-border-subtle rounded-lg shadow-lg z-50"
              onMouseLeave={() => setExploreOpen(false)}
            >
              {EXPLORE_LINKS.map(({ href, label }) => {
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                const bloomColor = SECTION_BLOOM[href];
                return (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                      isActive
                        ? "font-medium"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                    }`}
                    style={isActive ? { color: bloomColor } : undefined}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: bloomColor }}
                      aria-hidden="true"
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <div className="border-l border-border-subtle pl-4" aria-hidden="false">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 min-w-[24px] min-h-[24px]"
            aria-label={mounted ? (resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )
            ) : (
              <div className="w-4.5 h-4.5" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
