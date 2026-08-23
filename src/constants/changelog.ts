export type ChangelogItemType = 'new' | 'improved' | 'fixed'

export type ChangelogItem = {
  type: ChangelogItemType
  text: string
  description?: string
  /** Shown prominently in the What's New dialog; the rest collapse behind
   *  "+N more". Aim for 3-4 per release. Without any flags, the dialog falls
   *  back to the first three items. */
  highlight?: boolean
  /** Screenshot rendered under the item in the What's New dialog and on
   *  /changelog. Use a site-relative path under public/. */
  image?: { src: string; alt: string }
  /** In-app route the What's New dialog offers as a "try it" jump. */
  link?: { to: string; label: string }
}

export type ChangelogEntry = {
  version: string
  date: string
  summary: string
  items: ChangelogItem[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '2.87.0',
    date: '2026-08-23',
    summary: 'Trade Ideas: a shared feed of setups from other traders, in beta.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'Trade Ideas (beta)',
        description: 'A new Community section in the sidebar where anyone signed in can post a setup before taking it: symbol, long or short, entry, stop, target and why. Other traders can read it and like it. The first time you post you pick a handle and an avatar. Your real name and email are never shown. Once you have taken the trade, link it from your Trade Log and the result shows on the idea for everyone, so a feed of setups also shows which ones worked. It is a beta, so tell us what you would change.',
        image: {
          src: '/screenshots/trade-ideas-feed.png',
          alt: 'The Trade Ideas feed with a long EURUSD setup still open and a short NQ idea marked Worked with its profit',
        },
        link: { to: '/trade-ideas', label: 'Open Trade Ideas' },
      },
      {
        type: 'new',
        highlight: true,
        text: 'Post a setup in under a minute',
        description: 'Pick the market and symbol, long or short, entry, stop and target, then say why. The form shows your planned reward-to-risk as you type and stops you posting a stop on the wrong side of the entry. One chart screenshot can go with it. The community rules sit next to the feed: your own setups only, give a stop, no selling or links, no made-up results. Up to 5 posts a day. Anything that breaks the rules can be reported and comes down after three reports.',
        image: {
          src: '/screenshots/trade-ideas-post.png',
          alt: 'The Post a trade idea form filled in with a short NQ setup showing a planned reward of 2.4R',
        },
      },
      {
        type: 'new',
        highlight: true,
        text: 'Link the trade, show the result',
        description: 'On your own idea, press Link a trade and pick the trade from your Trade Log. Trades on the same symbol come first. The idea then shows Worked, Lost or Break even with the P&L, and your record on the page counts it.',
        image: {
          src: '/screenshots/trade-ideas-link-trade.png',
          alt: 'The Link a trade dialog listing closed EURUSD trades from the Trade Log with a winning one selected',
        },
      },
      {
        type: 'new',
        text: 'Updates from the FreeTradeJournal team in the feed',
        description: 'Posts marked Team update come from us: what changed, what is coming, what we need tested. They sit in the same feed as everyone\'s ideas.',
      },
      {
        type: 'new',
        text: 'Your handle and idea record on your Profile',
        description: 'Once you have a handle, the Profile page shows it with how many ideas you have posted and how many worked.',
      },
      {
        type: 'improved',
        text: 'AI Review, Pre-Trade and Post-Trade on a phone',
        description: 'The three buttons from the top of the Journal on desktop now sit under the page title on a phone. Before, a phone only had the round New Entry button.',
      },
      {
        type: 'improved',
        text: 'The journal editor opens where you can see it',
        description: 'Pressing New Entry or the pencil on an entry far down the list now scrolls the editor into view instead of opening it off screen. Closing the editor with unsaved typing asks first. Cmd+Enter (Ctrl+Enter on Windows) saves the entry, and Escape closes an enlarged screenshot.',
      },
      {
        type: 'improved',
        text: 'Journal cards are easier to read',
        description: 'Tags are now outlined so they do not look like emotions, the mood badge is capitalised like the others, the risk-reward cell is left out when a trade has none, and the Sentiment vs P&L figures take the colour of the result rather than the mood.',
      },
    ],
  },
  {
    version: '2.86.0',
    date: '2026-08-22',
    summary: 'One journal entry can now cover several trades.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'Link several trades to one journal entry',
        description: 'If you scale into a position or take the same idea in three fills, you no longer have to write three near-identical entries. In the Trade Log, tick the trades and press Journal selected: one entry opens with all of them attached. In the Journal itself, the Link to Trade box now adds trades instead of replacing the one you picked, and each linked trade sits underneath it as a chip you can remove. The entry shows every trade it covers with the combined result, and the P&L filter and sort use that combined figure. Pre-trade plans and post-trade reviews work the same way. Your existing entries are untouched.',
        image: {
          src: '/screenshots/journal-linked-trades.png',
          alt: 'A post-trade review in the Journal with two linked trades and their combined result',
        },
        link: { to: '/journal', label: 'Open Journal' },
      },
      {
        type: 'fixed',
        text: 'Your account menu is back in the header on desktop',
        description: 'Since 2.85.1 the only way to reach Profile or Sign out on a desktop was to open the sidebar first. The avatar menu now stays in the header until the sidebar is open.',
      },
      {
        type: 'fixed',
        text: 'The risk limit track record now counts what the breach alert counted',
        description: 'A day that hit your daily loss limit and then recovered was filed as a day you stayed inside it, even though the app had already shown the breach. It now counts as crossed. Drawdown is measured from your most recent high, so a second slide past the limit later in the account is counted too, not only the first one ever.',
      },
      {
        type: 'fixed',
        text: 'Edit your name on the profile page from a phone',
        description: 'The Edit button and your joined and last sign in dates were only shown on wider screens.',
      },
    ],
  },
  {
    version: '2.85.1',
    date: '2026-08-21',
    summary: 'The sidebar is grouped and easier to scan, and the profile page has been rebuilt around your numbers.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Your profile page now opens with your numbers',
        description: 'Trades logged, win rate, net P&L and your current logging streak sit across the top, and each one is a link through to the page it comes from. Your name, email and avatar moved into a single card at the top with the date you joined and when you last signed in. Recent trades and active goals sit side by side underneath. The old cover photo and the duplicated email are gone.',
        link: { to: '/profile', label: 'Open Profile' },
      },
      {
        type: 'improved',
        text: 'The sidebar is split into Main and Tools',
        description: 'Dashboard, AI Coach, Trade Log and Journal sit under Main, and Goals & Risk, Trade Insights, PropTracker and Position Calculator under Tools. The page you are on is now marked in your theme colour. Prop Firm Deals, Blog, Help & Docs, Invite Friends, What\'s New and Send Feedback moved behind a More button so Settings is not buried, and your account sits at the bottom with profile, settings and sign out. On phones every row is now big enough to tap comfortably.',
        image: {
          src: '/screenshots/sidebar-grouped.png',
          alt: 'The sidebar with Main and Tools groups and the current page highlighted',
        },
        link: { to: '/dashboard', label: 'Open Dashboard' },
      },
    ],
  },
  {
    version: '2.85.0',
    date: '2026-08-21',
    summary: 'Your risk limits now show what sticking to them is worth, and the journal opens with the day already written down.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'See what your risk limits are worth',
        description: 'On the Goals page, underneath your limits, a new panel splits your past trading days in two: days you stayed inside every limit you set, and days you crossed one. For each side it shows your average day, how many of those days finished green, and the total. It replays your limits as they stand today over every completed day, so changing a limit changes the comparison. Today itself is left out while it is still open. Nothing is shown until there are at least three days on each side, so the figure is never drawn from one bad afternoon.',
        image: {
          src: '/screenshots/goals-limit-adherence.png',
          alt: 'The Goals page showing days spent inside risk limits next to days that crossed one, with the average day for each',
        },
        link: { to: '/goals', label: 'Open Goals' },
      },
      {
        type: 'new',
        highlight: true,
        text: 'Coach FTJ opens with how today went',
        description: 'On days you have logged trades, Coach FTJ now starts with a short account of the session: how many trades, what the day came to, and how close you got to the limit you came nearest to. If you crossed one, it also says how many other days this month you have done the same and how those days finished. It is worked out from your own trades and limits rather than written by AI, so it appears straight away and takes nothing from your AI allowance. On days you have not traded, the card is unchanged.',
        image: {
          src: '/screenshots/coach-today-session.png',
          alt: 'Coach FTJ on the dashboard opening with a summary of the day and how close it came to the daily loss limit',
        },
        link: { to: '/dashboard', label: 'Open Dashboard' },
      },
      {
        type: 'new',
        highlight: true,
        text: 'The journal opens with the day already written down',
        description: 'Start a new journal entry on a day you traded and the date and the day\'s numbers are already in the box: how many trades, what they came to, and the limit you got closest to. The cursor sits underneath, ready for whatever you want to say about it. The Pre-Trade and Post-Trade buttons put the same lines above their usual form, which is worth having before you plan another entry on a day that has already gone against you. It never writes over anything you have typed, and you can delete it if you would rather start from a blank page.',
        image: {
          src: '/screenshots/journal-day-prefill.png',
          alt: 'A new journal entry opening with the date as its title and the day\'s trades, result and nearest limit already written in',
        },
        link: { to: '/journal', label: 'Open Journal' },
      },
    ],
  },
  {
    version: '2.84.1',
    date: '2026-08-20',
    summary: 'Dashboard sections can be dragged into a new order straight from the page.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Move dashboard sections without opening Customize',
        description: 'On a desktop screen, hover any section of your dashboard and a small handle appears to its left. Drag it to move that section up or down the page. There is no edit mode to turn on first, and the rest of the section stays clickable while the handle is showing. Your order is saved the same as before, and sections you have hidden keep their place in the list. On phones and tablets, reorder from Customize as you do now.',
        image: {
          src: '/screenshots/dashboard-drag-reorder.png',
          alt: 'The equity curve section part way through being dragged down the dashboard, with its drag handle showing in the left margin',
        },
        link: { to: '/dashboard', label: 'Open Dashboard' },
      },
    ],
  },
  {
    version: '2.84.0',
    date: '2026-08-20',
    summary: 'A new dashboard section shows which hours of the day and which market windows you actually make money in.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'See which hours and market windows make you money',
        description: 'A new section on your dashboard breaks your trades down by time. Time of Day splits them into 24 bars by the hour you entered, with a switch between P&L and win rate, so you can see which hours pay and which ones only feel busy. Trading Sessions groups the same trades by market window, including the London and New York crossover as its own window, and shows P&L, trade count and win rate for each. Every trade counts once, in the one window it was taken in. Both use your own local time. Neither will name a best hour or window off fewer than five trades, so the numbers stay honest while you build up history. You can hide or reorder the section from Customize on the dashboard.',
        image: {
          src: '/screenshots/hours-sessions-breakdown.png',
          alt: 'Dashboard showing Time of Day hourly P&L bars beside Trading Sessions broken down by market window',
        },
        link: { to: '/dashboard', label: 'Open Dashboard' },
      },
    ],
  },
  {
    version: '2.83.1',
    date: '2026-08-19',
    summary: 'CSV imports now read dates written as 19-08-2026 correctly.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'CSV imports now read dates written as 19-08-2026 correctly',
        description: 'Some brokers, including most Indian ones, write dates day first with dashes. The importer used to mistake the day for the year and put every trade in the 1920s. Those files now import on the right dates, the same as files that use slashes or dots. If you imported one of these files before, delete those trades and import the file again.',
      },
    ],
  },
  {
    version: '2.83.0',
    date: '2026-08-18',
    summary: 'PropTracker is rebuilt around your accounts with a proper Performance tab, the coach remembers its last review, and Coach FTJ on the dashboard reads as a briefing.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'PropTracker puts your accounts first',
        description: 'The page is now three tabs: Accounts, Performance and AI Coach. Your account cards are the first thing you see instead of the last, with an Active / Passed / Failed filter once you have a few. Your invested, earned, net P&L and active count sit in the header. Breach and deadline warnings stay at the top whichever tab you are on. The risk calculator lives with the accounts and shows your max safe loss for today without opening it.',
        image: {
          src: '/screenshots/proptracker-accounts-tab.png',
          alt: 'PropTracker Accounts tab with headline numbers, tabs, the risk calculator and account cards',
        },
        link: { to: '/prop-tracker', label: 'Open PropTracker' },
      },
      {
        type: 'new',
        highlight: true,
        text: 'Performance tab with real analytics',
        description: 'Pick a period (3, 6 or 12 months, or all time) and see fees against payouts by month with your best and worst month, cumulative P&L that carries in what you had banked before the period, where the fees went (evaluations, resets, monthly, other) with a count of each, payout stats (average, largest, last, gap between payouts, days from account start to first payout), and a by-firm table sorted by net with each firm\'s pass/fail record, resets, invested, earned and ROI.',
        image: {
          src: '/screenshots/proptracker-performance-tab.png',
          alt: 'PropTracker Performance tab with track record, monthly cash flow, cumulative P&L, fees by type and payouts',
        },
        link: { to: '/prop-tracker', label: 'See your numbers' },
      },
      {
        type: 'improved',
        highlight: true,
        text: 'PropTracker AI Coach remembers your last review',
        description: 'The review stays on the page when you come back, with when it was written and how many accounts and transactions it saw. If you log more after that, the tab tells you how many were added so you know when a fresh review is worth it. The empty state explains what the coach reads and returns before you spend a credit, warnings are a flagged list, and the game plan is numbered steps.',
        image: {
          src: '/screenshots/proptracker-coach-tab.png',
          alt: 'PropTracker AI Coach tab with a score, the big picture, sections and a numbered game plan',
        },
      },
      {
        type: 'improved',
        text: 'Balance updates show what the number means before you save',
        description: 'The Update balance and End of day forms show your last recorded balance, the change since then, and live profit target, total drawdown and daily drawdown for the balance you are typing, with a warning if it is over a limit. Adding a transaction is one tap on the type instead of a dropdown, and the account form shows the money equivalent of each drawdown percentage as you set rules.',
        image: {
          src: '/screenshots/proptracker-balance-preview.png',
          alt: 'The Update balance dialog showing the change since last update and drawdown after the update',
        },
      },
      {
        type: 'improved',
        text: 'Coach FTJ on the dashboard reads as a briefing',
        description: 'Instead of five equal cards, the coach opens with one sentence on how you are doing, then the things to fix ranked by how serious they are (three shown, the rest behind "more"), with the numbers in bold. Tilt sits in the header as a small strip you can expand. The chat box is always there under the tips, with a "More on" chip for each tip so you can ask about it in one tap. The separate "Your numbers" card is gone; the dashboard cards above already show those figures.',
        image: {
          src: '/screenshots/coach-ftj-briefing.png',
          alt: 'Coach FTJ card with a lead sentence, three ranked tips, and the ask box with tip chips',
        },
      },
      {
        type: 'improved',
        text: 'Recent trades on the dashboard is a plain list',
        description: 'Eight rows, no scrollbar inside the card, the date shown once per day, and a small wins/losses/net line next to the title.',
      },
      {
        type: 'fixed',
        text: 'AI Coach no longer drops sections',
        description: 'Some reviews only showed Watch Out For and Your Game Plan because the other sections were written on one line and were not picked up. All six sections now show whatever format the review comes back in, and your saved review is re-read the same way without using a credit.',
      },
    ],
  },
  {
    version: '2.82.0',
    date: '2026-08-18',
    summary: 'Free AI credits are counted differently: the automatic tips, prompts and alerts no longer use them up.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Automatic AI no longer spends your free credits',
        description: 'Coach FTJ tips on the dashboard, the journal questions after you save a trade, risk alerts and the on-save journal coach used to come out of the same 20-a-month allowance as everything else, so many free accounts hit the wall without ever choosing to use AI. Those automatic features are now free on every account (with a daily cap to stop runaway use). Your monthly allowance is now 5 AI coaching runs, spent only when you ask for something: AI Trade Analysis, Trade Review, Journal Review, Goal Coach, Position Check, Strategy Tagger, PropTracker AI, or a Coach FTJ chat message. Import first-reads have their own allowance of 20 a month. Everyone starts this month with a full allowance.',
        link: { to: '/coach', label: 'Open Coach FTJ' },
      },
      {
        type: 'fixed',
        text: 'The AI credits count is now accurate',
        description: 'If you had used up your free AI credits, the app could keep showing an old number and keep trying to run AI features anyway. It now shows the right count and stops as soon as your credits are gone.',
      },
    ],
  },
  {
    version: '2.81.0',
    date: '2026-08-15',
    summary: 'Import trades from a screenshot: upload a photo of your closed trades and check them before they are saved.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'Import trades from a screenshot',
        description: 'Take a screenshot of your closed trades or history in MT4/MT5 (phone or desktop), TradingView, TopstepX, Tradovate, NinjaTrader or your broker app, and upload it. The trades are read out into a table where you can check and fix each row before anything is saved. Rows we are less sure about are marked, and duplicates you already have are unticked. Commission and swap are subtracted when they were visible in the screenshot. Free accounts get 3 screenshot imports; Pro gets 20 a day.',
        image: {
          src: '/screenshots/screenshot-import-review.png',
          alt: 'The Import from Screenshot review table with trades read from a screenshot, ready to check and import',
        },
        link: { to: '/trades', label: 'Try it' },
      },
      {
        type: 'improved',
        text: 'Import button now offers CSV or Screenshot',
        description: 'On the Trade Log, Import opens a small menu: CSV or Excel file, or Screenshot. The dashboard quick-add Import tab has the screenshot option under the CSV drop zone.',
      },
    ],
  },
  {
    version: '2.80.0',
    date: '2026-08-15',
    summary: 'Logging a trade is faster: one-tap direction, times filled in for you, and a live P&L preview before you save.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'The trade form got a refresh',
        description: 'Long and Short are now two buttons instead of a dropdown. Price fields start empty so you can type straight away, and entry and exit times are pre-filled with the current time, so a quick log needs no date picking at all. Money fields show your currency symbol, and the form now shows an estimated P&L next to the save button before you commit.',
        image: {
          src: '/screenshots/trade-form-refresh.png',
          alt: 'The Add New Trade form with Long/Short buttons, pre-filled times, and placeholder price fields',
        },
        link: { to: '/trades', label: 'Log a trade' },
      },
      {
        type: 'improved',
        highlight: true,
        text: 'Forms tell you what is missing',
        description: 'Submitting an incomplete trade now points out the first missing field instead of silently doing nothing. The calendar quick-add and account forms in Settings say what is needed next to the save button instead of just greying it out.',
      },
      {
        type: 'improved',
        text: 'Faster goal and limit forms',
        description: 'Setting a goal or a risk limit is now a few taps: pick the type, pick the period, tap a suggested amount or type your own.',
        image: {
          src: '/screenshots/goal-form-quickpicks.png',
          alt: 'The new goal form with tap-to-select type and period tiles and quick-pick target amounts',
        },
      },
      {
        type: 'improved',
        text: 'Risk limit form explains each cap',
        description: 'Each limit type now has a plain-English line saying exactly what it caps, with suggested amounts sized from your account, like $200 = 2% of a $10,000 account.',
        image: {
          src: '/screenshots/risk-limit-form.png',
          alt: 'The risk limit form with descriptions under each limit type and suggested amounts',
        },
      },
      {
        type: 'improved',
        text: 'The strategy field suggests your own strategies',
        description: 'Start typing in the Strategy field and it offers the strategy names you have used on past trades.',
      },
      {
        type: 'improved',
        text: 'Cleaner delete confirmations',
        description: 'Deleting a trade or journal entry now asks in a proper in-app dialog instead of the browser popup.',
      },
      {
        type: 'improved',
        text: 'Trading Wrapped can report on last month',
        description: 'The PDF report has a Last month option, so you can generate a finished month\'s recap without setting custom dates. Win rates in the report are now colored by whether they are above or below 50%.',
      },
    ],
  },
  {
    version: '2.79.0',
    date: '2026-08-15',
    summary: 'The Goals & Risk page is rebuilt: everything on one screen, and risk alerts that reach you anywhere in the app.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Goals & Risk on one screen',
        description: 'No more tabs. Your risk limits sit at the top with today\'s usage against each cap, and your goals sit below with a clear current number against each target. Each goal card also shows your recent record, like hit 4 of the last 6 weeks, so you can see consistency, not just today.',
        image: {
          src: '/screenshots/goals-risk-redesign.png',
          alt: 'The redesigned Goals & Risk page with risk limit cards on top and goal cards with streak history below',
        },
        link: { to: '/goals', label: 'Open Goals & Risk' },
      },
      {
        type: 'new',
        highlight: true,
        text: 'Risk alerts now follow you around the app',
        description: 'Cross a daily loss, per-trade loss, or drawdown limit and you get an alert the moment it happens, whether you\'re in the trade log, the calendar, or importing a CSV. Before, you only found out if you opened the Goals page.',
      },
      {
        type: 'improved',
        highlight: true,
        text: 'Goals reset with their period',
        description: 'A weekly goal now starts fresh each week instead of staying marked achieved forever. Your past periods live on in the goal\'s history row.',
      },
    ],
  },
  {
    version: '2.78.0',
    date: '2026-08-14',
    summary: 'One view of all your accounts combined, plus percentages on the trading calendar.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'View all your accounts combined',
        description: 'The account switcher in the sidebar has a new All accounts option. Pick it and the dashboard, trading calendar, trade log, and journal show every account together, so you can see your total P&L in one place. While you\'re viewing all accounts you can\'t add or edit trades. Switch back to a single account for that. If your accounts use different currencies, you get one combined view per currency, since adding dollars to euros would give a meaningless total.',
        image: {
          src: '/screenshots/all-accounts-switcher.png',
          alt: 'The account switcher open with the new All accounts option selected above two trading accounts',
        },
      },
      {
        type: 'new',
        highlight: true,
        text: 'The trading calendar can show percentages',
        description: 'The $ / % switch on the dashboard now changes the trading calendar too. In percent mode, each day shows what you made or lost as a percentage of your starting balance. Hover over any day to see both the amount and the percentage. Set your starting balance in Settings so the percentages are accurate.',
        image: {
          src: '/screenshots/calendar-percent-mode.png',
          alt: 'The trading calendar in percent mode, each day showing its return as a percentage',
        },
      },
    ],
  },
  {
    version: '2.77.3',
    date: '2026-08-12',
    summary: 'CSV imports now catch swapped day and month dates.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'CSV imports now catch swapped day and month dates',
        description: 'Brokers in different countries write dates differently: 10/03 can mean 10 March or October 3. When a file could be read either way, the importer now picks the reading that does not put your trades in the future. And if an import still produces future-dated trades, you get a warning instead of wrong dates sitting silently in your calendar.',
      },
    ],
  },
  {
    version: '2.77.2',
    date: '2026-08-12',
    summary: 'Pop-up messages got a refresh: color-coded by type, dismissible, and better aligned.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Pop-up messages are now color-coded',
        description: 'Success messages are green, errors are red, and warnings are amber, in both light and dark mode. Before, every message looked the same regardless of what it was telling you. Reminders about a missed form field or a plan limit now show as amber warnings instead of red errors, so red always means something actually failed.',
      },
      {
        type: 'new',
        highlight: true,
        text: 'You can now dismiss pop-up messages yourself',
        description: 'Hover over any message and a close button appears. On phones, swiping them away still works.',
      },
      {
        type: 'fixed',
        text: 'The icon in pop-up messages lines up with the title',
        description: 'On two-line messages the icon used to float between the lines.',
      },
    ],
  },
  {
    version: '2.77.1',
    date: '2026-08-11',
    summary: 'Mobile layout fixes: the dashboard no longer scrolls sideways on phones.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'The dashboard no longer scrolls sideways on phones',
        description: 'The Trade Distribution chart was wider than small phone screens, which let the whole page drift side to side. On phones the chart now sits above its symbol list instead of beside it, and the app can no longer be dragged sideways even if a widget misbehaves.',
      },
      {
        type: 'improved',
        highlight: true,
        text: 'A tidier dashboard header on phones',
        description: 'Share Stats and Customize are now compact icon buttons next to Add Trade, so all three fit on one row at the right edge of the screen.',
      },
      {
        type: 'improved',
        text: 'The account picker moved out of the top bar on phones',
        description: 'It was taking up a full row under the header on every page. To switch accounts on your phone, open the menu; the picker is at the top.',
      },
    ],
  },
  {
    version: '2.77.0',
    date: '2026-08-11',
    summary: 'A position size calculator with an AI risk check, and live market sessions on your dashboard.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'Position size calculator with an AI risk check',
        description: 'Enter your account size, how much you want to risk, and your stop loss, and it tells you how many lots or contracts to trade. Forex mode covers majors, crosses, gold and silver, with live exchange rates when your account currency differs from the pair. Futures mode has the real tick sizes and values for ES, NQ, crude, gold and all the micro versions. Results round down so you never risk more than you planned. The AI risk check reads the plan against your own logged trades and tells you whether the risk survives your real losing streaks and whether the reward fits your actual win rate. It is in the sidebar as Position Calculator.',
        image: {
          src: '/screenshots/position-calculator.png',
          alt: 'The position size calculator showing 5 MNQ contracts for a $100 risk with a 40-tick stop',
        },
      },
      {
        type: 'new',
        highlight: true,
        text: 'Market sessions, live on your dashboard',
        description: 'Sydney, Tokyo, London, New York and CME futures hours on one timeline in your own timezone: what is open right now, each market\'s local time, and how long until the next open or close. It flags when London and New York overlap, notes the CME daily halt, and warns you the day before market holidays. You can hide it from Customize like any other widget.',
        image: {
          src: '/screenshots/market-sessions-widget.png',
          alt: 'The market sessions widget showing London and New York open on a 24-hour timeline',
        },
      },
    ],
  },
  {
    version: '2.75.0',
    date: '2026-08-11',
    summary: 'The dashboard news panel is now a live market feed from trader-focused sources.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'A market feed built for traders',
        description: 'The news panel on the dashboard now pulls from investingLive (formerly ForexLive), FXStreet, CNBC and MarketWatch instead of the old generic provider. Each post shows who wrote it, where it came from and how long ago, in a compact feed you can scan quickly. There are two tabs: Forex for currency and commodities commentary, and Markets for stocks, indices and the wider picture. The crypto tab is gone.',
      },
    ],
  },
  {
    version: '2.74.1',
    date: '2026-08-11',
    summary: 'The market news panel no longer disappears from the dashboard.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'Market news is back',
        description: 'The news panel vanished from the dashboard when our news provider started returning an empty General feed. The panel now switches to Forex news automatically when General has no articles, and if a tab you pick is empty it says so instead of removing the whole panel.',
      },
    ],
  },
  {
    version: '2.74.0',
    date: '2026-08-11',
    summary: 'Redesigned sign-in and sign-up pages with clearer error messages, plus a tidier dashboard header.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Sign-in and sign-up pages redesigned',
        description: 'The sign-in, sign-up and password reset pages share one cleaner layout. Error messages now say what actually went wrong in plain English, closing the Google sign-in window no longer shows an error, and if you sign up with Google for the first time you go straight to setup instead of an empty dashboard. If you are already signed in, opening the sign-in page takes you to your dashboard.',
      },
      {
        type: 'improved',
        highlight: true,
        text: 'The money/percent P&L switch moved to the dashboard header',
        description: 'The switch that shows P&L as money or as a percent of your account now sits at the top of the dashboard next to the time period selector, instead of above the stat cards. Both controls share the same look.',
      },
      {
        type: 'improved',
        text: 'Market prices are easier to read',
        description: 'Each quote in the market prices strip now sits in its own labelled chip with a larger price. The economic figures have clearer names: 10Y Yield, Yield Curve and Unemployment instead of 10Y, 10Y-2Y and Unemp.',
      },
      {
        type: 'improved',
        text: 'More room on small screens',
        description: 'On phones, the Customize and Share Stats buttons show just their icons so the dashboard header fits without wrapping.',
      },
    ],
  },
  {
    version: '2.73.1',
    date: '2026-08-11',
    summary: 'The quick add and calendar trade forms now offer the full instrument list, including micro futures.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'Micro futures are now selectable everywhere',
        description: 'The quick add form on the dashboard and the one in the calendar offered a shorter instrument list than the Trade Log page. Micro futures (MNQ, MES, MYM, M2K), micro crude and gold, natural gas, copper and the grains were missing, so anyone trading them had to use the Trade Log page instead. All three forms now offer the same list, grouped by type, and index CFDs and index ETFs both appear under Indices.',
      },
      {
        type: 'fixed',
        text: 'Your instrument no longer disappears from the form',
        description: 'If you traded a symbol that was not on the list, such as an individual stock from an imported file, the instrument box could come up empty. Your symbol now stays selected and appears at the top of the list.',
      },
    ],
  },
  {
    version: '2.73.0',
    date: '2026-08-11',
    summary: 'The trade form now opens with whatever you logged last, instead of resetting to Forex every time.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'The trade form remembers what you last traded',
        description: 'Every new trade form opened on Forex with a blank instrument, so futures and stock traders re-picked the same market and symbol on every single entry. The form now opens with the market, instrument and size from the last trade you logged on that account. This works from the dashboard quick-add, the calendar day view and the full Trade Log form. The full form also carries over your commission and fees, since those stay the same per broker. Long or short always resets to Long, so a short cannot be logged as a long by accident, and prices and notes stay blank.',
      },
    ],
  },
  {
    version: '2.72.0',
    date: '2026-08-10',
    summary: 'Order-history CSV files now import correctly, and imports are protected against wrong column mappings and duplicate rows.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'Order-history exports now import directly',
        description: 'Some platforms (TopstepX and similar) export your history as one row per order, with no profit column. Those files used to need manual column mapping that could not produce correct trades. The importer now recognizes them, pairs your buys and sells automatically, and works out the profit on each round trip — including partial fills. Cancelled and rejected orders are skipped.',
      },
      {
        type: 'fixed',
        highlight: true,
        text: 'Imports can no longer store prices as profits',
        description: 'If a price column was mapped as P&L during a manual import, every trade was saved with its contract price as its "profit", inflating your stats. The mapping screen now refuses that mapping and explains why, and a second check blocks any import where every row\'s P&L equals its prices.',
      },
      {
        type: 'fixed',
        text: 'Duplicate rows inside one CSV are now skipped',
        description: 'Duplicate detection compared new trades only against trades you already had, so a file containing the same row twice imported it twice. Duplicates within a single file are now caught too.',
      },
    ],
  },
  {
    version: '2.71.1',
    date: '2026-08-04',
    summary: 'Fixed Google sign-in sometimes needing two clicks.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'Fixed Google sign-in needing two attempts',
        description: 'Signing in with Google could drop you back on the login page as if nothing happened, and only the second attempt let you in. Two causes, both fixed: the app was checking whether you were signed in a moment before it had finished recording that you were, and clicking the Google button quickly after the page loaded could fire before the sign-in system was ready. Sign-in now completes fully before the app moves you, so the first attempt works.',
      },
    ],
  },
  {
    version: '2.71.0',
    date: '2026-08-04',
    summary: 'Smarter AI across the board — every AI feature upgraded to newer models, with a much deeper view of your trading.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Every AI feature upgraded to GPT-5.6',
        description: 'Coach FTJ, Trade Analysis, Trade Review, Risk Alerts, journal features, strategy tagging, CSV mapping, and screenshot import all now run on OpenAI\'s newest GPT-5.6 generation — sharper, more specific answers everywhere the app uses AI.',
      },
      {
        type: 'improved',
        highlight: true,
        text: 'The AI now knows your trading much more deeply',
        description: 'Coaching tips, trade analysis, and the first read of an import now work from your sessions, your habits, and which instruments actually carry your results — instead of just headline stats. Tips will warn you first when your recent trading looks tilted, advice is always weighed against how many trades it is based on, and everything is written in plain money terms rather than finance jargon.',
      },
    ],
  },
  {
    version: '2.70.0',
    date: '2026-08-04',
    summary: 'Imported trades can now use your broker\'s clock, so times and sessions come out right.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'Set your broker\'s time zone for CSV imports',
        description: 'Broker files write trade times in the broker\'s own clock — an MT4/MT5 server usually runs two to three hours ahead of UTC — but imports used to read them as if they were in your local time. That could shift every imported trade by a few hours, put late-night trades on the wrong calendar day, and blur which session your results really came from. Each trading account now has a "Broker Time Zone" choice in Settings → Accounts: pick your platform once (MT4/MT5 server time, US Central for Tradovate, and more) and every future import converts times correctly. Existing accounts keep working exactly as before until you choose one.',
      },
    ],
  },
  {
    version: '2.69.1',
    date: '2026-08-03',
    summary: 'Fixed a rare blank page or repeated reloading after an update.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'Fixed a blank page or reloading tab after an update',
        description: 'If you had the app open while a new version was released, the page could go blank or start reloading over and over on its own. It now refreshes once to pick up the new version, and if it still cannot load, it shows an error you can act on instead of reloading endlessly.',
      },
      {
        type: 'fixed',
        text: 'Fixed signing up while your browser translates the page',
        description: 'If you had your browser translate FreeTradeJournal into another language, signing up or signing in could break the page — ticking the terms box or pressing the button showed an error screen instead. Those pages now work with translation turned on.',
      },
    ],
  },
  {
    version: '2.69.0',
    date: '2026-08-01',
    summary: 'See your results as percentages of your account, and imported trades now show their real percentage return.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'Show P&L as a percentage of your account',
        description: 'A new toggle on the Dashboard and Trade Log switches every P&L figure — per-trade results, totals, averages, best and worst — between money and percentage of your account balance. Traders who think in percentages asked for this, and it makes results comparable across account sizes. Your choice is remembered, and on Pro it follows you across devices.',
      },
      {
        type: 'fixed',
        highlight: true,
        text: 'Imported trades now show their percentage return',
        description: 'Trades imported from a broker CSV always showed 0% as their percentage return. Imports now calculate it the same way as manually logged trades.',
      },
    ],
  },
  {
    version: '2.68.0',
    date: '2026-07-28',
    summary: 'From August 8, new-account trials will need a card up front. The free plan stays free, and anyone already on a trial keeps every day of it.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Trials require a card from August 8',
        description: 'A week ago I asked people to stop deleting accounts and signing back up to restart the free trial, and I warned what would happen if it kept up: trials would need a card. It kept up. So here is exactly what changes. Accounts created on or after August 8 no longer start with the automatic 14-day Pro trial. Instead, the trial moves to checkout: pick the monthly or yearly plan on the Pricing page, enter a card, and the first 14 days are completely free. Your card is not charged until the trial ends, and you can cancel any time before then from Settings, then Subscription — cancel by day 14 and you pay nothing at all, your account simply continues on the free plan. It is the same 14 days of full Pro as before; the only difference is the card up front, because a card is the one thing that cannot be recreated with a fresh email address. I would rather have kept it card-free, and I am sorry the few ruined that for the many. — Richy',
      },
      {
        type: 'improved',
        highlight: true,
        text: 'What does not change',
        description: 'The free plan stays free forever, no card ever — unlimited trade logging, CSV import, 30 days of analytics, and up to 20 journal entries, same as today. If your trial is already running, or you sign up before August 8, you keep the card-free trial for its full 14 days and you will get an email a few days before it ends so it never catches you by surprise. Existing subscribers and lifetime owners are not affected in any way.',
      },
    ],
  },
  {
    version: '2.67.0',
    date: '2026-07-28',
    summary: 'The coach now reads your journal entries as you save them, and Goals suggests starting targets from your own trading history.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'The coach reacts to your journal entries',
        description: 'When you save a substantial journal entry, the coach reads it and responds with one observation about what you wrote and one question worth sitting with before your next session. It appears right after saving — no button to press — and you can turn it off with one click if it’s not for you.',
      },
      {
        type: 'new',
        highlight: true,
        text: 'Goal suggestions built from your own trading',
        description: 'The Goals page no longer starts you from a blank form. Once you have a few trades logged, it suggests starting targets based on your actual numbers — like beating your average monthly profit or nudging up your win rate — and one click sets the goal.',
      },
    ],
  },
  {
    version: '2.66.1',
    date: '2026-07-28',
    summary: 'Clearer guidance when a CSV import fails because the file is the wrong kind of export.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Imports now tell you when the file is the wrong export type',
        description: 'If you upload an open-positions snapshot, an account statement, or an order history instead of a closed-trades report, the importer now says so in plain language and tells you which report to export from your broker instead of showing a generic error.',
      },
    ],
  },
  {
    version: '2.66.0',
    date: '2026-07-27',
    summary: 'A smarter logging streak that survives weekends, plus a cleaner dashboard and journal date picker.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Your logging streak no longer resets over the weekend',
        description: 'The streak counter in the sidebar counts trading days now, so markets being closed on Saturday and Sunday no longer breaks your run. Days where you only wrote a journal entry count too, your personal best is shown next to the current streak, and you get a shout-out when you hit 7, 30, 100, or 365 days.',
      },
      {
        type: 'new',
        highlight: true,
        text: 'Streak on the dashboard',
        description: 'Once your streak reaches 2 days it shows as a chip in the dashboard header, next to your trade count and win rate.',
      },
      {
        type: 'improved',
        highlight: true,
        text: 'Journal dates get the proper calendar',
        description: 'The date fields in the journal editor and filters now open the same styled calendar as the rest of the app instead of the plain browser one.',
      },
      {
        type: 'improved',
        text: 'A calmer dashboard for free accounts',
        description: 'Fewer stacked banners at the top of the dashboard: the duplicate upgrade strip is gone and the invite-friends card is now a compact one-liner that appears once you have a few trades logged.',
      },
    ],
  },
  {
    version: '2.65.0',
    date: '2026-07-27',
    summary: 'Referral rewards now keep growing: every tier of referrals earns you more free Pro time.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'Referral rewards now come in tiers',
        description: 'Referring friends used to earn one reward and stop. Now the rewards keep coming: 3 referrals earns 14 days of Pro, 10 earns another 30 days, 25 earns another 90, and 50 earns another 180 — each new tier stacks on top of the Pro time you already have. If you earned the old reward, your referrals still count toward the new tiers. A referral counts when your friend signs up with your link and logs their first trade. Find your link under Invite Friends on your profile.',
      },
    ],
  },
  {
    version: '2.64.3',
    date: '2026-07-27',
    summary: 'Fixed a crash that stopped the Trade Log page from opening for some traders.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'Trade Log no longer crashes on trades saved without prices',
        description: 'If a trade was saved with the profit entered manually and the price boxes left empty, the Trade Log page could crash every time it tried to display that trade. Those trades now show a dash where the price would be, and the page opens normally again. Your trades were never lost — the page just could not display them.',
      },
    ],
  },
  {
    version: '2.64.2',
    date: '2026-07-22',
    summary: 'A note on free trials: from today, the 14-day Pro trial is one per person. Please play fair so trials can stay card-free.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Free trials are now one per person',
        description: 'FreeTradeJournal is built and run by one person — me. Every new account gets 14 days of full Pro, free, with no card required, because I hate being asked for a card just to try something. Recently a few people have been deleting their accounts and signing back up to restart the trial, over and over. As of today that door is closed: the trial is one per person. It stays generous and card-free only if it is not abused — if this keeps happening, new trials will require a card up front, and that punishes everyone because of a few. Play fair. That is all I ask. — Richy',
      },
    ],
  },
  {
    version: '2.64.1',
    date: '2026-07-21',
    summary: 'Verifying your email now takes you straight into the app instead of leaving you stuck on the confirmation screen.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'Email verification no longer gets stuck',
        description: 'After clicking the verification link, some new accounts were bounced back to the "verify your email" screen in an endless loop even though the email was confirmed. Verification is now picked up correctly and you land on your dashboard.',
      },
    ],
  },
  {
    version: '2.64.0',
    date: '2026-07-21',
    summary: 'Stock trades import properly: DAS Trader exports are now supported, and stock tickers get the right market and P&L math.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'DAS Trader import support',
        description: 'CSV exports from DAS Trader (including the simulator) now import as complete trades. DAS files list each fill on its own row, so the importer pairs your buys and sells into round trips with real entry and exit prices and correct profit or loss — including short sells, partial exits, and position flips. Daily exports whose rows only carry a clock time pick up the trading date from the file name.',
      },
      {
        type: 'fixed',
        highlight: true,
        text: 'Stock tickers no longer labelled Forex',
        description: 'Imported stock trades were tagged as Forex and had currency-pair math applied to them. Stock symbols are now recognised and their profit or loss is calculated the way shares work: price move times share count.',
      },
    ],
  },
  {
    version: '2.63.2',
    date: '2026-07-16',
    summary: 'Delete All Data now clears your cloud backup, every AI feature speaks your currency, and a batch of broker import bugs are fixed.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'Delete All Data clears the cloud too',
        description: 'For Pro users, deleting all data wiped this device but left the cloud backup — everything quietly came back on the next load while journal screenshots were lost. Deleting now clears the cloud copy and screenshots as well, and stops safely if the cloud cannot be reached.',
      },
      {
        type: 'fixed',
        text: 'AI features use your currency',
        description: 'Trade review, journal review, journal starters, import insight, and the PropTracker analysis quoted every figure in dollars regardless of your currency setting. They now use the same currency as the rest of the app.',
      },
      {
        type: 'fixed',
        text: 'Broker import accuracy',
        description: 'Several import edge cases produced wrong numbers: Interactive Brokers futures trades could under-report P&L by the contract multiplier, European files with semicolons and US decimals (or the reverse) could be off by 100x, gold and silver used the wrong lot size, and losses written with a special minus sign imported as gains. All fixed — existing trades are untouched.',
      },
      {
        type: 'fixed',
        text: 'PropTracker totals: correct sign and currency',
        description: 'A losing portfolio total displayed without its minus sign, and totals always showed "$" even when every account used another currency. Totals now carry the right sign, and single-currency portfolios are labelled in that currency.',
      },
      {
        type: 'fixed',
        text: 'Weekly recap email respects account currencies',
        description: 'The weekly recap summed all accounts as dollars. It now uses each account\'s own currency and lists multi-currency weeks separately instead of mixing them into one number.',
      },
    ],
  },
  {
    version: '2.63.1',
    date: '2026-07-16',
    summary: 'Calendar notes are now safe with multiple accounts, and P&L percentages are consistent everywhere.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'Calendar notes no longer touch other accounts',
        description: 'Saving a quick note from the dashboard calendar could remove journal entries belonging to your other trading accounts, and the note itself could land on the wrong account. Notes now save to the account you are on and leave everything else alone.',
      },
      {
        type: 'fixed',
        text: 'One P&L percentage, everywhere',
        description: 'The percentage shown next to a trade could differ wildly depending on whether it was added from the Trade Log, the dashboard quick-log, or the calendar — futures and forex position sizes were counted differently in each. All entry paths now share one calculation.',
      },
      {
        type: 'fixed',
        text: 'Accurate P&L for broker-suffixed symbols',
        description: 'Symbols with broker suffixes like EURUSDm or EURUSD.a were treated as exotic pairs and had their P&L wrongly converted. They are now recognised as the standard pairs they are.',
      },
      {
        type: 'improved',
        text: 'Log a P&L-only trade from the calendar',
        description: 'The calendar day dialog now saves a trade with just a symbol and profit or loss, the same as the dashboard quick-log — no more disabled save button when you skip the prices.',
      },
    ],
  },
  {
    version: '2.63.0',
    date: '2026-07-16',
    summary: 'The Tilt Meter now knows your usual trading hours and flags entries outside them.',
    items: [
      {
        type: 'improved',
        highlight: true,
        text: 'Tilt Meter learns your trading hours',
        description: 'The Tilt Meter now builds a picture of when you normally trade from your own history. Trades at hours you rarely trade raise your tilt score, and count double when they come right after a loss — the classic sign of revenge trading outside your window. Needs at least 20 logged trades before it kicks in.',
      },
    ],
  },
  {
    version: '2.62.0',
    date: '2026-07-15',
    summary: 'A deep reliability update: cloud sync protects your data in every edge case, and every corner of the app now speaks your currency.',
    items: [
      {
        type: 'fixed',
        highlight: true,
        text: 'Cloud sync never loses local trades',
        description: 'Two rare but serious sync gaps are closed: very large trade histories could stop syncing and then lose their newest entries, and opening the app on a brand-new device could overwrite your saved goals and risk limits with defaults. Unsynced changes are now protected and pushed as soon as they can be.',
      },
      {
        type: 'fixed',
        text: 'Offline edits survive your next login',
        description: 'Changes made while offline used to be replaced by the older cloud copy when you reconnected. Local edits that haven\'t reached the cloud now win and sync up automatically.',
      },
      {
        type: 'fixed',
        text: 'Deleting your default account keeps your history',
        description: 'Removing the default trading account could make older trades and journal entries invisible. They now move to your remaining account instead.',
      },
      {
        type: 'fixed',
        text: 'AI limits reset properly each day',
        description: 'A counter bug could carry yesterday\'s maxed-out AI usage into today and wrongly show "Daily limit reached" all day. Also, failed AI requests no longer use up your quota.',
      },
      {
        type: 'improved',
        highlight: true,
        text: 'Your currency, everywhere',
        description: 'The Wrapped PDF report, dashboard header, CSV import preview, Trade Log stats, risk alerts, profile, weekly email, and AI coaching now all use your currency setting instead of assuming dollars.',
      },
      {
        type: 'fixed',
        text: 'Dashboard header matches the period filter',
        description: 'The stat chips in the dashboard greeting now follow the same 7D/30D/90D period you picked, so the header and the cards below never show two different win rates.',
      },
      {
        type: 'fixed',
        text: 'Risk alerts react to new trades instantly',
        description: 'The AI risk monitor now re-checks the moment you log a trade (and only looks at the account you\'re viewing), instead of waiting for a page reload.',
      },
      {
        type: 'improved',
        highlight: true,
        text: 'Backups now include screenshots',
        description: 'Exported backups bundle your journal screenshots and restore them on import, and "Delete All Data" now truly deletes everything, screenshots included.',
      },
      {
        type: 'fixed',
        text: 'Import insight works for every import',
        description: 'The AI first-read after a CSV import now runs fresh for each import instead of re-showing the previous one, and its best/worst day math matches your local timezone.',
      },
    ],
  },
  {
    version: '2.61.0',
    date: '2026-07-15',
    summary: 'Trading Calendar upgrades plus a round of Journal fixes: pick entry dates, safer screenshots, your currency everywhere.',
    items: [
      {
        type: 'new',
        highlight: true,
        text: 'Pick a date for journal entries',
        description: 'The journal editor now has a date field, so you can write yesterday\'s review today (or plan ahead) and the entry lands on the right day in the calendar.',
      },
      {
        type: 'fixed',
        text: 'Journal screenshots are safer when editing',
        description: 'Editing an entry on a device that couldn\'t load one of its screenshots used to silently remove that screenshot on save. Unloadable screenshots now stay attached, with a note in the editor.',
      },
      {
        type: 'fixed',
        text: 'Journal shows amounts in your currency',
        description: 'Trade P&L shown in the journal — the trade picker, linked-trade badges, and the Sentiment vs. P&L card — now uses your currency setting, with correctly placed minus signs.',
      },
      {
        type: 'improved',
        text: 'Linking a trade keeps what you wrote',
        description: 'Selecting a trade in the journal editor no longer overwrites a title, tags, or emotions you\'ve already filled in — it only suggests values for empty fields.',
      },
      {
        type: 'improved',
        text: 'Journal stays in step with your accounts',
        description: 'The trade picker now only lists trades from your active account, the journal refreshes when trades change elsewhere, and the free-limit banner counts entries the same way the limit does.',
      },
      {
        type: 'fixed',
        text: 'Risk limits watch the right trade',
        description: 'The per-trade loss limit was checking an arbitrary trade instead of your most recent one, and breach alerts could repeat endlessly once a limit was crossed. Alerts now fire once, when the breach actually happens, and the per-trade meter tracks today\'s trades.',
      },
      {
        type: 'fixed',
        text: 'Goals track the account you\'re viewing',
        description: 'Goal progress and risk usage on the Goals page mixed trades from every account. They now follow your active account, matching the rest of the app — and the page works properly in the demo.',
      },
      {
        type: 'fixed',
        text: 'Goal coaching sees your real progress',
        description: 'The AI Goal Coach was told every goal was at zero progress regardless of your actual numbers, and could coach against outdated targets. It now reads your live progress and the goals as they are right now.',
      },
      {
        type: 'fixed',
        text: 'AI analysis stays with its account',
        description: 'Switching trading accounts could keep showing the previous account\'s AI Trade Analysis, and the New button didn\'t actually discard the old result. Both fixed, and the usage counter now shows real numbers.',
      },
      {
        type: 'fixed',
        text: 'Coach tips stop re-spending AI credits',
        description: 'The AI Coach page refetched coaching tips on every visit even when a fresh result was cached, quietly using up free AI queries. Cached tips are now reused for 24 hours unless your trades change.',
      },
      {
        type: 'improved',
        text: 'Coach and Goals speak your currency',
        description: 'Coaching tips, goal targets, risk limits, and AI analysis now use your currency setting instead of assuming dollars.',
      },
      {
        type: 'fixed',
        text: 'The euro symbol now comes first',
        description: 'Euro amounts used to show the symbol after the number (1,234.56€) in some places while other currencies led with it. Euro now reads €1,234.56 everywhere.',
      },
      {
        type: 'fixed',
        text: 'Journal filters behave predictably',
        description: 'Filtering by P&L now correctly hides entries without a linked trade, and a date filter works with just a start or just an end date.',
      },
      {
        type: 'new',
        highlight: true,
        text: 'Redesigned calendar day view',
        description: 'Clicking a day on the Trading Calendar now opens a clean overview: the day\'s P&L and win rate, every trade closed that day, and your journal notes — with quick buttons to add a note or log a trade when you want to.',
      },
      {
        type: 'improved',
        text: 'Redesigned day hover preview',
        description: 'Hovering a day on the Trading Calendar now shows a compact, steady summary — P&L, trades, win rate, and averages — instead of a bulky card that could flicker or vanish.',
      },
      {
        type: 'improved',
        text: 'Trading Calendar uses your currency',
        description: 'Day cells, weekly totals, and monthly stats now show amounts in the currency from your settings instead of always showing dollars.',
      },
      {
        type: 'fixed',
        text: 'Journal markers land on the right day',
        description: 'Depending on your timezone, the journal book icon could appear on the day before or after the entry. Calendar days now match your local time.',
      },
      {
        type: 'fixed',
        text: 'Calendar updates as you log trades',
        description: 'The Trading Calendar now refreshes immediately after you add, edit, or import trades — no more page reload to see today\'s results.',
      },
      {
        type: 'improved',
        text: 'Trade Distribution legend fits every symbol',
        description: 'With many symbols in play, the last entries in the Trade Distribution legend could get cut off. Each symbol is now a single compact line so all of them stay visible.',
      },
    ],
  },
  {
    version: '2.60.0',
    date: '2026-07-15',
    summary: 'A sharper Trading Wrapped PDF, redesigned report dialog, and a better Share Stats card.',
    items: [
      {
        type: 'improved',
        text: 'Trading Wrapped PDF looks cleaner',
        description: 'Every page of the PDF report has been rebalanced: no more overlapping text, smoother backgrounds, page numbers, and a consistent layout from cover to sign-off.',
      },
      {
        type: 'improved',
        text: 'Redesigned PDF report dialog',
        description: 'Picking a period is now one tap on Month, Quarter, Year, or Custom, and the dialog shows what your Wrapped will include before you download it.',
      },
      {
        type: 'improved',
        text: 'Clearer AI risk alerts',
        description: 'Risk alert advice on the Trade Log now reads as tidy sections with proper headings and numbered steps instead of one long block of text.',
      },
      {
        type: 'improved',
        text: 'Share Stats card redesigned',
        description: 'The shareable stats image now uses the full canvas: a labelled net P&L headline with your trade counts, a bigger equity curve, win rate front and center, and a proper branded footer.',
      },
    ],
  },
  {
    version: '2.59.0',
    date: '2026-07-15',
    summary: 'Refreshed documentation and updated privacy, cookie, and terms pages.',
    items: [
      {
        type: 'improved',
        text: 'Documentation now covers the newest features',
        description: 'The docs page now includes the customizable dashboard, journal AI helpers, import insight, themes and Theme Studio, custom brokers and prop firms, and emotion tagging — and correctly notes that free accounts include 20 AI queries per month.',
      },
      {
        type: 'improved',
        text: 'Clearer privacy, cookie, and terms pages',
        description: 'The legal pages now accurately describe how AI features, analytics consent, market data, and emails work today, including exactly what happens to your data when you accept or decline analytics cookies.',
      },
    ],
  },
  {
    version: '2.58.0',
    date: '2026-07-14',
    summary: 'Pick a time period for your dashboard, cleaner stat cards, clearer charts, and currency fixes.',
    items: [
      {
        type: 'new',
        text: 'Choose the time period for your dashboard stats',
        description: 'New 7D, 30D, 90D, YTD, and All buttons above your dashboard let you see your stats, equity curve, and symbol breakdowns for just the last week, month, or any range — instead of always everything. Ranges past 30 days are part of Pro.',
      },
      {
        type: 'improved',
        text: 'Cleaner dashboard stat cards',
        description: 'The four stat cards no longer repeat the same numbers: Total Trades now shows your current win or loss streak and a win/loss split bar, the badge shows how many trades you made this week, and the profit factor gauge now reflects dollars won versus lost.',
      },
      {
        type: 'improved',
        text: 'Symbols Performance chart is easier to read',
        description: 'The default view is now a simple bar chart: one bar per symbol, green for profit and red for loss, with the actual amounts shown. A toggle brings back the radar view, which now shows each symbol\'s win rate instead of an abstract score.',
      },
      {
        type: 'improved',
        text: 'Trade Distribution now has a legend',
        description: 'You can see which slice belongs to which symbol, with trade counts, without hovering.',
      },
      {
        type: 'improved',
        text: 'A clearer Recent Trades list',
        description: 'Trades are now grouped under day headings, and each row says Long or Short with the trade size in plain text. The list also no longer shows a meaningless 0.00% or a 12:00 AM time on imported trades that have no time of day.',
      },
      {
        type: 'improved',
        text: 'Easier-to-read equity curve and daily P&L charts',
        description: 'Axis amounts use a compact format like $10.6k, dates read as Mar 2 instead of 02/03, the equity curve marks your peak with a dot and a faint line, and the daily bars show a dashed line at your average day.',
      },
      {
        type: 'improved',
        text: 'Friendlier empty charts',
        description: 'Chart cards without data now explain what will appear there. And if you have trades but none in the selected time period, they say so and offer a one-click way to widen the range.',
      },
      {
        type: 'fixed',
        text: 'Charts now use your chosen currency',
        description: 'The equity curve, daily P&L, and insight charts showed dollar signs even if your account is set to euros, pounds, or another currency. They now follow your currency setting.',
      },
      {
        type: 'fixed',
        text: 'Chart amounts no longer get cut off',
        description: 'Larger amounts on chart axes were clipped at the edge. Axis labels are now compact so they always fit.',
      },
    ],
  },
  {
    version: '2.57.0',
    date: '2026-07-11',
    summary: 'Four new full themes, a smarter theme picker, and the new Theme Studio.',
    items: [
      {
        type: 'new',
        text: 'Four new full themes: Forest, Graphite, Terminal, and Midnight',
        description: 'Complete looks that restyle the whole app — backgrounds, cards, and sidebar included — in both light and dark mode. Forest is a deep emerald green, Graphite a quiet minimal grey, Terminal the classic green-on-black trader look, and Midnight a deep violet.',
      },
      {
        type: 'new',
        text: 'Theme Studio for Pro members',
        description: 'Build a theme that is completely yours: pick separate colors for dark mode, tint the backgrounds and sidebar to create your own full theme, and choose how rounded the app feels. A live preview shows your theme in light and dark before you commit, and you get a heads-up if a color would be hard to read.',
      },
      {
        type: 'improved',
        text: 'A clearer theme picker',
        description: 'Themes in Settings are now grouped into accent colors, full themes, and your own custom theme — and full themes show a small preview of how the whole app will look instead of just three color bars.',
      },
      {
        type: 'improved',
        text: 'Charts now follow your theme',
        description: 'Dashboard and analytics charts pick up your theme colors instead of always using the default palette.',
      },
      {
        type: 'improved',
        text: 'Your color theme follows you across devices',
        description: 'With cloud sync, the theme you pick on one device now shows up on your other devices too.',
      },
      {
        type: 'improved',
        text: 'A tidier Settings page',
        description: 'Settings is now just settings: a profile summary with your plan sits at the top, each section has a clearer heading, the performance stats (which live on your dashboard) no longer repeat there, and the static risk guidelines are tucked behind a click instead of filling the page.',
      },
      {
        type: 'fixed',
        text: 'No more color flash when the app opens',
        description: 'If you use a theme like Wine or Navy Gold, the app no longer flashes the default colors for a moment on every page load.',
      },
      {
        type: 'fixed',
        text: 'Fixed an error screen that could appear when opening the dashboard',
        description: 'Some traders saw a "Something went wrong" screen the first time they opened the app after their free Pro trial started. The dashboard now loads normally.',
      },
    ],
  },
  {
    version: '2.56.0',
    date: '2026-07-09',
    summary: 'AI Journal Review connects what you write to how you trade.',
    items: [
      {
        type: 'new',
        text: 'AI Journal Review connects what you write to how you trade',
        description: 'A new AI Review button in your Trading Journal reads your last 30 days of entries alongside your actual trading results and shows you the patterns — which moods and habits line up with your winning days, which ones cost you money, and the one change to make this week. Your journal text is only sent for the analysis, never stored or trained on.',
      },
      {
        type: 'new',
        text: 'Ask Coach while you write',
        description: 'Stuck mid-entry? The new Ask Coach button in the journal editor reads your draft and asks the follow-up questions worth answering — or gives you starters based on your trading day if the page is blank.',
      },
      {
        type: 'improved',
        text: 'Cleaner journal templates',
        description: 'The Pre-Trade, Post-Trade, and Daily Review templates are now plain, easy-to-fill text instead of markdown symbols.',
      },
      {
        type: 'improved',
        text: 'Coach FTJ now knows your schedule and your emotions',
        description: 'The coach can now see your performance by day of week, time of day, and the emotions you tag on trades — so it can tell you things like which session is quietly draining your account. It also runs on a stronger model with room for longer answers.',
      },
      {
        type: 'fixed',
        text: 'Coach chat stays put while you read',
        description: 'The chat no longer jumps to the bottom while an answer is still coming in — scroll up to read and it stays where you are. Sending a new message still brings you back down.',
      },
      {
        type: 'new',
        text: 'Import your history, get an instant AI read',
        description: 'Import 10 or more trades by CSV and the AI immediately gives you a first read of your history — the three things that stand out in your numbers and where to start. No clicks needed; it appears right after the import finishes.',
      },
      {
        type: 'improved',
        text: 'AI answers in plain English',
        description: 'All AI features now explain your trading in everyday language — what is actually happening with your money, not finance-textbook terms.',
      },
    ],
  },
  {
    version: '2.55.0',
    date: '2026-07-09',
    summary: 'Every AI feature just got a major intelligence upgrade.',
    items: [
      {
        type: 'improved',
        text: 'Smarter AI across the board — upgraded from GPT-4o to GPT-5.4',
        description: 'Every AI feature has been upgraded from GPT-4o to OpenAI\'s newest GPT-5.4 family. AI Trade Analysis and Trade Review now run on the flagship GPT-5.4 model, with Coach FTJ, Risk Alerts, and the rest on the new generation too — noticeably sharper analysis, better pattern-spotting in your trades, and less generic advice.',
      },
    ],
  },
  {
    version: '2.54.0',
    date: '2026-07-09',
    summary: 'Every new account now starts with a free 14-day Pro trial, plus updated free plan limits.',
    items: [
      {
        type: 'new',
        text: 'Everyone gets 14 days of Pro, free',
        description: 'Every account — new signups and existing free accounts alike — now gets the full Pro experience: unlimited AI coaching, cloud sync, PDF reports, and full analytics for 14 days. No card required; it simply switches to the free plan when it ends.',
      },
      {
        type: 'new',
        text: 'Prop firm partner discounts, where you need them',
        description: 'PropTracker now links to partner discounts at top prop firms when you are setting up a challenge.',
      },
      {
        type: 'improved',
        text: 'Updated free plan limits',
        description: 'Free accounts now see dashboard stats and charts for the last 30 days of trading (Pro keeps full history), and include up to 20 journal entries and 1 PropTracker account. Nothing is ever deleted: your complete trade log, exports, and existing journal entries always stay available, and the calendar heatmap still shows your full history.',
      },
    ],
  },
  {
    version: '2.53.0',
    date: '2026-07-03',
    summary: 'Save confirmations, smarter quotas and limits, PropTracker breach alerts, and goals everywhere they belong.',
    items: [
      {
        type: 'new',
        text: 'See your remaining free AI queries at a glance',
        description: 'The Coach FTJ chat now shows how many of your free monthly AI queries are left, and the count stays accurate across devices — no more hitting the limit without warning.',
      },
      {
        type: 'new',
        text: 'PropTracker warns you when a drawdown limit is breached',
        description: 'If a recorded balance crosses your max or daily drawdown limit, the account is flagged with a clear alert instead of staying quietly green. The End of Day check-in also now works with a single account.',
      },
      {
        type: 'improved',
        text: 'You get a confirmation when a trade saves',
        description: 'Logging or editing a trade now shows a confirmation, from both the dashboard quick-add and the Trade Log form.',
      },
      {
        type: 'improved',
        text: 'Quantity fields match your market',
        description: 'The trade forms now ask for Contracts on futures and Lot Size on forex, instead of calling everything a lot.',
      },
      {
        type: 'fixed',
        text: 'Your goals now appear in your Profile and backups',
        description: 'The Profile page\'s Active Goals panel and the Settings backup file were reading an old, empty goals list. Both now use your real performance goals, with live progress.',
      },
      {
        type: 'fixed',
        text: 'Importing the same file into a second account works',
        description: 'Duplicate detection during CSV import now only checks the account you are importing into, so moving your history into another account is no longer skipped as duplicates.',
      },
      {
        type: 'improved',
        text: 'Clearer checkout and account deletion',
        description: 'Cancelling a Stripe checkout now returns you to pricing with a clear message that you were not charged, the Pro welcome appears once your upgrade is actually confirmed, and deleting a trading account now spells out that its trades and journal entries go with it.',
      },
      {
        type: 'improved',
        text: 'Help & Docs in the sidebar',
        description: 'The documentation page is now one click away from inside the app.',
      },
    ],
  },
  {
    version: '2.52.0',
    date: '2026-07-03',
    summary: 'Cloud sync fixes, recovered trades, and a smoother, more accessible app everywhere.',
    items: [
      {
        type: 'fixed',
        text: 'Cloud sync now backs up your settings and performance goals',
        description: 'For Pro members, your app settings and performance goals now sync to the cloud correctly — previously they silently never reached your backup. Deleting data also syncs reliably across sessions now.',
      },
      {
        type: 'fixed',
        text: 'Recovered trades that were saved without an account',
        description: 'Trades logged in the brief moment before your account finished loading could become invisible. They now appear on your default account, including ones affected in the past.',
      },
      {
        type: 'fixed',
        text: 'Manual P&L accepts commas and breakeven zero',
        description: 'Typing 1,200 in the quick-add P&L field now saves as $1,200 instead of $1, and entering 0 for a breakeven trade is respected instead of being recalculated.',
      },
      {
        type: 'improved',
        text: 'Calendar day view shows that day\'s journal entries',
        description: 'Opening a day on the calendar now lists the journal entries you already wrote for that day, alongside the form to add more.',
      },
      {
        type: 'improved',
        text: 'Trade Log opens instantly',
        description: 'Removed an artificial loading delay — your trades now appear the moment the page opens.',
      },
      {
        type: 'improved',
        text: 'Easier to read and tap everywhere',
        description: 'Faded text across trade details is now readable, small close and page buttons are easier to tap on phones, dialogs fit better on small screens, and screen reader support is improved throughout.',
      },
    ],
  },
  {
    version: '2.51.1',
    date: '2026-07-02',
    summary: 'Quick-add saves P&L-only trades, and clearer feedback when something needs your attention.',
    items: [
      {
        type: 'fixed',
        text: 'Quick-add now saves trades with just a P&L amount',
        description: 'Adding a trade from the dashboard with only a symbol and your result now saves as intended — previously the Save button did nothing unless you also opened the details and entered prices. If something is missing, you now get a clear message instead of silence.',
      },
      {
        type: 'improved',
        text: 'A clear message when you hit the AI limit',
        description: 'When you reach your AI usage limit, Coach FTJ now tells you exactly that — including when it resets — instead of showing a generic "try again" error.',
      },
      {
        type: 'improved',
        text: 'Checkout buttons show progress',
        description: 'The upgrade buttons on the pricing page now show a spinner while your checkout session is being created, and the button text is easier to read.',
      },
    ],
  },
  {
    version: '2.51.0',
    date: '2026-07-02',
    summary: 'Deleted trades stay deleted, new trades appear instantly, and imports stop mangling numbers.',
    items: [
      {
        type: 'fixed',
        text: 'Deleted trades stay deleted',
        description: 'With cloud sync on, deleting your trades, journal entries or goals no longer brings them back a few seconds later. Deletions now sync to the cloud like any other change.',
      },
      {
        type: 'fixed',
        text: 'Trades you add now appear instantly',
        description: 'Adding a trade or journal entry from the dashboard quick-add or the calendar now shows up everywhere immediately — no more refreshing the page to see it.',
      },
      {
        type: 'fixed',
        text: 'Custom contract multiplier now counts your contracts',
        description: 'If you set a custom multiplier in the trade form’s advanced options, calculated P&L now multiplies by the number of contracts you traded, matching how the built-in multipliers work.',
      },
      {
        type: 'fixed',
        text: 'CSV imports no longer mangle numbers and dates',
        description: 'Dates like 6/10/26 now import as 2026 instead of 1926, IBKR values like "1,234.56" import as $1,234.56 instead of $1, and Tradovate losses written as -$400.00 stay losses.',
      },
      {
        type: 'fixed',
        text: 'A failed card payment no longer instantly removes Pro',
        description: 'If a renewal charge fails, you keep Pro access while your card is retried over the following days instead of being locked out on the first attempt.',
      },
      {
        type: 'improved',
        text: 'Updates reach you automatically',
        description: 'When we release a fix, open tabs now pick it up on their own — you no longer need to close every tab of the app to get the newest version.',
      },
    ],
  },
  {
    version: '2.50.0',
    date: '2026-07-02',
    summary: 'Accurate P&L math for futures, forex and metals when we calculate it for you.',
    items: [
      {
        type: 'fixed',
        text: 'Futures P&L now counts your contracts',
        description: 'When you enter prices and let us calculate P&L, futures and index trades now multiply by the number of contracts you traded. 5 ES contracts over 10 points is now correctly $2,500, not $500. Trades you already saved are not changed.',
      },
      {
        type: 'fixed',
        text: 'Correct pip values for JPY pairs and other non-USD quotes',
        description: 'USDJPY, USDCAD, USDCHF and similar pairs now convert your P&L to dollars at the exit rate instead of assuming every pip is worth $10.',
      },
      {
        type: 'fixed',
        text: 'Gold and silver lot sizes',
        description: 'XAUUSD and XAGUSD now use their real lot sizes (100oz and 5,000oz), so calculated P&L on metals matches your broker.',
      },
      {
        type: 'improved',
        text: 'Every way of adding a trade now uses the same math',
        description: 'The trade form, the dashboard quick-add, the calendar quick-add and CSV imports all share one calculation, so the same trade shows the same P&L everywhere.',
      },
    ],
  },
  {
    version: '2.49.0',
    date: '2026-07-02',
    summary: 'Import from any broker — AI maps unfamiliar CSVs for Pro, and we remember your layouts.',
    items: [
      {
        type: 'new',
        text: 'AI column mapping for any broker (Pro)',
        description: 'Upload a CSV we don’t recognize and Pro members get its columns mapped automatically by AI — no manual matching. Free members can still map columns by hand as before.',
      },
      {
        type: 'improved',
        text: 'We remember your import layouts',
        description: 'Once you map an unfamiliar broker’s columns, we remember that layout and apply it automatically the next time you import the same export.',
      },
      {
        type: 'fixed',
        text: 'Import NinjaTrader trade exports',
        description: 'NinjaTrader’s trade export now imports automatically, with wins, losses and commissions recorded correctly — so your imported P&L matches NinjaTrader exactly.',
      },
    ],
  },
  {
    version: '2.48.3',
    date: '2026-06-30',
    summary: 'Tradovate’s Orders History export now imports reliably.',
    items: [
      {
        type: 'fixed',
        text: 'Import Tradovate’s Orders History export',
        description: 'Some Tradovate Orders History files failed to import and showed “missing required columns.” They now import automatically, pairing your fills into completed trades. No column renaming needed.',
      },
    ],
  },
  {
    version: '2.48.2',
    date: '2026-06-30',
    summary: 'Tradovate’s Trades export now imports directly.',
    items: [
      {
        type: 'fixed',
        text: 'Import Tradovate’s Trades (performance) export',
        description: 'The Trades export from Tradovate — with buy/sell prices and realized P&L — now imports automatically, alongside the Orders export we already supported. No column renaming needed.',
      },
    ],
  },
  {
    version: '2.48.1',
    date: '2026-06-30',
    summary: 'Small refinements to the feedback form — a cleaner look and a smoother bug-reporting flow.',
    items: [
      {
        type: 'fixed',
        text: 'Bug reports no longer ask for a testimonial',
        description: 'After sending a bug report you go straight to the confirmation, instead of occasionally being asked to share a testimonial.',
      },
      {
        type: 'improved',
        text: 'A more polished feedback form',
        description: 'The feedback dialog has a refreshed header and a cleaner, consistent look for the feedback-type buttons, with clearer keyboard focus throughout.',
      },
    ],
  },
  {
    version: '2.48.0',
    date: '2026-06-30',
    summary: 'Reporting a bug is faster and more useful — attach a screenshot and the feedback form adapts to what you are sending.',
    items: [
      {
        type: 'new',
        text: 'Attach a screenshot to bug reports',
        description: 'When you report a bug you can now add an image so we can see exactly what you saw. It is compressed automatically before sending.',
      },
      {
        type: 'improved',
        text: 'A smarter feedback form',
        description: 'The form now asks what kind of feedback you are sending first, then shows only what is relevant — a rating for general feedback and feature requests, and bug-specific details for bug reports.',
      },
    ],
  },
  {
    version: '2.47.0',
    date: '2026-06-30',
    summary: 'Your Goals & Risk page now keeps up with your trades in real time, and earned achievements stay earned.',
    items: [
      {
        type: 'fixed',
        text: 'Achievements stay earned',
        description: 'A goal you have already hit no longer disappears from the Achievements tab when a new week or month begins.',
      },
      {
        type: 'improved',
        text: 'Goals and risk limits keep up with your trades',
        description: 'The Goals & Risk page now reflects trades you add or edit elsewhere right away, and your risk limits are checked against them, instead of only updating after a page reload.',
      },
    ],
  },
  {
    version: '2.46.0',
    date: '2026-06-30',
    summary: 'Journal entries now keep their formatting — line breaks, headings, and bold all show the way you wrote them.',
    items: [
      {
        type: 'fixed',
        text: 'Journal entries keep their line breaks',
        description: 'Saved entries no longer collapse into one run-on paragraph — paragraphs, blank lines, and lists now display just as you typed them.',
      },
      {
        type: 'improved',
        text: 'Formatted journal entries',
        description: 'Entries support light formatting: headings, bold text, and bullet or numbered lists. The Pre-Trade, Post-Trade, and Daily Review templates now insert tidy, headed sections instead of plain text.',
      },
    ],
  },
  {
    version: '2.45.0',
    date: '2026-06-30',
    summary: 'Goals & Risk Management is redesigned into clear tabs with a single home for everything risk.',
    items: [
      {
        type: 'improved',
        text: 'Goals & Risk Management split into tabs',
        description: 'The page is now organised into Goals, Risk Limits, and Achievements tabs instead of one long stacked screen, so each area is easier to find and work with.',
      },
      {
        type: 'improved',
        text: 'One place for all your risk',
        description: 'The Risk Limits tab now shows your per-trade risk from Settings (account size, risk per trade, max risk per trade, and how many losers would blow the account) and a read-only view of your prop firm drawdown limits, so you can see how protected you are at a glance.',
      },
      {
        type: 'new',
        text: 'Edit a goal without recreating it',
        description: 'Goals can now be edited in place to change the target, type, or period, instead of deleting and adding a new one.',
      },
      {
        type: 'improved',
        text: 'Clearer goals and limits',
        description: 'Loss and drawdown caps now live only under Risk Limits rather than being mixed in with goals, and goals cover profit, win rate, trade count, and risk/reward targets.',
      },
      {
        type: 'fixed',
        text: 'Achievement celebrations no longer mis-fire',
        description: 'Goal achievements are now detected reliably and only celebrated once, and breach counts on risk limits reset each day so they stay meaningful.',
      },
    ],
  },
  {
    version: '2.44.0',
    date: '2026-06-30',
    summary: 'A cleaner, clearer PropTracker and Trade Journal — calmer cards, a redesigned risk calculator, and tighter layouts.',
    items: [
      {
        type: 'improved',
        text: 'Refreshed Trade Journal layout',
        description: 'The journal summary cards are more compact and line up in a single row, entry cards drop the colored side accent and busy tints for a calmer look, and the list spacing is tighter so you can scan more at once.',
      },
      {
        type: 'fixed',
        text: 'Journal "Read more" only shows when there is more to read',
        description: 'The Read more / Show less toggle on a journal entry now appears only when the note is actually truncated, instead of showing on shorter entries where it did nothing.',
      },
      {
        type: 'fixed',
        text: 'Card contents no longer sit flush against the top edge',
        description: 'Fixed a spacing issue where the contents of several cards (PropTracker summaries and account cards, journal cards, coach cards) were pinned to the top edge on larger screens, leaving uneven empty space below.',
      },
      {
        type: 'fixed',
        text: 'Funded accounts no longer show a challenge profit target',
        description: 'Funded and instant-funding accounts now show a "Risk Limits" section with your drawdown limits, instead of an evaluation "Challenge Progress" bar and profit target that no longer applies once you are funded.',
      },
      {
        type: 'fixed',
        text: 'Clearer wording on failed accounts',
        description: 'A failed or closed account now shows your net loss instead of telling you how much more is needed "to break even", which only makes sense for an account you can still recover.',
      },
      {
        type: 'fixed',
        text: 'Trading days no longer count past the requirement',
        description: 'Once you have met the minimum trading days, the count now caps at the requirement (for example 4 / 4) instead of showing more days than required.',
      },
      {
        type: 'improved',
        text: 'Calmer, less cluttered account cards',
        description: 'Account cards are toned down so the numbers stand out: the invested/earned/P&L tiles use a plain neutral background instead of coloured tints and borders, the cost-recovery note is now plain text, and the small status dot was removed. Cards in a row also stay the same height with their buttons aligned along the bottom, so there is no awkward empty space.',
      },
      {
        type: 'improved',
        text: 'Redesigned risk calculator',
        description: 'The "If I lose..." calculator now has quick-amount buttons and a "Max safe" button that fills in the largest loss you can take before any active challenge breaches. Each account shows a before/after drawdown bar so you can see at a glance how close a loss pushes you to the limit, and the empty state tells you your tightest buffer for the day.',
      },
      {
        type: 'improved',
        text: 'Summary cards line up across the top',
        description: 'Total Invested, Total Earned, P&L, and Active Accounts now sit in a single row on desktop instead of an uneven layout where P&L stretched across the width.',
      },
      {
        type: 'fixed',
        text: 'The5ers logo now visible in dark mode',
        description: 'Firm logos sit on a light tile so dark logos like The5ers no longer disappear against the dark background.',
      },
    ],
  },
  {
    version: '2.43.0',
    date: '2026-06-23',
    summary: 'The AI coach chat now gives sharper, safer advice based on your full trading history.',
    items: [
      {
        type: 'improved',
        text: 'Smarter AI coach chat',
        description: 'The coach now reads your full account history broken down by instrument, strategy, and direction, instead of just your last few trades. It ranks what you trade by how many times you have traded it, so a couple of lucky wins on one symbol no longer get called your "best setup".',
      },
      {
        type: 'improved',
        text: 'Honest answers about small samples and setups',
        description: 'The coach now tells you when there are too few trades to draw a conclusion, judges performance by risk and consistency rather than raw dollar profit, and will not tell you to size up just because something has been working lately. If your trades are not tagged with a strategy, it says so instead of guessing.',
      },
    ],
  },
  {
    version: '2.42.0',
    date: '2026-06-18',
    summary: 'Journal entries now save reliably, stay separate per account, and you can add your own prop firm.',
    items: [
      {
        type: 'fixed',
        text: 'Journal entries save reliably',
        description: 'Saving a journal entry now waits until it is fully stored before confirming, so entries no longer disappear when you refresh right after saving. If your device storage is ever full, you now get a clear message instead of a silent failure.',
      },
      {
        type: 'fixed',
        text: 'Opening a journaled trade edits your existing note',
        description: 'Clicking the journal icon on a trade you have already journaled now opens that entry for editing, instead of starting a blank new one over it.',
      },
      {
        type: 'fixed',
        text: 'Multiple screenshots attach reliably',
        description: 'Chart screenshots are now optimized automatically and stored more efficiently, so entries with several images save without issue.',
      },
      {
        type: 'fixed',
        text: 'Journal entries stay separate per account',
        description: 'Each trading account now keeps its own journal, matching how trades already work. Existing entries are kept and assigned to your default account.',
      },
      {
        type: 'new',
        text: 'Add your own prop firm or broker',
        description: 'When creating an account or logging a trade, you can now choose "Custom…" and type any prop firm or broker name that is not in the list — including firms like Lucid and Tradeify.',
      },
      {
        type: 'new',
        text: 'Screenshots sync across devices on Pro',
        description: 'Chart screenshots you attach to journal entries now follow your account across devices on Pro. Free accounts keep screenshots on the device they were added on.',
      },
    ],
  },
  {
    version: '2.41.0',
    date: '2026-06-17',
    summary: 'Fixed a blank dashboard caused by a single trade or journal entry with an unreadable date.',
    items: [
      {
        type: 'fixed',
        text: 'Dashboard no longer goes blank on a bad date',
        description: 'A single trade or journal entry with an unreadable date could crash the whole dashboard to a blank page after login. The dashboard now stays up — affected dates show a dash, and the rest of your stats load normally.',
      },
      {
        type: 'improved',
        text: 'One broken section no longer takes down the page',
        description: 'Each dashboard section is now isolated, so if one fails to load it shows a small "try again" message instead of blanking the entire screen.',
      },
    ],
  },
  {
    version: '2.40.0',
    date: '2026-06-17',
    summary: 'CSV import now works with far more brokers and regions, and behaves the same from the dashboard or the trade log.',
    items: [
      {
        type: 'improved',
        text: 'Imports work with more brokers and regions',
        description: 'CSV import now handles European files (semicolon-separated with comma decimals), tab-separated files, 12-hour AM/PM times, day-first (DD/MM) dates, Buy/Sell shorthand, and reports with title rows above the data.',
      },
      {
        type: 'fixed',
        text: 'Unreadable files are rejected clearly',
        description: 'Files in a format we cannot understand are now clearly rejected, instead of silently importing scrambled trades.',
      },
      {
        type: 'fixed',
        text: 'Consistent imports from the dashboard and trade log',
        description: 'Importing the same file from the dashboard or the trade log now produces identical trades, and both offer manual column mapping when a format is not recognized automatically.',
      },
    ],
  },
  {
    version: '2.39.0',
    date: '2026-06-17',
    summary: 'The free plan now includes up to 100 journal entries, and Pro unlocks unlimited journaling.',
    items: [
      {
        type: 'new',
        text: 'Unlimited journal entries on Pro',
        description: 'The free plan includes up to 100 journal entries, and any entries you already have always stay — fully readable and editable. Upgrade to Pro for unlimited journaling.',
      },
    ],
  },
  {
    version: '2.38.0',
    date: '2026-06-17',
    summary: 'CSV import now reads IC Markets and MetaTrader 5 position-history files correctly.',
    items: [
      {
        type: 'new',
        text: 'Import IC Markets / MetaTrader 5 position history',
        description: 'MT5 position-history exports (IC Markets, Pepperstone, and similar) now import directly. Each position is paired from its open and close legs into a single trade with the right direction, entry and exit prices, size, and profit, instead of being split into duplicated half-trades.',
      },
      {
        type: 'fixed',
        text: 'Imported trades now keep their real dates and times',
        description: 'Trades imported from the dashboard could come in with a missing or invalid date. They now carry the correct entry and exit dates and times from your file.',
      },
      {
        type: 'fixed',
        text: 'Dashboard updates immediately after importing',
        description: 'Importing trades now refreshes your stats and charts straight away, instead of needing a page reload to show the new trades.',
      },
    ],
  },
  {
    version: '2.37.0',
    date: '2026-06-17',
    summary: 'Market prices are now a dashboard section you can show, hide, and reorder like everything else.',
    items: [
      {
        type: 'new',
        text: 'Show or hide market prices from Customize',
        description: 'The live market prices strip is now a dashboard section. Open Customize to turn it on or off and drag it into the order you prefer, just like your other sections.',
      },
      {
        type: 'fixed',
        text: 'Equity curve no longer errors with no trades',
        description: 'The equity curve could fail to load before you had logged any trades. It now shows a friendly empty state instead.',
      },
      {
        type: 'fixed',
        text: 'Dashboard and settings changes stick on synced accounts',
        description: 'On Pro accounts, a settings or dashboard layout change made right after opening the app could quietly revert on the next refresh. Your changes are now kept and synced reliably.',
      },
    ],
  },
  {
    version: '2.36.0',
    date: '2026-06-14',
    summary: 'A big pass on the mobile experience — your stats, calendar, and journal now fit phone screens properly.',
    items: [
      {
        type: 'improved',
        text: 'Stats cards fit your phone',
        description: 'The dashboard metric cards no longer flash a cramped, squished layout while loading, and your numbers and charts now sit comfortably on small screens.',
      },
      {
        type: 'improved',
        text: 'Easier to tap on mobile',
        description: 'Buttons, tabs, filters, and the account switcher are now larger and easier to hit on touch screens across the dashboard, trade log, settings, and more.',
      },
      {
        type: 'fixed',
        text: 'Every control now reachable on phones',
        description: 'Reset, edit, and delete controls on goals, risk rules, and prop-tracker transactions used to only appear on hover — they now show on phones so you can manage everything without a mouse.',
      },
      {
        type: 'improved',
        text: 'Cleaner calendar and journal on small screens',
        description: 'Trading calendar day cells, weekly totals, the journal stats, and entry-type tabs now lay out neatly on phones instead of overlapping or overflowing.',
      },
      {
        type: 'improved',
        text: 'Tidier dialogs and cards',
        description: 'Pop-up dialogs no longer run edge to edge, and cards use tighter spacing on phones so there is more room for your content.',
      },
    ],
  },
  {
    version: '2.35.0',
    date: '2026-06-13',
    summary: 'You can now customize your dashboard — hide widgets you do not use and drag them into the order you prefer.',
    items: [
      {
        type: 'new',
        text: 'Customize your dashboard',
        description: 'A new Customize button on the dashboard lets you tailor it to how you trade. Your layout is remembered and stays the same across visits.',
      },
      {
        type: 'new',
        text: 'Show or hide any section',
        description: 'Hide the sections you do not use — like market news or the economic calendar — and keep only what matters to you. Your key metrics always stay on.',
      },
      {
        type: 'new',
        text: 'Drag sections into any order',
        description: 'Rearrange your dashboard by dragging sections into the order you prefer.',
      },
      {
        type: 'new',
        text: 'Reorder with your keyboard',
        description: 'Pick up a section and use the arrow keys to move it, no mouse required.',
      },
      {
        type: 'improved',
        text: 'Reset to the default layout anytime',
        description: 'Changed your mind? Reset your dashboard back to the default layout in one click.',
      },
      {
        type: 'new',
        text: 'Pro: your layout syncs across devices',
        description: 'Pro members now have their dashboard layout sync automatically across all their devices, alongside trades and journal entries.',
      },
    ],
  },
  {
    version: '2.34.0',
    date: '2026-06-12',
    summary: 'The trading calendar now shows a weekly P&L total for each week.',
    items: [
      {
        type: 'new',
        text: 'Weekly P&L on the calendar',
        description: 'Each week row on the trading calendar now ends with that week’s total profit or loss, so you can see weekly performance at a glance alongside the daily and monthly figures. Weekly totals add up to the monthly P&L shown above the calendar.',
      },
      {
        type: 'improved',
        text: 'Clearer trade log header',
        description: 'The All Trades header now shows a count badge and the date range your trades span, and reflects how many trades match when filters are active.',
      },
    ],
  },
  {
    version: '2.33.0',
    date: '2026-06-12',
    summary: 'You can now sort your trade log, and the filter bar is cleaner and easier to use.',
    items: [
      {
        type: 'new',
        text: 'Sort your trade log',
        description: 'A new Sort control in the trade log filter bar lets you order your trades by date, P&L, or symbol, ascending or descending.',
      },
      {
        type: 'improved',
        text: 'Cleaner trade log filters',
        description: 'The filter bar now sits neatly alongside the All Trades heading, and the date range filter uses a single calendar that is easier to pick a range with.',
      },
      {
        type: 'improved',
        text: 'Clearer trade selection',
        description: 'The select-all checkbox now selects the trades on the current page and shows a partial state when only some are selected. When a page is fully selected, a Select all matching option lets you grab every filtered trade at once for bulk delete.',
      },
      {
        type: 'improved',
        text: 'More useful All Trades heading',
        description: 'The All Trades heading now shows the trade count as a pill and the date range your trades span, and clearly says how many trades match when filters are active.',
      },
    ],
  },
  {
    version: '2.32.0',
    date: '2026-06-12',
    summary: 'Switching the Stop Loss / Take Profit unit now keeps your levels correct.',
    items: [
      {
        type: 'fixed',
        text: 'Stop Loss / Take Profit unit switching',
        description: 'When you switch the Stop Loss / Take Profit input between price level and pips/points, the values you already entered are now re-expressed in the new unit so they keep pointing at the same level — instead of the number staying put and silently changing meaning. If no entry price is set yet, the fields clear with a reminder to add one first.',
      },
    ],
  },
  {
    version: '2.31.0',
    date: '2026-06-12',
    summary: 'You can now paste a screenshot straight into a journal entry.',
    items: [
      {
        type: 'new',
        text: 'Paste screenshots into journal entries',
        description: 'While writing a journal entry, paste a chart screenshot directly from your clipboard with Cmd+V (or Ctrl+V) — no need to save the image first. Dragging and dropping or browsing for files still works too.',
      },
    ],
  },
  {
    version: '2.30.0',
    date: '2026-06-12',
    summary: 'You can now start a journal entry for any trade straight from the Trade Log.',
    items: [
      {
        type: 'new',
        text: 'Journal a trade from the Trade Log',
        description: 'Each trade in the Trade Log now has a journal button in its actions. Tapping it opens the Journal with a new entry already linked to that trade, with the title, mood, and tags pre-filled from the trade.',
      },
    ],
  },
  {
    version: '2.29.0',
    date: '2026-06-12',
    summary: 'You can now filter your trade log by symbol, side, market, outcome, strategy, and date range.',
    items: [
      {
        type: 'new',
        text: 'Trade Log filters',
        description: 'A filter bar above your trade log lets you narrow trades by symbol, side, market, outcome (winners, losers, breakeven), strategy, and date range. Active filters show as removable pills, your stats and totals update to match, and your filter choices are remembered between visits.',
      },
    ],
  },
  {
    version: '2.28.0',
    date: '2026-06-12',
    summary: 'The Pairs Performance and Trade Distribution cards on the dashboard have a cleaner, more readable design.',
    items: [
      {
        type: 'improved',
        text: 'Refined dashboard chart cards',
        description: 'The Pairs Performance and Trade Distribution cards now show their key figures as clearly labelled stats with thousands separators (for example +$10,618.19), with tidied-up titles and spacing.',
      },
    ],
  },
  {
    version: '2.27.0',
    date: '2026-06-12',
    summary: 'You can now drag and drop a CSV file to import your trades.',
    items: [
      {
        type: 'new',
        text: 'Drag and drop CSV import',
        description: 'Drop a CSV or Excel file straight onto the import box on the dashboard, or anywhere on the Trade Log page, to import your trades — no need to click and browse for the file.',
      },
    ],
  },
  {
    version: '2.26.0',
    date: '2026-06-12',
    summary: 'AI Trade Analysis now numbers its points correctly and reads more cleanly.',
    items: [
      {
        type: 'fixed',
        text: 'Correct numbering in AI analysis',
        description: 'Numbered points in AI Trade Analysis now count up 1, 2, 3 instead of every item showing as 1.',
      },
      {
        type: 'improved',
        text: 'Cleaner AI writing',
        description: 'Coach FTJ and AI Trade Analysis no longer use long dashes; the text now reads with normal commas and hyphens.',
      },
    ],
  },
  {
    version: '2.25.0',
    date: '2026-06-12',
    summary: 'The AI Coach page is redesigned to show all your insights at once, with the standard navigation restored, a more detailed Tilt Meter, and smarter coaching advice.',
    items: [
      {
        type: 'improved',
        text: 'Redesigned AI Coach page',
        description: 'The AI Coach page now fills the full width of the screen and shows all of Coach FTJ’s insights at once as a grid, with a tilt and key-numbers overview at the top and a wider AI trade analysis below, instead of rotating through one tip at a time.',
      },
      {
        type: 'fixed',
        text: 'AI Coach navigation restored',
        description: 'The AI Coach page now has the same top header, sidebar toggle, and breadcrumbs as the rest of the app.',
      },
      {
        type: 'improved',
        text: 'More detailed Tilt Meter',
        description: 'The Tilt Meter now shows your numeric score out of 100 and a short, situation-specific recommendation for what to do next.',
      },
      {
        type: 'improved',
        text: 'Smarter coaching advice',
        description: 'Coach FTJ no longer suggests forcing a set number or direction of trades; its tips focus on process, risk management, and discipline.',
      },
      {
        type: 'fixed',
        text: 'Clearer risk-reward on the calendar',
        description: 'Days with no losing trades now show an infinity symbol with a “No losing trades” note, so the risk-reward figure is easy to understand.',
      },
    ],
  },
  {
    version: '2.24.0',
    date: '2026-06-12',
    summary: 'The AI features are easier to find and far more usable on the free plan, with a dedicated AI Coach page and clearer labels.',
    items: [
      {
        type: 'improved',
        text: 'Much more free AI',
        description: 'Free accounts now get 20 AI runs per month instead of 3, so you can actually try the AI tools — trade analysis, trade review, journal prompts, the coach, and more — before deciding on Pro.',
      },
      {
        type: 'new',
        text: 'AI Coach page',
        description: 'A new AI Coach entry in the sidebar brings Coach FTJ and AI trade analysis together on one page, so the AI features are easy to find instead of scattered around the app.',
      },
      {
        type: 'improved',
        text: 'Clearer AI labels',
        description: 'The per-trade review and tagging buttons now clearly say AI, and the Trade Insights description was corrected, so it is obvious which features are powered by AI.',
      },
      {
        type: 'improved',
        text: 'AI Coach feedback sooner',
        description: 'Coach FTJ now starts giving AI feedback after your first logged trade instead of three, and onboarding and empty screens point you to the AI Coach so it is easy to find from day one.',
      },
    ],
  },
  {
    version: '2.23.0',
    date: '2026-06-12',
    summary: 'A new macro snapshot on the dashboard shows where rates and inflation stand at a glance — useful context if you trade index or rate futures — plus settings to hide the market strip for a cleaner dashboard.',
    items: [
      {
        type: 'new',
        text: 'Macro snapshot on the dashboard',
        description: 'A compact strip near the top of the dashboard now shows the latest Fed funds rate, 10-year and 2-year Treasury yields, the yield curve spread, year-over-year CPI inflation, and the unemployment rate, each with a small arrow for its latest move. It gives quick economic context alongside your live market prices.',
      },
      {
        type: 'new',
        text: 'Hide the dashboard market strip',
        description: 'Settings, General, Dashboard now has switches to turn off the live market prices and the macro snapshot independently, so you can keep a cleaner dashboard if you prefer.',
      },
      {
        type: 'improved',
        text: 'Redesigned performance charts',
        description: 'The equity curve now shows green above your break-even line and red below it, with quick Net, Peak, and deepest-dip figures and a clearer hover that breaks down each trade and your running total. The daily P&L view gets the same polish, with best day, worst day, and average-per-day figures and a cleaner tooltip.',
      },
    ],
  },
  {
    version: '2.22.0',
    date: '2026-06-11',
    summary: 'Fixes for date selection when logging trades, and Topstep imports now subtract both commissions and fees so your P&L is net automatically.',
    items: [
      {
        type: 'fixed',
        text: 'Pick dates when logging a trade',
        description: 'Choosing an entry or exit date from the calendar now works inside the add and edit trade dialog, as well as the prop tracker and export date pickers. Previously the calendar would close without saving your selection.',
      },
      {
        type: 'improved',
        text: 'Topstep fees subtracted automatically',
        description: 'Topstep exports list commissions and fees in separate columns. Both are now imported and subtracted from your P&L automatically, so the dashboard shows your true net result with no manual entry. Trades also have a dedicated Fees field alongside Commission.',
      },
    ],
  },
  {
    version: '2.21.0',
    date: '2026-06-10',
    summary: 'A new Navy Gold theme: deep navy with a warm gold accent across the whole app.',
    items: [
      {
        type: 'new',
        text: 'Navy Gold color theme',
        description: 'A new theme pairing rich navy backgrounds and a navy sidebar with a warm gold accent, across both light and dark mode. Pick it under Settings, Color Theme.',
      },
    ],
  },
  {
    version: '2.20.0',
    date: '2026-06-10',
    summary: 'Smarter CSV imports and a fix for editing trades: Topstep exports import directly without column edits, commissions and fees come in automatically, and you can now search and change the instrument on a trade.',
    items: [
      {
        type: 'improved',
        text: 'Topstep CSV imports work out of the box',
        description: 'Topstep trade exports now import correctly as-is, with entry and exit prices, times, and direction all mapped automatically. No need to rename or reformat columns first.',
      },
      {
        type: 'new',
        text: 'Commissions and fees pulled from your CSV',
        description: 'When your broker export includes a commission or fees column, those values are now imported and filled in for you instead of having to enter them by hand on each trade.',
      },
      {
        type: 'fixed',
        text: 'Change the instrument when editing a trade',
        description: 'The instrument picker inside the edit and add trade dialog can now be searched and selected properly, so you can switch a trade from one symbol to another (for example NQ to MNQ).',
      },
    ],
  },
  {
    version: '2.19.0',
    date: '2026-06-10',
    summary: 'Fixes and improvements to the trade form: imported P&L stays accurate when you edit, Stop Loss and Take Profit can be entered as pips or points, R:R fills in for you, and trade times are easier to edit.',
    items: [
      {
        type: 'fixed',
        text: 'Imported P&L stays correct when editing',
        description: 'Editing an imported trade no longer recalculates and changes its P&L to a wrong value. Your broker P&L is kept as-is, and any commission or swap you add is simply subtracted from it.',
      },
      {
        type: 'new',
        text: 'Enter Stop Loss and Take Profit in pips or points',
        description: 'A new unit selector lets you type your stop and target as a price level, or as a distance in pips (forex) or points (futures and indices) from your entry.',
      },
      {
        type: 'improved',
        text: 'Risk-to-reward fills in automatically',
        description: 'The R:R ratio now shows its calculated value directly in the field as soon as you enter a stop and target. You can still type your own value to override it.',
      },
      {
        type: 'fixed',
        text: 'Edit entry and exit times directly',
        description: 'Trade times now have an always-visible time field next to the date, so you can adjust the exact hour and minute without digging through a calendar pop-up.',
      },
    ],
  },
  {
    version: '2.18.0',
    date: '2026-06-10',
    summary: 'Live market context comes to your dashboard: a real-time price ticker, an economic calendar, a market news feed, and mini price charts right where you log trades. Plus a friendlier AI Coach for prop accounts.',
    items: [
      {
        type: 'new',
        text: 'Live market price ticker',
        description: 'A real-time ticker at the top of your dashboard shows prices and daily change for the instruments you trade most, adapting to your forex, futures, or index history.',
      },
      {
        type: 'new',
        text: 'Economic calendar',
        description: 'See upcoming medium and high impact economic events with countdowns, currency filters, and a high-impact-only toggle so you know what is moving the markets.',
      },
      {
        type: 'new',
        text: 'Market news feed',
        description: 'Stay on top of the latest general, forex, and crypto headlines from your dashboard, with symbol-specific news shown when you open a trade.',
      },
      {
        type: 'new',
        text: 'Mini price charts when logging trades',
        description: 'A live mini chart now appears as you pick a symbol in the add and edit trade dialogs, giving you instant context on price action.',
      },
      {
        type: 'improved',
        text: 'AI Coach for prop accounts',
        description: 'The prop firm analysis now reads like a coaching session with a sharp mentor instead of a clinical report, with clearer sections and plain-language next steps.',
      },
    ],
  },
  {
    version: '2.17.0',
    date: '2026-06-10',
    summary: 'Redesigned Share Stats card with personalization, equity curve, and a polished sharing dialog. Plus smarter onboarding that stays out of your way.',
    items: [
      {
        type: 'improved',
        text: 'Share Stats card redesign',
        description: 'The card now shows your name, an initials avatar, a win/loss bar, an equity curve sparkline, and accents in your theme colors. A period selector lets you share This Month, Quarter, Year, or All Time stats.',
      },
      {
        type: 'fixed',
        text: 'Share Stats copy, download, and share buttons now work',
        description: 'The action buttons were broken due to a canvas API issue. All three now function correctly.',
      },
      {
        type: 'improved',
        text: 'Premium sharing dialog',
        description: 'The sharing dialog now uses a dark frosted-glass design with period selector pills and action buttons styled to match the card.',
      },
      {
        type: 'improved',
        text: 'Onboarding checklist auto-collapses',
        description: 'Once you have completed 3 or more steps, the Get Started checklist collapses to a slim progress bar. Your preference is remembered across sessions.',
      },
    ],
  },
  {
    version: '2.16.0',
    date: '2026-06-10',
    summary: 'CSV imports now preserve actual trade times, and a new Risk Management section lets you log Stop Loss, Take Profit, and R:R ratio on every trade.',
    items: [
      {
        type: 'fixed',
        text: 'CSV imports now keep the real trade time',
        description: 'Previously, all imported trades showed as 12:00 AM regardless of the actual time in your broker export. Now the correct timestamps are preserved from TopStep, Tradovate, IBKR, MetaTrader, and standard CSV files.',
      },
      {
        type: 'new',
        text: 'Stop Loss and Take Profit fields on the trade form',
        description: 'Log your planned SL and TP levels on every trade. Values are shown in the expanded trade detail view.',
      },
      {
        type: 'new',
        text: 'Risk:Reward ratio input',
        description: 'Enter your R:R manually, or let it auto-calculate from your Stop Loss and Take Profit. The calculated value shows in the placeholder so you always know what the math says.',
      },
      {
        type: 'improved',
        text: 'Trade times shown in the trade table',
        description: 'The date column now displays the time alongside the date when a trade has a non-midnight timestamp.',
      },
    ],
  },
  {
    version: '2.15.0',
    date: '2026-06-09',
    summary: 'Major UI polish across every page. Warm white light mode, amber-tinted hovers, redesigned forms, and a login reliability fix.',
    items: [
      {
        type: 'improved',
        text: 'Journal page',
        description: 'New entry form reorganized into Writing, Mindset, Context, and Screenshots sections with icon headers. Mood and emotions are now grouped together. Journal entries show a colored accent by sentiment for quick visual scanning.',
      },
      {
        type: 'improved',
        text: 'Goals & Risk Management page',
        description: 'Clearer layout with separate sections for Goals, Risk Management, and Achievements. Each section has its own header, description, and improved empty states that explain what to do and why.',
      },
      {
        type: 'improved',
        text: 'Calendar trade and journal forms',
        description: 'The forms you see when clicking a date on the calendar heatmap have been completely redesigned with organized card sections, icons, and cleaner layout.',
      },
      {
        type: 'improved',
        text: 'Share stats card',
        description: 'Refreshed copy, added the FTJ logo, and removed visual clutter from the downloadable performance card.',
      },
      {
        type: 'improved',
        text: 'Dashboard trade form',
        description: 'Redesigned with Manual and Import tabs. CSV import is now front and center with a full upload panel and supported broker list. Manual entry fields are reorganized into logical sections: Setup, Execution, Context, and Mindset.',
      },
      {
        type: 'fixed',
        text: 'Cleaned up UI text across the app',
        description: 'Removed stray symbols from dropdowns, toasts, and labels for a more polished look.',
      },
      {
        type: 'improved',
        text: 'Polished Trade Log page with improved form sections and page header',
      },
      {
        type: 'improved',
        text: 'Updated Settings, Profile, and Trade Ideas pages with consistent styling',
      },
      {
        type: 'improved',
        text: 'Warm white light mode theme and amber-tinted hover states',
      },
      {
        type: 'fixed',
        text: 'Fixed prop firm logo rendering in dark mode',
      },
      {
        type: 'fixed',
        text: 'FTJ logo outline removed',
        description: 'The dark outline around the FTJ logo in the sidebar and mobile header has been fixed.',
      },
      {
        type: 'fixed',
        text: 'Returning users no longer hit onboarding after logging back in',
        description: 'A race condition between login and data decryption could send existing users through onboarding again. Fixed by letting the protected route handle the check after decryption completes.',
      },
    ],
  },
  {
    version: '2.14.0',
    date: '2026-06-08',
    summary: 'Free AI access for all users. Full visual redesign of PropTracker, Trade Ideas, and Settings. Onboarding overhaul. Prop firm review pages.',
    items: [
      {
        type: 'new',
        text: 'Free AI access for all users',
        description: 'Every user now gets 3 free AI queries per month. Use them on any AI feature — Coach FTJ, Trade Review, Strategy Tagger, Risk Alerts, Journal Prompts, or Goal Coach. No credit card required. Resets monthly.',
      },
      {
        type: 'improved',
        text: 'Coach FTJ',
        description: 'Coach FTJ now detects tilt, scoring how tilted you are from recent losses, trade emotions, and trading speed. A streaming chat also lets you ask follow-up questions.',
      },
      {
        type: 'improved',
        text: 'PropTracker visual redesign',
        description: 'Cleaner stat cards, bigger charts, and a refreshed Success Rate Dashboard. Everything is easier to read at a glance.',
      },
      {
        type: 'improved',
        text: 'Trade Ideas page redesign',
        description: 'Direction Split and Trader Profile cards are redesigned with centered charts, cleaner stat panels, and better use of space.',
      },
      {
        type: 'improved',
        text: 'Settings page navigation',
        description: 'Replaced the sidebar navigation with a single horizontal sticky tab bar that works the same on mobile and desktop. Wider layout to make better use of screen space.',
      },
      {
        type: 'improved',
        text: 'AI Trade Analysis empty state',
        description: 'Before you have enough trades for a full analysis, the page now previews exactly what AI insights you will get.',
      },
      {
        type: 'improved',
        text: 'Referral program',
        description: 'Lowered the threshold from 5 to 3 friends. After logging a winning trade, you now get a contextual nudge to share your referral link. Dismissing the banner hides it for 7 days instead of permanently.',
      },
      {
        type: 'improved',
        text: 'Onboarding redesign',
        description: 'New users now see the real FreeTradeJournal logo, cleaner copy, and a working experience level selector during setup.',
      },
      {
        type: 'new',
        text: 'Prop firm review pages',
        description: 'In-depth reviews for FTMO, The5ers, and Top One Futures with pricing breakdowns, pros and cons, and comparison tables. Available from the affiliate page.',
      },
      {
        type: 'fixed',
        text: 'Icon rendering bugs',
        description: 'Fixed several places where icon component names appeared as literal text instead of rendering as icons, including the Settings edit button, PropTracker account dialog, feedback button, and Journal page.',
      },
    ],
  },
  {
    version: '2.13.0',
    date: '2026-06-05',
    summary: 'Smarter PropTracker AI with score cards, redesigned Goals page, referral program on the dashboard, and an AI usage fix.',
    items: [
      {
        type: 'new',
        text: 'Referral banner on Dashboard',
        description: 'Invite 3 friends who sign up and log a trade to earn 14 days of Pro free. Your referral link, progress bar, and share buttons are now front and center on the dashboard.',
      },
      {
        type: 'improved',
        text: 'PropTracker AI Analysis',
        description: 'The AI now sees your challenge rules, progress toward profit targets, drawdown risk, and cross-firm patterns (pass rate, cost per attempt, reset count). Responses include a 1-10 score card and a new Challenge Progress section.',
      },
      {
        type: 'improved',
        text: 'Goals & Risk Management page',
        description: 'Redesigned stat cards with colored icons, mini arc gauges, and a completion rate metric. Risk section now shows a health gauge with overall utilization. Achievement cards have a polished trophy-badge look.',
      },
      {
        type: 'fixed',
        text: 'AI daily usage limits not resetting',
        description: 'Using one AI feature on a new day could leave other features stuck at their previous day\'s count, showing "limit reached" even with no usage. Counters now reset correctly across all features.',
      },
    ],
  },
  {
    version: '2.12.0',
    date: '2026-06-04',
    summary: 'Major PropTracker upgrade with challenge rules, success tracking, risk calculator, and a new affiliate page.',
    items: [
      {
        type: 'new',
        text: 'PropTracker Challenge Rules',
        description: 'Set and track drawdown limits, profit targets, daily loss caps, and other challenge rules for each prop firm account. Rules are checked automatically so you always know where you stand.',
      },
      {
        type: 'new',
        text: 'PropTracker Success Rate Dashboard',
        description: 'See your pass/fail rate across challenges with visual breakdowns. Understand which firms and account sizes you perform best on.',
      },
      {
        type: 'new',
        text: 'PropTracker Risk Calculator',
        description: 'Estimate your risk exposure per challenge based on account size, fees, and rules. Know your break-even point before you start.',
      },
      {
        type: 'new',
        text: 'PropTracker Quick Check-In',
        description: 'Fast daily status update for active challenges. Log your current P&L and rule compliance in seconds.',
      },
      {
        type: 'new',
        text: 'PropTracker Cost Recovery tracker',
        description: 'Track how much you have spent on challenges versus earned back. See your true ROI across all prop firm attempts.',
      },
      {
        type: 'new',
        text: 'Affiliate page',
        description: 'Curated partner deals on prop firms, tools, and services. Available from the sidebar.',
      },
      {
        type: 'fixed',
        text: 'Data loss when signing in on a new device',
        description: 'Signing in on a new device could accidentally wipe your existing data. Your cloud data is now restored safely before anything else happens.',
      },
    ],
  },
  {
    version: '2.11.0',
    date: '2026-05-04',
    summary: 'Tradovate CSV import is here.',
    items: [
      {
        type: 'new',
        text: 'Tradovate import support',
        description: 'Import your Tradovate Orders CSV and have trades automatically paired and P&L calculated. All standard futures contracts are supported.',
      },
    ],
  },
  {
    version: '2.10.0',
    date: '2026-04-27',
    summary: 'You can now delete your account and all associated data directly from Settings.',
    items: [
      {
        type: 'new',
        text: 'Self-serve account deletion',
        description: 'You can now permanently delete your account from Settings > Data > Danger Zone. This removes your account, all your data, cloud-synced data, and cancels any active subscription.',
      },
      {
        type: 'fixed',
        text: 'Mobile Chrome bottom cropping',
        description: 'Fixed a layout issue on mobile Chrome where the bottom of the app was cut off or hidden behind the browser navigation bar.',
      },
    ],
  },
  {
    version: '2.9.0',
    date: '2026-04-26',
    summary: 'PropTracker now supports multiple currencies.',
    items: [
      {
        type: 'new',
        text: 'Currency selection for PropTracker accounts',
        description: 'You can now set the currency for each prop firm account (USD, EUR, GBP, CHF, AUD, CAD, JPY, CZK). All amounts — account size, fees, payouts, and P&L — display in the currency you choose. Existing accounts default to USD.',
      },
    ],
  },
  {
    version: '2.8.1',
    date: '2026-04-14',
    summary: 'Login reliability fix — returning users no longer hit onboarding after signing in.',
    items: [
      {
        type: 'fixed',
        text: 'Returning users incorrectly sent to onboarding after Google sign-in',
        description: 'A timing issue caused the app to check onboarding status before confirming your account and pro status. This sent existing users through onboarding on new devices or after clearing their browser data. Fixed for both free and Pro accounts.',
      },
      {
        type: 'fixed',
        text: 'Data not visible after login until manual refresh',
        description: 'When Pro data was restored from the cloud after signing in, the dashboard did not update automatically. Data is now applied immediately without needing a page refresh.',
      },
    ],
  },
  {
    version: '2.8.0',
    date: '2026-04-07',
    summary: '14-day free trial for Pro — try every Pro feature before you pay.',
    items: [
      {
        type: 'new',
        text: '14-day free trial on Pro monthly and yearly plans',
        description: 'New subscribers get 14 days of full Pro access before their first charge. No trial on the lifetime plan — that remains a one-time payment.',
      },
    ],
  },
  {
    version: '2.7.0',
    date: '2026-04-04',
    summary: 'Major quality-of-life update — smarter trade export, journal templates, mood analytics, live risk rule feedback, and a refreshed Goals page.',
    items: [
      {
        type: 'improved',
        text: 'CSV export with date range filter',
        description: 'The Export button in the Trade Log now opens a quick picker. Choose This Month, This Quarter, This Year, or set a custom date range. No extra steps — pick your range and download.',
      },
      {
        type: 'new',
        text: 'Bulk trade delete',
        description: 'Select multiple trades at once using the checkboxes in the Trade Log and delete them all in one go. A select-all option covers everything on the current page.',
      },
      {
        type: 'new',
        text: 'Journal templates',
        description: 'One-click templates in the Journal for Pre-Trade, Post-Trade, and Daily Review. Clicking a template fills in a structured format so you never start from a blank page.',
      },
      {
        type: 'new',
        text: 'Mood vs P&L correlation',
        description: 'The Journal now shows your average P&L when you logged entries as Bullish, Neutral, or Bearish. See whether your mindset actually matches your results.',
      },
      {
        type: 'new',
        text: 'Risk rule warnings when logging trades',
        description: 'When you log a trade that pushes you past your daily loss limit or per-trade loss limit, you get an instant warning. Your violation count updates automatically.',
      },
      {
        type: 'improved',
        text: 'Goals & Risk Management redesign',
        description: 'Goal cards are larger and more visual — progress rings shift from blue to amber as you close in on your target, and green when achieved. Risk rules now show a live bar of how much of your limit you\'ve used today.',
      },
      {
        type: 'improved',
        text: 'PropTracker free tier bumped to 3 accounts',
        description: 'Free users can now track up to 3 prop firm accounts instead of 2.',
      },
      {
        type: 'new',
        text: 'PropTracker deadline alerts',
        description: 'If a prop firm account is expiring within 7 days, a banner appears at the top of PropTracker. Red for 2 days or less, amber for up to 7 days.',
      },
      {
        type: 'improved',
        text: 'Trade Insights — actionable next steps',
        description: 'Every insight card now includes a concrete next step — a specific action you can take today, not just an observation about your data.',
      },
    ],
  },
  {
    version: '2.6.0',
    date: '2026-04-03',
    summary: 'Official blog launched at blog.freetradejournal.com.',
    items: [
      {
        type: 'new',
        text: 'Blog at blog.freetradejournal.com',
        description: 'FreeTradeJournal now has an official blog covering prop firm trading, combine strategies, and trading journal tips. Linked from the sidebar and landing page.',
      },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-04-02',
    summary: 'Feedback form, testimonials, and onboarding improvements.',
    items: [
      {
        type: 'new',
        text: 'Feedback form',
        description: 'Leave feedback directly in the app. Rate your experience with stars, pick a type (bug, feature, general), and submit.',
      },
      {
        type: 'new',
        text: 'Testimonials — share your story',
        description: 'After leaving a 4 or 5 star rating, you can optionally write a testimonial. Tell us what you love about FreeTradeJournal and choose your trader role. Approved testimonials appear on the homepage.',
      },
      {
        type: 'new',
        text: 'Getting started checklist',
        description: 'New users see a checklist on the dashboard to guide them through setting up their account, logging their first trade, and exploring key features.',
      },
      {
        type: 'new',
        text: 'First trade celebration',
        description: 'When you log your very first trade, confetti fires and you get a congratulations message.',
      },
    ],
  },
  {
    version: '2.3.1',
    date: '2026-04-02',
    summary: 'Bug fixes — resolved a crash when editing exit time and a rare white-screen on load.',
    items: [
      {
        type: 'fixed',
        text: 'Exit time crash',
        description: 'Clearing or partially editing the exit (or entry) time field caused the app to crash. The time picker now safely ignores incomplete input.',
      },
      {
        type: 'fixed',
        text: 'White-screen on app load after a browser crash',
        description: 'If your account data was corrupted after a browser crash, the app would fail to load entirely. It now detects and clears the bad data and recovers gracefully.',
      },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-03-31',
    summary: 'PropTracker Screenshot Import — upload your billing or payout screenshots and let AI extract the transactions automatically.',
    items: [
      {
        type: 'new',
        text: 'Screenshot Import (Pro)',
        description: 'Upload a screenshot of your prop firm billing or payout page and AI will automatically extract every transaction. Supports multiple files at once and drag & drop.',
      },
      {
        type: 'new',
        text: 'Duplicate detection on import',
        description: 'Re-importing the same screenshot won\'t create duplicate transactions. Duplicates are automatically flagged and excluded by default in the preview.',
      },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-03-31',
    summary: 'PropTracker — a dedicated prop firm tracker with a free tier, AI analysis, and cloud sync.',
    items: [
      {
        type: 'new',
        text: 'PropTracker',
        description: 'Track fees, resets, and payouts across all your prop firm accounts. See your true net P&L and ROI across every firm — the number most prop traders never actually work out.',
      },
      {
        type: 'new',
        text: 'PropTracker AI Analysis (Pro)',
        description: 'One-click AI breakdown of your prop trading performance. Get an honest verdict on which firms are working, warning signs, and what to do next. 5 analyses per day.',
      },
      {
        type: 'new',
        text: 'PropTracker Cloud Sync',
        description: 'Prop firm accounts and transactions are included in Pro cloud sync — your data stays safe across devices.',
      },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-03-10',
    summary: 'Major data protection update — sync with content blockers, auto-restore, and free tier safeguards.',
    items: [
      {
        type: 'new',
        text: 'Sync works with all content blockers',
        description: 'Cloud sync now works regardless of ad blockers or content filters. Previously, some blockers would silently prevent data from syncing.',
      },
      {
        type: 'new',
        text: 'Auto-restore on new devices',
        description: 'Opening the app on a new device automatically restores all your trades, journal entries, and settings from the cloud. No manual steps needed.',
      },
      {
        type: 'new',
        text: 'Skip setup if you already have data',
        description: 'Pro users with existing cloud data are never shown onboarding again. Any missing accounts are automatically created to match your synced trades.',
      },
      {
        type: 'new',
        text: 'Data protection for free users',
        description: 'New safeguards for free users: storage usage monitor, backup reminders, incognito mode warning, and complete backup/restore.',
      },
      {
        type: 'fixed',
        text: 'Trades going missing after account changes',
        description: 'Fixed a bug where switching or recreating an account could make existing trades invisible.',
      },
      {
        type: 'improved',
        text: 'Backup export now includes all data',
        description: 'Export now covers everything: trades, accounts, journal entries, goals, risk rules, and settings.',
      },
      {
        type: 'improved',
        text: 'Storage usage visible in Settings',
        description: 'Settings now shows how much storage you\'re using with a progress bar and a warning when you\'re approaching the limit.',
      },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-03-03',
    summary: 'AI-powered Pro features — coaching, trade reviews, risk alerts, strategy tagging, goal coaching, journal prompts, and cloud sync.',
    items: [
      {
        type: 'new',
        text: 'Coach FTJ',
        description: 'Your personal AI trading coach. Personalised coaching tips based on your trading patterns, win rate, streaks, and performance metrics. Updates daily with fresh insights.',
      },
      {
        type: 'new',
        text: 'AI Trade Analysis',
        description: 'A full AI review of your overall trading performance — strengths, patterns, areas to improve, and an action plan.',
      },
      {
        type: 'new',
        text: 'AI Trade Review',
        description: 'Per-trade AI assessment with entry/exit analysis, context from surrounding trades, and specific improvement suggestions.',
      },
      {
        type: 'new',
        text: 'AI Journal Prompts',
        description: 'After logging a trade, get AI-generated reflective questions to deepen self-awareness and improve decision-making.',
      },
      {
        type: 'new',
        text: 'AI Strategy Tagger',
        description: 'Auto-classify your trades by strategy — breakout, pullback, reversal, momentum, scalp, and more. Accept or reject each suggestion.',
      },
      {
        type: 'new',
        text: 'AI Risk Alerts',
        description: 'Automatic detection of revenge trading, consecutive loss streaks, and daily loss limit breaches with AI-powered advice.',
      },
      {
        type: 'new',
        text: 'AI Goal Coach',
        description: 'Get personalised coaching on your trading goals — what\'s working, what to adjust, and how to stay on track.',
      },
      {
        type: 'new',
        text: 'Cloud Sync for Pro users',
        description: 'Your trades, journal entries, goals, accounts, and risk rules sync across all your devices in real-time.',
      },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-02-19',
    summary: 'Trade Insights page redesign — new trader profile radar, cleaner stats, and colored ideas.',
    items: [
      {
        type: 'new',
        text: 'Trader Profile radar chart',
        description: 'A multi-dimensional view of your trading style — Win Rate, Risk/Reward, Consistency, Volume, Best Day, and Direction scores all in one chart.',
      },
      {
        type: 'improved',
        text: 'Summary stats — cleaner layout',
        description: 'The stats section is now compact colored badges with a plain-English summary sentence instead of a grid of cards.',
      },
      {
        type: 'improved',
        text: 'Actionable Ideas now color-coded by sentiment',
        description: 'Ideas are tinted green (positive), amber (opportunity), or blue (neutral) so you can quickly scan what matters.',
      },
      {
        type: 'improved',
        text: 'Key stats visible at the top of Trade Insights',
        description: 'Total P&L and win rate now appear in the page header so you don\'t have to scroll to find them.',
      },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-02-18',
    summary: 'Accessibility fixes, mobile improvements, and reduced motion support.',
    items: [
      {
        type: 'fixed',
        text: 'Keyboard focus indicators restored',
        description: 'A bug was hiding focus indicators across the entire app, making it very difficult to navigate with a keyboard. Focus outlines now work correctly on all interactive elements.',
      },
      {
        type: 'fixed',
        text: 'Mobile long-press and copy/share restored',
        description: 'Text selection, image saving, and share menus on mobile were being blocked. Standard long-press interactions now work as expected.',
      },
      {
        type: 'fixed',
        text: 'Form fields now accessible to screen readers',
        description: 'Form fields in the trade modal, journal entry form, and file upload now have proper labels for screen reader users.',
      },
      {
        type: 'improved',
        text: 'Page header now visible on mobile',
        description: 'The page header was hidden on small screens. It now shows the current page name, theme toggle, and user avatar on all screen sizes.',
      },
      {
        type: 'improved',
        text: 'Reduced motion support',
        description: 'Animated elements throughout the app now respect your OS reduced motion setting, showing instant transitions instead.',
      },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-02-17',
    summary: 'CSV import deduplication fixes, multi-account data safety, and currency sync.',
    items: [
      {
        type: 'fixed',
        text: 'CSV re-import no longer creates duplicate trades',
        description: 'Importing the same CSV again now correctly detects and skips trades you\'ve already imported.',
      },
      {
        type: 'fixed',
        text: 'Trades on other accounts no longer lost on save',
        description: 'Adding, editing, or deleting trades on one account no longer wipes trades from your other accounts.',
      },
      {
        type: 'fixed',
        text: 'Currency setting stays in sync across the app',
        description: 'Changing currency in Settings now updates your active account, and editing an account\'s currency updates the global setting. Both stay in sync.',
      },
      {
        type: 'improved',
        text: 'CSV import progress indicator',
        description: 'Importing a CSV now shows a progress overlay so you can see what\'s happening. The form closes automatically when you pick a file and the dashboard refreshes when done.',
      },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-02-16',
    summary: 'Modernized sidebar and navigation with user profile in the page header and a cleaner account switcher.',
    items: [
      {
        type: 'improved',
        text: 'User profile moved to the page header',
        description: 'Your avatar and account dropdown are now in the top-right corner — visible on every page without opening the sidebar.',
      },
      {
        type: 'improved',
        text: 'Cleaner sidebar navigation',
        description: 'Simplified layout with no section labels. Active pages now show a highlighted icon for clearer visual feedback.',
      },
      {
        type: 'improved',
        text: 'Modernized account switcher',
        description: 'The account switcher now shows account type and broker per item, with a checkmark on the active account.',
      },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-02-16',
    summary: 'Dashboard redesign with better visual hierarchy, clickable stat cards, and improved empty states.',
    items: [
      {
        type: 'new',
        text: 'Account balance shown on the Total P&L card',
        description: 'Your current account balance (starting balance + total P&L) is now displayed on the Total P&L card so you can see your equity at a glance.',
      },
      {
        type: 'new',
        text: 'Trading Days count in the calendar',
        description: 'The calendar now shows how many days you traded in the selected month alongside Monthly P&L, Win Rate, and other stats.',
      },
      {
        type: 'improved',
        text: 'Stat cards are now clickable',
        description: 'All four dashboard stat cards (P&L, Win Rate, Total Trades, Profit Factor) now link to the Trade Log.',
      },
      {
        type: 'improved',
        text: 'Equity curve is now full-width',
        description: 'The equity curve now takes up the full width of the dashboard for a bigger view of your performance.',
      },
      {
        type: 'improved',
        text: 'Better empty state with action buttons',
        description: 'When you have no trades, the dashboard now shows "Add Trade" and "Import CSV" buttons instead of blank space.',
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-13',
    summary: 'Accurate account metrics and color-coded dashboard cards.',
    items: [
      {
        type: 'fixed',
        text: 'P&L percentage now uses your actual account balance',
        description: 'The "% of account" metric was hardcoded to a $10k balance. It now reads from your account balance in Settings.',
      },
      {
        type: 'improved',
        text: 'Dashboard metric cards are now color-coded',
        description: 'Win Rate, Total Trades, and Profit Factor cards now use green/red based on performance instead of plain white text.',
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-12',
    summary: 'TopStep CSV import, column mapping for unknown brokers, and futures contract multipliers.',
    items: [
      {
        type: 'new',
        text: 'TopStep CSV import',
        description: 'Import trade history directly from TopStep. It automatically recognizes the format and maps everything correctly — no manual setup needed.',
      },
      {
        type: 'new',
        text: 'Column mapping for unknown CSV formats',
        description: 'When importing a file from an unrecognized broker, you can manually map each column (symbol, entry price, P&L, etc.) so you can import from any platform.',
      },
      {
        type: 'new',
        text: 'Futures contract multipliers for accurate P&L',
        description: 'Futures trades now apply the correct multiplier (e.g. ES = $50, NQ = $20, CL = $1,000) so your numbers match your broker statements.',
      },
      {
        type: 'improved',
        text: 'CSV import skips duplicate trades automatically',
        description: 'Re-importing the same file no longer creates duplicate entries. Trades that already exist in your log are automatically skipped.',
      },
      {
        type: 'fixed',
        text: 'Light mode visibility issues',
        description: 'Fixed contrast and readability problems in light mode — charts, badges, table borders, and card backgrounds now look correct in both themes.',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-05',
    summary: 'Faster trade entry with a searchable instrument picker.',
    items: [
      {
        type: 'new',
        text: 'Searchable instrument picker',
        description: 'The symbol field in the trade form is now a searchable dropdown. Start typing to filter through forex pairs, futures contracts, and indices instead of scrolling through a long list.',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-01-28',
    summary: 'AI-powered coaching, visual trading activity tracking, and performance breakdowns by instrument.',
    items: [
      {
        type: 'new',
        text: 'Coach FTJ for personalized insights',
        description: 'Coach FTJ analyzes your trade history and provides actionable feedback — identifying patterns in your wins and losses, suggesting risk adjustments, and highlighting your best setups.',
      },
      {
        type: 'new',
        text: 'Calendar heatmap',
        description: 'See your daily trading activity at a glance. Green days are profitable, red days are losses — the darker the color, the bigger the move.',
      },
      {
        type: 'new',
        text: 'Instrument performance radar chart',
        description: 'See how you perform across different instruments. Quickly spot which pairs or contracts you trade best and where you might want to improve.',
      },
      {
        type: 'improved',
        text: 'Dashboard layout optimized for mobile',
        description: 'Cards, charts, and tables now stack and resize properly on phones and tablets with larger touch targets.',
      },
    ],
  },
]

export const LATEST_CHANGELOG_VERSION = '2.87.0'
