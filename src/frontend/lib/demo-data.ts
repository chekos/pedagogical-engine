// Pre-parsed demo data from the data/ directory for the dashboard visualization.
// In production, this would come from the backend MCP tools.
// For the hackathon demo, we embed the data directly so the dashboard page works standalone.

import type { SkillGraphData } from "@/components/visualizations/skill-dependency-graph";
import type { GroupDashboardData } from "@/components/visualizations/group-dashboard";
import type {
  LiveGraphData,
  SkillNodeStatus,
  LearnerOverlay,
} from "@/components/visualizations/live-dependency-graph";

// ─── Skills from data/domains/python-data-analysis/skills.json ──

const skills = [
  { id: "open-terminal", label: "Can open a terminal application", bloom_level: "knowledge", assessable: true, dependencies: [] },
  { id: "navigate-directories", label: "Can navigate directories using cd, ls, and pwd", bloom_level: "application", assessable: true, dependencies: ["open-terminal"] },
  { id: "install-python", label: "Can install Python on their operating system", bloom_level: "application", assessable: true, dependencies: ["open-terminal"] },
  { id: "run-python-script", label: "Can create and execute a Python script from the terminal", bloom_level: "application", assessable: true, dependencies: ["navigate-directories", "install-python"] },
  { id: "python-variables-types", label: "Can declare variables and distinguish basic Python types", bloom_level: "comprehension", assessable: true, dependencies: ["run-python-script"] },
  { id: "python-control-flow", label: "Can write if/else conditionals and for/while loops", bloom_level: "application", assessable: true, dependencies: ["python-variables-types"] },
  { id: "python-functions", label: "Can define and call functions with parameters and return values", bloom_level: "application", assessable: true, dependencies: ["python-control-flow"] },
  { id: "install-packages", label: "Can install Python packages using pip or conda", bloom_level: "application", assessable: true, dependencies: ["run-python-script"] },
  { id: "use-jupyter", label: "Can create and run cells in a Jupyter notebook", bloom_level: "application", assessable: true, dependencies: ["install-packages", "run-python-script"] },
  { id: "import-pandas", label: "Can import pandas and load data from CSV, Excel, or JSON files", bloom_level: "application", assessable: true, dependencies: ["install-packages", "python-variables-types"] },
  { id: "inspect-dataframe", label: "Can inspect a DataFrame using head, info, describe, shape, and dtypes", bloom_level: "comprehension", assessable: true, dependencies: ["import-pandas"] },
  { id: "select-filter-data", label: "Can select columns and filter rows using boolean indexing", bloom_level: "application", assessable: true, dependencies: ["inspect-dataframe", "python-control-flow"] },
  { id: "handle-missing-data", label: "Can identify, drop, and fill missing values in a DataFrame", bloom_level: "application", assessable: true, dependencies: ["inspect-dataframe"] },
  { id: "pandas-groupby", label: "Can use groupby with aggregation functions", bloom_level: "application", assessable: true, dependencies: ["select-filter-data", "python-functions"] },
  { id: "pandas-merge-join", label: "Can merge and join DataFrames on shared keys", bloom_level: "application", assessable: true, dependencies: ["select-filter-data"] },
  { id: "basic-plotting", label: "Can create basic plots using matplotlib or pandas", bloom_level: "application", assessable: true, dependencies: ["import-pandas", "install-packages"] },
  { id: "interpret-distributions", label: "Can interpret histograms, box plots, and statistical distributions", bloom_level: "analysis", assessable: true, dependencies: ["basic-plotting", "inspect-dataframe"] },
  { id: "identify-data-quality-issues", label: "Can identify data quality problems: duplicates, outliers, inconsistent types", bloom_level: "analysis", assessable: true, dependencies: ["handle-missing-data", "inspect-dataframe", "interpret-distributions"] },
  { id: "reshape-data", label: "Can pivot, melt, and reshape DataFrames", bloom_level: "application", assessable: true, dependencies: ["pandas-groupby", "select-filter-data"] },
  { id: "write-reusable-analysis-functions", label: "Can write reusable functions that encapsulate analysis patterns", bloom_level: "synthesis", assessable: true, dependencies: ["python-functions", "pandas-groupby", "handle-missing-data"] },
  { id: "explain-analysis-choices", label: "Can explain why specific analysis methods were chosen", bloom_level: "evaluation", assessable: true, dependencies: ["pandas-groupby", "interpret-distributions", "identify-data-quality-issues"] },
  { id: "critique-visualization", label: "Can critique a visualization for misleading scales or poor labeling", bloom_level: "evaluation", assessable: true, dependencies: ["basic-plotting", "interpret-distributions"] },
  { id: "exploratory-data-analysis", label: "Can conduct a systematic EDA", bloom_level: "analysis", assessable: true, dependencies: ["interpret-distributions", "identify-data-quality-issues", "pandas-groupby", "basic-plotting"] },
  { id: "build-analysis-narrative", label: "Can structure an analysis into a coherent narrative", bloom_level: "synthesis", assessable: true, dependencies: ["exploratory-data-analysis", "use-jupyter", "explain-analysis-choices"] },
  { id: "design-data-pipeline", label: "Can design an end-to-end data pipeline", bloom_level: "synthesis", assessable: true, dependencies: ["write-reusable-analysis-functions", "reshape-data", "pandas-merge-join", "identify-data-quality-issues", "build-analysis-narrative"] },
];

