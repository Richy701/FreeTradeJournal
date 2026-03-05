import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve('public/images/landing');

const PAGES = [
  { name: 'trading-dashboard-screenshot', path: '/dashboard' },
  { name: 'trading-log-screenshot', path: '/trades' },
  { name: 'calendar-heatmap-screenshot', path: '/calendar' },
  { name: 'trading-journal-screenshot', path: '/journal' },
  { name: 'goals-risk-management-screenshot', path: '/goals' },
  { name: 'ai-trading-coach-screenshot', path: '/dashboard' },
];

async function convertImage(pngPath: string, baseName: string) {
  const webpPath = path.join(OUTPUT_DIR, `${baseName}.webp`);
  const webp1280 = path.join(OUTPUT_DIR, `${baseName}-1280w.webp`);
  const webp640 = path.join(OUTPUT_DIR, `${baseName}-640w.webp`);

  await sharp(pngPath).webp({ quality: 85 }).toFile(webpPath);
  await sharp(pngPath).resize(1280).webp({ quality: 85 }).toFile(webp1280);
  await sharp(pngPath).resize(640).webp({ quality: 80 }).toFile(webp640);

  console.log(`  -> ${baseName}.webp + 1280w + 640w`);
}

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  // Set Deep Yellow theme and dark mode BEFORE loading the app
  console.log('Setting Deep Yellow theme and dark mode...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('selected-theme', 'monochrome');
    localStorage.setItem('vite-ui-theme', 'dark');
    // Pre-dismiss the demo banner and "What's New" modal
    sessionStorage.setItem('demo-banner-dismissed', 'true');
  });

  // Reload so theme takes effect from initial render
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Enter demo mode via the button
  console.log('Entering demo mode...');
  const tryBtn = page.locator('button:has-text("View Live Demo")').first();
  await tryBtn.click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Dismiss the "What's New" modal if visible
  const gotItBtn = page.locator('button:has-text("Got it")');
  if (await gotItBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await gotItBtn.click();
    await page.waitForTimeout(500);
  }

  // Dismiss cookie consent if visible
  const cookieBtn = page.locator('button:has-text("Accept All")');
  if (await cookieBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(500);
  }

  // Hide the demo banner if it's still visible
  await page.evaluate(() => {
    sessionStorage.setItem('demo-banner-dismissed', 'true');
    const banners = document.querySelectorAll('.fixed.top-0.left-0.right-0');
    banners.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.textContent?.includes('demo')) {
        htmlEl.style.display = 'none';
      }
    });
    document.documentElement.style.setProperty('--demo-banner-height', '0px');
  });
  await page.waitForTimeout(500);

  console.log(`\nCapturing ${PAGES.length} screenshots...\n`);

  for (const { name, path: pagePath } of PAGES) {
    console.log(`Capturing: ${name} (${pagePath})`);

    // Navigate via the sidebar link's click handler to stay in SPA (preserves demo mode)
    const currentPath = new URL(page.url()).pathname;
    if (currentPath !== pagePath) {
      await page.evaluate((p) => {
        const link = document.querySelector(`a[href="${p}"]`) as HTMLAnchorElement;
        if (link) link.click();
      }, pagePath);
      await page.waitForTimeout(2000);
    }

    const pngPath = path.join(OUTPUT_DIR, `${name}.png`);
    await page.screenshot({ path: pngPath, fullPage: false });
    console.log(`  Saved: ${name}.png`);

    await convertImage(pngPath, name);
  }

  await browser.close();
  console.log('\nDone! All screenshots captured and converted.');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
