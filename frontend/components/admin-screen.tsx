"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  CARD_ICONS,
  CARD_TONES,
  CHAKRA_IDS,
  MAX_CARDS,
  MAX_FREQUENCY_HZ,
  MAX_SKILLS,
  MAX_SOUNDS_PER_CARD,
  MIN_FREQUENCY_HZ,
  PRACTICE_ACTIVITY_TYPES,
  cardFrequencyHz,
  formatFrequencyLabel,
  type CardInput,
  type PublicCard,
  type SkillDefinition,
  type SkillInput,
  type CourseContent,
  type CourseMilestone,
  type CourseSession,
  type PracticeActivityTypeId,
  type PublicAppContent,
  type SoundAsset,
  type SoundRenderInfo,
} from "@inner-pause/shared";

import { CardIcon } from "@/components/card-icon";
import { chakraMap } from "@/data/chakras";
import {
  createCard,
  deleteCard,
  deleteSound,
  listSounds,
  createSkill,
  deleteSkill,
  saveCardOrder,
  saveSkillOrder,
  updateSkill,
  updateCard,
  updateSound,
  uploadSound,
} from "@/lib/admin-client";
import { apiUrl } from "@/lib/api";
import { AAC_TYPE, OPUS_TYPE, webmUrl } from "@/lib/render-format";
import { getCurrentUser, type AuthUser } from "@/lib/auth-client";
import { refreshAppContent } from "@/lib/content-store";
import { pauseCategories, type PauseCategoryId } from "@/lib/pause-categories";
import { getDefaultCoreArc } from "@/lib/practice-content";
import { MILESTONE_PATHS } from "@/lib/practice-milestones";
import { isBuiltInSkillId, type PracticeSkillId } from "@/lib/practice-skills";

// /admin: the content back office. Sounds (upload a library of
// environments, each with a name, short line and cover), Cards (create,
// edit, reorder, hide and delete Home's Right Now cards and choose the
// sounds each offers), Courses (create, edit, reorder, hide and delete
// Practice courses: their sessions and milestone paths).
// Access is enforced by the backend (ADMIN_EMAILS); this screen only
// reflects it.

type Tab = "sounds" | "cards" | "courses";
type AccessState = { status: "loading" } | { status: "unreachable" } | { status: "signed-out" } | { status: "forbidden"; user: AuthUser } | { status: "ready"; user: AuthUser };

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "sounds", label: "Sounds" },
  { id: "cards", label: "Cards" },
  { id: "courses", label: "Courses" },
];

const ACTIVITY_LABELS: Record<PracticeActivityTypeId, string> = {
  reflection: "Reflection",
  observation: "Observation",
  "behavioural-rep": "Behavioural rep",
  "communication-action": "Communication action",
  reframing: "Reframing",
  "decision-exercise": "Decision exercise",
};

