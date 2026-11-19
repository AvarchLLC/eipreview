// Client-side EIP / ERC / RIP validator.
//
// The rules mirror what the editors enforce in CI (eipw, the EIP validator,
// plus markdownlint and the copyright/section checks). Rules tagged `ci` are the
// ones a pull request is gated on; rules tagged `authoring` are EIPsInsight's own
// drafting guidance that CI does not enforce, so they never rise above a warning.
//
// This engine is pure and dependency-free, so it runs entirely in the browser.
// It is structured to be swappable for eipw-via-WASM later for literal parity.

import type {
  RepoKind,
  ValidationMessage,
  ValidationResult,
  ValidateOptions,
} from "./types";

// ── Constants ──

const VALID_STATUSES = ["Draft", "Review", "Last Call", "Final", "Stagnant", "Withdrawn", "Living"];
const VALID_TYPES = ["Standards Track", "Meta", "Informational"];

const CATEGORIES_BY_REPO: Record<RepoKind, string[]> = {
  eip: ["Core", "Networking", "Interface"],
  erc: ["ERC", "Interface"],
  rip: ["Core", "RRC", "Networking", "Interface"],
};

const REPO_LABEL: Record<RepoKind, string> = { eip: "EIP", erc: "ERC", rip: "RIP" };
const REPO_FILE_PREFIX: Record<RepoKind, string> = { eip: "eip-", erc: "erc-", rip: "rip-" };

const FIELD_ORDER = [
  "eip", "title", "description", "author", "discussions-to",
  "status", "last-call-deadline", "type", "category", "created",
  "requires", "withdrawal-reason",
];

const SECTION_ORDER = [
  "Abstract", "Motivation", "Specification", "Rationale",
  "Backwards Compatibility", "Test Cases", "Reference Implementation",
  "Security Considerations", "Copyright",
];

const ALWAYS_REQUIRED_SECTIONS = ["Abstract", "Rationale", "Security Considerations", "Copyright"];

const TITLE_CASE_SMALL_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "nor", "for", "in", "on",
  "at", "to", "by", "of", "with", "from", "up", "as", "into", "via",
]);

const MAGICIANS_URL_PATTERN = /^https:\/\/ethereum-magicians\.org\/t\//;

const DISALLOWED_LINK_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /https?:\/\/(www\.)?eips\.ethereum\.org/gi, name: "eips.ethereum.org (use relative links)" },
  { pattern: /https?:\/\/ethresear\.ch/gi, name: "ethresear.ch" },
  { pattern: /https?:\/\/hackmd\.io/gi, name: "hackmd.io" },
  { pattern: /https?:\/\/etherscan\.io/gi, name: "etherscan.io" },
  { pattern: /https?:\/\/arxiv\.org/gi, name: "arxiv.org" },
];

// ── Line helpers ──

function lineOf(md: string, index: number): number {
  if (index <= 0) return 1;
  let count = 1;
  const end = Math.min(index, md.length);
  for (let i = 0; i < end; i++) if (md[i] === "\n") count++;
  return count;
}

// ── Parsing ──

interface FrontmatterField { key: string; value: string; line: number }
interface ParsedFrontmatter {
  fields: FrontmatterField[];
  fieldMap: Map<string, string>;
  lineMap: Map<string, number>;
}

function parseFrontmatter(md: string): { fm: ParsedFrontmatter; body: string; bodyStart: number } | null {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const raw = match[1];
  const bodyStart = match[0].length;
  const body = md.slice(bodyStart);
  const lines = raw.split("\n");
  const fields: FrontmatterField[] = [];
  const fieldMap = new Map<string, string>();
  const lineMap = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([a-z][a-z0-9-]*):\s*(.*)/i);
    if (m) {
      const key = m[1].toLowerCase();
      const docLine = i + 2; // `---` is line 1
      fields.push({ key, value: m[2].trim(), line: docLine });
      fieldMap.set(key, m[2].trim());
      lineMap.set(key, docLine);
    }
  }

  return { fm: { fields, fieldMap, lineMap }, body, bodyStart };
}

