import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const secretFile = process.env.PREVIEW_SECRET_FILE;
if (!secretFile) throw new Error('Set PREVIEW_SECRET_FILE to the private preview credentials file.');
const { password } = JSON.parse(readFileSync(secretFile, 'utf8'));

test('public visitors cannot access protected audio or APIs', async ({ request }) => {
  for (const path of ['/api/v1/me', '/api/v1/revised/journeys', '/audio/revised/sounds/rain.m4a']) {
    expect((await request.get(path)).status()).toBe(401);
  }
});

test('password sign-in, all sound choices, all tones, session controls and persisted feedback', async ({ page, context, baseURL }) => {
  const requests: string[] = [];
  page.on('request', req => requests.push(req.url()));
  await page.goto('/');
  await page.getByLabel('Testing password').fill(password);
  await page.getByRole('button', { name: 'Open Inner Pause' }).click();
  await page.getByRole('button', { name: 'Start testing' }).click();
  await expect(page).toHaveURL(/\/revised$/);
  const sessionCookie = (await context.cookies()).find(cookie => cookie.name === 'innerpause_preview');
  expect(sessionCookie?.httpOnly).toBe(true);
  if (baseURL?.startsWith('https:')) expect(sessionCookie?.secure).toBe(true);
  expect((await page.request.get('/api/v1/admin/overview')).status()).toBe(403);
  const identity = await page.request.get('/api/v1/me', { headers: { authorization: 'Bearer test-admin' } });
  expect((await identity.json()).data.email).toBe('user-b@example.com');
  await page.getByRole('button', { name: 'Choose emotions directly' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Anxiety', exact: true }).click();
  await page.getByRole('button', { name: 'Sadness', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm 2 emotions' }).click();
  await page.getByRole('button', { name: 'Shape my session' }).click();
  await page.getByLabel('Session length').selectOption('quick');
  await page.getByRole('button', { name: 'Review session' }).click();
  await page.getByRole('button', { name: 'Begin session' }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.getByTestId('playback-time')).not.toHaveText('0 / 600 seconds');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const time = await page.getByTestId('playback-time').textContent();
  for (const sound of ['forest', 'rainforest', 'waves', 'gong', 'bell', 'piano', 'frequency-only']) {
    await page.getByLabel('Sound experience').selectOption(sound);
    await expect(page.getByLabel('Sound experience')).toBeEnabled({ timeout: 60000 });
    await expect(page.getByTestId('playback-time')).toHaveText(time!);
    await expect(page.getByTestId('current-frequency')).toHaveText('396 Hz');
    await expect(page.locator('.revised-journey [role="alert"]')).toHaveCount(0);
  }
  for (const preset of ['balanced', 'clear', 'soft']) await page.getByLabel('Tone strength').selectOption(preset);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Skip frequency' }).click();
  await expect(page.getByTestId('current-frequency')).toHaveText('639 Hz');
  await page.getByRole('button', { name: 'Skip frequency' }).click();
  const feedback = `Shared preview test ${Date.now()}`;
  await page.getByLabel('Feedback', { exact: true }).fill(feedback);
  await page.getByRole('button', { name: 'Save journey' }).click();
  await expect(page.getByRole('heading', { name: 'Journey saved' })).toBeVisible();
  await page.reload();
  expect((await (await page.request.get('/api/v1/revised/journeys')).json()).data.some((item: { feedback?: { reflection: string } }) => item.feedback?.reflection === feedback)).toBe(true);
  const tones = await page.evaluate(async () => {
    const audio = new AudioContext();
    const results = [];
    try {
      for (const hz of [396, 417, 528, 639, 741, 852, 963]) {
        const response = await fetch(`/audio/revised/tones/${hz}.wav`);
        if (!response.ok) throw new Error(`Tone ${hz} failed`);
        const decoded = await audio.decodeAudioData(await response.arrayBuffer());
        results.push({ hz, seconds: decoded.duration });
      }
    } finally { await audio.close(); }
    return results;
  });
  expect(tones).toHaveLength(7);
  expect(tones.every(tone => tone.seconds > 0)).toBe(true);
  expect(requests.filter(url => url.startsWith('http') && !url.startsWith(baseURL!))).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/shared-preview/mobile.png', fullPage: true });
  await page.getByLabel('Your reflection').fill('I am not anxious but I am sad and frustrated.');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Anxiety', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Sadness ✓', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Confirm 2 emotions' }).click();
  await page.getByRole('button', { name: 'Shape my session' }).click();
  await page.getByLabel('Sound experience').selectOption('frequency-only');
  await page.getByRole('button', { name: 'Review session' }).click();
  await page.getByRole('button', { name: 'Begin session' }).click();
  await expect(page.getByRole('button', { name: 'Exit session' })).toBeVisible({ timeout: 60000 });
  await page.getByRole('button', { name: 'Exit session' }).click();
  await page.getByRole('button', { name: 'Save journey' }).click();
  await expect(page.getByRole('heading', { name: 'Journey saved' })).toBeVisible();
});
