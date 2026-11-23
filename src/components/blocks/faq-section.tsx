import { FREE_ANALYTICS_WINDOW_DAYS, FREE_JOURNAL_ENTRY_LIMIT, PRICING_PLANS } from '@/constants/pricing';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { motion } from "framer-motion";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  compact?: boolean;
  faqs?: FAQ[];
  title?: string;
  subtitle?: string;
  id?: string;
}

const DEFAULT_FAQS: FAQ[] = [
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
      answer: "Your data is encrypted in transit using TLS and at rest using AES-256 encryption in your browser. Pro users also get encrypted cloud sync via Firebase. Only your authenticated account can access your trades."
    },
    {
      question: "How much does it cost?",
      answer: `The free plan includes unlimited trade logging, CSV/Excel import and export, goals and risk management, up to ${FREE_JOURNAL_ENTRY_LIMIT} journal entries, and the last ${FREE_ANALYTICS_WINDOW_DAYS} days of analytics. Your full trade log remains available. No credit card is required. Pro adds full analytics history, unlimited journal entries, advanced analytics, expanded AI tools, cloud sync, and PDF trade reports.`
    },
    {
      question: "Does it work with prop firms like FTMO?",
      answer: "Yes. Traders at FTMO, Apex Trader Funding, TopStep, The5ers, and other prop firms use FreeTradeJournal to track challenges and funded accounts. Create separate accounts for each firm to keep everything organized and compare performance across them."
    },
    {
      question: "What's included in the Pro plan?",
      answer: `Pro includes full analytics history, unlimited journal entries and accounts, advanced charts, expanded AI tools, cloud sync, and PDF trade reports. Standard prices are $${PRICING_PLANS.find(plan => plan.interval === 'monthly')!.price}/month or $${PRICING_PLANS.find(plan => plan.interval === 'yearly')!.price}/year, in USD. Visit Pricing for current offers and Lifetime availability. CSV/Excel data export remains free.`
    },
    {
      question: "Can I see what the app looks like before signing up?",
      answer: "Yes. Click \"View Live Demo\" to explore the full interface with sample trades, analytics, and dashboards — no account needed. It's the fastest way to see if FreeTradeJournal fits your workflow."
    },
    {
      question: "Can I cancel or change my Pro plan anytime?",
      answer: "Yes. Switch between Monthly and Yearly or cancel anytime from the Subscription section in Settings. There's no lock-in — your Pro access stays active until the end of your current billing period."
    }
];

export function FAQSection({ faqs = DEFAULT_FAQS, title = 'Frequently Asked', subtitle = 'Everything you need to know about FreeTradeJournal and how it can transform your trading journey', id = 'faq-structured-data', compact = false }: FAQSectionProps) {
  useEffect(() => {
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
    script.id = id;

    document.getElementById(id)?.remove();
    document.head.appendChild(script);

    return () => { document.getElementById(id)?.remove(); };
  }, [faqs, id]);

  return (
    <section className="py-14 sm:py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className={cn('text-center', compact ? 'mb-10' : 'mb-16')}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className={cn('font-display text-3xl sm:text-4xl font-bold mb-4 tracking-tight', !compact && 'lg:text-5xl')}>
            {title} <span className="text-amber-600 dark:text-amber-500">Questions</span>
          </h2>
          <p className={cn('text-muted-foreground max-w-2xl mx-auto', compact ? 'text-base' : 'text-lg')}>
            {subtitle}
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
                  <AccordionTrigger className="text-left hover:no-underline hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200 py-4">
                    <span className={cn('text-base font-medium pr-4', !compact && 'md:text-lg')}>{faq.question}</span>
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
