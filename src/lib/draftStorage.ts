import type { ProposalData, RepoKind } from "./types";
import { EMPTY_PROPOSAL, generateMarkdown } from "./markdown";

export interface SavedDraft {
  repo: RepoKind;
  data: ProposalData;
  markdown: string;
  lastEdited: "form" | "code";
  savedAt: number; // Date.now()
}

const STORAGE_KEY_PREFIX = "eipreview_draft_";
const BACKUP_KEY_PREFIX = "eipreview_draft_backup_";

/**
 * Checks if proposal data has any meaningful user input.
 */
export function isProposalEmpty(data?: ProposalData | null, markdown?: string | null): boolean {
  if (!data) return true;
  const hasFields = Boolean(
    data.title?.trim() ||
    data.description?.trim() ||
    data.author?.trim() ||
    data.abstract?.trim() ||
    data.specification?.trim() ||
    data.motivation?.trim() ||
    data.rationale?.trim() ||
    data.securityConsiderations?.trim()
  );
  if (hasFields) return false;

  if (markdown) {
    const emptyMd = generateMarkdown(EMPTY_PROPOSAL).trim();
    if (markdown.trim() !== emptyMd && markdown.trim().length > emptyMd.length + 20) {
      return false;
    }
  }

  return true;
}

/**
 * Save draft into localStorage for the given repo type.
 */
export function saveDraft(
  repo: RepoKind,
  data: ProposalData,
  markdown: string,
  lastEdited: "form" | "code"
): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;

  // Don't clutter localStorage with pristine empty proposals
  if (isProposalEmpty(data, markdown)) {
    clearDraft(repo);
    return false;
  }

  try {
    const draft: SavedDraft = {
      repo,
      data,
      markdown,
      lastEdited,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY_PREFIX + repo, JSON.stringify(draft));
    return true;
  } catch (err) {
    console.warn("Could not save proposal draft to localStorage:", err);
    return false;
  }
}

/**
 * Load draft from localStorage for the given repo type.
 */
export function loadDraft(repo: RepoKind): SavedDraft | null {
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + repo);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDraft;
    if (parsed && parsed.data && parsed.markdown) {
      return parsed;
    }
  } catch (err) {
    console.warn("Could not load proposal draft from localStorage:", err);
  }
  return null;
}

/**
 * Remove draft from localStorage for the given repo type.
 */
export function clearDraft(repo: RepoKind): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_PREFIX + repo);
  } catch (err) {
    console.warn("Could not clear proposal draft from localStorage:", err);
  }
}

/**
 * Backup the current draft before overwriting or resetting.
 */
export function backupDraft(repo: RepoKind): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY_PREFIX + repo);
    if (existing) {
      window.localStorage.setItem(BACKUP_KEY_PREFIX + repo, existing);
      return true;
    }
  } catch (err) {
    console.warn("Could not backup proposal draft:", err);
  }
  return false;
}

/**
 * Restore previously backed-up draft.
 */
export function restoreBackupDraft(repo: RepoKind): SavedDraft | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(BACKUP_KEY_PREFIX + repo);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDraft;
    if (parsed && parsed.data && parsed.markdown) {
      // Put it back in active storage
      window.localStorage.setItem(STORAGE_KEY_PREFIX + repo, raw);
      window.localStorage.removeItem(BACKUP_KEY_PREFIX + repo);
      return parsed;
    }
  } catch (err) {
    console.warn("Could not restore backup proposal draft:", err);
  }
  return null;
}

/**
 * Check if a backup exists for undo recovery.
 */
export function hasBackupDraft(repo: RepoKind): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    return Boolean(window.localStorage.getItem(BACKUP_KEY_PREFIX + repo));
  } catch {
    return false;
  }
}
