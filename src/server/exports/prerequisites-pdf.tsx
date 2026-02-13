import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { baseStyles, colors } from "./shared-styles.js";
import type { LessonPlanData } from "./data-parsers.js";

interface PrerequisitesPDFProps {
  lesson: LessonPlanData;
}

export function PrerequisitesHandoutPDF({ lesson }: PrerequisitesPDFProps) {
  return (
    <Document title={`Prerequisites: ${lesson.title}`} author="Pedagogical Engine">
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <View style={baseStyles.headerBand}>
          <Text style={baseStyles.headerTitle}>Before the Session</Text>
          <Text style={baseStyles.headerSubtitle}>
            Please complete these items before our next meeting
          </Text>
        </View>

        {/* Session Info */}
        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Helvetica-Bold",
              color: colors.primary,
              marginBottom: 6,
            }}
          >
            {lesson.title}
          </Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            {lesson.date && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 9, color: colors.gray500 }}>Date:</Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.gray700 }}>
                  {lesson.date}
                </Text>
              </View>
            )}
            {lesson.duration && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 9, color: colors.gray500 }}>Duration:</Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.gray700 }}>
                  {lesson.duration}
                </Text>
              </View>
            )}
            {lesson.setting && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 9, color: colors.gray500 }}>Setting:</Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.gray700 }}>
                  {lesson.setting}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tool & Software Requirements */}
        {lesson.prerequisiteTools.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Software & Tools to Install</Text>
            </View>
            <Text style={[baseStyles.bodyText, { marginBottom: 10 }]}>
              Make sure these are installed and working on your computer before the session:
            </Text>
            {lesson.prerequisiteTools.map((tool, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 10,
                  paddingLeft: 4,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderWidth: 2,
                    borderColor: tool.required ? colors.primary : colors.gray300,
                    borderRadius: 3,
                    marginRight: 10,
                    marginTop: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!tool.required && (
                    <Text style={{ fontSize: 7, color: colors.gray400 }}>opt</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Helvetica-Bold",
                      color: colors.gray800,
                    }}
                  >
                    {tool.tool}
                    {tool.required ? "" : " (optional)"}
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.gray500, marginTop: 2 }}>
                    Cost: {tool.cost}
                    {tool.status ? ` | ${tool.status}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Skill Prerequisites — what you should review */}
        {lesson.prerequisiteSkills.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Skills to Review</Text>
            </View>
            <Text style={[baseStyles.bodyText, { marginBottom: 10 }]}>
              We will build on these skills during the session. Review them if you need a refresher:
            </Text>
            {lesson.prerequisiteSkills.map((skill, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 10,
                  paddingLeft: 4,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderWidth: 2,
                    borderColor: colors.gray300,
                    borderRadius: 3,
                    marginRight: 10,
                    marginTop: 1,
                  }}
                />
                <Text style={{ fontSize: 10, color: colors.gray700, flex: 1 }}>{skill}</Text>
              </View>
            ))}
          </>
        )}

        {/* Learning Objectives — what you'll learn */}
        {lesson.objectives.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>What You Will Learn</Text>
            </View>
            <Text style={[baseStyles.bodyText, { marginBottom: 8 }]}>
              By the end of the session, you will be able to:
            </Text>
            {lesson.objectives.map((obj, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 6, paddingLeft: 4 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.primary }}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[baseStyles.bodyText, { flex: 1, marginBottom: 0 }]}>
                  {obj.replace(/\s*\*\([^)]+\)\*\s*/g, "").replace(/\s*\(Bloom's:[^)]+\)/g, "")}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Logistics */}
        {lesson.logistics.length > 0 && (
          <>
            <View style={baseStyles.sectionTitle}>
              <Text>Useful Links</Text>
            </View>
            {lesson.logistics.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9, color: colors.gray400, marginRight: 6 }}>•</Text>
                <Text style={{ fontSize: 9, color: colors.gray700 }}>
                  {item.resource}: {item.url}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Bottom note */}
        <View
          style={{
            marginTop: 24,
            backgroundColor: colors.gray50,
            borderRadius: 8,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.gray200,
          }}
        >
          <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.gray700, marginBottom: 4 }}>
            Questions?
          </Text>
          <Text style={{ fontSize: 9, color: colors.gray600, lineHeight: 1.5 }}>
            If you have trouble installing any of the tools above, don&apos;t worry! Come to the
            session early and we will help you get set up. The most important thing is that you
            show up ready to learn.
          </Text>
        </View>

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
    </Document>
  );
}
