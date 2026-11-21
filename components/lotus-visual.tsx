export function LotusVisual({ completedChakras }: { completedChakras: number }) {
  const stage = Math.min(completedChakras, 7);
  const stemHeight = stage > 0 ? "4rem" : "2rem";

  return (
    <div className="relative mx-auto flex h-44 w-full max-w-xs items-end justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-[0_20px_80px_rgba(15,23,42,0.55)]">
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-emerald-900/50 to-transparent" />
      <div
        className="absolute bottom-14 w-1 rounded-full bg-gradient-to-t from-emerald-700 to-emerald-300"
        style={{ height: stemHeight }}
      />
      {stage >= 1 ? (
        <div className="absolute bottom-10 h-9 w-24 rounded-full border border-emerald-300/30 bg-emerald-500/15" />
      ) : (
        <div className="absolute bottom-9 h-5 w-5 rounded-full bg-amber-200/60 shadow-[0_0_18px_rgba(251,191,36,0.35)]" />
      )}
      {stage >= 2 && <div className="absolute bottom-16 h-6 w-6 rounded-full bg-emerald-200/80" />}
      {stage >= 3 && (
        <>
          <div
            className="absolute bottom-16 right-[36%] h-7 w-10 rounded-[100%_10%_100%_10%] bg-emerald-400/60"
            style={{ transform: "rotate(-25deg)" }}
          />
          <div
            className="absolute bottom-16 left-[36%] h-7 w-10 rounded-[10%_100%_10%_100%] bg-emerald-400/60"
            style={{ transform: "rotate(25deg)" }}
          />
        </>
      )}
      {stage >= 4 && <div className="absolute bottom-20 h-16 w-12 rounded-t-full rounded-b-[45%] bg-rose-200/60" />}
      {stage >= 5 && (
        <>
          <div
            className="absolute right-[43%] h-12 w-8 rounded-t-full bg-pink-200/75"
            style={{ bottom: "5.5rem", transform: "rotate(-12deg)" }}
          />
          <div
            className="absolute left-[43%] h-12 w-8 rounded-t-full bg-pink-200/75"
            style={{ bottom: "5.5rem", transform: "rotate(12deg)" }}
          />
        </>
      )}
      {stage >= 6 && (
        <>
          <div className="absolute bottom-24 h-14 w-10 rounded-t-full bg-pink-100/80" />
          <div
            className="absolute bottom-20 right-[34%] h-10 w-7 rounded-t-full bg-fuchsia-100/70"
            style={{ transform: "rotate(-30deg)" }}
          />
          <div
            className="absolute bottom-20 left-[34%] h-10 w-7 rounded-t-full bg-fuchsia-100/70"
            style={{ transform: "rotate(30deg)" }}
          />
        </>
      )}
      {stage >= 7 && (
        <>
          <div
            className="absolute bottom-20 right-[27%] h-8 w-6 rounded-t-full bg-fuchsia-100/75"
            style={{ transform: "rotate(-45deg)" }}
          />
          <div
            className="absolute bottom-20 left-[27%] h-8 w-6 rounded-t-full bg-fuchsia-100/75"
            style={{ transform: "rotate(45deg)" }}
          />
          <div className="absolute inset-x-0 bottom-4 text-center text-xs uppercase tracking-[0.3em] text-amber-100/70">
            Fully bloomed
          </div>
        </>
      )}
    </div>
  );
}
