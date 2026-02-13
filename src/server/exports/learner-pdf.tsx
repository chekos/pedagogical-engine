import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { baseStyles, colors, bloomColors, hexToRgba } from "./shared-styles.js";
import type { LearnerData, DomainSkill } from "./data-parsers.js";

interface LearnerPDFProps {
  learner: LearnerData;
  domainSkills: DomainSkill[];
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return colors.success;
  if (confidence >= 0.6) return colors.accent;
  if (confidence >= 0.4) return colors.warning;
  return colors.danger;
}

function bloomLabel(level: string): string {
  const labels: Record<string, string> = {
    knowledge: "Knowledge",
    comprehension: "Comprehension",
    application: "Application",
    analysis: "Analysis",
    synthesis: "Synthesis",
    evaluation: "Evaluation",
    inferred: "Inferred",
    unknown: "Unknown",
  };
  return labels[level.toLowerCase()] ?? level;
}

export function LearnerReportPDF({ learner, domainSkills }: LearnerPDFProps) {
  const assessedSkills = learner.skills.filter((s) => s.source === "assessed");
  const inferredSkills = learner.skills.filter((s) => s.source === "inferred");
  const knownSkillIds = new Set(learner.skills.map((s) => s.skillId));
  const totalDomainSkills = domainSkills.length;
  const coveragePercent = Math.round((knownSkillIds.size / totalDomainSkills) * 100);

  // Identify strengths (assessed >= 0.7)
  const strengths = assessedSkills
    .filter((s) => s.confidence >= 0.7)
    .sort((a, b) => b.confidence - a.confidence);

  // Identify gaps (skills in domain not in learner profile, or low confidence)
  const gaps = domainSkills.filter(
    (ds) => !knownSkillIds.has(ds.id) || learner.skills.find((s) => s.skillId === ds.id && s.confidence < 0.5)
  );

  // Recommended focus: gaps that are achievable (prerequisites mostly met)
  const focusAreas = gaps
    .filter((g) => {
      const prereqsMet = g.dependencies.every(
        (dep) => learner.skills.find((s) => s.skillId === dep && s.confidence >= 0.5)
      );
      return prereqsMet;
    })
    .slice(0, 5);

  // Bloom's distribution
  const bloomDist: Record<string, number> = {};
  for (const skill of assessedSkills) {
    const level = skill.bloomLevel.toLowerCase();
    bloomDist[level] = (bloomDist[level] ?? 0) + 1;
  }

  return (
    <Document title={`Skill Report: ${learner.name}`} author="Pedagogical Engine">
      <Page size="A4" style={baseStyles.page}>
        {/* Header band */}
        <View style={baseStyles.headerBand}>
          <Text style={baseStyles.headerTitle}>Skill Report: {learner.name}</Text>
          <Text style={baseStyles.headerSubtitle}>
            {[
              learner.group && `Group: ${learner.group}`,
              learner.domain && `Domain: ${learner.domain}`,
              learner.lastAssessed && `Last assessed: ${learner.lastAssessed.slice(0, 10)}`,
            ]
              .filter(Boolean)
              .join("  |  ")}
          </Text>
        </View>

        {/* Summary stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <SummaryCard
            label="Skills Assessed"
            value={String(assessedSkills.length)}
            subtitle={`of ${totalDomainSkills} in domain`}
            color={colors.primary}
          />
          <SummaryCard
            label="Skills Inferred"
            value={String(inferredSkills.length)}
            subtitle="via dependency inference"
            color={colors.accent}
          />
          <SummaryCard
            label="Coverage"
            value={`${coveragePercent}%`}
            subtitle="domain coverage"
            color={coveragePercent >= 60 ? colors.success : coveragePercent >= 30 ? colors.warning : colors.danger}
          />
        </View>

        {/* Skill Map — visual bar chart */}
        <View style={baseStyles.sectionTitle}>
          <Text>Skill Profile</Text>
        </View>
        {learner.skills
          .sort((a, b) => b.confidence - a.confidence)
          .map((skill, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
              <Text
                style={{
                  width: 150,
                  fontSize: 8,
                  color: colors.gray700,
                  paddingRight: 8,
                }}
              >
                {skill.skillId}
              </Text>
              <View style={[baseStyles.skillBarBg, { flex: 1 }]}>
                <View
                  style={[
                    baseStyles.skillBarFill,
                    {
                      width: `${Math.round(skill.confidence * 100)}%`,
                      backgroundColor: getConfidenceColor(skill.confidence),
                    },
                  ]}
                />
              </View>
              <Text
                style={{
                  width: 35,
                  fontSize: 8,
                  textAlign: "right",
                  color: colors.gray500,
                  paddingLeft: 4,
                }}
              >
                {Math.round(skill.confidence * 100)}%
              </Text>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: skill.source === "inferred" ? colors.accent : colors.primary,
                  marginLeft: 4,
                }}
              />
            </View>
          ))}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 6, marginBottom: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
            <Text style={{ fontSize: 7, color: colors.gray500 }}>Assessed</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
            <Text style={{ fontSize: 7, color: colors.gray500 }}>Inferred</Text>
          </View>
        </View>

        {/* Bloom's Level Distribution */}
        <View style={baseStyles.sectionTitle}>
          <Text>Bloom&apos;s Taxonomy Distribution</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {["knowledge", "comprehension", "application", "analysis", "synthesis", "evaluation"].map(
            (level) => (
              <View
                key={level}
                style={{
                  backgroundColor: bloomDist[level] ? hexToRgba(bloomColors[level], 0.09) : colors.gray100,
                  borderWidth: 1,
                  borderColor: bloomDist[level] ? bloomColors[level] : colors.gray200,
                  borderRadius: 6,
                  padding: 8,
                  width: 80,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Helvetica-Bold",
                    color: bloomDist[level] ? bloomColors[level] : colors.gray400,
                  }}
                >
                  {bloomDist[level] ?? 0}
                </Text>
                <Text style={{ fontSize: 7, color: colors.gray500, marginTop: 2 }}>
                  {bloomLabel(level)}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Strengths */}
        {strengths.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Strengths</Text>
            </View>
            <View style={baseStyles.infoBox}>
              {strengths.slice(0, 8).map((s, i) => (
                <Text key={i} style={{ fontSize: 9, color: colors.gray700, marginBottom: 3 }}>
                  {s.skillId} — {Math.round(s.confidence * 100)}% confidence at{" "}
                  {bloomLabel(s.bloomLevel)} level
                </Text>
              ))}
            </View>
          </>
        )}

        {/* Recommended Focus Areas */}
        {focusAreas.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Recommended Focus Areas</Text>
            </View>
            <Text style={[baseStyles.bodyText, { marginBottom: 6, fontStyle: "italic" }]}>
              These skills have prerequisites met and are ready to learn next:
            </Text>
            {focusAreas.map((skill, i) => (
              <View
                key={i}
                wrap={false}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                  backgroundColor: colors.gray50,
                  padding: 8,
                  borderRadius: 4,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.warning,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: "Helvetica-Bold",
                    color: colors.gray800,
                    marginRight: 8,
                    width: 18,
                  }}
                >
                  {i + 1}.
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.gray700 }}>
                    {skill.label}
                  </Text>
                  <Text style={{ fontSize: 8, color: colors.gray500, marginTop: 1 }}>
                    Bloom&apos;s: {bloomLabel(skill.bloom_level)} | Prerequisites:{" "}
                    {skill.dependencies.length > 0 ? skill.dependencies.join(", ") : "None"}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Notes */}
        {learner.notes.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Educator Notes</Text>
            </View>
            {learner.notes.map((note, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9, color: colors.gray400, marginRight: 6 }}>•</Text>
                <Text style={{ fontSize: 9, color: colors.gray600, flex: 1 }}>{note}</Text>
              </View>
            ))}
          </>
        )}

        {/* Footer */}
        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>
            Generated by Pedagogical Engine | {learner.name} | {learner.domain}
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
  subtitle,
  color,
}: {
  label: string;
  value: string;
  subtitle: string;
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
      <Text style={{ fontSize: 7, color: colors.gray400, marginTop: 2 }}>{subtitle}</Text>
    </View>
  );
}
