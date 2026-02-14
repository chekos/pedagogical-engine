import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, toolResponse } from "./shared.js";
import {
  BLOOM_LEVELS,
  DomainNameSchema,
  DEFAULT_EDGE_CONFIDENCE,
  MAX_SKILLS,
  MAX_EDGES,
  type Skill,
  type Edge,
  validateDomain,
  computeDomainStats,
  loadDomain,
  saveDomain,
  buildManifest,
} from "./domain-utils.js";

const AddSkillSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Skill ID must be lowercase kebab-case"),
  label: z.string().min(5),
  bloom_level: z.enum(BLOOM_LEVELS),
  assessable: z.boolean().default(true),
  dependencies: z.array(z.string()).default([]),
});

const AddEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  confidence: z.number().min(0.1).max(1.0),
  type: z.enum(["prerequisite", "corequisite", "recommended"]).default("prerequisite"),
});

const ModifySkillSchema = z.object({
  id: z.string().describe("ID of the skill to modify"),
  label: z.string().optional().describe("New label"),
  bloom_level: z.enum(BLOOM_LEVELS).optional().describe("New Bloom's level"),
  assessable: z.boolean().optional().describe("New assessable flag"),
  dependencies: z.array(z.string()).optional().describe("Replace dependencies list"),
});

export const updateDomainTool = tool(
  "update_domain",
  "Modify an existing skill domain. Supports adding, removing, and modifying skills and edges. Validates the resulting graph before saving.",
  {
    domain: DomainNameSchema.describe("Domain identifier (e.g. 'outdoor-ecology')"),
    operation: z
      .enum([
        "add_skills",
        "remove_skills",
        "modify_skills",
        "add_edges",
        "remove_edges",
        "list_domains",
      ])
      .describe("The update operation to perform"),
    skills: z
      .array(AddSkillSchema)
      .max(MAX_SKILLS, `Cannot add more than ${MAX_SKILLS} skills at once`)
      .optional()
      .describe("Skills to add (for add_skills operation)"),
    skillIds: z
      .array(z.string())
      .optional()
      .describe("Skill IDs to remove (for remove_skills)"),
    modifications: z
      .array(ModifySkillSchema)
      .optional()
      .describe("Skill modifications (for modify_skills)"),
    edges: z
      .array(AddEdgeSchema)
      .max(MAX_EDGES, `Cannot add more than ${MAX_EDGES} edges at once`)
      .optional()
      .describe("Edges to add (for add_edges)"),
    edgesToRemove: z
      .array(z.object({ source: z.string(), target: z.string() }))
      .optional()
      .describe("Edges to remove by source/target pair (for remove_edges)"),
  },
  async ({ domain, operation, skills, skillIds, modifications, edges, edgesToRemove }) => {
    // Handle list_domains specially — doesn't need an existing domain
    if (operation === "list_domains") {
      const domainsDir = path.join(DATA_DIR, "domains");
      try {
        const entries = await fs.readdir(domainsDir, { withFileTypes: true });
        const directories = entries.filter((e) => e.isDirectory());

        const results = await Promise.allSettled(
          directories.map(async (entry) => {
            const raw = await fs.readFile(
              path.join(domainsDir, entry.name, "skills.json"),
              "utf-8"
            );
            const data = JSON.parse(raw);
            return {
              name: entry.name,
              description: data.description,
              skillCount: data.skills?.length ?? 0,
            };
          })
        );

        const domains = results
          .filter((r): r is PromiseFulfilledResult<{ name: string; description: string; skillCount: number }> =>
            r.status === "fulfilled"
          )
          .map((r) => r.value);

        return toolResponse({ domains, total: domains.length });
      } catch {
        return toolResponse({ domains: [], total: 0 });
      }
    }

    // Load existing domain
    let loaded;
    try {
      loaded = await loadDomain(domain);
    } catch {
      return toolResponse({
        success: false,
        error: `Domain "${domain}" not found. Use create_domain to create it first.`,
      }, true);
    }

    let { skillsData, depsData } = loaded;
    let currentSkills: Skill[] = [...loaded.skills];
    let currentEdges: Edge[] = [...loaded.edges];
    let changeDescription = "";

    switch (operation) {
      case "add_skills": {
        if (!skills || skills.length === 0) {
          return toolResponse({ success: false, error: "skills array is required for add_skills" }, true);
        }
        const existingIds = new Set(currentSkills.map((s) => s.id));
        const newSkills = skills.filter((s) => !existingIds.has(s.id));
        const skipped = skills.filter((s) => existingIds.has(s.id)).map((s) => s.id);

        currentSkills.push(...newSkills);

        // Also add edges for dependencies listed in each skill
        for (const skill of newSkills) {
          for (const dep of skill.dependencies) {
            const edgeExists = currentEdges.some(
              (e) => e.source === dep && e.target === skill.id
            );
            if (!edgeExists) {
              currentEdges.push({
                source: dep,
                target: skill.id,
                confidence: DEFAULT_EDGE_CONFIDENCE,
                type: "prerequisite",
              });
            }
          }
        }

        changeDescription = `Added ${newSkills.length} skills${skipped.length > 0 ? ` (skipped ${skipped.length} duplicates: ${skipped.join(", ")})` : ""}`;
        break;
      }

      case "remove_skills": {
        if (!skillIds || skillIds.length === 0) {
          return toolResponse({ success: false, error: "skillIds array is required for remove_skills" }, true);
        }
        const toRemove = new Set(skillIds);
        const before = currentSkills.length;
        currentSkills = currentSkills.filter((s) => !toRemove.has(s.id));
        // Remove edges involving removed skills
        currentEdges = currentEdges.filter(
          (e) => !toRemove.has(e.source) && !toRemove.has(e.target)
        );
        // Clean dependencies arrays
        for (const skill of currentSkills) {
          skill.dependencies = skill.dependencies.filter((d) => !toRemove.has(d));
        }
        changeDescription = `Removed ${before - currentSkills.length} skills and their edges`;
        break;
      }

      case "modify_skills": {
        if (!modifications || modifications.length === 0) {
          return toolResponse({ success: false, error: "modifications array is required for modify_skills" }, true);
        }

        // Batch: collect all modified skill IDs, single-pass edge removal
        const modifiedIds = new Set(modifications.map((m) => m.id));
        const depsChanged = modifications.some((m) => m.dependencies !== undefined);

        if (depsChanged) {
          // Remove prerequisite edges for all skills being modified (single pass)
          currentEdges = currentEdges.filter(
            (e) => !(modifiedIds.has(e.target) && e.type === "prerequisite")
          );
        }

        let modified = 0;
        for (const mod of modifications) {
          const skill = currentSkills.find((s) => s.id === mod.id);
          if (!skill) continue;
          if (mod.label !== undefined) skill.label = mod.label;
          if (mod.bloom_level !== undefined) skill.bloom_level = mod.bloom_level;
          if (mod.assessable !== undefined) skill.assessable = mod.assessable;
          if (mod.dependencies !== undefined) {
            skill.dependencies = mod.dependencies;
            for (const dep of mod.dependencies) {
              currentEdges.push({
                source: dep,
                target: skill.id,
                confidence: DEFAULT_EDGE_CONFIDENCE,
                type: "prerequisite",
              });
            }
          }
          modified++;
        }
        changeDescription = `Modified ${modified} skills`;
        break;
      }

      case "add_edges": {
        if (!edges || edges.length === 0) {
          return toolResponse({ success: false, error: "edges array is required for add_edges" }, true);
        }
        let added = 0;
        for (const edge of edges) {
          const exists = currentEdges.some(
            (e) => e.source === edge.source && e.target === edge.target
          );
          if (!exists) {
            currentEdges.push(edge);
            // Also update the target skill's dependencies array
            const targetSkill = currentSkills.find((s) => s.id === edge.target);
            if (targetSkill && !targetSkill.dependencies.includes(edge.source)) {
              targetSkill.dependencies.push(edge.source);
            }
            added++;
          }
        }
        changeDescription = `Added ${added} edges`;
        break;
      }

      case "remove_edges": {
        if (!edgesToRemove || edgesToRemove.length === 0) {
          return toolResponse({ success: false, error: "edgesToRemove array is required for remove_edges" }, true);
        }
        let removed = 0;
        for (const er of edgesToRemove) {
          const before = currentEdges.length;
          currentEdges = currentEdges.filter(
            (e) => !(e.source === er.source && e.target === er.target)
          );
          if (currentEdges.length < before) {
            removed++;
            // Also update the target skill's dependencies array
            const targetSkill = currentSkills.find((s) => s.id === er.target);
            if (targetSkill) {
              targetSkill.dependencies = targetSkill.dependencies.filter(
                (d) => d !== er.source
              );
            }
          }
        }
        changeDescription = `Removed ${removed} edges`;
        break;
      }
    }

    // Validate the resulting graph
    const validation = validateDomain(currentSkills, currentEdges);

    if (!validation.valid) {
      return toolResponse({
        success: false,
        operation,
        changeDescription,
        errors: validation.errors,
        warnings: validation.warnings,
        message:
          "Update would create an invalid graph. Fix the errors and try again. The domain was NOT modified.",
      }, true);
    }

    // Save updated domain
    skillsData.skills = currentSkills;
    depsData.edges = currentEdges;

    // Refresh manifest stats if manifest exists
    let manifestData: Record<string, unknown> | undefined;
    if (loaded.manifestData) {
      manifestData = buildManifest(
        domain,
        (skillsData.description as string) || "",
        currentSkills,
        currentEdges,
        {},
        loaded.manifestData
      );
    }

    await saveDomain(domain, skillsData, depsData, manifestData);

    const stats = computeDomainStats(currentSkills, currentEdges);

    return toolResponse({
      success: true,
      domain,
      operation,
      changeDescription,
      stats,
      warnings: validation.warnings,
      message: `Domain "${domain}" updated: ${changeDescription}`,
    });
  }
);
