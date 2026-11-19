import {
  ArrowRight,
  BookCheck,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileEdit,
  GitPullRequest,
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
import type { RepoKind, TabMode } from "../lib/types";

interface Props {
  onNavigate: (
    destination: { tab: TabMode; repo?: RepoKind; query?: string },
    event?: React.MouseEvent
  ) => void;
  theme: "light" | "dark";
  onToggleTheme: (event?: React.MouseEvent) => void;
}

export function AboutPage({ onNavigate, theme, onToggleTheme }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-body selection:bg-zinc-200 selection:text-zinc-900 dark:selection:bg-zinc-800 dark:selection:text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div
            onClick={(e) => onNavigate({ tab: "new" }, e)}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="EIP Review"
          >
            <AboutLogo />
            <div className="flex items-baseline gap-1 select-none">
              <span className="text-[18px] font-black tracking-[-0.04em] text-fg">EIP</span>
              <span className="text-[18px] font-light tracking-[-0.02em] text-zinc-500 dark:text-zinc-400">
                Review
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-muted mr-2">
              <button
                onClick={(e) => onNavigate({ tab: "new" }, e)}
                className="px-2.5 py-1.5 rounded-md hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Authoring (/new)
              </button>
              <button
                onClick={(e) => onNavigate({ tab: "pr" }, e)}
                className="px-2.5 py-1.5 rounded-md hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Review PR (/review)
              </button>
              <button
                onClick={(e) => onNavigate({ tab: "import" }, e)}
                className="px-2.5 py-1.5 rounded-md hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Import (/import)
              </button>
            </nav>

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
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-fg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={(e) => onNavigate({ tab: "new" }, e)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 border border-zinc-800 dark:border-zinc-200 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all active:scale-[0.97] cursor-pointer"
            >
              <span>Open Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-[1200px] px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/40 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-6 shadow-2xs">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>Dedicated Ethereum Standards IDE · EIPs · ERCs · RIPs</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-fg max-w-4xl mx-auto leading-[1.15]">
            The workspace for authoring, reviewing, and editing Ethereum proposals.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            A browser-native environment purpose-built for the Ethereum ecosystem. Validate frontmatter metadata, verify RFC 2119 normative language, preview rendered proposals in real time, and achieve 100% CI parity before opening a pull request.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={(e) => onNavigate({ tab: "new" }, e)}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 border border-zinc-800 dark:border-zinc-200 px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Start Drafting (/new)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => onNavigate({ tab: "pr" }, e)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-fg shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <GitPullRequest className="h-4 w-4 text-violet-500" />
              <span>Review a PR (/review)</span>
            </button>
          </div>
        </section>

        {/* 3 Dedicated Role Pathways: Author, Reviewer, Editor */}
        <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Pick Your Workflow</h2>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-fg mt-1">
              Engineered for every stage of proposal development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Author Card */}
            <div className="group rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-md transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs">
                    <FileEdit className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    For Authors
                  </span>
                </div>
                <h3 className="text-lg font-bold text-fg">Draft a New Proposal</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Start from standardized templates. Form fields guide you through preamble metadata while live linting ensures title length, description constraints, and section ordering pass CI.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-body border-t border-border/60 pt-3">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Official EIP, ERC & RIP templates</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Auto-linked RFC 2119 / 8174 boilerplate</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Live rendered preview & clean export</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={(e) => onNavigate({ tab: "new" }, e)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer"
              >
                <span>I am an Author (/new)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 2. Reviewer Card */}
            <div className="group rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between hover:border-violet-500/50 hover:shadow-md transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/50 shadow-2xs">
                    <GitPullRequest className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-violet-200/60 dark:border-violet-800/60 bg-violet-50/50 dark:bg-violet-950/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                    For Reviewers
                  </span>
                </div>
                <h3 className="text-lg font-bold text-fg">Review Open Pull Requests</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Load any open PR directly from GitHub by number. Catch normative keywords misplaced outside Specification, jump directly to offending lines, and preview the final rendered document.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-body border-t border-border/60 pt-3">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span>Instant GitHub PR import by number</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span>Interactive keyword locator & 1-click fixes</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span>EIP Walidator & CI parity check drawer</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={(e) => onNavigate({ tab: "pr" }, e)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer"
              >
                <span>I am a Reviewer (/review)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 3. Editor Card */}
            <div className="group rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between hover:border-sky-500/50 hover:shadow-md transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/50 shadow-2xs">
                    <BookCheck className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-sky-200/60 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                    For Editors
                  </span>
                </div>
                <h3 className="text-lg font-bold text-fg">Inspect & Edit Proposals</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Fetch any active, final, or living proposal by number (e.g. EIP-1559, ERC-20, RIP-7212). Prepare errata, audit formatting compliance, and copy clean Markdown drafts.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-body border-t border-border/60 pt-3">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    <span>Direct proposal lookup by number</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    <span>Status & category workflow validation</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    <span>Direct shareable deep links (e.g. /eip/1559)</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={(e) => onNavigate({ tab: "import" }, e)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer"
              >
                <span>I am an Editor (/import)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Visual Workflow Architecture (Step 01 - 04) */}
        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Workflow Pipeline</h2>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-fg mt-1">
              From Draft to Passing Ethereum CI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 mb-4 shadow-2xs">
                  <Code2 className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Step 01
                </div>
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
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/50 mb-4 shadow-2xs">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Step 02
                </div>
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
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/50 mb-4 shadow-2xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Step 03
                </div>
                <h3 className="text-base font-bold text-fg mt-1">EIP Walidator & CI Parity</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Real-time validation mirroring the official GitHub Actions suite: EIP Walidator (eipw), Markdown Linter, Link Check, and CodeSpell.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-muted flex items-center justify-between">
                <span>GitHub CI Suite</span>
                <span className="text-sky-500 font-bold">Passing Gate</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 mb-4 shadow-2xs">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Step 04
                </div>
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

        {/* Technical Architecture & Documentation Section (Relocated & Organized) */}
        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs">
            <div className="mb-8">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted">
                Documentation & Architecture
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fg mt-1">
                Under the Hood: Pure Client-Side Architecture
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-2 max-w-3xl leading-relaxed">
                EIP Review operates entirely in the user’s browser without storing drafts on foreign servers or tracking author activity. Here is how the runtime and validation engine function:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-xl border border-border/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-4">
                <div className="flex items-center gap-2 mb-2 text-fg font-semibold text-xs">
                  <Terminal className="h-4 w-4 text-muted" />
                  <span>Zero-Backend Operation</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  No database, no user accounts, and no proprietary lock-in. Imports use unauthenticated public GitHub REST endpoints. All parsing and validation execute synchronously in memory.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-4">
                <div className="flex items-center gap-2 mb-2 text-fg font-semibold text-xs">
                  <Layers className="h-4 w-4 text-muted" />
                  <span>Tri-Repo Specification Matrix</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Enforces distinct rules across <code className="font-mono text-[11px]">ethereum/EIPs</code>, <code className="font-mono text-[11px]">ethereum/ERCs</code>, and <code className="font-mono text-[11px]">ethereum/RIPs</code> with exact category restrictions.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-4">
                <div className="flex items-center gap-2 mb-2 text-fg font-semibold text-xs">
                  <Search className="h-4 w-4 text-muted" />
                  <span>Deep URL Linking</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Share exact proposal views with editors using clean canonical routes like <code className="font-mono text-[11px]">/eip/1559</code>, <code className="font-mono text-[11px]">/review/12660</code>, or <code className="font-mono text-[11px]">/new</code>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Built by EIPsInsight Section */}
        <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          <div className="rounded-3xl border border-border bg-zinc-50/70 dark:bg-zinc-900/40 p-8 sm:p-12 text-center shadow-xs">
            <div className="inline-flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
              <span className="text-xs font-semibold text-fg uppercase tracking-wider">
                Built by EIPsInsight
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg max-w-xl mx-auto">
              Empowering Ethereum proposal authors, reviewers, and editors.
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
            <span>Released under the MIT License</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => onNavigate({ tab: "new" }, e)}
              className="text-fg hover:underline font-medium cursor-pointer"
            >
              Launch Workspace
            </button>
            <a
              href="https://github.com/ethereum/EIPs/blob/master/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-fg transition-colors"
            >
              CONTRIBUTING.md
            </a>
            <a
              href="https://github.com/AvarchLLC/eipreview"
              target="_blank"
              rel="noreferrer"
              className="hover:text-fg transition-colors"
            >
              GitHub Repository
            </a>
            <a
              href="https://eips.ethereum.org/EIPS/eip-1"
              target="_blank"
              rel="noreferrer"
              className="hover:text-fg transition-colors"
            >
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
