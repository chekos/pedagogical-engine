import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import type { EducatorProfile } from "./load-educator-profile.js";

const DATA_DIR = process.env.DATA_DIR || "./data";

export const analyzeEducatorContextTool = tool(
  "analyze_educator_context",
  "Analyze an educator's profile in the context of a specific lesson to generate actionable plan-customization recommendations. Returns activity type weighting, content scaffolding depth, timing adjustments, contingency style, and optional growth nudges. Call this BEFORE composing a lesson plan to get educator-specific customizations.",
  {
    educatorId: z.string().describe("Educator profile ID"),
    domain: z.string().describe("Domain being taught"),
    targetSkills: z
      .array(z.string())
      .describe("Skills the lesson will cover"),
    durationMinutes: z
      .number()
      .optional()
      .describe("Total session duration in minutes"),
  },
  async ({ educatorId, domain, targetSkills, durationMinutes }) => {
    const profilePath = path.join(
      DATA_DIR,
      "educators",
      `${educatorId}.json`
    );

    let profile: EducatorProfile;
    try {
      const raw = await fs.readFile(profilePath, "utf-8");
      profile = JSON.parse(raw);
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Educator profile '${educatorId}' not found`,
              recommendation:
                "Compose the lesson plan without educator customization, or create a profile first.",
            }),
          },
        ],
      };
    }

    // --- Activity type recommendations ---
    const styleEntries = Object.entries(profile.teaching_style).sort(
      ([, a], [, b]) => b - a
    );
    const preferredActivities = styleEntries
      .filter(([, pct]) => pct >= 0.15)
      .map(([type, pct]) => ({
        type,
        weight: Math.round(pct * 100),
        recommendation:
          pct >= 0.3
            ? "primary"
            : pct >= 0.2
              ? "secondary"
              : "occasional",
      }));

    const avoidActivities = styleEntries
      .filter(([, pct]) => pct < 0.1)
      .map(([type]) => type);

    // --- Content scaffolding depth ---
    const domainConfidence = profile.content_confidence[domain];
    let scaffoldingLevel: string;
    let scaffoldingNotes: string;

    if (!domainConfidence || domainConfidence.confidence < 0.5) {
      scaffoldingLevel = "detailed";
      scaffoldingNotes =
        "Include full talking points, suggested explanations, anticipated student questions with answers, and step-by-step walkthroughs. The educator is less confident in this domain.";
    } else if (domainConfidence.confidence < 0.75) {
      scaffoldingLevel = "moderate";
      scaffoldingNotes =
        "Include key talking points and anticipated tough questions, but trust the educator for basic explanations. Provide reference notes for complex topics.";
    } else {
      scaffoldingLevel = "minimal";
      scaffoldingNotes =
        "Brief content notes and bullet points. The educator has deep expertise and will explain in their own way. Focus on timing and structure rather than content details.";
    }

    // --- Timing adjustments ---
    const timingAdjustments: Array<{
      activityType: string;
      adjustmentMin: number;
      notes: string;
    }> = [];
    let totalAdjustment = 0;

    for (const [actType, pattern] of Object.entries(profile.timing_patterns)) {
      if (pattern.adjustment_min !== 0) {
        timingAdjustments.push({
          activityType: actType,
          adjustmentMin: pattern.adjustment_min,
          notes: pattern.notes,
        });
        totalAdjustment += pattern.adjustment_min;
      }
    }

    const timingSummary =
      totalAdjustment > 0
        ? `This educator tends to run ${totalAdjustment} min over total. Pre-shorten activities accordingly.`
        : totalAdjustment < 0
          ? `This educator tends to finish ${Math.abs(totalAdjustment)} min early. Consider adding extension activities.`
          : "This educator typically stays on schedule.";

    // --- Contingency style ---
    const contingencyPref =
      profile.preferences.contingency_preference || "specific_alternatives";
    let contingencyGuidance: string;
    if (contingencyPref === "open_ended_pivots") {
      contingencyGuidance =
        "Use open-ended contingencies: 'If students struggle, pivot to a discussion about why this is hard.' This educator improvises well.";
    } else {
      contingencyGuidance =
        "Use specific contingencies: 'If students struggle with X, switch to exercise Y (detailed instructions below).' This educator prefers structure.";
    }

    // --- Growth nudge (pick the most relevant one for this lesson) ---
    let growthNudge: string | null = null;
    if (profile.growth_nudges.length > 0) {
      // Pick a nudge that's relevant to the current context
      const skillKeywords = targetSkills.join(" ").toLowerCase();
      const relevantNudge = profile.growth_nudges.find(
        (n) =>
          n.toLowerCase().includes("hands-on") ||
          n.toLowerCase().includes("discussion") ||
          skillKeywords.includes("group")
      );
      growthNudge = relevantNudge || profile.growth_nudges[0];
    }

    // --- Strength-based activity recommendations ---
    const strengthAreas = profile.strengths
      .filter((s) => s.confidence >= 0.8)
      .map((s) => s.area);

    const activityRecommendations: string[] = [];
    if (strengthAreas.includes("facilitation")) {
      activityRecommendations.push(
        "Include guided discussion and think-pair-share activities — this educator excels at facilitation"
      );
    }
    if (strengthAreas.includes("content_expertise")) {
      activityRecommendations.push(
        "Include live coding and worked examples — this educator has deep content knowledge"
      );
    }
    if (strengthAreas.includes("improvisation")) {
      activityRecommendations.push(
        "Include open-ended exploration time — this educator thrives when adapting on the fly"
      );
    }
    if (strengthAreas.includes("group_management")) {
      activityRecommendations.push(
        "Include multi-group and pair activities — this educator manages groups well"
      );
    }
    if (strengthAreas.includes("rapport_building")) {
      activityRecommendations.push(
        "Include collaborative and peer activities — this educator creates a safe learning environment"
      );
    }

    const result = {
      educatorId: profile.id,
      educatorName: profile.name,
      domain,
      domainExpertise: domainConfidence
        ? domainConfidence.level
        : "unknown",

      activityCustomization: {
        preferred: preferredActivities,
        avoid: avoidActivities,
        recommendations: activityRecommendations,
      },

      contentScaffolding: {
        level: scaffoldingLevel,
        notes: scaffoldingNotes,
        domainConfidence: domainConfidence?.confidence ?? null,
      },

      timingCustomization: {
        adjustments: timingAdjustments,
        summary: timingSummary,
        totalAdjustmentMin: totalAdjustment,
        effectiveDuration: durationMinutes
          ? durationMinutes - totalAdjustment
          : null,
      },

      contingencyStyle: {
        preference: contingencyPref,
        guidance: contingencyGuidance,
      },

      growthNudge,

      lessonPlanGuidance: `When composing this lesson plan for ${profile.name}:
1. ACTIVITY TYPES: Weight toward ${preferredActivities.slice(0, 2).map((a) => a.type).join(" and ")}. ${avoidActivities.length > 0 ? `Minimize ${avoidActivities.join(", ")}.` : ""}
2. CONTENT DEPTH: ${scaffoldingLevel} scaffolding — ${scaffoldingNotes}
3. TIMING: ${timingSummary}${timingAdjustments.length > 0 ? " Specific adjustments: " + timingAdjustments.map((t) => `${t.activityType} ${t.adjustmentMin > 0 ? "+" : ""}${t.adjustmentMin}min`).join(", ") : ""}
4. CONTINGENCIES: ${contingencyGuidance}
5. STRENGTHS TO LEVERAGE: ${strengthAreas.join(", ") || "None identified yet"}
${growthNudge ? `6. GROWTH NUDGE: ${growthNudge}` : ""}`,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);
