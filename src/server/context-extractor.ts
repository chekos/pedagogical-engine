/**
 * Server-side session context extraction.
 *
 * Reads tool_use inputs from assistant messages and accumulates
 * group, domain, constraint, learner, and skill context for the session.
 */

export interface SessionContext {
  groupName: string | null;
  domain: string | null;
  constraints: string[];
  learnerNames: string[];
  skillsDiscussed: string[];
}

export const EMPTY_SESSION_CONTEXT: SessionContext = {
  groupName: null,
  domain: null,
  constraints: [],
  learnerNames: [],
  skillsDiscussed: [],
};

interface ToolUseInput {
  name: string;
  input: Record<string, unknown>;
}

/**
 * Pure function: given an array of tool_use blocks and the current context,
 * returns an updated SessionContext.
 */
export function extractSessionContext(
  toolUses: ToolUseInput[],
  current: SessionContext,
): SessionContext {
  let next = { ...current };

  for (const tool of toolUses) {
    const input = tool.input;

    switch (tool.name) {
      case "mcp__pedagogy__load_roster":
        if (typeof input.groupName === "string") next.groupName = input.groupName;
        if (typeof input.domain === "string") next.domain = input.domain;
        if (Array.isArray(input.members)) {
          const names = input.members
            .map((m: unknown) => {
              if (typeof m === "string") return m;
              if (
                typeof m === "object" &&
                m !== null &&
                "name" in m &&
                typeof (m as Record<string, unknown>).name === "string"
              ) {
                return (m as Record<string, unknown>).name as string;
              }
              return undefined;
            })
            .filter((n): n is string => typeof n === "string");
          if (names.length > 0) {
            next.learnerNames = [...new Set([...next.learnerNames, ...names])];
          }
        }
        break;

      case "mcp__pedagogy__query_skill_graph":
        if (typeof input.domain === "string") next.domain = input.domain;
        if (typeof input.skillId === "string") {
          next.skillsDiscussed = [...new Set([...next.skillsDiscussed, input.skillId])];
        }
        if (Array.isArray(input.skillIds)) {
          const ids = input.skillIds.filter((s: unknown): s is string => typeof s === "string");
          next.skillsDiscussed = [...new Set([...next.skillsDiscussed, ...ids])];
        }
        break;

      case "mcp__pedagogy__query_group":
        if (typeof input.groupName === "string") next.groupName = input.groupName;
        if (typeof input.domain === "string") next.domain = input.domain;
        break;

      case "mcp__pedagogy__assess_learner":
        if (typeof input.learnerId === "string") {
          next.learnerNames = [...new Set([...next.learnerNames, input.learnerId])];
        }
        if (typeof input.domain === "string") next.domain = input.domain;
        if (typeof input.skillId === "string") {
          next.skillsDiscussed = [...new Set([...next.skillsDiscussed, input.skillId])];
        }
        break;

      case "mcp__pedagogy__generate_assessment_link":
      case "mcp__pedagogy__check_assessment_status":
        if (typeof input.groupName === "string") next.groupName = input.groupName;
        if (typeof input.domain === "string") next.domain = input.domain;
        break;

      case "mcp__pedagogy__audit_prerequisites":
      case "mcp__pedagogy__compose_lesson_plan":
        if (typeof input.groupName === "string") next.groupName = input.groupName;
        if (typeof input.domain === "string") next.domain = input.domain;
        if (typeof input.duration === "number") {
          const c = `${input.duration} minutes`;
          if (!next.constraints.includes(c)) next.constraints = [...next.constraints, c];
        }
        if (typeof input.constraints === "string" && input.constraints.trim()) {
          const parts = input.constraints.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
          const newConstraints = parts.filter((p: string) => !next.constraints.includes(p));
          if (newConstraints.length > 0) next.constraints = [...next.constraints, ...newConstraints];
        }
        break;
    }
  }

  return next;
}
