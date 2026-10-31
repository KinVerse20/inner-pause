import { spawn } from "node:child_process";
import { rename, rm } from "node:fs/promises";

import { RESONANCES, TARGET_LOUDNESS_LUFS, resonanceGainDb } from "@inner-pause/shared";
import ffmpegStatic from "ffmpeg-static";

// Renders a sound for playback with ffmpeg, in two passes:
//   1. measure: tune (when a frequency is given) and measure loudness;
//   2. render:  tune again, level to TARGET_LOUDNESS_LUFS without
//      compressing (loudnorm's linear mode, using pass 1's measurements),
//      resample to 48 kHz, apply the card's volume, crossfade the end into
//      the start so the loop has no seam, and encode it twice: 256 kbps AAC
//      (.m4a: Safari/iPhone, Chrome, Edge) and 192 kbps Opus (.webm: for
//      browsers without AAC, such as some Firefox and Chromium builds and
//      VS Code's built-in browser).
// Processing runs in 32-bit float throughout. The tuning filters are the
// same resonances the browser applies live (shared/src/tuning.ts).

const SAMPLE_RATE = 48000;
const AAC_BITRATE = "256k";
const OPUS_BITRATE = "192k";
/** How rendered files are encoded, for the admin screen. */
export const RENDER_FORMAT = `AAC ${AAC_BITRATE.replace("k", " kbps")} + Opus ${OPUS_BITRATE.replace("k", " kbps")} · ${SAMPLE_RATE / 1000} kHz`;
const TRUE_PEAK_DBTP = -1.5;
const LOUDNESS_RANGE_LU = 11;
// The end of the sound is crossfaded into its start over this long, so
// looping never clicks or jumps. Very short sounds are left as they are.
const LOOP_CROSSFADE_SECONDS = 3;
const MIN_LOOP_SECONDS = 30;
const TIMEOUT_MS = 20 * 60 * 1000;

/** ffmpeg: FFMPEG_PATH if set, else the binary bundled by ffmpeg-static. */
export function ffmpegPath(): string | null {
  return process.env.FFMPEG_PATH || ffmpegStatic || null;
}

interface RunOutput {
  stdout: string;
  stderr: string;
}

// Calls onTime with how far (seconds of audio) ffmpeg has got, from its
// -progress output on stdout, and its log so far.
function run(args: string[], signal?: AbortSignal, onTime?: (seconds: number, log: string) => void): Promise<RunOutput> {
  const binary = ffmpegPath();
  if (!binary) return Promise.reject(new Error("ffmpeg isn't available on the server."));
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true, signal });
    let stdout = "";
    let stderr = "";
    // Keep only the ends of long logs: the duration and loudness report
    // are all that's read back.
    const append = (current: string, chunk: Buffer) => (current + chunk.toString()).slice(-64_000);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout = append(stdout, chunk);
      const times = [...chunk.toString().matchAll(/out_time_us=(\d+)/g)];
      if (onTime && times.length) onTime(Number(times[times.length - 1][1]) / 1e6, stderr);
    });
    child.stderr.on("data", (chunk: Buffer) => (stderr = append(stderr, chunk)));
    const timer = setTimeout(() => child.kill("SIGKILL"), TIMEOUT_MS);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(lastLines(stderr) || `ffmpeg exited with code ${code}.`));
    });
  });
}

const lastLines = (log: string) => log.trim().split(/\r?\n/).slice(-3).join(" ").slice(0, 400);

function tuningFilters(frequencyHz: number) {
  return RESONANCES.map(({ ratio, gainDb, q }) => {
    const hz = Math.min(frequencyHz * ratio, 20000);
    return `equalizer=f=${hz}:t=q:w=${q}:g=${resonanceGainDb(gainDb, hz).toFixed(2)}`;
  });
}

interface LoudnessReport {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
}

export interface RenderResult {
  durationSeconds: number;
  /** Integrated loudness of the input after tuning (LUFS); null if silent. */
  inputLufs: number | null;
}

