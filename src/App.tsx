import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, GitPullRequest, Heart } from "lucide-react";
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

  // Mobile detection, the split pane collapses to one column on phones.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Two-way sync between the form and the raw Markdown.
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

  // Reset when the context changes.
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
    // A short tick so the dialog paints before work (and feels responsive).
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
    <div className="flex h-full flex-col bg-bg text-body">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1600px] px-3 py-2.5 sm:px-5">
          <div className="mb-2.5 flex items-center gap-2.5">
            <Logo />
            <div className="leading-none">
              <div className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-fg">EIP Review</div>
              <div className="mt-0.5 text-[10px] font-medium text-muted">Author · validate · review</div>
            </div>
          </div>
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

      {/* Main */}
      <main className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col overflow-hidden px-0">
        <div className={cn("flex min-h-0 flex-1 overflow-hidden", effectiveView === "split" ? "flex-row" : "flex-col")}>
          {showEdit && (
            <div className={cn("min-h-0 overflow-y-auto p-3 sm:p-5", effectiveView === "split" ? "w-1/2 border-r border-border" : "w-full")}>
              {importedPr && <PrBanner pr={importedPr} />}
              <Editor data={data} repo={repo} onChange={handleField} issuesByField={issuesByField} />
            </div>
          )}
          {showOutput && (
            <div className={cn("min-h-0 bg-card/20", effectiveView === "split" ? "w-1/2" : "w-full")}>
              <OutputPane ref={codeRef} markdown={markdown} onMarkdownChange={handleMarkdown} tab={outputTab} onTab={setOutputTab} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-bg px-4 py-2.5 sm:px-5">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            Build with <Heart className="h-3 w-3 fill-primary text-primary" /> from
            <a href="https://eipsinsight.com" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
              EIPsInsight
            </a>
          </span>
        </div>
      </footer>

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
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-fg">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 17l5-5 4 3 6-7" />
        <path d="M18 5h3v3" />
      </svg>
    </div>
  );
}

function PrBanner({ pr }: { pr: ImportedPr }) {
  const tone =
    pr.prState === "merged"
      ? "text-info"
      : pr.prState === "closed"
      ? "text-error"
      : pr.prState === "draft"
      ? "text-muted"
      : "text-primary";
  return (
    <div className="mb-4 rounded-xl border border-primary/25 bg-primary-soft p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <GitPullRequest className="h-4 w-4 text-primary" />
        <a href={pr.prUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg hover:text-primary">
          PR #{pr.prNumber}
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
        <span className={cn("rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", tone)}>{pr.prState}</span>
        <span className="font-mono text-[11px] text-muted">{pr.filename}</span>
      </div>
      {pr.prTitle && <p className="mt-1.5 text-xs text-body">{pr.prTitle}</p>}
      {pr.proposalFiles && pr.proposalFiles.length > 1 && (
        <p className="mt-1.5 text-[11px] text-muted">
          This PR touches {pr.proposalFiles.length} proposal files, reviewing {pr.filename.split("/").pop()}.
        </p>
      )}
    </div>
  );
}
