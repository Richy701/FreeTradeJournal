import React from 'react';

const xIcon = React.createElement('svg', { className: "size-5", fill: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true" },
  React.createElement('path', { d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" })
);

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
        { name: "Blog", href: "https://blog.freetradejournal.com" },
      ]
    },
    {
      title: "Trading Tools",
      links: [
        { name: "Forex Trading Journal", href: "/forex-trading-journal" },
        { name: "Futures Trading Tracker", href: "/futures-trading-tracker" },
        { name: "Prop Firm Dashboard", href: "/prop-firm-dashboard" },
        { name: "Day Trading Journal", href: "/day-trading-journal" },
        { name: "Online Trading Journal", href: "/online-trading-journal" },
        { name: "Prop Firm ROI Tracker", href: "/prop-tracker" },
        { name: "Affiliate", href: "/affiliate" },
        { name: "FTMO Review", href: "/ftmo-review" },
        { name: "The5%ers Review", href: "/the5ers-review" },
        { name: "Top One Futures Review", href: "/top-one-futures-review" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms & Conditions", href: "/terms" },
        { name: "Cookie Policy", href: "/cookie-policy" },
      ]
    }
  ],
  socialLinks: [
    {
      icon: xIcon,
      href: "https://x.com/richytiup",
      label: "Follow on X",
    },
  ],
  copyright: "© 2026 FreeTradeJournal. All rights reserved.",
  legalLinks: [] as { name: string; href: string }[],
};
