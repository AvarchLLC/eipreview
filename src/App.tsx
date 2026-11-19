import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, Github, GitPullRequest, Heart } from "lucide-react";
import { Toolbar } from "./components/Toolbar";
import { Editor } from "./components/Editor";
import { OutputPane } from "./components/OutputPane";
import { ValidationDialog } from "./components/ValidationDialog";
import { GuideDialog } from "./components/GuideDialog";
import { AboutPage } from "./components/AboutPage";
import { useTheme } from "./hooks/useTheme";
import { EMPTY_PROPOSAL, generateMarkdown, parseMarkdown } from "./lib/markdown";
import { validateProposal } from "./lib/validation";
import { fetchProposal, importPr, repoFromFilename } from "./lib/github";
import type {
  ImportedPr,
  ProposalData,
  ProposalField,
  RepoKind,
  TabMode,
  ValidationMessage,
  ViewMode,
} from "./lib/types";
import { cn } from "./lib/cn";

function normalizeKey(field?: string, section?: string): string | null {
  const parts = [field, section].filter(Boolean).join(" ").toLowerCase();

  // 1. Body sections
  if (parts.includes("abstract")) return "abstract";
  if (parts.includes("motivation")) return "motivation";
  if (
    parts.includes("specification") ||
    parts.includes("normative") ||
    parts.includes("rfc 2119") ||
    parts.includes("rfc2119") ||
    parts.includes("rfc 8174")
  ) {
    return "specification";
  }
  if (parts.includes("rationale")) return "rationale";
  if (parts.includes("backwards") || parts.includes("compatibility")) return "backwardsCompatibility";
  if (parts.includes("test")) return "testCases";
  if (parts.includes("reference") || parts.includes("implementation")) return "referenceImplementation";
  if (parts.includes("security")) return "securityConsiderations";
  if (parts.includes("copyright") || parts.includes("license") || parts.includes("cc0")) return "abstract";

  // 2. Preamble fields
  if (parts.includes("title")) return "title";
  if (parts.includes("description")) return "description";
  if (parts.includes("author")) return "author";
  if (parts.includes("discussion")) return "discussionsTo";
  if (parts.includes("status")) return "status";
  if (parts.includes("deadline") || parts.includes("last-call") || parts.includes("lastcall")) return "lastCallDeadline";
  if (parts.includes("type")) return "type";
  if (parts.includes("category")) return "category";
  if (parts.includes("created")) return "created";
  if (parts.includes("require")) return "requires";
  if (parts.includes("withdrawal")) return "withdrawalReason";
  if (parts.includes("eip") || parts.includes("number") || parts.includes("preamble") || parts.includes("order")) return "eip";

  return null;
}

