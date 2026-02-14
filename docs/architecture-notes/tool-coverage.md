# Frontend Tool Coverage

The backend registers 28 MCP tools in `src/server/tools/index.ts`. The frontend has three locations that map tool names to behavior. All three currently cover the same 8 core tools, leaving 20 tools unmapped.

## Where tool names are mapped

| Location | Purpose | File |
|----------|---------|------|
| **TOOL_META** | Human-readable labels and colors for tool result cards | `src/frontend/components/chat/tool-result.tsx` |
| **STAGE_LABELS** | Progress indicator labels shown while tools execute | `src/frontend/components/chat/progress-indicator.tsx` |
| **extractContext** | Session context extraction (group, domain, skills, constraints) | `src/frontend/components/chat/chat-interface.tsx` |

## Covered tools (8 of 28)

These tools have labels, progress indicators, and context extraction:

| Tool | Purpose |
|------|---------|
| `load_roster` | Load or create groups and learner profiles |
| `query_skill_graph` | BFS/DFS traversal, dependency inference, Bloom's filtering |
| `assess_learner` | Update profiles with assessment results |
| `generate_assessment_link` | Create assessment sessions with shareable codes |
| `check_assessment_status` | Scan group profiles for assessment completion |
| `query_group` | Aggregate skill distributions, identify gaps |
| `audit_prerequisites` | Cross-reference lesson needs against profiles |
| `compose_lesson_plan` | Orchestrate graph + profiles + constraints into lesson markdown |

## Unmapped tools (20 of 28)

These tools work correctly on the backend but have no frontend-specific handling:

| Tool | Purpose | Moonshot | Has `domain`? | Has `groupName`? |
|------|---------|----------|:---:|:---:|
| `create_domain` | Create a new skill domain from scratch | - | yes | - |
| `update_domain` | Update an existing domain's skills/deps | - | yes | - |
| `compose_curriculum` | Compose a multi-session curriculum plan | - | yes | yes |
| `advance_curriculum` | Advance curriculum state after a session | - | yes | yes |
| `simulate_lesson` | Predict friction points before teaching | 1 | yes | yes |
| `analyze_tensions` | Push back on suboptimal plans with evidence | 2 | yes | yes |
| `analyze_cross_domain_transfer` | Analyze skill transfer across domains | 3 | - | - |
| `explain_reasoning` | Retrieve reasoning traces for plan decisions | 4 | - | - |
| `store_reasoning_traces` | Store reasoning traces during composition | 4 | - | - |
| `analyze_meta_pedagogical_patterns` | Detect educator question patterns | 4 | - | - |
| `analyze_assessment_integrity` | Detect gaming and inconsistency | 5 | yes | - |
| `analyze_affective_context` | Emotional/motivational context for a group | 6 | yes | yes |
| `process_debrief` | Structured post-session reflection | 7 | yes | yes |
| `query_teaching_wisdom` | Retrieve accumulated teaching notes | 8 | yes | - |
| `analyze_teaching_patterns` | Detect recurring patterns across debriefs | 8 | yes | - |
| `add_teaching_note` | Add educator-direct teaching notes | 8 | yes | - |
| `load_educator_profile` | Load teaching profile | 9 | - | - |
| `update_educator_profile` | Create/update educator profile | 9 | - | - |
| `analyze_educator_context` | Lesson customization from educator profile | 9 | yes | - |
| `report_assessment_progress` | Report assessment progress to educator | - | - | - |

## What this means in practice

1. **No labels**: When an unmapped tool runs, `tool-result.tsx` falls back to showing the raw tool name (e.g., `mcp__pedagogy__simulate_lesson`). No color, no friendly label.

2. **No progress indicators**: When an unmapped tool is executing, the progress indicator shows a generic "Working..." instead of a descriptive stage like "Simulating lesson..."

3. **No context extraction**: When `compose_curriculum` is called with `domain: "python-data-analysis"` and `groupName: "tuesday-cohort"`, the session context sidebar does not pick up those values. The sidebar only updates from the 8 mapped tools.

## Why this happens

All three frontend mappings were written during the initial build when only 8 tools existed. The moonshot tools (sessions 5-11) were added to the backend without corresponding frontend mapping updates. Each new tool works correctly through the chat — the agent calls it, gets results, and incorporates them into its response — but the UI feedback is degraded.

