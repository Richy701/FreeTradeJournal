const React = require('react')
const { render } = require('@react-email/components')
const { WelcomeEmail } = require('../lib/emails/WelcomeEmail')
const { ProUpgradeEmail } = require('../lib/emails/ProUpgradeEmail')
const { CancellationEmail } = require('../lib/emails/CancellationEmail')
const { Day3NudgeEmail } = require('../lib/emails/Day3NudgeEmail')
const { UpgradeNudgeEmail } = require('../lib/emails/UpgradeNudgeEmail')
const fs = require('fs')

function embed(html, bannerPath) {
  const filename = bannerPath.split('/').pop()
  return html
    .replaceAll('https://www.freetradejournal.com/images/' + filename, filename)
    .replaceAll('https://www.freetradejournal.com/favicon-64x64.png', 'favicon-64x64.png')
}

async function main() {
  const emails = [
    { name: 'welcome', el: React.createElement(WelcomeEmail, { firstName: 'Richy' }), banner: ['/Users/richy/FreeTradeJournal/public/images/email-banner-welcome.png', '/images/email-banner-welcome.png'] },
    { name: 'pro', el: React.createElement(ProUpgradeEmail, { firstName: 'Richy', planLabel: 'Monthly' }), banner: ['/Users/richy/FreeTradeJournal/public/images/email-banner-pro.png', '/images/email-banner-pro.png'] },
    { name: 'cancel', el: React.createElement(CancellationEmail, { firstName: 'Richy', endDate: 'May 4, 2026' }), banner: null },
    { name: 'day3', el: React.createElement(Day3NudgeEmail, { firstName: 'Richy' }), banner: ['/Users/richy/FreeTradeJournal/public/images/email-banner-day3.png', '/images/email-banner-day3.png'] },
    { name: 'nudge', el: React.createElement(UpgradeNudgeEmail, { firstName: 'Richy' }), banner: ['/Users/richy/FreeTradeJournal/public/images/email-banner.png', '/images/email-banner.png'] },
  ]
  for (const e of emails) {
    let html = await render(e.el)
    if (e.banner) {
      html = embed(html, e.banner[0])
    } else {
      html = html.replaceAll('https://www.freetradejournal.com/favicon-64x64.png', 'favicon-64x64.png')
    }
    fs.writeFileSync('/tmp/email-' + e.name + '.html', html)
    console.log('ok:', e.name)
  }
}
main().catch(console.error)
