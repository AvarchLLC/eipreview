// In-memory asset image registry for local blob previews in the browser
const assetMap = new Map<string, string>();

/**
 * Register a local Object URL (or Data URL) for a given asset path or filename.
 * E.g. registerAsset("../assets/eip-1234/diagram.png", "blob:https://...")
 */
export function registerAsset(pathOrFilename: string, objectUrl: string): void {
  assetMap.set(pathOrFilename, objectUrl);

  // Normalize without leading ../ or ./
  const clean = pathOrFilename.replace(/^\.\.?\//, "");
  assetMap.set(clean, objectUrl);

  // Also register just the filename (e.g. "diagram.png")
  const filename = pathOrFilename.split("/").pop();
  if (filename) {
    assetMap.set(filename, objectUrl);
  }
}

/**
 * Retrieve a local Object URL for an asset path or filename if registered.
 */
export function getAsset(path: string): string | undefined {
  if (assetMap.has(path)) return assetMap.get(path);

  const clean = path.replace(/^\.\.?\//, "");
  if (assetMap.has(clean)) return assetMap.get(clean);

  const filename = path.split("/").pop();
  if (filename && assetMap.has(filename)) return assetMap.get(filename);

  return undefined;
}
