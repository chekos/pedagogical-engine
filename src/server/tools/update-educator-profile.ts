import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import type { EducatorProfile } from "./load-educator-profile.js";

const DATA_DIR = process.env.DATA_DIR || "./data";

export const updateEducatorProfileTool = tool(
  "update_educator_profile",
  "Create or update an educator's teaching profile. Use this to: (1) create a new profile during the first interview, (2) update preferences or style based on educator feedback, (3) adjust timing patterns after a debrief, (4) add content confidence for a new domain, (5) let the educator correct their own profile ('bump up my facilitation'). Always preserves existing fields not included in the update.",
  {
    educatorId: z
      .string()
      .describe("Educator profile ID (slug, e.g. 'dr-sarah-chen')"),
    name: z.string().optional().describe("Educator's display name"),
    bio: z.string().optional().describe("Short bio or description"),
    teaching_style_json: z
      .string()
      .optional()
      .describe(
        'Teaching style as JSON object, e.g. {"lecture":0.35,"discussion":0.15,"hands_on":0.25,"socratic":0.05,"project_based":0.10,"demonstration":0.10}. Values sum to ~1.0'
      ),
    strengths_json: z
      .string()
      .optional()
      .describe(
        'Strengths as JSON array, e.g. [{"area":"facilitation","confidence":0.90,"notes":"..."}]'
      ),
    growth_areas_json: z
      .string()
      .optional()
      .describe(
        'Growth areas as JSON array, e.g. [{"area":"time_management","notes":"..."}]'
      ),
    content_confidence_json: z
      .string()
      .optional()
      .describe(
        'Content confidence as JSON object keyed by domain, e.g. {"python-data-analysis":{"level":"expert","confidence":0.95,"notes":"..."}}'
      ),
    preferences_json: z
      .string()
      .optional()
      .describe(
        'Preferences as JSON object, e.g. {"lesson_start":"theory_first","group_work_comfort":"moderate"}'
      ),
    timing_patterns_json: z
      .string()
      .optional()
      .describe(
        'Timing patterns as JSON object, e.g. {"hands_on":{"adjustment_min":5,"notes":"Runs 5 min over"}}'
      ),
    growth_nudges_json: z
      .string()
      .optional()
      .describe("Growth nudges as JSON array of strings"),
    increment_sessions: z
      .boolean()
      .optional()
      .describe("Increment session_count by 1 (call after each session)"),
    increment_debriefs: z
      .boolean()
      .optional()
      .describe("Increment debrief_count by 1 (call after each debrief)"),
  },
  async ({
    educatorId,
    name,
    bio,
    teaching_style_json,
    strengths_json,
    growth_areas_json,
    content_confidence_json,
    preferences_json,
    timing_patterns_json,
    growth_nudges_json,
    increment_sessions,
    increment_debriefs,
  }) => {
    const educatorsDir = path.join(DATA_DIR, "educators");
    await fs.mkdir(educatorsDir, { recursive: true });

    const profilePath = path.join(educatorsDir, `${educatorId}.json`);
    const now = new Date().toISOString();

    // Load existing or create new
    let profile: EducatorProfile;
    let isNew = false;
    try {
      const raw = await fs.readFile(profilePath, "utf-8");
      profile = JSON.parse(raw);
    } catch {
      isNew = true;
      profile = {
        id: educatorId,
        name: name || educatorId,
        bio: bio || "",
        created: now,
        updated: now,
        teaching_style: {
          lecture: 0.2,
          discussion: 0.2,
          hands_on: 0.2,
          socratic: 0.1,
          project_based: 0.2,
          demonstration: 0.1,
        },
        strengths: [],
        growth_areas: [],
        content_confidence: {},
        preferences: {},
        timing_patterns: {},
        growth_nudges: [],
        session_count: 0,
        debrief_count: 0,
      };
    }

    // Apply updates
    if (name) profile.name = name;
    if (bio) profile.bio = bio;

    if (teaching_style_json) {
      profile.teaching_style = JSON.parse(teaching_style_json) as Record<string, number>;
    }
    if (strengths_json) {
      profile.strengths = JSON.parse(strengths_json) as EducatorProfile["strengths"];
    }
    if (growth_areas_json) {
      profile.growth_areas = JSON.parse(growth_areas_json) as EducatorProfile["growth_areas"];
    }
    if (content_confidence_json) {
      const parsed = JSON.parse(content_confidence_json) as EducatorProfile["content_confidence"];
      profile.content_confidence = {
        ...profile.content_confidence,
        ...parsed,
      };
    }
    if (preferences_json) {
      const parsed = JSON.parse(preferences_json) as Record<string, string>;
      profile.preferences = { ...profile.preferences, ...parsed };
    }
    if (timing_patterns_json) {
      const parsed = JSON.parse(timing_patterns_json) as EducatorProfile["timing_patterns"];
      profile.timing_patterns = {
        ...profile.timing_patterns,
        ...parsed,
      };
    }
    if (growth_nudges_json) {
      profile.growth_nudges = JSON.parse(growth_nudges_json) as string[];
    }
    if (increment_sessions) profile.session_count += 1;
    if (increment_debriefs) profile.debrief_count += 1;
    profile.updated = now;

    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2), "utf-8");

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              action: isNew ? "created" : "updated",
              educatorId,
              name: profile.name,
              updated: now,
              session_count: profile.session_count,
              debrief_count: profile.debrief_count,
              domains: Object.keys(profile.content_confidence),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
