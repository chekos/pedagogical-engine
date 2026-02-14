import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { DATA_DIR, toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";
import { readSheet } from "../google/sheets.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const googleImportRosterTool = tool(
  "import_roster_from_sheets",
  "Import a student roster from a Google Sheet. Creates learner profiles (.md) and a group file matching the canonical format that parseLearnerProfile() expects. The Sheet should have a column with student names.",
  {
    spreadsheetId: z.string().describe("Google Sheets spreadsheet ID (from the URL)"),
    groupName: z.string().describe("Name for the group to create or update"),
    domain: z.string().describe("Skill domain, e.g. 'python-data-analysis'"),
    sheetName: z
      .string()
      .optional()
      .describe("Sheet tab name. If omitted, reads the first sheet."),
    nameColumn: z
      .string()
      .optional()
      .describe("Column header containing student names. Defaults to 'Name'."),
  },
  async ({ spreadsheetId, groupName, domain, sheetName, nameColumn }) => {
    const status = await googleAuth.getStatus();
    if (!status.connected) {
      return toolResponse(
        { error: "Google account not connected. Call request_google_connection first." },
        true
      );
    }

    const auth = googleAuth.getClient();
    const range = sheetName ? `${sheetName}!A:ZZ` : undefined;
    const { headers, rows } = await readSheet(auth, spreadsheetId, range);

    if (headers.length === 0 || rows.length === 0) {
      return toolResponse({ error: "Sheet is empty or has no data rows." }, true);
    }

    // Find the name column
    const targetCol = nameColumn || "Name";
    const nameIdx = headers.findIndex(
      (h) => h.toLowerCase().trim() === targetCol.toLowerCase().trim()
    );
    if (nameIdx === -1) {
      return toolResponse(
        {
          error: `Column '${targetCol}' not found. Available columns: ${headers.join(", ")}`,
          headers,
        },
        true
      );
    }

    const slug = slugify(groupName);
    const learnersDir = path.join(DATA_DIR, "learners");
    const groupsDir = path.join(DATA_DIR, "groups");
    await fs.mkdir(learnersDir, { recursive: true });
    await fs.mkdir(groupsDir, { recursive: true });

    // Create learner profiles — matching the exact format from load-roster.ts:49-71
    const memberIds: string[] = [];
    const memberNames: string[] = [];

    for (const row of rows) {
      const name = row[nameIdx]?.trim();
      if (!name) continue;

      const id = `${slugify(name)}-${nanoid(6)}`;
      memberIds.push(id);
      memberNames.push(name);

      const learnerContent = `# Learner Profile: ${name}

| Field | Value |
|---|---|
| **ID** | ${id} |
| **Name** | ${name} |
| **Group** | ${slug} |
| **Domain** | ${domain} |
| **Created** | ${new Date().toISOString()} |
| **Last assessed** | Not yet assessed |

## Assessed Skills

_No skills assessed yet._

## Inferred Skills

_No skills inferred yet._

## Notes

_Imported from Google Sheets._
`;
      await fs.writeFile(
        path.join(learnersDir, `${id}.md`),
        learnerContent,
        "utf-8"
      );
    }

    // Create group file
    const groupContent = `# Group: ${groupName}

| Field | Value |
|---|---|
| **Slug** | ${slug} |
| **Domain** | ${domain} |
| **Created** | ${new Date().toISOString()} |
| **Member count** | ${memberIds.length} |
| **Source** | Google Sheets (${spreadsheetId}) |

## Members

${memberIds.map((id, i) => `- ${memberNames[i]} (\`${id}\`)`).join("\n")}

## Interview Context

_Not yet interviewed. Use the interview-educator skill to gather context._

## Constraints

_No constraints recorded yet._
`;
    await fs.writeFile(
      path.join(groupsDir, `${slug}.md`),
      groupContent,
      "utf-8"
    );

    return toolResponse({
      imported: memberIds.length,
      groupName: slug,
      learnerIds: memberIds,
      learnerNames: memberNames,
    });
  }
);
