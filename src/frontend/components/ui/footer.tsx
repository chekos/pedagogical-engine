"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const aphorisms = [
  "Every lesson is a hypothesis.",
  "Teaching is the art of reading the room.",
  "The best plans leave room to breathe.",
  "What worked last time won\u2019t always work next time.",
  "The graph remembers what the room forgets.",
];

export function Footer() {
  const [aphorism, setAphorism] = useState(aphorisms[0]);

  useEffect(() => {
    function update() {
      const index = new Date().getMinutes() % aphorisms.length;
      setAphorism(aphorisms[index]);
    }
    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="mt-auto">
      <div className="bloom-spectrum" aria-hidden="true" />
      <div className="px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xs text-text-tertiary font-heading italic">
            {aphorism}
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/accessibility"
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Accessibility
            </Link>
            <span className="text-xs text-text-tertiary">
              Cerebral Valley x Anthropic Hackathon
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
