import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

/**
 * Run dependency inference: given demonstrated skills, infer prerequisites
 * with confidence decay.
 */
async function runDependencyInference(
  domain: string,
  demonstratedSkills: Array<{ skillId: string; confidence: number }>
): Promise<Array<{ skillId: string; confidence: number }>> {
  const domainDir = path.join(DATA_DIR, "domains", domain);
  const depsRaw = await fs.readFile(
    path.join(domainDir, "dependencies.json"),
    "utf-8"
  );
  const { edges } = JSON.parse(depsRaw);

  const bestConfidence = new Map<string, number>();

  // Set demonstrated skills
  for (const { skillId, confidence } of demonstratedSkills) {
    bestConfidence.set(skillId, confidence);
  }

  // For each demonstrated skill, infer prerequisites
  for (const { skillId, confidence: baseConf } of demonstratedSkills) {
    const queue: Array<{ id: string; confidence: number }> = [];

    const directPrereqs = edges.filter(
      (e: { target: string }) => e.target === skillId
    );
    for (const edge of directPrereqs) {
      const conf =
        Math.round(baseConf * edge.confidence * 100) / 100;
      queue.push({ id: edge.source, confidence: conf });
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const existing = bestConfidence.get(current.id) ?? 0;

      if (current.confidence > existing) {
        bestConfidence.set(current.id, current.confidence);
      }

      // Continue traversal only if this is a better path
      if (current.confidence > existing) {
        const prereqEdges = edges.filter(
          (e: { target: string }) => e.target === current.id
        );
        for (const edge of prereqEdges) {
          const newConf =
            Math.round(current.confidence * edge.confidence * 100) / 100;
          const prevBest = bestConfidence.get(edge.source) ?? 0;
          if (newConf > prevBest) {
            queue.push({ id: edge.source, confidence: newConf });
          }
        }
      }
    }
  }

  // Return only inferred skills (not the demonstrated ones)
  const demonstratedIds = new Set(demonstratedSkills.map((s) => s.skillId));
  const inferred: Array<{ skillId: string; confidence: number }> = [];
  for (const [skillId, confidence] of bestConfidence.entries()) {
    if (!demonstratedIds.has(skillId)) {
      inferred.push({ skillId, confidence });
    }
  }

  return inferred.sort((a, b) => b.confidence - a.confidence);
}

export const assessLearnerTool = tool(
  "assess_learner",
  "Update a learner's profile with assessment results and run dependency inference to update inferred skills.",
  {
    learnerId: z.string().describe("Learner's file ID (without .md)"),
    domain: z.string().describe("Skill domain"),
    assessedSkills: z
      .array(
        z.object({
          skillId: z.string(),
          confidence: z.number().describe("0.0 to 1.0"),
          bloomLevel: z
            .string()
            .describe(
              "Bloom's level demonstrated: knowledge, comprehension, application, analysis, synthesis, evaluation"
            ),
          notes: z.string().optional().describe("Assessment notes"),
        })
      )
      .describe("Skills that were directly assessed"),
  },
  async ({ learnerId, domain, assessedSkills }) => {
    const learnerPath = path.join(DATA_DIR, "learners", `${learnerId}.md`);

    let content: string;
    try {
      content = await fs.readFile(learnerPath, "utf-8");
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Learner profile '${learnerId}' not found`,
            }),
          },
        ],
        isError: true,
      };
    }

    // Run dependency inference
    const inferred = await runDependencyInference(
      domain,
      assessedSkills.map((s) => ({
        skillId: s.skillId,
        confidence: s.confidence,
      }))
    );

    // Build updated skills sections
    const assessedSection = assessedSkills
      .map((s) => {
        let line = `- ${s.skillId}: ${s.confidence} confidence — demonstrated at ${s.bloomLevel} level`;
        if (s.notes) line += ` (${s.notes})`;
        return line;
      })
      .join("\n");

    const inferredSection =
      inferred.length > 0
        ? inferred
            .map((s) => `- ${s.skillId}: ${s.confidence} confidence (inferred)`)
            .join("\n")
        : "_No skills inferred._";

    const now = new Date().toISOString();

    // Update the profile content
    // Replace the Assessed Skills section
    if (content.includes("## Assessed Skills")) {
      const before = content.split("## Assessed Skills")[0];
      const afterAssessed = content.split("## Assessed Skills")[1];
      const restAfterAssessed = afterAssessed.includes("## Inferred Skills")
        ? "## Inferred Skills" +
          afterAssessed.split("## Inferred Skills")[1]
        : afterAssessed.split("##").slice(1).map((s) => "##" + s).join("");

      // Replace Inferred Skills section too
      let rest: string;
      if (restAfterAssessed.includes("## Inferred Skills")) {
        const beforeInferred = "";
        const afterInferred = restAfterAssessed.split("## Inferred Skills")[1];
        const restAfterInferred = afterInferred.includes("## Notes")
          ? "## Notes" + afterInferred.split("## Notes")[1]
          : "";

        rest = `## Inferred Skills\n\n${inferredSection}\n\n${restAfterInferred}`;
      } else {
        rest = restAfterAssessed;
      }

      content = `${before}## Assessed Skills\n\n${assessedSection}\n\n${rest}`;
    }

    // Update last assessed date
    content = content.replace(
      /\| \*\*Last assessed\*\* \| .+ \|/,
      `| **Last assessed** | ${now} |`
    );

    await fs.writeFile(learnerPath, content, "utf-8");

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              learnerId,
              domain,
              updated: true,
              assessedSkills: assessedSkills.map((s) => ({
                skillId: s.skillId,
                confidence: s.confidence,
                bloomLevel: s.bloomLevel,
              })),
              inferredSkills: inferred,
              totalAssessed: assessedSkills.length,
              totalInferred: inferred.length,
              profilePath: learnerPath,
              lastAssessed: now,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
