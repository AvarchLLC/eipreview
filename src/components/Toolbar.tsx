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

const TABS: { key: TabMode; label: (r: RepoKind) => string; icon?: typeof GitPullRequest }[] = [
  { key: "new", label: (r) => `New ${r.toUpperCase()}` },
  { key: "import", label: (r) => `Import ${r.toUpperCase()}` },
  { key: "pr", label: () => "Review PR", icon: GitPullRequest },
];

export function Toolbar(p: Props) {
  const seg = "inline-flex items-center rounded-lg border border-border/70 bg-card/50 p-0.5";
  const item = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
      active ? "bg-bg text-primary shadow-sm ring-1 ring-border" : "text-muted hover:text-fg"
    );

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {/* Mode */}
      <div className={seg}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => p.setTab(t.key)} className={item(p.tab === t.key)}>
            {t.icon && <t.icon className="h-3.5 w-3.5" />}
            {t.label(p.repo)}
          </button>
        ))}
      </div>

      {/* Import search */}
      {(p.tab === "import" || p.tab === "pr") && (
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <input
              value={p.importQuery}
              onChange={(e) => p.setImportQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && p.onImport()}
              placeholder={p.tab === "pr" ? "PR #" : `${p.repo.toUpperCase()} number`}
              className="w-40 rounded-lg border border-border bg-card/50 py-1.5 pl-3 pr-8 text-xs text-fg placeholder:text-muted/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
            <button onClick={p.onImport} disabled={p.importing} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-card">
              {p.importing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Search className="h-3.5 w-3.5 text-muted" />}
            </button>
          </div>
          {p.importError && (
            <span className="max-w-[180px] truncate text-xs text-error" title={p.importError}>
              {p.importError}
            </span>
          )}
        </div>
      )}

      {/* Repo */}
      <div className={cn(seg, "ml-auto")}>
        {(["eip", "erc", "rip"] as RepoKind[]).map((r) => (
          <button key={r} onClick={() => p.setRepo(r)} className={item(p.repo === r)}>
            {r.toUpperCase()}s
          </button>
        ))}
      </div>

      {/* View */}
      <div className={seg}>
        {([
          { k: "split" as ViewMode, icon: Columns2, title: "Split", desktopOnly: true },
          { k: "edit" as ViewMode, icon: Pencil, title: "Edit" },
          { k: "preview" as ViewMode, icon: Eye, title: "Preview" },
        ])
          .filter((v) => !(p.isMobile && v.desktopOnly))
          .map((v) => {
            const effective = p.isMobile && p.view === "split" ? "edit" : p.view;
            return (
              <button key={v.k} onClick={() => p.setView(v.k)} title={v.title} className={cn("rounded-md px-2.5 py-1.5 transition-all", effective === v.k ? "bg-bg text-primary shadow-sm ring-1 ring-border" : "text-muted hover:text-fg")}>
                <v.icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-l border-border pl-2">
        {p.issueCount > 0 && !p.validated && (
          <button onClick={p.onShowIssues} className="hidden items-center gap-1 text-[11px] font-medium text-warning hover:underline sm:inline-flex">
            <AlertCircle className="h-3.5 w-3.5" />
            {p.issueCount} issue{p.issueCount === 1 ? "" : "s"}
          </button>
        )}
        {p.validated && p.issueCount === 0 && (
          <span className="hidden items-center gap-1 text-[11px] font-medium text-primary sm:inline-flex">
            <CheckCircle2 className="h-3.5 w-3.5" /> Ready
          </span>
        )}
        <button
          onClick={p.onValidate}
          disabled={p.validating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-fg shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {p.validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Validate
        </button>
        <button
          onClick={p.onDownload}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-medium text-body transition-colors hover:bg-card"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download</span>
        </button>
        <div className="flex items-center gap-0.5 border-l border-border pl-1">
          <button onClick={p.onOpenGuide} title="How it works" className="rounded-md p-1.5 text-muted transition-colors hover:bg-card hover:text-primary">
            <BookOpen className="h-4 w-4" />
          </button>
          <button onClick={p.onToggleTheme} title="Toggle theme" className="rounded-md p-1.5 text-muted transition-colors hover:bg-card hover:text-fg">
            {p.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
