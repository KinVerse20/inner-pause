"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
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
          <p className="text-stone-300">No active healing session found.</p>
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
      <div
        className="fixed inset-0 overflow-y-auto px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))] text-stone-50"
        style={{ background: `radial-gradient(circle at 50% 40%, ${chakra.color}44, transparent 32%), linear-gradient(180deg,#030711,#050711 56%,#02040b)` }}
      >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col">
          <header className="flex items-center justify-between">
            <button type="button" onClick={() => router.push(`/healing?entry=${entry?.id}`)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.06]" aria-label="Exit safely">⌄</button>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: chakra.accent }}>{block.frequencyLabel}</p>
              <h1 className="font-serif text-3xl text-white">{chakra.name}</h1>
              <p className="text-sm text-stone-300">{block.title}</p>
            </div>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.06]" aria-label="Audio settings">≛</button>
          </header>

          <div className="grid flex-1 place-items-center py-8">
            <div className="relative grid aspect-square w-[min(82vw,27rem)] place-items-center">
              <div className="absolute inset-0 rounded-full border border-[var(--gold-border-soft)] mvp-orb" />
              <div className="absolute inset-8 rounded-full border border-white/10" />
              <ChakraGlyph chakraId={chakra.id} className="relative z-10 h-36 w-36" />
              <div className="absolute bottom-8 rounded-full border border-white/10 bg-black/28 px-4 py-2 text-sm backdrop-blur-xl">
                {guidanceOn && !musicOnly ? "Breathe slowly" : "Music only"}
              </div>
            </div>
          </div>

          <GlassCard className="p-5">
            <p className="text-sm text-stone-400">Emotional intention</p>
            <p className="mt-1 font-serif text-2xl text-stone-100">{block.intention}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[var(--gold-primary)]" style={{ width: `${totalSeconds ? (totalElapsed / totalSeconds) * 100 : 0}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-sm text-stone-400">
              <span>{formatTime(totalElapsed)}</span>
              <span>{formatTime(remaining)}</span>
            </div>

            {audioError ? (
              <p className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-200/10 p-3 text-sm text-amber-50">
                Add the MP3 file to the public/audio folder or replace placeholder audio with licensed production audio.
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-5 items-center gap-2">
              <button type="button" onClick={() => goToBlock(blockIndex - 1)} className="min-h-11 rounded-full border border-white/10 bg-white/[0.05]">‹</button>
              <button type="button" onClick={() => setGuidanceOn((value) => !value)} className="min-h-11 rounded-full border border-white/10 bg-white/[0.05] text-xs">{guidanceOn ? "Guide" : "Silent"}</button>
              <button type="button" onClick={toggle} className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[var(--gold-border)] bg-white/[0.08] text-sm font-semibold text-[var(--gold-light)]">
                {playing ? "Pause" : "Play"}
              </button>
              <button type="button" onClick={() => setMusicOnly((value) => !value)} className="min-h-11 rounded-full border border-white/10 bg-white/[0.05] text-xs">{musicOnly ? "Music" : "Mixed"}</button>
              <button type="button" onClick={() => goToBlock(blockIndex + 1)} className="min-h-11 rounded-full border border-white/10 bg-white/[0.05]">›</button>
            </div>
            <button type="button" onClick={() => router.push(`/feedback?plan=${plan.id}`)} className="mt-4 min-h-11 w-full rounded-full border border-white/10 text-sm text-stone-300">
              Exit safely
            </button>
          </GlassCard>
        </div>
        <audio ref={audioRef} preload="auto" onError={() => setAudioError(true)} />
      </div>
    </MvpShell>
  );
}
