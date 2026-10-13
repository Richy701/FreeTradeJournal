// Local preview only. No provider access, enrollment or email sends.
import * as React from 'react'
import { render } from '@react-email/components'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { transpileModule } from 'typescript'
import { WelcomeEmail } from '../src/emails/WelcomeEmail'
import { Day3NudgeEmail } from '../src/emails/Day3NudgeEmail'
import { Day7NudgeEmail } from '../src/emails/Day7NudgeEmail'
import { FirstTradeReviewEmail } from '../src/emails/FirstTradeReviewEmail'
import { ONBOARDING_SUBJECTS } from '../src/onboarding-emails'

async function main() {
  const out = join(tmpdir(), 'ftj-onboarding-preview')
  mkdirSync(out, { recursive: true })
  const items = [
    { title: 'Welcome', timing: 'Immediately after signup', subject: 'Welcome to FreeTradeJournal', component: WelcomeEmail },
    { title: 'Entry or import', timing: 'Day 2 · only before the first trade', subject: ONBOARDING_SUBJECTS.entry, component: Day3NudgeEmail },
    { title: 'A hand getting started', timing: 'Day 7 · only before the first trade', subject: ONBOARDING_SUBJECTS.support, component: Day7NudgeEmail },
    { title: 'Review your first trade', timing: 'About 24 hours after the first trade', subject: ONBOARDING_SUBJECTS.review, component: FirstTradeReviewEmail },
  ]
  const emails: string[] = []
  for (const [index, item] of items.entries()) {
    const html = await render(React.createElement(item.component, { firstName: '' }))
    emails.push(html)
    writeFileSync(join(out, `${index + 1}.html`), html)
  }
  const script = transpileModule(`
    const emails: string[] = ${JSON.stringify(emails)};
    const frame = document.querySelector('iframe') as HTMLIFrameElement;
    let observer: ResizeObserver | undefined;
    frame.addEventListener('load', () => {
      observer?.disconnect();
      const body = frame.contentDocument?.body;
      if (!body) return;
      const fit = () => frame.style.height = Math.ceil(body.getBoundingClientRect().height) + 'px';
      observer = new ResizeObserver(fit); observer.observe(body); fit();
    });
    document.querySelectorAll<HTMLButtonElement>('nav button').forEach((button, i) => {
      button.addEventListener('click', () => { frame.srcdoc = emails[i]; });
    });
    frame.srcdoc = emails[0];
  `, { compilerOptions: { target: 7 } }).outputText.replace(/<\/script/gi, '<\\/script')
  writeFileSync(join(out, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FreeTradeJournal — onboarding preview</title>
  <style>body{margin:0;background:#f4f4f5;color:#18181b;font:15px Arial,sans-serif}header{padding:24px;background:white;border-bottom:1px solid #ddd}h1{font-size:24px;margin:0 0 12px}p{line-height:1.6}main{display:flex;gap:24px;padding:24px;align-items:flex-start}nav{width:270px;flex-shrink:0}button{display:block;width:100%;text-align:left;padding:16px;background:white;border:1px solid #ddd;margin-bottom:12px;cursor:pointer;font:inherit}button strong,button span{display:block;margin-bottom:7px}button span{font-size:13px;color:#52525b;line-height:1.5}iframe{width:680px;max-width:100%;height:1px;border:1px solid #ddd;background:white}label{margin-right:20px}body:has(#mobile:checked) iframe{width:320px}@media(max-width:700px){main{display:block;padding:12px}nav{width:auto}iframe{box-sizing:border-box}}</style>
  <header><h1>FreeTradeJournal / The new onboarding sequence</h1><p>Local preview — not published. Entry and support reminders stop after the first trade.<br>The review email starts from the first trade, not the signup date.</p><label><input type="radio" name="width" checked> Desktop</label><label><input id="mobile" type="radio" name="width"> Mobile · 320px</label></header>
  <main><nav>${items.map(item => `<button><strong>${item.title}</strong><span>${item.timing}</span><span>Subject: ${item.subject}</span></button>`).join('')}</nav><iframe title="Email preview"></iframe></main><script>${script}</script></html>`)
  console.log(join(out, 'index.html'))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