interface Section { heading: string; content: string; line: number }

function parseSections(body: string, bodyStart: number, md: string): Section[] {
  const sections: Section[] = [];
  const headingPattern = /^## (.+)$/gm;
  let match: RegExpExecArray | null;
  const positions: Array<{ heading: string; start: number }> = [];

  while ((match = headingPattern.exec(body)) !== null) {
    positions.push({ heading: match[1].trim(), start: match.index });
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].start;
    const end = i + 1 < positions.length ? positions[i + 1].start : body.length;
    const content = body.slice(start, end).replace(/^## .+\n*/, "").trim();
    sections.push({ heading: positions[i].heading, content, line: lineOf(md, bodyStart + start) });
  }

  return sections;
}

function isTitleCase(title: string): boolean {
  const words = title.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-zA-Z0-9]/g, "");
    if (!word) continue;
    if (i === 0) {
      if (word[0] !== word[0].toUpperCase()) return false;
      continue;
    }
    if (TITLE_CASE_SMALL_WORDS.has(word.toLowerCase())) continue;
    if (word[0] !== word[0].toUpperCase()) return false;
  }
  return true;
}

function isISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !isNaN(d.getTime());
}

// ── Main entry point ──

export function validateProposal(md: string, opts: ValidateOptions = {}): ValidationResult {
  const repo: RepoKind = opts.repo ?? "eip";
  const numberKey = repo === "rip" ? "rip" : "eip";
  const label = REPO_LABEL[repo];
  const m: ValidationMessage[] = [];

  const parsed = parseFrontmatter(md);
  if (!parsed) {
    m.push({ level: "error", category: "ci", message: "Missing YAML frontmatter (the --- block at the top)", section: "Preamble", line: 1 });
    return { success: false, messages: m };
  }

  const { fm, body, bodyStart } = parsed;
  const g = (k: string) => fm.fieldMap.get(k);
  const ln = (k: string) => fm.lineMap.get(k);
  const type = g("type");

  // ── Preamble: required fields ──
  const required = [numberKey, "title", "description", "author", "status", "type", "created"];
  const firstLine = fm.fields[0]?.line ?? 2;
  for (const field of required) {
    if (!fm.fieldMap.has(field) || !g(field)?.trim()) {
      m.push({ level: "error", category: "ci", message: `Missing required preamble field: ${field}`, section: "Preamble", field, line: ln(field) ?? firstLine });
    }
  }

  // Field order
  const order = repo === "rip" ? FIELD_ORDER.map((f) => (f === "eip" ? "rip" : f)) : FIELD_ORDER;
  const fieldKeys = fm.fields.map((f) => f.key);
  const ordered = order.filter((f) => fieldKeys.includes(f));
  const actual = fieldKeys.filter((f) => order.includes(f));
  if (JSON.stringify(ordered) !== JSON.stringify(actual)) {
    m.push({ level: "error", category: "ci", message: `Preamble fields are out of order. Expected: ${ordered.join(", ")}`, section: "Preamble", field: "order", line: fm.fields[0]?.line });
  }
  const known = new Set(order);
  for (const f of fm.fields) {
    if (!known.has(f.key)) {
      m.push({ level: "warning", category: "ci", message: `Unknown preamble field: "${f.key}"`, section: "Preamble", field: f.key, line: f.line });
    }
  }

  // Number field
  const eip = g(numberKey);
  if (eip && eip !== "<TBD>" && eip.toLowerCase() !== "x" && eip !== "TBD") {
    const n = parseInt(eip, 10);
    if (isNaN(n) || n <= 0 || !Number.isInteger(n)) {
      m.push({ level: "error", category: "ci", message: `${label} number must be a positive integer (or a placeholder until one is assigned)`, section: "Preamble", field: numberKey, line: ln(numberKey) });
    }
  }

  // Filename ↔ number
  if (opts.filename) {
    const base = opts.filename.split("/").pop() ?? opts.filename;
    const fileMatch = base.match(/^(eip|erc|rip)-([0-9]+)\.md$/i);
    if (!fileMatch) {
      m.push({ level: "error", category: "ci", message: `Filename "${base}" must match <${REPO_FILE_PREFIX[repo]}N>.md`, section: "Preamble", field: numberKey });
    } else if (eip && eip !== "<TBD>" && eip.toLowerCase() !== "x" && eip !== "TBD" && String(parseInt(eip, 10)) !== String(parseInt(fileMatch[2], 10))) {
      m.push({ level: "error", category: "ci", message: `Filename number (${fileMatch[2]}) does not match preamble ${numberKey}: ${eip}`, section: "Preamble", field: numberKey });
    }
  }

  // Title
  const title = g("title");
  if (title) {
    const tl = ln("title");
    if (title.length > 44) m.push({ level: "error", category: "ci", message: `Title is ${title.length} characters, the maximum is 44`, section: "Preamble", field: "title", line: tl });
    if (/\bstandard\b/i.test(title)) m.push({ level: "error", category: "ci", message: `Title must not contain the word "standard"`, section: "Preamble", field: "title", line: tl });
    if (/\beip[- ]?\d+/i.test(title)) m.push({ level: "warning", category: "authoring", message: `Title should not contain the EIP number`, section: "Preamble", field: "title", line: tl });
    if (!isTitleCase(title)) m.push({ level: "warning", category: "authoring", message: `Title should be in Title Case`, section: "Preamble", field: "title", line: tl });
    if (/[.!?]$/.test(title.trim())) m.push({ level: "warning", category: "authoring", message: `Title should be a few words, not a sentence (remove the trailing punctuation)`, section: "Preamble", field: "title", line: tl });
  }

  // Description
  const description = g("description");
  if (description) {
    const dl = ln("description");
    if (description.length > 140) m.push({ level: "error", category: "ci", message: `Description is ${description.length} characters, the maximum is 140`, section: "Preamble", field: "description", line: dl });
    if (description.includes(":")) m.push({ level: "warning", category: "ci", message: `Description should not contain a colon`, section: "Preamble", field: "description", line: dl });
    if (/\bstandard\b/i.test(description)) m.push({ level: "error", category: "ci", message: `Description must not contain the word "standard"`, section: "Preamble", field: "description", line: dl });
    if (/\.\s+[A-Z]/.test(description)) m.push({ level: "warning", category: "authoring", message: `Description should be a single sentence`, section: "Preamble", field: "description", line: dl });
  }

  // Author
  const author = g("author");
  if (author) {
    const al = ln("author");
    if (!/@[a-zA-Z0-9-]+/.test(author)) {
      m.push({ level: "error", category: "ci", message: `At least one author must have a GitHub handle, e.g. Jane Doe (@janedoe), an email alone is not enough`, section: "Preamble", field: "author", line: al });
    }
    for (const entry of author.split(",").map((s) => s.trim()).filter(Boolean)) {
      const ok = /^.+\s+\(@[a-zA-Z0-9-]+\)$/.test(entry) || /^.+\s+<[^>]+@[^>]+>$/.test(entry) || /^.+\s+(@[a-zA-Z0-9-]+)$/.test(entry);
      if (!ok && /^@[a-zA-Z0-9-]+$/.test(entry)) {
        m.push({ level: "warning", category: "authoring", message: `Author "${entry}", a real name before the handle is preferred`, section: "Preamble", field: "author", line: al });
      }
    }
  }

  // discussions-to
  const disc = g("discussions-to");
  const status = g("status");
  if (!disc || disc === "null") {
    m.push({ level: status && status !== "Draft" ? "error" : "warning", category: "ci", message: `discussions-to should link to an Ethereum Magicians topic`, section: "Preamble", field: "discussions-to", line: ln("discussions-to") });
  } else if (!MAGICIANS_URL_PATTERN.test(disc)) {
    m.push({ level: "error", category: "ci", message: `discussions-to must be an ethereum-magicians.org/t/... topic URL, not "${disc}"`, section: "Preamble", field: "discussions-to", line: ln("discussions-to") });
  }

  // Enums
  if (status && !VALID_STATUSES.includes(status)) m.push({ level: "error", category: "ci", message: `Invalid status: "${status}". Must be one of: ${VALID_STATUSES.join(", ")}`, section: "Preamble", field: "status", line: ln("status") });
  if (type && !VALID_TYPES.includes(type)) m.push({ level: "error", category: "ci", message: `Invalid type: "${type}". Must be one of: ${VALID_TYPES.join(", ")}`, section: "Preamble", field: "type", line: ln("type") });

  // Category
  const category = g("category");
  const allowedCats = CATEGORIES_BY_REPO[repo];
  if (type === "Standards Track") {
    if (!category) m.push({ level: "error", category: "ci", message: `Category is required for Standards Track ${label}s`, section: "Preamble", field: "category", line: ln("category") });
    else if (!allowedCats.includes(category)) m.push({ level: "error", category: "ci", message: `Invalid category: "${category}". For ${label}s it must be one of: ${allowedCats.join(", ")}`, section: "Preamble", field: "category", line: ln("category") });
  } else if (category) {
    m.push({ level: "error", category: "ci", message: `Category must only be present for Standards Track proposals`, section: "Preamble", field: "category", line: ln("category") });
  }

  // Conditional fields
  if (status === "Last Call") {
    const raw = g("last-call-deadline")?.trim();
    if (!raw) m.push({ level: "error", category: "ci", message: `last-call-deadline is required when status is Last Call`, section: "Preamble", field: "last-call-deadline", line: ln("last-call-deadline") ?? ln("status") });
    else if (!isISODate(raw)) m.push({ level: "error", category: "ci", message: `last-call-deadline must be a valid date (YYYY-MM-DD), got "${raw}"`, section: "Preamble", field: "last-call-deadline", line: ln("last-call-deadline") });
  } else if (fm.fieldMap.has("last-call-deadline")) {
    m.push({ level: "warning", category: "ci", message: `last-call-deadline should only be present when status is Last Call`, section: "Preamble", field: "last-call-deadline", line: ln("last-call-deadline") });
  }
  if (status === "Withdrawn") {
    if (!g("withdrawal-reason")?.trim()) m.push({ level: "warning", category: "ci", message: `withdrawal-reason is expected when status is Withdrawn`, section: "Preamble", field: "withdrawal-reason", line: ln("withdrawal-reason") ?? ln("status") });
  } else if (fm.fieldMap.has("withdrawal-reason")) {
    m.push({ level: "warning", category: "ci", message: `withdrawal-reason should only be present when status is Withdrawn`, section: "Preamble", field: "withdrawal-reason", line: ln("withdrawal-reason") });
  }

  // Created
  const created = g("created");
  if (created) {
    if (!isISODate(created)) m.push({ level: "error", category: "ci", message: `Created date must be in ISO format (YYYY-MM-DD), got "${created}"`, section: "Preamble", field: "created", line: ln("created") });
  }

  // Requires
  const requires = g("requires");
  if (requires && requires.trim()) {
    const nums = requires.split(",").map((s) => s.trim()).filter(Boolean).map(Number);
    if (nums.some((n) => isNaN(n) || n <= 0 || !Number.isInteger(n))) m.push({ level: "error", category: "ci", message: `requires entries must be positive integers`, section: "Preamble", field: "requires", line: ln("requires") });
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] <= nums[i - 1]) { m.push({ level: "warning", category: "ci", message: `requires entries should be in ascending order`, section: "Preamble", field: "requires", line: ln("requires") }); break; }
    }
  }

  // ── Sections ──
  const sections = parseSections(body, bodyStart, md);
  const headings = sections.map((s) => s.heading);
  const requiredSections = [...ALWAYS_REQUIRED_SECTIONS];
  if (type === "Standards Track") requiredSections.splice(1, 0, "Specification");
  for (const req of requiredSections) {
    if (!headings.includes(req)) m.push({ level: req === "Copyright" || req === "Security Considerations" ? "error" : "warning", category: "ci", message: `Missing required section: ## ${req}`, section: "Sections", field: req });
  }
  const recognized = headings.filter((h) => SECTION_ORDER.includes(h));
  const expectedOrder = SECTION_ORDER.filter((s) => recognized.includes(s));
  if (JSON.stringify(recognized) !== JSON.stringify(expectedOrder)) m.push({ level: "error", category: "ci", message: `Sections are out of order. Expected: ${expectedOrder.join(" → ")}`, section: "Sections", line: sections[0]?.line });
  for (const sec of sections) {
    if (!SECTION_ORDER.includes(sec.heading)) m.push({ level: "warning", category: "ci", message: `Unrecognized section: "## ${sec.heading}", the linter may reject extra top-level sections`, section: "Sections", field: sec.heading, line: sec.line });
  }
  const copyright = sections.find((s) => s.heading === "Copyright");
  if (copyright) {
    const expected = "Copyright and related rights waived via [CC0](../LICENSE.md).";
    if (!copyright.content.includes(expected)) m.push({ level: "error", category: "ci", message: `Copyright section must contain exactly: "${expected}"`, section: "Sections", field: "Copyright", line: copyright.line });
  }
  for (const sec of sections) {
    if (sec.heading !== "Copyright" && !sec.content.trim()) m.push({ level: "warning", category: "authoring", message: `Section "## ${sec.heading}" is empty, remove it or add content`, section: "Sections", field: sec.heading, line: sec.line });
  }
  const security = sections.find((s) => s.heading === "Security Considerations");
  if (security) {
    const content = security.content.toLowerCase().trim();
    const generic = ["no security considerations", "no new risks", "follow best practices", "no additional security", "needs discussion", "none", "n/a", "tbd", "todo"];
    for (const phrase of generic) {
      if (content === phrase || content.includes(phrase)) { m.push({ level: "warning", category: "authoring", message: `Security Considerations must be specific to this proposal, generic text like "${phrase}" is insufficient`, section: "Sections", field: "Security Considerations", line: security.line }); break; }
    }
  }

  // Template artifacts
  const comment = body.match(/<!--[\s\S]*?-->/);
  if (comment) m.push({ level: "warning", category: "ci", message: `Found HTML comment(s), delete all template comments before submitting`, section: "Sections", line: lineOf(md, bodyStart + (comment.index ?? 0)) });
  for (const { re, name } of [{ re: /\bTODO\b/, name: "TODO" }, { re: /\bFIXME\b/, name: "FIXME" }, { re: /\bplaceholder\b/i, name: '"placeholder"' }]) {
    const mm = body.match(re);
    if (mm) m.push({ level: "warning", category: "authoring", message: `Found a "${name}" marker, remove it before submitting`, section: "Sections", line: lineOf(md, bodyStart + (mm.index ?? 0)) });
  }

  // Normative language (eipw has no RFC 2119 lint, this is our authoring guidance)
  const keywordPattern = /\b(MUST NOT|MUST|REQUIRED|SHALL NOT|SHALL|SHOULD NOT|SHOULD|NOT RECOMMENDED|RECOMMENDED|OPTIONAL|MAY)\b/g;
  let hasKeyword = false, hasBoilerplate = false, specLine: number | undefined;
  const outside: Array<{ section: string; keyword: string; line: number }> = [];
  for (const sec of sections) {
    if (sec.heading === "Specification") specLine = sec.line;
    const matches = sec.content.match(keywordPattern);
    if (matches && matches.length > 0) {
      hasKeyword = true;
      if (sec.heading !== "Specification" && sec.heading !== "Copyright") for (const kw of matches) outside.push({ section: sec.heading, keyword: kw, line: sec.line });
    }
    if (sec.content.includes("RFC 2119") && sec.content.includes("RFC 8174")) hasBoilerplate = true;
  }
  if (hasKeyword && !hasBoilerplate) {
    m.push({
      level: "warning",
      category: "authoring",
      message: `RFC 2119/8174 keywords are used but the boilerplate paragraph is missing from Specification`,
      section: "Specification",
      line: specLine,
    });
  }
  if (outside.length > 0) {
    const outsideBySec = new Map<string, { keywords: Set<string>; line: number }>();
    for (const item of outside) {
      if (!outsideBySec.has(item.section)) {
        outsideBySec.set(item.section, { keywords: new Set(), line: item.line });
      }
      outsideBySec.get(item.section)!.keywords.add(item.keyword);
    }
    for (const [secName, info] of outsideBySec) {
      const kwList = Array.from(info.keywords);
      m.push({
        level: "warning",
        category: "authoring",
        message: `Normative keywords (${kwList.join(", ")}) should only appear in Specification, not in ${secName}`,
        section: secName,
        line: info.line,
      });
    }
  }

  // Lowercase keywords in Specification (authoring suggestion)
  const specSec = sections.find((s) => s.heading === "Specification");
  if (specSec) {
    const lowercaseMatches = specSec.content.match(/\b(must not|must|shall not|shall|should not|should)\b/g);
    if (lowercaseMatches && lowercaseMatches.length > 0) {
      const uniq = [...new Set(lowercaseMatches)];
      m.push({
        level: "info",
        category: "authoring",
        message: `Specification contains lowercase words (${uniq.join(", ")}). If intended as normative requirements, capitalize to RFC 2119 (${uniq.map((w) => w.toUpperCase()).join(", ")})`,
        section: "Specification",
        line: specSec.line,
      });
    }
  }

  // Prose
  const badEip = body.match(/\bEIP\s+\d+\b/i);
  if (badEip) m.push({ level: "warning", category: "ci", message: `Reference EIPs as "EIP-N" with a hyphen, not "EIP N"`, section: "Prose & Style", line: lineOf(md, bodyStart + (badEip.index ?? 0)) });
  const latex = body.match(/\$[^$]+\$/) || body.match(/\\\(.*?\\\)/);
  if (latex) m.push({ level: "warning", category: "authoring", message: `LaTeX math ($...$) renders literally, use code spans like \`2**24\` instead`, section: "Prose & Style", line: lineOf(md, bodyStart + (latex.index ?? 0)) });

  // Links
  for (const { pattern, name } of DISALLOWED_LINK_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    const mm = re.exec(body);
    if (mm) m.push({ level: "warning", category: "authoring", message: `Link to ${name} is not on the allowed link list`, section: "Links & References", line: lineOf(md, bodyStart + mm.index) });
  }

  // Images (EIP-1 assets structure)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imageRegex.exec(body)) !== null) {
    const [, alt, src] = imgMatch;
    const cleanSrc = src.trim();
    const line = lineOf(md, bodyStart + imgMatch.index);
    if (/^https?:\/\//i.test(cleanSrc)) {
      m.push({
        level: "warning",
        category: "ci",
        message: `Image "${alt || "unnamed"}" points to an external URL. EIP-1 requires images to be placed in ../assets/${opts.repo || "eip"}-N/`,
        section: "Links & References",
        line,
      });
    } else if (!cleanSrc.startsWith("../assets/") && !cleanSrc.startsWith("assets/")) {
      m.push({
        level: "info",
        category: "authoring",
        message: `Image path "${cleanSrc}" should follow standard EIP assets structure: "../assets/${opts.repo || "eip"}-N/${cleanSrc.split("/").pop()}"`,
        section: "Links & References",
        line,
      });
    }
  }

  // Write-as-if-Final (authoring)
  for (const { re, name } of [{ re: /\bthis PR\b/i, name: '"this PR"' }, { re: /\bonce merged\b/i, name: '"once merged"' }]) {
    const mm = body.match(re);
    if (mm) m.push({ level: "info", category: "authoring", message: `Avoid ${name}, write as if the proposal is already Final`, section: "Cross-References", line: lineOf(md, bodyStart + (mm.index ?? 0)) });
  }

  return { success: !m.some((x) => x.level === "error"), messages: m };
}
