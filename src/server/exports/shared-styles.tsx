import { StyleSheet, Font } from "@react-pdf/renderer";

// Disable hyphenation to avoid issues
Font.registerHyphenationCallback((word) => [word]);

// ─── Color palette ──────────────────────────────────────────────
export const colors = {
  primary: "#4F46E5",       // Indigo-600
  primaryLight: "#EEF2FF",  // Indigo-50
  accent: "#0EA5E9",        // Sky-500
  accentLight: "#F0F9FF",   // Sky-50
  success: "#10B981",       // Emerald-500
  successLight: "#ECFDF5",  // Emerald-50
  warning: "#F59E0B",       // Amber-500
  warningLight: "#FFFBEB",  // Amber-50
  danger: "#EF4444",        // Red-500
  dangerLight: "#FEF2F2",   // Red-50
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
  white: "#FFFFFF",
};

// ─── Bloom's level colors ────────────────────────────────────────
export const bloomColors: Record<string, string> = {
  knowledge: "#3B82F6",
  comprehension: "#10B981",
  application: "#F59E0B",
  analysis: "#F97316",
  synthesis: "#8B5CF6",
  evaluation: "#EF4444",
  unknown: "#9CA3AF",
  inferred: "#06B6D4",
};

// ─── Helpers ────────────────────────────────────────────────────

/** Convert a hex color + alpha (0–1) to rgba() string for react-pdf compatibility. */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Shared styles ──────────────────────────────────────────────
export const baseStyles = StyleSheet.create({
  page: {
    padding: 50,
    paddingBottom: 65,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.gray800,
    lineHeight: 1.5,
  },
  // Header section at top of first page
  headerBand: {
    backgroundColor: colors.primary,
    padding: 20,
    marginHorizontal: -50,
    marginTop: -50,
    marginBottom: 25,
    paddingHorizontal: 50,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#C7D2FE", // Indigo-200
    lineHeight: 1.4,
  },
  // Section headings
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 8,
    marginTop: 18,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.gray700,
    marginBottom: 6,
    marginTop: 12,
  },
  // Body text
  bodyText: {
    fontSize: 10,
    color: colors.gray700,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  // Tables
  tableContainer: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray600,
    textTransform: "uppercase",
  },
  tableCell: {
    fontSize: 9,
    color: colors.gray700,
  },
  // Badges/pills
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  // Checklist items
  checklistItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingLeft: 4,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderColor: colors.gray400,
    borderRadius: 2,
    marginRight: 8,
    marginTop: 1,
  },
  // Cards / info boxes
  infoBox: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  warningBox: {
    backgroundColor: colors.warningLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 25,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.gray400,
  },
  // Skill bar
  skillBarBg: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: "hidden",
  },
  skillBarFill: {
    height: 8,
    borderRadius: 4,
  },
});
