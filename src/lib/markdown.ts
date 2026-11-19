import type { ProposalData, ProposalField } from "./types";

export const EMPTY_PROPOSAL: ProposalData = {
  eip: "<TBD>",
  title: "",
  description: "",
  author: "",
  discussionsTo: "",
  status: "Draft",
  lastCallDeadline: "",
  type: "",
  category: "",
  created: "",
  requires: "",
  withdrawalReason: "",
  abstract: "",
  motivation: "",
  specification: "",
  rationale: "",
  backwardsCompatibility: "",
  testCases: "",
  referenceImplementation: "",
  securityConsiderations: "",
};

const SECTION_DEFS: Array<{ key: ProposalField; heading: string }> = [
  { key: "abstract", heading: "Abstract" },
  { key: "motivation", heading: "Motivation" },
  { key: "specification", heading: "Specification" },
  { key: "rationale", heading: "Rationale" },
  { key: "backwardsCompatibility", heading: "Backwards Compatibility" },
  { key: "testCases", heading: "Test Cases" },
  { key: "referenceImplementation", heading: "Reference Implementation" },
  { key: "securityConsiderations", heading: "Security Considerations" },
];

/** Build EIP Markdown (frontmatter + sections) from the form. */
export function generateMarkdown(d: ProposalData): string {
  const fm: string[] = ["---"];
  const add = (k: string, v: string) => {
    if (v && v.trim()) fm.push(`${k}: ${v.trim()}`);
  };
  add("eip", d.eip);
  add("title", d.title);
  add("description", d.description);
  add("author", d.author);
  add("discussions-to", d.discussionsTo);
  add("status", d.status);
  if (d.status === "Last Call") add("last-call-deadline", d.lastCallDeadline);
  add("type", d.type);
  if (d.type === "Standards Track") add("category", d.category);
  add("created", d.created);
  add("requires", d.requires);
  if (d.status === "Withdrawn") add("withdrawal-reason", d.withdrawalReason);
  fm.push("---", "");

  const parts: string[] = [fm.join("\n")];
  for (const { key, heading } of SECTION_DEFS) {
    const content = d[key]?.trim();
    if (content) parts.push(`## ${heading}\n\n${content}\n`);
  }
  parts.push("## Copyright\n\nCopyright and related rights waived via [CC0](../LICENSE.md).\n");
  return parts.join("\n");
}

const FM_PATTERNS: Partial<Record<ProposalField, RegExp>> = {
  eip: /^eip:\s*(.+)$/im,
  title: /^title:\s*(.+)$/im,
  description: /^description:\s*(.+)$/im,
  author: /^author:\s*(.+)$/im,
  discussionsTo: /^discussions-to:\s*(.+)$/im,
  status: /^status:\s*(.+)$/im,
  lastCallDeadline: /^last-call-deadline:\s*(.+)$/im,
  type: /^type:\s*(.+)$/im,
  category: /^category:\s*(.+)$/im,
  created: /^created:\s*(.+)$/im,
  requires: /^requires:\s*(.+)$/im,
  withdrawalReason: /^withdrawal-reason:\s*(.+)$/im,
};

const SECTION_PATTERNS: Partial<Record<ProposalField, RegExp>> = {
  abstract: /## Abstract\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  motivation: /## Motivation\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  specification: /## Specification\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  rationale: /## Rationale\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  backwardsCompatibility: /## Backwards Compatibility\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  testCases: /## Test Cases\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  referenceImplementation: /## Reference Implementation\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  securityConsiderations: /## Security Considerations\s*\n([\s\S]*?)(?=\n##\s|$)/i,
};

/** Parse EIP Markdown back into the form model. */
export function parseMarkdown(md: string): Partial<ProposalData> {
  const out: Partial<ProposalData> = {};
  const fmMatch = md.match(/^---\n[\s\S]*?\n---/);
  const fmBlock = fmMatch ? fmMatch[0] : "";
  for (const [key, re] of Object.entries(FM_PATTERNS) as [ProposalField, RegExp][]) {
    const v = fmBlock.match(re)?.[1]?.trim();
    if (v) out[key] = v.replace(/^["']|["']$/g, "");
  }
  for (const [key, re] of Object.entries(SECTION_PATTERNS) as [ProposalField, RegExp][]) {
    const v = md.match(re)?.[1]?.trim();
    if (v) out[key] = v;
  }
  return out;
}

export function splitFrontmatter(md: string): { frontmatter: string; body: string } {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: "", body: md };
  return { frontmatter: match[1], body: md.slice(match[0].length).trim() };
}
