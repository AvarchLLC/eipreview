import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  ExternalLink,
  GitPullRequest,
  Loader2,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import type { RepoKind } from "../lib/types";
import { fetchOpenPrs, type PrFeedItem } from "../lib/prFeed";
import { cn } from "../lib/cn";

interface Props {
  repo: RepoKind;
  onSelectRepo: (r: RepoKind) => void;
  onSelectPr: (prNumber: number) => void;
  loadingPrNumber?: number | null;
}

const REPO_INFO: Record<RepoKind, { name: string; org: string; description: string }> = {
  eip: {
    name: "EIPs",
    org: "ethereum/EIPs",
    description: "Core Ethereum consensus, execution, and networking proposals.",
  },
  erc: {
    name: "ERCs",
    org: "ethereum/ERCs",
    description: "Application-level standards: tokens, wallets, sub-protocols, and smart contracts.",
  },
  rip: {
    name: "RIPs",
    org: "ethereum/RIPs",
    description: "Rollup Improvement Proposals for L2 execution and scaling standards.",
  },
};

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function PrExplorer({ repo, onSelectRepo, onSelectPr, loadingPrNumber }: Props) {
  const [prs, setPrs] = useState<PrFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [directNumber, setDirectNumber] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [fromCache, setFromCache] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const activeRepoInfo = REPO_INFO[repo];

  // Load PRs when repo changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetchOpenPrs(repo, false);
      if (cancelled) return;
      setPrs(res.items);
      setFromCache(res.fromCache);
      if (res.error) setErrorNotice(res.error);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  // Force refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setErrorNotice(null);
    const res = await fetchOpenPrs(repo, true);
    setPrs(res.items);
    setFromCache(res.fromCache);
    if (res.error) setErrorNotice(res.error);
    setRefreshing(false);
  };

  // Extract all unique labels for filter chips (skipping primary filter concepts)
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const pr of prs) {
      for (const l of pr.labels) {
        // Normalize label names for quick filters
        const n = l.name.toLowerCase();
        if (n.startsWith("c-") || n.startsWith("t-") || n.startsWith("s-") || n.startsWith("e-")) {
          if (["draft", "s-draft", "review", "s-review", "e-review", "w-review", "w-author", "a-review"].includes(n)) {
            continue;
          }
          set.add(l.name);
        } else if (["core", "erc", "networking", "interface"].includes(n)) {
          set.add(l.name);
        }
      }
    }
    return Array.from(set).slice(0, 8);
  }, [prs]);

  // Compute category counts for primary filter tabs
  const filterCounts = useMemo(() => {
    let waitingAuthor = 0;
    let waitingReview = 0;
    let drafts = 0;
    let ready = 0;

    for (const pr of prs) {
      if (pr.isDraft) drafts++;
      else ready++;

      const isAuthor =
        pr.govState?.toLowerCase().includes("author") ||
        pr.labels.some((l) => l.name.toLowerCase() === "w-author" || l.name.toLowerCase() === "a-review");
      if (isAuthor) waitingAuthor++;

      const isReview =
        pr.govState?.toLowerCase().includes("editor") ||
        Boolean(pr.needsAttention) ||
        pr.labels.some(
          (l) =>
            l.name.toLowerCase().includes("review") ||
            l.name.toLowerCase() === "w-review" ||
            l.name.toLowerCase() === "e-review" ||
            l.name.toLowerCase() === "s-review"
        );
      if (isReview) waitingReview++;
    }

    return { waitingAuthor, waitingReview, drafts, ready };
  }, [prs]);

  // Filtered PR list
  const filteredPrs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return prs.filter((pr) => {
      // 1. Tag / Status filter
      if (selectedTag === "drafts" && !pr.isDraft) return false;
      if (selectedTag === "ready" && pr.isDraft) return false;

      if (selectedTag === "waiting-author") {
        const isAuthor =
          pr.govState?.toLowerCase().includes("author") ||
          pr.labels.some((l) => l.name.toLowerCase() === "w-author" || l.name.toLowerCase() === "a-review");
        if (!isAuthor) return false;
      }

      if (selectedTag === "review") {
        const isReview =
          pr.govState?.toLowerCase().includes("editor") ||
          Boolean(pr.needsAttention) ||
          pr.labels.some(
            (l) =>
              l.name.toLowerCase().includes("review") ||
              l.name.toLowerCase() === "w-review" ||
              l.name.toLowerCase() === "e-review" ||
              l.name.toLowerCase() === "s-review"
          );
        if (!isReview) return false;
      }

      if (
        selectedTag !== "all" &&
        selectedTag !== "drafts" &&
        selectedTag !== "ready" &&
        selectedTag !== "waiting-author" &&
        selectedTag !== "review" &&
        !pr.labels.some((l) => l.name.toLowerCase() === selectedTag.toLowerCase())
      ) {
        return false;
      }

      // 2. Query filter
      if (!q) return true;
      if (String(pr.number).includes(q)) return true;
      if (pr.title.toLowerCase().includes(q)) return true;
      if (pr.author.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [prs, searchQuery, selectedTag]);

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = directNumber.replace(/[^0-9]/g, "");
    if (clean) {
      onSelectPr(Number(clean));
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-8 sm:px-6 space-y-6 animate-in fade-in duration-200">
      {/* Hero / Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <GitPullRequest className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Open Proposal Reviews
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-fg tracking-tight">
            Review Pull Requests on {activeRepoInfo.org}
          </h1>
          <p className="text-xs text-muted max-w-2xl leading-relaxed">
            {activeRepoInfo.description} Select any open pull request below to inspect the rendered document, verify normative keywords, and audit CI parity.
          </p>
        </div>

        {/* Quick direct jump by number */}
        <form onSubmit={handleDirectSubmit} className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-xs text-muted font-mono font-medium">#</span>
            <input
              type="text"
              value={directNumber}
              onChange={(e) => setDirectNumber(e.target.value)}
              placeholder="Jump to PR #"
              className="w-36 sm:w-44 rounded-xl border border-border bg-card py-2 pl-7 pr-3 text-xs text-fg placeholder:text-muted/60 outline-none transition-all focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={!directNumber.trim() || Boolean(loadingPrNumber)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold px-3.5 py-2 text-xs shadow-xs transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loadingPrNumber === Number(directNumber.replace(/[^0-9]/g, "")) ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span>Load PR</span>
            )}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Control Bar: Repo tabs, Search, Filter pills, Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Repo selector */}
        <div className="inline-flex items-center rounded-xl border border-border bg-zinc-100 dark:bg-zinc-900 p-1 gap-1 shrink-0">
          {(["eip", "erc", "rip"] as RepoKind[]).map((r) => {
            const active = repo === r;
            return (
              <button
                key={r}
                onClick={() => onSelectRepo(r)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all select-none cursor-pointer",
                  active
                    ? "bg-card text-fg shadow-xs"
                    : "text-muted hover:text-fg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                )}
              >
                {REPO_INFO[r].name} ({REPO_INFO[r].org.split("/")[1]})
              </button>
            );
          })}
        </div>

        {/* Search input & Refresh */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-muted/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeRepoInfo.name} PRs by title, author, or #…`}
              className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-8 text-xs text-fg placeholder:text-muted/60 outline-none transition-all focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Refresh open PRs from GitHub"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted hover:text-fg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", (refreshing || loading) && "animate-spin text-violet-500")} />
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted mr-1">Filter:</span>
        <button
          onClick={() => setSelectedTag("all")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
            selectedTag === "all"
              ? "bg-violet-600 text-white font-semibold"
              : "border border-border bg-card text-muted hover:text-fg"
          )}
        >
          All ({prs.length})
        </button>

        <button
          onClick={() => setSelectedTag("waiting-author")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5",
            selectedTag === "waiting-author"
              ? "bg-sky-600 text-white font-semibold shadow-xs"
              : "border border-border bg-card text-muted hover:text-fg hover:border-sky-500/30"
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", selectedTag === "waiting-author" ? "bg-white" : "bg-sky-500")} />
          <span>Waiting on Author</span>
          {filterCounts.waitingAuthor > 0 && (
            <span className={cn("text-[10px]", selectedTag === "waiting-author" ? "text-sky-100" : "text-muted")}>
              ({filterCounts.waitingAuthor})
            </span>
          )}
        </button>

        <button
          onClick={() => setSelectedTag("review")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5",
            selectedTag === "review"
              ? "bg-amber-600 text-white font-semibold shadow-xs"
              : "border border-border bg-card text-muted hover:text-fg hover:border-amber-500/30"
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", selectedTag === "review" ? "bg-white" : "bg-amber-500")} />
          <span>Waiting on Review</span>
          {filterCounts.waitingReview > 0 && (
            <span className={cn("text-[10px]", selectedTag === "review" ? "text-amber-100" : "text-muted")}>
              ({filterCounts.waitingReview})
            </span>
          )}
        </button>

        <button
          onClick={() => setSelectedTag("ready")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
            selectedTag === "ready"
              ? "bg-violet-600 text-white font-semibold"
              : "border border-border bg-card text-muted hover:text-fg"
          )}
        >
          Ready for Review
        </button>
        <button
          onClick={() => setSelectedTag("drafts")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
            selectedTag === "drafts"
              ? "bg-violet-600 text-white font-semibold"
              : "border border-border bg-card text-muted hover:text-fg"
          )}
        >
          Drafts ({filterCounts.drafts})
        </button>
        {availableTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              selectedTag === tag
                ? "bg-violet-600 text-white font-semibold"
                : "border border-border bg-card text-muted hover:text-fg"
            )}
          >
            {tag}
          </button>
        ))}

        {fromCache && (
          <span className="ml-auto text-[11px] text-muted flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Cached (5m)</span>
          </span>
        )}
      </div>

      {/* Error or Rate Limit Notice */}
      {errorNotice && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">{errorNotice}</p>
            <p className="text-[11px] opacity-80">
              You can still review any PR directly by typing its number into the jump box above.
            </p>
          </div>
        </div>
      )}

      {/* PR Cards Grid / List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 animate-pulse flex items-center justify-between gap-4"
            >
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
                </div>
                <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
              </div>
              <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      ) : filteredPrs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-muted mx-auto">
            <Search className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-fg">No pull requests match your filter</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {searchQuery
              ? `No PRs found matching "${searchQuery}". Try searching for a different number, author, or keyword.`
              : "No open pull requests found in this category."}
          </p>
          {(searchQuery || selectedTag !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTag("all");
              }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-1.5 text-xs font-semibold text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPrs.map((pr) => {
            const isLoadingThis = loadingPrNumber === pr.number;
            return (
              <div
                key={pr.number}
                onClick={() => onSelectPr(pr.number)}
                className={cn(
                  "group relative rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-all duration-150 hover:border-violet-500/50 hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  isLoadingThis && "border-violet-500 ring-2 ring-violet-500/20"
                )}
              >
                {/* PR Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-200/60 dark:border-violet-800/60 px-2 py-0.5 rounded-md">
                      <span>#{pr.number}</span>
                    </span>

                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted hover:text-fg transition-colors"
                      title="View on GitHub ↗"
                    >
                      <ExternalLink className="h-3 w-3 opacity-60 hover:opacity-100" />
                    </a>

                    {pr.isDraft && (
                      <span className="rounded-md border border-border bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Draft
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      {pr.avatarUrl ? (
                        <img
                          src={pr.avatarUrl}
                          alt={pr.author}
                          className="h-4 w-4 rounded-full border border-border object-cover"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                      <span className="font-medium text-fg">@{pr.author}</span>
                    </div>

                    <span className="text-muted/40">·</span>

                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" />
                      <span>{formatRelativeTime(pr.updatedAt)}</span>
                    </span>

                    {/* Wait Days */}
                    {typeof pr.waitDays === "number" && pr.waitDays > 0 && (
                      <>
                        <span className="text-muted/40">·</span>
                        <span
                          className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-1.5 py-0.5 rounded"
                          title={`Waiting for ${pr.waitDays} days in review`}
                        >
                          ⏱️ {pr.waitDays}d wait
                        </span>
                      </>
                    )}

                    {/* Governance State Badge */}
                    {pr.govState && (
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          pr.govState.toLowerCase().includes("editor")
                            ? "border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                            : pr.govState.toLowerCase().includes("author")
                            ? "border-sky-300 dark:border-sky-700/60 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                            : "border-border bg-zinc-100 dark:bg-zinc-800 text-muted"
                        )}
                      >
                        {pr.govState}
                      </span>
                    )}

                    {/* CI Failing Badge */}
                    {pr.ciFailing && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span>CI Failing</span>
                      </span>
                    )}

                    {/* Needs Attention Badge */}
                    {pr.needsAttention && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
                        title={pr.attentionReason || "Needs editor review"}
                      >
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        <span>Needs Attention</span>
                      </span>
                    )}

                    {/* Has Conflicts Badge */}
                    {pr.hasConflicts && (
                      <span className="rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                        Conflicts
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-fg group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                    {pr.title}
                  </h3>

                  {/* Labels */}
                  {pr.labels.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {pr.labels.slice(0, 5).map((l, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-border bg-zinc-50 dark:bg-zinc-800/40 px-2 py-0.5 font-mono text-[10px] text-muted"
                        >
                          {l.name}
                        </span>
                      ))}
                      {pr.labels.length > 5 && (
                        <span className="text-[10px] text-muted">+{pr.labels.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="shrink-0 pt-2 sm:pt-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPr(pr.number);
                    }}
                    disabled={Boolean(loadingPrNumber)}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold px-4 py-2 text-xs shadow-xs transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading…</span>
                      </>
                    ) : (
                      <>
                        <span>Review Proposal</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
