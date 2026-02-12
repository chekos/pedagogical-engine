"use client";

import { use, useState } from "react";
import CodeEntry from "@/components/assessment/code-entry";
import AssessmentChat from "@/components/assessment/assessment-chat";

export default function AssessPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [session, setSession] = useState<{ code: string; name: string } | null>(null);

  // If code is "enter", show the code entry form with no pre-fill
  // Otherwise, pre-fill with the URL code
  const initialCode = code === "enter" ? "" : code;

  if (!session) {
    return (
      <CodeEntry
        initialCode={initialCode}
        onSubmit={(assessCode, name) => setSession({ code: assessCode, name })}
      />
    );
  }

  return <AssessmentChat code={session.code} learnerName={session.name} />;
}