## Recommended fix: generic extraction

Instead of adding each tool to a switch statement, use a pattern-based approach:

### For `extractContext` (session context sidebar)

Most pedagogy tools use consistent parameter names. A generic extractor could replace the per-tool switch:

```typescript
const extractContext = useCallback((tools: ToolUse[]) => {
  setSessionContext((prev) => {
    let next = { ...prev };
    for (const tool of tools) {
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

      // Tool-specific: constraints from compose_lesson_plan / audit_prerequisites
      if (typeof input.duration === "number") {
        const c = `${input.duration} minutes`;
        if (!next.constraints.includes(c)) next.constraints = [...next.constraints, c];
      }
      if (typeof input.constraints === "string" && input.constraints.trim()) {
        const parts = input.constraints.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
        const newConstraints = parts.filter((p: string) => !next.constraints.includes(p));
        if (newConstraints.length > 0) next.constraints = [...next.constraints, ...newConstraints];
      }

      // Tool-specific: members from load_roster
      if (Array.isArray(input.members)) {
        const names = input.members
          .map((m: unknown) => {
            if (typeof m === "string") return m;
            if (typeof m === "object" && m !== null && "name" in m && typeof (m as Record<string, unknown>).name === "string") {
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
  });
}, []);
```

This approach:
- Automatically handles all current and future `mcp__pedagogy__*` tools
- Extracts `domain` and `groupName` from any tool that passes them (13 of 20 unmapped tools do)
- Falls through gracefully for tools without these parameters
- Keeps tool-specific logic (constraints parsing, member extraction) without per-tool cases

### For `TOOL_META` and `STAGE_LABELS`

Add a fallback that generates a label from the tool name:

```typescript
function getToolLabel(toolName: string): string {
  const meta = TOOL_META[toolName];
  if (meta) return meta.label;

  // Fallback: strip prefix and humanize
  const stripped = toolName.replace("mcp__pedagogy__", "");
  return stripped
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
// "mcp__pedagogy__simulate_lesson" → "Simulate Lesson"
// "mcp__pedagogy__analyze_affective_context" → "Analyze Affective Context"
```

This provides reasonable labels for unmapped tools without requiring per-tool entries.

## Current state: server-side context extraction

Context extraction was moved server-side in `src/server/context-extractor.ts` (commit c4a0c52). The server now accumulates context on the session and emits `session_context` WebSocket messages. The client handles these messages and updates the sidebar directly, with the old client-side `extractContext` kept as a fallback.

However, `context-extractor.ts` still uses the same 8-tool switch statement. The generic pattern-based approach above should be applied there instead — it's the canonical extraction location now.

## Result-based extraction

The current server-side extractor reads tool **inputs** — what the agent asked for. It does not read tool **results** — what actually happened. This means:

1. **Failed calls show as successful context.** If `load_roster` is called with `groupName: "tuesday-cohort"` but the group doesn't exist, the sidebar still shows "Group: tuesday-cohort" because the extractor read the input, not the error result.

2. **No access to computed data.** Tool results contain richer information than inputs. For example, `query_group` returns skill distributions, common gaps, and pairing suggestions. `load_roster` returns the actual member list with names. None of this reaches the sidebar because the extractor only reads input parameters.

### What to do

The Agent SDK emits `tool_result` messages after each tool execution. The server can inspect these to:

1. **Skip failed calls** — if the tool result indicates an error, don't update context from that call's inputs.
2. **Extract from results** — pull confirmed data from successful results (actual member names returned by `load_roster`, actual skill counts from `query_group`, etc.). This replaces optimistic input-based extraction with grounded result-based extraction.

The `extractSessionContext` function in `context-extractor.ts` should accept an optional `results` parameter alongside `toolUses`. When results are available, prefer them over inputs. When they're not (fallback path), continue using inputs as today.

## Priority

All four items are actionable now:

1. **Generic extraction in `context-extractor.ts`** — replace the 8-tool switch with the pattern-based approach so all 28 tools contribute context automatically
2. **Result-based extraction** — hook into tool results in the server agent loop so failed calls don't pollute context and successful calls provide richer data
3. **TOOL_META fallback labels** — add the `getToolLabel` humanizer so unmapped tools get readable names in tool result cards
4. **STAGE_LABELS fallback** — add the same humanizer for progress indicators
