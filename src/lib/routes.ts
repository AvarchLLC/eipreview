import type { RepoKind, TabMode } from "./types";

export interface ParsedRoute {
  page: "landing" | "editor";
  tab: TabMode;
  repo: RepoKind;
  query?: string;
}

/**
 * Parses the current window URL (pathname, search parameters, or hash)
 * into a typed route state.
 */
export function parseCurrentRoute(): ParsedRoute {
  if (typeof window === "undefined") {
    return { page: "landing", tab: "new", repo: "eip" };
  }

  // Normalize path; handle hash fallback (#/review/12660 or #/eip/1559)
  let path = window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
  if (path === "/" && window.location.hash.startsWith("#/")) {
    path = window.location.hash.slice(1).toLowerCase().replace(/\/+$/, "") || "/";
  }

  const searchParams = new URLSearchParams(window.location.search);
  const repoParam = (searchParams.get("repo")?.toLowerCase() || "") as RepoKind;
  const initialRepo: RepoKind = repoParam === "erc" || repoParam === "rip" ? repoParam : "eip";

  // 1. Landing / About Page
  if (path === "/" || path === "" || path === "/about") {
    return { page: "landing", tab: "new", repo: initialRepo };
  }

  // 2. New Proposal (/new, /new/eip, /new/erc, /new/rip)
  if (path === "/new" || path.startsWith("/new/")) {
    const subRepo = path.split("/")[2] as RepoKind;
    const r: RepoKind = subRepo === "erc" || subRepo === "rip" ? subRepo : initialRepo;
    return { page: "editor", tab: "new", repo: r };
  }

  // 3. Review Pull Request (/review, /review/:id, /pr, /pr/:id)
  if (
    path === "/review" ||
    path.startsWith("/review/") ||
    path === "/pr" ||
    path.startsWith("/pr/")
  ) {
    const parts = path.split("/").filter(Boolean);
    const id = parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : undefined;
    return { page: "editor", tab: "pr", repo: initialRepo, query: id };
  }

  // 4. Direct EIP import (/eip/:id)
  if (path.startsWith("/eip/")) {
    const id = path.split("/")[2]?.replace(/[^0-9]/g, "");
    return { page: "editor", tab: "import", repo: "eip", query: id || undefined };
  }

  // 5. Direct ERC import (/erc/:id)
  if (path.startsWith("/erc/")) {
    const id = path.split("/")[2]?.replace(/[^0-9]/g, "");
    return { page: "editor", tab: "import", repo: "erc", query: id || undefined };
  }

  // 6. Direct RIP import (/rip/:id)
  if (path.startsWith("/rip/")) {
    const id = path.split("/")[2]?.replace(/[^0-9]/g, "");
    return { page: "editor", tab: "import", repo: "rip", query: id || undefined };
  }

  // 7. General Import (/import, /import/:id)
  if (path === "/import" || path.startsWith("/import/")) {
    const parts = path.split("/").filter(Boolean);
    const id = parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : undefined;
    return { page: "editor", tab: "import", repo: initialRepo, query: id };
  }

  // Default fallback to landing
  return { page: "landing", tab: "new", repo: "eip" };
}

/**
 * Builds the canonical pathname for a given application state.
 */
export function buildRouteUrl(state: {
  page: "landing" | "editor";
  tab: TabMode;
  repo: RepoKind;
  query?: string;
}): string {
  if (state.page === "landing") return "/";

  if (state.tab === "new") {
    return state.repo !== "eip" ? `/new?repo=${state.repo}` : "/new";
  }

  if (state.tab === "pr") {
    if (state.query && /^\d+$/.test(state.query.trim())) {
      return `/review/${state.query.trim()}`;
    }
    return "/review";
  }

  if (state.tab === "import") {
    if (state.query && /^\d+$/.test(state.query.trim())) {
      return `/${state.repo}/${state.query.trim()}`;
    }
    return "/import";
  }

  return "/new";
}