const edges = [
  { source: "open-terminal", target: "navigate-directories", confidence: 0.95, type: "prerequisite" },
  { source: "open-terminal", target: "install-python", confidence: 0.90, type: "prerequisite" },
  { source: "navigate-directories", target: "run-python-script", confidence: 0.95, type: "prerequisite" },
  { source: "install-python", target: "run-python-script", confidence: 0.95, type: "prerequisite" },
  { source: "run-python-script", target: "python-variables-types", confidence: 0.90, type: "prerequisite" },
  { source: "python-variables-types", target: "python-control-flow", confidence: 0.90, type: "prerequisite" },
  { source: "python-control-flow", target: "python-functions", confidence: 0.85, type: "prerequisite" },
  { source: "run-python-script", target: "install-packages", confidence: 0.80, type: "prerequisite" },
  { source: "install-packages", target: "use-jupyter", confidence: 0.85, type: "prerequisite" },
  { source: "run-python-script", target: "use-jupyter", confidence: 0.70, type: "prerequisite" },
  { source: "install-packages", target: "import-pandas", confidence: 0.90, type: "prerequisite" },
  { source: "python-variables-types", target: "import-pandas", confidence: 0.85, type: "prerequisite" },
  { source: "import-pandas", target: "inspect-dataframe", confidence: 0.95, type: "prerequisite" },
  { source: "inspect-dataframe", target: "select-filter-data", confidence: 0.90, type: "prerequisite" },
  { source: "python-control-flow", target: "select-filter-data", confidence: 0.75, type: "prerequisite" },
  { source: "inspect-dataframe", target: "handle-missing-data", confidence: 0.90, type: "prerequisite" },
  { source: "select-filter-data", target: "pandas-groupby", confidence: 0.90, type: "prerequisite" },
  { source: "python-functions", target: "pandas-groupby", confidence: 0.70, type: "prerequisite" },
  { source: "select-filter-data", target: "pandas-merge-join", confidence: 0.85, type: "prerequisite" },
  { source: "import-pandas", target: "basic-plotting", confidence: 0.85, type: "prerequisite" },
  { source: "install-packages", target: "basic-plotting", confidence: 0.80, type: "prerequisite" },
  { source: "basic-plotting", target: "interpret-distributions", confidence: 0.85, type: "prerequisite" },
  { source: "inspect-dataframe", target: "interpret-distributions", confidence: 0.80, type: "prerequisite" },
  { source: "handle-missing-data", target: "identify-data-quality-issues", confidence: 0.90, type: "prerequisite" },
  { source: "inspect-dataframe", target: "identify-data-quality-issues", confidence: 0.85, type: "prerequisite" },
  { source: "interpret-distributions", target: "identify-data-quality-issues", confidence: 0.80, type: "prerequisite" },
  { source: "pandas-groupby", target: "reshape-data", confidence: 0.80, type: "prerequisite" },
  { source: "select-filter-data", target: "reshape-data", confidence: 0.75, type: "prerequisite" },
  { source: "python-functions", target: "write-reusable-analysis-functions", confidence: 0.90, type: "prerequisite" },
  { source: "pandas-groupby", target: "write-reusable-analysis-functions", confidence: 0.80, type: "prerequisite" },
  { source: "handle-missing-data", target: "write-reusable-analysis-functions", confidence: 0.75, type: "prerequisite" },
  { source: "pandas-groupby", target: "explain-analysis-choices", confidence: 0.80, type: "prerequisite" },
  { source: "interpret-distributions", target: "explain-analysis-choices", confidence: 0.85, type: "prerequisite" },
  { source: "identify-data-quality-issues", target: "explain-analysis-choices", confidence: 0.85, type: "prerequisite" },
  { source: "basic-plotting", target: "critique-visualization", confidence: 0.85, type: "prerequisite" },
  { source: "interpret-distributions", target: "critique-visualization", confidence: 0.80, type: "prerequisite" },
  { source: "interpret-distributions", target: "exploratory-data-analysis", confidence: 0.90, type: "prerequisite" },
  { source: "identify-data-quality-issues", target: "exploratory-data-analysis", confidence: 0.90, type: "prerequisite" },
  { source: "pandas-groupby", target: "exploratory-data-analysis", confidence: 0.85, type: "prerequisite" },
  { source: "basic-plotting", target: "exploratory-data-analysis", confidence: 0.85, type: "prerequisite" },
  { source: "exploratory-data-analysis", target: "build-analysis-narrative", confidence: 0.90, type: "prerequisite" },
  { source: "use-jupyter", target: "build-analysis-narrative", confidence: 0.75, type: "recommended" },
  { source: "explain-analysis-choices", target: "build-analysis-narrative", confidence: 0.85, type: "prerequisite" },
  { source: "write-reusable-analysis-functions", target: "design-data-pipeline", confidence: 0.90, type: "prerequisite" },
  { source: "reshape-data", target: "design-data-pipeline", confidence: 0.85, type: "prerequisite" },
  { source: "pandas-merge-join", target: "design-data-pipeline", confidence: 0.85, type: "prerequisite" },
  { source: "identify-data-quality-issues", target: "design-data-pipeline", confidence: 0.90, type: "prerequisite" },
  { source: "build-analysis-narrative", target: "design-data-pipeline", confidence: 0.80, type: "prerequisite" },
];

