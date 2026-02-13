import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

export interface EducatorProfile {
  id: string;
  name: string;
  bio: string;
  created: string;
  updated: string;
  teaching_style: Record<string, number>;
  strengths: Array<{ area: string; confidence: number; notes: string }>;
  growth_areas: Array<{ area: string; notes: string }>;
  content_confidence: Record<string, { level: string; confidence: number; notes: string }>;
  preferences: Record<string, string>;
  timing_patterns: Record<string, { adjustment_min: number; notes: string }>;
  growth_nudges: string[];
  session_count: number;
  debrief_count: number;
}

export const loadEducatorProfileTool = tool(
  "load_educator_profile",
  "Load an educator's teaching profile. Returns their teaching style distribution, strengths, growth areas, content confidence per domain, timing patterns, and preferences. Use this before composing lesson plans to tailor the plan to this specific educator. Also supports listing all available educator profiles.",
  {
    educatorId: z
      .string()
      .optional()
      .describe(
        "Educator profile ID (slug). If omitted, lists all available educator profiles."
      ),
  },
  async ({ educatorId }) => {
    const educatorsDir = path.join(DATA_DIR, "educators");

    if (!educatorId) {
      // List all educator profiles
      try {
        const files = await fs.readdir(educatorsDir);
        const jsonFiles = files.filter((f) => f.endsWith(".json"));
        const profiles = await Promise.all(
          jsonFiles.map(async (file) => {
            const raw = await fs.readFile(
              path.join(educatorsDir, file),
              "utf-8"
            );
            const data: EducatorProfile = JSON.parse(raw);
            return {
              id: data.id,
              name: data.name,
              bio: data.bio,
              session_count: data.session_count,
              top_style: Object.entries(data.teaching_style).sort(
                ([, a], [, b]) => b - a
              )[0],
              domains: Object.keys(data.content_confidence),
            };
          })
        );
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { educators: profiles, count: profiles.length },
                null,
                2
              ),
            },
          ],
        };
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                educators: [],
                count: 0,
                note: "No educator profiles found. Create one during the interview.",
              }),
            },
          ],
        };
      }
    }

    // Load specific educator profile
    const profilePath = path.join(educatorsDir, `${educatorId}.json`);
    try {
      const raw = await fs.readFile(profilePath, "utf-8");
      const profile: EducatorProfile = JSON.parse(raw);

      // Compute summary insights
      const topStyles = Object.entries(profile.teaching_style)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      const topStrengths = profile.strengths
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                profile,
                summary: {
                  dominant_styles: topStyles.map(([style, pct]) => ({
                    style,
                    percentage: Math.round(pct * 100),
                  })),
                  top_strengths: topStrengths.map((s) => s.area),
                  growth_areas: profile.growth_areas.map((g) => g.area),
                  active_domains: Object.keys(profile.content_confidence),
                  total_sessions: profile.session_count,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Educator profile '${educatorId}' not found`,
              suggestion:
                "Use load_educator_profile without an ID to list available profiles, or create a new one during the interview.",
            }),
          },
        ],
      };
    }
  }
);
