const nodeHtmlToImage = require('node-html-to-image')

const banners = [
  {
    output: '/Users/richy/FreeTradeJournal/public/images/email-banner-welcome.png',
    html: `<html><head><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width: 600px; height: 200px; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; }
      .wrap { width: 600px; height: 200px; background: #111; position: relative; overflow: hidden; display: flex; align-items: center; padding: 0 40px; }
      .bg { position: absolute; right: -40px; top: -40px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%); }
      .tag { font-size: 10px; font-weight: 700; color: #f59e0b; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }
      .title { font-size: 32px; font-weight: 700; color: #ededed; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 12px; }
      .sub { font-size: 14px; color: #555; }
    </style></head><body>
    <div class="wrap">
      <div class="bg"></div>
      <div>
        <div class="tag">Welcome to FreeTradeJournal</div>
        <div class="title">Your edge starts here.</div>
        <div class="sub">Track trades. Spot patterns. Trade consistently.</div>
      </div>
    </div>
    </body></html>`
  },
  {
    output: '/Users/richy/FreeTradeJournal/public/images/email-banner-pro.png',
    html: `<html><head><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width: 600px; height: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; }
      .wrap { width: 600px; height: 200px; background: #f59e0b; position: relative; overflow: hidden; display: flex; align-items: center; padding: 0 40px; }
      .circle1 { position: absolute; right: -60px; top: -60px; width: 280px; height: 280px; border-radius: 50%; background: rgba(0,0,0,0.06); }
      .circle2 { position: absolute; right: 60px; bottom: -80px; width: 200px; height: 200px; border-radius: 50%; background: rgba(0,0,0,0.04); }
      .tag { font-size: 10px; font-weight: 800; color: rgba(0,0,0,0.45); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 12px; }
      .title { font-size: 36px; font-weight: 800; color: #000; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 10px; }
      .sub { font-size: 14px; color: rgba(0,0,0,0.5); font-weight: 500; }
    </style></head><body>
    <div class="wrap">
      <div class="circle1"></div>
      <div class="circle2"></div>
      <div>
        <div class="tag">FreeTradeJournal Pro</div>
        <div class="title">Every feature unlocked.</div>
        <div class="sub">AI coaching, cloud sync, PropTracker and more.</div>
      </div>
    </div>
    </body></html>`
  },
  {
    output: '/Users/richy/FreeTradeJournal/public/images/email-banner-day3.png',
    html: `<html><head><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width: 600px; height: 200px; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; }
      .wrap { width: 600px; height: 200px; background: #111; position: relative; overflow: hidden; display: flex; align-items: center; padding: 0 40px; }
      .bar { position: absolute; left: 0; top: 0; width: 4px; height: 100%; background: #f59e0b; }
      .badge { display: inline-block; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #f59e0b; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px; margin-bottom: 14px; letter-spacing: 0.05em; }
      .title { font-size: 30px; font-weight: 700; color: #ededed; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 10px; }
      .sub { font-size: 14px; color: #555; }
      .time { color: #f59e0b; font-weight: 600; }
    </style></head><body>
    <div class="wrap">
      <div class="bar"></div>
      <div style="padding-left: 20px;">
        <div class="badge">Day 3 reminder</div>
        <div class="title">Log your first trade.</div>
        <div class="sub">Takes <span class="time">60 seconds</span> to start building your edge.</div>
      </div>
    </div>
    </body></html>`
  }
]

async function run() {
  for (const banner of banners) {
    await nodeHtmlToImage({
      output: banner.output,
      html: banner.html,
      puppeteerArgs: { args: ['--no-sandbox'] },
      type: 'png',
    })
    console.log('Generated:', banner.output)
  }
}

run().catch(console.error)