// ─── Learner data (parsed from markdown profiles) ───────────────

interface LearnerProfile {
  id: string;
  name: string;
  assessed: Record<string, { confidence: number; bloom: string }>;
  inferred: Record<string, { confidence: number }>;
}

const learnerProfiles: LearnerProfile[] = [
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    assessed: {
      "open-terminal": { confidence: 0.95, bloom: "application" },
      "navigate-directories": { confidence: 0.90, bloom: "application" },
      "install-python": { confidence: 0.85, bloom: "application" },
      "run-python-script": { confidence: 0.90, bloom: "application" },
      "python-variables-types": { confidence: 0.90, bloom: "comprehension" },
      "python-control-flow": { confidence: 0.85, bloom: "application" },
      "python-functions": { confidence: 0.80, bloom: "application" },
      "install-packages": { confidence: 0.85, bloom: "application" },
      "use-jupyter": { confidence: 0.90, bloom: "application" },
      "import-pandas": { confidence: 0.90, bloom: "application" },
      "inspect-dataframe": { confidence: 0.85, bloom: "comprehension" },
      "select-filter-data": { confidence: 0.80, bloom: "application" },
      "handle-missing-data": { confidence: 0.75, bloom: "application" },
      "pandas-groupby": { confidence: 0.80, bloom: "application" },
      "basic-plotting": { confidence: 0.75, bloom: "application" },
      "interpret-distributions": { confidence: 0.70, bloom: "analysis" },
      "identify-data-quality-issues": { confidence: 0.65, bloom: "analysis" },
      "exploratory-data-analysis": { confidence: 0.60, bloom: "analysis" },
    },
    inferred: {
      "pandas-merge-join": { confidence: 0.72 },
      "reshape-data": { confidence: 0.64 },
    },
  },
  {
    id: "marcus-johnson",
    name: "Marcus Johnson",
    assessed: {
      "open-terminal": { confidence: 0.90, bloom: "application" },
      "navigate-directories": { confidence: 0.80, bloom: "application" },
      "install-python": { confidence: 0.75, bloom: "knowledge" },
      "run-python-script": { confidence: 0.80, bloom: "application" },
      "python-variables-types": { confidence: 0.75, bloom: "comprehension" },
      "python-control-flow": { confidence: 0.70, bloom: "application" },
      "python-functions": { confidence: 0.55, bloom: "comprehension" },
      "install-packages": { confidence: 0.70, bloom: "application" },
      "import-pandas": { confidence: 0.65, bloom: "application" },
      "inspect-dataframe": { confidence: 0.70, bloom: "comprehension" },
      "select-filter-data": { confidence: 0.50, bloom: "knowledge" },
      "basic-plotting": { confidence: 0.60, bloom: "application" },
    },
    inferred: {
      "use-jupyter": { confidence: 0.56 },
    },
  },
  {
    id: "sofia-ramirez",
    name: "Sofia Ramirez",
    assessed: {
      "open-terminal": { confidence: 0.90, bloom: "application" },
      "navigate-directories": { confidence: 0.80, bloom: "application" },
      "install-python": { confidence: 0.80, bloom: "application" },
      "run-python-script": { confidence: 0.85, bloom: "application" },
      "python-variables-types": { confidence: 0.80, bloom: "comprehension" },
      "python-control-flow": { confidence: 0.75, bloom: "application" },
      "python-functions": { confidence: 0.65, bloom: "application" },
      "install-packages": { confidence: 0.75, bloom: "application" },
      "import-pandas": { confidence: 0.70, bloom: "application" },
      "inspect-dataframe": { confidence: 0.75, bloom: "comprehension" },
      "handle-missing-data": { confidence: 0.60, bloom: "knowledge" },
      "basic-plotting": { confidence: 0.70, bloom: "application" },
      "interpret-distributions": { confidence: 0.55, bloom: "comprehension" },
    },
    inferred: {
      "use-jupyter": { confidence: 0.60 },
      "select-filter-data": { confidence: 0.68 },
    },
  },
  {
    id: "alex-chen",
    name: "Alex Chen",
    assessed: {
      "open-terminal": { confidence: 0.70, bloom: "knowledge" },
      "navigate-directories": { confidence: 0.50, bloom: "knowledge" },
      "install-python": { confidence: 0.60, bloom: "knowledge" },
      "run-python-script": { confidence: 0.55, bloom: "knowledge" },
      "python-variables-types": { confidence: 0.45, bloom: "knowledge" },
      "python-control-flow": { confidence: 0.30, bloom: "knowledge" },
    },
    inferred: {},
  },
  {
    id: "nkechi-okonkwo",
    name: "Nkechi Okonkwo",
    assessed: {
      "open-terminal": { confidence: 0.95, bloom: "application" },
      "navigate-directories": { confidence: 0.90, bloom: "application" },
      "install-python": { confidence: 0.90, bloom: "application" },
      "run-python-script": { confidence: 0.85, bloom: "application" },
      "python-variables-types": { confidence: 0.80, bloom: "comprehension" },
      "python-control-flow": { confidence: 0.80, bloom: "application" },
      "python-functions": { confidence: 0.70, bloom: "application" },
      "install-packages": { confidence: 0.80, bloom: "application" },
      "use-jupyter": { confidence: 0.75, bloom: "application" },
      "import-pandas": { confidence: 0.55, bloom: "knowledge" },
      "inspect-dataframe": { confidence: 0.45, bloom: "knowledge" },
      "basic-plotting": { confidence: 0.40, bloom: "knowledge" },
    },
    inferred: {
      "handle-missing-data": { confidence: 0.41 },
      "select-filter-data": { confidence: 0.41 },
    },
  },
];

