"use client";

import { use, useState } from "react";
import EmbedCodeEntry from "@/components/assessment/embed-code-entry";
import EmbedAssessmentChat from "@/components/assessment/embed-assessment-chat";

export default function EmbedAssessPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [session, setSession] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const initialCode = code === "enter" ? "" : code;

  if (!session) {
    return (
      <EmbedCodeEntry
        initialCode={initialCode}
        onSubmit={(assessCode, name) =>
          setSession({ code: assessCode, name })
        }
      />
    );
  }

  return (
    <EmbedAssessmentChat code={session.code} learnerName={session.name} />
  );
}
