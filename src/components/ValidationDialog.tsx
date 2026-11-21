import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  FileCode,
  Info,
  ListTree,
  X,
} from "lucide-react";
import type { RepoKind, ValidationMessage } from "../lib/types";
import { formatReviewComment } from "../lib/formatReviewComment";
import { cn } from "../lib/cn";

interface Props {
  messages: ValidationMessage[];
  repo: RepoKind;
  context: string;
  prNumber?: number | string;
  filename?: string;
  eipNumber?: string;
  onJump: (item: ValidationMessage) => void;
  onClose: () => void;
  onOpenGuide: () => void;
}

const GROUPS = [
  { key: "error", title: "Errors", blurb: "These block CI checks — required to pass." },
  { key: "warning", title: "Warnings", blurb: "Recommended improvements by editors." },
  { key: "info", title: "Suggestions", blurb: "Editorial style and quality tips." },
] as const;

export function ValidationDialog({
  messages,
  repo,
  context,
  prNumber,
  filename,
  eipNumber,
  onJump,
  onClose,
  onOpenGuide,
}: Props) {
  const [activeTab, setActiveTab] = useState<"findings" | "markdown">("findings");
  const [copied, setCopied] = useState(false);

  const counts = {
    error: messages.filter((m) => m.level === "error").length,
    warning: messages.filter((m) => m.level === "warning").length,
    info: messages.filter((m) => m.level === "info").length,
  };
  const clean = messages.length === 0;

  // Generate GitHub PR review comment
  const reviewMarkdown = useMemo(() => {
    return formatReviewComment({
      messages,
      repo,
      context,
      prNumber,
      filename,
      eipNumber,
    });
  }, [messages, repo, context, prNumber, filename, eipNumber]);

  const handleCopyComment = async () => {
    try {
      await navigator.clipboard.writeText(reviewMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = reviewMarkdown;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
              className="rounded-lg p-1.5 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <BookOpen className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Status Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-zinc-50/60 dark:bg-zinc-800/30 px-5 py-2 text-xs">
          <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("findings")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                activeTab === "findings"
                  ? "bg-card text-fg shadow-xs font-semibold"
                  : "text-muted hover:text-fg"
              )}
            >
              <ListTree className="h-3.5 w-3.5" />
              <span>Findings ({messages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("markdown")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                activeTab === "markdown"
                  ? "bg-card text-fg shadow-xs font-semibold"
                  : "text-muted hover:text-fg"
              )}
            >
              <FileCode className="h-3.5 w-3.5 text-indigo-500" />
              <span>GitHub Review Comment</span>
            </button>
          </div>

          {activeTab === "findings" ? (
            <div className="flex items-center gap-1.5">
              <Pill n={counts.error} label="error" tone="error" />
              <Pill n={counts.warning} label="warning" tone="warning" />
              <Pill n={counts.info} label="suggestion" tone="info" />
            </div>
          ) : (
            <button
              onClick={handleCopyComment}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Copied!" : "Copy markdown"}</span>
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {activeTab === "markdown" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Formatted GitHub Markdown ready to paste into PR reviews:</span>
                <span className="font-mono text-[11px]">{reviewMarkdown.length} chars</span>
              </div>
              <div className="relative rounded-xl border border-border bg-zinc-950 p-4 font-mono text-xs text-zinc-200 overflow-x-auto shadow-inner max-h-[380px]">
                <pre className="whitespace-pre-wrap leading-relaxed select-all">{reviewMarkdown}</pre>
              </div>
            </div>
          ) : clean ? (
            <div className="rounded-xl border border-success/30 bg-success-soft p-6 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-success mb-2" />
              <p className="text-sm font-semibold text-fg">Ready for PR Submission</p>
              <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                Your proposal conforms to all formatting, metadata, and editorial standards of the {repo.toUpperCase()} repository.
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
                        onClick={() => onJump(it)}
                        className={cn(
                          "group cursor-pointer rounded-xl border p-3 transition-all hover:scale-[1.005] hover:shadow-sm",
                          it.level === "error"
                            ? "border-error/25 bg-error-soft/60 hover:border-error/60"
                            : it.level === "warning"
                            ? "border-warning/25 bg-warning-soft/60 hover:border-warning/60"
                            : "border-info/25 bg-info-soft/60 hover:border-info/60"
                        )}
                        title="Click to jump to this issue in the editor & markdown"
                      >
                        <div className="flex items-start gap-2.5">
                          {it.line ? (
                            <span className="mt-0.5 shrink-0 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-fg group-hover:border-fg/40 transition-colors">
                              L{it.line}
                            </span>
                          ) : (
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted/50" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-medium text-fg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {it.message}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={cn(
                                    "rounded border px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase",
                                    it.category === "ci"
                                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60"
                                      : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60"
                                  )}
                                  title={it.category === "ci" ? "Enforced by repository CI" : "Authoring style guideline"}
                                >
                                  {it.category}
                                </span>
                                <ArrowUpRight className="h-3 w-3 text-muted group-hover:text-fg group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                              </div>
                            </div>
                            {(it.section || it.field) && (
                              <p className="mt-1 text-[11px] text-muted font-mono flex items-center gap-1.5">
                                <span>Section: {it.section || it.field}</span>
                                <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  · Click to jump
                                </span>
                              </p>
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
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <Info className="h-3.5 w-3.5" /> Rule details & workflow
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyComment}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all duration-150 active:scale-95 cursor-pointer",
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white"
              )}
              title="Copy formatted GitHub Markdown review comment to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Copied Review Comment!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 opacity-90" />
                  <span>Copy Review Comment</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-fg shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
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
