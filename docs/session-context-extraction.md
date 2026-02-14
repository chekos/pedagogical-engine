# Session Context Extraction: Client-side vs Server-side

## Current approach

The session context sidebar extracts context by reading tool **inputs** from WebSocket messages on the client. When the agent calls `mcp__pedagogy__load_roster` with `{ groupName: "tuesday-cohort", domain: "python-data-analysis" }`, the frontend's `extractContext` function reads those input parameters and updates the sidebar.

This happens in `src/frontend/components/chat/chat-interface.tsx` inside the `handleMessage` callback, triggered on every `"assistant"` message that contains tool uses.

## The problem

The client only sees tool **inputs** — what the agent *asked* for. It never sees tool **results** — what actually happened. This means:

1. **Failed calls show as successful context.** If `load_roster` is called with `groupName: "tuesday-cohort"` but the group doesn't exist, the sidebar still shows "Group: tuesday-cohort" because it read the input, not the error result.

2. **Assessment count can be wrong.** If `assess_learner` is called but the tool errors (learner not found, domain mismatch), the sidebar still adds the learner name to its list.

3. **Stale context on reconnection.** If the WebSocket disconnects and reconnects mid-session, the sidebar resets to empty because all context was accumulated from messages the client observed. The server has no memory of what context was established.

4. **No access to computed data.** Tool results often contain richer information than inputs. For example, `query_group` returns skill distributions, common gaps, and pairing suggestions — none of which the sidebar can display because it only reads the input `{ groupName, domain }`.

## Why it works for now

The sidebar is purely informational — it doesn't drive any control flow or API calls. Showing optimistic context (what was requested) rather than confirmed context (what succeeded) is low-risk when:

- Most tool calls succeed (the agent constructs valid inputs from conversation context)
- The displayed data is simple identifiers (group name, domain, skill IDs) not computed results
- Educators can see tool result cards in the chat itself for ground truth

## Server-side approach

The `SessionManager` in `src/server/sessions/manager.ts` already tracks sessions by ID with WebSocket connection mapping. A server-side approach would:

### 1. Accumulate context from successful tool results

After each tool execution in the agent loop, if the tool succeeded, extract context from the result:

```typescript
// In the agent message handler (src/server/index.ts)
if (toolResult.success) {
  session.context = {
    ...session.context,
    domain: toolResult.input.domain ?? session.context.domain,
    groupName: toolResult.input.groupName ?? session.context.groupName,
    // ... etc
  };
}
```

### 2. Emit context updates over WebSocket

Define a new message type that the server sends whenever context changes:

```typescript
// New WebSocket message type
interface SessionContextMessage {
  type: "session_context";
  context: {
    groupName: string | null;
    domain: string | null;
    constraints: string[];
    learnerNames: string[];
    skillsDiscussed: string[];
  };
}
```

The server sends this after every successful tool call that changes the context. The client simply replaces its local state with whatever the server says.

### 3. Replay context on reconnection

When a client reconnects to an existing session, the server immediately sends the current `session_context` message. The sidebar is populated without needing to replay the conversation.

## What changes on the client

The `extractContext` function in `chat-interface.tsx` would be replaced by a simple message handler:

```typescript
case "session_context":
  setSessionContext(msg.context);
  break;
```

No tool name mapping, no input parsing, no switch statement. The client becomes a pure display layer for server-provided context.

## Trade-offs

| | Client-side (current) | Server-side (proposed) |
|---|---|---|
| **Accuracy** | Optimistic — shows requested, not confirmed | Grounded — only shows successful results |
| **Reconnection** | Loses all context | Replays context immediately |
| **Coupling** | Frontend must know tool names and input shapes | Frontend receives a typed context object |
| **Latency** | Instant — reads from same WebSocket message | Same — server emits alongside tool results |
| **Complexity** | All in one `extractContext` function | Requires server-side session state + new message type |
| **Rich data** | Limited to tool input parameters | Can include computed data from tool results |

## Migration path

1. Add a `context` field to the `Session` type in `src/server/sessions/manager.ts`
2. After each successful tool execution in the agent loop (`src/server/index.ts`), update `session.context`
3. Emit `session_context` messages over the session's WebSocket connection
4. On client reconnection, send the current context as the first message after `session`
5. On the client, replace `extractContext` with a `session_context` message handler
6. Remove the tool name switch statement from `chat-interface.tsx`

The client-side `extractContext` can remain as a fallback during the transition — if the server doesn't send `session_context` messages, the client falls back to input parsing.
