"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { updatePlan } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${`${seconds % 60}`.padStart(2, "0")}`;
};

export function HealingAudioPlayerScreen() {
  const router = useRouter();
  const planId = useSearchParams().get("plan");
  const state = useMvpState();
  const entry = state.entries.find((item) => item.plan?.id === planId);
  const plan = entry?.plan;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [blockIndex, setBlockIndex] = useState(plan?.lastPlaybackPosition.blockIndex ?? 0);
  const [elapsedInBlock, setElapsedInBlock] = useState(plan?.lastPlaybackPosition.elapsedSeconds ?? 0);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [guidanceOn, setGuidanceOn] = useState(true);
  const [musicOnly, setMusicOnly] = useState(false);

  const block = plan?.blocks[blockIndex];
  const chakra = block ? chakraMap[block.chakraId] : null;
  const voiceGuidanceOff = plan?.customisation?.voiceGuidanceLevel === "none";
  const showGuidance = guidanceOn && !musicOnly && !voiceGuidanceOff;
  const totalElapsed = useMemo(() => {
    if (!plan) return 0;
    return plan.blocks.slice(0, blockIndex).reduce((sum, item) => sum + item.durationMinutes * 60, 0) + elapsedInBlock;
  }, [blockIndex, elapsedInBlock, plan]);
  const totalSeconds = plan?.totalDurationMinutes ? plan.totalDurationMinutes * 60 : 0;
  const remaining = Math.max(totalSeconds - totalElapsed, 0);

  useEffect(() => {
    if (!plan?.id) return;
    updatePlan(plan.id, { status: "started", lastPlaybackPosition: { blockIndex, elapsedSeconds: elapsedInBlock } });
  }, [blockIndex, elapsedInBlock, plan?.id]);

  useEffect(() => {
    if (!audioRef.current || !block) return;
    audioRef.current.src = block.audioPath;
    audioRef.current.loop = true;
    audioRef.current.currentTime = 0;
    setAudioError(false);
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {
      setAudioError(true);
      setPlaying(false);
    });
  }, [block]);

  useEffect(() => {
    if (!playing || !block || !plan) return;
    const timer = window.setInterval(() => {
      setElapsedInBlock((current) => {
        const next = current + 1;
        if (next >= block.durationMinutes * 60) {
          if (blockIndex < plan.blocks.length - 1) {
            setBlockIndex((index) => index + 1);
            return 0;
          }
          window.clearInterval(timer);
          router.push(`/feedback?plan=${plan.id}`);
          return next;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [block, blockIndex, plan, playing, router]);

  if (!plan || !block || !chakra) {
    return (
      <MvpShell hideNav>
        <GlassCard className="mx-auto max-w-xl p-6">
          <p className="text-[var(--ip-body)]">No active healing session found.</p>
          <GoldButton className="mt-5" onClick={() => router.replace("/healing")}>Open Healing</GoldButton>
        </GlassCard>
      </MvpShell>
    );
  }

  const toggle = () => {
    if (!audioRef.current || audioError) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setAudioError(true));
  };

  const goToBlock = (index: number) => {
    if (index < 0 || index >= plan.blocks.length) return;
    setBlockIndex(index);
    setElapsedInBlock(0);
  };

  return (
    <MvpShell hideNav>
      <div className="mvp-bg relative min-h-dvh overflow-x-hidden px-0 pb-[calc(1rem+env(safe-area-inset-bottom))] text-[var(--ip-ink)]">
        <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <header className="flex items-center justify-between">
            <button type="button" onClick={() => router.push(`/healing?entry=${entry?.id}`)} className="grid h-11 w-11 place-items-center rounded-full text-3xl text-[var(--ip-body)]" aria-label="Exit safely">‹</button>
            <div className="text-center">
              <p className="minimal-label text-xs">Healing</p>
              <h1 className="mt-2 text-3xl text-[var(--ip-ink)]">Ground</h1>
              <p className="text-sm text-[var(--ip-body)]">{block.frequencyLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => window.alert("Audio settings are using the current session defaults in this demo build.")}
              className="grid h-11 w-11 place-items-center rounded-full text-xl text-[var(--ip-body)]"
              aria-label="Audio settings"
            >
              •••
            </button>
          </header>

          <div className={`grid flex-1 place-items-center py-4 ${!playing ? "is-paused" : ""}`}>
            <div className="relative grid aspect-square w-[min(82vw,25rem)] place-items-center lg:w-[min(42vw,29rem)]">
              <div className="absolute inset-0 rounded-full border border-white/10" />
              <div className="absolute inset-[8%] rounded-full border border-[rgba(255,122,34,0.22)]" />
              <div className="absolute inset-[18%] rounded-full border border-white/10" />
              <span className="orbiting-point" style={{ "--orbit-radius": "42%", "--orbit-speed": "22s", "--orbit-angle": "0deg" } as CSSProperties} />
              <span className="orbiting-point" style={{ "--orbit-radius": "48%", "--orbit-speed": "31s", "--orbit-angle": "132deg" } as CSSProperties} />
              <span className="orbiting-point" style={{ "--orbit-radius": "35%", "--orbit-speed": "42s", "--orbit-angle": "248deg" } as CSSProperties} />
              <div className="healing-orbit-sphere w-[62%]" />
            </div>
          </div>

          <GlassCard className="p-4">
            <p className="minimal-label text-center text-xl tracking-[0.52em] text-[var(--ip-ink)]">{block.title.split(" ")[0] ?? "Ground"}</p>
            <p className="mt-3 line-clamp-1 text-center text-sm text-[var(--ip-body)]">{showGuidance ? block.guidanceText ?? block.intention : "Music only"}</p>
            {plan.customisation ? (
              <p className="mt-2 text-center text-xs text-[var(--ip-muted)]">
                {plan.customisation.musicStyle.replaceAll("-", " ")} • {voiceGuidanceOff ? "no voice guidance" : `${plan.customisation.voiceGuidanceLevel} guidance`}
              </p>
            ) : null}
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/12">
              <div className="h-full rounded-full bg-[var(--gold-primary)] shadow-[0_0_14px_rgba(255,122,34,0.8)]" style={{ width: `${totalSeconds ? (totalElapsed / totalSeconds) * 100 : 0}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-lg text-[var(--ip-body)]">
              <span>{formatTime(totalElapsed)}</span>
              <span>{formatTime(remaining)}</span>
            </div>

            {audioError ? (
              <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                Add the MP3 file to the public/audio folder or replace placeholder audio with licensed production audio.
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-5 items-center gap-2 text-[var(--ip-body)]">
              <button
                type="button"
                disabled={blockIndex === 0}
                onClick={() => goToBlock(blockIndex - 1)}
                className="min-h-11 rounded-full text-3xl disabled:opacity-35"
                aria-label="Previous block"
              >
                ‹
              </button>
              <button type="button" disabled={voiceGuidanceOff} onClick={() => setGuidanceOn((value) => !value)} className="min-h-11 rounded-full text-xs uppercase tracking-[0.16em] text-[var(--ip-body)] disabled:opacity-35">{voiceGuidanceOff ? "No" : guidanceOn ? "Guide" : "Silent"}</button>
              <button type="button" onClick={toggle} className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[rgba(255,138,50,0.5)] bg-[rgba(244,122,34,0.08)] text-3xl text-[var(--gold-light)] shadow-[0_0_36px_rgba(255,122,34,0.18)]">
                {playing ? "Ⅱ" : "▶"}
              </button>
              <button type="button" onClick={() => setMusicOnly((value) => !value)} className="min-h-11 rounded-full text-xs uppercase tracking-[0.16em] text-[var(--ip-body)]">{musicOnly ? "Music" : "Mix"}</button>
              <button
                type="button"
                disabled={blockIndex === plan.blocks.length - 1}
                onClick={() => goToBlock(blockIndex + 1)}
                className="min-h-11 rounded-full text-3xl disabled:opacity-35"
                aria-label="Next block"
              >
                ›
              </button>
            </div>
            <div className="obsidian-panel mt-6 grid grid-cols-[3rem_1fr_3rem] items-center rounded-full px-4 py-3">
              <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-2xl text-[var(--ip-body)]" aria-label="Favourite">♡</button>
              <div className={`mini-waveform ${!playing ? "is-paused" : ""}`} aria-hidden="true" />
              <button type="button" onClick={() => router.push(`/feedback?plan=${plan.id}`)} className="grid h-11 w-11 place-items-center rounded-full text-xl text-[var(--ip-body)]" aria-label="End session">
                ≡
              </button>
            </div>
            <button type="button" onClick={() => router.push(`/feedback?plan=${plan.id}`)} className="mt-3 min-h-11 w-full rounded-full border border-white/10 bg-white/[0.03] text-sm uppercase tracking-[0.22em] text-[var(--ip-body)]">
              End
            </button>
          </GlassCard>
        </div>
        <audio ref={audioRef} preload="auto" onError={() => setAudioError(true)} />
      </div>
    </MvpShell>
  );
}
