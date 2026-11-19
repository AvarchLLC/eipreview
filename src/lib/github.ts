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

/** Import a pull request's proposal file, fully client-side. */
export async function importPr(repo: RepoKind, pr: string): Promise<ImportedPr & { markdown: string }> {
  const target = REPO_NAME[repo];
  const headers: HeadersInit = { Accept: "application/vnd.github+json" };

  const prRes = await fetch(`https://api.github.com/repos/${target}/pulls/${pr}`, { headers });
  if (prRes.status === 404) throw new Error(`PR #${pr} not found in ${target}`);
  if (prRes.status === 403) throw new Error(`GitHub rate limit reached, try again in a few minutes`);
  if (!prRes.ok) throw new Error(`Could not load PR #${pr}`);
  const prData = await prRes.json();
  const headSha: string | undefined = prData.head?.sha;

  const filesRes = await fetch(`https://api.github.com/repos/${target}/pulls/${pr}/files?per_page=100`, { headers });
  if (!filesRes.ok) throw new Error(`Could not read files for PR #${pr}`);
  const files: PrFile[] = await filesRes.json();
  const proposalFiles = files.filter((f) => PROPOSAL_FILE_RE.test(f.filename)).map((f) => f.filename);
  const primary = proposalFiles[0] ?? files.find((f) => f.filename.endsWith(".md"))?.filename;
  if (!primary || !headSha) throw new Error(`No EIP/ERC/RIP Markdown file found in PR #${pr}`);

  const rawRes = await fetch(`https://raw.githubusercontent.com/${target}/${headSha}/${primary}`);
  if (!rawRes.ok) throw new Error(`Could not fetch the proposal content from the PR`);
  const markdown = await rawRes.text();

  const state: ImportedPr["prState"] = prData.merged_at
    ? "merged"
    : prData.state === "closed"
    ? "closed"
    : prData.draft
    ? "draft"
    : "open";

  return {
    repo: target,
    prNumber: Number(pr),
    prTitle: prData.title,
    prAuthor: prData.user?.login,
    prUrl: prData.html_url,
    prState: state,
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
