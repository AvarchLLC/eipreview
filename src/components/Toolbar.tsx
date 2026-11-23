import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Columns2,
  Download,
  Eye,
  GitPullRequest,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";
import type { RepoKind, TabMode, ViewMode } from "../lib/types";
import { cn } from "../lib/cn";

interface Props {
  tab: TabMode;
  setTab: (t: TabMode) => void;
  repo: RepoKind;
  setRepo: (r: RepoKind) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  isMobile: boolean;
  importQuery: string;
  setImportQuery: (v: string) => void;
  importing: boolean;
  importError: string | null;
  onImport: () => void;
  onValidate: () => void;
  onDownload: () => void;
  onCreatePr?: () => void;
  onShareDraft?: () => void;
  onResetDraft?: () => void;
  draftSaveStatus?: "saved" | "saving" | "idle";
  lastSavedTime?: number | null;
  validating: boolean;
  validated: boolean;
  issueCount: number;
  onShowIssues: () => void;
  isDraftEmpty: boolean;
  hasActivePr?: boolean;
  onBackToPrList?: () => void;
}

const TABS: { key: TabMode; label: (r: RepoKind) => string; icon: typeof Plus }[] = [
  { key: "new", label: (r) => `New ${r.toUpperCase()}`, icon: Plus },
  { key: "import", label: (r) => `Import ${r.toUpperCase()}`, icon: Search },
  { key: "pr", label: () => "Review PR", icon: GitPullRequest },
];

