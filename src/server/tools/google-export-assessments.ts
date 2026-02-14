import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toolResponse, loadGroupLearners, loadGraph } from "./shared.js";
import { googleAuth } from "../google/auth.js";
import { createSheet } from "../google/sheets.js";

export const googleExportAssessmentsTool = tool(
  "export_assessments_to_sheets",
  "Export a group's assessment results to a Google Sheet as a skill matrix. Each row is a learner, each column is a skill, cell values are confidence scores.",
  {
    groupName: z.string().describe("Group slug to export assessments for"),
    domain: z.string().describe("Skill domain"),
  },
  async ({ groupName, domain }) => {
    const status = await googleAuth.getStatus();
    if (!status.connected) {
      return toolResponse(
        { error: "Google account not connected. Call request_google_connection first." },
        true
      );
    }

    // Load group learners and skill graph
    const learners = await loadGroupLearners(groupName);
    if (learners.length === 0) {
      return toolResponse({ error: `No learners found in group '${groupName}'` }, true);
    }

    let skillIds: string[] = [];
    try {
      const graph = await loadGraph(domain);
      skillIds = graph.skills.map((s) => s.id);
    } catch {
      return toolResponse({ error: `Domain '${domain}' not found` }, true);
    }

    // Build the matrix
    const headers = ["Learner", ...skillIds];
    const rows: string[][] = learners.map((learner) => {
      const skillMap = new Map(
        learner.profile.skills.map((s) => [s.skillId, s])
      );
      return [
        learner.name,
        ...skillIds.map((skillId) => {
          const entry = skillMap.get(skillId);
          if (!entry) return "";
          return `${entry.confidence}${entry.source === "inferred" ? " (inf)" : ""}`;
        }),
      ];
    });

    const auth = googleAuth.getClient();
    const title = `Assessment Results: ${groupName} — ${domain}`;
    const result = await createSheet(auth, title, headers, rows);

    return toolResponse({
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
      learnerCount: learners.length,
      skillCount: skillIds.length,
    });
  }
);
