import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from "react";
import { Image as ImageIcon, Upload, X, Check, Sparkles, AlertCircle } from "lucide-react";
import type { RepoKind } from "../lib/types";
import { registerAsset } from "../lib/assetRegistry";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdownSnippet: string) => void;
  repo: RepoKind;
  eipNumber?: string;
  sectionName?: string;
}

export function ImageEmbedModal({
  isOpen,
  onClose,
  onInsert,
  repo,
  eipNumber,
  sectionName,
}: Props) {
  const [altText, setAltText] = useState("Architecture Diagram");
  const [fileName, setFileName] = useState("diagram.png");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const num = eipNumber && /^\d+$/.test(eipNumber) ? eipNumber : "XXXX";
  const repoPrefix = repo === "erc" ? "erc" : repo === "rip" ? "rip" : "eip";
  const cleanFileName = fileName.trim().replace(/\s+/g, "-") || "diagram.png";
  const assetPath = `../assets/${repoPrefix}-${num}/${cleanFileName}`;

  // Reset fields when opening
  useEffect(() => {
    if (isOpen) {
      if (!fileName) setFileName("diagram.png");
      if (!altText) setAltText("Architecture Diagram");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const cleanName = file.name.replace(/\s+/g, "-");
    setFileName(cleanName);
    if (!altText || altText === "Architecture Diagram") {
      const derivedAlt = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setAltText(derivedAlt);
    }
    const sizeKb = (file.size / 1024).toFixed(1);
    setFileSize(`${sizeKb} KB`);

    // Register into memory store for in-app preview
    const computedPath = `../assets/${repoPrefix}-${num}/${cleanName}`;
    registerAsset(computedPath, url);
    registerAsset(cleanName, url);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleInsert = () => {
    const finalAlt = altText.trim() || "Image Description";
    const snippet = `![${finalAlt}](${assetPath})`;
    onInsert(snippet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-fg">Insert Proposal Image</h3>
              <p className="text-xs text-muted">
                Official EIP-1 asset linking for {sectionName || "your proposal"}
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

        <div className="space-y-4 py-4">
          {/* File Dropzone & Preview */}
          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">
              Select or Drop Image File <span className="text-muted font-normal">(Optional local preview)</span>
            </label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-zinc-400 dark:hover:border-zinc-600 bg-bg/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={onFileInputChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-32 max-w-full rounded-lg border border-border object-contain shadow-xs bg-card"
                  />
                  <div className="flex items-center gap-2 text-xs font-mono text-muted">
                    <span className="font-medium text-fg">{cleanFileName}</span>
                    {fileSize && <span>({fileSize})</span>}
                  </div>
                  <span className="text-[11px] text-accent font-medium hover:underline">
                    Click to replace image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <div className="rounded-full bg-card p-2 text-muted border border-border shadow-2xs">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium text-fg">
                    Drop PNG, SVG, or JPG here, or <span className="text-accent">browse</span>
                  </p>
                  <p className="text-[11px] text-muted">
                    Generates instant in-browser preview while authoring
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Alt text input */}
          <div>
            <label className="block text-xs font-medium text-fg mb-1">
              Alt Text / Description
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g. Architecture Overview Diagram"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-fg placeholder:text-muted/50 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Filename input */}
          <div>
            <label className="block text-xs font-medium text-fg mb-1">
              File Name in assets folder
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. architecture-overview.png"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs font-mono text-fg placeholder:text-muted/50 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Generated EIP-1 Markdown Preview */}
          <div className="rounded-xl border border-border bg-bg/80 p-3">
            <div className="flex items-center justify-between text-[11px] text-muted mb-1">
              <span className="font-semibold text-fg">EIP-1 Compliant Markdown Snippet</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                <Sparkles className="h-2.5 w-2.5" /> Relative Path
              </span>
            </div>
            <code className="block select-all rounded-md bg-card p-2 font-mono text-xs text-fg border border-border break-all">
              ![{altText.trim() || "image"}]({assetPath})
            </code>
          </div>

          {/* EIP-1 rule notice */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <span>
              Per EIP-1, all images must reside in <code className="font-mono font-semibold">assets/{repoPrefix}-{num}/</code>. External image hosts (like Imgur or AWS) are rejected by Ethereum CI.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-fg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-fg shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Insert Image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
