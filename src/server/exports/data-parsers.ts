import fs from "fs/promises";
import path from "path";
import { DATA_DIR, safePath } from "../tools/shared.js";


// ─── Types ──────────────────────────────────────────────────────

export interface LessonPlanData {
  id: string;
  title: string;
  rawContent: string;
  preparedFor?: string;
  date?: string;
  domain?: string;
  topic?: string;
  audience?: string;
  setting?: string;
  duration?: string;
  objectives: string[];
  prerequisiteSkills: string[];
  prerequisiteTools: Array<{ tool: string; required: boolean; cost: string; status: string }>;
  sections: Array<{ title: string; content: string; timing?: string }>;
  contingencies: string[];
  logistics: Array<{ resource: string; url: string }>;
}

export interface SkillEntry {
  skillId: string;
  confidence: number;
  bloomLevel: string;
  source: "assessed" | "inferred";
}

export interface LearnerData {
  id: string;
  name: string;
  group: string;
  domain: string;
  created: string;
  lastAssessed: string;
  skills: SkillEntry[];
  notes: string[];
}

export interface GroupData {
  slug: string;
  domain: string;
  created: string;
  memberCount: number;
  members: Array<{ name: string; id: string }>;
  interviewContext: Record<string, string>;
  constraints: string[];
}

export interface DomainSkill {
  id: string;
  label: string;
  bloom_level: string;
  dependencies: string[];
}

// ─── Parsers ────────────────────────────────────────────────────

export async function loadLessonPlan(lessonId: string): Promise<LessonPlanData> {
  const lessonsDir = safePath(DATA_DIR, "lessons");
  const files = await fs.readdir(lessonsDir);
  const file = files.find((f) => f.replace(".md", "") === lessonId);
  if (!file) throw new Error(`Lesson plan '${lessonId}' not found`);

  const raw = await fs.readFile(safePath(lessonsDir, file), "utf-8");
  return parseLessonPlanContent(lessonId, raw);
}

export async function listLessonPlans(): Promise<string[]> {
  const lessonsDir = safePath(DATA_DIR, "lessons");
  try {
    const files = await fs.readdir(lessonsDir);
    return files.filter((f) => f.endsWith(".md")).map((f) => f.replace(".md", ""));
  } catch {
    return [];
  }
}

function parseLessonPlanContent(id: string, raw: string): LessonPlanData {
  // Title
  const titleMatch = raw.match(/^# (.+)/m);
  const title = titleMatch ? titleMatch[1].replace(/^Lesson Plan:\s*/i, "") : id;

  // Metadata from header table
  const preparedFor = extractTableField(raw, "Prepared for");
  const date = extractTableField(raw, "Date");
  const domain = extractTableField(raw, "Domain");

  // Overview table
  const topic = extractTableField(raw, "Topic");
  const audience = extractTableField(raw, "Audience");
  const setting = extractTableField(raw, "Setting");
  const duration = extractTableField(raw, "Duration");

  // Learning objectives
  const objectives: string[] = [];
  const objSection = raw.split("### Learning Objectives")[1]?.split("###")[0] ?? "";
  for (const line of objSection.split("\n")) {
    const m = line.match(/^\d+\.\s+(.+)/);
    if (m) objectives.push(m[1].trim());
  }

  // Prerequisite skills
  const prerequisiteSkills: string[] = [];
  const prereqSection = raw.split("### Skill Prerequisites")[1]?.split("###")[0] ??
    raw.split("## Prerequisites Checklist")[1]?.split("##")[0] ?? "";
  for (const line of prereqSection.split("\n")) {
    const m = line.match(/^- \[[ x]\]\s*\*\*(.+?)\*\*/);
    if (m) prerequisiteSkills.push(m[1].trim());
  }

  // Prerequisite tools table
  const prerequisiteTools: Array<{ tool: string; required: boolean; cost: string; status: string }> = [];
  const toolSection = raw.split("### Tool & Account Requirements")[1]?.split("###")[0] ??
    raw.split("### Tool Requirements")[1]?.split("###")[0] ?? "";
  const toolTableLines = toolSection.split("\n").filter((l) => l.startsWith("|") && !l.includes("---"));
  for (let i = 1; i < toolTableLines.length; i++) {
    const cells = toolTableLines[i].split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 3) {
      prerequisiteTools.push({
        tool: cells[0],
        required: cells[1]?.toLowerCase() === "yes",
        cost: cells[2] ?? "Free",
        status: cells[3] ?? "",
      });
    }
  }

  // Parse sections with timing
  const sections: Array<{ title: string; content: string; timing?: string }> = [];
  const sectionRegex = /^###?\s+(?:PHASE\s+\d+:|Activity\s+\d+:?)?\s*(.+?)$/gm;
  let match;
  const allMatches: Array<{ index: number; title: string }> = [];
  while ((match = sectionRegex.exec(raw)) !== null) {
    allMatches.push({ index: match.index, title: match[1].trim() });
  }
  for (let i = 0; i < allMatches.length; i++) {
    const start = allMatches[i].index;
    const end = i + 1 < allMatches.length ? allMatches[i + 1].index : raw.length;
    const content = raw.slice(start, end).split("\n").slice(1).join("\n").trim();
    const timingMatch = allMatches[i].title.match(/\((\d+:\d+\s*-\s*\d+:\d+)\)/);
    const minMatch = allMatches[i].title.match(/\((\d+)\s*min/);
    sections.push({
      title: allMatches[i].title.replace(/\s*\([^)]+\)\s*$/, "").trim(),
      content: content.slice(0, 500), // Truncate for PDF
      timing: timingMatch ? timingMatch[1] : minMatch ? `${minMatch[1]} min` : undefined,
    });
  }

  // Contingencies
  const contingencies: string[] = [];
  const contSection = raw.split("## Contingency Notes")[1]?.split("## ")[0] ?? "";
  for (const line of contSection.split("\n")) {
    const m = line.match(/^### If (.+)/);
    if (m) contingencies.push(m[1].trim());
  }

  // Logistics
  const logistics: Array<{ resource: string; url: string }> = [];
  const logSection = raw.split("## Logistics & Links")[1]?.split("## ")[0] ?? "";
  const logLines = logSection.split("\n").filter((l) => l.startsWith("|") && !l.includes("---"));
  for (let i = 1; i < logLines.length; i++) {
    const cells = logLines[i].split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      logistics.push({ resource: cells[0], url: cells[1] });
    }
  }

  return {
    id,
    title,
    rawContent: raw,
    preparedFor,
    date,
    domain,
    topic,
    audience,
    setting,
    duration,
    objectives,
    prerequisiteSkills,
    prerequisiteTools,
    sections,
    contingencies,
    logistics,
  };
}

