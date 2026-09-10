import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base = 'http://127.0.0.1:5175';
const out = '/tmp/ftj-landing-polish';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await page.addInitScript(() => localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 })));
  await page.goto(base);
  await page.addStyleTag({ content: '* { scroll-behavior: auto !important; }' });
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForTimeout(1800);
  for (const theme of ['dark', 'light']) {
    if ((await page.locator('html').getAttribute('class'))?.includes('dark') !== (theme === 'dark')) {
      await page.getByRole('button', { name: 'Toggle theme' }).click();
    }
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const cta = await page.getByRole('button', { name: 'View Live Demo', exact: true }).boundingBox();
      assert(cta && cta.height >= 48 && cta.y > 80);
      await page.screenshot({ path: `${out}/hero-${theme}-${width}.png`, animations: 'disabled' });
    }
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const selector = page.getByRole('button', { name: 'Show screenshot: Equity curve with market feed', exact: true });
    await selector.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1600);
    const box = await selector.boundingBox();
    assert(box && box.width >= 43.9 && box.height >= 43.9);
    await selector.click();
    assert.equal(await selector.getAttribute('aria-current'), 'true');
    await page.getByRole('heading', { name: /Performance Dashboard/ }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/features-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Enlarge screenshot: Equity curve with market feed', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: eight hero viewport/theme checks, 48px CTAs, no horizontal overflow, 44px screenshot selectors, and screenshot enlargement/Escape.');
} finally { await browser.close(); }
