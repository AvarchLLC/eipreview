import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Columns2,
  Download,
  Eye,
  GitPullRequest,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
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
  validating: boolean;
  validated: boolean;
  issueCount: number;
  onShowIssues: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenGuide: () => void;
}

const TABS: { key: TabMode; label: (r: RepoKind) => string; icon: typeof Plus }[] = [
  { key: "new", label: (r) => `New ${r.toUpperCase()}`, icon: Plus },
  { key: "import", label: (r) => `Import ${r.toUpperCase()}`, icon: Search },
  { key: "pr", label: () => "Review PR", icon: GitPullRequest },
];

export function Toolbar(p: Props) {
  const pillGroup =
    "inline-flex items-center rounded-lg border border-border bg-zinc-100/70 dark:bg-zinc-800/60 p-0.5 gap-0.5";
  const pillItem = (active: boolean, colorTone?: string) =>
    cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-md select-none",
      active
        ? cn("bg-card text-fg shadow-xs font-semibold", colorTone)
        : "text-muted hover:text-fg hover:bg-card/50"
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
            <div className="relative">
              <input
                value={p.importQuery}
                onChange={(e) => p.setImportQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && p.onImport()}
                placeholder={p.tab === "pr" ? "GitHub PR number…" : `${p.repo.toUpperCase()} number (e.g. 1559)`}
                className="w-48 sm:w-56 rounded-lg border border-border bg-card py-1.5 pl-3 pr-8 text-xs text-fg placeholder:text-muted/60 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
              />
              <button
                onClick={p.onImport}
                disabled={p.importing}
                title="Fetch from GitHub"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg transition-colors"
              >
                {p.importing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {p.importError && (
              <span className="max-w-[160px] truncate text-[11px] font-medium text-error" title={p.importError}>
                {p.importError}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right controls: Repo, View, Validation & Actions */}
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

        {/* Validate button (Untitled UI "Publish changes" style solid dark button with subtle emerald accent) */}
        <button
          onClick={p.onValidate}
          disabled={p.validating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-fg shadow-xs transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {p.validating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-500" />
          )}
          Validate
        </button>

        {/* Download draft button */}
        <button
          onClick={p.onDownload}
          title="Download Markdown file"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-fg shadow-2xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <Download className="h-3.5 w-3.5 opacity-70" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Quick icon toggles */}
        <div className="flex items-center gap-1 border-l border-border pl-2">
          <button
            onClick={p.onOpenGuide}
            title="Validation rules guide"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-card hover:text-indigo-500"
          >
            <BookOpen className="h-4 w-4" />
          </button>
          <button
            onClick={p.onToggleTheme}
            title="Toggle theme"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-card hover:text-fg"
          >
            {p.theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
