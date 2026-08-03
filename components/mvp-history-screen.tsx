"use client";

import { useMemo, useState } from "react";

import { GlassCard, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { deleteJournalEntry } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

export function MvpHistoryScreen() {
  const state = useMvpState();
  const [query, setQuery] = useState("");
  const [chakraFilter, setChakraFilter] = useState("all");
  const entries = useMemo(
    () =>
      state.entries.filter((entry) => {
        const text = `${entry.title} ${entry.rawText} ${entry.analysis?.summary ?? ""}`.toLowerCase();
        const matchesQuery = !query || text.includes(query.toLowerCase());
        const matchesChakra =
          chakraFilter === "all" || entry.analysis?.chakraAssociations.some((item) => item.chakra === chakraFilter);
        return matchesQuery && matchesChakra;
      }),
    [chakraFilter, query, state.entries],
  );

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <SectionTitle title="My Journey" copy="Saved reflections and completed sessions stay private to your account." />
        <GlassCard className="sticky top-2 z-10 grid gap-2 p-3 sm:grid-cols-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved reflections" className="soft-input rounded-2xl p-3 outline-none" />
          <select value={chakraFilter} onChange={(event) => setChakraFilter(event.target.value)} className="soft-input rounded-2xl p-3">
            <option value="all">All chakras</option>
            {Object.values(chakraMap).map((chakra) => <option key={chakra.id} value={chakra.id}>{chakra.name}</option>)}
          </select>
        </GlassCard>

        {entries.length === 0 ? (
          <GlassCard className="p-4 text-sm text-[#4b3f86]">No saved reflections yet. Share what you feel and choose Save to My Journey when you want to remember it.</GlassCard>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <GlassCard key={entry.id} className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#7c3aed]">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    <h2 className="mt-1 line-clamp-1 font-serif text-xl text-[#130b4f]">{entry.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#4b3f86]">{entry.analysis?.understandingSummary ?? entry.analysis?.summary ?? entry.rawText}</p>
                  </div>
                  <button type="button" onClick={() => deleteJournalEntry(entry.id)} className="text-xs text-[#6d5ea8]">Delete</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entry.analysis?.emotions.slice(0, 2).map((emotion) => (
                    <span key={emotion.name} className="rounded-full border border-purple-100 bg-white/70 px-3 py-1 text-xs text-[#4b3f86]">{emotion.name} • {emotion.level}</span>
                  ))}
                  {entry.analysis?.chakraAssociations.slice(0, 1).map((item) => (
                    <span key={item.chakra} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: chakraMap[item.chakra].accent, color: chakraMap[item.chakra].accent }}>
                      {chakraMap[item.chakra].name}
                    </span>
                  ))}
                  <span className="rounded-full border border-purple-100 bg-white/70 px-3 py-1 text-xs text-[#6d5ea8]">{entry.isTemporary ? "Not saved" : "Saved"}</span>
                </div>
                {entry.feedback ? (
                  <p className="mt-4 text-sm text-[#4b3f86]">
                    Session saved: {entry.emotionalIntensityBefore}/10 → {entry.feedback.emotionalIntensityAfter}/10
                  </p>
                ) : null}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </MvpShell>
  );
}
