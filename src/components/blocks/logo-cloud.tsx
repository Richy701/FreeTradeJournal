import { LogoCarousel } from "@/components/ui/logo-carousel";

export function LogoCloud() {
  const propFirms = [
    { 
      name: "E8 Markets",
      url: "/logos/e8-markets-logo.webp",
      className: "text-[#6366F1] font-black",
      style: "height: 48px; width: auto; max-width: 140px;"
    },
    { 
      name: "Funded FX", 
      url: "/logos/funded-fx-logo.webp",
      className: "text-[#8B5CF6] font-black" 
    },
    { 
      name: "FundingPips", 
      url: "/logos/fundingpips-logo-alt.webp",
      className: "text-[#10B981] font-black"
    },
    { 
      name: "TopStep", 
      url: "/logos/topstep-logo.jpg",
      className: "text-[#F97316] font-black",
      style: "height: 72px; width: auto; max-width: 220px;"
    },
    { 
      name: "FTMO", 
      url: "/logos/ftmo-logo-dark.svg",
      className: "text-[#0066FF] font-black" 
    },
    { 
      name: "Alpha Capital Group", 
      url: "/logos/alpha-capital-group-logo.webp",
      className: "text-[#EC4899] font-black" 
    },
    { 
      name: "Apex Trader Funding", 
      url: "/logos/apex-trader-funding-logo.webp",
      className: "text-[#3B82F6] font-black" 
    },
    { 
      name: "The5ers", 
      url: "/logos/the5ers-logo.webp",
      className: "text-[#DC2626] font-black"
    }
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

        <LogoCarousel logos={propFirms} />

        <p className="mt-8 text-center text-sm text-muted-foreground/70">
          Compatible with every prop firm, broker, and market
        </p>
      </div>
    </section>
  );
}