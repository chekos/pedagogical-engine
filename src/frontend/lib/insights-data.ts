// Seed data for the analytics & insights dashboard.
// Includes historical time-series snapshots, lesson effectiveness metrics,
// and computed analytics derived from the learner profiles in data/learners/.

import { BLOOM_COLORS } from "./constants";

// ─── Bloom's taxonomy levels ─────────────────────────────────────

export const BLOOM_LEVELS = ["knowledge", "comprehension", "application", "analysis", "synthesis", "evaluation"] as const;
export type BloomLevel = typeof BLOOM_LEVELS[number];

// ─── Types ───────────────────────────────────────────────────────

export interface SkillSnapshot {
  date: string; // ISO date
  skillsConfirmed: number;
  skillsInferred: number;
  avgConfidence: number;
  bloomDistribution: Record<BloomLevel, number>;
}

export interface LearnerTimeSeries {
  id: string;
  name: string;
  snapshots: SkillSnapshot[];
  currentSkills: Record<string, { confidence: number; bloom: BloomLevel; type: "assessed" | "inferred" }>;
}

export interface LessonEffectiveness {
  id: string;
  title: string;
  date: string;
  plannedMinutes: number;
  actualMinutes: number;
  sectionsPlanned: number;
  sectionsCompleted: number;
  iterationsNeeded: number; // how many times the plan was revised
  avgSkillGainPost: number; // avg confidence improvement in target skills
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface TopicStruggle {
  skillId: string;
  skillLabel: string;
  bloomLevel: BloomLevel;
  avgConfidence: number;
  assessmentAttempts: number;
  avgAttemptsToPass: number;
  commonErrors: string[];
}

export interface PairingResult {
  learner1: string;
  learner2: string;
  session: string;
  skillFocus: string;
  learner1Before: number;
  learner1After: number;
  learner2Before: number;
  learner2After: number;
}

export interface GroupProgressPoint {
  date: string;
  avgSkillsConfirmed: number;
  minSkillsConfirmed: number;
  maxSkillsConfirmed: number;
  cohesionScore: number; // 0-1, how close together the group is
}

export interface SkillGap {
  skillId: string;
  label: string;
  bloom: string;
  min: number;
  max: number;
  avg: number;
  gap: number;
  confidences: number[];
}

export interface ReadinessPrediction {
  skillId: string;
  label: string;
  bloom: string;
  readiness: number;
  prereqsMet: number;
  prereqsTotal: number;
}

export interface HeatmapCell {
  skillId: string;
  confidence: number;
  type: "assessed" | "inferred" | null;
}

export interface HeatmapData {
  skills: { id: string; label: string; bloom: string }[];
  learners: {
    id: string;
    name: string;
    skills: HeatmapCell[];
  }[];
}

// ─── All 25 skills reference ─────────────────────────────────────

const ALL_SKILLS = [
  { id: "open-terminal", label: "Open terminal", bloom: "knowledge" },
  { id: "navigate-directories", label: "Navigate directories", bloom: "application" },
  { id: "install-python", label: "Install Python", bloom: "application" },
  { id: "run-python-script", label: "Run Python script", bloom: "application" },
  { id: "python-variables-types", label: "Variables & types", bloom: "comprehension" },
  { id: "python-control-flow", label: "Control flow", bloom: "application" },
  { id: "python-functions", label: "Functions", bloom: "application" },
  { id: "install-packages", label: "Install packages", bloom: "application" },
  { id: "use-jupyter", label: "Use Jupyter", bloom: "application" },
  { id: "import-pandas", label: "Import pandas", bloom: "application" },
  { id: "inspect-dataframe", label: "Inspect DataFrame", bloom: "comprehension" },
  { id: "select-filter-data", label: "Select & filter", bloom: "application" },
  { id: "handle-missing-data", label: "Handle missing data", bloom: "application" },
  { id: "pandas-groupby", label: "GroupBy", bloom: "application" },
  { id: "pandas-merge-join", label: "Merge & join", bloom: "application" },
  { id: "basic-plotting", label: "Basic plotting", bloom: "application" },
  { id: "interpret-distributions", label: "Interpret distributions", bloom: "analysis" },
  { id: "identify-data-quality-issues", label: "Data quality issues", bloom: "analysis" },
  { id: "reshape-data", label: "Reshape data", bloom: "application" },
  { id: "write-reusable-analysis-functions", label: "Reusable functions", bloom: "synthesis" },
  { id: "explain-analysis-choices", label: "Explain choices", bloom: "evaluation" },
  { id: "critique-visualization", label: "Critique viz", bloom: "evaluation" },
  { id: "exploratory-data-analysis", label: "EDA", bloom: "analysis" },
  { id: "build-analysis-narrative", label: "Analysis narrative", bloom: "synthesis" },
  { id: "design-data-pipeline", label: "Data pipeline", bloom: "synthesis" },
];

// ─── Skill prerequisite map ──────────────────────────────────────
// Simplified adjacency list derived from data/domains/python-data-analysis/dependencies.json.
// Maps each skill to the skills that must be confirmed before it.

const SKILL_PREREQUISITES: Record<string, string[]> = {
  "navigate-directories": ["open-terminal"],
  "install-python": ["open-terminal"],
  "run-python-script": ["navigate-directories", "install-python"],
  "python-variables-types": ["run-python-script"],
  "python-control-flow": ["python-variables-types"],
  "python-functions": ["python-control-flow"],
  "install-packages": ["run-python-script"],
  "use-jupyter": ["install-packages", "run-python-script"],
  "import-pandas": ["install-packages", "python-variables-types"],
  "inspect-dataframe": ["import-pandas"],
  "select-filter-data": ["inspect-dataframe", "python-control-flow"],
  "handle-missing-data": ["inspect-dataframe"],
  "pandas-groupby": ["select-filter-data", "python-functions"],
  "pandas-merge-join": ["select-filter-data"],
  "basic-plotting": ["import-pandas", "install-packages"],
  "interpret-distributions": ["basic-plotting", "inspect-dataframe"],
  "identify-data-quality-issues": ["handle-missing-data", "inspect-dataframe", "interpret-distributions"],
  "reshape-data": ["pandas-groupby", "select-filter-data"],
  "write-reusable-analysis-functions": ["python-functions", "pandas-groupby", "handle-missing-data"],
  "explain-analysis-choices": ["pandas-groupby", "interpret-distributions", "identify-data-quality-issues"],
  "critique-visualization": ["basic-plotting", "interpret-distributions"],
  "exploratory-data-analysis": ["interpret-distributions", "identify-data-quality-issues", "pandas-groupby", "basic-plotting"],
  "build-analysis-narrative": ["exploratory-data-analysis", "use-jupyter", "explain-analysis-choices"],
  "design-data-pipeline": ["write-reusable-analysis-functions", "reshape-data", "pandas-merge-join", "identify-data-quality-issues", "build-analysis-narrative"],
};

// ─── Learner time-series data ────────────────────────────────────
// Simulates 5 assessment sessions over 2 weeks for each learner.

export function getLearnerTimeSeries(): LearnerTimeSeries[] {
  return [
    {
      id: "priya-sharma",
      name: "Priya Sharma",
      snapshots: [
        { date: "2026-01-28", skillsConfirmed: 6, skillsInferred: 0, avgConfidence: 0.88, bloomDistribution: { knowledge: 1, comprehension: 1, application: 4, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-01", skillsConfirmed: 10, skillsInferred: 1, avgConfidence: 0.86, bloomDistribution: { knowledge: 1, comprehension: 2, application: 7, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-05", skillsConfirmed: 14, skillsInferred: 1, avgConfidence: 0.83, bloomDistribution: { knowledge: 1, comprehension: 2, application: 9, analysis: 2, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-08", skillsConfirmed: 16, skillsInferred: 2, avgConfidence: 0.82, bloomDistribution: { knowledge: 1, comprehension: 2, application: 9, analysis: 3, synthesis: 0, evaluation: 1 } },
        { date: "2026-02-11", skillsConfirmed: 18, skillsInferred: 2, avgConfidence: 0.81, bloomDistribution: { knowledge: 1, comprehension: 2, application: 9, analysis: 3, synthesis: 1, evaluation: 2 } },
      ],
      currentSkills: {
        "open-terminal": { confidence: 0.95, bloom: "application", type: "assessed" },
        "navigate-directories": { confidence: 0.90, bloom: "application", type: "assessed" },
        "install-python": { confidence: 0.85, bloom: "application", type: "assessed" },
        "run-python-script": { confidence: 0.90, bloom: "application", type: "assessed" },
        "python-variables-types": { confidence: 0.90, bloom: "comprehension", type: "assessed" },
        "python-control-flow": { confidence: 0.85, bloom: "application", type: "assessed" },
        "python-functions": { confidence: 0.80, bloom: "application", type: "assessed" },
        "install-packages": { confidence: 0.85, bloom: "application", type: "assessed" },
        "use-jupyter": { confidence: 0.90, bloom: "application", type: "assessed" },
        "import-pandas": { confidence: 0.90, bloom: "application", type: "assessed" },
        "inspect-dataframe": { confidence: 0.85, bloom: "comprehension", type: "assessed" },
        "select-filter-data": { confidence: 0.80, bloom: "application", type: "assessed" },
        "handle-missing-data": { confidence: 0.75, bloom: "application", type: "assessed" },
        "pandas-groupby": { confidence: 0.80, bloom: "application", type: "assessed" },
        "basic-plotting": { confidence: 0.75, bloom: "application", type: "assessed" },
        "interpret-distributions": { confidence: 0.70, bloom: "analysis", type: "assessed" },
        "identify-data-quality-issues": { confidence: 0.65, bloom: "analysis", type: "assessed" },
        "exploratory-data-analysis": { confidence: 0.60, bloom: "analysis", type: "assessed" },
        "pandas-merge-join": { confidence: 0.72, bloom: "application", type: "inferred" },
        "reshape-data": { confidence: 0.64, bloom: "application", type: "inferred" },
      },
    },
    {
      id: "marcus-johnson",
      name: "Marcus Johnson",
      snapshots: [
        { date: "2026-01-28", skillsConfirmed: 4, skillsInferred: 0, avgConfidence: 0.80, bloomDistribution: { knowledge: 1, comprehension: 1, application: 2, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-01", skillsConfirmed: 7, skillsInferred: 0, avgConfidence: 0.75, bloomDistribution: { knowledge: 2, comprehension: 2, application: 3, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-05", skillsConfirmed: 9, skillsInferred: 1, avgConfidence: 0.72, bloomDistribution: { knowledge: 2, comprehension: 2, application: 5, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-08", skillsConfirmed: 11, skillsInferred: 1, avgConfidence: 0.70, bloomDistribution: { knowledge: 2, comprehension: 3, application: 6, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-11", skillsConfirmed: 12, skillsInferred: 1, avgConfidence: 0.69, bloomDistribution: { knowledge: 2, comprehension: 3, application: 7, analysis: 0, synthesis: 0, evaluation: 0 } },
      ],
      currentSkills: {
        "open-terminal": { confidence: 0.90, bloom: "application", type: "assessed" },
        "navigate-directories": { confidence: 0.80, bloom: "application", type: "assessed" },
        "install-python": { confidence: 0.75, bloom: "knowledge", type: "assessed" },
        "run-python-script": { confidence: 0.80, bloom: "application", type: "assessed" },
        "python-variables-types": { confidence: 0.75, bloom: "comprehension", type: "assessed" },
        "python-control-flow": { confidence: 0.70, bloom: "application", type: "assessed" },
        "python-functions": { confidence: 0.55, bloom: "comprehension", type: "assessed" },
        "install-packages": { confidence: 0.70, bloom: "application", type: "assessed" },
        "import-pandas": { confidence: 0.65, bloom: "application", type: "assessed" },
        "inspect-dataframe": { confidence: 0.70, bloom: "comprehension", type: "assessed" },
        "select-filter-data": { confidence: 0.50, bloom: "knowledge", type: "assessed" },
        "basic-plotting": { confidence: 0.60, bloom: "application", type: "assessed" },
        "use-jupyter": { confidence: 0.56, bloom: "application", type: "inferred" },
      },
    },
    {
      id: "sofia-ramirez",
      name: "Sofia Ramirez",
      snapshots: [
        { date: "2026-01-28", skillsConfirmed: 5, skillsInferred: 0, avgConfidence: 0.82, bloomDistribution: { knowledge: 1, comprehension: 1, application: 3, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-01", skillsConfirmed: 8, skillsInferred: 1, avgConfidence: 0.78, bloomDistribution: { knowledge: 1, comprehension: 2, application: 5, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-05", skillsConfirmed: 10, skillsInferred: 1, avgConfidence: 0.76, bloomDistribution: { knowledge: 1, comprehension: 2, application: 6, analysis: 1, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-08", skillsConfirmed: 12, skillsInferred: 2, avgConfidence: 0.74, bloomDistribution: { knowledge: 2, comprehension: 3, application: 6, analysis: 1, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-11", skillsConfirmed: 13, skillsInferred: 2, avgConfidence: 0.73, bloomDistribution: { knowledge: 1, comprehension: 3, application: 7, analysis: 1, synthesis: 0, evaluation: 1 } },
      ],
      currentSkills: {
        "open-terminal": { confidence: 0.90, bloom: "application", type: "assessed" },
        "navigate-directories": { confidence: 0.80, bloom: "application", type: "assessed" },
        "install-python": { confidence: 0.80, bloom: "application", type: "assessed" },
        "run-python-script": { confidence: 0.85, bloom: "application", type: "assessed" },
        "python-variables-types": { confidence: 0.80, bloom: "comprehension", type: "assessed" },
        "python-control-flow": { confidence: 0.75, bloom: "application", type: "assessed" },
        "python-functions": { confidence: 0.65, bloom: "application", type: "assessed" },
        "install-packages": { confidence: 0.75, bloom: "application", type: "assessed" },
        "import-pandas": { confidence: 0.70, bloom: "application", type: "assessed" },
        "inspect-dataframe": { confidence: 0.75, bloom: "comprehension", type: "assessed" },
        "handle-missing-data": { confidence: 0.60, bloom: "knowledge", type: "assessed" },
        "basic-plotting": { confidence: 0.70, bloom: "application", type: "assessed" },
        "interpret-distributions": { confidence: 0.55, bloom: "comprehension", type: "assessed" },
        "use-jupyter": { confidence: 0.60, bloom: "application", type: "inferred" },
        "select-filter-data": { confidence: 0.68, bloom: "application", type: "inferred" },
      },
    },
    {
      id: "alex-chen",
      name: "Alex Chen",
      snapshots: [
        { date: "2026-01-28", skillsConfirmed: 1, skillsInferred: 0, avgConfidence: 0.55, bloomDistribution: { knowledge: 1, comprehension: 0, application: 0, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-01", skillsConfirmed: 2, skillsInferred: 0, avgConfidence: 0.52, bloomDistribution: { knowledge: 2, comprehension: 0, application: 0, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-05", skillsConfirmed: 4, skillsInferred: 0, avgConfidence: 0.55, bloomDistribution: { knowledge: 3, comprehension: 0, application: 1, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-08", skillsConfirmed: 5, skillsInferred: 0, avgConfidence: 0.54, bloomDistribution: { knowledge: 4, comprehension: 1, application: 0, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-11", skillsConfirmed: 6, skillsInferred: 0, avgConfidence: 0.52, bloomDistribution: { knowledge: 6, comprehension: 0, application: 0, analysis: 0, synthesis: 0, evaluation: 0 } },
      ],
      currentSkills: {
        "open-terminal": { confidence: 0.70, bloom: "knowledge", type: "assessed" },
        "navigate-directories": { confidence: 0.50, bloom: "knowledge", type: "assessed" },
        "install-python": { confidence: 0.60, bloom: "knowledge", type: "assessed" },
        "run-python-script": { confidence: 0.55, bloom: "knowledge", type: "assessed" },
        "python-variables-types": { confidence: 0.45, bloom: "knowledge", type: "assessed" },
        "python-control-flow": { confidence: 0.30, bloom: "knowledge", type: "assessed" },
      },
    },
    {
      id: "nkechi-okonkwo",
      name: "Nkechi Okonkwo",
      snapshots: [
        { date: "2026-01-28", skillsConfirmed: 5, skillsInferred: 0, avgConfidence: 0.88, bloomDistribution: { knowledge: 0, comprehension: 1, application: 4, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-01", skillsConfirmed: 8, skillsInferred: 0, avgConfidence: 0.83, bloomDistribution: { knowledge: 1, comprehension: 1, application: 6, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-05", skillsConfirmed: 10, skillsInferred: 1, avgConfidence: 0.78, bloomDistribution: { knowledge: 2, comprehension: 1, application: 7, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-08", skillsConfirmed: 11, skillsInferred: 2, avgConfidence: 0.74, bloomDistribution: { knowledge: 3, comprehension: 1, application: 7, analysis: 0, synthesis: 0, evaluation: 0 } },
        { date: "2026-02-11", skillsConfirmed: 12, skillsInferred: 2, avgConfidence: 0.73, bloomDistribution: { knowledge: 3, comprehension: 1, application: 8, analysis: 0, synthesis: 0, evaluation: 0 } },
      ],
      currentSkills: {
        "open-terminal": { confidence: 0.95, bloom: "application", type: "assessed" },
        "navigate-directories": { confidence: 0.90, bloom: "application", type: "assessed" },
        "install-python": { confidence: 0.90, bloom: "application", type: "assessed" },
        "run-python-script": { confidence: 0.85, bloom: "application", type: "assessed" },
        "python-variables-types": { confidence: 0.80, bloom: "comprehension", type: "assessed" },
        "python-control-flow": { confidence: 0.80, bloom: "application", type: "assessed" },
        "python-functions": { confidence: 0.70, bloom: "application", type: "assessed" },
        "install-packages": { confidence: 0.80, bloom: "application", type: "assessed" },
        "use-jupyter": { confidence: 0.75, bloom: "application", type: "assessed" },
        "import-pandas": { confidence: 0.55, bloom: "knowledge", type: "assessed" },
        "inspect-dataframe": { confidence: 0.45, bloom: "knowledge", type: "assessed" },
        "basic-plotting": { confidence: 0.40, bloom: "knowledge", type: "assessed" },
        "handle-missing-data": { confidence: 0.41, bloom: "application", type: "inferred" },
        "select-filter-data": { confidence: 0.41, bloom: "application", type: "inferred" },
      },
    },
  ];
}

// ─── Lesson effectiveness data ───────────────────────────────────

export function getLessonEffectiveness(): LessonEffectiveness[] {
  return [
    {
      id: "lesson-1",
      title: "Python Environment Setup",
      date: "2026-01-28",
      plannedMinutes: 90,
      actualMinutes: 105,
      sectionsPlanned: 5,
      sectionsCompleted: 4,
      iterationsNeeded: 1,
      avgSkillGainPost: 0.15,
      topic: "Environment Setup",
      difficulty: "easy",
    },
    {
      id: "lesson-2",
      title: "Variables, Types & Control Flow",
      date: "2026-02-01",
      plannedMinutes: 90,
      actualMinutes: 95,
      sectionsPlanned: 6,
      sectionsCompleted: 6,
      iterationsNeeded: 1,
      avgSkillGainPost: 0.18,
      topic: "Python Fundamentals",
      difficulty: "easy",
    },
    {
      id: "lesson-3",
      title: "Functions & Package Management",
      date: "2026-02-05",
      plannedMinutes: 90,
      actualMinutes: 110,
      sectionsPlanned: 5,
      sectionsCompleted: 4,
      iterationsNeeded: 2,
      avgSkillGainPost: 0.12,
      topic: "Python Fundamentals",
      difficulty: "medium",
    },
    {
      id: "lesson-4",
      title: "Pandas Introduction & DataFrames",
      date: "2026-02-08",
      plannedMinutes: 120,
      actualMinutes: 135,
      sectionsPlanned: 7,
      sectionsCompleted: 5,
      iterationsNeeded: 3,
      avgSkillGainPost: 0.10,
      topic: "Pandas Basics",
      difficulty: "hard",
    },
    {
      id: "lesson-5",
      title: "Basic Plotting with Matplotlib",
      date: "2026-02-11",
      plannedMinutes: 90,
      actualMinutes: 88,
      sectionsPlanned: 5,
      sectionsCompleted: 5,
      iterationsNeeded: 1,
      avgSkillGainPost: 0.14,
      topic: "Visualization",
      difficulty: "medium",
    },
    {
      id: "lesson-6",
      title: "Pandas GroupBy & Aggregation",
      date: "2026-02-12",
      plannedMinutes: 90,
      actualMinutes: 100,
      sectionsPlanned: 6,
      sectionsCompleted: 5,
      iterationsNeeded: 2,
      avgSkillGainPost: 0.08,
      topic: "Pandas Advanced",
      difficulty: "hard",
    },
  ];
}

// ─── Topic struggle data ─────────────────────────────────────────

export function getTopicStruggleData(): TopicStruggle[] {
  return [
    { skillId: "python-control-flow", skillLabel: "Control flow (if/for/while)", bloomLevel: "application", avgConfidence: 0.56, assessmentAttempts: 12, avgAttemptsToPass: 2.8, commonErrors: ["Infinite loops", "Off-by-one in ranges", "Nested condition confusion"] },
    { skillId: "python-functions", skillLabel: "Functions", bloomLevel: "application", avgConfidence: 0.61, assessmentAttempts: 10, avgAttemptsToPass: 2.4, commonErrors: ["Return vs print confusion", "Scope issues", "Default arg mutability"] },
    { skillId: "select-filter-data", skillLabel: "Select & filter data", bloomLevel: "application", avgConfidence: 0.55, assessmentAttempts: 8, avgAttemptsToPass: 3.1, commonErrors: ["loc vs iloc confusion", "Boolean indexing syntax", "Chaining operations"] },
    { skillId: "handle-missing-data", skillLabel: "Handle missing data", bloomLevel: "application", avgConfidence: 0.52, assessmentAttempts: 7, avgAttemptsToPass: 2.6, commonErrors: ["NaN comparison traps", "fillna vs dropna choice", "Inplace mutation"] },
    { skillId: "pandas-groupby", skillLabel: "GroupBy & aggregation", bloomLevel: "application", avgConfidence: 0.48, assessmentAttempts: 5, avgAttemptsToPass: 3.4, commonErrors: ["Multi-column groupby", "agg vs transform", "Reset index forgetting"] },
    { skillId: "interpret-distributions", skillLabel: "Interpret distributions", bloomLevel: "analysis", avgConfidence: 0.45, assessmentAttempts: 4, avgAttemptsToPass: 2.2, commonErrors: ["Skewness direction", "Outlier identification", "Normal vs uniform"] },
    { skillId: "identify-data-quality-issues", skillLabel: "Data quality issues", bloomLevel: "analysis", avgConfidence: 0.42, assessmentAttempts: 3, avgAttemptsToPass: 2.0, commonErrors: ["Type inconsistency", "Duplicate detection", "Encoding issues"] },
    { skillId: "import-pandas", skillLabel: "Import pandas / load data", bloomLevel: "application", avgConfidence: 0.65, assessmentAttempts: 10, avgAttemptsToPass: 1.6, commonErrors: ["File path issues", "Encoding parameter", "DataFrame vs Series"] },
  ];
}

// ─── Pairing effectiveness data ──────────────────────────────────

export function getPairingData(): PairingResult[] {
  return [
    { learner1: "Priya Sharma", learner2: "Alex Chen", session: "Functions & Packages", skillFocus: "python-functions", learner1Before: 0.75, learner1After: 0.80, learner2Before: 0.20, learner2After: 0.35 },
    { learner1: "Nkechi Okonkwo", learner2: "Marcus Johnson", session: "Pandas Intro", skillFocus: "import-pandas", learner1Before: 0.45, learner1After: 0.55, learner2Before: 0.55, learner2After: 0.65 },
    { learner1: "Sofia Ramirez", learner2: "Alex Chen", session: "Control Flow", skillFocus: "python-control-flow", learner1Before: 0.68, learner1After: 0.75, learner2Before: 0.22, learner2After: 0.30 },
    { learner1: "Priya Sharma", learner2: "Nkechi Okonkwo", session: "DataFrames", skillFocus: "inspect-dataframe", learner1Before: 0.80, learner1After: 0.85, learner2Before: 0.35, learner2After: 0.45 },
    { learner1: "Marcus Johnson", learner2: "Sofia Ramirez", session: "Basic Plotting", skillFocus: "basic-plotting", learner1Before: 0.50, learner1After: 0.60, learner2Before: 0.62, learner2After: 0.70 },
  ];
}

// ─── Group progression over time ─────────────────────────────────

export function getGroupProgression(): GroupProgressPoint[] {
  return [
    { date: "2026-01-28", avgSkillsConfirmed: 4.2, minSkillsConfirmed: 1, maxSkillsConfirmed: 6, cohesionScore: 0.45 },
    { date: "2026-02-01", avgSkillsConfirmed: 7.0, minSkillsConfirmed: 2, maxSkillsConfirmed: 10, cohesionScore: 0.40 },
    { date: "2026-02-05", avgSkillsConfirmed: 9.4, minSkillsConfirmed: 4, maxSkillsConfirmed: 14, cohesionScore: 0.38 },
    { date: "2026-02-08", avgSkillsConfirmed: 11.0, minSkillsConfirmed: 5, maxSkillsConfirmed: 16, cohesionScore: 0.35 },
    { date: "2026-02-11", avgSkillsConfirmed: 12.2, minSkillsConfirmed: 6, maxSkillsConfirmed: 18, cohesionScore: 0.32 },
  ];
}

// ─── Computed analytics helpers ──────────────────────────────────

export function getSkillGapAnalysis(): SkillGap[] {
  const learners = getLearnerTimeSeries();
  return ALL_SKILLS.map((skill) => {
    const confidences = learners.map((l) => {
      const s = l.currentSkills[skill.id];
      return s ? s.confidence : 0;
    });
    const max = Math.max(...confidences);
    const min = Math.min(...confidences);
    const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    return {
      skillId: skill.id,
      label: skill.label,
      bloom: skill.bloom,
      min,
      max,
      avg,
      gap: max - min,
      confidences,
    };
  }).sort((a, b) => b.gap - a.gap);
}

export function getReadinessPrediction(learnerId: string): ReadinessPrediction[] {
  const learners = getLearnerTimeSeries();
  const learner = learners.find((l) => l.id === learnerId);
  if (!learner) return [];

  const confirmedSkills = new Set(Object.keys(learner.currentSkills));

  return ALL_SKILLS.filter((s) => !confirmedSkills.has(s.id)).map((skill) => {
    const prereqs = SKILL_PREREQUISITES[skill.id] || [];
    const metPrereqs = prereqs.filter((p) => confirmedSkills.has(p));
    const readiness = prereqs.length === 0 ? 1.0 : metPrereqs.length / prereqs.length;

    return {
      skillId: skill.id,
      label: skill.label,
      bloom: skill.bloom,
      readiness,
      prereqsMet: metPrereqs.length,
      prereqsTotal: prereqs.length,
    };
  }).sort((a, b) => b.readiness - a.readiness);
}

export function getHeatmapData(): HeatmapData {
  const learners = getLearnerTimeSeries();
  return {
    skills: ALL_SKILLS,
    learners: learners.map((l) => ({
      id: l.id,
      name: l.name,
      skills: ALL_SKILLS.map((s) => {
        const sk = l.currentSkills[s.id];
        return {
          skillId: s.id,
          confidence: sk ? sk.confidence : 0,
          type: sk ? sk.type : null,
        };
      }),
    })),
  };
}

export function getGroupAverageBloom(): Record<BloomLevel, number> {
  const learners = getLearnerTimeSeries();
  const totals: Record<string, number> = {};
  for (const level of BLOOM_LEVELS) totals[level] = 0;

  for (const learner of learners) {
    for (const skill of Object.values(learner.currentSkills)) {
      totals[skill.bloom] = (totals[skill.bloom] || 0) + 1;
    }
  }

  // Average per learner
  for (const level of BLOOM_LEVELS) {
    totals[level] = totals[level] / learners.length;
  }
  return totals;
}
