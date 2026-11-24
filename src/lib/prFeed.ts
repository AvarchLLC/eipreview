import type { RepoKind } from "./types";

export interface PrFeedLabel {
  name: string;
  color?: string;
}

export interface PrFeedItem {
  number: number;
  title: string;
  author: string;
  avatarUrl?: string;
  updatedAt: string;
  createdAt: string;
  isDraft: boolean;
  labels: PrFeedLabel[];
  url: string;
  // Enriched signals from EIPsInsight database
  source?: "eipsinsight" | "github";
  govState?: string;
  waitDays?: number;
  needsAttention?: boolean;
  ciFailing?: boolean;
  hasConflicts?: boolean;
  attentionReason?: string;
}

export interface PrFeedResult {
  items: PrFeedItem[];
  fromCache: boolean;
  source?: "eipsinsight" | "github";
  total?: number;
  hasMore?: boolean;
  page?: number;
  error?: string;
  rateLimited?: boolean;
}

const REPO_TARGETS: Record<RepoKind, string> = {
  eip: "ethereum/EIPs",
  erc: "ethereum/ERCs",
  rip: "ethereum/RIPs",
};

const REPO_ORPC_PARAM: Record<RepoKind, "eips" | "ercs" | "rips"> = {
  eip: "eips",
  erc: "ercs",
  rip: "rips",
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 50;

interface CachedData {
  timestamp: number;
  items: PrFeedItem[];
  source?: "eipsinsight" | "github";
  total?: number;
  hasMore?: boolean;
}

function getCacheKey(repo: RepoKind): string {
  return `eipreview_prs_cache_${repo}`;
}

/**
 * Fetch open PRs using a smart hybrid pipeline:
 * 1. Checks 5-minute browser sessionStorage cache for page 1 (0ms).
 * 2. Attempts EIPsInsight ORPC database API for enriched governance & zero GitHub rate limits.
 * 3. Gracefully falls back to direct GitHub REST API if EIPsInsight is unavailable or CORS-blocked.
 */
export async function fetchOpenPrs(
  repo: RepoKind,
  forceRefresh = false,
  page = 1
): Promise<PrFeedResult> {
  const target = REPO_TARGETS[repo];
  const cacheKey = getCacheKey(repo);

  // 1. Check sessionStorage cache for page 1 if not force-refreshing
  if (!forceRefresh && page === 1 && typeof window !== "undefined" && window.sessionStorage) {
    try {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed: CachedData = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.items) && parsed.items.length > 0) {
          // If already enriched with EIPsInsight, return cached
          if (parsed.source === "eipsinsight") {
            return {
              items: parsed.items,
              fromCache: true,
              source: parsed.source,
              total: parsed.total,
              hasMore: parsed.hasMore,
              page: 1,
            };
          }
        }
      }
    } catch (e) {
      console.warn("Error reading PR cache from sessionStorage:", e);
    }
  }

  // 2. Strategy A: Query EIPsInsight Database API
  // When running on localhost / 127.0.0.1, use Vite's proxy path (/rpc) to bypass browser CORS preflight
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0");

  const eipsInsightUrl = isLocal
    ? "/rpc/tools/getOpenPRBoard"
    : "https://eipsinsight.com/rpc/tools/getOpenPRBoard";

  try {
    const eipsInsightRes = await fetch(eipsInsightUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          repo: REPO_ORPC_PARAM[repo],
          pageSize: PAGE_SIZE,
          page,
          sortBy: "created",
          sortDir: "desc",
        },
      }),
    });

    if (eipsInsightRes.ok) {
      const data = await eipsInsightRes.json();
      const rows = data?.json?.rows;
      const total = typeof data?.json?.total === "number" ? data.json.total : undefined;
      const hasMore = typeof total === "number" ? page * PAGE_SIZE < total : (rows?.length ?? 0) === PAGE_SIZE;

      if (Array.isArray(rows) && rows.length > 0) {
        const items: PrFeedItem[] = rows.map((r: any) => ({
          number: r.prNumber,
          title: r.title || `PR #${r.prNumber}`,
          author: r.author || "unknown",
          avatarUrl: r.author ? `https://github.com/${r.author}.png` : undefined,
          updatedAt: r.createdAt || new Date().toISOString(),
          createdAt: r.createdAt || new Date().toISOString(),
          isDraft: Boolean(
            r.govState?.toLowerCase() === "draft" ||
            r.govState?.toLowerCase() === "awaited" ||
            r.processType?.toLowerCase() === "pr draft" ||
            (Array.isArray(r.labels) && r.labels.some((l: string) => l.toLowerCase() === "s-draft" || l.toLowerCase() === "draft"))
          ),
          labels: Array.isArray(r.labels) ? r.labels.map((l: string) => ({ name: l })) : [],
          url: `https://github.com/${target}/pull/${r.prNumber}`,
          source: "eipsinsight",
          govState: r.govState,
          waitDays: r.waitDays,
          needsAttention: r.needsAttention,
          ciFailing: r.ciFailing,
          hasConflicts: r.hasConflicts,
          attentionReason: r.attentionReason,
        }));

        if (page === 1) {
          saveToCache(cacheKey, items, "eipsinsight", total, hasMore);
        }
        return { items, fromCache: false, source: "eipsinsight", total, hasMore, page };
      }
    }
  } catch (err) {
    // EIPsInsight API or CORS unavailable — continue seamlessly to GitHub fallback
    console.info("EIPsInsight API unavailable, falling back to GitHub API:", err);
  }

  // 3. Strategy B: GitHub REST API Fallback
  try {
    const res = await fetch(
      `https://api.github.com/repos/${target}/pulls?state=open&sort=updated&direction=desc&per_page=${PAGE_SIZE}&page=${page}`,
      {
        headers: { Accept: "application/vnd.github+json" },
      }
    );

    if (res.status === 403) {
      const stale = getStaleCache(repo);
      if (stale) {
        return {
          items: stale.items,
          fromCache: true,
          source: stale.source,
          total: stale.total,
          hasMore: stale.hasMore,
          rateLimited: true,
          error: "GitHub API rate limit reached. Showing cached list.",
        };
      }
      return {
        items: [],
        fromCache: false,
        rateLimited: true,
        error: "GitHub API unauthenticated rate limit reached. You can still review any PR directly by number above.",
      };
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to load pull requests from ${target}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response structure from GitHub API");
    }

    const hasMore = data.length === PAGE_SIZE;
    const items: PrFeedItem[] = data.map((pr: any) => ({
      number: pr.number,
      title: pr.title || `PR #${pr.number}`,
      author: pr.user?.login || "unknown",
      avatarUrl: pr.user?.avatar_url,
      updatedAt: pr.updated_at,
      createdAt: pr.created_at,
      isDraft: Boolean(pr.draft),
      labels: Array.isArray(pr.labels)
        ? pr.labels.map((l: any) => ({ name: l.name, color: l.color }))
        : [],
      url: pr.html_url,
      source: "github",
    }));

    if (page === 1) {
      saveToCache(cacheKey, items, "github", undefined, hasMore);
    }
    return { items, fromCache: false, source: "github", hasMore, page };
  } catch (err) {
    const stale = getStaleCache(repo);
    if (stale) {
      return {
        items: stale.items,
        fromCache: true,
        source: stale.source,
        total: stale.total,
        hasMore: stale.hasMore,
        error: "Network error fetching fresh PRs. Showing cached list.",
      };
    }
    return {
      items: [],
      fromCache: false,
      error: err instanceof Error ? err.message : "Unable to fetch open pull requests.",
    };
  }
}

function saveToCache(
  cacheKey: string,
  items: PrFeedItem[],
  source: "eipsinsight" | "github",
  total?: number,
  hasMore?: boolean
) {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const cacheEntry: CachedData = { timestamp: Date.now(), items, source, total, hasMore };
      window.sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (e) {
      console.warn("Error saving PRs to sessionStorage:", e);
    }
  }
}

function getStaleCache(repo: RepoKind): CachedData | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(getCacheKey(repo));
    if (raw) {
      const parsed: CachedData = JSON.parse(raw);
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}