function extractTableField(raw: string, field: string): string | undefined {
  const regex = new RegExp(`\\|\\s*\\*\\*${field}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|`, "i");
  const match = raw.match(regex);
  if (match) return match[1].trim();

  // Also try without bold
  const regex2 = new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+?)$`, "im");
  const match2 = raw.match(regex2);
  return match2 ? match2[1].trim() : undefined;
}

export async function loadLearnerProfile(learnerId: string): Promise<LearnerData> {
  const filePath = safePath(DATA_DIR, "learners", `${learnerId}.md`);
  const raw = await fs.readFile(filePath, "utf-8");
  return parseLearnerContent(learnerId, raw);
}

function parseLearnerContent(id: string, raw: string): LearnerData {
  const nameMatch = raw.match(/# Learner Profile: (.+)/);
  const name = nameMatch ? nameMatch[1].trim() : id;

  const group = extractTableField(raw, "Group") ?? "";
  const domain = extractTableField(raw, "Domain") ?? "";
  const created = extractTableField(raw, "Created") ?? "";
  const lastAssessed = extractTableField(raw, "Last assessed") ?? "";

  const skills: SkillEntry[] = [];

  // Parse assessed skills
  const assessedSection = raw.split("## Assessed Skills")[1]?.split("##")[0] ?? "";
  for (const line of assessedSection.split("\n")) {
    const m = line.match(/^- (.+?):\s*([\d.]+)\s*confidence/i);
    if (m) {
      const bloomMatch = line.match(/at\s+(\w+)\s+level/i);
      skills.push({
        skillId: m[1].trim(),
        confidence: parseFloat(m[2]),
        bloomLevel: bloomMatch ? bloomMatch[1] : "unknown",
        source: "assessed",
      });
    }
  }

  // Parse inferred skills
  const inferredSection = raw.split("## Inferred Skills")[1]?.split("##")[0] ?? "";
  for (const line of inferredSection.split("\n")) {
    const m = line.match(/^- (.+?):\s*([\d.]+)\s*confidence/i);
    if (m) {
      skills.push({
        skillId: m[1].trim(),
        confidence: parseFloat(m[2]),
        bloomLevel: "inferred",
        source: "inferred",
      });
    }
  }

  // Parse notes
  const notes: string[] = [];
  const notesSection = raw.split("## Notes")[1] ?? "";
  for (const line of notesSection.split("\n")) {
    const m = line.match(/^- (.+)/);
    if (m) notes.push(m[1].trim());
  }

  return { id, name, group, domain, created, lastAssessed, skills, notes };
}

export async function loadGroupData(groupSlug: string): Promise<GroupData> {
  const filePath = safePath(DATA_DIR, "groups", `${groupSlug}.md`);
  const raw = await fs.readFile(filePath, "utf-8");
  return parseGroupContent(groupSlug, raw);
}

function parseGroupContent(slug: string, raw: string): GroupData {
  const domain = extractTableField(raw, "Domain") ?? "";
  const created = extractTableField(raw, "Created") ?? "";
  const memberCount = parseInt(extractTableField(raw, "Member count") ?? "0", 10);

  // Parse members
  const members: Array<{ name: string; id: string }> = [];
  const memberSection = raw.split("## Members")[1]?.split("##")[0] ?? "";
  for (const line of memberSection.split("\n")) {
    const m = line.match(/^- (.+?)\s*\(`(.+?)`\)/);
    if (m) {
      members.push({ name: m[1].trim(), id: m[2].trim() });
    }
  }

  // Parse interview context
  const interviewContext: Record<string, string> = {};
  const ctxSection = raw.split("## Interview Context")[1]?.split("##")[0] ?? "";
  for (const line of ctxSection.split("\n")) {
    const m = line.match(/^- \*\*(.+?)\*\*:\s*(.+)/);
    if (m) {
      interviewContext[m[1].trim()] = m[2].trim();
    }
  }

  // Parse constraints
  const constraints: string[] = [];
  const constSection = raw.split("## Constraints")[1]?.split("##")[0] ?? "";
  for (const line of constSection.split("\n")) {
    const m = line.match(/^- (.+)/);
    if (m) constraints.push(m[1].trim());
  }

  return { slug, domain, created, memberCount, members, interviewContext, constraints };
}

export async function loadDomainSkills(domain: string): Promise<DomainSkill[]> {
  const filePath = safePath(DATA_DIR, "domains", domain, "skills.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);
  return data.skills;
}

export async function loadAllLearnersInGroup(groupSlug: string): Promise<LearnerData[]> {
  const group = await loadGroupData(groupSlug);
  const learners: LearnerData[] = [];
  for (const member of group.members) {
    try {
      const learner = await loadLearnerProfile(member.id);
      learners.push(learner);
    } catch {
      // Skip missing profiles
    }
  }
  return learners;
}
