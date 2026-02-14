import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";
import { listFiles } from "../google/drive.js";

export const googleListDriveTool = tool(
  "list_drive_files",
  "List files from the educator's Google Drive. Can filter by name query and MIME type. Useful for finding spreadsheets to import rosters from or documents to reference.",
  {
    query: z.string().optional().describe("Search query to filter files by name"),
    mimeType: z
      .string()
      .optional()
      .describe("MIME type filter, e.g. 'application/vnd.google-apps.spreadsheet'"),
    maxResults: z
      .number()
      .optional()
      .describe("Maximum number of files to return (default 20)"),
  },
  async ({ query, mimeType, maxResults }) => {
    const status = await googleAuth.getStatus();
    if (!status.connected) {
      return toolResponse(
        { error: "Google account not connected. Call request_google_connection first." },
        true
      );
    }

    const auth = googleAuth.getClient();
    const result = await listFiles(auth, query, mimeType, maxResults || 20);

    return toolResponse(result);
  }
);
