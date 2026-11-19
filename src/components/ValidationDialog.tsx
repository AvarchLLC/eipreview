import { AlertCircle, BookOpen, CheckCircle2, Info, X } from "lucide-react";
import type { RepoKind, ValidationMessage } from "../lib/types";
import { cn } from "../lib/cn";

interface Props {
  messages: ValidationMessage[];
  repo: RepoKind;
  context: string;
  onJump: (line?: number) => void;
  onClose: () => void;
  onOpenGuide: () => void;
}

const GROUPS = [
  { key: "error", title: "Errors", blurb: "These block CI checks — required to pass." },
  { key: "warning", title: "Warnings", blurb: "Recommended improvements by editors." },
  { key: "info", title: "Suggestions", blurb: "Editorial style and quality tips." },
] as const;

export function ValidationDialog({ messages, repo, context, onJump, onClose, onOpenGuide }: Props) {
  const counts = {
    error: messages.filter((m) => m.level === "error").length,
    warning: messages.filter((m) => m.level === "warning").length,
    info: messages.filter((m) => m.level === "info").length,
  };
  const clean = messages.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Untitled UI Dialog style) */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            {counts.error > 0 ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error-soft text-error">
                <AlertCircle className="h-4 w-4" />
              </div>
            ) : messages.length > 0 ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
                <Info className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-soft text-success">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-fg">
                {counts.error > 0
                  ? "Validation Checks Failed"
                  : messages.length > 0
                  ? "Validation Passed with Advisories"
                  : "All Validation Checks Passed"}
              </h3>
              <p className="text-[11px] text-muted">
                {repo.toUpperCase()} editorial and CI rules{context ? ` · ${context}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenGuide}
              title="How validation works"
              className="rounded-lg p-1.5 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Summary Filter Strip */}
        <div className="flex items-center gap-2 border-b border-border bg-zinc-50/60 dark:bg-zinc-800/30 px-5 py-2 text-xs">
          <Pill n={counts.error} label="error" tone="error" />
          <Pill n={counts.warning} label="warning" tone="warning" />
          <Pill n={counts.info} label="suggestion" tone="info" />
          <span className="ml-auto font-mono text-[11px] text-muted">
            {messages.length} total finding{messages.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Body list */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {clean ? (
            <div className="rounded-xl border border-success/30 bg-success-soft p-6 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-success mb-2" />
              <p className="text-sm font-semibold text-fg">Ready for PR Submission</p>
              <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                Your draft conforms to all formatting, metadata, and editorial standards of the {repo.toUpperCase()} repository.
              </p>
            </div>
          ) : (
            GROUPS.map((group) => {
              const items = messages.filter((m) => m.level === group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {group.title} ({items.length})
                    </span>
                    <span className="text-[10px] text-muted">{group.blurb}</span>
                  </div>

                  <div className="space-y-1.5">
                    {items.map((it, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-lg border p-3 transition-colors",
                          it.level === "error"
                            ? "border-error/20 bg-error-soft/60"
                            : it.level === "warning"
                            ? "border-warning/20 bg-warning-soft/60"
                            : "border-info/20 bg-info-soft/60"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          {it.line ? (
                            <button
                              onClick={() => onJump(it.line)}
                              title={`Jump to line ${it.line}`}
                              className="mt-0.5 shrink-0 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-fg hover:border-fg/40 transition-colors"
                            >
                              L{it.line}
                            </button>
                          ) : (
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted/50" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-medium text-fg">{it.message}</p>
                              <span
                                className={cn(
                                  "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase",
                                  it.category === "ci"
                                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60"
                                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60"
                                )}
                                title={it.category === "ci" ? "Enforced by repository CI" : "Authoring style guideline"}
                              >
                                {it.category}
                              </span>
                            </div>
                            {it.section && (
                              <p className="mt-1 text-[11px] text-muted font-mono">{it.section}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-zinc-50/50 dark:bg-zinc-800/30 px-5 py-3">
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
          >
            <Info className="h-3.5 w-3.5" /> Rule details & workflow
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-fg shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ n, label, tone }: { n: number; label: string; tone: "error" | "warning" | "info" }) {
  const on = n > 0;
  const toneCls =
    tone === "error"
      ? "bg-error-soft text-error border border-error/20"
      : tone === "warning"
      ? "bg-warning-soft text-warning border border-warning/20"
      : "bg-info-soft text-info border border-info/20";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
        on ? toneCls : "bg-card border border-border text-muted"
      )}
    >
      {n} {label}
      {n === 1 ? "" : "s"}
    </span>
  );
}
