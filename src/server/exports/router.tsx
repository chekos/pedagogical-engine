import { Router } from "express";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  LessonPlanPDF,
  LearnerReportPDF,
  GroupReportPDF,
  PrerequisitesHandoutPDF,
  loadLessonPlan,
  loadLearnerProfile,
  loadGroupData,
  loadDomainSkills,
  loadAllLearnersInGroup,
  listLessonPlans,
} from "./index.js";

export const exportRouter = Router();

// ─── List available lesson plans ─────────────────────────────────
exportRouter.get("/lessons", async (_req, res) => {
  try {
    const lessons = await listLessonPlans();
    res.json({ lessons });
  } catch (err) {
    console.error("[export] Lesson list error:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Failed to list lesson plans" });
  }
});

// ─── Export lesson plan as PDF ───────────────────────────────────
exportRouter.get("/lesson/:id", async (req, res) => {
  try {
    const lesson = await loadLessonPlan(req.params.id);
    const buffer = await renderToBuffer(
      <LessonPlanPDF lesson={lesson} />
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="lesson-${req.params.id}.pdf"`
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("not found") || message.includes("Invalid")) {
      res.status(404).json({ error: message });
    } else {
      console.error("[export] Lesson PDF error:", message);
      res.status(500).json({ error: "Failed to generate lesson PDF" });
    }
  }
});

// ─── Export prerequisites handout as PDF ─────────────────────────
exportRouter.get("/lesson/:id/prerequisites", async (req, res) => {
  try {
    const lesson = await loadLessonPlan(req.params.id);
    const buffer = await renderToBuffer(
      <PrerequisitesHandoutPDF lesson={lesson} />
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="prerequisites-${req.params.id}.pdf"`
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("not found") || message.includes("Invalid")) {
      res.status(404).json({ error: message });
    } else {
      console.error("[export] Prerequisites PDF error:", message);
      res.status(500).json({ error: "Failed to generate prerequisites PDF" });
    }
  }
});

// ─── Export learner skill report as PDF ──────────────────────────
exportRouter.get("/learner/:id", async (req, res) => {
  try {
    const learner = await loadLearnerProfile(req.params.id);
    const domainSkills = await loadDomainSkills(learner.domain);
    const buffer = await renderToBuffer(
      <LearnerReportPDF learner={learner} domainSkills={domainSkills} />
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="learner-${req.params.id}.pdf"`
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("ENOENT") || message.includes("not found") || message.includes("Invalid")) {
      res.status(404).json({ error: `Learner '${req.params.id}' not found` });
    } else {
      console.error("[export] Learner PDF error:", message);
      res.status(500).json({ error: "Failed to generate learner PDF" });
    }
  }
});

// ─── Export group summary report as PDF ──────────────────────────
exportRouter.get("/group/:id", async (req, res) => {
  try {
    const group = await loadGroupData(req.params.id);
    const learners = await loadAllLearnersInGroup(req.params.id);
    const domainSkills = await loadDomainSkills(group.domain);
    const buffer = await renderToBuffer(
      <GroupReportPDF group={group} learners={learners} domainSkills={domainSkills} />
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="group-${req.params.id}.pdf"`
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("ENOENT") || message.includes("not found") || message.includes("Invalid")) {
      res.status(404).json({ error: `Group '${req.params.id}' not found` });
    } else {
      console.error("[export] Group PDF error:", message);
      res.status(500).json({ error: "Failed to generate group PDF" });
    }
  }
});
