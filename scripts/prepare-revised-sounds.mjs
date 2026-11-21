import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const { sounds } = JSON.parse(await readFile(new URL('audio-sources/elevenlabs/manifest.json', root), 'utf8'));
await mkdir(new URL('frontend/public/audio/revised/sounds/', root), { recursive: true });
for (const sound of sounds) {
  const source = fileURLToPath(new URL(`audio-sources/elevenlabs/${sound.id}.mp3`, root));
  const dest = fileURLToPath(new URL(`frontend/public/audio/revised/sounds/${sound.id}.m4a`, root));
  // Crossfade tail into head, then cut a complete cycle between matching positions.
  const filter = `[0:a]asplit[a][b];[a][b]acrossfade=d=1:c1=tri:c2=tri,atrim=start=1:end=${sound.duration},asetpts=PTS-STARTPTS,loudnorm=I=-23:TP=-3:LRA=7,aresample=48000[out]`;
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-filter_complex', filter, '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', dest]);
  console.log(`${sound.id}: ${sound.duration - 1}s loop prepared`);
}
