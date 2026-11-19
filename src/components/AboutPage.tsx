import { useState } from "react";
import {
  ArrowRight,
  BookCheck,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileEdit,
  GitPullRequest,
  Github,
  Heart,
  HelpCircle,
  Moon,
  Sparkles,
  Sun,
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

interface FaqItem {
  question: string;
  answer: string;
  linkText?: string;
  linkHref?: string;
}

const FAQS: FaqItem[] = [
  {
    question: "What types of proposals are supported?",
    answer:
      "EIP Review supports Ethereum Improvement Proposals (EIPs), Application-level Standards (ERCs), and Rollup Improvement Proposals (RIPs). It automatically applies repository-specific rules, status workflows, and category options.",
  },
  {
    question: "How does live proposal validation work?",
    answer:
      "As you write, the editor checks your document against 40+ editorial and formatting constraints in real time. This mirrors the official Ethereum CI checks—including EIP Walidator (eipw), title and description character limits, section ordering, mandatory CC0 copyright waiver, and RFC 2119 normative language rules.",
  },
  {
    question: "Can I review an open pull request from GitHub?",
    answer:
      "Yes! Navigate to Review PR (/review) and enter any open pull request number (e.g. 12660). EIP Review fetches the proposal file, flags editorial issues, visually highlights misplaced normative keywords with 1-click fixes, and lets you inspect the rendered output before merging.",
  },
  {
    question: "How do I share a specific proposal or PR review with editors?",
    answer:
      "Every proposal and PR review has a clean, direct canonical URL (e.g. eipreview.com/eip/1559 or eipreview.com/review/12660). Anyone who opens the link will see the proposal loaded and validated immediately.",
  },
  {
    question: "Where should I post my proposal for community discussion?",
    answer:
      "Per EIP-1 requirements, all proposals require an active discussion thread on the Ethereum Magicians forum before advancing through the standards track. You can paste your thread URL directly into the Discussions-To metadata field.",
    linkText: "Visit Ethereum Magicians",
    linkHref: "https://ethereum-magicians.org",
  },
  {
    question: "Is my draft stored on any remote server?",
    answer:
      "No. All drafting, validation, and rendering take place locally in your web browser. No drafts, telemetry, or account data are sent to external databases. You can copy the raw Markdown or download the .md file directly to commit to GitHub.",
  },
];

export function AboutPage({ onNavigate, theme, onToggleTheme }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

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
                className="px-2.5 py-1.5 rounded-md hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Authoring (/new)
              </button>
              <button
                onClick={(e) => onNavigate({ tab: "pr" }, e)}
                className="px-2.5 py-1.5 rounded-md hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Review PR (/review)
              </button>
              <button
                onClick={(e) => onNavigate({ tab: "import" }, e)}
                className="px-2.5 py-1.5 rounded-md hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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

        {/* Frequently Asked Questions (FAQ Section) */}
        <section className="mx-auto max-w-[900px] px-4 py-12 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 shadow-2xs">
              <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2">
              Common questions about authoring, reviewing, and publishing Ethereum proposals.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left select-none hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-semibold text-fg">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-fg" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-border/60 bg-zinc-50/30 dark:bg-zinc-900/30 px-5 pb-5 pt-3 text-xs sm:text-sm text-muted leading-relaxed space-y-2">
                      <p>{faq.answer}</p>
                      {faq.linkHref && faq.linkText && (
                        <div>
                          <a
                            href={faq.linkHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                          >
                            <span>{faq.linkText}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
              EIP Review is a standalone, browser-based authoring and linting workspace built to make proposal writing accessible, compliant, and intuitive for everyone in the Ethereum ecosystem.
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
