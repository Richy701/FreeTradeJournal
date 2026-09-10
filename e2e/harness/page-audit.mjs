// Start a local Vite server; no external requests or real accounts are used.
// node e2e/harness/page-audit.mjs http://127.0.0.1:5175 /tmp/ftj-page-audit
import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.argv[2] || 'http://127.0.0.1:5173';
const out = process.argv[3] || '/tmp/ftj-page-audit';
fs.mkdirSync(out, { recursive: true });
const app = fs.readFileSync('src/App.tsx', 'utf8');
const all = [...app.matchAll(/<Route path="([^"]+)"/g)].map(m => m[1]);
const privateRoutes = ['/dashboard','/prop-tracker','/coach','/trades','/goals','/calculator','/journal','/ideas','/trade-ideas','/settings','/profile','/onboarding'];
const publicRoutes = all.filter(r => !privateRoutes.includes(r) && !r.includes(':') && r !== '*');
publicRoutes.push('/prop-tracker', '/audit-missing-page', '/blog/audit-missing-post');
publicRoutes.push(...JSON.parse(fs.readFileSync('src/data/firm-pages.json')).map(p => '/' + p.slug));
publicRoutes.push(...fs.readdirSync('posts').filter(p => p.endsWith('.md')).map(p => '/blog/' + p.slice(0,-3)));
const browser = await chromium.launch();
const results = fs.existsSync(`${out}/results.json`) ? JSON.parse(fs.readFileSync(`${out}/results.json`)) : [];
const label = (route, mode, width) => `${mode}-${route.replaceAll('/', '_') || 'home'}-${width}`;
try {
 for (const mode of ['public', 'demo']) {
  const context = await browser.newContext({ viewport: {width:1440,height:1000}, reducedMotion:'reduce' });
  await context.route('**/*', r => {
    const url = new URL(r.request().url());
    if (url.origin === base) return r.continue();
    // Production blog covers are also in public/images; keep the audit offline.
    if (url.hostname === 'www.freetradejournal.com' && url.pathname.startsWith('/images/')) {
      const file = `public${url.pathname}`;
      if (fs.existsSync(file)) return r.fulfill({body:fs.readFileSync(file),contentType:'image/png'});
    }
    return r.abort();
  });
  await context.addInitScript(() => {
    localStorage.setItem('cookieConsent', JSON.stringify({necessary:true,analytics:false,timestamp:new Date().toISOString(),version:2}));
  });
  const page = await context.newPage();
  let errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base, {waitUntil:'domcontentloaded'});
  await page.addStyleTag({content:'* { scroll-behavior: auto !important; }'});
  if (mode === 'demo') {
    await page.getByText('View Live Demo', {exact:true}).first().click();
    await page.waitForURL('**/dashboard');
  }
  for (const route of mode === 'public' ? publicRoutes : privateRoutes) {
   for (const width of [1440,390]) {
    if (results.some(r => r.mode === mode && r.route === route && r.width === width)) continue;
    errors = [];
    await page.setViewportSize({width,height:width===390?844:1000});
    await page.evaluate(p => {history.pushState({},'',p);dispatchEvent(new PopStateEvent('popstate'));},route);
    await page.waitForTimeout(700);
    await page.locator('h1').first().waitFor({timeout:6000}).catch(()=>{});
    const name = label(route,mode,width);
    const report = await page.evaluate(() => {
      const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[aria-hidden="true"]');
      const describe = e => ({tag:e.tagName,id:e.id,text:(e.textContent||'').trim().slice(0,90),html:e.outerHTML.slice(0,240)});
      const named = e => e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.labels?.length || e.getAttribute('title') || (e.textContent||'').trim() || e.querySelector('img[alt]')?.alt;
      const controls = [...document.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(visible);
      return {
        actualPath:location.pathname, title:document.title,
        headings:[...document.querySelectorAll('h1,h2,h3')].filter(visible).map(e=>({level:e.tagName,text:e.textContent.trim()})),
        unnamedButtons:[...document.querySelectorAll('button')].filter(visible).filter(e=>!named(e)).map(describe),
        unlabeledInputs:controls.filter(e=>!e.labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).map(describe),
        overflow:document.documentElement.scrollWidth>innerWidth,
        tabs:[...document.querySelectorAll('[role=tab]')].filter(visible).map(e=>e.textContent.trim()),
        text:document.body.innerText.slice(0,14000),
      };
    });
    await page.evaluate(()=>{for(const el of document.querySelectorAll('*'))if(el.scrollTop)el.scrollTop=0;window.scrollTo(0,0);});
    await page.waitForTimeout(250);
    await page.screenshot({path:`${out}/${name}-top.png`,animations:'disabled'});
    const scrollHeight = await page.evaluate(()=>{
      const el=[...document.querySelectorAll('*')].find(e=>e.clientHeight>400&&e.scrollHeight>e.clientHeight+100&&['auto','scroll'].includes(getComputedStyle(e).overflowY))||document.scrollingElement;
      el.setAttribute('data-audit-scroller','');return el.scrollHeight-el.clientHeight;
    });
    for (const [position,portion] of [['middle',.5],['bottom',1]]) {
      // Traverse the page so scroll-triggered content is visible in captures.
      for(let y=0;y<=scrollHeight*portion;y+=700){
        await page.evaluate(y=>document.querySelector('[data-audit-scroller]').scrollTop=y,y);
        await page.waitForTimeout(50);
      }
      await page.evaluate(y=>document.querySelector('[data-audit-scroller]').scrollTop=y,scrollHeight*portion);
      await page.waitForTimeout(200);
      await page.screenshot({path:`${out}/${name}-${position}.png`,animations:'disabled'});
    }
    await page.evaluate(()=>document.querySelector('[data-audit-scroller]')?.removeAttribute('data-audit-scroller'));
    results.push({mode,route,width,...report,errors:[...new Set(errors)]});
    fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
    console.log(`${mode} ${route} ${width}: ${report.actualPath}, h1=${report.headings.filter(h=>h.level==='H1').length}, unnamed=${report.unnamedButtons.length}, unlabeled=${report.unlabeledInputs.length}, overflow=${report.overflow}`);
   }
  }
  await context.close();
 }
} finally {await browser.close();}
