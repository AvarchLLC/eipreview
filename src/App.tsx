import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ExternalLink, Github, GitPullRequest, Heart } from "lucide-react";
import { Toolbar } from "./components/Toolbar";
import { Editor } from "./components/Editor";
import { OutputPane } from "./components/OutputPane";
import { ValidationDialog } from "./components/ValidationDialog";
import { GuideDialog } from "./components/GuideDialog";
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

export default function App() {
  const { theme, toggle } = useTheme();

  const [tab, setTab] = useState<TabMode>("new");
  const [repo, setRepo] = useState<RepoKind>("eip");
  const [view, setView] = useState<ViewMode>("split");
  const [outputTab, setOutputTab] = useState<"code" | "preview">("code");

  const [data, setData] = useState<ProposalData>({ ...EMPTY_PROPOSAL });
  const [markdown, setMarkdown] = useState<string>(() => generateMarkdown(EMPTY_PROPOSAL));
  const [lastEdited, setLastEdited] = useState<"form" | "code">("form");

  const [messages, setMessages] = useState<ValidationMessage[]>([]);
  const [validated, setValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [importQuery, setImportQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedPr, setImportedPr] = useState<ImportedPr | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const codeRef = useRef<HTMLTextAreaElement | null>(null);

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

  const handleMarkdown = useCallback((value: string) => {
    setLastEdited("code");
    setMarkdown(value);
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

  const jumpToLine = useCallback(
    (line?: number) => {
      if (!line) return;
      setShowValidation(false);
      setOutputTab("code");
      setView(isMobile ? "preview" : "split");
      window.setTimeout(() => {
        const ta = codeRef.current;
        if (!ta) return;
        const lines = ta.value.split("\n");
        let start = 0;
        for (let i = 0; i < line - 1 && i < lines.length; i++) start += lines[i].length + 1;
        ta.focus();
        ta.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));
        ta.scrollTop = Math.max(0, (line - 4) * 22);
      }, 60);
    },
    [isMobile]
  );

  const issuesByField = useMemo(() => {
    const map: Record<string, ValidationMessage[]> = {};
    for (const msg of messages) {
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

  return (
    <div className="min-h-screen flex flex-col bg-bg text-body">
      {/* Top Navigation Header (Untitled UI / Linear Clean Navbar) */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1600px] px-3.5 py-2.5 sm:px-6">
          {/* Brand Row */}
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight text-fg">EIP Review</span>
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 px-2 py-0.5 text-[10px] font-medium">
                    v0.1.0
                  </span>
                </div>
                <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                  <span>Author & Validate Proposals</span>
                  <span className="text-muted/40">·</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">EIP · ERC · RIP</span>
                </div>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="flex items-center gap-2.5 text-xs">
              <a
                href="https://github.com/AvarchLLC/EIPsInsight"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted hover:text-fg hover:border-fg/30 transition-colors shadow-2xs"
                title="View on GitHub"
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
              <Editor data={data} repo={repo} onChange={handleField} issuesByField={issuesByField} />
            </div>
          )}
          {showOutput && (
            <div className={cn("bg-card", effectiveView === "split" ? "w-1/2" : "w-full")}>
              <OutputPane
                ref={codeRef}
                markdown={markdown}
                onMarkdownChange={handleMarkdown}
                tab={outputTab}
                onTab={setOutputTab}
              />
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
              <div className="flex items-center gap-2">
                <Logo />
                <span className="text-sm font-bold tracking-tight text-fg">EIP Review</span>
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">Validation Stack</p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>eipw CI Linter (Parity)</span>
                </li>
                <li className="flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  <span>RFC 2119 / 8174 Keywords</span>
                </li>
                <li className="flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>CC0 1.0 Public Domain</span>
                </li>
                <li className="flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>GitHub REST API Integration</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <div className="flex items-center gap-2 text-[11px]">
              <span>© 2026 EIP Review</span>
              <span className="text-muted/40">·</span>
              <span>Released under CC0 1.0 Universal</span>
              <span className="text-muted/40">·</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Open Source</span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                100% Client-Side Engine
              </span>
              <span className="text-muted/70 hidden sm:inline">Zero tracking · No data stored</span>
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
          onJump={jumpToLine}
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

function Logo() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-indigo-400 dark:bg-zinc-800 dark:text-indigo-300 ring-1 ring-indigo-500/20 shadow-xs">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M12 2L4.5 14.5L12 18.5L19.5 14.5L12 2Z" fill="currentColor" />
        <path d="M4.5 14.5L12 22L19.5 14.5L12 18.5L4.5 14.5Z" fill="#818cf8" opacity="0.75" />
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
