import { test, expect } from '@playwright/test';

test('homepage renders the primary navigation and main content', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
});

test('designer discovery page renders a usable search surface', async ({ page }) => {
  const response = await page.goto('/discover');
  expect(response?.status()).toBe(200);
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.locator('form').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
});

test('unauthenticated client project route does not reveal project data', async ({ page }) => {
  const response = await page.goto('/client/projects/E2E-UNKNOWN-PROJECT');
  expect([401, 404, 200]).toContain(response?.status());
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
  await expect(page.locator('body')).not.toContainText('ORIGINAL BRIEF');
  await expect(page.locator('body')).not.toContainText('SHARED PROJECT LOG');
});

test('designer project workspace requires an authenticated designer session', async ({ page }) => {
  await page.goto('/studio/projects/E2E-UNKNOWN-PROJECT');
  await expect(page).toHaveURL(/\/studio(?:$|[?#])/);
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
});

test('mobile homepage has no document-level horizontal overflow', async ({ page }) => {
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 2);
});

test('configured designer profile leads to WhatsApp through the public contact route', async ({ page, request }) => {
  const profilePath = process.env.E2E_DESIGNER_PATH;
  test.skip(!profilePath, 'Set E2E_DESIGNER_PATH to a seeded public designer profile path.');
  const response = await page.goto(profilePath);
  expect(response?.status()).toBe(200);
  const contact = page.getByRole('link', { name: /via WhatsApp/ }).first();
  await expect(contact).toBeVisible();
  const href = await contact.getAttribute('href');
  expect(href).toMatch(/^\/out\/DSN-[A-F0-9]+$/);
  const redirect = await request.get(href, { maxRedirects: 0 });
  expect(redirect.status()).toBe(302);
  expect(redirect.headers().location).toMatch(/^https:\/\/wa\.me\/\d{8,15}(?:\?|$)/);
});
