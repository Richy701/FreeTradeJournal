// Capture the What's New screenshots for v2.92.0 from the demo.
//
// Why the demo: the seeded weekly-focus state (src/data/demo-weekly-focus.ts)
// has an active week four days in AND a completed week with a written
// reflection. Capturing from a signed-out or fresh account gives an empty week,
// which is what makes a feature announcement look broken.
//
// Convention (matches the existing files in public/screenshots): dark theme,
// tight in-app crop, no window chrome, 2x pixel density.
//
// Run: node e2e/harness/whatsnew-screenshots.mjs   (needs `npm run build` first)

import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'public/screenshots');
const PORT = 4319;

mkdirSync(OUT, { recursive: true });

const server = await preview({
  root: ROOT,
  preview: { port: PORT, strictPort: true, open: false },
});
const base = `http://localhost:${PORT}`;
console.log('preview on', base);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});

// Demo state lives in memory and is lost on a full reload, so the app is only
// ever loaded once — every later route change goes through the router.
const go = async (route) => {
  await page.evaluate((r) => {
    history.pushState({}, '', r);
    dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForTimeout(1200);
};

const shot = async (locator, name) => {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const file = path.join(OUT, name);
  await locator.screenshot({ path: file });
  console.log('wrote', name);
};

try {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ftj-theme', 'dark');
      // Settle the cookie banner up front — it floats over the bottom-left of
      // every page and bleeds into the card crops.
      localStorage.setItem('cookieConsent', JSON.stringify({
        necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2,
      }));
    } catch {}
  });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('button', { name: /demo/i }).first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(2500);

  // 1. Weekly focus, mid-week and in progress.
  await go('/coach');
  const card = page.locator('#weekly-focus');
  await card.waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(800);
  await shot(card, 'weekly-focus.png');

  // 2. The completed week with its reflection, from the history accordion.
  // Cropped to the history section on purpose: shooting the whole card again
  // would give What's New two near-identical pictures on consecutive items.
  const history = page.getByRole('button', { name: /past weekly reviews/i });
  if (await history.count()) {
    await history.first().click();
    await page.waitForTimeout(700);
    const section = page.locator('#weekly-focus div[data-state="open"]').first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const b = await section.boundingBox();
    const pad = 24;
    await page.screenshot({
      path: path.join(OUT, 'weekly-focus-review.png'),
      clip: {
        x: Math.max(0, b.x - pad),
        // No top padding: the column divider from the section above pokes into
        // the frame otherwise.
        y: Math.max(0, b.y + 2),
        width: Math.min(b.width + pad * 2, 1440 - Math.max(0, b.x - pad)),
        height: Math.min(b.height + pad, 900 - Math.max(0, b.y + 2)),
      },
    });
    console.log('wrote weekly-focus-review.png');
  } else {
    console.warn('! no past-reviews accordion — skipped weekly-focus-review.png');
  }

  // 3. The quick post-trade review dialog.
  await go('/trades');
  await page.waitForTimeout(1500);
  const trigger = page.getByRole('button', { name: /quick review/i });
  await trigger.first().waitFor({ state: 'visible', timeout: 20000 });
  await trigger.first().click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(500);

  const followed = dialog.getByText(/^Followed my plan$/i);
  if (await followed.count()) await followed.first().click();
  const box = dialog.locator('textarea');
  if (await box.count()) {
    await box.first().fill('Followed the plan and it still lost. Entry and stop were where I said they would be, so nothing to change. Keep taking this setup.');
  }
  await page.waitForTimeout(500);
  await shot(dialog, 'post-trade-review.png');
} finally {
  await browser.close();
  await server.close();
}
