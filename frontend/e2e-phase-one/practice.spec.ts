import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['notifications'], { origin: 'http://127.0.0.1:3011' });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('innerpause-practices-v1');
    localStorage.removeItem('innerpause-phase-one-v1');
  });
  await page.reload();
  await page.getByRole('button', { name: 'Enter Inner Pause' }).click();
});

test('starts a 14-day confidence Practice, checks in, completes sound and records progress', async ({ page }) => {
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What would you like to practise?' })).toBeVisible();
  await expect(page.locator('.po-practice-grid > button')).toHaveCount(5);
  await page.getByRole('button', { name: /Low confidence/ }).click();
  await expect(page.getByRole('heading', { name: 'Low confidence' })).toBeVisible();
  await page.getByLabel('Daily reminder time').fill('19:30');
  await page.getByRole('button', { name: 'Start my 14-day Practice' }).click();
  await expect(page.getByText('DAY 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Begin today’s Practice/ }).click();
  await page.getByLabel('Daily check-in').fill('I avoided sharing an idea yesterday.');
  await page.getByRole('button', { name: '4' }).click();
  await page.getByLabel('Today’s exercise response').fill('Persistence — I returned to a difficult task and completed it.');
  await page.getByRole('button', { name: /Continue to action and sound/ }).click();
  await expect(page.getByRole('heading', { name: 'Notice the doubt' })).toBeVisible();
  await expect(page.getByText(/Persistence/)).toBeVisible();
  await page.getByRole('button', { name: 'Start sound Practice' }).click();
  await expect(page.getByText('Low confidence · Day 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Skip frequency' }).click();
  await expect(page.getByRole('heading', { name: 'How do you feel now?' })).toBeVisible();
  await page.getByRole('button', { name: /Better/ }).click();
  await page.getByRole('button', { name: 'Save reflection' }).click();
  await expect(page.getByRole('heading', { name: 'You showed up.' })).toBeVisible();
  await expect(page.getByText('1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Return to my Practice' }).click();
  await expect(page.getByText('DAY 2', { exact: true })).toBeVisible();
});

test('Practice progress shows all fourteen days and mobile layout remains contained', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: /Anxiety/ }).click();
  await page.getByRole('button', { name: 'Start my 14-day Practice' }).click();
  await page.getByRole('button', { name: /See all 14 days/ }).click();
  await expect(page.locator('.po-practice-days > div')).toHaveCount(14);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
