"use client";

import { useState, useCallback } from "react";

interface QuestionOption {
  label: string;
  description?: string;
}

interface Question {
  question: string;
  header?: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}

interface AskUserQuestionCardProps {
  questions: Question[];
  onSubmit: (response: string) => void;
}

export default function AskUserQuestionCard({
  questions,
  onSubmit,
}: AskUserQuestionCardProps) {
  // Track selections per question: Map<questionIndex, Set<optionIndex>>
  const [selections, setSelections] = useState<Map<number, Set<number>>>(
    () => new Map(questions.map((_, i) => [i, new Set<number>()]))
  );
  const [submitted, setSubmitted] = useState(false);

  const toggleOption = useCallback(
    (questionIdx: number, optionIdx: number, multiSelect: boolean) => {
      if (submitted) return;

      setSelections((prev) => {
        const next = new Map(prev);
        const current = new Set(next.get(questionIdx) || []);

        if (multiSelect) {
          if (current.has(optionIdx)) {
            current.delete(optionIdx);
          } else {
            current.add(optionIdx);
          }
        } else {
          // Single select — replace
          current.clear();
          current.add(optionIdx);
        }

        next.set(questionIdx, current);
        return next;
      });
    },
    [submitted]
  );

  const allAnswered = questions.every((_, i) => {
    const sel = selections.get(i);
    return sel && sel.size > 0;
  });

  const handleSubmit = useCallback(() => {
    if (!allAnswered || submitted) return;

    // Build a natural language response
    const parts: string[] = [];
    questions.forEach((q, i) => {
      const sel = selections.get(i);
      if (!sel || sel.size === 0) return;

      const selectedLabels = Array.from(sel).map(
        (optIdx) => q.options[optIdx].label
      );
      const prefix = q.header || `Question ${i + 1}`;
      parts.push(`${prefix}: ${selectedLabels.join(", ")}`);
    });

    setSubmitted(true);
    onSubmit(parts.join(". "));
  }, [allAnswered, submitted, questions, selections, onSubmit]);

  return (
    <div className="animate-fade-in space-y-5 rounded-xl border border-accent/30 bg-accent/5 p-4 md:p-5">
      {questions.map((q, qIdx) => {
        const selected = selections.get(qIdx) || new Set<number>();
        const isMulti = q.multiSelect === true;

        return (
          <div key={qIdx} className="space-y-3">
            {/* Header badge + question text */}
            <div className="space-y-1.5">
              {q.header && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/20">
                  {q.header}
                </span>
              )}
              <p className="text-sm font-medium text-text-primary leading-relaxed">
                {q.question}
              </p>
              {isMulti && (
                <p className="text-xs text-text-tertiary">
                  Select all that apply
                </p>
              )}
            </div>

            {/* Option cards */}
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => {
                const isSelected = selected.has(optIdx);

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={submitted}
                    onClick={() => toggleOption(qIdx, optIdx, isMulti)}
                    className={`
                      w-full text-left rounded-lg border p-3 transition-all
                      ${
                        submitted
                          ? isSelected
                            ? "border-accent bg-accent/10 opacity-100"
                            : "border-border-subtle bg-surface-1 opacity-40"
                          : isSelected
                            ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                            : "border-border-subtle bg-surface-1 hover:border-border hover:bg-surface-2"
                      }
                      ${submitted ? "cursor-default" : "cursor-pointer"}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Radio / checkbox indicator */}
                      <div className="mt-0.5 flex-shrink-0">
                        {isMulti ? (
                          <div
                            className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                              ${
                                isSelected
                                  ? "border-accent bg-accent"
                                  : "border-border"
                              }
                            `}
                          >
                            {isSelected && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`
                              w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                              ${
                                isSelected
                                  ? "border-accent"
                                  : "border-border"
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-accent" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Label + description */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            isSelected
                              ? "text-accent"
                              : "text-text-primary"
                          }`}
                        >
                          {opt.label}
                        </p>
                        {opt.description && (
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Submit / confirmed state */}
      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={`
            w-full py-2.5 rounded-lg text-sm font-medium transition-all
            ${
              allAnswered
                ? "bg-accent text-white hover:bg-accent-muted cursor-pointer"
                : "bg-surface-2 text-text-tertiary cursor-not-allowed"
            }
          `}
        >
          Submit
        </button>
      ) : (
        <div className="flex items-center gap-2 py-1.5">
          <svg
            className="w-4 h-4 text-accent flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-xs text-text-secondary">
            Response submitted
          </span>
        </div>
      )}
    </div>
  );
}
