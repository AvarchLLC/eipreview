import type { ProposalField, RepoKind } from "../lib/types";

export const STATUS_OPTIONS = ["Draft", "Review", "Last Call", "Final", "Stagnant", "Withdrawn", "Living"];

export const TYPE_OPTIONS = ["Standards Track", "Meta", "Informational"];

export const CATEGORY_OPTIONS: Record<RepoKind, string[]> = {
  eip: ["Core", "Networking", "Interface"],
  erc: ["ERC", "Interface"],
  rip: ["Core", "RRC", "Networking", "Interface"],
};

export interface FieldDef {
  key: ProposalField;
  label: string;
  hint: string;
  kind: "text" | "select" | "date";
  options?: (repo: RepoKind) => string[];
  wide?: boolean;
  optional?: boolean;
}

export const PREAMBLE_FIELDS: FieldDef[] = [
  { key: "eip", label: "Number", kind: "text", hint: "Leave as a placeholder until an editor assigns one." },
  { key: "title", label: "Title", kind: "text", hint: "A few words in Title Case, 44 characters max. No number, no the word \"standard\".", wide: true },
  { key: "description", label: "Description", kind: "text", hint: "One short sentence, 140 characters max. No colon, no \"standard\".", wide: true },
  { key: "author", label: "Author", kind: "text", hint: "Name (@github) or Name <email>, comma-separated. At least one GitHub handle.", wide: true },
  { key: "discussionsTo", label: "Discussions to", kind: "text", hint: "An Ethereum Magicians topic URL (https://ethereum-magicians.org/t/...).", wide: true },
  { key: "status", label: "Status", kind: "select", options: () => STATUS_OPTIONS, hint: "Draft while you are writing it." },
  { key: "lastCallDeadline", label: "Last call deadline", kind: "date", hint: "Required only when status is Last Call.", optional: true },
  { key: "type", label: "Type", kind: "select", options: () => ["", ...TYPE_OPTIONS], hint: "Standards Track, Meta, or Informational." },
  { key: "category", label: "Category", kind: "select", options: (repo) => ["", ...CATEGORY_OPTIONS[repo]], hint: "Required for Standards Track only." },
  { key: "created", label: "Created", kind: "date", hint: "The date you created the proposal." },
  { key: "requires", label: "Requires", kind: "text", hint: "Proposal number(s), comma-separated, ascending. Optional.", optional: true },
  { key: "withdrawalReason", label: "Withdrawal reason", kind: "text", hint: "Required only when status is Withdrawn.", wide: true, optional: true },
];

export interface SectionDef {
  key: ProposalField;
  label: string;
  hint: string;
  optional?: boolean;
}

export const SECTION_FIELDS: SectionDef[] = [
  { key: "abstract", label: "Abstract", hint: "A short technical summary. Someone should grasp the gist from this alone. No normative keywords." },
  { key: "motivation", label: "Motivation", hint: "The problem, not the solution. Written for a reader years from now who needs to know why.", optional: true },
  { key: "specification", label: "Specification", hint: "Everything an implementer needs. Start with the RFC 2119 note if you use MUST / SHOULD / MAY." },
  { key: "rationale", label: "Rationale", hint: "Why each design decision was made. Alternatives considered, prior art cited." },
  { key: "backwardsCompatibility", label: "Backwards Compatibility", hint: "Required only if the proposal introduces an incompatibility. Describe each and how it is handled.", optional: true },
  { key: "testCases", label: "Test Cases", hint: "Required for consensus changes before Final. Input and expected output pairs.", optional: true },
  { key: "referenceImplementation", label: "Reference Implementation", hint: "Optional. Point to code in assets/ or a commit-pinned permalink.", optional: true },
  { key: "securityConsiderations", label: "Security Considerations", hint: "Specific to this proposal. Generic text like \"no new risks\" is insufficient. Required for Final." },
];

export const RFC_2119_BOILERPLATE =
  'The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).';
