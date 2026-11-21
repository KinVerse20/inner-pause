'use client';

export interface PhaseOneJournal {
  id: string;
  text: string;
  createdAt: string;
}

export interface PhaseOneSessionRecord {
  id: string;
  title: string;
  emotionIds: string[];
  frequencies: number[];
  durationMinutes: number;
  sound: string;
  completedAt: string;
  feeling?: 'better' | 'same' | 'not-better';
  reflection?: string;
}

export interface PhaseOnePreferences {
  sound: 'rain' | 'forest' | 'waves' | 'wind' | 'binaural-focus' | 'bilateral-calm' | 'mindspace' | 'frequency-only';
  preset: 'soft' | 'balanced' | 'clear';
  reminderEnabled: boolean;
  reminderTime: string;
}

export interface PhaseOneState {
  journals: PhaseOneJournal[];
  sessions: PhaseOneSessionRecord[];
  preferences: PhaseOnePreferences;
}

const KEY = 'innerpause-phase-one-v1';
const defaults: PhaseOneState = {
  journals: [], sessions: [],
  preferences: { sound: 'rain', preset: 'balanced', reminderEnabled: false, reminderTime: '20:00' },
};

export function readPhaseOneState(): PhaseOneState {
  if (typeof window === 'undefined') return defaults;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}') as Partial<PhaseOneState>;
    return {
      journals: Array.isArray(parsed.journals) ? parsed.journals : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      preferences: { ...defaults.preferences, ...(parsed.preferences || {}) },
    };
  } catch { return defaults; }
}

export function writePhaseOneState(state: PhaseOneState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('innerpause-phase-one-change'));
}

export function makePhaseOneId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clearPhaseOneState() {
  writePhaseOneState(defaults);
}
