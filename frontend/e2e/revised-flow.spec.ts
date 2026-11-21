import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('innerpause-aws-id-token', 'test-user-a');
    localStorage.setItem('innerpause-aws-access-token', 'test-user-a');
    localStorage.setItem('innerpause-aws-profile', JSON.stringify({ id: 'user-a', email: 'a@example.com' }));
  });
});
test('first service-worker installation preserves a reflection already being written', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/sw.js', async route => { await gate; await route.continue(); });
  await page.goto('/revised');
  const draft = 'I am sad and want to keep this reflection.';
  await page.getByLabel('Your reflection').fill(draft);
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  release();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect(page.getByLabel('Your reflection')).toHaveValue(draft);
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
  expect(navigations).toBe(0);
});
test('direct selection, real audio decode, switching, pause, skip and feedback', async ({ page }) => {
  await page.goto('/revised');
  await page.getByRole('button', { name: 'Choose emotions directly' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Anxiety', exact: true }).click();
  await page.getByRole('button', { name: 'Sadness', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm 2 emotions' }).click();
  await page.getByRole('button', { name: 'Shape my session' }).click();
  await page.getByLabel('Session length').selectOption('quick');
  await page.getByRole('button', { name: 'Review session' }).click();
  await expect(page.getByText('2 frequencies · 10 minutes total · rain')).toBeVisible();
  await page.getByRole('button', { name: 'Begin session' }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.getByTestId('playback-time')).not.toHaveText('0 / 600 seconds');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const time = await page.getByTestId('playback-time').textContent();
  for (const sound of ['forest', 'rainforest', 'waves', 'gong', 'bell', 'piano', 'frequency-only']) {
    await page.getByLabel('Sound experience').selectOption(sound);
    await expect(page.getByLabel('Sound experience')).toBeEnabled();
    await expect(page.getByTestId('playback-time')).toHaveText(time!);
    await expect(page.getByTestId('current-frequency')).toHaveText('396 Hz');
  }
  await page.getByLabel('Tone strength').selectOption('clear');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Skip frequency' }).click();
  await expect(page.getByTestId('current-frequency')).toHaveText('639 Hz');
  await page.getByRole('button', { name: 'Skip frequency' }).click();
  await page.getByLabel('Feedback', { exact: true }).fill('Browser test completed');
  await page.getByRole('button', { name: 'Save journey' }).click();
  await expect(page.getByRole('heading', { name: 'Journey saved' })).toBeVisible();
  await page.reload();
  const response = await page.request.get('http://localhost:4011/api/v1/revised/journeys', { headers: { authorization: 'Bearer test-user-a' } });
  expect((await response.json()).data.some((j: { feedback?: { reflection: string } }) => j.feedback?.reflection === 'Browser test completed')).toBe(true);
});
test('written input respects negation and users confirm suggestions', async ({ page }) => {
  const analysisRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/analysis/') || request.url().endsWith('/analyse')) analysisRequests.push(request.url()); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/revised');
  await page.getByLabel('Your reflection').fill('I am not anxious but I am sad and frustrated.');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Anxiety', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Sadness ✓', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Frustration ✓', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Confirm 2 emotions' }).click();
  await page.getByRole('button', { name: 'Shape my session' }).click();
  await page.getByLabel('Sound experience').selectOption('frequency-only');
  await page.getByRole('button', { name: 'Review session' }).click();
  await page.getByRole('button', { name: 'Begin session' }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Exit session' }).click();
  await page.getByLabel('Feedback', { exact: true }).fill('Early exit test');
  await page.getByRole('button', { name: 'Save journey' }).click();
  await expect(page.getByRole('heading', { name: 'Journey saved' })).toBeVisible();
  await expect(page.getByText(/20 minutes · exited/).first()).toBeVisible();
  expect(analysisRequests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
