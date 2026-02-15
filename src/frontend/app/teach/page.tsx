"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ChatInterface from "@/components/chat/chat-interface";

function TeachContent() {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get("message") || undefined;
  const resumeSessionId = searchParams.get("session") || undefined;

  return (
    <div className="h-screen flex flex-col bg-surface-0">
      {/* Paper grain texture — same as landing page */}
      <svg className="grain" aria-hidden="true">
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
      <ChatInterface initialMessage={initialMessage} resumeSessionId={resumeSessionId} />
    </div>
  );
}

export default function TeachPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-surface-0" />}>
      <TeachContent />
    </Suspense>
  );
}
