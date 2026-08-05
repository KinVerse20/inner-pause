"use client";

import { MvpShell } from "@/components/mvp-shell";
import { RitualBackdrop, RitualWeatherCard, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { chakraMap } from "@/data/chakras";
import { useMvpState } from "@/lib/use-mvp-state";

export function InsightsScreen() {
  const state = useMvpState();
  const savedEntries = state.entries.filter((entry) => !entry.isTemporary);
  const completedSessions = state.entries.filter((entry) => entry.feedback);
  const latest = savedEntries[0];
  const tone = inferWeatherTone(`${latest?.analysis?.summary ?? ""} ${latest?.analysis?.emotions[0]?.name ?? ""}`);
  const activeChakra = latest?.analysis?.chakraAssociations[0]?.chakra;
  const emotionalThemes = savedEntries
    .map((entry) => entry.analysis?.emotions[0]?.name)
    .filter((value): value is string => Boolean(value))
    .slice(0, 4);

  return (
    <MvpShell>
      <div className="space-y-5">
        <RitualBackdrop tone={tone} className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-center">
            <div className="space-y-5">
              <p className="minimal-label text-xs">Inner World</p>
              <h1 className="font-serif text-[clamp(2.7rem,8vw,4.8rem)] leading-[0.95] text-[var(--ip-ink)]">
                Your inner garden.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--ip-body)]">
                Each reflection adds a petal. Each healing session adds light. Over time, the patterns you return to begin to form a living memory.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <GardenMetric label="Reflections" value={String(savedEntries.length)} />
                <GardenMetric label="Healing sessions" value={String(completedSessions.length)} />
                <GardenMetric label="Days of care" value={String(new Set(savedEntries.map((entry) => entry.createdAt.slice(0, 10))).size)} />
                <GardenMetric label="Inner growth" value={`${Math.max(1, Math.min(99, savedEntries.length * 7 + completedSessions.length * 5))}%`} />
              </div>
            </div>

            <div className="inner-garden">
              <div className="inner-garden__stem" />
              {savedEntries.slice(0, 10).map((entry, index) => (
                <span
                  key={entry.id}
                  className="inner-garden__petal"
                  style={{
                    left: `${50 + Math.cos((index / Math.max(savedEntries.length, 1)) * Math.PI * 2) * 18}%`,
                    top: `${32 + Math.sin((index / Math.max(savedEntries.length, 1)) * Math.PI * 2) * 12}%`,
                    transform: `translate(-50%, -50%) rotate(${index * 34}deg)`,
                    animationDelay: `${index * 0.3}s`,
                  }}
                />
              ))}
              {completedSessions.slice(0, 14).map((entry, index) => (
                <span
                  key={`${entry.id}-light`}
                  className="inner-garden__star"
                  style={{
                    left: `${12 + (index * 13) % 76}%`,
                    top: `${18 + (index * 9) % 62}%`,
                    animationDelay: `${index * 0.4}s`,
                  }}
                />
              ))}
              <span className="inner-garden__leaf" style={{ left: "36%", bottom: "16%", transform: "rotate(-24deg)" }} />
              <span className="inner-garden__leaf" style={{ left: "52%", bottom: "20%", transform: "rotate(24deg)" }} />
            </div>
          </div>
        </RitualBackdrop>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
          <div className="space-y-4">
            <RitualWeatherCard
              title="Current focus"
              line={
                activeChakra
                  ? `${chakraMap[activeChakra].name} is the brightest part of your garden right now.`
                  : "Your inner world becomes more visible every time you return."
              }
              tone={tone}
            />
            <div className="obsidian-panel rounded-[1.45rem] p-4 sm:p-5">
              <p className="minimal-label text-[0.62rem]">Pattern clusters</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {emotionalThemes.length ? (
                  emotionalThemes.map((theme) => (
                    <span key={theme} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-[var(--ip-ink)]">
                      {theme}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--ip-body)]">Your first saved reflection will begin the pattern map.</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <RitualWeatherCard
              title="Carry forward"
              line={latest?.feedback?.reflection ?? "Come back tomorrow and let the garden keep growing."}
              tone={tone}
            />
            <RitualWeatherCard
              title="Latest growth"
              line={latest?.analysis?.understandingSummary ?? latest?.analysis?.summary ?? "No saved reflection yet."}
              tone={tone}
            />
          </div>
        </div>
      </div>
    </MvpShell>
  );
}

function GardenMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(18,20,22,0.56)] p-4">
      <p className="minimal-label text-[0.62rem]">{label}</p>
      <p className="mt-2 font-serif text-3xl text-[var(--ip-ink)]">{value}</p>
    </div>
  );
}

