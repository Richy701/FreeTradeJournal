import { LogoCarousel } from "@/components/ui/logo-carousel";

export function LogoCloud() {
  const propFirms = [
    { 
      name: "E8 Markets",
      url: "/logos/e8-markets-logo.png",
      className: "text-[#6366F1] font-black",
      style: "height: 48px; width: auto; max-width: 140px;"
    },
    { 
      name: "Funded FX", 
      url: "/logos/funded-fx-logo.png",
      className: "text-[#8B5CF6] font-black" 
    },
    { 
      name: "FundingPips", 
      url: "/logos/fundingpips-logo-alt.png",
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
      url: "/logos/alpha-capital-group-logo.png",
      className: "text-[#EC4899] font-black" 
    },
    { 
      name: "Apex Trader Funding", 
      url: "/logos/apex-trader-funding-logo.png",
      className: "text-[#3B82F6] font-black" 
    },
    { 
      name: "The5ers", 
      url: "/logos/the5ers-logo.png",
      className: "text-[#DC2626] font-black"
    }
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Trusted by traders at
          </h2>
        </div>
        
        <LogoCarousel logos={propFirms} />
        
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Works with all major prop firms and brokers
          </p>
        </div>
      </div>
    </section>
  );
}