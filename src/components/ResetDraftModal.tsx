import { useId } from "react";
import { AlertTriangle, RotateCcw, X } from "lucide-react";
import type { RepoKind } from "../lib/types";

interface Props {
  repo: RepoKind;
  onConfirm: () => void;
  onClose: () => void;
}

export function ResetDraftModal({ repo, onConfirm, onClose }: Props) {
  const titleId = useId();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 shadow-2xs">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-sm font-bold text-fg">
                Reset Draft to Blank Template?
              </h2>
              <p className="text-[11px] text-muted">Clear current {repo.toUpperCase()} draft</p>
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

        {/* Content */}
        <div className="p-5 space-y-3 text-xs leading-relaxed text-muted">
          <p>
            Are you sure you want to clear your current <strong className="text-fg">{repo.toUpperCase()}</strong> draft?
            All form fields and raw markdown will be reset to the official default template.
          </p>

          <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/30 p-3 flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-[11px]">
              Don&apos;t worry: your current draft will be automatically backed up in your browser storage so you can undo
              if you change your mind.
            </p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-fg shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold px-4 py-2 text-xs shadow-xs transition-all duration-150 active:scale-95 cursor-pointer"
          >
            Reset to Blank
          </button>
        </div>
      </div>
    </div>
  );
}
