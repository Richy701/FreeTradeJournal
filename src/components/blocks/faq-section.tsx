import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { motion } from "framer-motion";

export function FAQSection() {
  const faqs = [
    {
      question: "What markets and instruments can I track?",
      answer: "Forex pairs, futures contracts, stocks, and major indices. Each market type has dedicated fields — lot sizes and swap costs for forex, contract specs and tick values for futures, share count for stocks — so your logs stay precise no matter what you trade."
    },
    {
      question: "How does FreeTradeJournal calculate my P&L?",
      answer: "Every trade factors in your entry and exit prices, position size, spread, commissions, and swap fees. Nothing is estimated or rounded — you get the exact net result for each trade, and all calculations roll up into your dashboard metrics automatically."
    },
    {
      question: "What analytics and metrics will I get?",
      answer: "Win rate, profit factor, average R:R, Sharpe ratio, max drawdown, daily/weekly/monthly P&L breakdowns, calendar heatmaps, and equity curves. Filter by instrument, strategy, account, or time period to pinpoint what's working and what isn't."
    },
    {
      question: "Is my trading data secure?",
      answer: "Your data is encrypted in transit and at rest using Firebase. Only your authenticated account can access your trades — no one else, including the FreeTradeJournal team, can view your information."
    },
    {
      question: "How much does it cost?",
      answer: "The core journal is completely free — trade logging, analytics, journaling, goal tracking, and CSV import/export with no credit card required. Pro adds AI-powered coaching, automated trade reviews, strategy tagging, risk alerts, cloud sync, and unlimited exports."
    },
    {
      question: "Does it work with prop firms like FTMO?",
      answer: "Yes. Traders at FTMO, Apex Trader Funding, TopStep, The5ers, and other prop firms use FreeTradeJournal to track challenges and funded accounts. Create separate accounts for each firm to keep everything organized and compare performance across them."
    },
    {
      question: "What's included in the Pro plan?",
      answer: "AI Trading Coach, AI Trade Review, AI Strategy Tagger, AI Risk Alerts, cloud sync across devices, unlimited data exports, priority email support, and early access to new features. Choose Monthly ($5.99/mo), Yearly ($49.99/yr — save 30%), or Lifetime ($149.99 one-time)."
    },
    {
      question: "Can I see what the app looks like before signing up?",
      answer: "Yes. Click \"View Live Demo\" to explore the full interface with sample trades, analytics, and dashboards — no account needed. It's the fastest way to see if FreeTradeJournal fits your workflow."
    },
    {
      question: "Can I cancel or change my Pro plan anytime?",
      answer: "Yes. Switch between Monthly and Yearly or cancel anytime from the Subscription tab in your settings. There's no lock-in — your Pro access stays active until the end of your current billing period."
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
    <section className="py-14 sm:py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Frequently Asked <span className="text-amber-500">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about FreeTradeJournal and how it can transform your trading journey
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
                viewport={{ once: true, margin: "-40px" }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  id={`faq-${index}`}
                  className="border-b border-border py-2"
                >
                  <AccordionTrigger className="text-left hover:no-underline hover:text-amber-500 transition-colors duration-200 py-4">
                    <span className="text-base md:text-lg font-medium pr-4">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-base leading-relaxed text-muted-foreground pb-4 pr-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>

      </div>
    </section>
  );
}