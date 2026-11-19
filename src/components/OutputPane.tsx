import { forwardRef, useMemo, useState } from "react";
import { marked } from "marked";
import { Check, Code2, Copy, Eye } from "lucide-react";
import { splitFrontmatter } from "../lib/markdown";
import { cn } from "../lib/cn";

marked.setOptions({ gfm: true, breaks: false });

interface Props {
  markdown: string;
  onMarkdownChange: (value: string) => void;
  tab: "code" | "preview";
  onTab: (t: "code" | "preview") => void;
}

export const OutputPane = forwardRef<HTMLTextAreaElement, Props>(function OutputPane(
  { markdown, onMarkdownChange, tab, onTab },
  codeRef
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
    <div className="flex h-full flex-col bg-card">
      {/* Pane Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-bg px-3 py-2">
        {/* Tab switch */}
        <div className="inline-flex items-center rounded-lg border border-border bg-zinc-100 dark:bg-zinc-900 p-0.5 gap-0.5">
          <button
            onClick={() => onTab("code")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none",
              tab === "code"
                ? "bg-card text-fg shadow-xs font-semibold"
                : "text-muted hover:text-fg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
            )}
          >
            <Code2 className="h-3.5 w-3.5 opacity-70" /> Raw Markdown
          </button>
          <button
            onClick={() => onTab("preview")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none",
              tab === "preview"
                ? "bg-card text-fg shadow-xs font-semibold"
                : "text-muted hover:text-fg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
            )}
          >
            <Eye className="h-3.5 w-3.5 opacity-70" /> Rendered
          </button>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] text-muted">
            {lineCount} lines · {markdown.length} chars
          </span>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-fg shadow-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 opacity-70" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Pane Content */}
      <div className="min-h-0 flex-1 overflow-auto bg-card">
        {tab === "code" ? (
          <div className="relative h-full">
            <textarea
              ref={codeRef}
              value={markdown}
              onChange={(e) => onMarkdownChange(e.target.value)}
              spellCheck={false}
              className="h-full min-h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-[1.8] text-fg outline-none selection:bg-zinc-200 dark:selection:bg-zinc-800"
            />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl p-5 sm:p-8">
            {rows.length > 0 && (
              <div className="mb-8 overflow-hidden rounded-xl border border-border shadow-xs">
                <div className="border-b border-border bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Preamble Metadata
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {rows.map(([k, v], i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
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
        )}
      </div>
    </div>
  );
});
