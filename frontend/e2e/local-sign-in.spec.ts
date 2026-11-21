import { expect, test } from '@playwright/test';

test('a fresh visitor can sign in locally without seeded browser credentials', async ({ page }) => {
  await page.goto('/local-test-sign-in');
  await expect(page.getByRole('button', { name: 'Enter local test app' })).toBeEnabled();
  await page.screenshot({ path: 'test-results/revised/sign-in-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Enter local test app' }).click();
  await expect(page).toHaveURL(/\/revised$/);
  await expect(page.getByRole('heading', { name: 'Your Inner Pause' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await page.screenshot({ path: 'test-results/revised/journey-desktop.png', fullPage: true });
  await page.reload();
  await expect(page.getByLabel('Your reflection')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/revised/journey-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
