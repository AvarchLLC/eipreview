import type { RepoKind } from "./types";

export interface SharedDraftPayload {
  v: 1; // Schema version
  r: RepoKind; // "eip" | "erc" | "rip"
  m: string; // Complete Markdown content
  e?: "form" | "code"; // Last edited tab mode
  t?: number; // Creation timestamp
}

/**
 * Encodes a Uint8Array into URL-safe Base64 (RFC 4648 §5).
 */
export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decodes a URL-safe Base64 string into a Uint8Array.
 */
export function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let b64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compresses draft payload into a compact URL-safe hash string.
 * Uses native Web Streams deflate compression if available, with base64url fallback.
 */
export async function compressDraft(payload: SharedDraftPayload): Promise<string> {
  const jsonStr = JSON.stringify(payload);

  if (typeof CompressionStream !== "undefined") {
    try {
      const stream = new Blob([new TextEncoder().encode(jsonStr)]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream("deflate"));
      const arrayBuf = await new Response(compressedStream).arrayBuffer();
      return uint8ArrayToBase64Url(new Uint8Array(arrayBuf));
    } catch (err) {
      console.warn("Native CompressionStream failed, using uncompressed base64url:", err);
    }
  }

  // Fallback: UTF-8 safe base64url
  const encoded = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(encoded).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decompresses and parses a draft payload from URL hash or query string.
 */
export async function decompressDraft(hashOrParam: string): Promise<SharedDraftPayload | null> {
  // Strip any leading '#' or 'draft='
  const clean = hashOrParam.replace(/^#?draft=/, "").trim();
  if (!clean) return null;

  // 1. Try native DecompressionStream with deflate
  if (typeof DecompressionStream !== "undefined") {
    try {
      const bytes = base64UrlToUint8Array(clean);
      const stream = new Blob([bytes.buffer as ArrayBuffer]).stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream("deflate"));
      const text = await new Response(decompressedStream).text();
      const parsed = JSON.parse(text) as SharedDraftPayload;
      if (parsed && parsed.m && parsed.r) {
        return parsed;
      }
    } catch {
      // Continue to fallback if not compressed or using fallback encoding
    }
  }

  // 2. Try uncompressed base64url fallback
  try {
    let b64 = clean.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const jsonStr = decodeURIComponent(
      Array.from(binary)
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonStr) as SharedDraftPayload;
    if (parsed && parsed.m && parsed.r) {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to decompress shared draft:", err);
  }

  return null;
}

/**
 * Constructs the full shareable URL for a compressed draft.
 */
export function buildDraftShareUrl(compressedPayload: string, origin?: string): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "https://eipreview.com");
  return `${base}/new#draft=${compressedPayload}`;
}
