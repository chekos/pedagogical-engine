import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const DATA_DIR = process.env.DATA_DIR || "./data";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const loadRosterTool = tool(
  "load_roster",
  "Load or create a group and its learner profiles. Returns group metadata and member profiles.",
  {
    groupName: z.string().describe("Name or identifier for the group"),
    domain: z.string().describe("Skill domain, e.g. 'python-data-analysis'"),
    members: z
      .array(z.string())
      .optional()
      .describe("Optional list of learner names to add to the group"),
  },
  async ({ groupName, domain, members }) => {
    const slug = slugify(groupName);
    const groupPath = path.join(DATA_DIR, "groups", `${slug}.md`);
    const learnersDir = path.join(DATA_DIR, "learners");

    await fs.mkdir(path.join(DATA_DIR, "groups"), { recursive: true });
    await fs.mkdir(learnersDir, { recursive: true });

    let groupContent: string;
    let isNew = false;

    try {
      groupContent = await fs.readFile(groupPath, "utf-8");
    } catch {
      // Create new group
      isNew = true;
      const memberIds: string[] = [];

      if (members && members.length > 0) {
        for (const name of members) {
          const id = `${slugify(name)}-${nanoid(6)}`;
          memberIds.push(id);

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

_No notes yet._
`;
          await fs.writeFile(
            path.join(learnersDir, `${id}.md`),
            learnerContent,
            "utf-8"
          );
        }
      }

      groupContent = `# Group: ${groupName}

| Field | Value |
|---|---|
| **Slug** | ${slug} |
| **Domain** | ${domain} |
| **Created** | ${new Date().toISOString()} |
| **Member count** | ${memberIds.length} |

## Members

${memberIds.length > 0 ? memberIds.map((id, i) => `- ${members![i]} (\`${id}\`)`).join("\n") : "_No members yet._"}

## Interview Context

_Not yet interviewed. Use the interview-educator skill to gather context._

## Constraints

_No constraints recorded yet._
`;
      await fs.writeFile(groupPath, groupContent, "utf-8");
    }

    // Load all learner profiles associated with this group
    const profiles: Array<{ id: string; name: string; content: string }> = [];
    try {
      const files = await fs.readdir(learnersDir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const content = await fs.readFile(
          path.join(learnersDir, file),
          "utf-8"
        );
        if (content.includes(`| **Group** | ${slug} |`)) {
          const nameMatch = content.match(/# Learner Profile: (.+)/);
          profiles.push({
            id: file.replace(".md", ""),
            name: nameMatch ? nameMatch[1] : file.replace(".md", ""),
            content,
          });
        }
      }
    } catch {
      // No learner files yet
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              group: slug,
              domain,
              isNew,
              memberCount: profiles.length,
              groupFile: groupPath,
              groupContent,
              profiles: profiles.map((p) => ({
                id: p.id,
                name: p.name,
                content: p.content,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
