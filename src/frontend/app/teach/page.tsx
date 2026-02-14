"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ChatInterface from "@/components/chat/chat-interface";

function TeachContent() {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get("message") || undefined;

  return (
    <div className="h-screen flex flex-col bg-surface-0">
      <ChatInterface initialMessage={initialMessage} />
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
