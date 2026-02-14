import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";

export const googleCheckConnectionTool = tool(
  "check_google_connection",
  "Check whether the educator has connected their Google account. Returns connection status, email, and available services. Call this before attempting any Google Workspace operation.",
  { _placeholder: z.string().optional().describe("No parameters needed") },
  async () => {
    const status = await googleAuth.getStatus(true);
    return toolResponse(status);
  }
);
