import { BookOpen, ExternalLink, ShieldCheck, Sparkles, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function GuideDialog({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-fg">How Validation Works</h3>
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 px-2 py-0.5 text-[10px] font-medium">
                  CI Parity
                </span>
              </div>
              <p className="text-[11px] text-muted">Authoring pipeline & validation workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 text-xs text-body leading-relaxed">
          <section>
            <p>
              EIP Review provides an in-browser authoring environment that aligns proposal drafting with the exact editorial rules and automated checks enforced by Ethereum's EIP, ERC, and RIP editors.
            </p>
          </section>

          {/* Clean Branching Pipeline Diagram */}
          <section className="overflow-x-auto rounded-xl border border-border bg-zinc-50/70 dark:bg-zinc-900/40 p-4 sm:p-5">
            <svg viewBox="0 0 660 144" className="w-full min-w-[600px]" role="img" aria-label="Validation workflow">
              <defs>
                <marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-muted)" opacity="0.8" />
                </marker>
                <marker id="ar-success" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-success)" />
                </marker>
              </defs>

              {/* 1. Draft Source Box */}
              <g>
                <rect x="8" y="48" width="116" height="48" rx="8" fill="var(--color-card)" stroke="var(--color-border-strong)" strokeWidth="1" />
                <text x="66" y="69" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-fg)">Your Draft</text>
                <text x="66" y="84" textAnchor="middle" fontSize="10" fill="var(--color-muted)">Editor or Import</text>
              </g>

              {/* Branching curves from Draft into CI Rules and Authoring Checks */}
              <path
                d="M 124 72 C 146 72, 146 36, 168 36"
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                markerEnd="url(#ar)"
              />
              <path
                d="M 124 72 C 146 72, 146 108, 168 108"
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                markerEnd="url(#ar)"
              />

              {/* 2. Top Branch: CI Rules (Blue/Info) */}
              <g>
                <rect x="170" y="14" width="154" height="44" rx="8" fill="var(--color-card)" stroke="var(--color-info)" strokeWidth="1" strokeOpacity="0.5" />
                <circle cx="186" cy="36" r="3.5" fill="var(--color-info)" />
                <text x="246" y="32" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-fg)">CI Blocking Rules</text>
                <text x="246" y="47" textAnchor="middle" fontSize="9.5" fill="var(--color-muted)">EIP Walidator · headers · CC0</text>
              </g>

              {/* 3. Bottom Branch: Authoring Guidance (Purple/Accent) */}
              <g>
                <rect x="170" y="86" width="154" height="44" rx="8" fill="var(--color-card)" stroke="var(--color-accent)" strokeWidth="1" strokeOpacity="0.5" />
                <circle cx="186" cy="108" r="3.5" fill="var(--color-accent)" />
                <text x="246" y="104" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-fg)">Authoring Guidance</text>
                <text x="246" y="119" textAnchor="middle" fontSize="9.5" fill="var(--color-muted)">RFC 2119 · clarity · formatting</text>
              </g>

              {/* Merging curves from Rules into Validation Engine */}
              <path
                d="M 324 36 C 346 36, 346 72, 364 72"
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth="1.2"
                markerEnd="url(#ar)"
              />
              <path
                d="M 324 108 C 346 108, 346 72, 364 72"
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth="1.2"
                markerEnd="url(#ar)"
              />

              {/* 4. Validation Engine / Findings Box */}
              <g>
                <rect x="368" y="28" width="138" height="88" rx="8" fill="var(--color-card)" stroke="var(--color-border-strong)" strokeWidth="1" />
                <text x="437" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--color-muted)" letterSpacing="0.05em">INSPECTOR</text>

                {/* Error dot */}
                <circle cx="388" cy="62" r="3" fill="var(--color-error)" />
                <text x="398" y="65" fontSize="10.5" fontWeight="500" fill="var(--color-fg)">Errors (block PR)</text>

                {/* Warning dot */}
                <circle cx="388" cy="80" r="3" fill="var(--color-warning)" />
                <text x="398" y="83" fontSize="10.5" fontWeight="500" fill="var(--color-fg)">Warnings (advisories)</text>

                {/* Info dot */}
                <circle cx="388" cy="98" r="3" fill="var(--color-info)" />
                <text x="398" y="101" fontSize="10.5" fontWeight="500" fill="var(--color-fg)">Suggestions (polish)</text>
              </g>

              {/* Arrow from Engine to Ready */}
              <line x1="506" y1="72" x2="538" y2="72" stroke="var(--color-success)" strokeWidth="1.5" markerEnd="url(#ar-success)" />

              {/* 5. Ready for PR Target Box (Subtle Emerald Card) */}
              <g>
                <rect
                  x="542"
                  y="48"
                  width="110"
                  height="48"
                  rx="8"
                  fill="var(--color-success-soft)"
                  stroke="var(--color-success)"
                  strokeWidth="1.2"
                />
                <circle cx="560" cy="72" r="6" fill="var(--color-success)" />
                <path d="M557 72 L559 74 L563 70" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <text x="602" y="69" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-success)">Ready for PR</text>
                <text x="602" y="83" textAnchor="middle" fontSize="9.5" fill="var(--color-muted)">Submittable</text>
              </g>
            </svg>
          </section>

          {/* Severity explanation with subtle color cards */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-error/25 bg-error-soft/60 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-2 w-2 rounded-full bg-error" />
                <p className="font-semibold text-error text-[11px] uppercase tracking-wider">Errors</p>
              </div>
              <p className="text-[11px] text-body">Required to fix. GitHub CI actions (EIP Walidator & markdownlint) will reject the PR if any error remains.</p>
            </div>
            <div className="rounded-xl border border-warning/25 bg-warning-soft/60 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-2 w-2 rounded-full bg-warning" />
                <p className="font-semibold text-warning text-[11px] uppercase tracking-wider">Warnings</p>
              </div>
              <p className="text-[11px] text-body">Strongly recommended fixes that EIP editors typically request before merging.</p>
            </div>
            <div className="rounded-xl border border-info/25 bg-info-soft/60 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-2 w-2 rounded-full bg-info" />
                <p className="font-semibold text-info text-[11px] uppercase tracking-wider">Suggestions</p>
              </div>
              <p className="text-[11px] text-body">Optional editorial suggestions for clarity, formatting polish, and normative keyword precision.</p>
            </div>
          </div>

          {/* Checklist with subtle badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">What gets verified</h4>
              <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                <ShieldCheck className="h-3 w-3" /> Real-time validation
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { title: "YAML Preamble", desc: "Required fields, ordering, status, category, date formats", tag: "CI", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
                { title: "Length Constraints", desc: "Title ≤ 44 chars, Description ≤ 140 chars, Title Case", tag: "CI", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
                { title: "Author & Discussions-To", desc: "GitHub handles & Ethereum Magicians topic URL", tag: "CI", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
                { title: "Required Sections", desc: "Ordered sections & verbatim CC0 Copyright waiver", tag: "CI", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
                { title: "Normative Keywords", desc: "RFC 2119 / 8174 scope & boilerplate inclusion", tag: "Guide", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800" },
                { title: "Clean Prose & Links", desc: "Internal EIP-N links, no LaTeX, no stale placeholders", tag: "Guide", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-2xs">
                  <div>
                    <p className="font-semibold text-fg text-xs">{item.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">{item.desc}</p>
                  </div>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-mono font-medium ${item.color}`}>
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Official Documentation & Resources */}
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Official Documentation & Resources</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <a
                href="https://eips.ethereum.org/EIPS/eip-1"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-fg text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">EIP-1 Specification</p>
                  <p className="text-[11px] text-muted">Official structure & guidelines</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted opacity-60 group-hover:opacity-100" />
              </a>

              <a
                href="https://github.com/ethereum/EIPs/blob/master/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-fg text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">CONTRIBUTING.md</p>
                  <p className="text-[11px] text-muted">Ethereum PR & editorial rules</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted opacity-60 group-hover:opacity-100" />
              </a>

              <a
                href="https://github.com/AvarchLLC/eipreview"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-fg text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">EIP Review Repository</p>
                  <p className="text-[11px] text-muted">Open source codebase & issues</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted opacity-60 group-hover:opacity-100" />
              </a>

              <a
                href="https://eipsinsight.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-fg text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">EIPsInsight Analytics</p>
                  <p className="text-[11px] text-muted">Proposals tracking & insights</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted opacity-60 group-hover:opacity-100" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-zinc-50/50 dark:bg-zinc-800/30 px-5 py-3">
          <span className="text-[11px] text-muted flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            Click any line number (L##) in findings to jump directly in the editor.
          </span>
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-xs font-medium text-fg shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
