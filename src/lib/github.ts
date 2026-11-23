import type { ImportedPr, RepoKind } from "./types";

// All requests go straight to GitHub from the browser. raw.githubusercontent.com
// and api.github.com both send permissive CORS headers, so no backend is needed.
// Unauthenticated api.github.com is rate-limited (60/hr per IP); raw has no limit.

const REPO_NAME: Record<RepoKind, string> = {
  eip: "ethereum/EIPs",
  erc: "ethereum/ERCs",
  rip: "ethereum/RIPs",
};

const RAW_PATH: Record<RepoKind, (n: string) => string> = {
  eip: (n) => `EIPS/eip-${n}.md`,
  erc: (n) => `ERCS/erc-${n}.md`,
  rip: (n) => `RIPS/rip-${n}.md`,
};

const PROPOSAL_FILE_RE = /^(EIPS\/eip-|ERCS\/erc-|RIPS\/rip-)[a-zA-Z0-9_-]+\.md$/i;

/** Fetch a published proposal's Markdown by number. Tries ERC fallback for EIP. */
export async function fetchProposal(
  repo: RepoKind,
  num: string
): Promise<{ repo: RepoKind; markdown: string; filename: string }> {
  const order: RepoKind[] = repo === "eip" ? ["eip", "erc"] : [repo];
  for (const r of order) {
    const path = RAW_PATH[r](num);
    const res = await fetch(`https://raw.githubusercontent.com/${REPO_NAME[r]}/master/${path}`);
    if (res.ok) {
      return { repo: r, markdown: await res.text(), filename: path };
    }
  }
  throw new Error(`Could not find ${repo.toUpperCase()}-${num}`);
}

interface PrFile {
  filename: string;
}

interface RawPrMeta {
  title: string;
  author: string;
  url: string;
  state: "open" | "closed" | "merged" | "draft";
  headSha: string;
  headRef?: string;
}

