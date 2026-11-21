import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('innerpause-phase-one-v1'));
  await page.reload();
});

test('custom emotion journey reaches audio, changes sound, completes and saves feedback', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Life feels like a lot right now.' })).toBeVisible();
  await page.getByRole('button', { name: 'Enter Inner Pause' }).click();
  await expect(page.getByRole('heading', { name: /What do you need/ })).toBeVisible();
  await page.getByRole('button', { name: /Choose your emotions/ }).click();
  await page.getByRole('button', { name: 'Anxiety' }).click();
  await page.getByRole('button', { name: 'Sadness' }).click();
  await page.getByRole('button', { name: 'Continue with 2 emotions' }).click();
  await expect(page.getByRole('heading', { name: 'Here’s what may need attention' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Root chakra/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Heart chakra/ })).toBeVisible();
  await page.getByRole('button', { name: /Root chakra/ }).click();
  await expect(page.getByRole('heading', { name: 'Root chakra' })).toBeVisible();
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.getByRole('button', { name: 'Create my Pause' }).click();
  await expect(page.getByRole('heading', { name: 'Shape your sound' })).toBeVisible();
  await page.getByRole('button', { name: /Ocean waves/ }).click();
  await page.getByRole('button', { name: '5 min', exact: true }).click();
  await page.getByRole('button', { name: /^clear/ }).click();
  await page.getByRole('button', { name: 'Review my Pause' }).click();
  await expect(page.getByRole('heading', { name: 'Your Pause is ready' })).toBeVisible();
  await page.getByRole('button', { name: 'Start my Pause' }).click();
  await expect(page.getByRole('region', { name: 'Guided breathing' })).toBeVisible();
  await expect(page.getByText(/Breathe in|Breathe out/)).toBeVisible();
  await expect(page.locator('.po-player-progress').getByText('Root chakra', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Sound')).toContainText('Ocean waves');
  await page.getByLabel('Sound').click();
  await page.getByRole('option', { name: 'Gentle wind' }).click();
  await expect(page.getByLabel('Sound')).toContainText('Gentle wind');
  await page.getByLabel('Sound').click();
  await page.getByRole('option', { name: /Mindspace/ }).click();
  await expect(page.getByLabel('Sound')).toContainText('Mindspace');
  await page.getByRole('button', { name: 'Skip frequency' }).click();
  await page.getByRole('button', { name: 'Skip frequency' }).click();
  await expect(page.getByRole('heading', { name: 'How do you feel now?' })).toBeVisible();
  await page.getByRole('button', { name: /Better/ }).click();
  await page.getByLabel('Anything you want to remember?').fill('I feel a little more settled.');
  await page.getByRole('button', { name: 'Save reflection' }).click();
  await expect(page.getByRole('heading', { name: /What do you need/ })).toBeVisible();
  await page.getByRole('button', { name: /Profile/ }).last().click();
  await expect(page.getByRole('button', { name: 'Pauses' }).getByText('1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Sound preferences/ }).click();
  await page.getByRole('button', { name: /Gentle wind/ }).click();
  await page.getByRole('button', { name: /^clear/ }).click();
  await page.getByRole('button', { name: 'Go back' }).click();
  await expect(page.getByRole('button', { name: /Sound preferences/ })).toContainText('Gentle wind');
  await expect(page.getByRole('button', { name: /Sound preferences/ })).toContainText('clear undertone');
});

test('journal saves without analysis and appears in journal history', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter Inner Pause' }).click();
  await page.getByRole('button', { name: /Write/ }).click();
  await expect(page.getByText(/personal journal/)).toBeVisible();
  await page.getByLabel('Journal entry').fill('Today felt heavy, but I made it through the day.');
  await page.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.getByText('Saved privately to your journal.')).toBeVisible();
  await page.getByRole('button', { name: /View saved journal entries/ }).click();
  await expect(page.getByText('Today felt heavy, but I made it through the day.')).toBeVisible();
});

test('all thirty-six Moments are reachable through the three categories', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter Inner Pause' }).click();
  await page.getByRole('button', { name: /For the moments in your life/ }).click();
  for (const category of ['Coming up', 'Happening now', 'Just happened']) {
    await page.getByRole('button', { name: new RegExp(category) }).click();
    await expect(page.locator('.po-moment-grid button')).toHaveCount(12);
    await page.getByRole('button', { name: 'Go back' }).click();
  }
  await page.getByRole('button', { name: /Coming up/ }).click();
  await page.getByRole('button', { name: /A big event/ }).click();
  await expect(page.locator('.po-player-progress').getByText('Root chakra', { exact: true })).toBeVisible();
  await expect(page.getByText('A big event', { exact: true })).toBeVisible();
});

test('mobile layout has no horizontal overflow on key screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Enter Inner Pause' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: /Choose your emotions/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Anxiety' }).click();
  await page.getByRole('button', { name: 'Continue with 1 emotion' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
