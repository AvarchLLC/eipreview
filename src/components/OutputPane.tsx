import { forwardRef, useMemo, useState } from "react";
import { marked } from "marked";
import { Check, Copy, Eye } from "lucide-react";
import { splitFrontmatter } from "../lib/markdown";

marked.setOptions({ gfm: true, breaks: false });

interface Props {
  markdown: string;
}

export const OutputPane = forwardRef<HTMLDivElement, Props>(function OutputPane(
  { markdown },
  ref
) {
  const [copied, setCopied] = useState(false);

  const { frontmatter, body } = useMemo(() => splitFrontmatter(markdown), [markdown]);
  const rows = useMemo(
    () =>
      frontmatter
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => {
          const i = l.indexOf(":");
          return i === -1 ? [l.trim(), ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
        }),
    [frontmatter]
  );
  const html = useMemo(() => marked.parse(body) as string, [body]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const lineCount = markdown.split("\n").length;

  return (
    <div ref={ref} className="flex h-full flex-col bg-card">
      {/* Pane Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-bg px-3 py-2">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-muted" />
          <span className="text-xs font-semibold text-fg">Rendered Preview</span>
          <span className="hidden sm:inline-flex items-center rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted shadow-2xs">
            Live Sync
          </span>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] text-muted">
            {lineCount} lines · {markdown.length} chars
          </span>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-fg shadow-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 cursor-pointer"
            title="Copy full Markdown draft to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 opacity-70" />}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </button>
        </div>
      </div>

      {/* Pane Content - Pure Rendered Proposal */}
      <div className="min-h-0 flex-1 overflow-auto bg-card">
        <div className="mx-auto max-w-3xl p-5 sm:p-8">
          {rows.length > 0 && (
            <div className="mb-8 overflow-hidden rounded-xl border border-border shadow-xs">
              <div className="border-b border-border bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Preamble Metadata
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {rows.map(([k, v], i) => (
                    <tr
                      key={i}
                      className="border-b border-border/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                    >
                      <td className="w-44 bg-zinc-50 dark:bg-zinc-900/40 px-3 py-2 font-mono text-[11px] font-medium text-muted">
                        {k}
                      </td>
                      <td className="px-3 py-2 text-body">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="prose-eip" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
});
