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
  { key: "error", title: "Errors", blurb: "These block a PR, CI will reject them." },
  { key: "warning", title: "Warnings", blurb: "Strongly recommended fixes." },
  { key: "info", title: "Suggestions", blurb: "Optional polish." },
] as const;

export function ValidationDialog({ messages, repo, context, onJump, onClose, onOpenGuide }: Props) {
  const counts = {
    error: messages.filter((m) => m.level === "error").length,
    warning: messages.filter((m) => m.level === "warning").length,
    info: messages.filter((m) => m.level === "info").length,
  };
  const clean = messages.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            {counts.error > 0 ? (
              <>
                <AlertCircle className="h-5 w-5 shrink-0 text-error" />
                <h3 className="truncate text-base font-semibold text-error">Validation failed</h3>
              </>
            ) : messages.length > 0 ? (
              <>
                <Info className="h-5 w-5 shrink-0 text-warning" />
                <h3 className="truncate text-base font-semibold text-warning">Passed with advisories</h3>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <h3 className="truncate text-base font-semibold text-primary">All checks passed</h3>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button onClick={onOpenGuide} title="How validation works" className="rounded-md p-1.5 text-muted transition-colors hover:bg-card hover:text-primary">
              <BookOpen className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-md p-1.5 text-muted transition-colors hover:bg-card hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/40 px-5 py-2.5 text-[11px]">
          <Pill n={counts.error} label="error" tone="error" />
          <Pill n={counts.warning} label="warning" tone="warning" />
          <Pill n={counts.info} label="suggestion" tone="info" />
          <span className="ml-auto truncate font-mono text-muted">
            {repo.toUpperCase()} rules{context ? ` · ${context}` : ""}
          </span>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {clean ? (
            <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary-soft p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
              <p className="text-sm font-semibold text-primary">Ready for submission</p>
              <p className="text-xs text-muted">
                Passes the {repo.toUpperCase()} formatting and editorial rules with no errors, warnings, or suggestions.
              </p>
            </div>
          ) : (
            GROUPS.map((group) => {
              const items = messages.filter((m) => m.level === group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key} className="space-y-2">
                  <p
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider",
                      group.key === "error" ? "text-error" : group.key === "warning" ? "text-warning" : "text-info"
                    )}
                  >
                    {group.title} ({items.length})
                  </p>
                  {items.map((it, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border p-3",
                        it.level === "error" ? "border-error/20 bg-error-soft" : it.level === "warning" ? "border-warning/20 bg-warning-soft" : "border-info/20 bg-info-soft"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        {it.line ? (
                          <button
                            onClick={() => onJump(it.line)}
                            title={`Jump to line ${it.line}`}
                            className={cn(
                              "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                              it.level === "error" ? "border-error/30 text-error hover:bg-error/10" : it.level === "warning" ? "border-warning/30 text-warning hover:bg-warning/10" : "border-info/30 text-info hover:bg-info/10"
                            )}
                          >
                            L{it.line}
                          </button>
                        ) : (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted/40" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-fg">{it.message}</p>
                            <span
                              className={cn(
                                "shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                                it.category === "ci" ? "border-border bg-card text-muted" : "border-primary/30 bg-primary-soft text-primary"
                              )}
                              title={it.category === "ci" ? "A check CI enforces" : "EIPsInsight authoring guidance"}
                            >
                              {it.category === "ci" ? "CI" : "guide"}
                            </span>
                          </div>
                          {it.section && <p className="mt-0.5 text-[11px] text-muted">{it.section}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-card/40 px-5 py-3">
          <button onClick={onOpenGuide} className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-primary">
            <Info className="h-3.5 w-3.5" /> How validation works
          </button>
          <button onClick={onClose} className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-fg transition-colors hover:bg-card/70">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ n, label, tone }: { n: number; label: string; tone: "error" | "warning" | "info" }) {
  const on = n > 0;
  const toneCls = tone === "error" ? "bg-error/10 text-error" : tone === "warning" ? "bg-warning/10 text-warning" : "bg-info/10 text-info";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold", on ? toneCls : "bg-card text-muted")}>
      {n} {label}
      {n === 1 ? "" : "s"}
    </span>
  );
}
