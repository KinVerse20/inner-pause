'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { emotionCatalog, frequencies, type Chakra } from '../../packages/shared/src/emotion-catalog';
import { createSessionPlan, type SessionPlan, type TonePreset } from '../../packages/shared/src/session-planning';
import { RevisedAudioPlayer } from '@/lib/revised-audio';
import {
  chakraDetails, chakraOrder, momentCategories, moments, quickPauses, reasonForChakra,
  soundOptions, toneLevelDb, type MomentCategory, type MomentDefinition, type PhaseOneSound,
} from '@/lib/phase-one-data';
import {
  clearPhaseOneState, makePhaseOneId, readPhaseOneState, writePhaseOneState,
  type PhaseOneSessionRecord, type PhaseOneState,
} from '@/lib/phase-one-storage';
import { getPracticeIssue, practiceIssues, type PracticeIssueId } from '@/lib/practice-data';
import {
  activePractice, clearPracticeState, currentPracticeDay, longestPracticeStreak, practiceStreak, readPracticeState, writePracticeState,
  type PracticeEnrollment, type PracticeState,
} from '@/lib/practice-storage';
import { enablePracticeReminder, notificationSupport } from '@/lib/practice-notifications';

type Screen =
  | 'entry' | 'home' | 'player' | 'feedback' | 'journal' | 'journal-history'
  | 'emotions' | 'results' | 'chakras' | 'chakra-detail' | 'setup' | 'review'
  | 'moments' | 'moment-list' | 'about-story' | 'about-mark' | 'about-experience'
  | 'profile' | 'sound-preferences' | 'pause-history' | 'reflection-history' | 'privacy' | 'terms'
  | 'practice' | 'practice-setup' | 'practice-dashboard' | 'practice-checkin' | 'practice-day'
  | 'practice-complete' | 'practice-progress';

interface DraftSession {
  title: string;
  source: 'quick' | 'custom' | 'moment' | 'practice';
  emotionIds: string[];
  sound: PhaseOneSound;
  preset: TonePreset;
  minutes: 5 | 10 | 15;
  momentId?: string;
}

interface ActivePracticeSession { enrollmentId: string; day: number }

const emotionIcons: Record<string, string> = {
  anxiety: '≈', fear: '△', insecurity: '▱', guilt: '↺', numbness: '○', 'creative-block': '✦',
  overwhelm: '↻', 'self-doubt': '◇', shame: '◌', powerlessness: '□', sadness: '⌒', grief: '❋',
  loneliness: '◎', hurt: '♡', resentment: '⊘', frustration: '⚡', anger: '△', unheard: '◍',
  confusion: '⌁', overthinking: '∞', disconnection: '⊙', 'lack-of-purpose': '⋯',
};

const backMap: Partial<Record<Screen, Screen>> = {
  home: 'entry', player: 'home', feedback: 'player', journal: 'home', 'journal-history': 'journal',
  emotions: 'home', results: 'emotions', chakras: 'results', 'chakra-detail': 'chakras', setup: 'results',
  review: 'setup', moments: 'home', 'moment-list': 'moments', 'about-story': 'profile',
  'about-mark': 'about-story', 'about-experience': 'about-mark', profile: 'home',
  'sound-preferences': 'profile', 'pause-history': 'profile', 'reflection-history': 'profile', privacy: 'profile', terms: 'privacy',
  practice: 'home', 'practice-setup': 'practice', 'practice-dashboard': 'practice', 'practice-checkin': 'practice-dashboard',
  'practice-day': 'practice-checkin', 'practice-complete': 'practice-dashboard', 'practice-progress': 'practice-dashboard',
};

function ResonanceMark({ heart = false, small = false }: { heart?: boolean; small?: boolean }) {
  return <span className={`po-mark ${small ? 'po-mark-small' : ''}`} aria-hidden="true">
    <i /><i /><i />
    <b>{heart ? '♥' : 'Ⅱ'}</b>
  </span>;
}

function ChakraGlyph({ chakra, compact = false }: { chakra: Chakra; compact?: boolean }) {
  return <span className={`po-chakra-glyph ${compact ? 'is-compact' : ''}`} style={{ '--chakra': chakraDetails[chakra].color } as React.CSSProperties} aria-hidden="true">
    <i /><b>{chakra === 'third-eye' ? '◉' : chakra === 'heart' ? '◇' : chakra === 'crown' ? '✦' : '▽'}</b>
  </span>;
}

function AppIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    Home: <><path d="M4.5 11.5 12 4.5l7.5 7" /><path d="M6.5 9.5V19h11V9.5" /></>,
    Journal: <><path d="M6 4h12v16H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    Practice: <><path d="M5 5.5c3.2-.8 5.5.1 7 2.3 1.5-2.2 3.8-3.1 7-2.3v13c-3.1-.7-5.4.1-7 2-1.6-1.9-3.9-2.7-7-2z" /><path d="M12 7.8v12.5" /></>,
    Moments: <><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M8 3v5M16 3v5M8 12h3M13 12h3M8 16h3" /></>,
    You: <><circle cx="12" cy="8" r="3.3" /><path d="M5 20c1.2-3.8 4-5.7 7-5.7s5.8 1.9 7 5.7" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Nav({ screen, go }: { screen: Screen; go: (screen: Screen) => void }) {
  const items: { label: string; target: Screen; icon?: string }[] = [
    { label: 'Home', target: 'home' }, { label: 'Practice', target: 'practice' },
    { label: 'Pause', target: 'home' }, { label: 'Moments', target: 'moments' }, { label: 'Profile', target: 'profile', icon: 'You' },
  ];
  return <nav className="po-nav" aria-label="Main navigation"><div>{items.map(item => item.label === 'Pause'
    ? <button key={item.label} className="po-center-pause" onClick={() => go(item.target)} aria-label="Start a Pause"><ResonanceMark small /></button>
    : <button key={item.label} className={screen === item.target || (item.target === 'practice' && screen.startsWith('practice')) ? 'is-active' : ''} onClick={() => go(item.target)}><AppIcon name={item.icon || item.label} /><span>{item.label}</span></button>)}</div></nav>;
}

function ScreenHeader({ title, back }: { title?: string; back?: () => void }) {
  return <header className="po-screen-header">
    {back ? <button className="po-back" onClick={back} aria-label="Go back">‹</button> : <span className="po-header-space" />}
    <span>{title || 'INNER PAUSE'}</span><span className="po-header-space" />
  </header>;
}

