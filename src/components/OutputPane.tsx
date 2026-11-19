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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="inline-flex items-center rounded-lg border border-border/70 bg-bg p-0.5">
          <button
            onClick={() => onTab("code")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "code" ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted hover:text-fg"
            )}
          >
            <Code2 className="h-3.5 w-3.5" /> Code
          </button>
          <button
            onClick={() => onTab("preview")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "preview" ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted hover:text-fg"
            )}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">{markdown.length} chars</span>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-body transition-colors hover:bg-card"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-bg">
        {tab === "code" ? (
          <textarea
            ref={codeRef}
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            spellCheck={false}
            className="h-full min-h-full w-full resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-[1.7] text-fg outline-none"
          />
        ) : (
          <div className="p-4 sm:p-6">
            {rows.length > 0 && (
              <table className="mb-6 w-full overflow-hidden rounded-lg border border-border text-sm">
                <tbody>
                  {rows.map(([k, v], i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="w-40 bg-card/60 px-3 py-1.5 font-mono text-[12px] font-medium text-muted">{k}</td>
                      <td className="px-3 py-1.5 text-body">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="prose-eip" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </div>
    </div>
  );
});
