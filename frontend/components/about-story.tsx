import { HarmonyFormVisual } from "@/components/harmony-form-visual";

// The Inner Pause story — Kinverse's About screens (story → mark →
// experience) told with the Harmony Form board's words and the live mark.
// Shown at the top of You → Help / About.
const MEANINGS = [
  { title: "Layers of sound", copy: "The overlapping waves are the many layers within us. Thoughts, emotions, energy." },
  { title: "The pause", copy: "Two simple bars. An invitation to stop, breathe and create space." },
  { title: "Resonance", copy: "When we pause, we come back into resonance with ourselves." },
  { title: "Center stillness", copy: "At the center of the noise is quiet clarity." },
];

const EXPERIENCE = ["Life gets noisy", "You pause", "You return to yourself", "You move forward with clarity"];

export function AboutStory() {
  return (
    <section aria-labelledby="about-story-title" className="ds-card overflow-hidden">
      <div className="grid justify-items-center px-5 pb-6 pt-7 text-center" style={{ background: "var(--ds-accent-soft)" }}>
        <HarmonyFormVisual playing className="ds-only-light w-28" />
        <HarmonyFormVisual playing dark className="ds-only-dark w-28" />
        <p className="mt-5 text-[0.95rem] font-semibold tracking-[0.3em]">INNER PAUSE</p>
        <h2 id="about-story-title" className="ds-h2 mt-3">
          When we pause, we return to harmony.
        </h2>
      </div>
      <div className="space-y-3 px-5 py-5 text-[0.95rem] leading-7" style={{ color: "var(--ds-text-secondary)" }}>
        <p>Life is full of noise. Thoughts, emotions, pressure and expectations pull us outward and we lose our center.</p>
        <p>Inner Pause creates a gentle space between the noise and our response. A place where we can hear ourselves again.</p>
      </div>
      <dl className="grid gap-4 border-t px-5 py-5">
        {MEANINGS.map((item) => (
          <div key={item.title}>
            <dt className="ds-h3">{item.title}</dt>
            <dd className="mt-0.5 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              {item.copy}
            </dd>
          </div>
        ))}
      </dl>
      <div className="border-t px-5 py-5">
        <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
          The experience
        </p>
        <ol className="mt-3 grid gap-2.5">
          {EXPERIENCE.map((step, index) => (
            <li key={step} className="flex items-center gap-3 text-[0.95rem]">
              <span
                className="ds-num grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.8rem]"
                style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
              >
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-5 text-center text-[0.95rem] font-semibold leading-7">
          Sound meets stillness.
          <br />
          Pause creates harmony.
          <br />
          You come home to you.
        </p>
      </div>
    </section>
  );
}
