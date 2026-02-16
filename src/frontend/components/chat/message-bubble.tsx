"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant";
  text: string;
  timestamp?: Date;
}

const markdownComponents: Components = {
  // Tables — role="region" + tabIndex allows keyboard scrolling of overflow content
  table: ({ children }) => (
    <div className="overflow-x-auto my-2" role="region" aria-label="Data table" tabIndex={0}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-surface-3 text-text-secondary">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-border-subtle even:bg-surface-3/50">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold border border-border-subtle" scope="col">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border border-border-subtle">{children}</td>
  ),

  // Code blocks
  pre: ({ children }) => <pre className="not-prose">{children}</pre>,
  code: ({ className, children, ...props }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <code className={`block font-mono text-[0.85em] ${className ?? ""}`} {...props}>
          {children}
        </code>
      );
    }
    return <code {...props}>{children}</code>;
  },

  // Links — opens external links in new tab with screen reader hint
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-muted underline underline-offset-2 hover:text-accent"
    >
      {children}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  ),

  // Lists
  ul: ({ children }) => <ul className="list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal">{children}</ol>,

  // Horizontal rule
  hr: () => <hr className="my-3 border-border-subtle" />,
};

export default memo(function MessageBubble({ role, text, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";
  const senderLabel = isUser ? "You" : "Assistant";

  return (
    <div
      className={`flex w-full animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[90%] md:max-w-[85%] px-4 py-3 ${
          isUser
            ? "bg-surface-1 rounded-2xl rounded-br-md text-text-primary"
            : "border-l-[3px] border-accent/60 pl-4 text-text-primary"
        }`}
      >
        {/* Screen reader only sender identification */}
        <span className="sr-only">{senderLabel}: </span>
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="prose-chat text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
        {timestamp && (
          <p className="text-xs mt-1.5 text-text-tertiary" aria-label={`Sent at ${timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}>
            <time dateTime={timestamp.toISOString()}>
              {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </time>
          </p>
        )}
      </div>
    </div>
  );
})
