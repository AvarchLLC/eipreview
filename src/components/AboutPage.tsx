import {
  ArrowRight,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  Heart,
  Layers,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  Zap,
} from "lucide-react";

interface Props {
  onBack: (event?: React.MouseEvent) => void;
  theme: "light" | "dark";
  onToggleTheme: (event?: React.MouseEvent) => void;
}

export function AboutPage({ onBack, theme, onToggleTheme }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-body selection:bg-zinc-200 selection:text-zinc-900 dark:selection:bg-zinc-800 dark:selection:text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div
            onClick={(e) => onBack(e)}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Return to IDE"
          >
            <AboutLogo />
            <div className="flex items-baseline gap-1 select-none">
              <span className="text-[18px] font-black tracking-[-0.04em] text-fg">EIP</span>
              <span className="text-[18px] font-light tracking-[-0.02em] text-zinc-500 dark:text-zinc-400">Review</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="https://github.com/AvarchLLC/eipreview"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-fg shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button
              onClick={(e) => onToggleTheme(e)}
              title="Toggle theme (circular transition)"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-fg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={(e) => onBack(e)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all active:scale-[0.97]"
            >
              Open IDE
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-[1200px] px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/40 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-6 shadow-2xs">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>Standalone Browser-Native Proposal IDE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.035em] text-fg max-w-3xl mx-auto leading-[1.15]">
            The human-facing workspace for authoring Ethereum proposals.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            EIP Review provides proposal authors, editors, and reviewers with a self-contained, client-side environment to draft, validate, and preview EIPs, ERCs, and RIPs before submission.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={(e) => onBack(e)}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Start Authoring</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="https://github.com/AvarchLLC/eipreview"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-fg shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>View Source</span>
            </a>
          </div>
        </section>

        {/* Visual Workflow Architecture (With Arrows and Interactive Cards) */}
        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">How It Works</h2>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-fg mt-1">From Blank Draft to CI-Passing Proposal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 mb-4 shadow-2xs">
                  <Code2 className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Step 01</div>
                <h3 className="text-base font-bold text-fg mt-1">Guided Drafting</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Intuitive form fields for metadata (title, category, discussions link) paired with markdown sections and RFC 2119 formatting snippets.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-muted flex items-center justify-between">
                <span>YAML & Markdown</span>
                <span className="text-indigo-500 font-bold">2-Way Sync</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/50 mb-4 shadow-2xs">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Step 02</div>
                <h3 className="text-base font-bold text-fg mt-1">Instant Linting</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Pure client-side rule validation checks title lengths (≤44), descriptions (≤140), required sections order, and mandatory CC0 waiver.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-muted flex items-center justify-between">
                <span>40+ Lint Rules</span>
                <span className="text-violet-500 font-bold">&lt; 10ms</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/50 mb-4 shadow-2xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Step 03</div>
                <h3 className="text-base font-bold text-fg mt-1">CI Parity (eipw)</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Checks are categorized into blocking CI requirements (aligned with official repository linters) versus authoring guidance tips.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-muted flex items-center justify-between">
                <span>Repository CI</span>
                <span className="text-sky-500 font-bold">1:1 Gate</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 mb-4 shadow-2xs">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Step 04</div>
                <h3 className="text-base font-bold text-fg mt-1">Export & PR Review</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Export ready-to-commit Markdown files, or import an open PR number directly from GitHub to review formatting issues on live PRs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-muted flex items-center justify-between">
                <span>Output Format</span>
                <span className="text-emerald-500 font-bold">eip-N.md</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Core Capabilities</h2>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-fg mt-1">Built specifically for Ethereum standards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-fg mb-4">
                <Terminal className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-fg">100% Client-Side Operation</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Runs entirely in your web browser with zero backend database dependencies. No telemetry, no drafts stored on foreign servers, and works seamlessly offline.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-fg mb-4">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-fg">Multi-Repo Rule Awareness</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Applies the appropriate category, status, and naming constraints whether you are writing an Ethereum Improvement Proposal (EIP), Application Standard (ERC), or Rollup Proposal (RIP).
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-fg mb-4">
                <Search className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-fg">Direct GitHub Import</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Pull existing proposals or open PRs directly by number via the GitHub REST API. Inspect the editor changes, validate compliance, and jump directly to offending lines.
              </p>
            </div>
          </div>
        </section>

        {/* Built by EIPsInsight Section */}
        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-border bg-zinc-50/70 dark:bg-zinc-900/40 p-8 sm:p-12 text-center shadow-xs">
            <div className="inline-flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
              <span className="text-xs font-semibold text-fg uppercase tracking-wider">Built by EIPsInsight</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg max-w-xl mx-auto">
              Empowering Ethereum proposal authors and editors.
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-2xl mx-auto mt-3 leading-relaxed">
              EIP Review is a standalone, client-side authoring and linting workspace built to make proposal writing accessible, compliant, and intuitive for everyone in the Ethereum ecosystem.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
              <a
                href="https://eipsinsight.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-fg hover:underline"
              >
                EIPsInsight Analytics <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
              <span className="text-muted/40">·</span>
              <a
                href="https://ethereum-magicians.org"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-fg hover:underline"
              >
                Ethereum Magicians Forum <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
              <span className="text-muted/40">·</span>
              <a
                href="https://github.com/AvarchLLC/eipreview"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-fg hover:underline"
              >
                eipreview GitHub Repo <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-bg/80 py-6 px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <AboutLogo />
            <span className="font-semibold text-fg">EIP Review</span>
            <span>·</span>
            <span>Released under CC0 1.0 Universal</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={(e) => onBack(e)} className="text-fg hover:underline font-medium">
              Launch IDE
            </button>
            <a href="https://github.com/AvarchLLC/eipreview" target="_blank" rel="noreferrer" className="hover:text-fg transition-colors">
              GitHub Repository
            </a>
            <a href="https://eips.ethereum.org/EIPS/eip-1" target="_blank" rel="noreferrer" className="hover:text-fg transition-colors">
              EIP-1 Spec
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AboutLogo() {
  return (
    <div className="flex items-center justify-center shrink-0">
      <svg viewBox="0 0 32 32" className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-xs" fill="none" aria-hidden>
        {/* Top facet */}
        <path
          d="M16 2L6 18.5L16 23.5L26 18.5L16 2Z"
          className="fill-zinc-900 dark:fill-zinc-100 transition-colors"
        />
        {/* Bottom facet */}
        <path
          d="M6 18.5L16 30L26 18.5L16 23.5L6 18.5Z"
          className="fill-zinc-500 dark:fill-zinc-400 transition-colors"
        />
      </svg>
    </div>
  );
}
