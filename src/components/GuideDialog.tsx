import { BookOpen, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function GuideDialog({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-fg">How it works</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted transition-colors hover:bg-card hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          <section>
            <p className="text-sm leading-relaxed text-body">
              This is a guided way to write and check an Ethereum proposal. Fill in the preamble and sections, and it builds the
              correct Markdown for you. When you validate, your draft is checked against the same rules the editors enforce in CI,
              plus a few authoring checks of our own. You can also import a published proposal or an open pull request to review it.
            </p>
          </section>

          {/* Pipeline diagram */}
          <section className="overflow-x-auto rounded-lg border border-border bg-card/60 p-4">
            <svg viewBox="0 0 640 150" className="w-full min-w-[560px]" role="img" aria-label="Validation pipeline">
              <defs>
                <marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--muted)" />
                </marker>
              </defs>
              <g>
                <rect x="6" y="52" width="120" height="46" rx="9" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.5" />
                <text x="66" y="72" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--fg)">Your draft</text>
                <text x="66" y="88" textAnchor="middle" fontSize="10" fill="var(--muted)">form or import</text>
              </g>
              <line x1="126" y1="75" x2="168" y2="75" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#ar)" />
              <g>
                <rect x="168" y="20" width="150" height="46" rx="9" fill="var(--card)" stroke="var(--border-strong)" strokeWidth="1.5" />
                <text x="243" y="40" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg)">CI rules</text>
                <text x="243" y="56" textAnchor="middle" fontSize="10" fill="var(--muted)">preamble · sections · links</text>
                <rect x="168" y="84" width="150" height="46" rx="9" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.5" />
                <text x="243" y="104" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg)">Authoring checks</text>
                <text x="243" y="120" textAnchor="middle" fontSize="10" fill="var(--muted)">RFC 2119 · prose · TODOs</text>
              </g>
              <line x1="318" y1="75" x2="360" y2="75" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#ar)" />
              <g>
                <rect x="360" y="40" width="130" height="70" rx="9" fill="var(--card)" stroke="var(--border-strong)" strokeWidth="1.5" />
                <circle cx="382" cy="62" r="4" fill="var(--error)" />
                <text x="394" y="66" fontSize="12" fill="var(--fg)">Errors</text>
                <circle cx="382" cy="82" r="4" fill="var(--warning)" />
                <text x="394" y="86" fontSize="12" fill="var(--fg)">Warnings</text>
                <circle cx="382" cy="102" r="4" fill="var(--info)" />
                <text x="394" y="106" fontSize="12" fill="var(--fg)">Suggestions</text>
              </g>
              <line x1="490" y1="75" x2="532" y2="75" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#ar)" />
              <g>
                <rect x="532" y="52" width="102" height="46" rx="9" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.5" />
                <text x="583" y="79" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg)">Submit PR</text>
              </g>
            </svg>
          </section>

          {/* Severity legend */}
          <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Legend tone="error" title="Errors" text="Block a PR. CI will reject them, so fix before submitting." />
            <Legend tone="warning" title="Warnings" text="Strongly recommended. Editors usually ask for these." />
            <Legend tone="info" title="Suggestions" text="Optional polish and style nudges." />
          </section>

          {/* CI vs authoring */}
          <section className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Two kinds of check</h4>
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <span className="mb-1 inline-block rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-muted">CI</span>
              <p className="text-xs text-body">
                Aligned with what CI enforces (the eipw validator, Markdown lint, section and copyright rules). If one of these is an
                error, your PR will not pass until it is fixed.
              </p>
            </div>
            <div className="rounded-lg border border-primary/25 bg-primary-soft p-3">
              <span className="mb-1 inline-block rounded border border-primary/30 bg-card px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-primary">guide</span>
              <p className="text-xs text-body">
                EIPsInsight authoring guidance that CI does not enforce (RFC 2119 boilerplate, leftover TODOs, generic Security
                Considerations, LaTeX that would render literally). These never block a PR, they help you write a cleaner draft.
              </p>
            </div>
          </section>

          {/* What's checked */}
          <section className="space-y-1.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">What gets checked</h4>
            {[
              "Preamble: required fields, order, repo-specific status / type / category, dates, filename",
              "Title and description: length limits, Title Case, one-sentence rules",
              "Author and discussions-to: a GitHub handle, an Ethereum Magicians topic",
              "Sections: required sections by type, correct order, exact CC0 copyright",
              "Normative language: RFC 2119 / 8174 boilerplate and keyword scope",
              "Prose and links: EIP-N format, allowed links, no LaTeX, no template artifacts",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 rounded-lg border border-border bg-card/40 px-3 py-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <p className="text-xs text-body">{t}</p>
              </div>
            ))}
          </section>

          <p className="text-[11px] leading-relaxed text-muted">
            Each finding shows the line it came from, click the L## badge to jump to it. A clean run here means your draft matches
            what CI expects, but editors still review the substance of a proposal.
          </p>
        </div>

        <div className="flex justify-end border-t border-border bg-card/40 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-fg transition-colors hover:bg-card/70">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function Legend({ tone, title, text }: { tone: "error" | "warning" | "info"; title: string; text: string }) {
  const cls = tone === "error" ? "border-error/20 bg-error-soft text-error" : tone === "warning" ? "border-warning/20 bg-warning-soft text-warning" : "border-info/20 bg-info-soft text-info";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <p className="text-xs font-semibold">{title}</p>
      <p className="mt-0.5 text-[11px] text-muted">{text}</p>
    </div>
  );
}
