import type { RepoKind, ValidationMessage } from "./types";

export interface ReviewCommentOptions {
  messages: ValidationMessage[];
  repo: RepoKind;
  context?: string;
  prNumber?: number | string;
  filename?: string;
  eipNumber?: string;
}

/**
 * Formats validation findings into a clean, professional GitHub PR review comment.
 * Uses GitHub Markdown checkboxes (- [ ]) so PR authors and reviewers can
 * track fixes directly inside GitHub PR discussions.
 */
export function formatReviewComment(options: ReviewCommentOptions): string {
  const { messages, repo, context, prNumber, filename, eipNumber } = options;
  const repoUpper = repo.toUpperCase();

  const errors = messages.filter((m) => m.level === "error");
  const warnings = messages.filter((m) => m.level === "warning");
  const infos = messages.filter((m) => m.level === "info");

  const lines: string[] = [];

  // Header Title
  let header = `### 🔍 ${repoUpper} Review Summary`;
  if (prNumber) {
    header = `### 🔍 ${repoUpper} Review: PR #${prNumber}`;
  } else if (eipNumber && /^\d+$/.test(eipNumber)) {
    header = `### 🔍 ${repoUpper}-${eipNumber} Review`;
  } else if (context) {
    header = `### 🔍 ${repoUpper} Review: ${context}`;
  }
  lines.push(header, "");

  // Metadata callout
  if (filename) {
    lines.push(`> **Proposal File:** \`${filename}\``, "");
  }

  // 1. All Clean (0 messages)
  if (messages.length === 0) {
    lines.push(
      "✅ **All validation checks passed!**",
      "",
      "This proposal conforms to all [EIP-1](https://eips.ethereum.org/EIPS/eip-1) and repository CI specifications:",
      "",
      "- [x] Preamble frontmatter adheres to EIP-1 requirements",
      "- [x] Title and description lengths within constraints",
      "- [x] Normative RFC 2119 / RFC 8174 keywords restricted to Specification section",
      "- [x] All required sections present in canonical order",
      "- [x] CC0 1.0 Universal copyright waiver present",
      "",
      "---",
      "*Audited with [EIP Review](https://eipreview.com) · Pure client-side proposal workspace*"
    );
    return lines.join("\n");
  }

  // 2. Summary Status Table
  lines.push(
    "Automated compliance audit against [EIP-1](https://eips.ethereum.org/EIPS/eip-1) and repository CI rules:",
    "",
    "| Severity | Findings | Status |",
    "| :--- | :---: | :--- |",
    `| 🔴 **Errors (CI Blocking)** | **${errors.length}** | ${errors.length === 0 ? "✅ Passed" : "❌ Action Required"} |`,
    `| 🟡 **Warnings (Editorial)** | **${warnings.length}** | ${warnings.length === 0 ? "✅ Clear" : "⚠️ Needs Attention"} |`
  );

  if (infos.length > 0) {
    lines.push(`| 💡 **Suggestions (Style)** | **${infos.length}** | ℹ️ Editorial Guidance |`);
  }

  lines.push("", "---");

  // Helper to format line/section location
  const formatLocation = (m: ValidationMessage): string => {
    const locParts: string[] = [];
    if (m.line) locParts.push(`Line ${m.line}`);
    if (m.section) {
      locParts.push(`\`## ${m.section}\``);
    } else if (m.field) {
      locParts.push(`field \`${m.field}\``);
    }
    return locParts.length > 0 ? ` *(${locParts.join(" in ")})*` : "";
  };

  // 3. Blocking Errors Section
  if (errors.length > 0) {
    lines.push(
      "",
      `#### 🔴 Blocking CI Issues (${errors.length})`,
      "These items will block repository CI checks or pull request merge:",
      ""
    );

    for (const err of errors) {
      const loc = formatLocation(err);
      const tag = err.category ? ` \`[${err.category.toUpperCase()}]\`` : "";
      lines.push(`- [ ] **${err.message}**${tag}${loc}`);

      // Provide tailored suggestions for notorious common errors
      if (err.message.includes("RFC 2119") && err.section?.toLowerCase().includes("spec")) {
        lines.push(
          "  > **Suggested Fix:** Include the canonical RFC 2119 boilerplate at the start of `## Specification`:",
          '  > *"The key words \\"MUST\\", \\"MUST NOT\\", \\"REQUIRED\\", \\"SHALL\\", \\"SHALL NOT\\", \\"SHOULD\\", \\"SHOULD NOT\\", \\"RECOMMENDED\\", \\"NOT RECOMMENDED\\", \\"MAY\\", and \\"OPTIONAL\\" in this document are to be interpreted as described in RFC 2119 and RFC 8174."*'
        );
      }
    }
  }

  // 4. Warnings Section
  if (warnings.length > 0) {
    lines.push(
      "",
      `#### 🟡 Editorial Warnings (${warnings.length})`,
      "Recommended improvements to align with standard EIP authoring practices:",
      ""
    );

    for (const w of warnings) {
      const loc = formatLocation(w);
      lines.push(`- [ ] **${w.message}**${loc}`);

      if (w.message.includes("normative") || w.message.includes("RFC 2119")) {
        lines.push(
          "  > **Guidance:** Normative keywords (MUST, SHOULD, etc.) must only be used in `## Specification`. Consider rephrasing with descriptive language (e.g., *needs to*, *is required to*, *expected to*)."
        );
      }
    }
  }

  // 5. Suggestions Section
  if (infos.length > 0) {
    lines.push("", `#### 💡 Editorial Suggestions (${infos.length})`, "");
    for (const info of infos) {
      const loc = formatLocation(info);
      lines.push(`- ${info.message}${loc}`);
    }
  }

  // Footer Attribution
  lines.push(
    "",
    "---",
    `*Generated by [EIP Review](https://eipreview.com) · Pure client-side proposal workspace*`
  );

  return lines.join("\n");
}
