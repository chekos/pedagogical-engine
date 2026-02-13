import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

interface DebriefSectionFeedback {
  sectionTitle: string;
  timing: string;
  timingDelta?: number;
  engagement: string;
  notes?: string;
  usedContingency?: boolean;
}

interface ParsedDebrief {
  lessonId: string;
  domain: string;
  group: string;
  date: string;
  overallRating: string;
  sections: DebriefSectionFeedback[];
  teachingNotes: Array<{
    skillId: string;
    noteType: string;
    note: string;
  }>;
}

interface TeachingNote {
  id: string;
  skillId: string;
  type: string;
  observation: string;
  confidence: number;
  sessionCount: number;
  confirmedIn: string[];
  context: Record<string, unknown>;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface TeachingPattern {
  id: string;
  type: string;
  title: string;
  description: string;
  affectedSkills: string[];
  confidence: number;
  sessionCount: number;
  recommendation: string;
  createdAt: string;
}

interface TeachingNotesData {
  domain: string;
  version: string;
  sessionCount: number;
  lastUpdated: string;
  notes: TeachingNote[];
  patterns: TeachingPattern[];
}

function parseDebriefMd(content: string, filename: string): ParsedDebrief {
  const lessonMatch = content.match(/\| \*\*Lesson\*\* \| (.+) \|/);
  const domainMatch = content.match(/\| \*\*Domain\*\* \| (.+) \|/);
  const groupMatch = content.match(/\| \*\*Group\*\* \| (.+) \|/);
  const dateMatch = content.match(/\| \*\*Date\*\* \| (.+) \|/);
  const ratingMatch = content.match(/\| \*\*Overall rating\*\* \| (.+) \|/);

  // Parse sections
  const sections: DebriefSectionFeedback[] = [];
  const sectionRegex = /### (.+)\n\n\| Aspect \| Value \|\n\|---\|---\|\n([\s\S]*?)(?=\n###|\n## |$)/g;
  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(content)) !== null) {
    const title = sectionMatch[1].trim();
    const block = sectionMatch[2];

    const timingMatch = block.match(/\| \*\*Timing\*\* \| (.+?) \|/);
    const engagementMatch = block.match(/\| \*\*Engagement\*\* \| (.+?) \|/);
    const contingencyMatch = block.match(/\| \*\*Used contingency\*\* \| (.+?) \|/);

    let timing = "as_planned";
    let timingDelta: number | undefined;
    if (timingMatch) {
      const tv = timingMatch[1].trim();
      if (tv.includes("longer")) {
        timing = "longer";
        const deltaMatch = tv.match(/\+(\d+)/);
        if (deltaMatch) timingDelta = parseInt(deltaMatch[1]);
      } else if (tv.includes("shorter")) {
        timing = "shorter";
        const deltaMatch = tv.match(/-(\d+)/);
        if (deltaMatch) timingDelta = -parseInt(deltaMatch[1]);
      } else if (tv.includes("skipped")) {
        timing = "skipped";
      }
    }

    sections.push({
      sectionTitle: title,
      timing,
      timingDelta,
      engagement: engagementMatch?.[1]?.trim() ?? "moderate",
      usedContingency: contingencyMatch
        ? contingencyMatch[1].trim().toLowerCase() === "yes"
        : undefined,
    });
  }

  // Parse teaching notes
  const teachingNotes: Array<{ skillId: string; noteType: string; note: string }> = [];
  const notesSection = content.split("## Teaching Notes")[1]?.split("## ")[0] ?? "";
  const noteRegex = /- \((\w+)\) \*\*(.+?)\*\*: (.+)/g;
  let noteMatch;
  while ((noteMatch = noteRegex.exec(notesSection)) !== null) {
    teachingNotes.push({
      noteType: noteMatch[1],
      skillId: noteMatch[2],
      note: noteMatch[3].trim(),
    });
  }

  return {
    lessonId: lessonMatch?.[1]?.trim() ?? filename.replace(/-debrief.*$/, ""),
    domain: domainMatch?.[1]?.trim() ?? "",
    group: groupMatch?.[1]?.trim() ?? "",
    date: dateMatch?.[1]?.trim() ?? "",
    overallRating: ratingMatch?.[1]?.trim() ?? "",
    sections,
    teachingNotes,
  };
}