export async function renderSound(
  spec: { input: string; output: string; webmOutput: string; frequencyHz: number | null; volume: number },
  signal?: AbortSignal,
  /** 0–1: the first pass is the first half, the second the rest. */
  onProgress?: (fraction: number) => void,
): Promise<RenderResult> {
  const prepare = ["asetpts=PTS-STARTPTS", "aformat=sample_fmts=fltp", ...(spec.frequencyHz ? tuningFilters(spec.frequencyHz) : [])];
  const target = `I=${TARGET_LOUDNESS_LUFS}:TP=${TRUE_PEAK_DBTP}:LRA=${LOUDNESS_RANGE_LU}`;

  // Pass 1: loudness report on stderr, decoded duration via -progress.
  const measured = await run([
    "-hide_banner",
    "-nostats",
    "-i",
    spec.input,
    "-vn",
    "-af",
    [...prepare, `loudnorm=${target}:print_format=json`].join(","),
    "-progress",
    "pipe:1",
    "-f",
    "null",
    "-",
  ], signal, (seconds, log) => {
    // Pass 1 only knows the length the file's header states.
    const header = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(log);
    const stated = header ? Number(header[1]) * 3600 + Number(header[2]) * 60 + Number(header[3]) : 0;
    if (stated > 0) onProgress?.(Math.min(0.5, (0.5 * seconds) / stated));
  });
  const report = JSON.parse(/\{[^{}]*"input_i"[^{}]*\}/.exec(measured.stderr)?.[0] ?? "null") as LoudnessReport | null;
  const outTimes = [...measured.stdout.matchAll(/out_time_us=(\d+)/g)];
  const duration = outTimes.length ? Number(outTimes[outTimes.length - 1][1]) / 1e6 : 0;
  if (!report || !(duration > 0)) throw new Error("Couldn't read this audio file.");

  const inputLufs = Number.parseFloat(report.input_i);
  const level = Number.isFinite(inputLufs)
    ? [
        `loudnorm=${target}:measured_I=${report.input_i}:measured_TP=${report.input_tp}:measured_LRA=${report.input_lra}` +
          `:measured_thresh=${report.input_thresh}:offset=${report.target_offset}:linear=true`,
      ]
    : [];
  // loudnorm works at 192 kHz internally; resample back down with a long,
  // high-quality filter.
  const chain = [...prepare, ...level, `aresample=${SAMPLE_RATE}:filter_size=64:phase_shift=10:cutoff=0.98`, `volume=${spec.volume.toFixed(3)}`].join(",");

  const fade = duration >= MIN_LOOP_SECONDS ? LOOP_CROSSFADE_SECONDS : 0;
  const end = (duration - fade).toFixed(3);
  const graph = fade
    ? `[0:a]${chain},asplit=3[a][b][c];` +
      `[a]atrim=start=${fade}:end=${end},asetpts=PTS-STARTPTS[body];` +
      `[b]atrim=start=${end},asetpts=PTS-STARTPTS,afade=t=out:d=${fade}:curve=qsin[tail];` +
      `[c]atrim=end=${fade},asetpts=PTS-STARTPTS,afade=t=in:d=${fade}:curve=qsin[head];` +
      // Equal-power crossfade of the tail into the head. (acrossfade emits
      // nothing when both inputs are exactly the fade length.)
      `[tail][head]amix=inputs=2:duration=longest:normalize=0[seam];` +
      `[body][seam]concat=n=2:v=0:a=1[out]`
    : `[0:a]${chain}[out]`;

  const partial = `${spec.output}.partial.m4a`;
  const partialWebm = `${spec.webmOutput}.partial.webm`;
  try {
    await run([
      "-hide_banner",
      "-nostats",
      "-y",
      "-i",
      spec.input,
      "-filter_complex",
      `${graph};[out]asplit=2[aac][opus]`,
      "-progress",
      "pipe:1",
      "-map",
      "[aac]",
      "-c:a",
      "aac",
      "-b:a",
      AAC_BITRATE,
      "-ar",
      String(SAMPLE_RATE),
      "-movflags",
      "+faststart",
      partial,
      "-map",
      "[opus]",
      "-c:a",
      "libopus",
      "-b:a",
      OPUS_BITRATE,
      "-application",
      "audio",
      partialWebm,
    ], signal, (seconds) => onProgress?.(Math.min(0.99, 0.5 + (0.5 * seconds) / (duration - fade))));
    await rename(partial, spec.output);
    await rename(partialWebm, spec.webmOutput);
  } catch (error) {
    await rm(partial, { force: true, maxRetries: 5, retryDelay: 200 });
    await rm(partialWebm, { force: true, maxRetries: 5, retryDelay: 200 });
    throw error;
  }
  return { durationSeconds: duration - fade, inputLufs: Number.isFinite(inputLufs) ? inputLufs : null };
}
