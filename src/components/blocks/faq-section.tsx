import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function FAQSection() {
  const faqs = [
    {
      question: "What markets does FreeTradeJournal support?",
      answer: "Forex pairs, futures contracts, and major indices. Each market type has its own fields — lot sizes and swap costs for forex, contract specs for futures, and so on — so your logs stay accurate regardless of what you trade."
    },
    {
      question: "How accurate are the P&L calculations?",
      answer: "P&L is calculated from your entry/exit prices, position size, spread, commissions, and swap fees. Nothing is estimated — every cost you enter is factored in, giving you a true picture of each trade's result."
    },
    {
      question: "What analytics and metrics are available?",
      answer: "Win rate, profit factor, average R:R, max drawdown, daily/weekly/monthly breakdowns, calendar heatmaps, and equity curves. You can slice performance by instrument, strategy, account, or time period."
    },
    {
      question: "Is my trading data secure?",
      answer: "Yes. Your data is stored in Firebase with encryption in transit and at rest. Only your authenticated account can access your trades — no one else, including us, can see your data."
    },
    {
      question: "How much does FreeTradeJournal cost?",
      answer: "It's completely free. All features — trade logging, analytics, journaling, risk management, cloud sync — are included at no cost. No trials, no paywalls, no credit card required."
    },
    {
      question: "Does it work with prop firms?",
      answer: "Yes. Traders at FTMO, Apex Trader Funding, TopStep, The5ers, and other prop firms use FreeTradeJournal to track their challenges and funded accounts. You can set up separate accounts to keep prop firm trades organized."
    }
  ];

  useEffect(() => {
    // Add FAQ structured data
    const faqStructuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqStructuredData);
    script.id = 'faq-structured-data';
    
    // Remove existing script if present
    const existingScript = document.getElementById('faq-structured-data');
    if (existingScript) {
      document.head.removeChild(existingScript);
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('faq-structured-data');
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove);
      }
    };
  }, []);

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about FreeTradeJournal and how it can transform your trading journey
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-b border-border py-2"
              >
                <AccordionTrigger className="text-left hover:no-underline hover:text-primary transition-colors duration-200 py-4">
                  <span className="text-base md:text-lg font-medium pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base leading-relaxed text-muted-foreground pb-4 pr-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
      </div>
    </section>
  );
}