export const analyzeTeachingPatternsTool = tool(
  "analyze_teaching_patterns",
  "Scan all debriefs for a domain and detect recurring patterns: timing discrepancies, engagement trends, confusion points, and success patterns. Updates the domain's teaching-notes.json with any new patterns that reach sufficient confidence. Run this after processing a debrief to keep the wisdom layer current.",
  {
    domain: z.string().describe("Skill domain slug"),
    promotionThreshold: z
      .number()
      .optional()
      .describe(
        "Number of sessions that must confirm a pattern before it's promoted to a teaching note. Default: 3."
      ),
  },
  async ({ domain, promotionThreshold }) => {
    const threshold = promotionThreshold ?? 3;
    const now = new Date();

    // Load all debriefs for this domain
    const debriefDir = path.join(DATA_DIR, "debriefs");
    let debriefFiles: string[] = [];
    try {
      const files = await fs.readdir(debriefDir);
      debriefFiles = files.filter((f) => f.endsWith(".md"));
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              domain,
              analyzed: false,
              message: "No debriefs directory found. Run post-session debriefs first.",
            }),
          },
        ],
      };
    }

    // Parse all debriefs for this domain
    const debriefs: ParsedDebrief[] = [];
    for (const file of debriefFiles) {
      const content = await fs.readFile(path.join(debriefDir, file), "utf-8");
      const parsed = parseDebriefMd(content, file);
      if (parsed.domain === domain) {
        debriefs.push(parsed);
      }
    }

    if (debriefs.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              domain,
              analyzed: false,
              message: `No debriefs found for domain '${domain}'.`,
            }),
          },
        ],
      };
    }

    // Load existing teaching notes
    const notesPath = path.join(DATA_DIR, "domains", domain, "teaching-notes.json");
    let existingData: TeachingNotesData;
    try {
      const raw = await fs.readFile(notesPath, "utf-8");
      existingData = JSON.parse(raw);
    } catch {
      existingData = {
        domain,
        version: "1.0.0",
        sessionCount: 0,
        lastUpdated: now.toISOString(),
        notes: [],
        patterns: [],
      };
    }

    // Analyze timing patterns
    const timingMap = new Map<
      string,
      Array<{ debrief: string; timing: string; delta: number | undefined }>
    >();
    for (const d of debriefs) {
      for (const s of d.sections) {
        if (!timingMap.has(s.sectionTitle)) timingMap.set(s.sectionTitle, []);
        timingMap.get(s.sectionTitle)!.push({
          debrief: d.lessonId,
          timing: s.timing,
          delta: s.timingDelta,
        });
      }
    }

    const detectedPatterns: Array<{
      type: string;
      description: string;
      count: number;
      total: number;
      sections: string[];
    }> = [];

    for (const [section, entries] of timingMap) {
      const longCount = entries.filter((e) => e.timing === "longer").length;
      if (longCount >= threshold) {
        const avgDelta =
          entries
            .filter((e) => e.delta !== undefined && e.delta > 0)
            .reduce((s, e) => s + (e.delta ?? 0), 0) /
          Math.max(
            1,
            entries.filter((e) => e.delta !== undefined && e.delta > 0).length
          );

        detectedPatterns.push({
          type: "timing_overrun",
          description: `Section "${section}" ran long in ${longCount} of ${entries.length} sessions (avg +${Math.round(avgDelta)} min).`,
          count: longCount,
          total: entries.length,
          sections: [section],
        });
      }
    }

    // Analyze engagement patterns
    const engagementMap = new Map<string, Array<{ debrief: string; engagement: string }>>();
    for (const d of debriefs) {
      for (const s of d.sections) {
        if (!engagementMap.has(s.sectionTitle))
          engagementMap.set(s.sectionTitle, []);
        engagementMap.get(s.sectionTitle)!.push({
          debrief: d.lessonId,
          engagement: s.engagement,
        });
      }
    }

    for (const [section, entries] of engagementMap) {
      const lowCount = entries.filter(
        (e) => e.engagement === "low" || e.engagement === "mixed"
      ).length;
      const pct = Math.round((lowCount / entries.length) * 100);
      if (lowCount >= threshold && pct >= 50) {
        detectedPatterns.push({
          type: "low_engagement",
          description: `Section "${section}" has low/mixed engagement in ${pct}% of sessions (${lowCount}/${entries.length}).`,
          count: lowCount,
          total: entries.length,
          sections: [section],
        });
      }
    }

    // Analyze contingency usage
    const contingencyMap = new Map<string, number>();
    const contingencyTotal = new Map<string, number>();
    for (const d of debriefs) {
      for (const s of d.sections) {
        if (s.usedContingency !== undefined) {
          contingencyTotal.set(
            s.sectionTitle,
            (contingencyTotal.get(s.sectionTitle) ?? 0) + 1
          );
          if (s.usedContingency) {
            contingencyMap.set(
              s.sectionTitle,
              (contingencyMap.get(s.sectionTitle) ?? 0) + 1
            );
          }
        }
      }
    }

    for (const [section, count] of contingencyMap) {
      const total = contingencyTotal.get(section) ?? 1;
      if (count >= threshold) {
        detectedPatterns.push({
          type: "frequent_contingency",
          description: `Section "${section}" used contingency plan in ${count} of ${total} sessions. The planned activity may need restructuring.`,
          count,
          total,
          sections: [section],
        });
      }
    }

    // Aggregate teaching notes from debriefs
    const noteAggregation = new Map<
      string,
      { count: number; notes: string[]; type: string; skillId: string }
    >();
    for (const d of debriefs) {
      for (const n of d.teachingNotes) {
        const key = `${n.skillId}:${n.noteType}`;
        if (!noteAggregation.has(key)) {
          noteAggregation.set(key, {
            count: 0,
            notes: [],
            type: n.noteType,
            skillId: n.skillId,
          });
        }
        const agg = noteAggregation.get(key)!;
        agg.count++;
        agg.notes.push(n.note);
      }
    }

    // Update teaching notes file
    existingData.sessionCount = debriefs.length;
    existingData.lastUpdated = now.toISOString();
    await fs.writeFile(notesPath, JSON.stringify(existingData, null, 2), "utf-8");

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              domain,
              analyzed: true,
              debriefsAnalyzed: debriefs.length,
              promotionThreshold: threshold,
              patternsDetected: detectedPatterns.length,
              patterns: detectedPatterns,
              noteAggregation: Object.fromEntries(
                Array.from(noteAggregation.entries()).map(([key, val]) => [
                  key,
                  { count: val.count, type: val.type, skillId: val.skillId },
                ])
              ),
              existingNotesCount: existingData.notes.length,
              existingPatternsCount: existingData.patterns.length,
              timestamp: now.toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
