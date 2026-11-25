"use client";

import { apiFetch } from "@/lib/api";
import { JOURNAL_CHANGE_EVENT, listTellEntries, restoreTellEntries, type JournalChange, type TellEntry } from "@/lib/tell-storage";

// The optional private journal backup (You → Data & Privacy). The journal
// lives on this device; with the backup on, a copy is kept in your account
// (stored encrypted: backend/src/journal-store.ts), so a new device can
// bring it back. Off by default. Turning it off removes the account copy.
//
// Nothing here ever deletes a local entry. Deletions made here are
// remembered until the server confirms them, so a merge can't bring a
// deleted entry back.

export const JOURNAL_BACKUP_KEY = "inner-pause:journal-backup";
export const JOURNAL_TOMBSTONES_KEY = "inner-pause:journal-backup-deleted";
export const JOURNAL_WIPE_PENDING_KEY = "inner-pause:journal-backup-wipe";

const isBrowser = () => typeof window !== "undefined";

export function isJournalBackupOn() {
  return isBrowser() && window.localStorage.getItem(JOURNAL_BACKUP_KEY) === "on";
}

function readTombstones(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(JOURNAL_TOMBSTONES_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeTombstones(ids: string[]) {
  if (ids.length === 0) window.localStorage.removeItem(JOURNAL_TOMBSTONES_KEY);
  else window.localStorage.setItem(JOURNAL_TOMBSTONES_KEY, JSON.stringify([...new Set(ids)]));
}

/** Whether this Inner Pause can keep a backup at all (the server's key is set up). */
export async function journalBackupAvailable() {
  try {
    const response = await apiFetch("/api/journal/config");
    return response.ok && ((await response.json()) as { available?: boolean }).available === true;
  } catch {
    return false;
  }
}

async function putEntry(entry: TellEntry) {
  const response = await apiFetch(`/api/journal/${encodeURIComponent(entry.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry }),
  });
  return response.ok;
}

async function deleteRemote(id: string) {
  const response = await apiFetch(`/api/journal/${encodeURIComponent(id)}`, { method: "DELETE" });
  return response.ok;
}

async function wipeRemote() {
  const response = await apiFetch("/api/journal", { method: "DELETE" });
  return response.ok;
}

/**
 * Brings this device and the account copy into step: confirms pending
 * deletions, restores entries written on other devices, and backs up any
 * this device has that the account doesn't. Quiet when off or signed out.
 */
export async function syncJournalNow(): Promise<"synced" | "off" | "signed-out" | "unavailable" | "failed"> {
  if (!isJournalBackupOn()) return "off";
  try {
    if (window.localStorage.getItem(JOURNAL_WIPE_PENDING_KEY)) {
      if (!(await wipeRemote())) return "failed";
      window.localStorage.removeItem(JOURNAL_WIPE_PENDING_KEY);
    }

    let tombstones = readTombstones();
    for (const id of tombstones) if (await deleteRemote(id)) tombstones = tombstones.filter((item) => item !== id);
    writeTombstones(tombstones);

    const response = await apiFetch("/api/journal");
    if (response.status === 401) return "signed-out";
    if (response.status === 503) return "unavailable";
    if (!response.ok) return "failed";
    const remote = ((await response.json()) as { entries?: TellEntry[] }).entries ?? [];

    const local = listTellEntries();
    const localIds = new Set(local.map((entry) => entry.id));
    const remoteIds = new Set(remote.map((entry) => entry.id));
    restoreTellEntries(remote.filter((entry) => !localIds.has(entry.id) && !tombstones.includes(entry.id)));
    for (const entry of local) if (!remoteIds.has(entry.id)) await putEntry(entry);
    return "synced";
  } catch {
    return "failed";
  }
}

export async function enableJournalBackup(): Promise<{ ok: boolean; message: string }> {
  if (!(await journalBackupAvailable())) return { ok: false, message: "Journal backup isn't available yet." };
  window.localStorage.setItem(JOURNAL_BACKUP_KEY, "on");
  const result = await syncJournalNow();
  if (result === "synced") return { ok: true, message: "Your journal is backed up to your account." };
  window.localStorage.removeItem(JOURNAL_BACKUP_KEY);
  if (result === "signed-out") return { ok: false, message: "Sign in to back up your journal." };
  return { ok: false, message: "Your journal couldn't be backed up right now. Please try again." };
}

/** Turns the backup off and removes the account copy. Entries on this device stay. */
export async function disableJournalBackup(): Promise<{ ok: boolean; message: string }> {
  window.localStorage.removeItem(JOURNAL_BACKUP_KEY);
  window.localStorage.removeItem(JOURNAL_TOMBSTONES_KEY);
  try {
    if (await wipeRemote()) {
      window.localStorage.removeItem(JOURNAL_WIPE_PENDING_KEY);
      return { ok: true, message: "Backup is off and the copy in your account is removed." };
    }
  } catch {
    // Remembered below.
  }
  window.localStorage.setItem(JOURNAL_WIPE_PENDING_KEY, "1");
  return { ok: false, message: "Backup is off. The copy in your account will be removed next time you're online and signed in." };
}

/**
 * Signing out: this device stops backing up (so another account signing in
 * here never receives these entries). The account copy stays.
 */
export function forgetJournalBackupOnThisDevice() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(JOURNAL_BACKUP_KEY);
  window.localStorage.removeItem(JOURNAL_TOMBSTONES_KEY);
  window.localStorage.removeItem(JOURNAL_WIPE_PENDING_KEY);
}

/** Deleting your Journey data also clears the account copy (Data & Privacy). */
export function wipeJournalBackupWithJourney() {
  if (!isJournalBackupOn()) return;
  window.localStorage.removeItem(JOURNAL_TOMBSTONES_KEY);
  window.localStorage.setItem(JOURNAL_WIPE_PENDING_KEY, "1");
  void syncJournalNow();
}

async function followLocalChange(change: JournalChange) {
  if (!isJournalBackupOn()) return;
  try {
    for (const entry of change.upserted ?? []) await putEntry(entry);
    for (const id of change.deleted ?? []) {
      writeTombstones([...readTombstones(), id]);
      if (await deleteRemote(id)) writeTombstones(readTombstones().filter((item) => item !== id));
    }
  } catch {
    // Picked up at the next sync.
  }
}

let started = false;

/** Mounted once for the app (components/journal-sync-agent.tsx). */
export function startJournalSync() {
  if (!isBrowser() || started) return () => {};
  started = true;
  const onChange = (event: Event) => void followLocalChange((event as CustomEvent<JournalChange>).detail);
  window.addEventListener(JOURNAL_CHANGE_EVENT, onChange);
  void syncJournalNow();
  return () => {
    started = false;
    window.removeEventListener(JOURNAL_CHANGE_EVENT, onChange);
  };
}
