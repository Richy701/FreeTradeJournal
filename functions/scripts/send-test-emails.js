const React = require('react')
const { render } = require('@react-email/components')
const { WelcomeEmail } = require('../lib/emails/WelcomeEmail')
const { ProUpgradeEmail } = require('../lib/emails/ProUpgradeEmail')
const { CancellationEmail } = require('../lib/emails/CancellationEmail')
const { Day3NudgeEmail } = require('../lib/emails/Day3NudgeEmail')
const { UpgradeNudgeEmail } = require('../lib/emails/UpgradeNudgeEmail')
const { Resend } = require('resend')

if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY env var is required')
const resend = new Resend(process.env.RESEND_API_KEY)
const TO = 'richyturnitup@gmail.com'
const FROM = 'Richy at FreeTradeJournal <richy@freetradejournal.com>'

const emails = [
  { subject: '[TEST] Welcome email', el: React.createElement(WelcomeEmail, { firstName: 'Richy' }) },
  { subject: '[TEST] Pro upgrade email', el: React.createElement(ProUpgradeEmail, { firstName: 'Richy', planLabel: 'Monthly' }) },
  { subject: '[TEST] Cancellation email', el: React.createElement(CancellationEmail, { firstName: 'Richy', endDate: 'May 4, 2026' }) },
  { subject: '[TEST] Day 3 nudge email', el: React.createElement(Day3NudgeEmail, { firstName: 'Richy' }) },
  { subject: '[TEST] Upgrade nudge email', el: React.createElement(UpgradeNudgeEmail, { firstName: 'Richy' }) },
]

async function main() {
  for (const e of emails) {
    const html = await render(e.el)
    const result = await resend.emails.send({ from: FROM, to: TO, subject: e.subject, html })
    console.log(result.error ? 'FAIL: ' + e.subject : 'sent: ' + e.subject)
    await new Promise(r => setTimeout(r, 400))
  }
}
main().catch(console.error)