export function AdminScreen() {
  const [access, setAccess] = useState<AccessState>({ status: "loading" });
  const [tab, setTab] = useState<Tab>("sounds");
  const [sounds, setSounds] = useState<SoundAsset[]>([]);
  const [content, setContent] = useState<PublicAppContent | null>(null);
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoadError("");
      const [nextSounds, nextContent] = await Promise.all([listSounds(), refreshAppContent()]);
      setSounds(nextSounds);
      setContent(nextContent);
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : "Could not load admin data.");
    }
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (!user) setAccess({ status: "signed-out" });
        else if (!user.isAdmin) setAccess({ status: "forbidden", user });
        else {
          setAccess({ status: "ready", user });
          void reload();
        }
      })
      .catch(() => setAccess({ status: "unreachable" }));
  }, [reload]);

  // While the server is rendering sounds (backend/src/render-store.ts),
  // keep their status and progress live.
  const rendering =
    (content?.cards.some((card) => card.sounds.some((sound) => sound.renderStatus === "pending")) ?? false) ||
    sounds.some((sound) => sound.renders?.some((render) => render.status === "pending" || render.status === "rendering"));
  useEffect(() => {
    if (!rendering) return;
    const timer = window.setInterval(() => void reload(), RENDER_POLL_MS);
    return () => window.clearInterval(timer);
  }, [rendering, reload]);

  if (access.status !== "ready") {
    return (
      <AdminFrame>
        <div className="ds-card space-y-3 px-5 py-6 text-center">
          {access.status === "loading" ? (
            <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>Checking access…</p>
          ) : access.status === "unreachable" ? (
            <>
              <p className="font-semibold">Couldn&rsquo;t reach the server.</p>
              <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>Check that the backend is running, then try again.</p>
              <button type="button" onClick={() => window.location.reload()} className="ds-filled ds-tap inline-flex">
                Try again
              </button>
            </>
          ) : access.status === "signed-out" ? (
            <>
              <p className="font-semibold">Sign in to manage content.</p>
              <Link href="/auth?redirectTo=/admin" className="ds-filled ds-tap inline-flex">Sign in</Link>
            </>
          ) : (
            <>
              <p className="font-semibold">Admins only.</p>
              <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                {access.user.email} is not an admin. Add it to ADMIN_EMAILS on the backend and restart it.
              </p>
            </>
          )}
        </div>
      </AdminFrame>
    );
  }

  return (
    <AdminFrame email={access.user.email}>
      <div className="inline-flex rounded-full p-1" style={{ background: "var(--ds-accent-soft)" }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
            className="ds-tap min-h-11 rounded-full px-4 text-sm font-semibold"
            style={{
              background: tab === item.id ? "var(--ds-accent)" : "transparent",
              color: tab === item.id ? "var(--ds-accent-on)" : "var(--ds-text-secondary)",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loadError ? <Notice tone="error">{loadError}</Notice> : null}

      {!content ? (
        <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>Loading…</p>
      ) : tab === "sounds" ? (
        <SoundsPanel sounds={sounds} onChanged={reload} />
      ) : tab === "cards" ? (
        <CardsPanel sounds={sounds} content={content} onSaved={reload} />
      ) : (
        <CoursesPanel content={content} onSaved={reload} />
      )}
    </AdminFrame>
  );
}

// ---------- Sounds ----------

function SoundsPanel({ sounds, onChanged }: { sounds: SoundAsset[]; onChanged: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const upload = async () => {
    if (!file || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const sound = await uploadSound({
        name: name.trim() || file.name.replace(/\.[^.]+$/, ""),
        description: description.trim(),
        file,
        cover,
      });
      setMessage({ tone: "success", text: `Uploaded "${sound.name}". Add it to a card on the Cards tab.` });
      setName("");
      setDescription("");
      setFile(null);
      setCover(null);
      setInputKey((key) => key + 1);
      await onChanged();
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Upload failed." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (sound: SoundAsset) => {
    if (!window.confirm(`Delete "${sound.name}"? It will be removed from every card that uses it.`)) return;
    try {
      await deleteSound(sound.id);
      await onChanged();
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Delete failed." });
    }
  };

  return (
    <div className="space-y-5">
      <Section
        title="Upload a sound"
        hint="Rain, river, forest, bowls. For the best quality upload WAV or FLAC (48 kHz, 24-bit); MP3, M4A, AAC, OGG and WebM work too. Up to 300 MB. Once a sound is on a card, the server tunes it to the card's frequency, levels its loudness and makes it loop seamlessly. Cover: JPG, PNG or WebP, up to 5 MB."
      >
        <Field label="Name">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Gentle river" className="ds-field" />
        </Field>
        <Field label="Short line shown on the card">
          <input
            value={description}
            maxLength={140}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g. Slow water over stones"
            className="ds-field"
          />
        </Field>
        <Field label="Audio file">
          <input key={`audio-${inputKey}`} type="file" accept="audio/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-full file:border file:border-[var(--ds-border)] file:bg-transparent file:px-4 file:font-semibold file:text-[var(--ds-text)]" />
        </Field>
        <Field label="Cover image (optional)">
          <input
            key={`cover-${inputKey}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setCover(event.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-full file:border file:border-[var(--ds-border)] file:bg-transparent file:px-4 file:font-semibold file:text-[var(--ds-text)]"
          />
        </Field>
        <button type="button" disabled={!file || busy} onClick={() => void upload()} className="ds-filled ds-tap disabled:opacity-60">
          {busy ? "Uploading…" : "Upload"}
        </button>
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      </Section>

      <Section title={`Library (${sounds.length})`}>
        {sounds.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>No sounds yet. Upload one above.</p>
        ) : (
          <ul className="space-y-3">
            {sounds.map((sound) => (
              <li key={sound.id} className="space-y-2.5 rounded-[var(--ds-radius-md)] border px-3.5 py-3" style={{ borderColor: "var(--ds-border)" }}>
                {/* Wraps on phones: details take the width, Edit/Delete drop below. */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <SoundThumb coverUrl={sound.coverUrl} />
                  <span className="min-w-0 flex-1 basis-40">
                    <span className="block truncate font-semibold">{sound.name}</span>
                    {sound.description ? (
                      <span className="block truncate text-xs" style={{ color: "var(--ds-text-secondary)" }}>{sound.description}</span>
                    ) : null}
                    <span className="block break-words text-xs" style={{ color: "var(--ds-text-muted)" }}>
                      {sound.fileName} · {(sound.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </span>
                  <span className="ml-auto flex shrink-0 gap-1">
                    <button type="button" onClick={() => setEditingId(editingId === sound.id ? null : sound.id)} className="ds-tap inline-flex min-h-11 items-center px-2.5 text-sm font-medium" style={{ color: "var(--ds-accent)" }}>
                      {editingId === sound.id ? "Close" : "Edit"}
                    </button>
                    <button type="button" onClick={() => void remove(sound)} className="ds-tap inline-flex min-h-11 items-center px-2.5 text-sm font-medium" style={{ color: "var(--ds-error)" }}>
                      Delete
                    </button>
                  </span>
                </div>
                <SoundRenders soundName={sound.name} renders={sound.renders} />
                {editingId === sound.id ? (
                  <SoundEditor
                    sound={sound}
                    onSaved={async () => {
                      setEditingId(null);
                      setMessage({ tone: "success", text: `Saved "${sound.name}".` });
                      await onChanged();
                    }}
                  />
                ) : null}
                <div className="space-y-1">
                  <p className="text-xs font-semibold" style={{ color: "var(--ds-text-secondary)" }}>
                    Original upload
                  </p>
                  <audio controls preload="none" src={apiUrl(sound.url)} className="w-full" aria-label={`Preview ${sound.name}, original upload`} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function SoundEditor({ sound, onSaved }: { sound: SoundAsset; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(sound.name);
  const [description, setDescription] = useState(sound.description);
  const [cover, setCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await updateSound(sound.id, { name: name.trim(), description: description.trim(), cover, removeCover });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2.5 rounded-[var(--ds-radius-sm)] px-3 py-3" style={{ background: "var(--ds-bg)" }}>
      <Field label="Name">
        <input value={name} onChange={(event) => setName(event.target.value)} className="ds-field" />
      </Field>
      <Field label="Short line shown on the card">
        <input value={description} maxLength={140} onChange={(event) => setDescription(event.target.value)} className="ds-field" />
      </Field>
      <Field label={sound.coverUrl ? "Replace cover image" : "Add a cover image"}>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCover(event.target.files?.[0] ?? null)} className="block w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-full file:border file:border-[var(--ds-border)] file:bg-transparent file:px-4 file:font-semibold file:text-[var(--ds-text)]" />
      </Field>
      {sound.coverUrl && !cover ? (
        <label className="flex min-h-11 items-center gap-2.5 text-sm">
          <input className="h-5 w-5 shrink-0" type="checkbox" checked={removeCover} onChange={(event) => setRemoveCover(event.target.checked)} />
          Remove the current cover
        </label>
      ) : null}
      <button type="button" disabled={busy || !name.trim()} onClick={() => void save()} className="ds-filled ds-tap disabled:opacity-60">
        {busy ? "Saving…" : "Save changes"}
      </button>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}

function SoundThumb({ coverUrl }: { coverUrl: string | null }) {
  return (
    <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-[var(--ds-radius-sm)]" style={{ background: "var(--ds-accent-soft)" }}>
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image served by the backend
        <img src={apiUrl(coverUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
    </span>
  );
}

// ---------- Cards ----------

const NEW_CARD: CardInput = {
  label: "",
  subtitle: "",
  tagline: "",
  chakraId: "heart",
  frequencyHz: null,
  icon: "sun",
  tone: "calm",
  hidden: false,
  guidanceLines: [],
  sounds: [],
};

const toInput = (card: PublicCard): CardInput => ({
  label: card.label,
  subtitle: card.subtitle,
  tagline: card.tagline,
  chakraId: card.chakraId,
  frequencyHz: card.frequencyHz ?? null,
  icon: card.icon,
  tone: card.tone,
  hidden: card.hidden,
  guidanceLines: card.guidanceLines,
  sounds: card.sounds.map((item) => ({ soundId: item.soundId, volume: item.volume })),
});

function CardsPanel({ sounds, content, onSaved }: { sounds: SoundAsset[]; content: PublicAppContent; onSaved: () => Promise<void> }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const cards = content.cards;

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= cards.length) return;
    const ids = cards.map((card) => card.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await saveCardOrder(ids);
      await onSaved();
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Could not reorder." });
    }
  };

  const done = async (text: string) => {
    setOpenId(null);
    setCreating(false);
    setMessage({ tone: "success", text });
    await onSaved();
  };

  return (
    <div className="space-y-5">
      <Section
        title={`Home cards (${cards.length})`}
        hint="These are the cards on Home under What do you need right now?, in this order. A Pause plays the sound people choose on the card, tuned to the card's frequency. Cards with sounds open their own screen to choose one; cards without play a soft tone at the frequency, right away. The original six can be hidden but not deleted, because Tell, Moments and Practice use them."
      >
        <ul className="space-y-2.5">
          {cards.map((card, index) => (
            <li key={card.id} className="rounded-[var(--ds-radius-md)] border" style={{ borderColor: "var(--ds-border)" }}>
              {/* Wraps on phones: details take the width, the controls drop below. */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-3">
                <span
                  className="ds-outcome-icon grid h-10 w-10 shrink-0 place-items-center rounded-full"
                  style={{ ["--ds-outcome-color" as string]: `var(--ds-outcome-${card.tone})` }}
                >
                  <CardIcon icon={card.icon} className="h-[1.1rem] w-[1.1rem]" />
                </span>
                <span className="min-w-0 flex-1 basis-48">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">{card.label}</span>
                    {card.builtIn ? <Badge>Original</Badge> : <Badge>Custom</Badge>}
                    {card.hidden ? <Badge tone="muted">Hidden</Badge> : null}
                    <RenderBadge card={card} library={sounds} />
                  </span>
                  <span className="block text-xs" style={{ color: "var(--ds-text-secondary)" }}>
                    {card.subtitle || card.tagline} · {chakraMap[card.chakraId].name.replace(" Chakra", "")} {card.frequencyHz ? `${formatFrequencyLabel(card.frequencyHz)} (custom)` : chakraMap[card.chakraId].frequencyLabel} · {card.sounds.length} sound{card.sounds.length === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-1">
                <SmallButton label={`Move ${card.label} up`} disabled={index === 0} onClick={() => void move(index, -1)}>↑</SmallButton>
                <SmallButton label={`Move ${card.label} down`} disabled={index === cards.length - 1} onClick={() => void move(index, 1)}>↓</SmallButton>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setOpenId(openId === card.id ? null : card.id);
                  }}
                  className="ds-tap inline-flex min-h-11 items-center px-2.5 text-sm font-medium"
                  style={{ color: "var(--ds-accent)" }}
                  aria-label={`${openId === card.id ? "Close" : "Edit"} ${card.label}`}
                >
                  {openId === card.id ? "Close" : "Edit"}
                </button>
                </span>
              </div>
              {openId === card.id ? (
                <div className="border-t px-3.5 py-3.5" style={{ borderColor: "var(--ds-border)" }}>
                  <CardEditor
                    key={`${card.id}:${content.updatedAt ?? "none"}`}
                    card={card}
                    initial={toInput(card)}
                    sounds={sounds}
                    onDone={done}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        {creating ? (
          <div className="rounded-[var(--ds-radius-md)] border px-3.5 py-3.5" style={{ borderColor: "var(--ds-accent)" }}>
            <p className="mb-3 font-semibold">New card</p>
            <CardEditor initial={NEW_CARD} sounds={sounds} onDone={done} onCancel={() => setCreating(false)} />
          </div>
        ) : cards.length < MAX_CARDS ? (
          <button
            type="button"
            onClick={() => {
              setOpenId(null);
              setCreating(true);
            }}
            className="ds-outlined ds-tap w-full"
          >
            + New card
          </button>
        ) : null}
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      </Section>
    </div>
  );
}

function CardEditor({
  card,
  initial,
  sounds,
  onDone,
  onCancel,
}: {
  /** The card being edited; absent when creating a new one. */
  card?: PublicCard;
  initial: CardInput;
  sounds: SoundAsset[];
  onDone: (message: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<CardInput>(initial);
  const [frequencyValid, setFrequencyValid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const soundById = new Map(sounds.map((sound) => [sound.id, sound]));
  const set = (patch: Partial<CardInput>) => setDraft((current) => ({ ...current, ...patch }));
  const setSounds = (change: (list: CardInput["sounds"]) => CardInput["sounds"]) => setDraft((current) => ({ ...current, sounds: change(current.sounds) }));
  const available = sounds.filter((sound) => !draft.sounds.some((item) => item.soundId === sound.id));

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const input: CardInput = { ...draft, guidanceLines: draft.guidanceLines.map((line) => line.trim()).filter(Boolean) };
      if (card) {
        await updateCard(card.id, input);
        await onDone(`Saved "${input.label}".`);
      } else {
        const created = await createCard(input);
        await onDone(`Created "${created.label}". It's now on Home.`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed.");
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!card || !window.confirm(`Delete the "${card.label}" card? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteCard(card.id);
      await onDone(`Deleted "${card.label}".`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Delete failed.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input value={draft.label} maxLength={30} onChange={(event) => set({ label: event.target.value })} placeholder="e.g. Unwind" className="ds-field" />
        </Field>
        <Field label="Small line on the Home tile">
          <input value={draft.subtitle} maxLength={40} onChange={(event) => set({ subtitle: event.target.value })} placeholder="e.g. Ease the day" className="ds-field" />
        </Field>
      </div>
      <Field label="Intent (shown on the card's screen and in Why this Pause?)">
        <input value={draft.tagline} maxLength={80} onChange={(event) => set({ tagline: event.target.value })} placeholder="e.g. Let the day loosen its grip" className="ds-field" />
      </Field>
      <Field label="Chakra (sets the default frequency and the Why this Pause? text)">
        <select value={draft.chakraId} onChange={(event) => set({ chakraId: event.target.value as CardInput["chakraId"] })} className="ds-field">
          {CHAKRA_IDS.map((id) => (
            <option key={id} value={id}>
              {chakraMap[id].name} · {chakraMap[id].frequencyLabel} · {chakraMap[id].meaning}
            </option>
          ))}
        </select>
      </Field>
      <FrequencyField
        value={draft.frequencyHz}
        defaultLabel={chakraMap[draft.chakraId].frequencyLabel}
        onChange={(frequencyHz, valid) => {
          set({ frequencyHz });
          setFrequencyValid(valid);
        }}
      />

      <div>
        <span className="text-xs font-medium" style={{ color: "var(--ds-text-secondary)" }}>Icon</span>
        <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="Icon">
          {CARD_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              role="radio"
              aria-checked={draft.icon === icon}
              aria-label={`Icon ${icon}`}
              onClick={() => set({ icon })}
              className="ds-tap grid h-10 w-10 place-items-center rounded-full border"
              style={{
                borderColor: draft.icon === icon ? "var(--ds-accent)" : "var(--ds-border)",
                background: draft.icon === icon ? "var(--ds-accent-soft)" : "transparent",
              }}
            >
              <CardIcon icon={icon} className="h-[1.05rem] w-[1.05rem]" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs font-medium" style={{ color: "var(--ds-text-secondary)" }}>Colour</span>
        <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
          {CARD_TONES.map((tone) => (
            <button
              key={tone}
              type="button"
              role="radio"
              aria-checked={draft.tone === tone}
              aria-label={`Colour ${tone}`}
              onClick={() => set({ tone })}
              className="ds-tap ds-outcome-icon grid h-10 w-10 place-items-center rounded-full border-2"
              style={{
                ["--ds-outcome-color" as string]: `var(--ds-outcome-${tone})`,
                borderColor: draft.tone === tone ? "var(--ds-accent)" : "transparent",
              }}
            >
              <CardIcon icon={draft.icon} className="h-[1rem] w-[1rem]" />
            </button>
          ))}
        </div>
      </div>

      <Field label="Playback lines (optional, one per line, up to 4). Shown one at a time during the Pause.">
        <textarea
          rows={3}
          value={draft.guidanceLines.join("\n")}
          onChange={(event) => set({ guidanceLines: event.target.value.split("\n").slice(0, 4) })}
          placeholder={card?.builtIn ? "Leave empty to keep this card's built-in lines" : "Leave empty for gentle default lines"}
          className="ds-field resize-y"
        />
      </Field>

      <div className="space-y-2">
        <span className="text-xs font-medium" style={{ color: "var(--ds-text-secondary)" }}>
          Sounds ({draft.sounds.length}). The first is the default.
        </span>
        {draft.sounds.map((item, index) => {
          const sound = soundById.get(item.soundId);
          return (
            <div key={item.soundId} className="space-y-2 rounded-[var(--ds-radius-sm)] px-3 py-2.5" style={{ background: "var(--ds-bg)" }}>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <SoundThumb coverUrl={sound?.coverUrl ?? null} />
                <span className="min-w-0 flex-1 basis-32">
                  <span className="block truncate text-sm font-semibold">{sound?.name ?? "Missing sound"}</span>
                  {index === 0 ? (
                    <span className="text-[0.75rem] font-semibold uppercase tracking-wide" style={{ color: "var(--ds-accent)" }}>Default</span>
                  ) : null}
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-1">
                <SmallButton label={`Move ${sound?.name ?? "sound"} up`} disabled={index === 0} onClick={() => setSounds((l) => swap(l, index, index - 1))}>↑</SmallButton>
                <SmallButton label={`Move ${sound?.name ?? "sound"} down`} disabled={index === draft.sounds.length - 1} onClick={() => setSounds((l) => swap(l, index, index + 1))}>↓</SmallButton>
                <SmallButton label={`Remove ${sound?.name ?? "sound"}`} onClick={() => setSounds((l) => l.filter((_, i) => i !== index))}>✕</SmallButton>
                </span>
              </div>
              <label className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 text-xs">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={item.volume}
                  onChange={(event) => setSounds((l) => l.map((entry, i) => (i === index ? { ...entry, volume: Number(event.target.value) } : entry)))}
                  aria-label={`${sound?.name ?? "sound"} volume`}
                  className="h-11 flex-1"
                />
                <span className="w-10 text-right text-xs tabular-nums">{Math.round(item.volume * 100)}%</span>
              </label>
            </div>
          );
        })}
        {available.length > 0 && draft.sounds.length < MAX_SOUNDS_PER_CARD ? (
          <select
            value=""
            onChange={(event) => {
              const soundId = event.target.value;
              if (soundId) setSounds((l) => [...l, { soundId, volume: 0.6 }]);
            }}
            aria-label={`Add a sound to ${draft.label || "this card"}`}
            className="ds-field"
          >
            <option value="">+ Add a sound</option>
            {available.map((sound) => (
              <option key={sound.id} value={sound.id}>{sound.name}</option>
            ))}
          </select>
        ) : sounds.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--ds-text-muted)" }}>Upload sounds on the Sounds tab to add them here.</p>
        ) : null}
      </div>

      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <input className="h-5 w-5 shrink-0" type="checkbox" checked={draft.hidden} onChange={(event) => set({ hidden: event.target.checked })} />
        Hide from Home
      </label>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button type="button" disabled={busy || !draft.label.trim() || !draft.tagline.trim() || !frequencyValid} onClick={() => void save()} className="ds-filled ds-tap disabled:opacity-60">
          {busy ? "Saving…" : card ? "Save card" : "Create card"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="ds-outlined ds-tap">Cancel</button>
        ) : null}
        {card && !card.builtIn ? (
          <button type="button" disabled={busy} onClick={() => void remove()} className="ds-tap inline-flex min-h-11 items-center px-2.5 text-sm font-medium" style={{ color: "var(--ds-error)" }}>
            Delete card
          </button>
        ) : null}
        {card?.builtIn ? (
          <span className="text-xs" style={{ color: "var(--ds-text-muted)" }}>Original cards can be hidden, not deleted.</span>
        ) : null}
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}

// Custom frequency a card's sounds are tuned to (empty = the chakra's own).
// Kept as text while typing so "7." or "43" mid-edit isn't rejected; only
// a complete, in-range number is passed up.
function FrequencyField({
  value,
  defaultLabel,
  onChange,
}: {
  value: number | null;
  defaultLabel: string;
  onChange: (frequencyHz: number | null, valid: boolean) => void;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const parsed = text.trim() === "" ? null : Number(text);
  const valid = parsed === null || (Number.isFinite(parsed) && parsed >= MIN_FREQUENCY_HZ && parsed <= MAX_FREQUENCY_HZ);
  const previewHz = valid && parsed !== null ? parsed : Number.parseFloat(defaultLabel);

  const update = (next: string) => {
    setText(next);
    const n = next.trim() === "" ? null : Number(next);
    const ok = n === null || (Number.isFinite(n) && n >= MIN_FREQUENCY_HZ && n <= MAX_FREQUENCY_HZ);
    onChange(ok && n !== null ? Math.round(n * 100) / 100 : null, ok);
  };

  return (
    <div>
      <Field label={`Frequency in Hz (leave empty to use the chakra's ${defaultLabel})`}>
        <span className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={MIN_FREQUENCY_HZ}
            max={MAX_FREQUENCY_HZ}
            step="any"
            value={text}
            onChange={(event) => update(event.target.value)}
            placeholder={defaultLabel.replace(" Hz", "")}
            aria-label="Frequency in hertz"
            aria-invalid={!valid}
            className="ds-field flex-1"
          />
          <button type="button" onClick={() => previewFrequency(previewHz)} disabled={!valid} className="ds-outlined ds-tap shrink-0 disabled:opacity-50">
            Preview
          </button>
          {text.trim() !== "" ? (
            <button type="button" onClick={() => update("")} className="ds-tap shrink-0 text-sm font-medium" style={{ color: "var(--ds-accent)" }}>
              Use default
            </button>
          ) : null}
        </span>
      </Field>
      <p className="mt-1 text-xs" style={{ color: valid ? "var(--ds-text-muted)" : "var(--ds-error)" }}>
        {valid
          ? `This card's sounds are tuned to ${parsed !== null ? formatFrequencyLabel(parsed) : defaultLabel}. With no sound, a soft tone plays at it.`
          : `Enter a number from ${MIN_FREQUENCY_HZ} to ${MAX_FREQUENCY_HZ}.`}
      </p>
    </div>
  );
}

// A 3-second soft sine at the given frequency, so an admin can hear a
// value before saving. Fades in and out to avoid clicks.
let previewContext: AudioContext | null = null;
function previewFrequency(hz: number) {
  if (!Number.isFinite(hz)) return;
  previewContext ??= new AudioContext();
  const ctx = previewContext;
  void ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = hz;
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.4);
  gain.gain.setValueAtTime(0.15, now + 2.4);
  gain.gain.linearRampToValueAtTime(0, now + 3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 3.05);
}

const RENDER_POLL_MS = 1500;

// How far the server is with this card's tuned sounds, with progress from
// the library's render list.
function RenderBadge({ card, library }: { card: PublicCard; library: SoundAsset[] }) {
  const { sounds } = card;
  if (sounds.length === 0) return null;
  const failed = sounds.filter((sound) => sound.renderStatus === "failed").length;
  const pending = sounds.filter((sound) => sound.renderStatus === "pending");
  if (failed) return <Badge tone="muted">{failed === 1 ? "1 sound failed to render" : `${failed} sounds failed to render`}</Badge>;
  if (pending.length) {
    const hz = cardFrequencyHz(card);
    const progress = pending.map((sound) => {
      const render = library
        .find((item) => item.id === sound.soundId)
        ?.renders?.find((item) => item.frequencyHz === hz && Math.abs(item.volume - sound.volume) < 0.005);
      return render?.progress ?? 0;
    });
    const percent = Math.round((100 * progress.reduce((sum, value) => sum + value, 0)) / progress.length);
    return (
      <Badge tone="muted">
        Rendering {pending.length === 1 ? "1 sound" : `${pending.length} sounds`}… {percent}%
      </Badge>
    );
  }
  return <Badge>Tuned files ready</Badge>;
}

// A library sound's tuned files: one tuned to each card frequency it's used
// at, plus an untuned one (Frequency off). Ready files can be previewed and
// downloaded; the rest show live progress.
function SoundRenders({ soundName, renders }: { soundName: string; renders: SoundRenderInfo[] | undefined }) {
  if (!renders?.length) {
    return (
      <p className="text-xs" style={{ color: "var(--ds-text-muted)" }}>
        Not on a card yet. Once you add it to a card, it&rsquo;s tuned to the card&rsquo;s frequency, levelled and looped here.
      </p>
    );
  }
  const volumes = new Set(renders.map((render) => render.volume));
  const sorted = [...renders].sort((a, b) => (a.frequencyHz ?? Infinity) - (b.frequencyHz ?? Infinity) || a.volume - b.volume);
  const ready = renders.filter((render) => render.status === "ready").length;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold" style={{ color: "var(--ds-text-secondary)" }}>
        Tuned files ({ready} of {renders.length} ready)
      </p>
      <ul className="space-y-2" aria-label={`Tuned files for ${soundName}`}>
        {sorted.map((render) => {
          const percent = Math.round(render.progress * 100);
          const tuning = render.frequencyHz ? `Tuned to ${formatFrequencyLabel(render.frequencyHz)}` : "Untuned (Frequency off)";
          const label = tuning + (volumes.size > 1 ? ` · volume ${Math.round(render.volume * 100)}%` : "");
          const state =
            render.status === "ready" ? "Ready" : render.status === "failed" ? "Failed" : render.status === "rendering" ? `Rendering ${percent}%` : "Queued";
          const color = render.status === "ready" ? "var(--ds-success)" : render.status === "failed" ? "var(--ds-error)" : "var(--ds-accent)";
          const details = [
            render.cards.length ? render.cards.join(", ") : null,
            render.durationSeconds ? formatDuration(render.durationSeconds) : null,
            render.size ? `${(render.size / 1024 / 1024).toFixed(1)} MB` : null,
            render.format,
            render.loudnessLufs !== null ? `${render.loudnessLufs} LUFS` : null,
          ].filter(Boolean);
          return (
            <li
              key={`${render.frequencyHz}-${render.volume}`}
              className="space-y-1.5 rounded-[var(--ds-radius-sm)] border px-3 py-2.5 text-xs"
              style={{ borderColor: "var(--ds-border)" }}
            >
              <span className="flex justify-between gap-2">
                <span className="font-medium">{label}</span>
                <span className="font-medium tabular-nums" style={{ color }}>
                  {state}
                </span>
              </span>
              {render.status === "ready" ? <span className="block" style={{ color: "var(--ds-text-muted)" }}>{details.join(" · ")}</span> : null}
              {render.status === "rendering" || render.status === "pending" ? (
                <span
                  role="progressbar"
                  aria-label={label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  className="block h-1 overflow-hidden rounded-full"
                  style={{ background: "var(--ds-border)" }}
                >
                  <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${percent}%`, background: "var(--ds-accent)" }} />
                </span>
              ) : null}
              {render.error ? <span className="block" style={{ color: "var(--ds-error)" }}>{render.error}</span> : null}
              {render.url ? (
                <span className="flex flex-wrap items-center justify-end gap-x-1">
                  {/* The browser plays the first file it can: AAC, else Opus.
                      Full width on phones, with the download links below. */}
                  <audio controls preload="none" className="h-9 w-full sm:w-auto sm:min-w-0 sm:flex-1" aria-label={`Preview ${soundName}, ${tuning}`}>
                    <source src={apiUrl(render.url)} type={AAC_TYPE} />
                    <source src={apiUrl(webmUrl(render.url))} type={OPUS_TYPE} />
                  </audio>
                  <a
                    href={apiUrl(render.url)}
                    download={`${soundName} - ${render.frequencyHz ? formatFrequencyLabel(render.frequencyHz) : "untuned"}.m4a`}
                    className="ds-tap inline-flex min-h-11 shrink-0 items-center px-2 font-medium"
                    style={{ color: "var(--ds-accent)" }}
                  >
                    M4A
                  </a>
                  <a
                    href={apiUrl(webmUrl(render.url))}
                    download={`${soundName} - ${render.frequencyHz ? formatFrequencyLabel(render.frequencyHz) : "untuned"}.webm`}
                    className="ds-tap inline-flex min-h-11 shrink-0 items-center px-2 font-medium"
                    style={{ color: "var(--ds-accent)" }}
                  >
                    WebM
                  </a>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function Badge({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "muted" }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wide"
      style={{
        background: tone === "accent" ? "var(--ds-accent-soft)" : "var(--ds-border)",
        color: tone === "accent" ? "var(--ds-accent)" : "var(--ds-text-secondary)",
      }}
    >
      {children}
    </span>
  );
}

function swap<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = list.slice();
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

// ---------- Courses ----------

function builtInCourse(skillId: PracticeSkillId): CourseContent {
  return {
    sessions: getDefaultCoreArc(skillId).map((session) => ({
      title: session.title,
      arrivalGuidance: session.arrivalGuidance,
      categoryId: session.categoryId,
      durationSeconds: session.durationSeconds,
      activity: session.activity,
    })),
    milestones: isBuiltInSkillId(skillId) ? MILESTONE_PATHS[skillId] : [],
  };
}

const emptySession = (): CourseSession => ({
  title: "",
  arrivalGuidance: ["Get comfortable."],
  categoryId: "calm",
  durationSeconds: 5 * 60,
  activity: { type: "reflection", prompt: "" },
});

const NEW_SKILL: SkillInput = {
  label: "",
  tagline: "",
  why: "",
  hidden: false,
  course: { sessions: [emptySession()], milestones: [] },
};

function CoursesPanel({ content, onSaved }: { content: PublicAppContent; onSaved: () => Promise<void> }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const skills = content.skills;

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= skills.length) return;
    const ids = skills.map((skill) => skill.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await saveSkillOrder(ids);
      await onSaved();
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Could not reorder." });
    }
  };

  const done = async (text: string) => {
    setOpenId(null);
    setCreating(false);
    setMessage({ tone: "success", text });
    await onSaved();
  };

  return (
    <div className="space-y-5">
      <Section
        title={`Practice courses (${skills.length})`}
        hint="The courses on Practice → Explore, in this order. Each course is a series of sessions (Arrive, Tell, Pause, an activity, Return) plus a milestone path. The original seven can be hidden but not deleted; their built-in sessions are used until you save your own."
      >
        <ul className="space-y-2.5">
          {skills.map((skill, index) => {
            const sessionCount = skill.course ? skill.course.sessions.length : getDefaultCoreArc(skill.id).length;
            return (
              <li key={skill.id} className="rounded-[var(--ds-radius-md)] border" style={{ borderColor: "var(--ds-border)" }}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-3">
                  <span className="min-w-0 flex-1 basis-48">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{skill.label}</span>
                      {skill.builtIn ? <Badge>Original</Badge> : <Badge>Custom</Badge>}
                      {skill.builtIn && skill.course ? <Badge tone="muted">Edited sessions</Badge> : null}
                      {skill.hidden ? <Badge tone="muted">Hidden</Badge> : null}
                    </span>
                    <span className="block text-xs" style={{ color: "var(--ds-text-secondary)" }}>
                      {skill.tagline} · {sessionCount} session{sessionCount === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                  <SmallButton label={`Move ${skill.label} up`} disabled={index === 0} onClick={() => void move(index, -1)}>↑</SmallButton>
                  <SmallButton label={`Move ${skill.label} down`} disabled={index === skills.length - 1} onClick={() => void move(index, 1)}>↓</SmallButton>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setOpenId(openId === skill.id ? null : skill.id);
                    }}
                    className="ds-tap inline-flex min-h-11 items-center px-2.5 text-sm font-medium"
                    style={{ color: "var(--ds-accent)" }}
                    aria-label={`${openId === skill.id ? "Close" : "Edit"} ${skill.label}`}
                  >
                    {openId === skill.id ? "Close" : "Edit"}
                  </button>
                  </span>
                </div>
                {openId === skill.id ? (
                  <div className="border-t px-3.5 py-3.5" style={{ borderColor: "var(--ds-border)" }}>
                    <SkillEditor key={`${skill.id}:${content.updatedAt ?? "none"}`} skill={skill} onDone={done} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {creating ? (
          <div className="rounded-[var(--ds-radius-md)] border px-3.5 py-3.5" style={{ borderColor: "var(--ds-accent)" }}>
            <p className="mb-3 font-semibold">New course</p>
            <SkillEditor onDone={done} onCancel={() => setCreating(false)} />
          </div>
        ) : skills.length < MAX_SKILLS ? (
          <button
            type="button"
            onClick={() => {
              setOpenId(null);
              setCreating(true);
            }}
            className="ds-outlined ds-tap w-full"
          >
            + New course
          </button>
        ) : null}
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      </Section>
    </div>
  );
}

function slugify(title: string, taken: Set<string>) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "milestone";
  let candidate = base;
  for (let n = 2; taken.has(candidate); n += 1) candidate = `${base}-${n}`;
  taken.add(candidate);
  return candidate;
}

function normalizeCourse(sessions: CourseSession[], milestones: CourseMilestone[]): CourseContent {
  const taken = new Set<string>();
  return {
    sessions: sessions.map((session) => ({
      ...session,
      arrivalGuidance: session.arrivalGuidance.map((line) => line.trim()).filter(Boolean),
      activity: { ...session.activity, realWorldRep: session.activity.realWorldRep?.trim() || undefined },
    })),
    milestones: milestones
      .slice()
      .sort((a, b) => a.atEngagedSessions - b.atEngagedSessions)
      .map((milestone) => ({ ...milestone, id: slugify(milestone.title, taken) })),
  };
}

function SkillEditor({
  skill,
  onDone,
  onCancel,
}: {
  /** The course being edited; absent when creating a new one. */
  skill?: SkillDefinition;
  onDone: (message: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const initial = skill ?? NEW_SKILL;
  const initialCourse = initial.course ?? builtInCourse(skill?.id ?? "");
  const [label, setLabel] = useState(initial.label);
  const [tagline, setTagline] = useState(initial.tagline);
  const [why, setWhy] = useState(initial.why);
  const [hidden, setHidden] = useState(initial.hidden);
  const [sessions, setSessions] = useState<CourseSession[]>(initialCourse.sessions);
  const [milestones, setMilestones] = useState<CourseMilestone[]>(initialCourse.milestones);
  // An original with no saved sessions is still on its built-in content;
  // the editor shows it, and saving turns it into the course's own copy.
  const usingBuiltIn = Boolean(skill?.builtIn && !skill.course);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const updateSession = (index: number, patch: Partial<CourseSession>) =>
    setSessions((current) => current.map((session, i) => (i === index ? { ...session, ...patch } : session)));
  const updateActivity = (index: number, patch: Partial<CourseSession["activity"]>) =>
    setSessions((current) => current.map((session, i) => (i === index ? { ...session, activity: { ...session.activity, ...patch } } : session)));

  const buildInput = (course: CourseContent | null): SkillInput => ({
    label: label.trim(),
    tagline: tagline.trim(),
    why: why.trim(),
    hidden,
    course,
  });

  const currentCourse = (): CourseContent => normalizeCourse(sessions, milestones);

  // An original still on its built-in content stays on it unless its
  // sessions or milestones were actually changed: renaming or hiding it
  // must not quietly freeze a copy of the built-in course.
  const courseToSave = (): CourseContent | null => {
    const course = currentCourse();
    if (usingBuiltIn && JSON.stringify(course) === JSON.stringify(normalizeCourse(initialCourse.sessions, initialCourse.milestones))) return null;
    return course;
  };

  const run = async (action: () => Promise<string>) => {
    setBusy(true);
    setError("");
    try {
      await onDone(await action());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      if (!skill) {
        const created = await createSkill(buildInput(currentCourse()));
        return `Created "${created.label}". It's now on Practice.`;
      }
      await updateSkill(skill.id, buildInput(courseToSave()));
      return `Saved "${label.trim()}".`;
    });

  // Originals only: keep the name/tagline edits but drop custom sessions.
  const restoreBuiltIn = () => {
    if (!skill || !window.confirm(`Restore the built-in sessions and milestones for ${skill.label}? Your custom ones will be removed.`)) return;
    void run(async () => {
      await updateSkill(skill.id, buildInput(null));
      return `${label.trim()} is back on its built-in sessions.`;
    });
  };

  const remove = () => {
    if (!skill || !window.confirm(`Delete the "${skill.label}" course? People's past sessions stay in their history.`)) return;
    void run(async () => {
      await deleteSkill(skill.id);
      return `Deleted "${skill.label}".`;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input value={label} maxLength={40} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Patience" className="ds-field" />
        </Field>
        <Field label="Tagline">
          <input value={tagline} maxLength={100} onChange={(event) => setTagline(event.target.value)} placeholder="e.g. Let things take the time they take" className="ds-field" />
        </Field>
      </div>
      <Field label="Why it matters (one sentence, shown on the course page)">
        <input value={why} maxLength={240} onChange={(event) => setWhy(event.target.value)} className="ds-field" />
      </Field>
      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <input className="h-5 w-5 shrink-0" type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} />
        Hide from Practice
      </label>

      {usingBuiltIn ? (
        <Notice tone="success">These are the built-in sessions. Edit anything below and save to make them this course&rsquo;s own.</Notice>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-semibold">Sessions ({sessions.length})</p>
        {sessions.map((session, index) => (
          <div key={index} className="space-y-3 rounded-[var(--ds-radius-md)] border px-3.5 py-3.5" style={{ borderColor: "var(--ds-border)" }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Session {index + 1}</p>
              <div className="flex gap-1.5">
                <SmallButton label={`Move session ${index + 1} up`} disabled={index === 0} onClick={() => setSessions((l) => swap(l, index, index - 1))}>↑</SmallButton>
                <SmallButton label={`Move session ${index + 1} down`} disabled={index === sessions.length - 1} onClick={() => setSessions((l) => swap(l, index, index + 1))}>↓</SmallButton>
                <SmallButton label={`Remove session ${index + 1}`} disabled={sessions.length === 1} onClick={() => setSessions((l) => l.filter((_, i) => i !== index))}>Remove</SmallButton>
              </div>
            </div>
            <Field label="Session title">
              <input value={session.title} onChange={(event) => updateSession(index, { title: event.target.value })} className="ds-field" />
            </Field>
            <Field label="Arrival lines (one per line, shown before the Pause)">
              <textarea
                rows={2}
                value={session.arrivalGuidance.join("\n")}
                onChange={(event) => updateSession(index, { arrivalGuidance: event.target.value.split("\n").slice(0, 4) })}
                className="ds-field resize-y"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Pause sound">
                <select value={session.categoryId} onChange={(event) => updateSession(index, { categoryId: event.target.value as PauseCategoryId })} className="ds-field">
                  {pauseCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Minutes">
                <input
                  type="number"
                  min={1}
                  max={60}
                  step={0.5}
                  value={session.durationSeconds / 60}
                  onChange={(event) => updateSession(index, { durationSeconds: Math.round(Number(event.target.value) * 60) })}
                  className="ds-field"
                />
              </Field>
            </div>
            <Field label="Activity type">
              <select value={session.activity.type} onChange={(event) => updateActivity(index, { type: event.target.value as PracticeActivityTypeId })} className="ds-field">
                {PRACTICE_ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>{ACTIVITY_LABELS[type]}</option>
                ))}
              </select>
            </Field>
            <Field label="Activity prompt">
              <textarea rows={3} value={session.activity.prompt} onChange={(event) => updateActivity(index, { prompt: event.target.value })} className="ds-field resize-y" />
            </Field>
            <Field label="Real-world rep (optional)">
              <input value={session.activity.realWorldRep ?? ""} onChange={(event) => updateActivity(index, { realWorldRep: event.target.value })} className="ds-field" />
            </Field>
          </div>
        ))}
        <button type="button" onClick={() => setSessions((current) => [...current, emptySession()])} className="ds-outlined ds-tap w-full">
          Add session
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Milestone path</p>
        <p className="text-xs" style={{ color: "var(--ds-text-secondary)" }}>
          What people see under &ldquo;Your progress&rdquo;. Each stage is reached after that many sessions with a real response. The last stage is earned when the whole course is done.
        </p>
        {milestones.map((milestone, index) => (
          <div key={index} className="flex items-end gap-2">
            <Field label={`Stage ${index + 1}`} grow>
              <input
                value={milestone.title}
                onChange={(event) => setMilestones((current) => current.map((m, i) => (i === index ? { ...m, title: event.target.value } : m)))}
                className="ds-field"
              />
            </Field>
            <Field label="Sessions">
              <input
                type="number"
                min={1}
                max={100}
                value={milestone.atEngagedSessions}
                onChange={(event) => setMilestones((current) => current.map((m, i) => (i === index ? { ...m, atEngagedSessions: Number(event.target.value) } : m)))}
                className="ds-field w-20"
              />
            </Field>
            <SmallButton label={`Remove stage ${index + 1}`} onClick={() => setMilestones((current) => current.filter((_, i) => i !== index))}>✕</SmallButton>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setMilestones((current) => [...current, { id: "", title: "", atEngagedSessions: (current.at(-1)?.atEngagedSessions ?? 0) + 1 }])}
          className="ds-outlined ds-tap w-full"
        >
          Add stage
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button type="button" disabled={busy || !label.trim() || !tagline.trim()} onClick={() => void save()} className="ds-filled ds-tap disabled:opacity-60">
          {busy ? "Saving…" : skill ? "Save course" : "Create course"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="ds-outlined ds-tap">Cancel</button>
        ) : null}
        {skill?.builtIn && skill.course ? (
          <button type="button" disabled={busy} onClick={restoreBuiltIn} className="ds-outlined ds-tap disabled:opacity-60">
            Restore built-in sessions
          </button>
        ) : null}
        {skill && !skill.builtIn ? (
          <button type="button" disabled={busy} onClick={remove} className="ds-tap inline-flex min-h-11 items-center px-2.5 text-sm font-medium" style={{ color: "var(--ds-error)" }}>
            Delete course
          </button>
        ) : null}
        {skill?.builtIn ? (
          <span className="text-xs" style={{ color: "var(--ds-text-muted)" }}>Original courses can be hidden, not deleted.</span>
        ) : null}
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}

// ---------- Shared bits ----------

function AdminFrame({ children, email }: { children: ReactNode; email?: string }) {
  return (
    <div className="min-h-dvh" style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}>
      <main className="mx-auto w-full max-w-[44rem] space-y-5 px-4 pb-16 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="ds-display text-[1.6rem]">Inner Pause admin</h1>
            {email ? <p className="text-xs" style={{ color: "var(--ds-text-muted)" }}>Signed in as {email}</p> : null}
          </div>
          <Link href="/" className="ds-tap inline-flex min-h-11 shrink-0 items-center whitespace-nowrap px-2.5 text-sm font-medium" style={{ color: "var(--ds-accent)" }}>Open app</Link>
        </header>
        {children}
      </main>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="ds-card space-y-3 px-4 py-4">
      <div>
        <h2 className="text-[1.02rem] font-semibold">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs leading-5" style={{ color: "var(--ds-text-secondary)" }}>{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, grow = false }: { label: string; children: ReactNode; grow?: boolean }) {
  return (
    <label className={`block ${grow ? "min-w-0 flex-1" : ""}`}>
      <span className="text-xs font-medium" style={{ color: "var(--ds-text-secondary)" }}>{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function SmallButton({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="ds-tap min-h-11 min-w-11 rounded-full border px-2.5 text-xs font-medium disabled:opacity-40"
      style={{ borderColor: "var(--ds-border)" }}
    >
      {children}
    </button>
  );
}

function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className="rounded-[var(--ds-radius-md)] px-3 py-2 text-sm"
      style={{
        background: tone === "error" ? "color-mix(in srgb, var(--ds-error) 12%, transparent)" : "var(--ds-accent-soft)",
        color: tone === "error" ? "var(--ds-error)" : "var(--ds-success)",
      }}
    >
      {children}
    </p>
  );
}

