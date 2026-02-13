"use client";

import { useState, useEffect, useMemo } from "react";
import { BACKEND_URL } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────

interface SkillRef {
  id: string;
  label: string;
  bloom_level: string;
  domain: string;
}

interface TransferCandidate {
  sourceSkill: SkillRef;
  targetSkill: SkillRef;
  transferConfidence: number;
  reasons: string[];
  transferType: string;
}

interface GraphSkill {
  id: string;
  label: string;
  bloom_level: string;
}

interface GraphEdge {
  source: string;
  target: string;
  confidence: number;
  type: string;
}

interface LearnerSkill {
  skillId: string;
  confidence: number;
  bloomLevel: string;
  source: string;
}

interface TransferData {
  learner: { id: string; name: string };
  sourceDomain: string;
  targetDomain: string;
  sourceGraph: { skills: GraphSkill[]; edges: GraphEdge[] };
  targetGraph: { skills: GraphSkill[]; edges: GraphEdge[] };
  learnerSourceSkills: LearnerSkill[];
  transferCandidates: TransferCandidate[];
  overallReadiness: { level: string; score: number };
}

interface LearnerEntry {
  id: string;
  name: string;
  domain: string;
  skillCount: number;
}

interface DomainEntry {
  slug: string;
  name: string;
}

// ─── Bloom's colors ──────────────────────────────────────────────

const BLOOM_COLORS: Record<string, string> = {
  knowledge: "#818cf8",
  comprehension: "#60a5fa",
  application: "#34d399",
  analysis: "#fbbf24",
  synthesis: "#f97316",
  evaluation: "#ef4444",
};

const BLOOM_BG: Record<string, string> = {
  knowledge: "rgba(129,140,248,0.15)",
  comprehension: "rgba(96,165,250,0.15)",
  application: "rgba(52,211,153,0.15)",
  analysis: "rgba(251,191,36,0.15)",
  synthesis: "rgba(249,115,22,0.15)",
  evaluation: "rgba(239,68,68,0.15)",
};

const READINESS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: "rgba(52,211,153,0.15)", text: "#34d399", border: "rgba(52,211,153,0.3)" },
  moderate: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  low: { bg: "rgba(249,115,22,0.15)", text: "#f97316", border: "rgba(249,115,22,0.3)" },
  none: { bg: "rgba(107,114,128,0.15)", text: "#6b7280", border: "rgba(107,114,128,0.3)" },
};

// ─── Component ────────────────────────────────────────────────────

