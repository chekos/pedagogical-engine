import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";

export const googleRequestConnectionTool = tool(
  "request_google_connection",
  "Request that the educator connect their Google account. Call this when check_google_connection returns connected: false and you need Google access. The frontend will render an inline connect card with an OAuth button.",
  {
    reason: z
      .string()
      .describe(
        "Why Google access is needed, shown to the educator. E.g. 'To export your lesson plan to Google Docs'"
      ),
  },
  async ({ reason }) => {
    const { url } = googleAuth.generateAuthUrl();
    return toolResponse({
      action: "show_google_connect",
      reason,
      authUrl: url,
    });
  }
);
