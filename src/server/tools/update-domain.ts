import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { validateDomain } from "./create-domain.js";

const DATA_DIR = process.env.DATA_DIR || "./data";

const BLOOM_LEVELS = [
  "knowledge",
  "comprehension",
  "application",
  "analysis",
  "synthesis",
  "evaluation",
] as const;

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

interface Skill {
  id: string;
  label: string;
  bloom_level: string;
  assessable: boolean;
  dependencies: string[];
}

interface Edge {
  source: string;
  target: string;
  confidence: number;
  type: string;
}

async function loadDomain(domain: string) {
  const domainDir = path.join(DATA_DIR, "domains", domain);
  const [skillsRaw, depsRaw] = await Promise.all([
    fs.readFile(path.join(domainDir, "skills.json"), "utf-8"),
    fs.readFile(path.join(domainDir, "dependencies.json"), "utf-8"),
  ]);
  const skillsData = JSON.parse(skillsRaw);
  const depsData = JSON.parse(depsRaw);
  return {
    skillsData,
    depsData,
    skills: skillsData.skills as Skill[],
    edges: depsData.edges as Edge[],
  };
}

async function saveDomain(
  domain: string,
  skillsData: any,
  depsData: any
) {
  const domainDir = path.join(DATA_DIR, "domains", domain);
  await Promise.all([
    fs.writeFile(
      path.join(domainDir, "skills.json"),
      JSON.stringify(skillsData, null, 2) + "\n"
    ),
    fs.writeFile(
      path.join(domainDir, "dependencies.json"),
      JSON.stringify(depsData, null, 2) + "\n"
    ),
  ]);
}

export const updateDomainTool = tool(
  "update_domain",
  "Modify an existing skill domain. Supports adding, removing, and modifying skills and edges. Validates the resulting graph before saving.",
  {
    domain: z.string().describe("Domain identifier (e.g. 'outdoor-ecology')"),
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
        const domains = [];
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          try {
            const raw = await fs.readFile(
              path.join(domainsDir, entry.name, "skills.json"),
              "utf-8"
            );
            const data = JSON.parse(raw);
            domains.push({
              name: entry.name,
              description: data.description,
              skillCount: data.skills?.length ?? 0,
            });
          } catch {
            // Skip directories without valid skills.json
          }
        }
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ domains, total: domains.length }, null, 2),
            },
          ],
        };
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ domains: [], total: 0 }, null, 2),
            },
          ],
        };
      }
    }

    // Load existing domain
    let loaded;
    try {
      loaded = await loadDomain(domain);
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                error: `Domain "${domain}" not found. Use create_domain to create it first.`,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    let { skillsData, depsData } = loaded;
    let currentSkills: Skill[] = [...loaded.skills];
    let currentEdges: Edge[] = [...loaded.edges];
    let changeDescription = "";

    switch (operation) {
      case "add_skills": {
        if (!skills || skills.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ success: false, error: "skills array is required for add_skills" }, null, 2),
              },
            ],
            isError: true,
          };
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
                confidence: 0.85,
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
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ success: false, error: "skillIds array is required for remove_skills" }, null, 2),
              },
            ],
            isError: true,
          };
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
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ success: false, error: "modifications array is required for modify_skills" }, null, 2),
              },
            ],
            isError: true,
          };
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
            // Update edges to match
            currentEdges = currentEdges.filter((e) => e.target !== skill.id || e.type !== "prerequisite");
            for (const dep of mod.dependencies) {
              currentEdges.push({
                source: dep,
                target: skill.id,
                confidence: 0.85,
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
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ success: false, error: "edges array is required for add_edges" }, null, 2),
              },
            ],
            isError: true,
          };
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
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ success: false, error: "edgesToRemove array is required for remove_edges" }, null, 2),
              },
            ],
            isError: true,
          };
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
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                operation,
                changeDescription,
                errors: validation.errors,
                warnings: validation.warnings,
                message:
                  "Update would create an invalid graph. Fix the errors and try again. The domain was NOT modified.",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    // Save updated domain
    skillsData.skills = currentSkills;
    depsData.edges = currentEdges;

    await saveDomain(domain, skillsData, depsData);

    // Compute summary
    const bloomDist: Record<string, number> = {};
    for (const s of currentSkills) {
      bloomDist[s.bloom_level] = (bloomDist[s.bloom_level] || 0) + 1;
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              domain,
              operation,
              changeDescription,
              stats: {
                totalSkills: currentSkills.length,
                totalEdges: currentEdges.length,
                bloomDistribution: bloomDist,
              },
              warnings: validation.warnings,
              message: `Domain "${domain}" updated: ${changeDescription}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
