import { tonePresets, type SoundExperience, type TonePreset, type SessionPlan } from '../../packages/shared/src/session-planning';
import { PlaybackClock } from './revised-playback-clock';

export interface SoundAsset { url: string; source: 'elevenlabs' | 'generated'; generationId: string; loopSeconds?: number }
export const approvedSoundAssets: Partial<Record<SoundExperience, SoundAsset>> = {
  'rain': { url: '/audio/revised/sounds/rain.m4a', source: 'elevenlabs', generationId: 'tebUz1yYfkXumy99Wa9J', loopSeconds: 29 },
  'forest': { url: '/audio/revised/sounds/forest.m4a', source: 'elevenlabs', generationId: 'l47PioE0kx15RVBhq6dE', loopSeconds: 29 },
  'waves': { url: '/audio/revised/sounds/waves.m4a', source: 'elevenlabs', generationId: 'VTOVX4JdyHOMHHGLnK5u', loopSeconds: 29 },
  'wind': { url: '/audio/revised/sounds/wind.m4a', source: 'elevenlabs', generationId: 'local-gentle-wind-v1', loopSeconds: 29 },
  'binaural-focus': { url: '/audio/revised/sounds/binaural-focus.m4a', source: 'generated', generationId: 'stereo-200-214-v1', loopSeconds: 30 },
  'bilateral-calm': { url: '/audio/revised/sounds/bilateral-calm.m4a', source: 'generated', generationId: 'bilateral-pink-0.1hz-v1', loopSeconds: 30 },
  'mindspace': { url: '/audio/revised/sounds/mindspace.m4a', source: 'generated', generationId: 'stereo-ambient-pan-0.1hz-v1', loopSeconds: 30 },
};

type Voice = { source: AudioBufferSourceNode; gain: GainNode };
export class RevisedAudioPlayer {
  readonly clock: PlaybackClock;
  private tone?: Voice;
  private ambience?: Voice;
  private voices = new Set<Voice>();
  private buffers = new Map<string, AudioBuffer>();
  private block = -1;
  private timer?: ReturnType<typeof setInterval>;
  private generation = 0;
  private closed = false;
  private starting = false;
  private preset: TonePreset;
  private sound: SoundExperience;
  constructor(readonly plan: SessionPlan, private context: AudioContext,
    private assets = approvedSoundAssets,
    private onUpdate: (state: { elapsed: number; blockIndex: number; completed: boolean }) => void = () => {}) {
    this.clock = new PlaybackClock(plan, () => this.context.currentTime);
    this.preset = plan.selection.tonePreset;
    this.sound = plan.selection.sound;
  }
  private async buffer(url: string) {
    const cached = this.buffers.get(url);
    if (cached) return cached;
    const response = await fetch(url);
    if (!response.ok) throw new Error('The selected sound could not be loaded.');
    const decoded = await this.context.decodeAudioData(await response.arrayBuffer());
    this.buffers.set(url, decoded);
    return decoded;
  }
  async prepare() {
    await Promise.all(this.plan.blocks.map(b => this.buffer(`/audio/revised/tones/${b.frequencyHz}.wav`)));
    if (this.sound !== 'frequency-only') await this.buffer(this.soundUrl(this.sound));
  }
  private soundUrl(sound: SoundExperience) {
    const asset = this.assets[sound];
    if (!asset) throw new Error(`The ${sound} recording has not been imported yet.`);
    return asset.url;
  }
  private voice(buffer: AudioBuffer, level: number, loopSeconds?: number): Voice {
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    source.buffer = buffer; source.loop = true;
    source.loopEnd = loopSeconds ?? buffer.duration;
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(level, this.context.currentTime + 0.5);
    source.connect(gain).connect(this.context.destination); source.start();
    const voice = { source, gain }; this.voices.add(voice);
    source.onended = () => { source.disconnect(); gain.disconnect(); this.voices.delete(voice); };
    return voice;
  }
  private retire(voice?: Voice) {
    if (!voice) return;
    voice.gain.gain.cancelAndHoldAtTime(this.context.currentTime);
    voice.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.5);
    voice.source.stop(this.context.currentTime + 0.5);
  }
  private toneLevel() { return 10 ** (tonePresets[this.preset] / 20); }
  async play() {
    if (this.closed || this.starting || this.clock.completed || this.clock.playing) return;
    this.starting = true;
    try {
      await this.prepare();
      if (this.closed) return;
      await this.context.resume();
      if (this.closed) return;
      this.clock.play();
      this.updateTone();
      if (this.sound !== 'frequency-only' && !this.ambience) this.ambience = this.voice(this.buffers.get(this.soundUrl(this.sound))!, 0.7, this.assets[this.sound]?.loopSeconds);
      this.timer ??= setInterval(() => this.tick(), 50);
    } finally { this.starting = false; }
  }
  async pause() { this.clock.pause(); await this.context.suspend(); }
  skip() { this.clock.skip(); this.tick(); }
  setPreset(preset: TonePreset) {
    if (!Object.hasOwn(tonePresets, preset)) throw new Error('Invalid tone preset.');
    this.preset = preset;
    this.tone?.gain.gain.setTargetAtTime(this.toneLevel(), this.context.currentTime, 0.1);
  }
  async switchSound(sound: SoundExperience) {
    if (this.closed) return;
    const generation = ++this.generation;
    const buffer = sound === 'frequency-only' ? undefined : await this.buffer(this.soundUrl(sound));
    if (this.closed || generation !== this.generation) return;
    this.retire(this.ambience);
    this.ambience = buffer && this.block >= 0 ? this.voice(buffer, 0.7, this.assets[sound]?.loopSeconds) : undefined;
    this.sound = sound;
  }
  private updateTone() {
    if (this.block === this.clock.blockIndex) return;
    const buffer = this.buffers.get(`/audio/revised/tones/${this.plan.blocks[this.clock.blockIndex].frequencyHz}.wav`);
    if (!buffer) return;
    this.retire(this.tone);
    this.tone = this.voice(buffer, this.toneLevel()); this.block = this.clock.blockIndex;
  }
  private tick() {
    if (this.clock.completed) this.stopVoices(); else this.updateTone();
    this.onUpdate({ elapsed: this.clock.elapsed, blockIndex: this.clock.blockIndex, completed: this.clock.completed });
  }
  private stopVoices() {
    if (this.timer) clearInterval(this.timer); this.timer = undefined;
    for (const voice of this.voices) { try { voice.source.stop(); } catch { /* already ended */ } }
    this.tone = undefined; this.ambience = undefined;
  }
  async exit() {
    if (this.closed) return;
    this.closed = true; this.generation++; this.clock.exit(); this.stopVoices(); await this.context.close();
  }
}
