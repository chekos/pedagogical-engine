/**
 * Parses lesson plan markdown into structured sections with timing info.
 * Powers the "you are here" progress indicator and time-aware nudges.
 */

export interface LessonMeta {
  title: string;
  group: string;
  date: string;
  domain: string;
  duration: number; // total minutes
  topic: string;
  oneThing: string;
}

export interface LessonSection {
  id: string;
  phase: string;
  title: string;
  startMin: number;
  endMin: number;
  durationMin: number;
  content: string; // raw markdown for this section
  activities: string[]; // short descriptions of activities
}

export interface ParsedLesson {
  meta: LessonMeta;
  sections: LessonSection[];
  objectives: string[];
  fullMarkdown: string;
}

/** Extract the filename-based ID from a lesson path */
export function lessonIdFromPath(filePath: string): string {
  const name = filePath.split("/").pop() ?? "";
  return name.replace(/\.md$/, "");
}

/** Parse lesson metadata from the header section */
function parseMeta(markdown: string): LessonMeta {
  const titleMatch = markdown.match(/^#\s+(?:Lesson Plan:\s*)?(.+)/m);
  const title = titleMatch?.[1]?.trim() ?? "Untitled Lesson";

  const groupMatch = markdown.match(/\*\*Prepared for:\*\*\s*(.+)/);
  const group = groupMatch?.[1]?.trim() ?? "";

  const dateMatch = markdown.match(/\*\*Date:\*\*\s*(.+)/);
  const date = dateMatch?.[1]?.trim() ?? "";

  const domainMatch = markdown.match(/\*\*Domain:\*\*\s*(.+)/);
  const domain = domainMatch?.[1]?.trim() ?? "";

  // Extract duration from the session overview table
  const durationMatch = markdown.match(
    /\|\s*\*\*Duration\*\*\s*\|\s*(\d+)\s*minutes?/i
  );
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : 60;

  const topicMatch = markdown.match(
    /\|\s*\*\*Topic\*\*\s*\|\s*(.+?)\s*\|/
  );
  const topic = topicMatch?.[1]?.trim() ?? "";

  const oneThingMatch = markdown.match(
    /\|\s*\*\*The one thing\*\*\s*\|\s*(.+?)\s*\|/
  );
  const oneThing = oneThingMatch?.[1]?.trim() ?? "";

  return { title, group, date, domain, duration, topic, oneThing };
}

/** Parse learning objectives */
function parseObjectives(markdown: string): string[] {
  const objSection = markdown.match(
    /### Learning Objectives\n([\s\S]*?)(?=\n###|\n---)/
  );
  if (!objSection) return [];

  const lines = objSection[1].split("\n");
  return lines
    .filter((l) => /^\d+\./.test(l.trim()))
    .map((l) => l.replace(/^\d+\.\s*/, "").trim());
}

/**
 * Parse timed sections from the lesson plan.
 * Looks for patterns like: **[0:00 - 0:03] Title (3 min)**
 * Also handles PHASE headers like: ### PHASE 1: OPENING + WARM-UP (0:00 - 0:25)
 */
function parseSections(markdown: string): LessonSection[] {
  const sections: LessonSection[] = [];

  // Find all phase headers first
  const phaseRegex =
    /###\s+PHASE\s+\d+:\s+(.+?)\s*\((\d+):(\d+)\s*-\s*(\d+):(\d+)\)/g;
  const phases: { name: string; startMin: number; endMin: number }[] = [];
  let phaseMatch;
  while ((phaseMatch = phaseRegex.exec(markdown)) !== null) {
    phases.push({
      name: phaseMatch[1].trim(),
      startMin: parseInt(phaseMatch[2]) * 60 + parseInt(phaseMatch[3]),
      endMin: parseInt(phaseMatch[4]) * 60 + parseInt(phaseMatch[5]),
    });
  }

  // Find all timed subsections (format: H:MM where 0:25 = 25min, 1:30 = 90min)
  const sectionRegex =
    /\*\*\[(\d+):(\d+)\s*-\s*(\d+):(\d+)\]\s*(.+?)\s*\((\d+)\s*min\)\*\*/g;
  const parsedSections: {
    startMin: number;
    endMin: number;
    title: string;
    durationMin: number;
    matchIndex: number;
    matchEnd: number;
  }[] = [];

  let m;
  while ((m = sectionRegex.exec(markdown)) !== null) {
    const startMin = parseInt(m[1]) * 60 + parseInt(m[2]);
    const endMin = parseInt(m[3]) * 60 + parseInt(m[4]);
    parsedSections.push({
      startMin,
      endMin,
      title: m[5].trim(),
      durationMin: parseInt(m[6]),
      matchIndex: m.index,
      matchEnd: m.index + m[0].length,
    });
  }

  // Extract content for each section (from match end to next section or end of plan)
  for (let i = 0; i < parsedSections.length; i++) {
    const s = parsedSections[i];
    const nextStart = parsedSections[i + 1]?.matchIndex ?? markdown.length;

    // Find which phase this section belongs to
    const phase =
      phases.find((p) => s.startMin >= p.startMin && s.endMin <= p.endMin)
        ?.name ?? "";

    // Extract content between this section header and the next
    const content = markdown.slice(s.matchEnd, nextStart).trim();

    // Extract short activity descriptions (lines starting with "Educator:" or key actions)
    const activities: string[] = [];
    const activityLines = content.match(
      /(?:^|\n)(?:Educator:|Say:|Students:|Watch for:)\s*(.+)/g
    );
    if (activityLines) {
      activities.push(
        ...activityLines
          .slice(0, 3)
          .map((l) => l.replace(/^\n/, "").trim())
      );
    }

    sections.push({
      id: `section-${i}`,
      phase,
      title: s.title,
      startMin: s.startMin,
      endMin: s.endMin,
      durationMin: s.durationMin,
      content,
      activities,
    });
  }

  // If no timed sections found, create sections from phase headers
  if (sections.length === 0 && phases.length > 0) {
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      sections.push({
        id: `phase-${i}`,
        phase: p.name,
        title: p.name,
        startMin: p.startMin,
        endMin: p.endMin,
        durationMin: p.endMin - p.startMin,
        content: "",
        activities: [],
      });
    }
  }

  return sections;
}

/** Full lesson parser */
export function parseLesson(markdown: string): ParsedLesson {
  return {
    meta: parseMeta(markdown),
    sections: parseSections(markdown),
    objectives: parseObjectives(markdown),
    fullMarkdown: markdown,
  };
}