export default function TransferPage() {
  const [learners, setLearners] = useState<LearnerEntry[]>([]);
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [selectedLearner, setSelectedLearner] = useState("");
  const [sourceDomain, setSourceDomain] = useState("");
  const [targetDomain, setTargetDomain] = useState("");
  const [transferData, setTransferData] = useState<TransferData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load learners and domains on mount
  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/transfer-learners`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/domains`).then((r) => r.json()),
    ]).then(([learnersRes, domainsRes]) => {
      setLearners(learnersRes.learners || []);
      const domainList = (domainsRes.domains || []).map((d: { slug: string; name: string }) => ({
        slug: d.slug,
        name: d.name,
      }));
      setDomains(domainList);

      // Auto-select Maya Whitehawk demo if available
      const maya = (learnersRes.learners || []).find((l: LearnerEntry) => l.id === "maya-whitehawk");
      if (maya) {
        setSelectedLearner(maya.id);
        setSourceDomain("outdoor-ecology");
        setTargetDomain("python-data-analysis");
      }
    }).catch(() => {
      setError("Failed to connect to API server. Is the backend running on port 3000?");
    });
  }, []);

  const runAnalysis = async () => {
    if (!selectedLearner || !sourceDomain || !targetDomain) return;
    if (sourceDomain === targetDomain) {
      setError("Source and target domains must be different.");
      return;
    }
    setLoading(true);
    setError("");
    setTransferData(null);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/transfer/${selectedLearner}?source=${sourceDomain}&target=${targetDomain}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }
      setTransferData(data);
    } catch {
      setError("Failed to connect to API server");
    } finally {
      setLoading(false);
    }
  };

  // Compute grouped candidates by Bloom's level
  const groupedByBloom = useMemo(() => {
    if (!transferData) return {};
    const groups: Record<string, TransferCandidate[]> = {};
    for (const c of transferData.transferCandidates) {
      const level = c.targetSkill.bloom_level;
      if (!groups[level]) groups[level] = [];
      groups[level].push(c);
    }
    return groups;
  }, [transferData]);

  const bloomOrder = ["evaluation", "synthesis", "analysis", "application", "comprehension", "knowledge"];

  return (
    <div className="min-h-screen bg-[#06060a]">
      {/* Header */}
      <header className="border-b border-white/[0.04] bg-[#08080e]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-xs hidden sm:inline">Back</span>
              </a>
              <div className="w-px h-5 bg-white/[0.06]" />
              <div>
                <h1 className="text-sm font-semibold text-white tracking-tight">Cross-Domain Transfer</h1>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Analyze how skills transfer across domain boundaries
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Setup Panel */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a12] p-6 mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Transfer Analysis Setup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Learner selector */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1.5">Learner</label>
              <select
                value={selectedLearner}
                onChange={(e) => setSelectedLearner(e.target.value)}
                className="w-full bg-[#12121a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              >
                <option value="">Select a learner...</option>
                {learners.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.domain}, {l.skillCount} skills)
                  </option>
                ))}
              </select>
            </div>

            {/* Source domain */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1.5">Source Domain (has skills)</label>
              <select
                value={sourceDomain}
                onChange={(e) => setSourceDomain(e.target.value)}
                className="w-full bg-[#12121a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              >
                <option value="">Select source domain...</option>
                {domains.map((d) => (
                  <option key={d.slug} value={d.slug}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Target domain */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1.5">Target Domain (predict readiness)</label>
              <select
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                className="w-full bg-[#12121a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              >
                <option value="">Select target domain...</option>
                {domains.filter((d) => d.slug !== sourceDomain).map((d) => (
                  <option key={d.slug} value={d.slug}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={runAnalysis}
              disabled={loading || !selectedLearner || !sourceDomain || !targetDomain}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
            >
              {loading ? "Analyzing..." : "Analyze Transfer"}
            </button>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs text-gray-500">Loading both domain graphs and analyzing transfer...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {transferData && !loading && (
          <div className="space-y-8 animate-fade-in">
            {/* Readiness banner */}
            <ReadinessBanner
              readiness={transferData.overallReadiness}
              learnerName={transferData.learner.name}
              sourceDomain={transferData.sourceDomain}
              targetDomain={transferData.targetDomain}
              candidateCount={transferData.transferCandidates.length}
            />

            {/* Two-column domain comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Source domain skills */}
              <DomainColumn
                title="Source Domain"
                domain={transferData.sourceDomain}
                skills={transferData.sourceGraph.skills}
                learnerSkills={transferData.learnerSourceSkills}
                transferCandidates={transferData.transferCandidates}
                side="source"
              />

              {/* Target domain skills */}
              <DomainColumn
                title="Target Domain"
                domain={transferData.targetDomain}
                skills={transferData.targetGraph.skills}
                learnerSkills={[]}
                transferCandidates={transferData.transferCandidates}
                side="target"
              />
            </div>

            {/* Transfer bridges */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0a0a12] p-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Transfer Bridges ({transferData.transferCandidates.length} detected)
              </h2>

              {bloomOrder.map((level) => {
                const candidates = groupedByBloom[level];
                if (!candidates || candidates.length === 0) return null;

                return (
                  <div key={level} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: BLOOM_COLORS[level] }}
                      />
                      <span className="text-xs font-medium capitalize" style={{ color: BLOOM_COLORS[level] }}>
                        {level}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        ({candidates.length} transfer{candidates.length !== 1 ? "s" : ""})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {candidates.map((c) => (
                        <TransferBridge key={`${c.sourceSkill.id}-${c.targetSkill.id}`} candidate={c} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {transferData.transferCandidates.length === 0 && (
                <p className="text-sm text-gray-500 py-4">
                  No significant transfer detected between these domains for this learner.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!transferData && !loading && !error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Cross-Domain Transfer Analysis</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Select a learner and two domains to analyze how skills transfer across domain boundaries.
              The engine identifies structurally similar skills using Bloom&apos;s taxonomy alignment and
              cognitive operation matching.
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Try: <strong className="text-gray-400">Maya Whitehawk</strong> (outdoor-ecology) transferring to python-data-analysis</p>
              <p>Her analysis and synthesis skills from ecology predict readiness for data analysis thinking.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function ReadinessBanner({
  readiness,
  learnerName,
  sourceDomain,
  targetDomain,
  candidateCount,
}: {
  readiness: { level: string; score: number };
  learnerName: string;
  sourceDomain: string;
  targetDomain: string;
  candidateCount: number;
}) {
  const colors = READINESS_COLORS[readiness.level] || READINESS_COLORS.none;

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
            >
              {readiness.level} readiness
            </span>
            <span className="text-xs text-gray-500">
              Score: {Math.round(readiness.score * 100)}%
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {learnerName}: {formatDomain(sourceDomain)} → {formatDomain(targetDomain)}
          </h3>
          <p className="text-xs text-gray-400 max-w-2xl">
            {readiness.level === "high" && `Strong cross-domain readiness detected. ${candidateCount} skills show transfer potential. The learner's cognitive frameworks will accelerate learning in ${formatDomain(targetDomain)}.`}
            {readiness.level === "moderate" && `Moderate readiness. Some thinking patterns transfer, particularly at higher Bloom's levels. Domain-specific content still needs full instruction.`}
            {readiness.level === "low" && `Limited transfer. The domains share some structural similarities but skills are too domain-specific for significant advantage.`}
            {readiness.level === "none" && `No meaningful transfer detected between these domains for this learner.`}
          </p>
        </div>

        <div className="flex gap-6">
          <Stat label="Transfers" value={candidateCount.toString()} />
          <Stat label="Readiness" value={`${Math.round(readiness.score * 100)}%`} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function DomainColumn({
  title,
  domain,
  skills,
  learnerSkills,
  transferCandidates,
  side,
}: {
  title: string;
  domain: string;
  skills: GraphSkill[];
  learnerSkills: LearnerSkill[];
  transferCandidates: TransferCandidate[];
  side: "source" | "target";
}) {
  const learnerSkillMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const ls of learnerSkills) {
      map.set(ls.skillId, ls.confidence);
    }
    return map;
  }, [learnerSkills]);

  const transferMap = useMemo(() => {
    const map = new Map<string, TransferCandidate>();
    for (const c of transferCandidates) {
      const key = side === "source" ? c.sourceSkill.id : c.targetSkill.id;
      const existing = map.get(key);
      if (!existing || c.transferConfidence > existing.transferConfidence) {
        map.set(key, c);
      }
    }
    return map;
  }, [transferCandidates, side]);

  // Group by Bloom's
  const grouped = useMemo(() => {
    const g: Record<string, GraphSkill[]> = {};
    for (const s of skills) {
      if (!g[s.bloom_level]) g[s.bloom_level] = [];
      g[s.bloom_level].push(s);
    }
    return g;
  }, [skills]);

  const bloomOrder = ["evaluation", "synthesis", "analysis", "application", "comprehension", "knowledge"];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a12] p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
        <span className="text-[10px] text-gray-600">({formatDomain(domain)})</span>
      </div>

      {bloomOrder.map((level) => {
        const levelSkills = grouped[level];
        if (!levelSkills) return null;

        return (
          <div key={level} className="mb-3 last:mb-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BLOOM_COLORS[level] }} />
              <span className="text-[10px] font-medium capitalize" style={{ color: BLOOM_COLORS[level] }}>
                {level}
              </span>
            </div>
            <div className="space-y-1 ml-3">
              {levelSkills.map((skill) => {
                const conf = learnerSkillMap.get(skill.id);
                const transfer = transferMap.get(skill.id);
                const isTransferTarget = side === "target" && !!transfer;
                const isTransferSource = side === "source" && !!transfer;

                return (
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 py-1 px-2 rounded-md text-xs transition-all"
                    style={{
                      backgroundColor: isTransferTarget
                        ? "rgba(129,140,248,0.1)"
                        : isTransferSource
                        ? "rgba(52,211,153,0.08)"
                        : "transparent",
                      borderLeft: isTransferTarget
                        ? "2px solid rgba(129,140,248,0.5)"
                        : isTransferSource
                        ? "2px solid rgba(52,211,153,0.4)"
                        : "2px solid transparent",
                    }}
                  >
                    <span className="text-gray-300 flex-1 truncate" title={skill.label}>
                      {skill.label.length > 50 ? skill.label.substring(0, 50) + "..." : skill.label}
                    </span>

                    {conf !== undefined && (
                      <span className="text-[10px] text-emerald-400 font-mono whitespace-nowrap">
                        {Math.round(conf * 100)}%
                      </span>
                    )}

                    {isTransferTarget && transfer && (
                      <span className="text-[10px] text-indigo-400 font-mono whitespace-nowrap">
                        ~{Math.round(transfer.transferConfidence * 100)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TransferBridge({ candidate }: { candidate: TransferCandidate }) {
  const conf = candidate.transferConfidence;
  const strength = conf >= 0.35 ? "strong" : conf >= 0.2 ? "moderate" : "weak";
  const strengthColors = {
    strong: { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", text: "#34d399" },
    moderate: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", text: "#fbbf24" },
    weak: { bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.3)", text: "#6b7280" },
  };
  const colors = strengthColors[strength];

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border transition-all hover:border-white/[0.12]"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      {/* Source */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-300 truncate" title={candidate.sourceSkill.label}>
          {candidate.sourceSkill.label}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded capitalize"
            style={{
              backgroundColor: BLOOM_BG[candidate.sourceSkill.bloom_level],
              color: BLOOM_COLORS[candidate.sourceSkill.bloom_level],
            }}
          >
            {candidate.sourceSkill.bloom_level}
          </span>
          <span className="text-[9px] text-gray-600">{formatDomain(candidate.sourceSkill.domain)}</span>
        </div>
      </div>

      {/* Arrow with confidence */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <svg className="w-5 h-5" style={{ color: colors.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span className="text-[9px] font-mono font-bold" style={{ color: colors.text }}>
          {Math.round(conf * 100)}%
        </span>
      </div>

      {/* Target */}
      <div className="flex-1 min-w-0 text-right">
        <div className="text-xs text-gray-300 truncate" title={candidate.targetSkill.label}>
          {candidate.targetSkill.label}
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-0.5">
          <span className="text-[9px] text-gray-600">{formatDomain(candidate.targetSkill.domain)}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded capitalize"
            style={{
              backgroundColor: BLOOM_BG[candidate.targetSkill.bloom_level],
              color: BLOOM_COLORS[candidate.targetSkill.bloom_level],
            }}
          >
            {candidate.targetSkill.bloom_level}
          </span>
        </div>
      </div>

      {/* Transfer type badge */}
      <div className="shrink-0">
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.05] text-gray-500 uppercase tracking-wider">
          {candidate.transferType.replace("_", " ")}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatDomain(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
