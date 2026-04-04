const nodeHtmlToImage = require('node-html-to-image')

const html = `
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 600px;
    height: 220px;
    background: #0a0a0a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
  }
  .card {
    width: 600px;
    height: 220px;
    background: #111;
    position: relative;
    overflow: hidden;
  }
  .info {
    position: absolute;
    top: 28px;
    left: 32px;
    z-index: 2;
  }
  .label {
    font-size: 11px;
    font-weight: 600;
    color: #555;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .value {
    font-size: 36px;
    font-weight: 700;
    color: #ededed;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .badge {
    display: inline-block;
    margin-top: 8px;
    background: rgba(34, 197, 94, 0.12);
    color: #22c55e;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
  }
  svg {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
  }
</style>
</head>
<body>
<div class="card">
  <div class="info">
    <div class="label">Portfolio performance</div>
    <div class="value">+$3,240</div>
    <div class="badge">+18.3% this month</div>
  </div>
  <svg viewBox="0 0 600 120" preserveAspectRatio="none" height="120">
    <defs>
      <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M0 100 C30 98 50 94 80 90 S120 86 150 80 S190 70 220 74 S260 62 290 54 S330 46 360 38 S400 28 430 20 S470 12 510 8 L560 4 L600 2 L600 120 L0 120 Z" fill="url(#fill)"/>
    <path d="M0 100 C30 98 50 94 80 90 S120 86 150 80 S190 70 220 74 S260 62 290 54 S330 46 360 38 S400 28 430 20 S470 12 510 8 L560 4 L600 2" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
    <circle cx="600" cy="2" r="3" fill="#f59e0b"/>
  </svg>
</div>
</body>
</html>
`

nodeHtmlToImage({
  output: '/tmp/email-banner.png',
  html,
  puppeteerArgs: { args: ['--no-sandbox'] },
  type: 'png',
}).then(() => {
  console.log('Generated: /tmp/email-banner.png')
}).catch(console.error)
