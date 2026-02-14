import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { DATA_DIR, toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";
import { listCourses, listStudents } from "../google/classroom.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const googleSyncClassroomTool = tool(
  "sync_with_classroom",
  "Sync with Google Classroom. Without a courseId, lists available courses. With a courseId, imports students as learner profiles and creates a group.",
  {
    courseId: z
      .string()
      .optional()
      .describe("Google Classroom course ID. If omitted, lists available courses."),
    groupName: z
      .string()
      .optional()
      .describe("Group name for imported students. Defaults to the course name."),
    domain: z
      .string()
      .optional()
      .describe("Skill domain for the group. Required when importing students."),
  },
  async ({ courseId, groupName, domain }) => {
    const status = await googleAuth.getStatus();
    if (!status.connected) {
      return toolResponse(
        { error: "Google account not connected. Call request_google_connection first." },
        true
      );
    }

    const auth = googleAuth.getClient();

    // List mode — no courseId
    if (!courseId) {
      const courses = await listCourses(auth);
      return toolResponse({
        mode: "list",
        courses,
        message:
          courses.length > 0
            ? `Found ${courses.length} active courses. Provide a courseId to import students.`
            : "No active courses found in Google Classroom.",
      });
    }

    // Import mode
    if (!domain) {
      return toolResponse(
        { error: "domain is required when importing students from a course." },
        true
      );
    }

    const students = await listStudents(auth, courseId);
    if (students.length === 0) {
      return toolResponse({ error: "No students found in this course." }, true);
    }

    const effectiveGroupName = groupName || `classroom-${courseId}`;
    const slug = slugify(effectiveGroupName);
    const learnersDir = path.join(DATA_DIR, "learners");
    const groupsDir = path.join(DATA_DIR, "groups");
    await fs.mkdir(learnersDir, { recursive: true });
    await fs.mkdir(groupsDir, { recursive: true });

    // Create learner profiles
    const memberIds: string[] = [];
    const memberNames: string[] = [];

    for (const student of students) {
      const name = student.fullName;
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
| **Email** | ${student.emailAddress} |

## Assessed Skills

_No skills assessed yet._

## Inferred Skills

_No skills inferred yet._

## Notes

_Imported from Google Classroom._
`;
      await fs.writeFile(
        path.join(learnersDir, `${id}.md`),
        learnerContent,
        "utf-8"
      );
    }

    // Create group file
    const groupContent = `# Group: ${effectiveGroupName}

| Field | Value |
|---|---|
| **Slug** | ${slug} |
| **Domain** | ${domain} |
| **Created** | ${new Date().toISOString()} |
| **Member count** | ${memberIds.length} |
| **Source** | Google Classroom (course ${courseId}) |

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
      mode: "import",
      imported: memberIds.length,
      groupName: slug,
      learnerIds: memberIds,
      learnerNames: memberNames,
    });
  }
);
