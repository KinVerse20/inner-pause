import type { SessionPlan } from '../../packages/shared/src/session-planning';

export class PlaybackClock {
  private accumulated = 0;
  private startedAt: number | null = null;
  private closed = false;
  constructor(readonly plan: SessionPlan, private now: () => number = () => performance.now() / 1000) {}
  get elapsed() { return Math.min(this.plan.totalSeconds, this.accumulated + (this.startedAt === null ? 0 : Math.max(0, this.now() - this.startedAt))); }
  get playing() { return !this.closed && this.startedAt !== null && this.elapsed < this.plan.totalSeconds; }
  get completed() { return this.elapsed >= this.plan.totalSeconds; }
  get blockIndex() {
    let boundary = 0;
    for (let i = 0; i < this.plan.blocks.length; i++) {
      boundary += this.plan.blocks[i].durationSeconds;
      if (this.elapsed < boundary) return i;
    }
    return this.plan.blocks.length - 1;
  }
  play() { if (!this.closed && !this.completed && this.startedAt === null) this.startedAt = this.now(); }
  pause() { this.accumulated = this.elapsed; this.startedAt = null; }
  skip() {
    if (this.closed || this.completed) return;
    const wasPlaying = this.playing;
    const next = this.plan.blocks.slice(0, this.blockIndex + 1).reduce((sum, b) => sum + b.durationSeconds, 0);
    this.pause(); this.accumulated = next;
    if (wasPlaying) this.play();
  }
  exit() { this.pause(); this.closed = true; }
}
