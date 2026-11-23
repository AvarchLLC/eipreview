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
}

export interface PrFeedResult {
  items: PrFeedItem[];
  fromCache: boolean;
  error?: string;
  rateLimited?: boolean;
}

const REPO_TARGETS: Record<RepoKind, string> = {
  eip: "ethereum/EIPs",
  erc: "ethereum/ERCs",
  rip: "ethereum/RIPs",
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  timestamp: number;
  items: PrFeedItem[];
}

function getCacheKey(repo: RepoKind): string {
  return `eipreview_prs_cache_${repo}`;
}

export async function fetchOpenPrs(repo: RepoKind, forceRefresh = false): Promise<PrFeedResult> {
  const target = REPO_TARGETS[repo];
  const cacheKey = getCacheKey(repo);

  // 1. Check sessionStorage cache if not force refreshing
  if (!forceRefresh && typeof window !== "undefined" && window.sessionStorage) {
    try {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed: CachedData = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.items)) {
          return { items: parsed.items, fromCache: true };
        }
      }
    } catch (e) {
      console.warn("Error reading PR cache from sessionStorage:", e);
    }
  }

  // 2. Fetch from GitHub API
  try {
    const res = await fetch(
      `https://api.github.com/repos/${target}/pulls?state=open&sort=updated&direction=desc&per_page=30`,
      {
        headers: { Accept: "application/vnd.github+json" },
      }
    );

    if (res.status === 403) {
      // Check for stale cache fallback
      const stale = getStaleCache(repo);
      if (stale) {
        return { items: stale, fromCache: true, rateLimited: true, error: "GitHub API rate limit reached. Showing cached list." };
      }
      return {
        items: [],
        fromCache: false,
        rateLimited: true,
        error: "GitHub API unauthenticated hourly rate limit reached. You can still review any PR directly by number above.",
      };
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to load pull requests from ${target}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response structure from GitHub API");
    }

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
    }));

    // Save to sessionStorage
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const cacheEntry: CachedData = { timestamp: Date.now(), items };
        window.sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch (e) {
        console.warn("Error saving PRs to sessionStorage:", e);
      }
    }

    return { items, fromCache: false };
  } catch (err) {
    const stale = getStaleCache(repo);
    if (stale) {
      return { items: stale, fromCache: true, error: "Network error fetching fresh PRs. Showing cached list." };
    }
    return {
      items: [],
      fromCache: false,
      error: err instanceof Error ? err.message : "Unable to fetch open pull requests.",
    };
  }
}

function getStaleCache(repo: RepoKind): PrFeedItem[] | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(getCacheKey(repo));
    if (raw) {
      const parsed: CachedData = JSON.parse(raw);
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed.items;
      }
    }
  } catch {
    // ignore
  }
  return null;
}
