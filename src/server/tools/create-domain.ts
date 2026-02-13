import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import {
  DomainNameSchema,
  SkillSchema,
  EdgeSchema,
  MAX_SKILLS,
  MAX_EDGES,
  validateDomain,
  computeDomainStats,
  domainDir,
  saveDomain,
} from "./domain-utils.js";

export const createDomainTool = tool(
  "create_domain",
  "Create a new skill domain with skills and dependency edges. Validates the graph for circular dependencies, Bloom's level progression, orphan skills, and unreachable nodes. Writes skills.json and dependencies.json to data/domains/{domain}/.",
  {
    domain: DomainNameSchema.describe("Domain identifier (e.g. 'outdoor-ecology')"),
    description: z
      .string()
      .describe("Human-readable description of this skill domain"),
    skills: z
      .array(SkillSchema)
      .min(3, "Domain must have at least 3 skills")
      .max(MAX_SKILLS, `Domain cannot exceed ${MAX_SKILLS} skills`)
      .describe("Array of skill objects with id, label, bloom_level, assessable, dependencies"),
    edges: z
      .array(EdgeSchema)
      .min(2, "Domain must have at least 2 dependency edges")
      .max(MAX_EDGES, `Domain cannot exceed ${MAX_EDGES} edges`)
      .describe("Array of dependency edges with source, target, confidence, type"),
    overwrite: z
      .boolean()
      .default(false)
      .describe("If true, overwrite an existing domain. Default false."),
  },
  async ({ domain, description, skills, edges, overwrite }) => {
    // Validate the graph
    const validation = validateDomain(skills, edges);

    if (!validation.valid) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                domain,
                errors: validation.errors,
                warnings: validation.warnings,
                message:
                  "Domain graph has errors that must be fixed before saving. Review the errors and resubmit.",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    // Check if domain already exists
    const dir = domainDir(domain);
    try {
      await fs.access(dir);
      if (!overwrite) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: false,
                  domain,
                  error: `Domain "${domain}" already exists. Set overwrite: true to replace it.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch {
      // Domain doesn't exist yet — good
    }

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Build skills.json
    const skillsData = {
      domain,
      version: "1.0.0",
      description,
      skills: skills.map((s) => ({
        id: s.id,
        label: s.label,
        bloom_level: s.bloom_level,
        assessable: s.assessable,
        dependencies: s.dependencies,
      })),
    };

    // Build dependencies.json
    const depsData = {
      domain,
      version: "1.0.0",
      description: `Directed dependency edges between ${domain} skills. Source is the prerequisite; target is the dependent skill.`,
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
        confidence: e.confidence,
        type: e.type,
      })),
    };

    await saveDomain(domain, skillsData, depsData);

    const stats = computeDomainStats(skills, edges);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              domain,
              path: `data/domains/${domain}/`,
              stats,
              warnings: validation.warnings,
              message: `Domain "${domain}" created successfully with ${skills.length} skills and ${edges.length} edges.`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
