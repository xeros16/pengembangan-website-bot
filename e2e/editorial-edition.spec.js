import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('the editorial header, theme and mobile navigation work together', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.edition-hero h1')).toBeVisible();
  const image = page.locator('.edition-hero-art img');
  await expect.poll(() => image.evaluate(element => element.naturalWidth)).toBeGreaterThan(0);
  const navigation = page.locator('#main-nav');
  const menu = page.getByRole('button', { name: 'Buka menu navigasi' });
  if (await menu.isVisible()) await menu.click();
  const theme = navigation.getByRole('button', { name: 'Mode gelap' });
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
  await navigation.getByRole('link', { name: 'Jelajahi', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
  await expect(page.locator('.edition-directory-hero h1')).toBeVisible();
});

test('directory search can be submitted without opening the filter panel', async ({ page }) => {
  await page.goto('/discover');
  const filters = page.locator('[data-discovery-filters]');
  await filters.getByLabel('Kata kunci').fill('Sari & Rupa');
  await filters.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('Sari & Rupa');
  await expect(page.locator('[data-discovery-filters]').getByLabel('Kata kunci')).toHaveValue('Sari & Rupa');
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', /\/discover$/);
});

test('public portfolio media and sitemap observe designer visibility', async ({ request }) => {
  const privateItem = process.env.E2E_PRIVATE_PORTFOLIO_ID;
  const publicItem = process.env.E2E_PUBLIC_PORTFOLIO_ID;
  test.skip(!privateItem || !publicItem, 'Configure the two IDs on a disposable database with approved items owned by a private and a public profile.');
  const [hidden, visible, sitemap] = await Promise.all([
    request.get(`/media/${encodeURIComponent(privateItem)}`),
    request.get(`/media/${encodeURIComponent(publicItem)}`),
    request.get('/sitemap.xml'),
  ]);
  expect(hidden.status()).toBe(404);
  expect(visible.status()).toBe(200);
  expect(visible.headers()['content-type']).toMatch(/^image\//);
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain(`/work/${privateItem}`);
});
