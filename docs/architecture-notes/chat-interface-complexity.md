# ChatInterface Component Complexity

## Current state

`src/frontend/components/chat/chat-interface.tsx` is the main component for the `/teach` page. It currently manages 14 `useState` hooks, 7 `useRef` hooks, and 7 `useCallback`/`useEffect` blocks handling distinct concerns:

| Concern | State hooks | Refs | Callbacks/Effects |
|---------|:-----------:|:----:|:-----------------:|
| **Messages + WebSocket** | `messages`, `status`, `isThinking`, `activeTools`, `sessionId`, `thinkingStartedAt` | `clientRef`, `messagesEndRef`, `currentAssistantRef`, `streamingMessageIdRef` | `handleMessage`, `sendMessage`, `sendProgrammaticMessage`, connect/disconnect effect |
| **Text-to-speech** | `ttsEnabled` | `ttsQueueRef`, `ttsEnabledRef`, `speakRef`, `stopSpeakingRef` | TTS sync effects |
| **Speech-to-text** | (from `useSpeechRecognition` hook) | `prevSttStatusRef` | `handleStartRecording`, `handleStopRecording`, transcript-to-input effect |
| **Session context sidebar** | `sessionContext`, `sidebarCollapsed` | — | `extractContext`, `toggleSidebar` |
| **Text input** | `input` | `inputRef` | `handleKeyDown`, `handleInputChange`, auto-resize |

These are 5 independent concerns living in a single component. The component is ~620 lines.

## Why this matters

- **Cognitive load**: A developer modifying the sidebar extraction logic must scroll past 100+ lines of speech recognition and TTS state they don't need to understand.
- **Re-render scope**: Any state change in any concern triggers a re-render of the entire component tree. The `useCallback` wrappers mitigate this for child components, but the parent still re-renders.
- **Testing**: The component can't be unit tested per-concern. Testing sidebar context extraction requires mocking WebSocket, speech APIs, and the full message flow.
- **Reuse**: The WebSocket chat logic could power other chat interfaces (the assessment chat, the live teaching companion) but can't be extracted without untangling all 5 concerns.

## It's not a problem yet

The component works correctly and performs well. React handles 14 state hooks without issue. The concerns don't interfere with each other. This is a maintainability concern, not a correctness or performance bug.

The threshold to act is when one of these happens:
- A second chat interface needs the same WebSocket logic (the `/assess` page has its own HTTP-based chat, but if it moved to WebSocket, duplication would be immediate)
- The sidebar needs to be consumed by components outside `ChatInterface` (e.g., a breadcrumb showing the current domain)
- A new concern is added (e.g., collaborative editing, presence indicators) that would push the component past ~800 lines

## Proposed extraction: 3 custom hooks

### `useWebSocketChat()`

Encapsulates WebSocket connection, message handling, and message state.

```typescript
interface UseWebSocketChatReturn {
  messages: ChatMessage[];
  status: ConnectionStatus;
  isThinking: boolean;
  activeTools: ToolUse[];
  sessionId: string | null;
  thinkingStartedAt: number | null;
  sendMessage: (text: string) => void;
  // Internal: exposes a hook for other concerns to tap into messages
  onToolUses: (callback: (tools: ToolUse[]) => void) => void;
}

function useWebSocketChat(options?: { initialMessage?: string }): UseWebSocketChatReturn {
  // All message state, refs, WebSocket lifecycle, handleMessage
  // Calls registered onToolUses callbacks when tool uses arrive
}
```

### `useSpeechIO()`

Encapsulates both speech-to-text and text-to-speech state.

```typescript
interface UseSpeechIOReturn {
  // STT
  isRecording: boolean;
  sttStatus: string;
  sttError: string | null;
  interimTranscript: string;
  elapsedSeconds: number;
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  // TTS
  ttsEnabled: boolean;
  ttsSupported: boolean;
  isSpeaking: boolean;
  toggleTts: () => void;
  speakText: (text: string) => void;
}

function useSpeechIO(): UseSpeechIOReturn {
  // Wraps useSpeechRecognition + useSpeechSynthesis
  // Manages the transcript-to-input flow
  // Handles TTS queue and enabled state
}
```

### `useSessionContext()`

Encapsulates sidebar context extraction from tool uses.

```typescript
interface UseSessionContextReturn {
  context: SessionContext;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

function useSessionContext(tools: ToolUse[]): UseSessionContextReturn {
  // Watches tool uses and extracts context
  // Manages collapsed state
}
```

## After extraction

`ChatInterface` becomes a ~200-line layout component:

```typescript
export default function ChatInterface({ initialMessage }: ChatInterfaceProps) {
  const chat = useWebSocketChat({ initialMessage });
  const speech = useSpeechIO();
  const sidebar = useSessionContext(chat.activeTools);

  return (
    <div className="flex flex-col h-full">
      <Header status={chat.status} onToggleSidebar={sidebar.toggleSidebar} />
      <div className="flex-1 flex relative overflow-hidden">
        <ChatColumn
          messages={chat.messages}
          isThinking={chat.isThinking}
          activeTools={chat.activeTools}
          speech={speech}
          onSend={chat.sendMessage}
          sidebarCollapsed={sidebar.sidebarCollapsed}
        />
        <SessionContextSidebar
          context={sidebar.context}
          connectionStatus={chat.status}
          collapsed={sidebar.sidebarCollapsed}
          onToggle={sidebar.toggleSidebar}
        />
      </div>
    </div>
  );
}
```

## Files involved

| Current | After extraction |
|---------|-----------------|
| `components/chat/chat-interface.tsx` (~620 lines) | `components/chat/chat-interface.tsx` (~200 lines) |
| — | `hooks/use-websocket-chat.ts` (~250 lines) |
| — | `hooks/use-speech-io.ts` (~100 lines) |
| — | `hooks/use-session-context.ts` (~80 lines) |

The hooks would live in `src/frontend/hooks/` alongside the existing `use-speech-recognition.ts` and `use-speech-synthesis.ts`.

## Priority

Low. The component works and is stable. Extract when a concrete need arises (second consumer, new concern, or >800 lines).
