import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
// Integer frequencies and an integer-second loop preserve phase at the loop boundary.
const destination = new URL('../frontend/public/audio/revised/tones/', import.meta.url);
await mkdir(destination, { recursive: true });
const sampleRate = 48000, seconds = 10, samples = sampleRate * seconds;
for (const hz of [396, 417, 528, 639, 741, 852, 963]) {
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  for (let n = 0; n < samples; n++) wav.writeInt16LE(Math.round(0.8 * 32767 * Math.sin(2 * Math.PI * hz * n / sampleRate)), 44 + n * 2);
  await writeFile(new URL(`${hz}.wav`, destination), wav);
}
console.log(`Generated 7 reusable tone loops in ${fileURLToPath(destination)}`);
