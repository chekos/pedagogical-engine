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
    if (!tool.name.startsWith("mcp__pedagogy__")) continue;
    const input = tool.input;

    // Common parameters — consistent across tools
    if (typeof input.domain === "string") next.domain = input.domain;
    if (typeof input.groupName === "string") next.groupName = input.groupName;

    // Skill references
    if (typeof input.skillId === "string") {
      next.skillsDiscussed = [...new Set([...next.skillsDiscussed, input.skillId])];
    }
    if (Array.isArray(input.skillIds)) {
      const ids = input.skillIds.filter((s: unknown): s is string => typeof s === "string");
      next.skillsDiscussed = [...new Set([...next.skillsDiscussed, ...ids])];
    }

    // Learner references
    if (typeof input.learnerId === "string") {
      next.learnerNames = [...new Set([...next.learnerNames, input.learnerId])];
    }

    // Constraints: duration and explicit constraint strings
    if (typeof input.duration === "number") {
      const c = `${input.duration} minutes`;
      if (!next.constraints.includes(c)) next.constraints = [...next.constraints, c];
    }
    if (typeof input.constraints === "string" && input.constraints.trim()) {
      const parts = input.constraints.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
      const newConstraints = parts.filter((p: string) => !next.constraints.includes(p));
      if (newConstraints.length > 0) next.constraints = [...next.constraints, ...newConstraints];
    }

    // Members from load_roster (array of strings or {name: string} objects)
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
  }

  return next;
}
