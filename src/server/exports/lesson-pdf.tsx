import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { baseStyles, colors } from "./shared-styles.js";
import type { LessonPlanData } from "./data-parsers.js";

interface LessonPDFProps {
  lesson: LessonPlanData;
}

export function LessonPlanPDF({ lesson }: LessonPDFProps) {
  return (
    <Document title={lesson.title} author="Pedagogical Engine">
      <Page size="A4" style={baseStyles.page}>
        {/* Header band */}
        <View style={baseStyles.headerBand}>
          <Text style={baseStyles.headerTitle}>{lesson.title}</Text>
          <Text style={baseStyles.headerSubtitle}>
            {[
              lesson.preparedFor && `Prepared for: ${lesson.preparedFor}`,
              lesson.date && `Date: ${lesson.date}`,
              lesson.domain && `Domain: ${lesson.domain}`,
            ]
              .filter(Boolean)
              .join("  |  ")}
          </Text>
        </View>

        {/* Session Overview */}
        <View style={baseStyles.sectionTitle}>
          <Text>Session Overview</Text>
        </View>
        <View style={baseStyles.tableContainer}>
          {[
            { label: "Topic", value: lesson.topic },
            { label: "Duration", value: lesson.duration },
            { label: "Audience", value: lesson.audience },
            { label: "Setting", value: lesson.setting },
          ]
            .filter((r) => r.value)
            .map((row, i) => (
              <View key={i} style={baseStyles.tableRow}>
                <Text
                  style={[
                    baseStyles.tableHeaderCell,
                    { width: 100, textTransform: "none" as const },
                  ]}
                >
                  {row.label}
                </Text>
                <Text style={[baseStyles.tableCell, { flex: 1 }]}>
                  {row.value}
                </Text>
              </View>
            ))}
        </View>

        {/* Learning Objectives */}
        {lesson.objectives.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Learning Objectives</Text>
            </View>
            {lesson.objectives.map((obj, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 5, paddingLeft: 4 }}>
                <Text
                  style={{
                    width: 20,
                    fontSize: 10,
                    fontFamily: "Helvetica-Bold",
                    color: colors.primary,
                  }}
                >
                  {i + 1}.
                </Text>
                <Text style={[baseStyles.bodyText, { flex: 1, marginBottom: 0 }]}>
                  {obj}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Prerequisites Checklist */}
        {lesson.prerequisiteSkills.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Prerequisites Checklist</Text>
            </View>
            <Text style={[baseStyles.bodyText, { marginBottom: 8, fontStyle: "italic" }]}>
              Verify these skills before the session begins:
            </Text>
            {lesson.prerequisiteSkills.map((skill, i) => (
              <View key={i} style={baseStyles.checklistItem}>
                <View style={baseStyles.checkbox} />
                <Text style={[baseStyles.bodyText, { flex: 1, marginBottom: 0 }]}>
                  {skill}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Tool Requirements */}
        {lesson.prerequisiteTools.length > 0 && (
          <>
            <View style={baseStyles.subsectionTitle}>
              <Text>Tool & Account Requirements</Text>
            </View>
            <View style={baseStyles.tableContainer}>
              <View style={baseStyles.tableHeader}>
                <Text style={[baseStyles.tableHeaderCell, { width: 140 }]}>Tool</Text>
                <Text style={[baseStyles.tableHeaderCell, { width: 60 }]}>Required</Text>
                <Text style={[baseStyles.tableHeaderCell, { width: 60 }]}>Cost</Text>
                <Text style={[baseStyles.tableHeaderCell, { flex: 1 }]}>Status</Text>
              </View>
              {lesson.prerequisiteTools.map((tool, i) => (
                <View key={i} style={baseStyles.tableRow}>
                  <Text style={[baseStyles.tableCell, { width: 140 }]}>{tool.tool}</Text>
                  <Text style={[baseStyles.tableCell, { width: 60 }]}>
                    {tool.required ? "Yes" : "No"}
                  </Text>
                  <Text style={[baseStyles.tableCell, { width: 60 }]}>{tool.cost}</Text>
                  <Text style={[baseStyles.tableCell, { flex: 1 }]}>{tool.status}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>
            Generated by Pedagogical Engine
          </Text>
          <Text
            style={baseStyles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* Timed Session Plan — page 2+ */}
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.sectionTitle}>
          <Text>Timed Session Plan</Text>
        </View>

        {lesson.sections
          .filter((s) => s.timing || s.title.match(/PHASE|Activity|Exercise|0:/i))
          .slice(0, 20) // Limit to prevent overflow
          .map((section, i) => (
            <View
              key={i}
              wrap={false}
              style={{
                marginBottom: 10,
                borderLeftWidth: 3,
                borderLeftColor: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.accent : colors.success,
                paddingLeft: 10,
                paddingVertical: 4,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "Helvetica-Bold",
                    color: colors.gray800,
                    flex: 1,
                  }}
                >
                  {section.title}
                </Text>
                {section.timing && (
                  <View
                    style={{
                      backgroundColor: colors.primaryLight,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 8, color: colors.primary, fontFamily: "Helvetica-Bold" }}>
                      {section.timing}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 9, color: colors.gray600, lineHeight: 1.4 }}>
                {section.content.slice(0, 300)}
                {section.content.length > 300 ? "..." : ""}
              </Text>
            </View>
          ))}

        {/* Contingency Notes */}
        {lesson.contingencies.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Contingency Notes</Text>
            </View>
            {lesson.contingencies.map((note, i) => (
              <View key={i} style={baseStyles.warningBox}>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.gray700, marginBottom: 2 }}>
                  If {note}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Logistics */}
        {lesson.logistics.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Logistics & Resources</Text>
            </View>
            <View style={baseStyles.tableContainer}>
              <View style={baseStyles.tableHeader}>
                <Text style={[baseStyles.tableHeaderCell, { width: 200 }]}>Resource</Text>
                <Text style={[baseStyles.tableHeaderCell, { flex: 1 }]}>Location / URL</Text>
              </View>
              {lesson.logistics.map((item, i) => (
                <View key={i} style={baseStyles.tableRow}>
                  <Text style={[baseStyles.tableCell, { width: 200 }]}>{item.resource}</Text>
                  <Text style={[baseStyles.tableCell, { flex: 1, color: colors.primary }]}>
                    {item.url}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>
            Generated by Pedagogical Engine
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
