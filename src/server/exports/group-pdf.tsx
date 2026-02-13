import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { baseStyles, colors, hexToRgba } from "./shared-styles.js";
import type { GroupData, LearnerData, DomainSkill } from "./data-parsers.js";

interface GroupPDFProps {
  group: GroupData;
  learners: LearnerData[];
  domainSkills: DomainSkill[];
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return colors.success;
  if (confidence >= 0.6) return colors.accent;
  if (confidence >= 0.4) return colors.warning;
  return colors.danger;
}

export function GroupReportPDF({ group, learners, domainSkills }: GroupPDFProps) {
  const totalSkills = domainSkills.length;

  // Build skill distribution matrix
  const skillMatrix: Record<
    string,
    { label: string; bloom: string; learnerScores: Record<string, number> }
  > = {};
  for (const skill of domainSkills) {
    skillMatrix[skill.id] = {
      label: skill.label,
      bloom: skill.bloom_level,
      learnerScores: {},
    };
    for (const learner of learners) {
      const match = learner.skills.find((s) => s.skillId === skill.id);
      skillMatrix[skill.id].learnerScores[learner.id] = match ? match.confidence : 0;
    }
  }

  // Common gaps: skills where >50% of learners are below 0.5
  const commonGaps = domainSkills
    .map((skill) => {
      const scores = learners.map(
        (l) => l.skills.find((s) => s.skillId === skill.id)?.confidence ?? 0
      );
      const gapCount = scores.filter((s) => s < 0.5).length;
      return { skill, gapCount, avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0 };
    })
    .filter((g) => g.gapCount > learners.length / 2)
    .sort((a, b) => b.gapCount - a.gapCount);

  // Group strengths: skills where >80% have confidence >= 0.7
  const groupStrengths = domainSkills
    .map((skill) => {
      const scores = learners.map(
        (l) => l.skills.find((s) => s.skillId === skill.id)?.confidence ?? 0
      );
      const strongCount = scores.filter((s) => s >= 0.7).length;
      return {
        skill,
        strongCount,
        avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      };
    })
    .filter((g) => g.strongCount >= learners.length * 0.8)
    .sort((a, b) => b.avgScore - a.avgScore);

  // Pairing suggestions
  const pairings: Array<{ l1: string; l2: string; rationale: string }> = [];
  for (let i = 0; i < learners.length; i++) {
    for (let j = i + 1; j < learners.length; j++) {
      const l1 = learners[i];
      const l2 = learners[j];
      const l1Strong = new Set(l1.skills.filter((s) => s.confidence >= 0.7).map((s) => s.skillId));
      const l2Strong = new Set(l2.skills.filter((s) => s.confidence >= 0.7).map((s) => s.skillId));
      const l1CanTeach = [...l1Strong].filter((s) => !l2Strong.has(s));
      const l2CanTeach = [...l2Strong].filter((s) => !l1Strong.has(s));
      if (l1CanTeach.length > 0 || l2CanTeach.length > 0) {
        const parts: string[] = [];
        if (l1CanTeach.length > 0) parts.push(`${l1.name} helps with: ${l1CanTeach.slice(0, 2).join(", ")}`);
        if (l2CanTeach.length > 0) parts.push(`${l2.name} helps with: ${l2CanTeach.slice(0, 2).join(", ")}`);
        pairings.push({ l1: l1.name, l2: l2.name, rationale: parts.join("; ") });
      }
    }
  }

  // Per-learner summary stats
  const learnerStats = learners.map((l) => {
    const assessed = l.skills.filter((s) => s.source === "assessed").length;
    const avgConf =
      l.skills.length > 0
        ? l.skills.reduce((a, s) => a + s.confidence, 0) / l.skills.length
        : 0;
    return { name: l.name, id: l.id, assessed, total: l.skills.length, avgConf };
  });

  return (
    <Document title={`Group Report: ${group.slug}`} author="Pedagogical Engine">
      <Page size="A4" style={baseStyles.page}>
        {/* Header band */}
        <View style={baseStyles.headerBand}>
          <Text style={baseStyles.headerTitle}>Group Summary: {group.slug}</Text>
          <Text style={baseStyles.headerSubtitle}>
            {[
              `${group.memberCount} members`,
              group.domain && `Domain: ${group.domain}`,
              group.created && `Created: ${group.created.slice(0, 10)}`,
            ]
              .filter(Boolean)
              .join("  |  ")}
          </Text>
        </View>

        {/* Overview stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <SummaryCard label="Members" value={String(learners.length)} color={colors.primary} />
          <SummaryCard
            label="Common Gaps"
            value={String(commonGaps.length)}
            color={commonGaps.length > 5 ? colors.danger : colors.warning}
          />
          <SummaryCard
            label="Group Strengths"
            value={String(groupStrengths.length)}
            color={colors.success}
          />
          <SummaryCard
            label="Domain Skills"
            value={String(totalSkills)}
            color={colors.accent}
          />
        </View>

        {/* Member Overview Table */}
        <View style={baseStyles.sectionTitle}>
          <Text>Member Overview</Text>
        </View>
        <View style={baseStyles.tableContainer}>
          <View style={baseStyles.tableHeader}>
            <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>Name</Text>
            <Text style={[baseStyles.tableHeaderCell, { flex: 1 }]}>Assessed</Text>
            <Text style={[baseStyles.tableHeaderCell, { flex: 1 }]}>Total Known</Text>
            <Text style={[baseStyles.tableHeaderCell, { flex: 1 }]}>Avg Confidence</Text>
            <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>Coverage</Text>
          </View>
          {learnerStats.map((ls, i) => (
            <View key={i} style={baseStyles.tableRow}>
              <Text style={[baseStyles.tableCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>
                {ls.name}
              </Text>
              <Text style={[baseStyles.tableCell, { flex: 1 }]}>{ls.assessed}</Text>
              <Text style={[baseStyles.tableCell, { flex: 1 }]}>
                {ls.total} / {totalSkills}
              </Text>
              <Text
                style={[
                  baseStyles.tableCell,
                  { flex: 1, color: getConfidenceColor(ls.avgConf) },
                ]}
              >
                {Math.round(ls.avgConf * 100)}%
              </Text>
              <View style={{ flex: 2, justifyContent: "center" }}>
                <View style={[baseStyles.skillBarBg, { height: 6 }]}>
                  <View
                    style={[
                      baseStyles.skillBarFill,
                      {
                        height: 6,
                        width: `${Math.round((ls.total / totalSkills) * 100)}%`,
                        backgroundColor: getConfidenceColor(ls.total / totalSkills),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Skill Heatmap (simplified) */}
        <View style={baseStyles.sectionTitle}>
          <Text>Skill Distribution Heatmap</Text>
        </View>
        <View style={baseStyles.tableContainer}>
          <View style={baseStyles.tableHeader}>
            <Text style={[baseStyles.tableHeaderCell, { width: 120 }]}>Skill</Text>
            {learners.map((l, i) => (
              <Text key={i} style={[baseStyles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>
                {l.name.split(" ")[0]}
              </Text>
            ))}
          </View>
          {domainSkills.slice(0, 18).map((skill, si) => (
            <View key={si} style={baseStyles.tableRow}>
              <Text style={[baseStyles.tableCell, { width: 120, fontSize: 7 }]}>
                {skill.id}
              </Text>
              {learners.map((l, li) => {
                const score = l.skills.find((s) => s.skillId === skill.id)?.confidence ?? 0;
                return (
                  <View key={li} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        backgroundColor: score > 0 ? getConfidenceColor(score) : colors.gray100,
                        opacity: score > 0 ? 0.3 + score * 0.7 : 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {score > 0 && (
                        <Text style={{ fontSize: 6, color: colors.white, fontFamily: "Helvetica-Bold" }}>
                          {Math.round(score * 10)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>
            Generated by Pedagogical Engine | {group.slug}
          </Text>
          <Text
            style={baseStyles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* Page 2: Gaps, Strengths, Pairings */}
      <Page size="A4" style={baseStyles.page}>
        {/* Common Gaps */}
        {commonGaps.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Common Gaps</Text>
            </View>
            <Text style={[baseStyles.bodyText, { marginBottom: 8, fontStyle: "italic" }]}>
              Skills where more than half the group scores below 50% confidence:
            </Text>
            {commonGaps.slice(0, 10).map((g, i) => (
              <View
                key={i}
                wrap={false}
                style={{
                  flexDirection: "row",
                  marginBottom: 6,
                  backgroundColor: colors.dangerLight,
                  padding: 8,
                  borderRadius: 4,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.danger,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.gray800 }}>
                    {g.skill.label}
                  </Text>
                  <Text style={{ fontSize: 8, color: colors.gray500, marginTop: 1 }}>
                    {g.gapCount} of {learners.length} members below threshold | Avg:{" "}
                    {Math.round(g.avgScore * 100)}% | Bloom&apos;s: {g.skill.bloom_level}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Group Strengths */}
        {groupStrengths.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Group Strengths</Text>
            </View>
            <View style={baseStyles.infoBox}>
              {groupStrengths.slice(0, 8).map((g, i) => (
                <Text key={i} style={{ fontSize: 9, color: colors.gray700, marginBottom: 3 }}>
                  {g.skill.label} — {Math.round(g.avgScore * 100)}% avg confidence (
                  {g.strongCount}/{learners.length} strong)
                </Text>
              ))}
            </View>
          </>
        )}

        {/* Pairing Recommendations */}
        {pairings.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Pairing Recommendations</Text>
            </View>
            <Text style={[baseStyles.bodyText, { marginBottom: 8, fontStyle: "italic" }]}>
              Pairs with complementary skill sets for peer learning:
            </Text>
            {pairings.slice(0, 6).map((p, i) => (
              <View
                key={i}
                wrap={false}
                style={{
                  marginBottom: 6,
                  backgroundColor: colors.accentLight,
                  padding: 8,
                  borderRadius: 4,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.accent,
                }}
              >
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.gray800 }}>
                  {p.l1} + {p.l2}
                </Text>
                <Text style={{ fontSize: 8, color: colors.gray600, marginTop: 2 }}>
                  {p.rationale}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Constraints */}
        {group.constraints.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Group Constraints</Text>
            </View>
            {group.constraints.map((c, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9, color: colors.gray400, marginRight: 6 }}>•</Text>
                <Text style={{ fontSize: 9, color: colors.gray600, flex: 1 }}>{c}</Text>
              </View>
            ))}
          </>
        )}

        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>
            Generated by Pedagogical Engine | {group.slug}
          </Text>
          <Text
            style={baseStyles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: hexToRgba(color, 0.06),
        borderWidth: 1,
        borderColor: hexToRgba(color, 0.19),
        borderRadius: 6,
        padding: 10,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 7, color: colors.gray500, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color }}>{value}</Text>
    </View>
  );
}