export function Toolbar(p: Props) {
  const pillGroup =
    "inline-flex items-center rounded-lg border border-border bg-zinc-100 dark:bg-zinc-900 p-0.5 gap-0.5";
  const pillItem = (active: boolean, colorTone?: string) =>
    cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-md select-none",
      active
        ? cn("bg-card text-fg shadow-xs font-semibold", colorTone)
        : "text-muted hover:text-fg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
    );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      {/* Left controls: Mode & Import */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mode Selector */}
        <div className={pillGroup}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => p.setTab(t.key)}
              className={pillItem(p.tab === t.key)}
            >
              <t.icon
                className={cn(
                  "h-3.5 w-3.5",
                  t.key === "pr"
                    ? "text-violet-500"
                    : t.key === "new"
                    ? "text-indigo-500"
                    : "opacity-70"
                )}
              />
              {t.label(p.repo)}
            </button>
          ))}
        </div>

        {/* Import search box */}
        {(p.tab === "import" || p.tab === "pr") && (
          <div className="flex items-center gap-1.5">
            {p.tab === "pr" && p.hasActivePr && p.onBackToPrList && (
              <button
                onClick={p.onBackToPrList}
                title="Return to Open PRs feed"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-fg rounded-lg border border-border bg-card transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-violet-500" />
                <span className="hidden sm:inline">All PRs</span>
              </button>
            )}

            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted/60" />
              <input
                value={p.importQuery}
                onChange={(e) => p.setImportQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && p.onImport()}
                placeholder={p.tab === "pr" ? "GitHub PR number…" : `${p.repo.toUpperCase()} number (e.g. 1559)`}
                className="w-52 sm:w-64 rounded-lg border border-border bg-card py-1.5 pl-8 pr-16 text-xs text-fg placeholder:text-muted/60 outline-none transition-all focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
              />
              <div className="absolute right-1 flex items-center">
                {p.importQuery.trim() ? (
                  <button
                    onClick={p.onImport}
                    disabled={p.importing}
                    title="Fetch proposal from GitHub (Enter)"
                    className="inline-flex items-center gap-1 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-2 py-0.5 text-[11px] font-semibold shadow-xs transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {p.importing ? (
                      <Loader2 className="h-3 w-3 animate-spin text-indigo-400 dark:text-indigo-600" />
                    ) : (
                      <>
                        <span>Fetch</span>
                        <span className="opacity-60 text-[10px]">↵</span>
                      </>
                    )}
                  </button>
                ) : (
                  <kbd
                    title="Press Enter to search"
                    className="pointer-events-none inline-flex items-center rounded border border-border bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-muted shadow-2xs mr-1 select-none"
                  >
                    ↵
                  </kbd>
                )}
              </div>
            </div>
            {p.importError && (
              <span className="max-w-[160px] truncate text-[11px] font-medium text-error" title={p.importError}>
                {p.importError}
              </span>
            )}
          </div>
        )}

        {/* Auto-Save & Crash Recovery status (in /new mode) */}
        {p.tab === "new" && (
          <div className="flex items-center gap-2 pl-0.5">
            {p.draftSaveStatus === "saving" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-50/60 dark:bg-amber-950/40 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Saving…</span>
              </span>
            )}
            {p.draftSaveStatus === "saved" && !p.isDraftEmpty && (
              <span
                title={
                  p.lastSavedTime
                    ? `Auto-saved locally at ${new Date(p.lastSavedTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Auto-saved to local browser storage"
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-50/60 dark:bg-emerald-950/40 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 select-none"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Saved locally</span>
              </span>
            )}
            {p.onResetDraft && !p.isDraftEmpty && (
              <button
                onClick={p.onResetDraft}
                title="Reset draft to blank template"
                className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors px-2 py-1 rounded-md hover:bg-rose-50/50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Reset to blank</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right controls: Repo, View, Validation & Actions */}
      {!(p.tab === "pr" && !p.hasActivePr) && (
        <div className="flex flex-wrap items-center gap-2">
        {/* Proposal Type Selector */}
        <div className={pillGroup}>
          {(["eip", "erc", "rip"] as RepoKind[]).map((r) => {
            const active = p.repo === r;
            const tone =
              r === "eip"
                ? "text-indigo-600 dark:text-indigo-400"
                : r === "erc"
                ? "text-violet-600 dark:text-violet-400"
                : "text-sky-600 dark:text-sky-400";
            return (
              <button
                key={r}
                onClick={() => p.setRepo(r)}
                className={pillItem(active, tone)}
              >
                {r.toUpperCase()}s
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div className={pillGroup}>
          {([
            { k: "split" as ViewMode, icon: Columns2, title: "Split view", desktopOnly: true },
            { k: "edit" as ViewMode, icon: Pencil, title: "Edit only" },
            { k: "preview" as ViewMode, icon: Eye, title: "Preview only" },
          ])
            .filter((v) => !(p.isMobile && v.desktopOnly))
            .map((v) => {
              const effective = p.isMobile && p.view === "split" ? "edit" : p.view;
              return (
                <button
                  key={v.k}
                  onClick={() => p.setView(v.k)}
                  title={v.title}
                  className={pillItem(effective === v.k)}
                >
                  <v.icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
        </div>

        {/* Validation status badge */}
        {p.issueCount > 0 && !p.validated && (
          <button
            onClick={p.onShowIssues}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning-soft px-2.5 py-1.5 text-xs font-medium text-warning hover:opacity-90 transition-opacity shadow-2xs"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              {p.issueCount} {p.issueCount === 1 ? "issue" : "issues"}
            </span>
          </button>
        )}

        {p.validated && p.issueCount === 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success-soft px-2.5 py-1.5 text-xs font-medium text-success shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Ready</span>
          </span>
        )}

        {/* Validate button */}
        <button
          onClick={p.onValidate}
          disabled={p.validating || p.isDraftEmpty}
          title={p.isDraftEmpty ? "Enter proposal details to validate" : "Validate proposal formatting & CI rules"}
          className="group relative h-8 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white border border-zinc-700/60 dark:border-zinc-700 px-3 text-xs font-semibold tracking-tight shadow-xs transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {p.validating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400 shrink-0" />
          ) : p.validated && p.issueCount === 0 ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-200 shrink-0" />
          )}
          <span className="relative font-medium tracking-tight">Validate</span>
        </button>

        {/* Share draft button */}
        {p.tab === "new" && p.onShareDraft && (
          <button
            onClick={p.onShareDraft}
            disabled={p.isDraftEmpty}
            title={p.isDraftEmpty ? "Draft is empty — add content to share" : "Share draft via private compressed link"}
            className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-fg shadow-2xs transition-all duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 opacity-70 shrink-0" />
            <span className="hidden sm:inline">Share Draft</span>
          </button>
        )}

        {/* Download draft button */}
        <button
          onClick={p.onDownload}
          disabled={p.isDraftEmpty}
          title={p.isDraftEmpty ? "Draft is empty — add content to export" : "Download Markdown file"}
          className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-fg shadow-2xs transition-all duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 opacity-70 shrink-0" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* GitHub action button (Create PR / Edit on GitHub / View PR) */}
        {p.onCreatePr && p.tab === "new" && (
          <button
            onClick={p.onCreatePr}
            disabled={p.isDraftEmpty}
            title={p.isDraftEmpty ? "Draft is empty — add content before creating a PR" : "Create Pull Request on GitHub"}
            className="h-8 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold px-3 text-xs shadow-xs transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <GitPullRequest className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Create PR ↗</span>
          </button>
        )}
        {p.onCreatePr && p.tab === "import" && (
          <button
            onClick={p.onCreatePr}
            disabled={p.isDraftEmpty}
            title={p.isDraftEmpty ? "No proposal loaded" : "Update proposal on GitHub"}
            className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-fg shadow-2xs transition-all duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <GitPullRequest className="h-3.5 w-3.5 opacity-70 shrink-0" />
            <span className="hidden sm:inline">Edit on GitHub ↗</span>
          </button>
        )}
        {p.onCreatePr && p.tab === "pr" && (
          <button
            onClick={p.onCreatePr}
            title="Open PR on GitHub"
            className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-fg shadow-2xs transition-all duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.97] cursor-pointer"
          >
            <GitPullRequest className="h-3.5 w-3.5 opacity-70 shrink-0" />
            <span className="hidden sm:inline">GitHub PR ↗</span>
          </button>
        )}
      </div>
      )}
    </div>
  );
}
