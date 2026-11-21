'use client';
import { useEffect, useRef, useState } from 'react';
import { MvpShell } from '@/components/mvp-shell';
import { createFrontendApiClient } from '@/lib/auth/session';
import { useAuth } from '@/lib/auth/auth-provider';
import { RevisedAudioPlayer } from '@/lib/revised-audio';
import { emotionCatalog, MAX_EMOTIONS } from '../../packages/shared/src/emotion-catalog';
import { createSessionPlan, soundExperiences, type SessionInput, type SoundExperience, type TonePreset } from '../../packages/shared/src/session-planning';
import type { SavedJourney } from '../../packages/shared/src/journey';
import { UiSelect } from '@/components/ui-select';

export function RevisedJourneyScreen() {
  const { loading: authLoading, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'written' | 'direct'>('written');
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [depth, setDepth] = useState<SessionInput['depth']>('complete');
  const [sound, setSound] = useState<SoundExperience>('rain');
  const [preset, setPreset] = useState<TonePreset>('soft');
  const [journey, setJourney] = useState<SavedJourney>();
  const [elapsed, setElapsed] = useState(0);
  const [blockIndex, setBlockIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [outcome, setOutcome] = useState<'completed' | 'exited'>('completed');
  const [rating, setRating] = useState(3);
  const [reflection, setReflection] = useState('');
  const [history, setHistory] = useState<SavedJourney[]>([]);
  const player = useRef<RevisedAudioPlayer | null>(null);
  useEffect(() => () => { void player.current?.exit(); }, []);
  const input: SessionInput = { emotionIds: selected, inputMode: mode, reflection: text, depth, sound, tonePreset: preset };
  const plan = selected.length ? createSessionPlan({ ...input, inputMode: 'direct' }) : null;
  const buttonClass = 'live-choice';
  async function run(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError('');
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function suggest() {
    if (mode === 'written') {
      const result = await createFrontendApiClient().detectRevisedEmotions(text);
      setSelected(result.suggestions.map(s => s.emotionId));
      setNotice(result.suggestions.length ? 'These may fit what you shared. Keep, remove or add feelings before continuing.' : 'Your reflection is saved in this session. Choose the feelings that fit best.');
    }
    setStep(2);
  }
  async function start() {
    setBlockIndex(0); setElapsed(0);
    const saved = journey ?? await createFrontendApiClient().createRevisedJourney(input);
    setJourney(saved);
    await player.current?.exit();
    const instance = new RevisedAudioPlayer(saved.plan, new AudioContext(), undefined, state => {
      setElapsed(Math.floor(state.elapsed));
      setBlockIndex(state.blockIndex);
      if (state.completed) { setPlaying(false); setOutcome('completed'); setStep(7); }
    });
    player.current = instance;
    await instance.play(); setPlaying(true); setStep(6);
  }
  if (authLoading || !profile) return <MvpShell hideNav><p>Loading your session…</p></MvpShell>;
  return <MvpShell hideNav={step === 6}><section className="revised-journey">
    <div className="live-step"><span>STEP {Math.min(step, 7)} OF 7</span><span>{['Express', 'Confirm', 'Understand', 'Shape your session', 'Review', 'Pause', 'Reflect', 'Complete'][step - 1]}</span></div>
    <div className="live-progress" role="progressbar" aria-label="Journey progress" aria-valuemin={1} aria-valuemax={7} aria-valuenow={Math.min(step, 7)}><span style={{ width: `${Math.min(step, 7) / 7 * 100}%` }} /></div>
    <h1>Your Inner Pause</h1>
    <p className="live-intro">A moment to listen inward. A little room to feel lighter.</p>
    {error && <p role="alert">{error}</p>}
    {step === 1 && <>
      <h2>How would you like to begin?</h2>
      <div className="flex flex-wrap gap-2">{(['written', 'direct'] as const).map(value => <button className={buttonClass} aria-pressed={mode === value} key={value} onClick={() => setMode(value)}>{value === 'written' ? 'Write a reflection' : 'Choose emotions directly'}</button>)}</div>
      {mode === 'written' && <textarea aria-label="Your reflection" placeholder="What’s been on your mind? There’s no right way to begin…" className="w-full rounded-xl border p-3" value={text} maxLength={10000} onChange={e => setText(e.target.value)} />}
      <button className={buttonClass} disabled={busy || (mode === 'written' && !text.trim())} onClick={() => void run(suggest)}>Continue</button>
    </>}
    {step === 2 && <>
      <h2>Confirm how you feel</h2><p>{notice || `Choose up to ${MAX_EMOTIONS} emotions.`}</p>
      <div className="flex flex-wrap gap-2">{emotionCatalog.map(emotion => <button key={emotion.id} className={buttonClass} aria-pressed={selected.includes(emotion.id)} disabled={!selected.includes(emotion.id) && selected.length >= MAX_EMOTIONS} onClick={() => setSelected(current => current.includes(emotion.id) ? current.filter(id => id !== emotion.id) : [...current, emotion.id])}>{emotion.label}{selected.includes(emotion.id) ? ' ✓' : ''}</button>)}</div>
      <button className={buttonClass} disabled={!selected.length} onClick={() => setStep(3)}>Confirm {selected.length} emotions</button>
    </>}
    {step === 3 && plan && <>
      <h2>Your sound journey</h2><p>These traditional chakra associations guide your relaxation session.</p>
      <ul>{plan.blocks.map(block => <li key={block.chakra}>{block.chakra}: {block.frequencyHz} Hz — {block.emotionIds.map(id => emotionCatalog.find(e => e.id === id)?.label).join(', ')}</li>)}</ul>
      <button className={buttonClass} onClick={() => setStep(4)}>Shape my session</button>
    </>}
    {(step === 4 || step === 6) && <>
      {step === 4 && <label className="block">Session length <UiSelect label="Session length" value={depth} onChange={setDepth} options={[{ value: 'quick', label: 'Quick — 5 minutes per frequency' }, { value: 'complete', label: 'Complete — 10 minutes per frequency' }, { value: 'deep', label: 'Deep — 15 minutes per frequency' }]} /></label>}
      <label className="block">Sound experience <UiSelect label="Sound experience" value={sound} disabled={busy} onChange={value => { void run(async () => { if (step === 6) await player.current?.switchSound(value); setSound(value); }); }} options={soundExperiences.map(value => ({ value, label: value.replaceAll('-', ' ') }))} /></label>
      <label className="block">Tone strength <UiSelect label="Tone strength" value={preset} onChange={value => { player.current?.setPreset(value); setPreset(value); }} options={(['soft', 'balanced', 'clear'] as const).map(value => ({ value, label: value }))} /></label>
      {step === 4 && <button className={buttonClass} onClick={() => setStep(5)}>Review session</button>}
    </>}
    {step === 5 && plan && <>
      <h2>Ready for your pause?</h2><p>{plan.blocks.length} frequencies · {plan.totalSeconds / 60} minutes total · {sound}</p>
      <ol>{plan.blocks.map(block => <li key={block.chakra}>{block.frequencyHz} Hz for {block.durationSeconds / 60} minutes</li>)}</ol>
      <button className={buttonClass} disabled={busy} onClick={() => void run(start)}>Begin session</button>
    </>}
    {step === 6 && journey && <>
      <p aria-live="off" data-testid="playback-time">{elapsed} / {journey.plan.totalSeconds} seconds</p>
      <p data-testid="current-frequency">{journey.plan.blocks[blockIndex].frequencyHz} Hz</p>
      <div className="flex flex-wrap gap-2">
        <button className={buttonClass} disabled={busy} onClick={() => void run(async () => { if (playing) await player.current?.pause(); else await player.current?.play(); setPlaying(!playing); })}>{playing ? 'Pause' : 'Resume'}</button>
        <button className={buttonClass} onClick={() => player.current?.skip()}>Skip frequency</button>
        <button className={buttonClass} onClick={() => void run(async () => { await player.current?.exit(); setPlaying(false); setOutcome('exited'); setStep(7); })}>Exit session</button>
      </div>
    </>}
    {step === 7 && journey && <>
      <h2>How was your pause?</h2>
      <label className="block">Rating <UiSelect label="Rating" value={String(rating)} onChange={value => setRating(Number(value))} options={[1, 2, 3, 4, 5].map(value => ({ value: String(value), label: String(value) }))} /></label>
      <textarea aria-label="Feedback" className="w-full rounded-xl border p-3" maxLength={2000} value={reflection} onChange={e => setReflection(e.target.value)} />
      <button className={buttonClass} disabled={busy} onClick={() => void run(async () => { await createFrontendApiClient().finishRevisedJourney(journey.id, outcome, { rating, reflection }); await player.current?.exit(); setHistory(await createFrontendApiClient().listRevisedJourneys()); setStep(8); })}>Save journey</button>
    </>}
    {step === 8 && <><h2>Journey saved</h2><ul>{history.map(item => <li key={item.id}>{item.plan.totalSeconds / 60} minutes · {item.status} · Rating {item.feedback?.rating ?? '—'}</li>)}</ul><button className={buttonClass} onClick={() => { setJourney(undefined); setSelected([]); setElapsed(0); setReflection(''); setStep(1); }}>Start another pause</button></>}
    {step > 1 && step < 6 && !journey && <button className={buttonClass} onClick={() => setStep(step - 1)}>Back</button>}
  </section></MvpShell>;
}