// ─── Build SkillGraphData for each learner ──────────────────────

export function getSkillGraphData(learnerId?: string): SkillGraphData {
  const learner = learnerId ? learnerProfiles.find((l) => l.id === learnerId) : undefined;

  const learnerStatuses: Record<string, { confidence: number; type: "assessed" | "inferred" | "unknown"; bloom_demonstrated?: string }> = {};

  for (const skill of skills) {
    if (learner) {
      const assessed = learner.assessed[skill.id];
      const inferred = learner.inferred[skill.id];

      if (assessed) {
        learnerStatuses[skill.id] = {
          confidence: assessed.confidence,
          type: "assessed",
          bloom_demonstrated: assessed.bloom,
        };
      } else if (inferred) {
        learnerStatuses[skill.id] = {
          confidence: inferred.confidence,
          type: "inferred",
        };
      } else {
        learnerStatuses[skill.id] = {
          confidence: 0,
          type: "unknown",
        };
      }
    }
  }

  return {
    skills,
    edges,
    learnerStatuses: learner ? learnerStatuses : undefined,
    learnerName: learner?.name,
  };
}

// ─── Build GroupDashboardData ───────────────────────────────────

export function getGroupDashboardData(): GroupDashboardData {
  return {
    groupName: "tuesday-cohort",
    domain: "python-data-analysis",
    skills,
    learners: learnerProfiles.map((lp) => ({
      name: lp.name,
      id: lp.id,
      skills: {
        ...Object.fromEntries(
          Object.entries(lp.assessed).map(([id, data]) => [
            id,
            { confidence: data.confidence, type: "assessed" as const },
          ])
        ),
        ...Object.fromEntries(
          Object.entries(lp.inferred).map(([id, data]) => [
            id,
            { confidence: data.confidence, type: "inferred" as const },
          ])
        ),
      },
    })),
  };
}

