import { useEffect, useState, useId } from "react";
import { Check, Copy, ExternalLink, Link2, Lock, Share2, Sparkles, X } from "lucide-react";
import type { ProposalData, RepoKind } from "../lib/types";
import { buildDraftShareUrl, compressDraft } from "../lib/draftShare";

interface Props {
  repo: RepoKind;
  data: ProposalData;
  markdown: string;
  lastEdited: "form" | "code";
  onClose: () => void;
}

export function ShareDraftModal({ repo, data, markdown, lastEdited, onClose }: Props) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [compressing, setCompressing] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<{ originalLen: number; compressedLen: number; ratio: number } | null>(null);

  const titleId = useId();

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      setCompressing(true);
      try {
        const payload = {
          v: 1 as const,
          r: repo,
          m: markdown,
          e: lastEdited,
          t: Date.now(),
        };
        const compressed = await compressDraft(payload);
        if (cancelled) return;

        const url = buildDraftShareUrl(compressed);
        setShareUrl(url);

        const orig = new TextEncoder().encode(markdown).length;
        const comp = compressed.length;
        const ratio = orig > 0 ? Math.max(0, Math.round((1 - comp / orig) * 100)) : 0;
        setStats({ originalLen: orig, compressedLen: comp, ratio });
      } catch (err) {
        console.error("Failed to generate share link:", err);
      } finally {
        if (!cancelled) setCompressing(false);
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [repo, markdown, lastEdited]);

  // Copy URL to clipboard
  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback selection
      const input = document.getElementById("share-url-input") as HTMLInputElement | null;
      if (input) {
        input.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const displayTitle = data.title?.trim() || "Untitled Proposal";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-sm font-bold text-fg">
                Share Proposal Draft
              </h2>
              <p className="text-[11px] text-muted">
                Private co-author link with draft compressed into URL hash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-fg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Proposal Summary Card */}
          <div className="rounded-xl border border-border bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                {repo.toUpperCase()} Draft
              </span>
              {stats && (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Compressed {stats.ratio}% smaller</span>
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-fg line-clamp-1">{displayTitle}</p>
            {stats && (
              <p className="text-[11px] text-muted">
                Original draft: {(stats.originalLen / 1024).toFixed(1)} KB &rarr; Hash payload:{" "}
                {(stats.compressedLen / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          {/* URL Box & Copy */}
          <div className="space-y-1.5">
            <label htmlFor="share-url-input" className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-indigo-500" />
              <span>Shareable Co-Author Link</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="share-url-input"
                  type="text"
                  readOnly
                  value={compressing ? "Generating compressed link…" : shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full rounded-xl border border-border bg-card py-2 pl-3 pr-8 font-mono text-xs text-fg select-all outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
              <button
                onClick={handleCopy}
                disabled={compressing || !shareUrl}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Privacy & Zero-Server Guarantee */}
          <div className="rounded-xl border border-border/80 bg-zinc-100/60 dark:bg-zinc-800/40 p-3.5 flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-fg">100% Client-Side & Private</p>
              <p className="text-muted text-[11px] leading-relaxed">
                The draft is stored directly inside the URL hash (<code className="font-mono text-fg">#draft=...</code>
                ). The hash is never transmitted across the network or stored in any database. When co-authors open this
                link, their browser decompresses the proposal straight into their private workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3.5 bg-zinc-50/50 dark:bg-zinc-900/50">
          {shareUrl ? (
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              <span>Test link in new tab</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span />
          )}

          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-1.5 text-xs font-medium text-fg shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
