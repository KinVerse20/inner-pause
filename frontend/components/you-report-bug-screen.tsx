"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PauseShell } from "@/components/pause-shell";
import { YouScreenHeader } from "@/components/settings-row";
import { getAccount, subscribeAccount, type LocalAccount } from "@/lib/account-store";
import { apiFetch } from "@/lib/api";
import { haptic } from "@/lib/haptics";

// You -> Report a bug (docs/COMMERCIAL_PLAN.md C6): what happened, and a
// screenshot if there is one. A report the founder finds is a real bug gives
// a month of Pass (C7). The page it came from is sent along (?from=).

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const MAX_LENGTH = 4000;

export function YouReportBugScreen() {
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setAccount(getAccount());
    refresh();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrom(new URLSearchParams(window.location.search).get("from") ?? document.referrer.replace(window.location.origin, ""));
    return subscribeAccount(refresh);
  }, []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (chosen: File | undefined) => {
    setError(null);
    if (!chosen) return;
    if (!chosen.type.startsWith("image/") && !/\.(heic|heif)$/i.test(chosen.name)) {
      setError("The screenshot needs to be an image.");
      return;
    }
    if (chosen.size > MAX_SCREENSHOT_BYTES) {
      setError("That image is over 5 MB. Please choose a smaller one.");
      return;
    }
    setFile(chosen);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (description.trim().length < 5) {
      setError("Tell us a little about what happened.");
      return;
    }
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("description", description.trim());
    form.set("page", `${from || "unknown"} · ${window.innerWidth}×${window.innerHeight}`);
    if (file) form.set("screenshot", file);
    try {
      const response = await apiFetch("/api/bugs", { method: "POST", body: form });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "It didn't send. Please try again.");
      }
      haptic("success");
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error && caught.message !== "Failed to fetch" ? caught.message : "It didn't send. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Report a bug" />

        <section className="rounded-[var(--ds-radius-lg)] px-5 py-4" style={{ background: "var(--ds-accent-soft)" }}>
          <p className="text-[0.95rem] font-semibold">Found something broken?</p>
          <p className="mt-1 text-[0.88rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            Tell us what happened. If it turns out to be a real bug, we&rsquo;ll add a month to your Pass as a thank you.
          </p>
        </section>

        {sent ? (
          <section className="ds-card px-5 py-6 text-center" role="status">
            <p className="ds-h3">Thank you</p>
            <p className="mt-1.5 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              We&rsquo;ll look into it. If it&rsquo;s a real bug, you&rsquo;ll get an email when your month is added.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setDescription("");
                removeFile();
              }}
              className="ds-tap mt-4 min-h-11 rounded-full px-4 text-[0.9rem] font-semibold"
              style={{ color: "var(--ds-accent)" }}
            >
              Report another
            </button>
          </section>
        ) : !account ? (
          <section className="space-y-3">
            <Link href="/auth?redirectTo=/profile/report-bug" className="ds-filled ds-tap flex w-full justify-center">
              Sign in to report a bug
            </Link>
            <p className="text-center text-[0.8rem]" style={{ color: "var(--ds-text-muted)" }}>
              So we know whose Pass to thank.
            </p>
          </section>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="bug-description" className="ds-h3 block">
                What happened?
              </label>
              <textarea
                id="bug-description"
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, MAX_LENGTH))}
                placeholder="What you did, what you expected, and what happened instead"
                className="ds-field min-h-[9rem] w-full resize-none text-base leading-6"
                maxLength={MAX_LENGTH}
                required
              />
            </div>

            <div className="space-y-2">
              <p className="ds-h3" id="bug-screenshot-label">
                Screenshot <span className="text-[0.85rem] font-normal" style={{ color: "var(--ds-text-muted)" }}>(if you have one)</span>
              </p>
              <input
                ref={fileInput}
                id="bug-screenshot"
                type="file"
                accept="image/*,.heic,.heif"
                className="sr-only"
                aria-labelledby="bug-screenshot-label"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
              {preview ? (
                <div className="ds-card flex items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Your screenshot" className="h-20 w-14 shrink-0 rounded-[var(--ds-radius-sm)] object-cover" />
                  <p className="min-w-0 flex-1 truncate text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
                    {file?.name}
                  </p>
                  <button type="button" onClick={removeFile} className="ds-tap min-h-11 rounded-full px-3 text-[0.85rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
                    Remove
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="bug-screenshot"
                  className="ds-tap flex min-h-14 cursor-pointer items-center justify-center rounded-[var(--ds-radius-md)] border border-dashed text-[0.9rem] font-semibold"
                  style={{ borderColor: "var(--ds-border)", color: "var(--ds-accent)" }}
                >
                  Add a screenshot
                </label>
              )}
            </div>

            {error ? (
              <p role="alert" className="text-[0.85rem]" style={{ color: "var(--ds-error)" }}>
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={busy} className="ds-filled ds-tap w-full disabled:opacity-55">
              {busy ? "Sending" : "Send report"}
            </button>
          </form>
        )}
      </div>
    </PauseShell>
  );
}
