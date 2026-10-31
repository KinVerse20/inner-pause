"use client";

import { useEffect, useState } from "react";

import { PauseShell } from "@/components/pause-shell";
import { SettingsSectionTitle, YouScreenHeader } from "@/components/settings-row";
import { ToggleSwitch } from "@/components/toggle-switch";
import { clearOfflineSounds, downloadPauseSoundsForOffline } from "@/lib/offline-audio";
import {
  DEFAULT_PREFERENCES,
  PRACTICE_SUPPORT_OPTIONS,
  getPreferences,
  subscribePreferences,
  updatePreferences,
  type PracticeSupportPreference,
  type PreferencesState,
  type ThemePreference,
} from "@/lib/preferences-store";

const THEME_OPTIONS: Array<{ id: ThemePreference; label: string }> = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

// You -> Preferences (docs/PRODUCT_FLOW.md §27): theme, sound, practice,
// and offline — the currently defined settings only. Offline lives here,
// not as a top-level You destination (this slice's brief §7).
export function YouPreferencesScreen() {
  // Starts at the SSR-safe default, not getPreferences() — that reads
  // localStorage, which differs between the server render and the
  // client's first render and produces a hydration mismatch (the same
  // class of bug fixed in components/moments-screen.tsx's dev panel). The
  // real value is read after mount instead.
  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences(getPreferences());
    return subscribePreferences(() => setPreferences(getPreferences()));
  }, []);

  const set = (patch: Partial<PreferencesState>) => setPreferences(updatePreferences(patch));

  // Offline: on downloads every card's sound now, off frees the space.
  const [offlineStatus, setOfflineStatus] = useState("");
  const setOffline = async (enabled: boolean) => {
    set({ offlineEnabled: enabled });
    if (!enabled) {
      await clearOfflineSounds();
      setOfflineStatus("");
      return;
    }
    setOfflineStatus("Downloading sounds…");
    try {
      const { files, bytes } = await downloadPauseSoundsForOffline();
      setOfflineStatus(
        files === 0
          ? "No sounds to download yet. Pages you open are kept for offline use."
          : `${files} ${files === 1 ? "sound" : "sounds"} ready offline (${(bytes / 1024 / 1024).toFixed(1)} MB).`,
      );
    } catch (error) {
      setOfflineStatus(error instanceof Error ? error.message : "Couldn't download the sounds. Try again when you're online.");
    }
  };

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Preferences" />

        <section className="space-y-2">
          <SettingsSectionTitle>Theme</SettingsSectionTitle>
          <div className="flex gap-2 rounded-[var(--ds-radius-md)] p-1.5" style={{ background: "var(--ds-surface)" }}>
            {THEME_OPTIONS.map((option) => {
              const active = preferences.theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ theme: option.id })}
                  className="ds-tap min-h-10 flex-1 rounded-[var(--ds-radius-sm)] text-[0.85rem] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  style={{
                    background: active ? "var(--ds-accent)" : "transparent",
                    color: active ? "var(--ds-accent-on)" : "var(--ds-text-secondary)",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <SettingsSectionTitle>Sound</SettingsSectionTitle>
          <div className="space-y-1 rounded-[var(--ds-radius-md)] px-4 py-1" style={{ background: "var(--ds-surface)" }}>
            <PreferenceToggleRow
              label="Ambient sound"
              description="The sound you choose, like river or rain. Off: a soft tone only"
              checked={preferences.soundAmbientEnabled}
              onChange={(value) => set({ soundAmbientEnabled: value })}
            />
            {/* Spoken guidance isn't built yet: shown, but not offered as a
                switch that would do nothing. */}
            <PreferenceToggleRow
              label="Voice guidance"
              description="Spoken cues during playback. Coming soon"
              checked={false}
              disabled
              onChange={() => {}}
            />
            <PreferenceToggleRow
              label="Frequency"
              description="Each Pause's sound, tuned to its frequency"
              checked={preferences.soundToneLayerEnabled}
              onChange={(value) => set({ soundToneLayerEnabled: value })}
            />
          </div>
        </section>

        <section className="space-y-2">
          <SettingsSectionTitle>Practice</SettingsSectionTitle>
          <div className="space-y-2 rounded-[var(--ds-radius-md)] px-4 py-3.5" style={{ background: "var(--ds-surface)" }}>
            <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
              What tends to help you most? Saved for upcoming Practice updates, which will use it to tailor your sessions.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRACTICE_SUPPORT_OPTIONS.map((option) => {
                const active = preferences.practicePreferredSupport === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      set({
                        practicePreferredSupport: active ? null : (option.id as PracticeSupportPreference),
                      })
                    }
                    className="ds-tap min-h-11 rounded-full border px-3 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                    style={{
                      borderColor: active ? "var(--ds-accent)" : "var(--ds-border)",
                      background: active ? "var(--ds-accent-soft)" : "transparent",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <SettingsSectionTitle>Offline</SettingsSectionTitle>
          <div className="rounded-[var(--ds-radius-md)] px-4 py-1" style={{ background: "var(--ds-surface)" }}>
            <PreferenceToggleRow
              label="Make Pauses available offline"
              description="Downloads every Pause's sound, so Pauses and pages you've opened keep working without a connection. Journaling is always saved on this device."
              checked={preferences.offlineEnabled}
              onChange={(value) => void setOffline(value)}
            />
            {offlineStatus ? (
              <p role="status" className="pb-3 text-[0.76rem]" style={{ color: "var(--ds-text-secondary)" }}>
                {offlineStatus}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </PauseShell>
  );
}

function PreferenceToggleRow({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3" style={disabled ? { opacity: 0.55 } : undefined}>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9rem] font-medium">{label}</span>
        <span className="block text-[0.76rem]" style={{ color: "var(--ds-text-secondary)" }}>
          {description}
        </span>
      </span>
      <ToggleSwitch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}
