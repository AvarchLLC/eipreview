export type RepoKind = "eip" | "erc" | "rip";
export type TabMode = "new" | "import" | "pr";
export type ViewMode = "edit" | "split" | "preview";
export type Severity = "error" | "warning" | "info";
export type RuleCategory = "ci" | "authoring";

export interface ValidationMessage {
  level: Severity;
  message: string;
  /** "ci" = aligned with a check CI enforces (blocking). "authoring" = our guidance. */
  category: RuleCategory;
  section?: string;
  field?: string;
  line?: number;
}

export interface ValidationResult {
  success: boolean;
  messages: ValidationMessage[];
}

export interface ValidateOptions {
  repo?: RepoKind;
  filename?: string;
}

export interface ProposalData {
  eip: string;
  title: string;
  description: string;
  author: string;
  discussionsTo: string;
  status: string;
  lastCallDeadline: string;
  type: string;
  category: string;
  created: string;
  requires: string;
  withdrawalReason: string;
  abstract: string;
  motivation: string;
  specification: string;
  rationale: string;
  backwardsCompatibility: string;
  testCases: string;
  referenceImplementation: string;
  securityConsiderations: string;
}

export type ProposalField = keyof ProposalData;

export interface ImportedPr {
  repo: string;
  prNumber: number;
  prTitle: string;
  prAuthor?: string;
  prUrl: string;
  prState: "merged" | "draft" | "closed" | "open";
  filename: string;
  proposalFiles?: string[];
}
