import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  GitFork,
  GitPullRequest,
  Sparkles,
  X,
} from "lucide-react";
import type { ImportedPr, RepoKind, TabMode, ValidationMessage } from "../lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  repo: RepoKind;
  eipNumber?: string;
  tab: TabMode;
  importedPr?: ImportedPr | null;
  validationMessages: ValidationMessage[];
}

export function CreatePrModal({
  isOpen,
  onClose,
  markdown,
  repo,
  eipNumber,
  tab,
  importedPr,
  validationMessages,
}: Props) {
  const [copied, setCopied] = useState(false);

  // Compute repository targets
  const repoMeta = {
    eip: {
      owner: "ethereum",
      repo: "EIPs",
      folder: "EIPS",
      prefix: "eip-",
      branch: "master",
    },
    erc: {
      owner: "ethereum",
      repo: "ERCs",
      folder: "ERCS",
      prefix: "erc-",
      branch: "master",
    },
    rip: {
      owner: "ethereum",
      repo: "RIPs",
      folder: "RIPS",
      prefix: "rip-",
      branch: "master",
    },
  }[repo];

  const hasNum = eipNumber && /^\d+$/.test(eipNumber.trim());
  const fileNum = hasNum ? eipNumber.trim() : "draft";
  const filename = `${repoMeta.prefix}${fileNum}.md`;
  const relativePath = `${repoMeta.folder}/${filename}`;

  // GitHub action URLs
  const newFileUrl = `https://github.com/${repoMeta.owner}/${repoMeta.repo}/new/${repoMeta.branch}?filename=${encodeURIComponent(
    relativePath
  )}`;
  const editFileUrl = hasNum
    ? `https://github.com/${repoMeta.owner}/${repoMeta.repo}/edit/${repoMeta.branch}/${encodeURIComponent(
        relativePath
      )}`
    : newFileUrl;
  const prUrl = importedPr?.prUrl || `https://github.com/${repoMeta.owner}/${repoMeta.repo}/pulls`;

  // Validation Pre-flight Check
  const blockingErrors = validationMessages.filter((m) => m.level === "error");
  const warnings = validationMessages.filter((m) => m.level === "warning");

  // Auto-copy on open
  useEffect(() => {
    if (isOpen && markdown) {
      navigator.clipboard.writeText(markdown).then(() => {
        setCopied(true);
        const timer = setTimeout(() => setCopied(false), 2400);
        return () => clearTimeout(timer);
      }).catch(() => {
        // clipboard permission or focus error
      });
    }
  }, [isOpen, markdown]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleOpenGitHub = () => {
    const url = tab === "pr" ? prUrl : tab === "import" && hasNum ? editFileUrl : newFileUrl;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-fg">
                {tab === "pr"
                  ? "View Pull Request on GitHub"
                  : tab === "import"
                  ? "Update Proposal on GitHub"
                  : "Create Pull Request on GitHub"}
              </h3>
              <p className="text-xs text-muted">
                Target: {repoMeta.owner}/{repoMeta.repo} · branch: {repoMeta.branch}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs">
          {/* Target File Badge Box */}
          <div className="rounded-xl border border-border bg-bg/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Target Repository & File
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                <GitFork className="h-2.5 w-2.5" /> Auto-Fork Flow
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-card p-2.5 border border-border">
              <div className="font-mono text-xs text-fg">
                <span className="text-muted">{repoMeta.owner}/{repoMeta.repo}</span>
                <span className="text-muted/60">/</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{relativePath}</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-fg transition-colors"
                title="Copy markdown to clipboard"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-60" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Pre-flight CI Quality Gate */}
          {blockingErrors.length > 0 ? (
            <div className="rounded-xl border border-error/30 bg-error-soft/30 dark:bg-error-soft/10 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-error">
                <AlertTriangle className="h-4 w-4" />
                <span>{blockingErrors.length} Blocking CI Error{blockingErrors.length > 1 ? "s" : ""} Found</span>
              </div>
              <p className="text-[11px] text-body leading-relaxed">
                Official Ethereum CI (eipw) will reject this PR if submitted now. We recommend fixing these before opening a pull request:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted">
                {blockingErrors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err.message}</li>
                ))}
                {blockingErrors.length > 3 && (
                  <li>...and {blockingErrors.length - 3} more issue(s)</li>
                )}
              </ul>
            </div>
          ) : warnings.length > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft/30 dark:bg-warning-soft/10 p-3 text-[11px] text-warning">
              <Sparkles className="h-4 w-4 shrink-0 text-warning" />
              <span>
                All required CI rules pass! ({warnings.length} editorial advisories can be polished before merge).
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft/30 dark:bg-success-soft/10 p-3 text-[11px] text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <span>
                100% CI Parity Achieved! Proposal passes all format, title, CC0, and section checks.
              </span>
            </div>
          )}

          {/* Step-by-Step Instructions */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5">
            <p className="font-semibold text-fg text-xs">How GitHub Submission Works:</p>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-body leading-relaxed">
              <li>
                Your complete proposal markdown was{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {copied ? "copied to your clipboard" : "ready to paste"}
                </span>.
              </li>
              <li>
                Click <strong>"Open GitHub Web Editor"</strong> below. It will open GitHub with the filename (<code>{filename}</code>) pre-filled.
              </li>
              <li>
                Press <kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">Cmd+V</kbd> (or <kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">Ctrl+V</kbd>) into the editor.
              </li>
              <li>
                Click <strong>"Propose changes"</strong> at the bottom. GitHub will automatically fork the repository and open your Pull Request!
              </li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-fg shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 opacity-60" />}
            <span>{copied ? "Copied Markdown!" : "Copy Markdown"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOpenGitHub}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span>Open GitHub Web Editor</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