function PageIntro({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return <div className="po-page-intro">{eyebrow && <span className="po-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{copy && <p>{copy}</p>}</div>;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function InnerPauseSelect<T extends string>({ label, icon, value, options, onChange }: {
  label: string; icon: string; value: T; options: readonly { value: T; label: string; note?: string }[]; onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const selected = options.find(option => option.value === value) ?? options[0];
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className={`po-player-select po-player-select-${label.toLowerCase()}`} ref={root}>
    <span>{icon}</span><small>{label}</small>
    <button type="button" className="po-player-select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}><b>{selected.label}</b><i>{open ? '⌃' : '⌄'}</i></button>
    {open && <div className="po-player-select-menu" role="listbox" aria-label={`${label} options`}>{options.map(option => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.label}</span>{option.note && <small>{option.note}</small>}{option.value === value && <b>✓</b>}</button>)}</div>}
  </div>;
}

export function PhaseOneApp() {
  const [screen, setScreen] = useState<Screen>('entry');
  const [selected, setSelected] = useState<string[]>([]);
  const [emotionQuery, setEmotionQuery] = useState('');
  const [chakra, setChakra] = useState<Chakra>('root');
  const [chakraReturn, setChakraReturn] = useState<Screen>('chakras');
  const [category, setCategory] = useState<MomentCategory>('coming-up');
  const [draft, setDraft] = useState<DraftSession | null>(null);
  const [storage, setStorage] = useState<PhaseOneState>(() => ({ journals: [], sessions: [], preferences: { sound: 'rain', preset: 'balanced', reminderEnabled: false, reminderTime: '20:00' } }));
  const [journalText, setJournalText] = useState('');
  const [journalNotice, setJournalNotice] = useState('');
  const [playerPlan, setPlayerPlan] = useState<SessionPlan | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [blockIndex, setBlockIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [whyOpen, setWhyOpen] = useState(true);
  const [feeling, setFeeling] = useState<'better' | 'same' | 'not-better' | ''>('');
  const [reflection, setReflection] = useState('');
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileName, setProfileName] = useState('Sahil');
  const [profileEmail, setProfileEmail] = useState('sahil@example.com');
  const [practiceState, setPracticeState] = useState<PracticeState>({ enrollments: [] });
  const [practiceIssueId, setPracticeIssueId] = useState<PracticeIssueId>('confidence');
  const [practiceReminderTime, setPracticeReminderTime] = useState('20:00');
  const [practiceCheckIn, setPracticeCheckIn] = useState('');
  const [practiceExerciseResponse, setPracticeExerciseResponse] = useState('');
  const [practiceRating, setPracticeRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [practiceSession, setPracticeSession] = useState<ActivePracticeSession | null>(null);
  const [reminderNotice, setReminderNotice] = useState('');
  const [reminderBusy, setReminderBusy] = useState(false);
  const player = useRef<RevisedAudioPlayer | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextPractice = readPracticeState();
      setStorage(readPhaseOneState()); setPracticeState(nextPractice);
      const open = new URLSearchParams(window.location.search).get('open');
      if (open === 'practice') setScreen(activePractice(nextPractice) ? 'practice-dashboard' : 'practice');
      if (open === 'pause') setScreen('home');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => () => { void player.current?.exit(); }, []);

  const plan = useMemo(() => draft ? createSessionPlan({
    inputMode: 'direct', emotionIds: draft.emotionIds, depth: draft.minutes === 5 ? 'quick' : draft.minutes === 10 ? 'complete' : 'deep',
    minutesPerFrequency: draft.minutes, sound: draft.sound, tonePreset: draft.preset,
  }) : null, [draft]);

  const go = (next: Screen) => { window.scrollTo({ top: 0, behavior: 'smooth' }); setScreen(next); };
  const back = () => go(screen === 'chakra-detail' ? chakraReturn : backMap[screen] || 'home');

  function createDraft(input: Partial<DraftSession> & Pick<DraftSession, 'title' | 'emotionIds' | 'source'>) {
    const next: DraftSession = {
      title: input.title, emotionIds: input.emotionIds, source: input.source,
      sound: input.sound || storage.preferences.sound, preset: input.preset || storage.preferences.preset,
      minutes: input.minutes || 5, momentId: input.momentId,
    };
    setDraft(next); setWhyOpen(true); return next;
  }

  async function beginSession(nextDraft = draft) {
    if (!nextDraft) return;
    setPlayerError(''); setElapsed(0); setBlockIndex(0); setFeeling(''); setReflection('');
    await player.current?.exit();
    const nextPlan = createSessionPlan({
      inputMode: 'direct', emotionIds: nextDraft.emotionIds,
      depth: nextDraft.minutes === 5 ? 'quick' : nextDraft.minutes === 10 ? 'complete' : 'deep',
      minutesPerFrequency: nextDraft.minutes, sound: nextDraft.sound, tonePreset: nextDraft.preset,
    });
    setPlayerPlan(nextPlan); go('player');
    try {
      const context = new AudioContext();
      const instance = new RevisedAudioPlayer(nextPlan, context, undefined, state => {
        setElapsed(Math.floor(state.elapsed)); setBlockIndex(Math.max(0, state.blockIndex));
        if (state.completed) { setPlaying(false); go('feedback'); }
      });
      player.current = instance;
      await instance.play(); setPlaying(true);
    } catch (error) {
      setPlaying(false); setPlayerError(error instanceof Error ? error.message : 'The sound could not start.');
    }
  }

  async function finishPlayback() {
    await player.current?.exit(); player.current = null; setPlaying(false); go('feedback');
  }

  function saveJournal() {
    if (!journalText.trim()) return;
    const next = { ...storage, journals: [{ id: makePhaseOneId('journal'), text: journalText.trim(), createdAt: new Date().toISOString() }, ...storage.journals] };
    writePhaseOneState(next); setStorage(next); setJournalText(''); setJournalNotice('Saved privately to your journal.');
  }

  async function saveFeedback(skip = false) {
    if (!draft || !playerPlan) { go('home'); return; }
    const record: PhaseOneSessionRecord = {
      id: makePhaseOneId('pause'), title: draft.title, emotionIds: draft.emotionIds,
      frequencies: playerPlan.blocks.map(item => item.frequencyHz), durationMinutes: Math.max(1, Math.round(elapsed / 60)),
      sound: draft.sound, completedAt: new Date().toISOString(),
      ...(skip ? {} : { feeling: feeling || undefined, reflection: reflection.trim() || undefined }),
    };
    const next = { ...storage, sessions: [record, ...storage.sessions] };
    writePhaseOneState(next); setStorage(next); await player.current?.exit(); player.current = null; setDraft(null); setPlayerPlan(null);
    if (practiceSession) {
      const updated = completePracticeDay(practiceState, practiceSession.enrollmentId, practiceSession.day, skip ? undefined : reflection.trim() || undefined);
      writePracticeState(updated); setPracticeState(updated); setPracticeSession(null); go('practice-complete');
    } else go('home');
  }

  function choosePractice(id: PracticeIssueId) {
    setPracticeIssueId(id); setPracticeReminderTime('20:00'); setReminderNotice(''); go('practice-setup');
  }

  async function startPractice() {
    setReminderBusy(true); setReminderNotice('');
    let permission: NotificationPermission | 'unsupported' = notificationSupport() ? Notification.permission : 'unsupported';
    try {
      const result = await enablePracticeReminder({ issueId: practiceIssueId, reminderTime: practiceReminderTime });
      permission = result.permission; setReminderNotice(result.message);
    } catch (error) {
      setReminderNotice(error instanceof Error ? error.message : 'The Practice was saved, but its reminder could not be connected.');
    }
    const enrollment: PracticeEnrollment = {
      id: makePhaseOneId('practice'), issueId: practiceIssueId, startedAt: new Date().toISOString(), reminderTime: practiceReminderTime,
      reminderEnabled: permission === 'granted', notificationPermission: permission, checkIns: [], completions: [], status: 'active',
    };
    const next = { enrollments: [enrollment, ...practiceState.enrollments], activeEnrollmentId: enrollment.id };
    writePracticeState(next); setPracticeState(next); setReminderBusy(false); go('practice-dashboard');
  }

  function savePracticeCheckIn(enrollment: PracticeEnrollment) {
    const day = currentPracticeDay(enrollment);
    const next: PracticeState = { ...practiceState, enrollments: practiceState.enrollments.map(item => item.id === enrollment.id ? {
      ...item, checkIns: [...item.checkIns.filter(entry => entry.day !== day), { day, text: practiceCheckIn.trim(), exerciseResponse: practiceExerciseResponse.trim(), rating: practiceRating, createdAt: new Date().toISOString() }],
    } : item) };
    writePracticeState(next); setPracticeState(next); go('practice-day');
  }

  function beginPracticeDay(enrollment: PracticeEnrollment) {
    const issue = getPracticeIssue(enrollment.issueId); const dayNumber = currentPracticeDay(enrollment); const day = issue.days[dayNumber - 1];
    setPracticeSession({ enrollmentId: enrollment.id, day: dayNumber });
    const next = createDraft({ title: `${issue.title} · Day ${dayNumber}`, emotionIds: day.emotionIds, source: 'practice', sound: day.sound, preset: day.preset, minutes: day.minutes });
    void beginSession(next);
  }

  function openMoment(item: MomentDefinition) {
    const next = createDraft({ title: item.title, emotionIds: item.emotionIds, source: 'moment', sound: item.sound, preset: item.tonePreset, minutes: item.minutes, momentId: item.id });
    void beginSession(next);
  }

  function setPreference(updates: Partial<PhaseOneState['preferences']>) {
    const next = { ...storage, preferences: { ...storage.preferences, ...updates } };
    writePhaseOneState(next); setStorage(next);
  }

  const enrollment = activePractice(practiceState) ?? practiceState.enrollments.find(item => item.id === practiceState.activeEnrollmentId);
  const activeIssue = enrollment ? getPracticeIssue(enrollment.issueId) : undefined;
  const activeDayNumber = enrollment ? currentPracticeDay(enrollment) : 1;
  const activeDay = activeIssue?.days[activeDayNumber - 1];
  const activeCheckIn = enrollment?.checkIns.find(item => item.day === activeDayNumber);

  if (screen === 'entry') return <main className="po-entry">
    <span className="po-entry-brand">INNER PAUSE</span>
    <button className="po-heart-enter" onClick={() => go('home')} aria-label="Enter Inner Pause"><ResonanceMark /><span>Tap to enter</span></button>
    <div className="po-entry-copy"><h1>Life feels like a lot right now.</h1><p>You don’t have to carry it alone.<br />I’m here to help you find a Pause.</p></div>
    <p className="po-entry-foot">A quiet space to help you return to yourself.</p>
  </main>;

  const showNav = true;
  return <div className={`po-app po-screen-${screen}`}>
    <main className="po-main">
      {screen !== 'home' && screen !== 'player' && <ScreenHeader title={screen.startsWith('about') ? 'ABOUT INNER PAUSE' : undefined} back={back} />}

      {screen === 'home' && <HomeScreen
        onQuick={item => { const next = createDraft({ title: item.label, emotionIds: item.emotionIds, source: 'quick', sound: item.sound, preset: storage.preferences.preset, minutes: item.minutes }); void beginSession(next); }}
        go={go}
      />}

      {screen === 'practice' && <section className="po-practice"><PageIntro eyebrow="BUILD A CAPABILITY" title="What would you like to practise?" copy="Choose one area. We’ll guide you through a simple 14-day practice, one small step each day." />
        {enrollment && activeIssue && <button className="po-practice-resume" onClick={() => go('practice-dashboard')}><span style={{ background: activeIssue.color }}>{activeIssue.icon}</span><strong>Continue {activeIssue.title}<small>Day {activeDayNumber} of 14 · {practiceStreak(enrollment)} day streak</small></strong><b>Continue →</b></button>}
        <div className="po-practice-grid">{practiceIssues.map(issue => <button key={issue.id} onClick={() => choosePractice(issue.id)}><span style={{ background: `${issue.color}20`, color: issue.color }}>{issue.icon}</span><strong>{issue.title}<small>{issue.subtitle}</small></strong><i>›</i></button>)}</div>
        <div className="po-practice-note"><strong>How Practice works</strong><p>Check in, listen, try one small action in real life, and reflect. This is supportive wellbeing content, not medical treatment.</p></div>
      </section>}

      {screen === 'practice-setup' && (() => { const issue = getPracticeIssue(practiceIssueId); return <section className="po-practice"><PageIntro eyebrow="YOUR 14-DAY PRACTICE" title={issue.title} copy={issue.description} />
        <div className="po-practice-hero" style={{ '--practice': issue.color } as React.CSSProperties}><span>{issue.icon}</span><div><strong>{issue.chakra} · {issue.frequencyHz} Hz</strong><p>14 guided days · about 5–10 minutes daily</p></div></div>
        <div className="po-card po-reminder-card"><span>◷</span><div><h2>Choose your daily time</h2><p>We’ll remind you even when the installed app is closed, once production push is connected.</p><input aria-label="Daily reminder time" type="time" value={practiceReminderTime} onChange={event => setPracticeReminderTime(event.target.value)} /></div></div>
        <div className="po-practice-preview"><h2>Your rhythm</h2><p><b>1</b><span>Check in about yesterday</span></p><p><b>2</b><span>Listen and practise</span></p><p><b>3</b><span>Use one action in real life</span></p><p><b>4</b><span>Reflect and build your streak</span></p></div>
        {reminderNotice && <p className="po-success">{reminderNotice}</p>}
        <button className="po-primary po-block" disabled={reminderBusy} onClick={() => void startPractice()}>{reminderBusy ? 'Setting up…' : 'Start my 14-day Practice'}</button>
      </section>; })()}

      {screen === 'practice-dashboard' && enrollment && activeIssue && activeDay && <section className="po-practice"><div className="po-practice-dashboard-head"><span className="po-eyebrow">YOUR PRACTICE</span><h1>{activeIssue.title}</h1><p>Small actions, repeated gently.</p></div>
        <div className="po-practice-stats"><div><strong>{activeDayNumber}</strong><span>of 14 days</span></div><div><strong>{practiceStreak(enrollment)}</strong><span>day streak</span></div><div><strong>{longestPracticeStreak(enrollment)}</strong><span>best streak</span></div></div>
        <div className="po-progress-track"><span style={{ width: `${enrollment.completions.length / 14 * 100}%` }} /></div>
        <article className="po-practice-today" style={{ '--practice': activeIssue.color } as React.CSSProperties}><span>{enrollment.status === 'completed' ? '14 DAYS COMPLETE' : `DAY ${activeDayNumber}`}</span><h2>{enrollment.status === 'completed' ? 'Your Practice is complete' : activeDay.title}</h2><p>{enrollment.status === 'completed' ? 'You built fourteen days of awareness and action. Return to any lesson in your reflections, or begin another capability.' : activeDay.intention}</p>{enrollment.status === 'active' && <><div><b>{activeDay.minutes} min</b><b>{soundOptions.find(item => item.id === activeDay.sound)?.label}</b><b>{activeIssue.frequencyHz} Hz</b></div><button className="po-primary" onClick={() => { setPracticeCheckIn(''); setPracticeExerciseResponse(''); setPracticeRating(3); go('practice-checkin'); }}>Begin today’s Practice</button></>}</article>
        <button className="po-text-action po-centered" onClick={() => go('practice-progress')}>See all 14 days and progress →</button>
        <div className="po-practice-reminder-line"><span>◷</span><strong>Daily reminder<small>{enrollment.reminderEnabled ? `On at ${enrollment.reminderTime}` : `Saved for ${enrollment.reminderTime} · browser permission off`}</small></strong></div>
      </section>}

      {screen === 'practice-checkin' && enrollment && activeIssue && activeDay && <section className="po-practice"><PageIntro eyebrow={`DAY ${activeDayNumber} · PAUSE AND PREPARE`} title="Before today’s sound" copy="Reflect on yesterday, then complete today’s short exercise. Both answers are saved together." />
        <div className="po-practice-writing-card"><span>01 · ABOUT YESTERDAY</span><h2>{activeDay.checkInPrompt}</h2><label className="po-practice-textarea"><textarea aria-label="Daily check-in" value={practiceCheckIn} onChange={event => setPracticeCheckIn(event.target.value)} placeholder="A few words about yesterday…" /></label>
          <fieldset className="po-practice-rating"><legend>How strongly did it affect you?</legend><div>{([1, 2, 3, 4, 5] as const).map(value => <button type="button" key={value} aria-pressed={practiceRating === value} onClick={() => setPracticeRating(value)}><b>{value}</b><span>{value === 1 ? 'Very little' : value === 5 ? 'A lot' : ''}</span></button>)}</div></fieldset></div>
        <div className="po-practice-writing-card"><span>02 · TODAY’S EXERCISE</span><h2>{activeDay.exercise}</h2><p>Use this space to complete the exercise or note what you observed.</p><label className="po-practice-textarea"><textarea aria-label="Today’s exercise response" value={practiceExerciseResponse} onChange={event => setPracticeExerciseResponse(event.target.value)} placeholder="Write your response here…" /></label></div>
        <button className="po-primary po-block" onClick={() => savePracticeCheckIn(enrollment)}>Continue to action and sound</button>
      </section>}

      {screen === 'practice-day' && enrollment && activeIssue && activeDay && <section className="po-practice"><PageIntro eyebrow={`DAY ${activeDayNumber} OF 14`} title={activeDay.title} copy={activeDay.intention} />
        {activeCheckIn?.exerciseResponse && <div className="po-practice-saved-note"><small>WHAT YOU WROTE</small><p>{activeCheckIn.exerciseResponse}</p><button onClick={() => { setPracticeCheckIn(activeCheckIn.text); setPracticeExerciseResponse(activeCheckIn.exerciseResponse || ''); setPracticeRating(activeCheckIn.rating); go('practice-checkin'); }}>Edit</button></div>}
        <div className="po-practice-step"><span>01</span><div><small>IN REAL LIFE</small><h2>Your small action</h2><p>{activeDay.action}</p></div></div>
        <div className="po-practice-sound"><span>{soundOptions.find(item => item.id === activeDay.sound)?.icon}</span><div><strong>{soundOptions.find(item => item.id === activeDay.sound)?.label}</strong><p>{activeIssue.frequencyHz} Hz undertone · {activeDay.preset} · {activeDay.minutes} minutes</p>{soundOptions.find(item => item.id === activeDay.sound)?.headphoneOnly && <small>Headphones required for the stereo effect.</small>}</div></div>
        <button className="po-primary po-block" onClick={() => beginPracticeDay(enrollment)}>Start sound Practice</button>
      </section>}

      {screen === 'practice-complete' && (() => { const latest = practiceState.enrollments.find(item => item.id === practiceState.activeEnrollmentId) || practiceState.enrollments[0]; const issue = latest ? getPracticeIssue(latest.issueId) : undefined; return issue && latest ? <section className="po-practice po-practice-complete"><ResonanceMark small /><PageIntro eyebrow={latest.status === 'completed' ? '14 DAYS COMPLETE' : 'TODAY IS COMPLETE'} title={latest.status === 'completed' ? 'You completed your Practice.' : 'You showed up.'} copy="A small practice still counts. Let the action continue in the rest of your day." /><div className="po-practice-streak-celebrate"><strong>{practiceStreak(latest)}</strong><span>day streak</span></div><div className="po-card"><h2>Carry this with you</h2><p>{issue.days[Math.max(0, latest.completions.length - 1)]?.action}</p></div><button className="po-primary po-block" onClick={() => go('practice-dashboard')}>{latest.status === 'completed' ? 'See my completed Practice' : 'Return to my Practice'}</button></section> : null; })()}

      {screen === 'practice-progress' && enrollment && activeIssue && <section className="po-practice"><PageIntro title="Your 14-day path" copy={`${enrollment.completions.length} days complete · ${practiceStreak(enrollment)} day current streak`} /><div className="po-practice-days">{activeIssue.days.map(day => { const done = enrollment.completions.some(item => item.day === day.day); const current = day.day === activeDayNumber && enrollment.status === 'active'; return <div key={day.day} className={done ? 'is-done' : current ? 'is-current' : ''}><span>{done ? '✓' : day.day}</span><strong>{day.title}<small>{done ? 'Completed' : current ? 'Today' : 'Upcoming'}</small></strong></div>; })}</div></section>}

      {screen === 'journal' && <section><PageIntro eyebrow="A SPACE FOR YOU" title="What’s on your mind?" copy="Write whatever you need to let out. This entry will be saved in your personal journal." />
        <div className="po-card po-journal-card"><textarea value={journalText} onChange={event => { setJournalText(event.target.value); setJournalNotice(''); }} placeholder="Write whatever you need to put down…" aria-label="Journal entry" /><div className="po-journal-actions"><span>{journalText.length} characters</span><button className="po-primary" onClick={saveJournal} disabled={!journalText.trim()}>Save entry</button></div></div>
        {journalNotice && <p className="po-success">{journalNotice}</p>}
        <button className="po-text-action" onClick={() => go('journal-history')}>View saved journal entries →</button>
        <div className="po-privacy-note"><span>⌾</span><div><strong>Your private space</strong><p>Your writing stays in this local test app. It does not influence your suggested frequencies.</p></div></div>
      </section>}

      {screen === 'journal-history' && <section><PageIntro title="Your journal" copy="A private record of what you have chosen to save." />
        <button className="po-primary po-inline-primary" onClick={() => go('journal')}>＋ New entry</button>
        <div className="po-stack">{storage.journals.length ? storage.journals.map(entry => <article className="po-card po-entry-card" key={entry.id}><time>{new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</time><h2>{entry.text.split('\n')[0].slice(0, 54)}</h2>{entry.text.length > 54 && <p>{entry.text.slice(54, 220)}</p>}<button onClick={() => { const next = { ...storage, journals: storage.journals.filter(item => item.id !== entry.id) }; writePhaseOneState(next); setStorage(next); }}>Delete</button></article>) : <EmptyState title="Your journal is ready" copy="Entries you save will appear here." />}</div>
      </section>}

      {screen === 'emotions' && <section><PageIntro title="Choose what you’re feeling" copy="Select the emotions that feel closest to you right now." />
        <div className="po-selection-count">{selected.length} of 4 selected</div>
        <label className="po-emotion-search"><span>⌕</span><input aria-label="Find an emotion" value={emotionQuery} onChange={event => setEmotionQuery(event.target.value)} placeholder="Find an emotion" /></label>
        <div className="po-emotion-grid">{emotionCatalog.filter(emotion => emotion.label.toLowerCase().includes(emotionQuery.trim().toLowerCase())).map(emotion => { const active = selected.includes(emotion.id); return <button key={emotion.id} aria-pressed={active} disabled={!active && selected.length >= 4} onClick={() => setSelected(current => active ? current.filter(id => id !== emotion.id) : [...current, emotion.id])}><span>{emotionIcons[emotion.id] || '○'}</span>{emotion.label}{active && <b>✓</b>}</button>; })}</div>
        <button className="po-primary po-sticky-action" disabled={!selected.length} onClick={() => { createDraft({ title: 'My personal Pause', emotionIds: selected, source: 'custom', minutes: 10 }); go('results'); }}>Continue with {selected.length} {selected.length === 1 ? 'emotion' : 'emotions'}</button>
      </section>}

      {screen === 'results' && draft && plan && <section><PageIntro eyebrow="YOUR PAUSE" title="Here’s what may need attention" copy="Based on the emotions you selected, these energy centres will shape your sound." />
        <div className="po-stack">{plan.blocks.map(block => <button className="po-card po-result-card" key={block.chakra} onClick={() => { setChakra(block.chakra); setChakraReturn('results'); go('chakra-detail'); }}><ChakraGlyph chakra={block.chakra} /><span><h2>{chakraDetails[block.chakra].name}</h2><small>{block.emotionIds.map(id => emotionCatalog.find(e => e.id === id)?.label).join(' · ')}</small><p>{reasonForChakra(block.chakra, block.emotionIds)}</p></span><b>{block.frequencyHz} Hz</b></button>)}</div>
        <button className="po-text-action po-centered" onClick={() => go('chakras')}>Understand all 7 chakras</button>
        <button className="po-primary po-block" onClick={() => go('setup')}>Create my Pause</button>
      </section>}

      {screen === 'chakras' && <section><PageIntro title="The 7 chakras" copy="A simple guide to the energy centres used in your Pause." />
        <div className="po-chakra-list">{[...chakraOrder].reverse().map(item => <button key={item} onClick={() => { setChakra(item); setChakraReturn('chakras'); go('chakra-detail'); }}><ChakraGlyph chakra={item} compact /><span><strong>{chakraDetails[item].shortName}</strong><small>{chakraDetails[item].theme.split(' · ')[0]}</small></span><b>{frequencies[item]} Hz</b><i>›</i></button>)}</div>
        <p className="po-disclaimer">ⓘ These associations come from traditional sound-healing practices and are not medical diagnoses.</p>
      </section>}

      {screen === 'chakra-detail' && <section className="po-chakra-detail"><ChakraGlyph chakra={chakra} /><PageIntro eyebrow="CHAKRA GUIDE" title={chakraDetails[chakra].name} copy={chakraDetails[chakra].theme} /><span className="po-frequency-pill" style={{ background: chakraDetails[chakra].color }}>{frequencies[chakra]} Hz</span>
        <div className="po-stack"><InfoCard icon="♧" title="What it represents" copy={chakraDetails[chakra].represents} /><InfoCard icon="◎" title="When it may feel unsettled" copy={chakraDetails[chakra].unsettled} /><InfoCard icon="≈" title="How your Pause supports it" copy={chakraDetails[chakra].support} /></div>
      </section>}

      {screen === 'setup' && draft && plan && <section><PageIntro eyebrow="CREATE YOUR PAUSE" title="Shape your sound" copy="Choose how you’d like this Pause to feel." />
        <SetupControls draft={draft} setDraft={setDraft} />
        <div className="po-session-summary"><strong>{plan.blocks.length} frequencies · {plan.totalSeconds / 60} minutes</strong><div>{plan.blocks.map(block => <span key={block.chakra}>{block.frequencyHz} Hz</span>)}</div></div>
        <button className="po-primary po-block" onClick={() => go('review')}>Review my Pause</button>
      </section>}

      {screen === 'review' && draft && plan && <section className="po-review"><PageIntro eyebrow="YOUR PAUSE" title="Your Pause is ready" copy="Check your sound before you begin." />
        <div className="po-card po-frequency-journey"><h2>Your frequency journey</h2>{plan.blocks.map((block, index) => <div key={block.chakra}><span>{index + 1}</span><ChakraGlyph chakra={block.chakra} compact /><strong>{chakraDetails[block.chakra].name}<small>{block.frequencyHz} Hz · {block.durationSeconds / 60} minutes</small></strong></div>)}</div>
        <div className="po-card po-review-settings"><p><span>☂</span><strong>Sound<small>{soundOptions.find(item => item.id === draft.sound)?.label}</small></strong><button onClick={() => go('setup')}>Edit</button></p><p><span>≈</span><strong>Undertone<small>{draft.preset} · {toneLevelDb[draft.preset]} dB</small></strong><button onClick={() => go('setup')}>Edit</button></p><p><span>◷</span><strong>Total time<small>{plan.totalSeconds / 60} minutes</small></strong><button onClick={() => go('setup')}>Edit</button></p></div>
        <p className="po-centered-note">Frequencies will play one after another.</p><button className="po-primary po-block" onClick={() => void beginSession()}>Start my Pause</button>
      </section>}

      {screen === 'player' && draft && playerPlan && <PlayerScreen
        draft={draft} plan={playerPlan} elapsed={elapsed} blockIndex={blockIndex} playing={playing} error={playerError} whyOpen={whyOpen}
        setWhyOpen={setWhyOpen}
        onToggle={() => void (async () => { if (playing) await player.current?.pause(); else await player.current?.play(); setPlaying(!playing); })()}
        onSkip={() => player.current?.skip()}
        onExit={() => void finishPlayback()}
        onSound={sound => void (async () => { try { await player.current?.switchSound(sound); setDraft(current => current ? { ...current, sound } : current); } catch (error) { setPlayerError(error instanceof Error ? error.message : 'This sound is unavailable.'); } })()}
        onPreset={preset => { player.current?.setPreset(preset); setDraft(current => current ? { ...current, preset } : current); }}
      />}

      {screen === 'feedback' && <section className="po-feedback"><ResonanceMark /><PageIntro eyebrow="PAUSE COMPLETE" title="How do you feel now?" copy="Take a moment. There is no right answer." />
        <div className="po-feeling-row">{([['better', 'Better', '☺'], ['same', 'Same', '―'], ['not-better', 'Not better', '⌢']] as const).map(([value, label, icon]) => <button key={value} aria-pressed={feeling === value} onClick={() => setFeeling(value)}><span>{icon}</span>{label}</button>)}</div>
        <label className="po-reflection"><span>Anything you want to remember?</span><textarea value={reflection} onChange={event => setReflection(event.target.value)} placeholder="A thought, feeling or small shift…" /></label>
        <button className="po-primary po-block" onClick={() => void saveFeedback(false)}>Save reflection</button><button className="po-text-action po-centered" onClick={() => void saveFeedback(true)}>Skip and return home</button>
      </section>}

      {screen === 'moments' && <section><div className="po-moments-symbol" aria-hidden="true"><svg viewBox="0 0 64 54" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M32 26c-8-2-12-7-12-14 7 0 11 4 12 10 1-6 5-10 12-10 0 7-4 12-12 14Z" /><path d="M32 26c-5-6-5-13 0-20 5 7 5 14 0 20Z" /><path d="M13 35c8 4 30 4 38 0M17 42c8 4 22 4 30 0M22 49c6 2 14 2 20 0" /></svg></div><PageIntro title="For the moments in your life" copy="We’re here for before, during and after what matters." />
        <div className="po-moment-categories">{(Object.keys(momentCategories) as MomentCategory[]).map((key, index) => { const item = momentCategories[key]; return <button key={key} className={`tone-${index}`} onClick={() => { setCategory(key); go('moment-list'); }}><span>{item.icon}</span><strong>{item.title}<small>{item.subtitle}</small></strong><i>›</i></button>; })}</div>
        <div className="po-section-divider"><strong>Explore specific moments</strong><p>Choose what is happening and begin a ready-made Pause.</p></div>
      </section>}

      {screen === 'moment-list' && <section><PageIntro eyebrow={momentCategories[category].title.toUpperCase()} title={momentCategories[category].prompt} copy="Choose the moment that feels closest to what’s happening." />
        <div className="po-moment-grid">{moments.filter(item => item.category === category).map((item, index) => <button key={item.id} onClick={() => openMoment(item)} style={{ '--moment-tone': `${index % 6}` } as React.CSSProperties}><span>{item.icon}</span><strong>{item.title}<small>{item.subtitle}</small></strong><i>›</i></button>)}</div>
        <p className="po-disclaimer">Your selection opens a ready-made Pause. You can change the sound and frequency strength while listening.</p>
      </section>}

      {screen === 'about-story' && <AboutStory go={go} />}
      {screen === 'about-mark' && <AboutMark go={go} />}
      {screen === 'about-experience' && <AboutExperience go={go} />}

      {screen === 'profile' && <section><PageIntro title="You" />
        <div className="po-profile-card"><span>{profileName.split(' ').map(item => item[0]).join('').slice(0, 2).toUpperCase()}</span><div>{profileEditing ? <><input value={profileName} onChange={event => setProfileName(event.target.value)} aria-label="Name" /><input value={profileEmail} onChange={event => setProfileEmail(event.target.value)} aria-label="Email" /></> : <><h2>{profileName}</h2><p>{profileEmail}</p></>}<button onClick={() => setProfileEditing(current => !current)}>{profileEditing ? 'Save profile' : 'Edit profile'}</button></div></div>
        <h2 className="po-section-title">Your Pause</h2><div className="po-stats"><button onClick={() => go('pause-history')}><strong>{storage.sessions.length}</strong><span>Pauses</span></button><div><strong>{storage.sessions.reduce((sum, item) => sum + item.durationMinutes, 0)}</strong><span>minutes</span></div><button onClick={() => go('reflection-history')}><strong>{storage.sessions.filter(item => item.reflection).length}</strong><span>reflections</span></button></div>
        <h2 className="po-section-title">Your Practice</h2><div className="po-settings-list"><button onClick={() => go(enrollment ? 'practice-dashboard' : 'practice')}><span>✦</span><strong>{activeIssue?.title || 'Start a 14-day Practice'}<small>{enrollment ? `${enrollment.completions.length} of 14 days · ${practiceStreak(enrollment)} day streak` : 'Choose one capability to build'}</small></strong><i>›</i></button></div>
        <h2 className="po-section-title">Preferences</h2><div className="po-settings-list"><button onClick={() => go('sound-preferences')}><span>≈</span><strong>Sound preferences<small>{soundOptions.find(item => item.id === storage.preferences.sound)?.label} · {storage.preferences.preset} undertone</small></strong><i>›</i></button><label><span>◷</span><strong>Session reminders<small>{storage.preferences.reminderEnabled ? `Daily at ${storage.preferences.reminderTime}` : 'Off'}</small></strong><input type="checkbox" checked={storage.preferences.reminderEnabled} onChange={event => setPreference({ reminderEnabled: event.target.checked })} /></label>{storage.preferences.reminderEnabled && <label className="po-reminder-time"><span>◴</span><strong>Reminder time<small>Saved on this device</small></strong><input type="time" aria-label="Reminder time" value={storage.preferences.reminderTime} onChange={event => setPreference({ reminderTime: event.target.value })} /></label>}<button onClick={() => go('privacy')}><span>◇</span><strong>Privacy & saved data</strong><i>›</i></button></div>
        <h2 className="po-section-title">Learn more</h2><div className="po-settings-list"><button onClick={() => go('about-story')}><span>ⓘ</span><strong>About Inner Pause</strong><i>›</i></button><button onClick={() => { setChakra('root'); go('chakras'); }}><span>❋</span><strong>The 7 chakras</strong><i>›</i></button><a href="mailto:support@theinnerpause.com"><span>?</span><strong>Help & support</strong><i>›</i></a></div>
      </section>}

      {screen === 'sound-preferences' && <section><PageIntro title="Sound preferences" copy="Choose the defaults used when you create a new personal Pause. You can still change them before or during a session." />
        <div className="po-setup-controls"><fieldset><legend>Default sound experience</legend><div className="po-sound-options">{soundOptions.map(item => <button type="button" key={item.id} aria-pressed={storage.preferences.sound === item.id} onClick={() => setPreference({ sound: item.id })}><span>{item.icon}</span>{item.label}</button>)}</div></fieldset>
          <fieldset><legend>Default undertone strength</legend><div className="po-segments">{(['soft', 'balanced', 'clear'] as const).map(value => <button type="button" key={value} aria-pressed={storage.preferences.preset === value} onClick={() => setPreference({ preset: value })}>{value}<small>{toneLevelDb[value]} dB</small></button>)}</div><p>Balanced is the recommended starting point.</p></fieldset></div>
        <div className="po-privacy-note"><span>✓</span><div><strong>Saved automatically</strong><p>These defaults are stored only on this device in the local test version.</p></div></div>
      </section>}

      {screen === 'pause-history' && <section><PageIntro title="Your Pause history" copy="The sessions you have completed on this device." /><div className="po-stack">{storage.sessions.length ? storage.sessions.map(item => <article className="po-card po-history-card" key={item.id}><time>{new Date(item.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time><h2>{item.title}</h2><p>{item.frequencies.join(' Hz · ')} Hz · {item.durationMinutes} min · {item.sound}</p></article>) : <EmptyState title="No completed Pauses yet" copy="Your completed sessions will appear here." />}</div></section>}
      {screen === 'reflection-history' && <section><PageIntro title="Your reflections" copy="Small notes saved after a Pause." /><div className="po-stack">{storage.sessions.filter(item => item.reflection).length ? storage.sessions.filter(item => item.reflection).map(item => <article className="po-card po-history-card" key={item.id}><time>{new Date(item.completedAt).toLocaleDateString('en-IN')}</time><h2>{item.title}</h2><p>{item.reflection}</p></article>) : <EmptyState title="No reflections yet" copy="A reflection can be saved after any Pause." />}</div></section>}

      {screen === 'privacy' && <section><PageIntro title="Privacy & saved data" copy="Control what this local test version keeps on your device." /><div className="po-settings-list"><button onClick={() => go('journal-history')}><span>▤</span><strong>Saved journal entries<small>{storage.journals.length} entries</small></strong><i>›</i></button><button onClick={() => go('pause-history')}><span>Ⅱ</span><strong>Pause history<small>{storage.sessions.length} sessions</small></strong><i>›</i></button><button onClick={() => go(enrollment ? 'practice-progress' : 'practice')}><span>✦</span><strong>Practice data<small>{practiceState.enrollments.length} {practiceState.enrollments.length === 1 ? 'Practice' : 'Practices'} saved</small></strong><i>›</i></button><button onClick={() => go('terms')}><span>ⓘ</span><strong>Privacy Policy & Terms</strong><i>›</i></button></div><button className="po-danger" onClick={() => { if (window.confirm('Delete all locally saved Inner Pause data?')) { clearPhaseOneState(); clearPracticeState(); setStorage(readPhaseOneState()); setPracticeState(readPracticeState()); } }}>Delete all saved data</button></section>}
      {screen === 'terms' && <LegalCopy />}
    </main>
    {showNav && <Nav screen={screen} go={go} />}
  </div>;
}

function HomeScreen({ onQuick, go }: { onQuick: (item: (typeof quickPauses)[number]) => void; go: (screen: Screen) => void }) {
  return <section><header className="po-home-header"><div><span className="po-eyebrow">HOME</span><h1>What do you need<br />right now?</h1><p>Choose a Pause to shift how you feel.</p></div><button onClick={() => go('profile')} aria-label="Open profile"><AppIcon name="You" /></button></header>
    <div className="po-quick-grid">{quickPauses.map((item, index) => <button key={item.id} onClick={() => onQuick(item)} className={`quick-${index}`}><QuickPauseIcon id={item.id} /><strong>{item.label}<small>{item.copy}</small></strong></button>)}</div>
    <div className="po-home-feature po-journal-feature"><span>•••</span><strong>What’s on your mind?<small>Your space to reflect. Write what’s on your mind and save it in your personal journal.</small><span className="po-journal-shortcuts"><button onClick={() => go('journal')}>✎ Write</button><button onClick={() => go('journal')}>♩ Speak</button></span></strong></div>
    <button className="po-emotion-link" onClick={() => go('emotions')}><span>≈</span><strong>Choose your emotions<small>Select how you feel. We’ll identify the related chakras and create your sound session.</small></strong><b>Begin →</b></button>
    <button className="po-moments-link" onClick={() => go('moments')}><span>▣</span><strong>For the moments in your life<small>Before something important · during a hard moment · after it passes</small></strong><b>Explore →</b></button>
  </section>;
}

function QuickPauseIcon({ id }: { id: string }) {
  const art: Record<string, React.ReactNode> = {
    sleep: <><path d="M15.7 4.4a7.6 7.6 0 1 0 3.9 13.9 6.6 6.6 0 0 1-3.9-13.9Z" /><path d="m18.7 4.2.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4.4-1.1Z" /></>,
    reset: <><path d="M19.2 8.1A8 8 0 0 0 6 5.7L4.4 7.3" /><path d="M4.3 3.8v3.8h3.8" /><path d="M4.8 15.9A8 8 0 0 0 18 18.3l1.6-1.6" /><path d="M19.7 20.2v-3.8h-3.8" /></>,
    focus: <><circle cx="12" cy="12" r="7.3" /><circle cx="12" cy="12" r="3.1" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r=".7" fill="currentColor" stroke="none" /></>,
    confidence: <><path d="M12 3.2 19 6v5.1c0 4.5-2.6 7.8-7 9.7-4.4-1.9-7-5.2-7-9.7V6l7-2.8Z" /><path d="m8.7 12 2.1 2.1 4.6-4.7" /></>,
    calm: <><path d="M3.5 8.3c2.1 0 2.1-1.5 4.2-1.5s2.1 1.5 4.2 1.5S14 6.8 16.1 6.8s2.1 1.5 4.2 1.5" /><path d="M3.5 12c2.1 0 2.1-1.5 4.2-1.5s2.1 1.5 4.2 1.5 2.1-1.5 4.2-1.5 2.1 1.5 4.2 1.5" /><path d="M3.5 15.7c2.1 0 2.1-1.5 4.2-1.5s2.1 1.5 4.2 1.5 2.1-1.5 4.2-1.5 2.1 1.5 4.2 1.5" /></>,
    release: <><path d="M19.8 4.2C11.7 4.4 6.2 7.7 5.6 13.3c-.4 3.7 2.5 6.3 5.8 5.2 5-1.7 7.4-7.1 8.4-14.3Z" /><path d="M4.2 20c2.8-4.6 6.4-7.9 11.1-10.3" /></>,
  };
  return <span className={`po-quick-icon po-quick-icon-${id}`} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{art[id]}</svg></span>;
}

function SetupControls({ draft, setDraft }: { draft: DraftSession; setDraft: React.Dispatch<React.SetStateAction<DraftSession | null>> }) {
  return <div className="po-setup-controls"><fieldset><legend>Sound experience</legend><div className="po-sound-options">{soundOptions.map(item => <button type="button" key={item.id} aria-pressed={draft.sound === item.id} onClick={() => setDraft(current => current ? { ...current, sound: item.id } : current)}><span>{item.icon}</span>{item.label}</button>)}</div></fieldset>
    <fieldset><legend>Time per frequency</legend><div className="po-segments">{([5, 10, 15] as const).map(value => <button type="button" key={value} aria-pressed={draft.minutes === value} onClick={() => setDraft(current => current ? { ...current, minutes: value } : current)}>{value} min</button>)}</div></fieldset>
    <fieldset><legend>Undertone strength</legend><div className="po-segments">{(['soft', 'balanced', 'clear'] as const).map(value => <button type="button" key={value} aria-pressed={draft.preset === value} onClick={() => setDraft(current => current ? { ...current, preset: value } : current)}>{value}<small>{toneLevelDb[value]} dB</small></button>)}</div><p>You can change this while listening.</p></fieldset>
  </div>;
}

const breathingMessages = [
  'Nothing needs to be solved right now.',
  'Let your shoulders soften.',
  'You can meet this moment gently.',
  'There is room around every thought.',
  'Stay with the sound. Return to yourself.',
];

function ContinuousBreathingGuide({ elapsed, playing }: { elapsed: number; playing: boolean }) {
  const minutePosition = elapsed % 60;
  const showingMessage = minutePosition >= 50;
  const breathPosition = minutePosition % 10;
  const inhale = breathPosition < 4;
  const secondsRemaining = inhale ? 4 - breathPosition : 10 - breathPosition;
  const message = breathingMessages[Math.floor(elapsed / 60) % breathingMessages.length];
  return <section className={`po-breath-guide ${playing ? 'is-playing' : 'is-paused'} ${inhale ? 'is-inhale' : 'is-exhale'} ${showingMessage ? 'is-message' : ''}`} aria-label="Guided breathing">
    <div className="po-breath-guide-head"><span>GUIDED BREATHING</span><small>{showingMessage ? 'A quiet reminder' : '4 seconds in · 6 seconds out'}</small></div>
    {showingMessage ? <div className="po-breath-message"><span>✦</span><p>{message}</p></div> : <div className="po-breath-cycle"><div className="po-breath-orb" aria-hidden="true"><i /><i /><i /></div><div><strong aria-live="polite">{playing ? inhale ? 'Breathe in' : 'Breathe out' : 'Breathing paused'}</strong><span aria-hidden="true">{playing ? secondsRemaining : '—'}</span><small>Join whenever you’re ready</small></div></div>}
  </section>;
}

function PlayerScreen({ draft, plan, elapsed, blockIndex, playing, error, whyOpen, setWhyOpen, onToggle, onSkip, onExit, onSound, onPreset }: {
  draft: DraftSession; plan: SessionPlan; elapsed: number; blockIndex: number; playing: boolean; error: string; whyOpen: boolean; setWhyOpen: (value: boolean) => void;
  onToggle: () => void; onSkip: () => void; onExit: () => void; onSound: (sound: PhaseOneSound) => void; onPreset: (preset: TonePreset) => void;
}) {
  const safeIndex = Math.min(blockIndex, plan.blocks.length - 1);
  const block = plan.blocks[safeIndex];
  const total = plan.totalSeconds;
  const progress = total ? Math.min(100, elapsed / total * 100) : 0;
  return <section className="po-player"><header className="po-player-header"><button onClick={onExit} aria-label="Go back">‹</button><div><h1>Your healing Pause</h1><p>{plan.blocks.length} {plan.blocks.length === 1 ? 'chakra' : 'chakras'} · {Math.round(total / 60)} minutes</p></div><span aria-hidden="true">⚙</span></header>
    <div className="po-player-orbit"><ResonanceMark /><button onClick={onToggle} aria-label={playing ? 'Pause playback' : 'Play playback'}>{playing ? 'Ⅱ' : '▶'}</button></div>
    <div className="po-player-title"><span className="po-eyebrow">{draft.source === 'custom' ? 'PERSONAL SOUND SESSION' : draft.title}</span><p>Let each sound meet you where you are. Nothing needs to be forced.</p></div>
    <ContinuousBreathingGuide elapsed={elapsed} playing={playing} />
    <div className="po-player-time">{formatTime(elapsed)} · {formatTime(total)}</div>
    <div className="po-player-progress"><div><span style={{ width: `${progress}%` }} /></div><p><span>{chakraDetails[block.chakra].name}</span><span>{block.frequencyHz} Hz</span></p></div>
    {error && <p className="po-error">{error}</p>}
    <div className="po-player-controls"><button onClick={onSkip}>Skip frequency</button><button onClick={onExit}>End Pause</button></div>
    <div className="po-player-settings"><div><span>◎</span><small>Frequency</small><strong>{block.frequencyHz} Hz</strong></div><InnerPauseSelect label="Sound" icon="☂" value={draft.sound} onChange={onSound} options={soundOptions.map(item => ({ value: item.id, label: item.label, note: item.headphoneOnly ? 'Headphones' : undefined }))} /><InnerPauseSelect label="Undertone" icon="≈" value={draft.preset} onChange={onPreset} options={[{ value: 'soft', label: 'Soft' }, { value: 'balanced', label: 'Balanced' }, { value: 'clear', label: 'Clear' }]} /></div>
    <div className="po-session-chakras"><strong>Chakras in this session</strong><div>{plan.blocks.map(item => <span key={item.chakra} style={{ '--chakra': chakraDetails[item.chakra].color } as React.CSSProperties}>{chakraDetails[item.chakra].shortName} · {item.frequencyHz} Hz</span>)}</div></div>
    <button className="po-why-toggle" onClick={() => setWhyOpen(!whyOpen)} aria-expanded={whyOpen}><strong>Why this Pause?</strong><span>{whyOpen ? '−' : '+'}</span></button>
    {whyOpen && <div className="po-why-panel"><p>This Pause moves through the energy centres associated with what you selected.</p>{plan.blocks.map(item => <div key={item.chakra}><ChakraGlyph chakra={item.chakra} compact /><span><strong>{chakraDetails[item.chakra].name} · {item.frequencyHz} Hz</strong><p>{reasonForChakra(item.chakra, item.emotionIds)}</p></span></div>)}<small>Chakra and frequency associations are part of traditional sound-healing practice and are not medical treatment.</small></div>}
  </section>;
}

function InfoCard({ icon, title, copy }: { icon: string; title: string; copy: string }) {
  return <article className="po-card po-info-card"><span>{icon}</span><div><h2>{title}</h2><p>{copy}</p></div></article>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) { return <div className="po-empty"><ResonanceMark small /><h2>{title}</h2><p>{copy}</p></div>; }

function AboutStory({ go }: { go: (screen: Screen) => void }) {
  return <section className="po-about"><ResonanceMark /><PageIntro title="When we pause, we return to harmony." /><div className="po-about-copy"><p>Life can feel noisy—thoughts, emotions, pressure and expectations pulling us away from ourselves.</p><p>Inner Pause creates a gentle space between the noise and our response. A place to stop, breathe and hear ourselves again.</p><p>It is not just an app. It is a practice, a return, a way home.</p></div><blockquote>Pause the noise. Return to you.</blockquote><button className="po-text-action po-centered" onClick={() => go('about-mark')}>Discover the mark →</button></section>;
}

function AboutMark({ go }: { go: (screen: Screen) => void }) {
  return <section className="po-about po-about-mark"><ResonanceMark /><span className="po-wordmark">INNER PAUSE</span><PageIntro title="A symbol of pause and resonance" /><InfoCard icon="◌" title="Layers of sound" copy="The overlapping waves represent the many layers within us—thoughts, emotions and energy." /><InfoCard icon="Ⅱ" title="The pause" copy="Two simple bars invite us to stop, breathe and create space." /><InfoCard icon="◎" title="Center stillness" copy="At the centre of the noise is quiet clarity." /><button className="po-text-action po-centered" onClick={() => go('about-experience')}>See the experience →</button></section>;
}

function AboutExperience({ go }: { go: (screen: Screen) => void }) {
  const steps = [['scribble', 'Life gets noisy'], ['pause', 'You pause'], ['glow', 'You return to yourself'], ['flow', 'You move forward with clarity']];
  return <section className="po-about-experience"><PageIntro eyebrow="ABOUT · THE EXPERIENCE" title="From noise to clarity" copy="One small pause can change how you meet the next moment." /><div className="po-experience-steps">{steps.map(([kind, label], index) => <div key={kind}><span className={`experience-${kind}`}>{kind === 'pause' ? 'Ⅱ' : kind === 'glow' ? '◎' : kind === 'flow' ? '≈' : '⌁'}</span><strong>{index + 1} · {label}</strong></div>)}</div><div className="po-essence"><h2>The essence</h2><p>Sound meets stillness.<br />Pause creates harmony.<br />You come home to you.</p></div><button className="po-secondary po-block" onClick={() => go('home')}>Return home</button></section>;
}

function LegalCopy() {
  return <section className="po-legal"><PageIntro title="Privacy Policy & Terms" copy="Draft for the local Phase One test." /><h2>Privacy</h2><p>Inner Pause stores journal entries, session choices and reflections locally on this device during testing. Your journal is not analysed to infer emotions. We do not sell personal data.</p><p>You can delete saved entries individually or remove all locally stored data from Privacy & saved data.</p><h2>Wellness information</h2><p>Inner Pause provides reflective and relaxation experiences. Chakra and frequency associations are drawn from traditional wellness practices. The app does not diagnose, treat, cure or prevent any medical or mental-health condition.</p><p>If you feel unsafe or need urgent support, contact local emergency services or a qualified professional. Do not rely on the app for urgent care.</p><h2>Terms of use</h2><p>Use the app in a safe environment and at a comfortable listening level. Do not use audio sessions while driving or operating machinery. You remain responsible for your choices and wellbeing.</p><h2>Contact</h2><p>Questions may be sent to support@theinnerpause.com. These terms will be reviewed before public release.</p></section>;
}

function completePracticeDay(state: PracticeState, enrollmentId: string, day: number, reflection?: string): PracticeState {
  return {
    ...state,
    enrollments: state.enrollments.map(enrollment => {
      if (enrollment.id !== enrollmentId) return enrollment;
      const completions = [...enrollment.completions.filter(item => item.day !== day), { day, completedAt: new Date().toISOString(), reflection }]
        .sort((a, b) => a.day - b.day);
      return { ...enrollment, completions, status: completions.length >= 14 ? 'completed' as const : 'active' as const };
    }),
  };
}
