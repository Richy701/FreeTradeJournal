import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const faqs = [
    {
      question: "What markets does TradeVault support?",
      answer: "TradeVault supports comprehensive tracking for Forex pairs, Futures contracts, and major Indices. You can log trades with detailed information including lot sizes, spreads, commissions, and swap costs specific to each market type."
    },
    {
      question: "How accurate are the P&L calculations?",
      answer: "Our P&L calculations are highly accurate and account for all trading costs including spreads, commissions, and swap fees. The system automatically calculates your profit/loss based on entry and exit prices, lot sizes, and the specific characteristics of each instrument you trade."
    },
    {
      question: "What analytics and metrics are available?",
      answer: "TradeVault offers professional-grade analytics including win rate, profit factor, average R:R ratio, maximum drawdown, daily/weekly/monthly performance breakdowns, and detailed performance metrics by instrument, strategy, and time period."
    },
    {
      question: "Is my trading data secure?",
      answer: "Absolutely. We use industry-standard encryption to protect your data both in transit and at rest. Your trading information is private and secure, accessible only to you through your authenticated account."
    },
    {
      question: "How much does TradeVault cost?",
      answer: "TradeVault offers a free tier to get you started with core features. We also have premium plans with advanced analytics, unlimited trade history, and additional features for serious traders."
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about TradeVault and how it can transform your trading journey
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
                <AccordionTrigger className="text-left hover:no-underline hover:text-primary transition-colors py-4">
                  <span className="text-base font-medium pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 pr-4">
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