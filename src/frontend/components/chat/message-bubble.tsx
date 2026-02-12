"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant";
  text: string;
  timestamp?: Date;
}

const markdownComponents: Components = {
  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
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
    <th className="px-3 py-2 text-left font-semibold border border-border-subtle">
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

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-muted underline underline-offset-2 hover:text-accent"
    >
      {children}
    </a>
  ),

  // Lists
  ul: ({ children }) => <ul className="list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal">{children}</ol>,

  // Horizontal rule
  hr: () => <hr className="my-3 border-border-subtle" />,
};

export default function MessageBubble({ role, text, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-accent text-white rounded-br-md"
            : "bg-surface-2 text-text-primary rounded-bl-md"
        }`}
      >
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
          <p
            className={`text-xs mt-1.5 ${
              isUser ? "text-white/60" : "text-text-tertiary"
            }`}
          >
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}