export default function App() {
  const { theme, toggle } = useTheme();

  // Page routing state for /about
  const [page, setPage] = useState<"editor" | "about">(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname === "/about" || window.location.hash === "#/about"
        ? "about"
        : "editor";
    }
    return "editor";
  });

  useEffect(() => {
    const onPop = () => {
      const isAbout = window.location.pathname === "/about" || window.location.hash === "#/about";
      const targetPage = isAbout ? "about" : "editor";
      const supportsViewTransition =
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (supportsViewTransition) {
        (document as unknown as {
          startViewTransition: (cb: () => void) => void;
        }).startViewTransition(() => {
          setPage(targetPage);
        });
      } else {
        setPage(targetPage);
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);

  const navigateTo = (p: "editor" | "about", event?: React.MouseEvent | MouseEvent) => {
    if (page === p) return;

    const changePage = () => {
      setPage(p);
      try {
        if (p === "about") {
          window.history.pushState(null, "", "/about");
        } else {
          window.history.pushState(null, "", "/");
        }
      } catch {
        // fallback
      }
    };

    const supportsViewTransition =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supportsViewTransition) {
      changePage();
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as unknown as {
      startViewTransition: (cb: () => void) => { ready: Promise<void> };
    }).startViewTransition(() => {
      changePage();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 400,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  const [tab, setTab] = useState<TabMode>("new");
  const [repo, setRepo] = useState<RepoKind>("eip");
  const [view, setView] = useState<ViewMode>("split");

  const [data, setData] = useState<ProposalData>({ ...EMPTY_PROPOSAL });
  const [markdown, setMarkdown] = useState<string>(() => generateMarkdown(EMPTY_PROPOSAL));
  const [lastEdited, setLastEdited] = useState<"form" | "code">("form");

  const [messages, setMessages] = useState<ValidationMessage[]>([]);
  const [validated, setValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null);

  const [importQuery, setImportQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedPr, setImportedPr] = useState<ImportedPr | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection: split pane collapses to one column on smaller screens.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Two-way sync between form data and Markdown.
  useEffect(() => {
    if (lastEdited === "form") setMarkdown(generateMarkdown(data));
  }, [data, lastEdited]);
  useEffect(() => {
    if (lastEdited === "code") setData((d) => ({ ...d, ...parseMarkdown(markdown) }));
  }, [markdown, lastEdited]);

  const clearValidation = useCallback(() => {
    setValidated(false);
    setMessages([]);
    setShowValidation(false);
  }, []);

  // Reset when tab or repo context changes.
  useEffect(() => {
    if (tab === "new") {
      setData({ ...EMPTY_PROPOSAL });
      setLastEdited("form");
      setImportedPr(null);
    }
    setImportQuery("");
    setImportError(null);
    clearValidation();
  }, [tab, repo, clearValidation]);

  const handleField = useCallback((key: ProposalField, value: string) => {
    setLastEdited("form");
    setData((prev) => ({ ...prev, [key]: value }));
    setValidated(false);
  }, []);

  const doImport = useCallback(async () => {
    const q = importQuery.replace(/[^0-9]/g, "");
    if (!q) {
      setImportError("Enter a number");
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      if (tab === "pr") {
        const pr = await importPr(repo, q);
        setMarkdown(pr.markdown);
        setData({ ...EMPTY_PROPOSAL, ...parseMarkdown(pr.markdown) });
        setLastEdited("code");
        setRepo(repoFromFilename(pr.filename));
        setImportedPr(pr);
      } else {
        const r = await fetchProposal(repo, q);
        setMarkdown(r.markdown);
        setData({ ...EMPTY_PROPOSAL, ...parseMarkdown(r.markdown) });
        setLastEdited("code");
        setRepo(r.repo);
        setImportedPr(null);
      }
      setValidated(false);
      setMessages([]);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }, [importQuery, tab, repo]);

  const validate = useCallback(() => {
    setValidating(true);
    setShowValidation(true);
    const filename = tab === "pr" ? importedPr?.filename : undefined;
    window.setTimeout(() => {
      const result = validateProposal(markdown, { repo, filename });
      setMessages(result.messages);
      setValidated(result.messages.every((m) => m.level !== "error"));
      setValidating(false);
    }, 120);
  }, [markdown, repo, tab, importedPr]);

  const download = useCallback(() => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const num = data.eip && /^\d+$/.test(data.eip) ? data.eip : "draft";
    a.href = url;
    a.download = `${repo}-${num}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown, repo, data.eip]);

  // Synchronized jump: scrolls and focuses the left editor field/section
  const handleJump = useCallback(
    (item: ValidationMessage) => {
      setShowValidation(false);

      // If user is currently in Preview-only view, ensure Editor is visible
      if (view === "preview") {
        setView("split");
      }

      // Identify and highlight target on the LEFT (Editor pane)
      const target = normalizeKey(item.field, item.section);
      if (target) {
        setHighlightTarget(target);
        window.setTimeout(() => setHighlightTarget(null), 3500);
      }
    },
    [view]
  );

  const issuesByField = useMemo(() => {
    const map: Record<string, ValidationMessage[]> = {};
    for (const msg of messages) {
      // Map normalized key directly (e.g. "specification", "title")
      const norm = normalizeKey(msg.field, msg.section);
      if (norm) {
        (map[norm] ??= []).push(msg);
      }
      for (const key of [msg.field, msg.section]) {
        if (!key) continue;
        const k = key.toLowerCase();
        (map[k] ??= []).push(msg);
      }
    }
    return map;
  }, [messages]);

  const effectiveView: ViewMode = isMobile && view === "split" ? "edit" : view;
  const showEdit = effectiveView === "edit" || effectiveView === "split";
  const showOutput = effectiveView === "preview" || effectiveView === "split";
  const issueCount = messages.length;

  // Render the About Landing Page if on /about
  if (page === "about") {
    return <AboutPage onBack={(e) => navigateTo("editor", e)} theme={theme} onToggleTheme={toggle} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg text-body">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1600px] px-3.5 py-2.5 sm:px-6">
          {/* Brand Row */}
          <div className="mb-2.5 flex items-center justify-between">
            <div
              onClick={(e) => navigateTo("editor", e)}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="EIP Review"
            >
              <Logo />
              <div className="flex items-baseline gap-1 select-none">
                <span className="text-[18px] font-black tracking-[-0.04em] text-fg">
                  EIP
                </span>
                <span className="text-[18px] font-light tracking-[-0.02em] text-zinc-500 dark:text-zinc-400">
                  Review
                </span>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="flex items-center gap-2 text-xs">
              <a
                href="https://github.com/AvarchLLC/eipreview"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted hover:text-fg hover:border-fg/30 transition-colors shadow-2xs"
                title="View repository on GitHub"
              >
                <Github className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>

              <button
                onClick={() => setShowGuide(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-fg shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                <span>Guide</span>
              </button>

              {/* Subtle ? button navigating to /about landing page */}
              <button
                onClick={(e) => navigateTo("about", e)}
                title="About EIP Review & Documentation"
                className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-border bg-card text-muted hover:text-fg hover:border-fg/30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs text-xs font-bold"
              >
                ?
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <Toolbar
            tab={tab}
            setTab={setTab}
            repo={repo}
            setRepo={setRepo}
            view={view}
            setView={setView}
            isMobile={isMobile}
            importQuery={importQuery}
            setImportQuery={setImportQuery}
            importing={importing}
            importError={importError}
            onImport={doImport}
            onValidate={validate}
            onDownload={download}
            validating={validating}
            validated={validated}
            issueCount={issueCount}
            onShowIssues={() => setShowValidation(true)}
            theme={theme}
            onToggleTheme={toggle}
            onOpenGuide={() => setShowGuide(true)}
          />
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col overflow-hidden px-0">
        <div className={cn("flex min-h-[calc(100vh-145px)] flex-1", effectiveView === "split" ? "flex-row" : "flex-col")}>
          {showEdit && (
            <div
              className={cn(
                "p-4 sm:p-6 overflow-y-auto bg-card",
                effectiveView === "split" ? "w-1/2 border-r border-border" : "w-full"
              )}
            >
              {importedPr && <PrBanner pr={importedPr} />}
              <Editor
                data={data}
                repo={repo}
                onChange={handleField}
                issuesByField={issuesByField}
                highlightTarget={highlightTarget}
              />
            </div>
          )}
          {showOutput && (
            <div className={cn("bg-card", effectiveView === "split" ? "w-1/2" : "w-full")}>
              <OutputPane markdown={markdown} />
            </div>
          )}
        </div>
      </main>

      {/* Beautiful, Designed, NON-STICKY Footer */}
      <footer className="border-t border-border bg-bg/70 transition-colors">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
          {/* Top Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 pb-8 border-b border-border/60">
            {/* Brand Column */}
            <div className="space-y-3 md:col-span-1">
              <div
                onClick={(e) => navigateTo("editor", e)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Logo />
                <div className="flex items-baseline gap-1 select-none">
                  <span className="text-[16px] font-black tracking-[-0.04em] text-fg">EIP</span>
                  <span className="text-[16px] font-light tracking-[-0.02em] text-zinc-500 dark:text-zinc-400">Review</span>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                A browser-based IDE for authoring, linting, and reviewing Ethereum Improvement Proposals, ERC standards, and RIPs.
              </p>
              <div className="pt-1">
                <a
                  href="https://eipsinsight.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors group"
                >
                  <span>Built with</span>
                  <Heart className="h-3 w-3 text-rose-500 fill-rose-500 group-hover:scale-110 transition-transform" />
                  <span>by</span>
                  <span className="font-semibold text-fg underline decoration-indigo-400 underline-offset-2">
                    EIPsInsight
                  </span>
                </a>
              </div>
            </div>

            {/* Specifications Links */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">Specifications</p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="https://eips.ethereum.org/EIPS/eip-1" target="_blank" rel="noreferrer" className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                    EIP-1 Specification <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </a>
                </li>
                <li>
                  <a href="https://github.com/ethereum/EIPs/blob/master/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                    EIP Contributing Guide <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </a>
                </li>
                <li>
                  <a href="https://github.com/ethereum/EIPs" target="_blank" rel="noreferrer" className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                    EIPs Repository <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </a>
                </li>
                <li>
                  <a href="https://github.com/ethereum/ERCs" target="_blank" rel="noreferrer" className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                    ERCs Repository <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </a>
                </li>
                <li>
                  <a href="https://github.com/ethereum/RIPs" target="_blank" rel="noreferrer" className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                    RIPs Repository <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Community Links */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">Community & Governance</p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="https://ethereum-magicians.org" target="_blank" rel="noreferrer" className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                    Ethereum Magicians <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </a>
                </li>
                <li>
                  <a href="https://ethresear.ch" target="_blank" rel="noreferrer" className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                    ethresear.ch <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </a>
                </li>
                <li>
                  <a href="https://eipsinsight.com" target="_blank" rel="noreferrer" className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                    EIPsInsight Analytics <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </a>
                </li>
                <li>
                  <a href="https://ethereum.org" target="_blank" rel="noreferrer" className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                    Ethereum.org <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Tooling & Standards */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">CI Checks Coverage</p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>EIP Walidator (eipw)</span>
                </li>
                <li className="flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Markdown Linter</span>
                </li>
                <li className="flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Link Check (URLs)</span>
                </li>
                <li className="flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>CodeSpell Linter</span>
                </li>
                <li className="flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>HTMLProofer Build</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <div className="flex items-center gap-2 text-[11px]">
              <span>© 2026 EIP Review</span>
              <span className="text-muted/40">·</span>
              <span>Released under the MIT License</span>
              <span className="text-muted/40">·</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Open Source</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <button
                onClick={(e) => navigateTo("about", e)}
                className="text-muted hover:text-fg transition-colors"
              >
                About & Architecture
              </button>
              <span className="text-muted/40">·</span>
              <a
                href="https://github.com/ethereum/EIPs/blob/master/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
                className="hover:text-fg transition-colors"
              >
                CONTRIBUTING.md
              </a>
              <span className="text-muted/40">·</span>
              <a
                href="https://github.com/AvarchLLC/eipreview"
                target="_blank"
                rel="noreferrer"
                className="hover:text-fg transition-colors"
              >
                GitHub Repository
              </a>
              <span className="text-muted/40">·</span>
              <a
                href="https://eips.ethereum.org"
                target="_blank"
                rel="noreferrer"
                className="hover:text-fg transition-colors"
              >
                eips.ethereum.org
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Dialog Modals */}
      {showValidation && (
        <ValidationDialog
          messages={messages}
          repo={repo}
          context={tab === "pr" && importedPr ? `PR #${importedPr.prNumber}` : ""}
          onJump={handleJump}
          onClose={() => setShowValidation(false)}
          onOpenGuide={() => {
            setShowValidation(false);
            setShowGuide(true);
          }}
        />
      )}
      {showGuide && <GuideDialog onClose={() => setShowGuide(false)} />}
    </div>
  );
}

/** Clean Ethereum Diamond Emblem Logo (matching the favicon design) */
function Logo() {
  return (
    <div className="flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
      <svg viewBox="0 0 32 32" className="h-8 w-8 sm:h-9 sm:w-9 drop-shadow-xs" fill="none" aria-hidden>
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

function PrBanner({ pr }: { pr: ImportedPr }) {
  const tone =
    pr.prState === "merged"
      ? "text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40"
      : pr.prState === "closed"
      ? "text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40"
      : pr.prState === "draft"
      ? "text-muted border-border bg-card"
      : "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40";

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-3.5 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <GitPullRequest className="h-4 w-4 text-indigo-500" />
        <a
          href={pr.prUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-fg hover:underline"
        >
          PR #{pr.prNumber}
          <ExternalLink className="h-3 w-3 opacity-50" />
        </a>
        <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", tone)}>
          {pr.prState}
        </span>
        <span className="font-mono text-[11px] text-muted">{pr.filename}</span>
      </div>
      {pr.prTitle && <p className="mt-1 text-xs text-body">{pr.prTitle}</p>}
      {pr.proposalFiles && pr.proposalFiles.length > 1 && (
        <p className="mt-1 text-[11px] text-muted">
          Reviewing {pr.filename.split("/").pop()} ({pr.proposalFiles.length} files in PR).
        </p>
      )}
    </div>
  );
}
