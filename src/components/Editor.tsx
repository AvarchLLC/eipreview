import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  ChevronDown,
  Code,
  Info,
  Italic,
  Link,
  List,
  Search,
  Sparkles,
} from "lucide-react";
import type { ProposalData, ProposalField, RepoKind, ValidationMessage } from "../lib/types";
import { PREAMBLE_FIELDS, SECTION_FIELDS, RFC_2119_BOILERPLATE } from "../data/template";
import { cn } from "../lib/cn";

function getNormativeMatches(text: string) {
  if (!text) return [];
  const regex = /\b(MUST NOT|MUST|REQUIRED|SHALL NOT|SHALL|SHOULD NOT|SHOULD|NOT RECOMMENDED|RECOMMENDED|OPTIONAL|MAY)\b/g;
  const counts = new Map<string, number>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    counts.set(match[0], (counts.get(match[0]) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([kw, count]) => ({ kw, count }));
}

interface SectionTextareaProps {
  value: string;
  onChange: (val: string) => void;
  rows: number;
  placeholder?: string;
  isSpecification: boolean;
}

function SectionTextarea({
  value,
  onChange,
  rows,
  placeholder,
  isSpecification,
}: SectionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const syncScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const backdropTokens = useMemo(() => {
    if (!value) return null;
    const regex = /\b(MUST NOT|MUST|REQUIRED|SHALL NOT|SHALL|SHOULD NOT|SHOULD|NOT RECOMMENDED|RECOMMENDED|OPTIONAL|MAY)\b/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(value)) !== null) {
      if (match.index > lastIdx) {
        parts.push(value.slice(lastIdx, match.index));
      }
      const kw = match[0];
      parts.push(
        <mark
          key={match.index}
          className={cn(
            "rounded-xs font-bold ring-1 transition-all select-none",
            !isSpecification
              ? "bg-amber-300/80 dark:bg-amber-400/50 text-transparent ring-amber-500/70"
              : "bg-indigo-200/60 dark:bg-indigo-500/35 text-transparent ring-indigo-400/40"
          )}
        >
          {kw}
        </mark>
      );
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < value.length) {
      parts.push(value.slice(lastIdx));
    }
    return parts;
  }, [value, isSpecification]);

  return (
    <div className="relative">
      {/* Backdrop for keyword highlight styling */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed text-transparent border border-transparent select-none"
        style={{ wordBreak: "break-word" }}
      >
        {backdropTokens}
      </div>

      {/* Real editable textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        className="relative z-10 w-full resize-y bg-transparent p-3 font-mono text-xs leading-relaxed text-fg placeholder:text-muted/40 outline-none"
        style={{ wordBreak: "break-word" }}
      />
    </div>
  );
}

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
    }, 100);

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

  const getIssuesFor = (key: string) => {
    const k = key.toLowerCase();
    const kebab = toKebab(key).toLowerCase();
    const raw = [
      ...(issuesByField[key] ?? []),
      ...(issuesByField[k] ?? []),
      ...(issuesByField[kebab] ?? []),
    ];
    const seen = new Set<string>();
    return raw.filter((iss) => {
      if (seen.has(iss.message)) return false;
      seen.add(iss.message);
      return true;
    });
  };

  const sevOf = (key: string) => {
    const issues = getIssuesFor(key);
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

  /** Focus and select the next occurrence of a keyword in the section's textarea */
  const jumpToKeyword = (sectionKey: ProposalField, keyword: string) => {
    const el = document.getElementById(`editor-${sectionKey}`);
    const textarea = el?.querySelector("textarea");
    if (!textarea) return;

    const text = textarea.value;
    const currentPos = textarea.selectionEnd;
    const regex = new RegExp(`\\b${keyword}\\b`, "g");
    regex.lastIndex = currentPos >= text.length ? 0 : currentPos;

    let match = regex.exec(text);
    if (!match) {
      regex.lastIndex = 0;
      match = regex.exec(text);
    }

    if (match) {
      textarea.focus();
      textarea.setSelectionRange(match.index, match.index + match[0].length);
      const linesBefore = text.slice(0, match.index).split("\n").length;
      const lineHeight = 20;
      textarea.scrollTop = Math.max(0, (linesBefore - 2) * lineHeight);
    }
  };

  /** Convert all normative keywords in a section to lowercase (e.g. MUST -> must) */
  const lowercaseNormativeKeywords = (sectionKey: ProposalField) => {
    const text = data[sectionKey] || "";
    const updated = text.replace(
      /\b(MUST NOT|MUST|REQUIRED|SHALL NOT|SHALL|SHOULD NOT|SHOULD|NOT RECOMMENDED|RECOMMENDED|OPTIONAL|MAY)\b/g,
      (m) => m.toLowerCase()
    );
    onChange(sectionKey, updated);
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
                const fieldIssues = getIssuesFor(f.key);
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
                            ? "text-error font-semibold"
                            : sev === "warning"
                            ? "text-warning font-semibold"
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
                          className={cn(
                            "w-full appearance-none rounded-lg py-2 pl-3 pr-9 text-xs outline-none transition-all duration-200",
                            sev === "error"
                              ? "border-2 border-error bg-error-soft/30 dark:bg-error-soft/10 text-fg focus:border-error focus:ring-2 focus:ring-error/20"
                              : sev === "warning"
                              ? "border-2 border-warning bg-warning-soft/30 dark:bg-warning-soft/10 text-fg focus:border-warning focus:ring-2 focus:ring-warning/20"
                              : "border border-border bg-bg text-fg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20",
                            isHighlighted && "ring-2 ring-indigo-500 border-indigo-500 shadow-md shadow-indigo-500/20"
                          )}
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
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-xs outline-none transition-all duration-200",
                          sev === "error"
                            ? "border-2 border-error bg-error-soft/30 dark:bg-error-soft/10 text-fg focus:border-error focus:ring-2 focus:ring-error/20"
                            : sev === "warning"
                            ? "border-2 border-warning bg-warning-soft/30 dark:bg-warning-soft/10 text-fg focus:border-warning focus:ring-2 focus:ring-warning/20"
                            : "border border-border bg-bg text-fg placeholder:text-muted/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20",
                          isHighlighted && "ring-2 ring-indigo-500 border-indigo-500 shadow-md shadow-indigo-500/20"
                        )}
                      />
                    )}

                    {/* Inline Issue Messages for this field */}
                    {fieldIssues.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {fieldIssues.map((iss, idx) => (
                          <p
                            key={idx}
                            className={cn(
                              "text-[11px] leading-tight flex items-start gap-1 font-medium",
                              iss.level === "error"
                                ? "text-error"
                                : iss.level === "warning"
                                ? "text-warning"
                                : "text-info"
                            )}
                          >
                            <span className="font-bold">•</span>
                            <span>{iss.message}</span>
                          </p>
                        ))}
                      </div>
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
            const secSev = sevOf(s.key) ?? sevOf(s.label);
            const secIssues = getIssuesFor(s.key);
            const empty = !data[s.key]?.trim();
            const isHighlighted = highlightTarget === s.key;
            const normativeMatches = getNormativeMatches(data[s.key]);

            return (
              <div
                key={s.key}
                id={`editor-${s.key}`}
                className={cn(
                  "overflow-hidden rounded-xl border bg-card shadow-xs transition-all duration-300",
                  secSev === "error"
                    ? "border-error/70 bg-error-soft/10 shadow-xs shadow-error/10"
                    : secSev === "warning"
                    ? "border-warning/70 bg-warning-soft/10 shadow-xs shadow-warning/10"
                    : "border-border",
                  isOpen && "ring-1 ring-border/80",
                  isHighlighted && "ring-2 ring-indigo-500 border-indigo-500 shadow-md shadow-indigo-500/20"
                )}
              >
                {/* Section Header Button */}
                <button
                  type="button"
                  onClick={() => setOpen((p) => ({ ...p, [s.key]: !p[s.key] }))}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                    secSev === "error"
                      ? "hover:bg-error-soft/30"
                      : secSev === "warning"
                      ? "hover:bg-warning-soft/30"
                      : "hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        secSev === "error"
                          ? "text-error"
                          : secSev === "warning"
                          ? "text-warning"
                          : "text-fg"
                      )}
                    >
                      {s.label}
                    </span>
                    {s.optional && (
                      <span className="text-[10px] text-muted/60 font-normal">optional</span>
                    )}
                    {secSev && <span className={cn("h-1.5 w-1.5 rounded-full", dot(secSev))} />}
                    {!empty && !secSev && (
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

                    {/* Normative Keyword Navigator & Quick Fix */}
                    {normativeMatches.length > 0 && s.key !== "specification" && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/60 bg-warning-soft/40 dark:bg-warning-soft/20 px-3 py-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-warning">
                            ⚠️ Normative keywords in {s.label}:
                          </span>
                          {normativeMatches.map(({ kw, count }) => (
                            <button
                              key={kw}
                              type="button"
                              onClick={() => jumpToKeyword(s.key, kw)}
                              className="inline-flex items-center gap-1 rounded bg-card px-2 py-0.5 font-mono text-[11px] font-bold text-fg border border-border shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title={`Click to jump to and highlight "${kw}" in textarea`}
                            >
                              <Search className="h-2.5 w-2.5 opacity-60" />
                              <span>{kw}</span>
                              <span className="rounded-full bg-warning/20 px-1 py-0.2 text-[9px] text-warning font-semibold">
                                {count}
                              </span>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => lowercaseNormativeKeywords(s.key)}
                          className="inline-flex items-center gap-1 rounded bg-warning text-white dark:text-zinc-950 font-semibold px-2.5 py-1 text-[11px] shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                          title="Convert all capitalized normative keywords in this section to lowercase (e.g. MUST -> must)"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Fix: Lowercase all ({normativeMatches.reduce((acc, n) => acc + n.count, 0)})</span>
                        </button>
                      </div>
                    )}

                    {normativeMatches.length > 0 && s.key === "specification" && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-muted">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-[11px] text-muted">
                            Normative keywords:
                          </span>
                          {normativeMatches.map(({ kw, count }) => (
                            <button
                              key={kw}
                              type="button"
                              onClick={() => jumpToKeyword(s.key, kw)}
                              className="inline-flex items-center gap-1 rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title={`Jump to next occurrence of "${kw}" in Specification`}
                            >
                              <Search className="h-2.5 w-2.5 opacity-60" />
                              <span>{kw}</span>
                              <span className="text-muted text-[9px]">({count})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Textarea with backdrop keyword highlighting */}
                    <div
                      className={cn(
                        "rounded-lg transition-all duration-200",
                        secSev === "error"
                          ? "border-2 border-error bg-error-soft/30 dark:bg-error-soft/10 ring-error/20"
                          : secSev === "warning"
                          ? "border-2 border-warning bg-warning-soft/30 dark:bg-warning-soft/10 ring-warning/20"
                          : "border border-border bg-card focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20",
                        isHighlighted && "ring-2 ring-indigo-500 border-indigo-500 shadow-md shadow-indigo-500/20"
                      )}
                    >
                      <SectionTextarea
                        value={data[s.key]}
                        onChange={(val) => onChange(s.key, val)}
                        rows={s.key === "specification" || s.key === "abstract" ? 8 : 4}
                        placeholder={`Write the ${s.label} section in Markdown…`}
                        isSpecification={s.key === "specification"}
                      />
                    </div>

                    {/* Inline Issue Messages for this section */}
                    {secIssues.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {secIssues.map((iss, idx) => (
                          <p
                            key={idx}
                            className={cn(
                              "text-[11px] leading-tight flex items-start gap-1 font-medium",
                              iss.level === "error"
                                ? "text-error"
                                : iss.level === "warning"
                                ? "text-warning"
                                : "text-info"
                            )}
                          >
                            <span className="font-bold">•</span>
                            <span>{iss.message}</span>
                          </p>
                        ))}
                      </div>
                    )}
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