/** Import a pull request's proposal file, fully client-side with resilient fallback. */
export async function importPr(repo: RepoKind, pr: string): Promise<ImportedPr & { markdown: string }> {
  const target = REPO_NAME[repo];
  const headers: HeadersInit = { Accept: "application/vnd.github+json" };

  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0");

  let meta: RawPrMeta | null = null;

  // 1. Stage 1: Try EIPsInsight ORPC github.getPRDetail (Uses authenticated GITHUB_TOKEN on backend, zero IP rate limit)
  try {
    const eipsInsightUrl = isLocal
      ? "/rpc/github/getPRDetail"
      : "https://eipsinsight.com/rpc/github/getPRDetail";

    const orpcRes = await fetch(eipsInsightUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          repo: target,
          number: Number(pr),
        },
      }),
    });

    if (orpcRes.ok) {
      const data = await orpcRes.json();
      const p = data?.json;
      if (p && p.head?.sha) {
        meta = {
          title: p.title || `PR #${pr}`,
          author: p.author?.login || "unknown",
          url: p.externalUrl || `https://github.com/${target}/pull/${pr}`,
          state: p.mergedAt ? "merged" : p.state === "closed" ? "closed" : p.draft ? "draft" : "open",
          headSha: p.head.sha,
          headRef: p.head.ref,
        };
      }
    }
  } catch (err) {
    console.info("EIPsInsight PR detail lookup skipped, falling back to direct GitHub API:", err);
  }

  // 2. Stage 2: Fallback to GitHub REST API if EIPsInsight didn't return PR metadata
  if (!meta) {
    const prRes = await fetch(`https://api.github.com/repos/${target}/pulls/${pr}`, { headers });
    if (prRes.status === 404) throw new Error(`PR #${pr} not found in ${target}`);
    if (prRes.status === 403) {
      throw new Error("GitHub rate limit reached, try again in a few minutes");
    }
    if (!prRes.ok) throw new Error(`Could not load PR #${pr}`);
    const prData = await prRes.json();
    if (!prData.head?.sha) throw new Error(`Could not determine commit hash for PR #${pr}`);

    meta = {
      title: prData.title || `PR #${pr}`,
      author: prData.user?.login || "unknown",
      url: prData.html_url || `https://github.com/${target}/pull/${pr}`,
      state: prData.merged_at
        ? "merged"
        : prData.state === "closed"
        ? "closed"
        : prData.draft
        ? "draft"
        : "open",
      headSha: prData.head.sha,
      headRef: prData.head.ref,
    };
  }

  // 3. Stage 3: Determine which proposal files are changed in this PR
  const proposalFiles: string[] = [];

  // Strategy A: Fetch PR diff (No API rate limits)
  const diffUrl = isLocal
    ? `/gh-diff/raw/${target}/pull/${pr}.diff`
    : `https://patch-diff.githubusercontent.com/raw/${target}/pull/${pr}.diff`;

  try {
    const diffRes = await fetch(diffUrl);
    if (diffRes.ok) {
      const diffText = await diffRes.text();
      const matches = diffText.matchAll(/^\+\+\+ b\/(.+)$/gm);
      for (const m of matches) {
        const fn = m[1].trim();
        if (PROPOSAL_FILE_RE.test(fn) || (fn.endsWith(".md") && !fn.includes(".github"))) {
          if (!proposalFiles.includes(fn)) proposalFiles.push(fn);
        }
      }
    }
  } catch (err) {
    console.info("PR diff inspection skipped:", err);
  }

  // Strategy B: Try GitHub API /files endpoint if diff didn't find files
  if (proposalFiles.length === 0) {
    try {
      const filesRes = await fetch(`https://api.github.com/repos/${target}/pulls/${pr}/files?per_page=100`, { headers });
      if (filesRes.ok) {
        const files: PrFile[] = await filesRes.json();
        for (const f of files) {
          if (PROPOSAL_FILE_RE.test(f.filename) || f.filename.endsWith(".md")) {
            if (!proposalFiles.includes(f.filename)) proposalFiles.push(f.filename);
          }
        }
      }
    } catch {
      // Ignore API errors/rate limits and continue to Strategy C
    }
  }

  // Strategy C: Infer file from proposal title or branch ref
  if (proposalFiles.length === 0 && meta.title) {
    const titleMatch =
      meta.title.match(/(?:EIP|ERC|RIP)[ -]?([0-9]+)/i) ||
      (meta.headRef ? meta.headRef.match(/([0-9]{3,5})/) : null);

    if (titleMatch) {
      const inferredNum = titleMatch[1];
      const inferredPath = RAW_PATH[repo](inferredNum);
      proposalFiles.push(inferredPath);
    }
  }

  const primary = proposalFiles.find((f) => PROPOSAL_FILE_RE.test(f)) ?? proposalFiles[0];
  if (!primary || !meta.headSha) {
    throw new Error(`No EIP/ERC/RIP Markdown file found in PR #${pr}`);
  }

  // 4. Stage 4: Fetch raw proposal markdown content (raw.githubusercontent.com is not rate limited)
  const rawRes = await fetch(`https://raw.githubusercontent.com/${target}/${meta.headSha}/${primary}`);
  if (!rawRes.ok) {
    throw new Error(`Could not fetch proposal content for ${primary} at commit ${meta.headSha.slice(0, 7)}`);
  }
  const markdown = await rawRes.text();

  return {
    repo: target,
    prNumber: Number(pr),
    prTitle: meta.title,
    prAuthor: meta.author,
    prUrl: meta.url,
    prState: meta.state,
    filename: primary,
    proposalFiles: proposalFiles.length > 1 ? proposalFiles : undefined,
    markdown,
  };
}

/** Which repo a PR path belongs to, for picking the rule set. */
export function repoFromFilename(filename: string): RepoKind {
  if (/^ERCS\//i.test(filename)) return "erc";
  if (/^RIPS\//i.test(filename)) return "rip";
  return "eip";
}
