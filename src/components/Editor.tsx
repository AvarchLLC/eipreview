import { useMemo, useState } from "react";
import { ChevronDown, Info, Plus, Sparkles } from "lucide-react";
import type { ProposalData, ProposalField, RepoKind, ValidationMessage } from "../lib/types";
import { PREAMBLE_FIELDS, SECTION_FIELDS, RFC_2119_BOILERPLATE } from "../data/template";
import { cn } from "../lib/cn";

interface Props {
  data: ProposalData;
  repo: RepoKind;
  onChange: (key: ProposalField, value: string) => void;
  issuesByField: Record<string, ValidationMessage[]>;
}

function dot(level: "error" | "warning" | "info") {
  return level === "error" ? "bg-error" : level === "warning" ? "bg-warning" : "bg-info";
}

/** Form keys are camelCase; preamble message fields are kebab-case. */
function toKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

export function Editor({ data, repo, onChange, issuesByField }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ abstract: true, specification: true });

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

  return (
    <div className="space-y-5">
      {/* Preamble */}
      <section className="rounded-xl border border-border bg-card/60 p-4 sm:p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Preamble</h2>
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
          {preamble.map((f) => {
            const sev = sevOf(f.key);
            const counter =
              f.key === "title" ? `${data.title.length}/44` : f.key === "description" ? `${data.description.length}/140` : null;
            return (
              <div key={f.key} className={cn(f.wide && "sm:col-span-2")}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium",
                      sev === "error" ? "text-error" : sev === "warning" ? "text-warning" : "text-muted"
                    )}
                  >
                    {f.label}
                    {f.optional && <span className="text-[10px] font-normal text-muted/70">optional</span>}
                    <span className="group relative inline-flex">
                      <Info className="h-3 w-3 cursor-help text-muted/60" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-60 -translate-x-1/2 rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-[11px] font-normal leading-snug text-body shadow-lg group-hover:block">
                        {f.hint}
                      </span>
                    </span>
                    {sev && <span className={cn("h-1.5 w-1.5 rounded-full", dot(sev))} />}
                  </label>
                  {counter && (
                    <span className={cn("font-mono text-[10px]", sev === "error" ? "text-error" : "text-muted/70")}>{counter}</span>
                  )}
                </div>
                {f.kind === "select" ? (
                  <div className="relative">
                    <select
                      value={data[f.key]}
                      onChange={(e) => onChange(f.key, e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-bg py-2 pl-3 pr-9 text-sm text-fg outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                    >
                      {(f.options?.(repo) ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o || "Select…"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                ) : (
                  <input
                    type={f.kind === "date" ? "date" : "text"}
                    value={data[f.key]}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    placeholder={f.hint}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/50 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sections */}
      <section className="rounded-xl border border-border bg-card/60 p-4 sm:p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Sections</h2>
        <div className="space-y-3">
          {SECTION_FIELDS.map((s) => {
            const isOpen = open[s.key] ?? false;
            const sev = sevOf(s.label);
            const empty = !data[s.key]?.trim();
            return (
              <div key={s.key} className="overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setOpen((p) => ({ ...p, [s.key]: !p[s.key] }))}
                  className="flex w-full items-center justify-between gap-2 bg-bg px-3.5 py-2.5 text-left transition-colors hover:bg-card"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-fg">
                    {s.label}
                    {s.optional && <span className="text-[10px] font-normal text-muted/70">optional</span>}
                    {sev && <span className={cn("h-1.5 w-1.5 rounded-full", dot(sev))} />}
                    {!empty && !sev && <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="border-t border-border bg-card/40 p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="text-[11px] leading-snug text-muted">{s.hint}</p>
                      {s.key === "specification" && (
                        <button
                          type="button"
                          onClick={() => {
                            const cur = data.specification.trim();
                            if (cur.includes("RFC 2119") && cur.includes("RFC 8174")) return;
                            onChange("specification", cur ? `${RFC_2119_BOILERPLATE}\n\n${cur}` : RFC_2119_BOILERPLATE);
                          }}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                          title="Insert the RFC 2119/8174 boilerplate paragraph"
                        >
                          <Sparkles className="h-3 w-3" /> RFC 2119
                        </button>
                      )}
                    </div>
                    <textarea
                      value={data[s.key]}
                      onChange={(e) => onChange(s.key, e.target.value)}
                      rows={s.key === "specification" || s.key === "abstract" ? 7 : 4}
                      placeholder={`Write the ${s.label} section in Markdown…`}
                      className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-mono text-[13px] leading-relaxed text-fg placeholder:text-muted/50 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                )}
              </div>
            );
          })}
          <p className="flex items-center gap-1.5 px-1 pt-1 text-[11px] text-muted">
            <Plus className="h-3 w-3" /> A Copyright section (CC0) is added automatically.
          </p>
        </div>
      </section>
    </div>
  );
}
