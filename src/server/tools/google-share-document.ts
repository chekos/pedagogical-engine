import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";
import { shareFile } from "../google/drive.js";

export const googleShareDocumentTool = tool(
  "share_document",
  "Share a Google Drive file (Doc, Sheet, etc.) with one or more email addresses. Default role is 'reader'. Use this after exporting a lesson plan or assessment results to share with colleagues or students.",
  {
    fileId: z.string().describe("Google Drive file ID to share"),
    emails: z
      .array(z.string())
      .describe("Email addresses to share with"),
    role: z
      .enum(["reader", "writer", "commenter"])
      .optional()
      .describe("Permission role (default: reader)"),
  },
  async ({ fileId, emails, role }) => {
    const status = await googleAuth.getStatus();
    if (!status.connected) {
      return toolResponse(
        { error: "Google account not connected. Call request_google_connection first." },
        true
      );
    }

    const auth = googleAuth.getClient();
    const effectiveRole = role || "reader";
    const results: Array<{ email: string; status: string }> = [];

    for (const email of emails) {
      try {
        await shareFile(auth, fileId, email, effectiveRole);
        results.push({ email, status: "shared" });
      } catch (err) {
        results.push({
          email,
          status: `error: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    }

    return toolResponse({
      shared: results.filter((r) => r.status === "shared").length,
      total: emails.length,
      results,
    });
  }
);
