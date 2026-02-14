"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

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

export function NavBar() {
  const pathname = usePathname();
  const [exploreOpen, setExploreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isExploreActive = EXPLORE_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(href + "/")
  );

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

  // Close on route change
  useEffect(() => {
    setExploreOpen(false);
  }, [pathname]);

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-0">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
          return (
            <Link
              key={href}
              href={href}
              className={
                isActive
                  ? "text-sm font-medium text-accent"
                  : "text-sm text-text-secondary hover:text-text-primary transition-colors"
              }
            >
              {label}
            </Link>
          );
        })}

        {/* Explore dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setExploreOpen((prev) => !prev)}
            onMouseEnter={() => setExploreOpen(true)}
            className={`text-sm flex items-center gap-1 transition-colors ${
              isExploreActive
                ? "font-medium text-accent"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Explore
            <svg
              className={`w-3.5 h-3.5 transition-transform ${exploreOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {exploreOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-44 py-1.5 bg-surface-1 border border-border-subtle rounded-lg shadow-lg z-50"
              onMouseLeave={() => setExploreOpen(false)}
            >
              {EXPLORE_LINKS.map(({ href, label }) => {
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`block px-3.5 py-2 text-sm transition-colors ${
                      isActive
                        ? "text-accent font-medium bg-accent/5"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