export function getLearnerIds(): { id: string; name: string }[] {
  return learnerProfiles.map((l) => ({ id: l.id, name: l.name }));
}

// ─── Build LiveGraphData (new 4-state format) ───────────────────

/** Gap threshold: assessed skills with confidence below this are "gaps" */
const GAP_THRESHOLD = 0.5;

function toLiveStatuses(profile: LearnerProfile): Record<string, SkillNodeStatus> {
  const statuses: Record<string, SkillNodeStatus> = {};

  for (const skill of skills) {
    const assessed = profile.assessed[skill.id];
    const inferred = profile.inferred[skill.id];

    if (assessed) {
      statuses[skill.id] = {
        state: assessed.confidence < GAP_THRESHOLD ? "assessed-gap" : "assessed-confirmed",
        confidence: assessed.confidence,
        bloom_demonstrated: assessed.bloom,
      };
    } else if (inferred) {
      statuses[skill.id] = {
        state: "inferred",
        confidence: inferred.confidence,
      };
    } else {
      statuses[skill.id] = {
        state: "unknown",
        confidence: 0,
      };
    }
  }

  return statuses;
}

export function getLiveGraphData(learnerId?: string): LiveGraphData {
  const learner = learnerId
    ? learnerProfiles.find((l) => l.id === learnerId)
    : undefined;

  return {
    skills,
    edges,
    learnerStatuses: learner ? toLiveStatuses(learner) : undefined,
    learnerName: learner?.name,
  };
}

export function getLiveGraphDataWithGroupOverlay(learnerId?: string): LiveGraphData {
  const base = getLiveGraphData(learnerId);

  const groupOverlays: LearnerOverlay[] = learnerProfiles.map((lp) => ({
    id: lp.id,
    name: lp.name,
    statuses: toLiveStatuses(lp),
  }));

  return {
    ...base,
    groupOverlays,
  };
}

/**
 * Generate a cascade demo scenario:
 * Start with Alex Chen (beginner, only 6 assessed skills) and simulate
 * assessing "pandas-groupby" — which should cascade inferences down to
 * all prerequisites not yet assessed.
 */
export function getCascadeDemoData(): {
  before: LiveGraphData;
  after: LiveGraphData;
  assessedSkill: string;
} {
  const alex = learnerProfiles.find((l) => l.id === "alex-chen");
  if (!alex) throw new Error("Demo data error: alex-chen profile not found");
  const before = getLiveGraphData("alex-chen");

  // Simulate Alex passing pandas-groupby
  const afterStatuses = { ...toLiveStatuses(alex) };

  // Mark pandas-groupby as assessed-confirmed
  afterStatuses["pandas-groupby"] = {
    state: "assessed-confirmed",
    confidence: 0.8,
    bloom_demonstrated: "application",
  };

  // Inference cascade: if they can do pandas-groupby, they can likely do its prerequisites
  // select-filter-data, python-functions, python-control-flow, etc.
  const cascadeTargets: [string, number][] = [
    ["select-filter-data", 1],
    ["python-functions", 1],
    ["inspect-dataframe", 2],
    ["python-control-flow", 2],
    ["import-pandas", 3],
    ["install-packages", 3],
    ["python-variables-types", 3],
    ["run-python-script", 4],
    ["navigate-directories", 5],
    ["install-python", 5],
    ["open-terminal", 6],
  ];

  for (const [skillId, order] of cascadeTargets) {
    const existing = afterStatuses[skillId];
    // Only infer if not already assessed
    if (!existing || existing.state === "unknown") {
      afterStatuses[skillId] = {
        state: "inferred",
        confidence: Math.max(0.4, 0.85 - order * 0.07),
        cascadeOrder: order,
      };
    }
  }

  return {
    before,
    after: {
      skills,
      edges,
      learnerStatuses: afterStatuses,
      learnerName: "Alex Chen",
    },
    assessedSkill: "pandas-groupby",
  };
}
