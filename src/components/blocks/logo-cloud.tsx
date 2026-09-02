import { Link } from "react-router-dom";
import { LogoCarousel } from "@/components/blocks/logo-carousel";

export function LogoCloud() {
  // Official current brand assets (white/dark-background variants), sourced
  // from each brand's own site or press kit. Heights are tuned per aspect
  // ratio so every mark carries similar visual weight in the marquee.
  const brands = [
    { name: "FTMO", url: "/logos/ftmo.svg", imgClassName: "h-10" },
    { name: "TradingView", url: "/logos/tradingview.svg", imgClassName: "h-9" },
    { name: "Topstep", url: "/logos/topstep.png", imgClassName: "h-10" },
    { name: "OANDA", url: "/logos/oanda.svg", imgClassName: "h-11" },
    { name: "Apex Trader Funding", url: "/logos/apex-trader-funding.svg", imgClassName: "h-10" },
    { name: "Interactive Brokers", url: "/logos/interactive-brokers.svg", imgClassName: "h-9" },
    { name: "The5ers", url: "/logos/the5ers-logo.webp", imgClassName: "h-10 dark:brightness-0 dark:invert" },
    { name: "NinjaTrader", url: "/logos/ninjatrader.svg", imgClassName: "h-9" },
    { name: "E8 Markets", url: "/logos/e8-markets.svg", imgClassName: "h-10" },
    { name: "Tradovate", url: "/logos/tradovate.png", imgClassName: "h-10" },
    { name: "Alpha Capital Group", url: "/logos/alpha-capital-group.svg", imgClassName: "h-10" },
    { name: "FundedNext", url: "/logos/fundednext.png", imgClassName: "h-8" },
    { name: "FundingPips", url: "/logos/fundingpips.svg", imgClassName: "h-10" },
    { name: "My Funded Futures", url: "/logos/my-funded-futures.svg", imgClassName: "h-10" },
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-10 max-w-xs mx-auto">
          <div className="flex-1 h-px bg-border" />
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            Trusted by traders at
          </p>
          <div className="flex-1 h-px bg-border" />
        </div>

        <LogoCarousel logos={brands} />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Compatible with every prop firm, broker, and market
        </p>
        <p className="mt-2 text-center">
          <Link to="/affiliate" className="text-sm text-amber-500/80 hover:text-amber-500 transition-colors duration-200">
            Save on challenges with our partner deals →
          </Link>
        </p>
      </div>
    </section>
  );
}
