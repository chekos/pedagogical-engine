# Frontend Tool Coverage

The backend registers 28 MCP tools in `src/server/tools/index.ts`. All tools now have full frontend coverage through a combination of explicit mappings (8 core tools) and generic fallback handlers (remaining 20 tools).

## Architecture

### Three coverage layers

| Layer | File | Approach |
|-------|------|----------|
| **TOOL_META** | `tool-result.tsx` | Explicit map for 8 core tools, `humanizeToolName()` + `categorizeTool()` fallback for all others |
| **STAGE_LABELS** | `progress-indicator.tsx` | Explicit map for 8 core tools, `humanizeStageLabel()` gerund-form fallback for all others |
| **Context extraction** | `context-extractor.ts` (server) + `chat-interface.tsx` (client fallback) | Generic parameter-based extraction — any `mcp__pedagogy__*` tool with `domain`, `groupName`, `skillId`, etc. contributes context automatically |

### Result-based error correction

The server uses Agent SDK `PostToolUseFailure` hooks to correct optimistic context extraction. When a tool call fails (e.g., `load_roster` for a non-existent group), the hook re-extracts context excluding the failed tool and emits a corrected `session_context` WebSocket message.

**Timing flow:**
1. Assistant message with `tool_use` blocks → optimistic extraction → sidebar updates instantly
2. SDK executes tool → if it fails → `PostToolUseFailure` hook fires
3. Hook re-extracts without the failed tool → corrected sidebar update
4. Result message → clear per-turn state

## Explicit mappings (8 core tools)

These tools have hand-tuned labels, progress indicators, and rich card rendering:

| Tool | Label | Card rendering |
|------|-------|---------------|
| `load_roster` | Loading Roster | Group summary card |
| `query_skill_graph` | Querying Skill Graph | Live dependency graph |
| `assess_learner` | Assessing Learner | Assessment status with graph |
| `generate_assessment_link` | Creating Assessment Link | Assessment status card |
| `check_assessment_status` | Checking Assessment Status | - |
| `query_group` | Analyzing Group | Full group dashboard |
| `audit_prerequisites` | Auditing Prerequisites | - |
| `compose_lesson_plan` | Composing Lesson Plan | Lesson plan view |

## Generic fallback coverage (20 tools)

All remaining tools get automatic coverage through three fallback mechanisms:

### 1. Tool result cards (`humanizeToolName` + `categorizeTool`)

Strips `mcp__pedagogy__` prefix and converts `snake_case` to Title Case. Assigns Bloom-level border colors by verb prefix:

| Verb prefix | Bloom color | Examples |
|------------|-------------|----------|
| `load_`, `query_`, `check_` | understand | Load Educator Profile, Query Teaching Wisdom |
| `analyze_` | analyze | Analyze Tensions, Analyze Affective Context |
| `compose_`, `create_`, `store_`, `update_`, `add_` | create | Create Domain, Store Reasoning Traces |
| `simulate_`, `audit_`, `explain_` | evaluate | Simulate Lesson, Explain Pedagogical Reasoning |
| `process_`, `advance_`, `report_`, `assess_`, `generate_` | apply | Process Debrief, Advance Curriculum |

### 2. Progress indicator labels (`humanizeStageLabel`)

Converts verb to gerund form using a lookup table:

| Tool | Progress label |
|------|---------------|
| `simulate_lesson` | Simulating lesson |
| `analyze_tensions` | Analyzing tensions |
| `process_debrief` | Processing debrief |
| `store_reasoning_traces` | Storing reasoning traces |
| `load_educator_profile` | Loading educator profile |
| `analyze_cross_domain_transfer` | Analyzing cross domain transfer |
| `explain_pedagogical_reasoning` | Explaining pedagogical reasoning |

### 3. Context extraction (generic parameter-based)

Any `mcp__pedagogy__*` tool automatically contributes to session context if it passes:

| Parameter | Context field | Tools that use it |
|-----------|--------------|-------------------|
| `domain` | Domain | 13+ tools |
| `groupName` | Group | 8+ tools |
| `skillId` / `skillIds` | Skills discussed | 3+ tools |
| `learnerId` | Learner names | 2+ tools |
| `duration` | Constraints | 2+ tools |
| `constraints` | Constraints | 2+ tools |
| `members` | Learner names | 1 tool (load_roster) |

Future tools automatically get context extraction if they use these parameter names.

## Implementation details

### Files modified

| File | Change |
|------|--------|
| `src/server/context-extractor.ts` | Replaced 8-tool switch with generic parameter-based extraction |
| `src/server/agent.ts` | Added `hooks` to `AgentQueryOptions`, pass-through to SDK `query()` |
| `src/server/index.ts` | Wired `PostToolUseFailure` hooks, per-turn state tracking, error-corrected context emission |
| `src/frontend/components/chat/tool-result.tsx` | Added `humanizeToolName()` + `categorizeTool()` fallbacks in `getToolMeta()` |
| `src/frontend/components/chat/progress-indicator.tsx` | Added `humanizeStageLabel()` fallback in `getStageLabel()` |
| `src/frontend/components/chat/chat-interface.tsx` | Replaced 8-tool switch with same generic pattern as server |
