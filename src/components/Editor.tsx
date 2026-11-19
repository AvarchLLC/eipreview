import { useEffect, useMemo, useState } from "react";
import {
  Bold,
  ChevronDown,
  Code,
  Info,
  Italic,
  Link,
  List,
  Sparkles,
} from "lucide-react";
import type { ProposalData, ProposalField, RepoKind, ValidationMessage } from "../lib/types";
import { PREAMBLE_FIELDS, SECTION_FIELDS, RFC_2119_BOILERPLATE } from "../data/template";
import { cn } from "../lib/cn";

interface Props {
  data: ProposalData;
  repo: RepoKind;
  onChange: (key: ProposalField, value: string) => void;
  issuesByField: Record<string, ValidationMessage[]>;
  highlightTarget?: string | null;
}

function dot(level: "error" | "warning" | "info") {
  return level === "error" ? "bg-error" : level === "warning" ? "bg-warning" : "bg-info";
}

/** Form keys are camelCase; preamble message fields are kebab-case. */
function toKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

export function Editor({ data, repo, onChange, issuesByField, highlightTarget }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    abstract: true,
    specification: true,
    motivation: false,
    rationale: false,
    backwardsCompatibility: false,
    testCases: false,
    referenceImplementation: false,
    securityConsiderations: false,
  });

  const [preambleOpen, setPreambleOpen] = useState(true);

  // Synchronize scrolling and auto-expanding when user clicks a validation issue
  useEffect(() => {
    if (!highlightTarget) return;

    const sectionKeys = [
      "abstract",
      "motivation",
      "specification",
      "rationale",
      "backwardsCompatibility",
      "testCases",
      "referenceImplementation",
      "securityConsiderations",
    ];

    if (sectionKeys.includes(highlightTarget)) {
      setOpen((prev) => ({ ...prev, [highlightTarget]: true }));
    } else {
      setPreambleOpen(true);
    }

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`editor-${highlightTarget}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const interactive = el.querySelector("input, select, textarea") as HTMLElement | null;
        if (interactive) {
          interactive.focus();
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [highlightTarget]);

  const preamble = useMemo(
    () =>
      PREAMBLE_FIELDS.filter((f) => {
        if (f.key === "lastCallDeadline") return data.status === "Last Call";
        if (f.key === "withdrawalReason") return data.status === "Withdrawn";
        if (f.key === "category") return data.type === "Standards Track";
        return true;
      }),
    [data.status, data.type]
  );

  const sevOf = (key: string) => {
    const issues = issuesByField[toKebab(key)] ?? issuesByField[key.toLowerCase()] ?? [];
    if (issues.some((i) => i.level === "error")) return "error" as const;
    if (issues.some((i) => i.level === "warning")) return "warning" as const;
    if (issues.length) return "info" as const;
    return null;
  };

  /** Helper to wrap or append formatting to a section textarea */
  const insertFormatting = (key: ProposalField, prefix: string, suffix: string = "") => {
    const cur = data[key] || "";
    onChange(key, cur ? `${cur}\n${prefix}${suffix}` : `${prefix}${suffix}`);
  };

  const statusTone =
    data.status === "Final"
      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60"
      : data.status === "Review"
      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60"
      : data.status === "Last Call"
      ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60"
      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-border";

  const repoTone =
    repo === "erc"
      ? "text-violet-600 dark:text-violet-400"
      : repo === "rip"
      ? "text-sky-600 dark:text-sky-400"
      : "text-indigo-600 dark:text-indigo-400";

  return (
    <div className="space-y-4">
      {/* Document Header Breadcrumb & Status */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className={cn("font-semibold uppercase tracking-wider", repoTone)}>
            {repo.toUpperCase()} Draft
          </span>
          <span>/</span>
          <span className="font-mono text-fg font-medium">
            {data.eip && /^\d+$/.test(data.eip) ? `${repo.toUpperCase()}-${data.eip}` : "Untitled proposal"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-medium shadow-2xs", statusTone)}>
            {data.status || "Draft"}
          </span>
          {data.type && (
            <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted shadow-2xs">
              {data.type}
            </span>
          )}
        </div>
      </div>

      {/* Preamble Card */}
      <section className="rounded-xl border border-border bg-card shadow-xs">
        <div
          onClick={() => setPreambleOpen(!preambleOpen)}
          className="flex cursor-pointer items-center justify-between px-4 py-3 select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 rounded-t-xl"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Proposal Metadata</h2>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-muted transition-transform duration-200", !preambleOpen && "-rotate-90")}
          />
        </div>

        {preambleOpen && (
          <div className="border-t border-border p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
              {preamble.map((f) => {
                const sev = sevOf(f.key);
                const isHighlighted = highlightTarget === f.key;
                const counter =
                  f.key === "title"
                    ? `${data.title.length}/44`
                    : f.key === "description"
                    ? `${data.description.length}/140`
                    : null;
                return (
                  <div
                    key={f.key}
                    id={`editor-${f.key}`}
                    className={cn(
                      "p-1.5 rounded-lg transition-all duration-300",
                      f.wide && "sm:col-span-2",
                      isHighlighted && "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          sev === "error"
                            ? "text-error"
                            : sev === "warning"
                            ? "text-warning"
                            : "text-muted"
                        )}
                      >
                        <span>{f.label}</span>
                        {f.optional && <span className="text-[10px] text-muted/60 font-normal">optional</span>}
                        <span className="group relative inline-flex">
                          <Info className="h-3 w-3 cursor-help text-muted/50 hover:text-muted transition-colors" />
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden w-64 -translate-x-1/2 rounded-lg border border-border bg-elevated p-2 text-[11px] font-normal leading-normal text-body shadow-md group-hover:block">
                            {f.hint}
                          </span>
                        </span>
                        {sev && <span className={cn("h-1.5 w-1.5 rounded-full", dot(sev))} />}
                      </label>
                      {counter && (
                        <span
                          className={cn(
                            "font-mono text-[10px]",
                            sev === "error"
                              ? "text-error font-semibold"
                              : f.key === "title" && data.title.length > 38
                              ? "text-amber-500 font-medium"
                              : f.key === "description" && data.description.length > 125
                              ? "text-amber-500 font-medium"
                              : "text-muted/60"
                          )}
                        >
                          {counter}
                        </span>
                      )}
                    </div>
                    {f.kind === "select" ? (
                      <div className="relative">
                        <select
                          value={data[f.key]}
                          onChange={(e) => onChange(f.key, e.target.value)}
                          className="w-full appearance-none rounded-lg border border-border bg-bg py-2 pl-3 pr-9 text-xs text-fg outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                        >
                          {(f.options?.(repo) ?? []).map((o) => (
                            <option key={o} value={o}>
                              {o || "Select…"}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                      </div>
                    ) : (
                      <input
                        type={f.kind === "date" ? "date" : "text"}
                        value={data[f.key]}
                        onChange={(e) => onChange(f.key, e.target.value)}
                        placeholder={f.hint}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-fg placeholder:text-muted/50 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Proposal Sections (Clean headers without bulky section badges) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Proposal Body Sections</h2>
          <span className="text-[11px] text-muted">Markdown enabled</span>
        </div>

        <div className="space-y-2.5">
          {SECTION_FIELDS.map((s) => {
            const isOpen = open[s.key] ?? false;
            const sev = sevOf(s.label);
            const empty = !data[s.key]?.trim();
            const isHighlighted = highlightTarget === s.key;

            return (
              <div
                key={s.key}
                id={`editor-${s.key}`}
                className={cn(
                  "overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all duration-300",
                  isOpen && "ring-1 ring-border/80",
                  isHighlighted && "ring-2 ring-indigo-500 shadow-md shadow-indigo-500/10"
                )}
              >
                {/* Section Header Button */}
                <button
                  type="button"
                  onClick={() => setOpen((p) => ({ ...p, [s.key]: !p[s.key] }))}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-fg">{s.label}</span>
                    {s.optional && (
                      <span className="text-[10px] text-muted/60 font-normal">optional</span>
                    )}
                    {sev && <span className={cn("h-1.5 w-1.5 rounded-full", dot(sev))} />}
                    {!empty && !sev && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Section has content" />
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Section Editor Area */}
                {isOpen && (
                  <div className="border-t border-border bg-bg p-3 sm:p-4 space-y-2.5">
                    {/* Header info & inline formatting toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] leading-relaxed text-muted">{s.hint}</p>

                      {/* Clean formatting pill bar */}
                      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.key, "**bold text**")}
                          title="Bold"
                          className="rounded p-1 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Bold className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.key, "*italic text*")}
                          title="Italic"
                          className="rounded p-1 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Italic className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.key, "`inline code`")}
                          title="Inline code"
                          className="rounded p-1 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Code className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.key, "- List item")}
                          title="Bullet list"
                          className="rounded p-1 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <List className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting(s.key, "[link text](https://example.com)")}
                          title="Link"
                          className="rounded p-1 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Link className="h-3 w-3" />
                        </button>

                        {s.key === "specification" && (
                          <button
                            type="button"
                            onClick={() => {
                              const cur = data.specification.trim();
                              if (cur.includes("RFC 2119") && cur.includes("RFC 8174")) return;
                              onChange("specification", cur ? `${RFC_2119_BOILERPLATE}\n\n${cur}` : RFC_2119_BOILERPLATE);
                            }}
                            className="ml-1 inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 px-2 py-0.5 text-[10px] font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                            title="Insert RFC 2119 normative language boilerplate"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-indigo-500" /> RFC 2119
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      value={data[s.key]}
                      onChange={(e) => onChange(s.key, e.target.value)}
                      rows={s.key === "specification" || s.key === "abstract" ? 8 : 4}
                      placeholder={`Write the ${s.label} section in Markdown…`}
                      className="w-full resize-y rounded-lg border border-border bg-card p-3 font-mono text-xs leading-relaxed text-fg placeholder:text-muted/40 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted">
            A standard Copyright section (<code className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">CC0 1.0</code>) is automatically included in the proposal output.
          </div>
        </div>
      </section>
    </div>
  );
}
