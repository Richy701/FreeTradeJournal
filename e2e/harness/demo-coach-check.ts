import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = process.env.FOCUS_PREVIEW_URL || 'http://127.0.0.1:5176';
const out = '/tmp/ftj-demo-coach'; mkdirSync(out, {recursive: true});
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport: {width: 1280, height: 900}, serviceWorkers: 'block', reducedMotion: 'reduce'});
  // External embeds can finish loading after their dashboard container unmounts.
  // This check covers our demo/weekly-focus flow, not TradingView's widgets.
  await page.route('https://s3.tradingview.com/**', route => route.abort());
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error' && /ErrorBoundary|creationTime|TypeError/.test(message.text())) errors.push(message.text()); });
  page.on('pageerror', e => errors.push(e.stack || e.message));
  await page.goto(base);
  await page.getByText('View Live Demo', {exact: true}).first().click();
  await page.waitForURL('**/dashboard');
  await page.getByRole('link', {name: 'Check in', exact: true}).waitFor();
  const reminder = page.getByLabel('Weekly focus reminder', {exact: true});
  for (const width of [390, 1280]) {
    await page.setViewportSize({width, height: 1800});
    await reminder.screenshot({path: `${out}/dashboard-focus-${width}-dark.png`, animations: 'disabled'});
    assert.equal(await reminder.evaluate(el => el.scrollWidth > el.clientWidth), false);
  }
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await reminder.screenshot({path: `${out}/dashboard-focus-light.png`, animations: 'disabled'});
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  for (const route of ['/ideas', '/coach']) {
    await page.evaluate(route => { window.history.pushState({}, '', route); window.dispatchEvent(new PopStateEvent('popstate')); }, route);
    await page.getByRole('heading', {name: route === '/coach' ? 'AI Coach' : 'Trade Insights', exact: true}).waitFor({timeout: 15000});
    await page.getByText('AI Trade Analysis', {exact: true}).first().waitFor();
    assert.equal(await page.getByText('Something went wrong', {exact: true}).count(), 0);
    assert.equal(await page.getByRole('complementary', {name: 'Continue your reviews with Pro'}).count(), 0);
    await page.screenshot({path: `${out}/${route.slice(1)}.png`, fullPage: true});
  }
  const focus = page.locator('#weekly-focus');
  await focus.getByText('Take a five-minute break after a losing trade before considering another entry.', {exact: true}).waitFor();
  await focus.getByText('Followed on 2 of 3 recorded trading days', {exact: true}).waitFor();
  await focus.getByRole('button', {name: 'Past weekly reviews', exact: true}).click();
  await focus.getByText('Writing down the setup helped me wait for a clear entry.', {exact: false}).waitFor();
  for (const width of [390, 1280]) {
    await page.setViewportSize({width, height: 1800});
    await focus.evaluate(el => el.scrollIntoView({block: 'center'}));
    await focus.screenshot({path: `${out}/weekly-focus-${width}.png`, animations: 'disabled'});
    assert.equal(await focus.evaluate(el => el.scrollWidth > el.clientWidth), false);
  }
  const before = await page.evaluate(() => localStorage.getItem('user_demo-user_coachingFocus'));
  await focus.getByRole('button', {name: 'Followed it', exact: true}).click();
  await page.getByText('This is a read-only demo. Sign up free to save a focus check-in.', {exact: true}).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('user_demo-user_coachingFocus')), before);
  assert.deepEqual(errors, []);
  console.log('PASS: real demo session loads Trade Insights and AI Coach without errors or the Pro offer. Screenshots: ' + out);
} finally { await browser.close(); }
