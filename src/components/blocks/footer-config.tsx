import type { ReactElement } from 'react';

export const footerConfig = {
  logo: {
    url: "/",
    src: "",
    alt: "FreeTradeJournal Logo",
    title: "FreeTradeJournal"
  },
  description: "Track every trade, spot what's working, and build consistency — with professional analytics, journaling, and performance tools. Free forever, no credit card required.",
  sections: [
    {
      title: "Product",
      links: [
        { name: "Features", href: "/#features" },
        { name: "Pricing", href: "/pricing" },
        { name: "Documentation", href: "/documentation" },
        { name: "Changelog", href: "/changelog" },
        { name: "Blog", href: "/blog" },
      ]
    },
    {
      title: "Trading Tools",
      links: [
        { name: "Position Size Calculator", href: "/position-size-calculator" },
        { name: "Forex Trading Journal", href: "/forex-trading-journal" },
        { name: "Futures Trading Tracker", href: "/futures-trading-tracker" },
        { name: "Prop Firm Dashboard", href: "/prop-firm-dashboard" },
        { name: "Prop Firm ROI Tracker", href: "/prop-tracker" },
        { name: "Affiliate", href: "/affiliate" },
      ]
    },
    {
      title: "Prop Firms",
      links: [
        { name: "FTMO Journal", href: "/ftmo-trading-journal" },
        { name: "Topstep Journal", href: "/topstep-trading-journal" },
        { name: "Apex Journal", href: "/apex-trading-journal" },
        { name: "FundedNext Journal", href: "/fundednext-trading-journal" },
        { name: "Funding Pips Journal", href: "/funding-pips-trading-journal" },
        { name: "FTMO Review", href: "/ftmo-review" },
        { name: "The5%ers Review", href: "/the5ers-review" },
        { name: "Top One Futures Review", href: "/top-one-futures-review" },
      ]
    },
    {
      title: "Compare",
      links: [
        { name: "TradeZella Alternative", href: "/tradezella-alternative" },
        { name: "TraderSync Alternative", href: "/tradersync-alternative" },
        { name: "Edgewonk Alternative", href: "/edgewonk-alternative" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms & Conditions", href: "/terms" },
        { name: "Cookie Policy", href: "/cookie-policy" },
        { name: "Cookie Settings", href: "#cookie-settings" },
      ]
    }
  ],
  socialLinks: [] as { icon: ReactElement; href: string; label: string }[],
  copyright: "© 2026 FreeTradeJournal. All rights reserved.",
  legalLinks: [] as { name: string; href: string }[],
};
