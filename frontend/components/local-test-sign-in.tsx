'use client';
import { useState, useSyncExternalStore } from 'react';
import { InnerPauseApiClient } from '@/lib/api/client';
import { clearFrontendSession, setFrontendSession } from '@/lib/auth/session';
import { localTestAllowed, sharedTestAllowed } from '@/lib/auth/local-test';
import { readFrontendConfig } from '@/lib/config/env';
import { LiveShell } from '@/components/live-shell';

const subscribeToHydration = () => () => {};

export function LocalTestSignIn() {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const shared = process.env.NEXT_PUBLIC_SHARED_TEST_AUTH === 'true';
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function enter() {
    setBusy(true); setError('');
    try {
      const { apiBaseUrl } = readFrontendConfig();
      if (!localTestAllowed(process.env.NEXT_PUBLIC_LOCAL_TEST_AUTH, location.hostname, apiBaseUrl) && !sharedTestAllowed(process.env.NEXT_PUBLIC_SHARED_TEST_AUTH, location.origin, apiBaseUrl)) throw new Error('Test sign-in requires the local app or the protected preview link.');
      const token = shared ? 'shared-preview' : 'test-user-a';
      const api = new InnerPauseApiClient({ baseUrl: apiBaseUrl, getAccessToken: () => token });
      const profile = await api.me();
      clearFrontendSession();
      setFrontendSession(token, profile, { idToken: token, expiresAt: Date.now() + 3600000 });
      location.assign('/revised');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to start the local test session.'); setBusy(false); }
  }
  return <LiveShell hideNav><section className="live-card local-sign-in">
    <div className="live-symbol" aria-hidden="true">∿</div>
    <p className="live-eyebrow">INNER PAUSE · {shared ? 'PRIVATE' : 'LOCAL'} PREVIEW</p>
    <h1>A little space.<br />Just for you.</h1>
    <p>Explore your feelings, choose your sound, and take a gentle pause.</p>
    <div className="live-note">{shared ? 'Welcome, Karsh. Explore the revised flow and share your feedback after each session. Your test sessions are saved separately from the live app.' : 'Your test session stays in the local test database. No email or password needed.'}</div>
    {error && <p role="alert">{error}</p>}
    <button className="live-primary" disabled={!hydrated || busy || (!shared && process.env.NEXT_PUBLIC_LOCAL_TEST_AUTH !== 'true')} onClick={() => void enter()}>{busy ? 'Opening your pause…' : shared ? 'Start testing' : 'Enter local test app'}</button>
  </section></LiveShell>;
}
