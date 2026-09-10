import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:5175';
const out=process.argv[3]||'/tmp/ftj-page-states';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch();
const results=[];
try {
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
 await page.addInitScript(()=>localStorage.setItem('cookieConsent',JSON.stringify({necessary:true,analytics:false,timestamp:new Date().toISOString(),version:2})));
 await page.goto(base);
 await page.addStyleTag({content:'* {scroll-behavior:auto !important}'});
 const go=async path=>{await page.evaluate(p=>{history.pushState({},'',p);dispatchEvent(new PopStateEvent('popstate'));},path);await page.waitForTimeout(600);};
 const capture=async name=>{
  await page.waitForTimeout(400);
  const report=await page.evaluate(()=>{
   const visible=e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]');
   return {overflow:document.documentElement.scrollWidth>innerWidth,
    unlabeled:[...document.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(visible).filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>({tag:e.tagName,placeholder:e.getAttribute('placeholder'),id:e.id})),
    headings:[...document.querySelectorAll('h1,h2,h3')].filter(visible).map(e=>e.textContent),
    buttons:[...document.querySelectorAll('button')].filter(visible).map(e=>e.getAttribute('aria-label')||e.textContent.trim()),
    text:document.body.innerText};
  });
  results.push({name,...report}); fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));
  await page.screenshot({path:out+'/'+name+'.png',animations:'disabled'});
  console.log(name,JSON.stringify({overflow:report.overflow,unlabeled:report.unlabeled}));
 };
 for (const route of ['/login','/signup']) {
  await go(route);
  const toggle=page.getByRole('button',{name:'Show password',exact:true});
  const box=await toggle.boundingBox(); assert(box.width>=44&&box.height>=44);
  await toggle.click(); assert.equal(await page.locator('#password').getAttribute('type'),'text');
  await page.getByRole('button',{name:'Hide password',exact:true}).click();
  await capture(route.slice(1)+'-password');
 }
 await go('/reset-password');
 const reset=page.getByRole('link',{name:'Request a new reset link'});
 assert.equal(await reset.locator('button').count(),0);await reset.click();
 assert(page.url().endsWith('/forgot-password'));
 await capture('password-recovery');
 await go('/changelog');
 await page.getByRole('button',{name:'Fixed',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Fixed',exact:true}).getAttribute('aria-pressed'),'true');
 await capture('changelog-fixed');
 await page.getByRole('button',{name:'All',exact:true}).click();
 if(await page.getByRole('button',{name:'Load more',exact:true}).count()) {await page.getByRole('button',{name:'Load more',exact:true}).click();await capture('changelog-expanded');}
 await go('/pricing');
 await page.getByRole('button',{name:/^monthly$/i}).click();assert.equal(await page.getByRole('button',{name:/^monthly$/i}).getAttribute('aria-pressed'),'true');await capture('pricing-monthly');
 await page.getByRole('button',{name:/yearly/i}).click();await capture('pricing-yearly');
 const faq=page.getByRole('button',{name:'Is the free plan really free forever?'});
 await faq.click();assert.equal(await faq.getAttribute('aria-expanded'),'true');await capture('pricing-faq');
 await go('/');await page.getByRole('button',{name:'Toggle theme',exact:true}).click();
 for(const route of ['/','/login','/documentation','/pricing']) {
  await go(route);await capture(route==='/'?'home-light':route.slice(1)+'-light');
 }
 await go('/');await page.getByRole('button',{name:'Toggle theme',exact:true}).click();
 await go('/');await page.getByText('View Live Demo',{exact:true}).first().click();await page.waitForURL('**/dashboard');
 await go('/calculator');
 await page.getByRole('spinbutton',{name:'Account balance',exact:true}).fill('10000');
 await page.getByRole('spinbutton',{name:'Risk per trade (%)',exact:true}).fill('1');
 await page.getByRole('spinbutton',{name:'Stop loss (pips)',exact:true}).fill('20');
 await capture('calculator-forex');
 await page.getByRole('button',{name:'Futures',exact:true}).click();
 await page.getByRole('spinbutton',{name:'Stop loss (ticks)',exact:true}).fill('40');
 await capture('calculator-futures');
 await page.getByRole('button',{name:'Points',exact:true}).click();
 assert.equal(await page.getByRole('spinbutton',{name:'Stop loss (points)',exact:true}).count(),1);
 await capture('calculator-points');
 await go('/journal');
 assert.equal(await page.locator('#journal-statistics').isVisible(),false);
 await page.getByRole('button',{name:'Show journal statistics',exact:true}).click();
 assert.equal(await page.locator('#journal-statistics').isVisible(),true);
 await page.getByRole('button',{name:'Hide journal statistics',exact:true}).click();
 await capture('journal-mobile');
 const search=page.getByRole('searchbox',{name:'Search journal entries'});
 await search.fill('no-such-journal-entry-audit');await page.getByRole('heading',{name:'No entries found',exact:true}).waitFor();await capture('journal-no-results');
 await search.press('Escape');assert.equal(await search.inputValue(),'');
 const filter=page.getByRole('button',{name:/^Filters/});await filter.click();assert.equal(await filter.getAttribute('aria-expanded'),'true');
 await capture('journal-filters');await filter.click();assert.equal(await filter.getAttribute('aria-expanded'),'false');
 await go('/settings');
 await capture('settings-general');
 const edit=page.getByRole('button',{name:'Edit',exact:true}).first();
 if(await edit.count()) {await edit.click();await page.getByLabel('Account name',{exact:true}).scrollIntoViewIfNeeded();await capture('settings-edit-account');await page.getByRole('button',{name:'Cancel',exact:true}).first().click();}
 for(const section of ['accounts','risk','data','notifications','subscription']) {
  await page.locator('#'+section).scrollIntoViewIfNeeded();await capture('settings-'+section);
 }
 await go('/goals');await capture('goals');
 await page.getByRole('button',{name:'Add Goal',exact:true}).click();await capture('goals-dialog');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Add Limit',exact:true}).click();await capture('risk-dialog');await page.keyboard.press('Escape');
 for(const tab of await page.getByRole('tab').all()) {await tab.click();await capture('goals-'+(await tab.innerText()).trim().replaceAll(/\W+/g,'-'));}
 await go('/ideas');await capture('ideas');
 await go('/onboarding');await page.getByRole('button',{name:'Get Started',exact:true}).click();
 for(const width of [360,390,1440]) {await page.setViewportSize({width,height:width===1440?1000:844});await capture('onboarding-experience-'+width);
  const skipBox=await page.getByRole('button',{name:'Skip',exact:true}).boundingBox();assert(skipBox.x>=0&&skipBox.x+skipBox.width<=width,'Skip must fit viewport');
  assert.equal(await page.getByRole('progressbar',{name:'Account setup progress'}).getAttribute('aria-valuenow'),'2');}
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:/Just Starting Out/}).click();assert.equal(await page.getByRole('button',{name:/Just Starting Out/}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'Continue',exact:true}).click();await capture('onboarding-account');
 await page.getByRole('button',{name:/Demo Account/}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await capture('onboarding-details');
 await page.getByRole('button',{name:'Continue',exact:true}).click();await capture('onboarding-ready');
 console.log('PASS: local interactive states; onboarding completion and external submissions were not invoked.');
} finally {await browser.close();}
