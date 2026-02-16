import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { DATA_DIR, toolResponse } from "./shared.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

/** Slugify a string for use in portal codes */
function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a short random suffix for portal codes */
function randomSuffix(length = 4): string {
  // Use nanoid with a URL-safe alphabet excluding confusable characters
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  const bytes = nanoid(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes.charCodeAt(i) % chars.length];
  }
  return result;
}

export const generatePortalCodeTool = tool(
  "generate_portal_code",
  "Generate a persistent, URL-safe portal code for a learner. Auto-called on learner creation, also callable for regeneration. Format: {name_slug}-{group_slug}-{random_4char}. Writes portal_code to learner profile.",
  {
    learnerId: z.string().describe("Learner ID (filename without extension, e.g. 'priya-sharma')"),
    groupId: z.string().describe("Group slug (e.g. 'tuesday-cohort')"),
  },
  async ({ learnerId, groupId }) => {
    const learnersDir = path.join(DATA_DIR, "learners");
    const learnerPath = path.join(learnersDir, `${learnerId}.md`);

    // Read the learner profile
    let content: string;
    try {
      content = await fs.readFile(learnerPath, "utf-8");
    } catch {
      return toolResponse(
        { error: `Learner profile '${learnerId}' not found at ${learnerPath}` },
        true
      );
    }

    // Extract learner name
    const nameMatch = content.match(/# Learner Profile: (.+)/);
    const name = nameMatch ? nameMatch[1].trim() : learnerId;

    // Generate the portal code
    const nameSlug = slugify(name.split(" ")[0]); // First name only
    const groupSlug = slugify(groupId).slice(0, 8); // Truncate long group names
    const suffix = randomSuffix(4);
    const portalCode = `${nameSlug}-${groupSlug}-${suffix}`;
    const now = new Date().toISOString();

    // Check if a portal_code section already exists and update/add it
    if (content.includes("## Portal")) {
      // Replace existing portal section
      content = content.replace(
        /## Portal\n[\s\S]*?(?=\n## |\n*$)/,
        `## Portal\n\n| Field | Value |\n|---|---|\n| **Portal Code** | ${portalCode} |\n| **Portal URL** | ${FRONTEND_URL}/learner/${portalCode} |\n| **Generated** | ${now} |\n`
      );
    } else {
      // Insert portal section before Notes or at end
      const insertPoint = content.indexOf("\n## Notes");
      if (insertPoint !== -1) {
        content =
          content.slice(0, insertPoint) +
          `\n## Portal\n\n| Field | Value |\n|---|---|\n| **Portal Code** | ${portalCode} |\n| **Portal URL** | ${FRONTEND_URL}/learner/${portalCode} |\n| **Generated** | ${now} |\n` +
          content.slice(insertPoint);
      } else {
        content +=
          `\n## Portal\n\n| Field | Value |\n|---|---|\n| **Portal Code** | ${portalCode} |\n| **Portal URL** | ${FRONTEND_URL}/learner/${portalCode} |\n| **Generated** | ${now} |\n`;
      }
    }

    // Write the updated profile
    await fs.writeFile(learnerPath, content, "utf-8");

    return toolResponse({
      learnerId,
      name,
      portalCode,
      portalUrl: `${FRONTEND_URL}/learner/${portalCode}`,
      generatedAt: now,
      message: `Portal code generated for ${name}: ${portalCode}`,
    });
  }
);
