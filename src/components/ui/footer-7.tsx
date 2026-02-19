import React from "react";
import { Link } from "react-router-dom";
import { FaXTwitter } from "react-icons/fa6";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { FeedbackButton } from './feedback-button';
import { motion } from "framer-motion";

const isInternalLink = (href: string) => href.startsWith('/') || href.startsWith('#');

interface Footer7Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
  }>;
}

const defaultSections = [
  {
    title: "Product",
    links: [
      { name: "Overview", href: "#" },
      { name: "Pricing", href: "#" },
      { name: "Marketplace", href: "#" },
      { name: "Features", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Team", href: "#" },
      { name: "Careers", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Help", href: "#" },
      { name: "Sales", href: "#" },
      { name: "Advertise", href: "#" },
      { name: "Privacy", href: "#" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <FaXTwitter className="size-5" />, href: "#", label: "X" },
];

const defaultLegalLinks = [
  { name: "Terms and Conditions", href: "#" },
  { name: "Privacy Policy", href: "#" },
];

export const Footer7 = ({
  logo = {
    url: "https://www.shadcnblocks.com",
    src: "https://www.shadcnblocks.com/images/block/logos/shadcnblockscom-icon.svg",
    alt: "logo",
    title: "Shadcnblocks.com",
  },
  sections = defaultSections,
  description = "A collection of components for your startup business or side project.",
  socialLinks = defaultSocialLinks,
  copyright = "© 2024 Shadcnblocks.com. All rights reserved.",
  legalLinks = defaultLegalLinks,
}: Footer7Props) => {
  return (
    <section className="relative py-16 mt-16 overflow-hidden">
      {/* Glass background layer */}
      <div className="absolute inset-0 bg-muted/30 backdrop-blur-sm" />
      {/* Fade gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
      {/* Gradient top border line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex w-full flex-col justify-between gap-8 lg:flex-row lg:items-start lg:text-left">
          <motion.div
            className="flex w-full flex-col justify-between gap-6 lg:items-start lg:max-w-md"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 lg:justify-start">
              <Link to={logo.url} className="flex items-center gap-3">
                {logo.src ? (
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    title={logo.title}
                    className="h-10"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="h-10 w-10 bg-primary/15 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-primary/10">
                    <FontAwesomeIcon icon={faChartLine} className="h-6 w-6 text-primary" />
                  </div>
                )}
                <h2 className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{logo.title}</h2>
              </Link>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed font-medium">
              {description}
            </p>
            <ul className="flex items-center space-x-4 text-muted-foreground">
              {socialLinks.map((social, idx) => (
                <li key={idx}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-foreground/[0.08] dark:bg-foreground/[0.05] border border-foreground/[0.15] dark:border-foreground/[0.08] flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-shadow duration-200"
                  >
                    <div className="text-lg">{social.icon}</div>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 w-full lg:max-w-3xl">
            <div className="grid w-full gap-8 grid-cols-2 md:grid-cols-4 lg:gap-16">
              {sections.map((section, sectionIdx) => (
                <motion.div
                  key={sectionIdx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + sectionIdx * 0.1, ease: "easeOut" }}
                  viewport={{ once: true }}
                >
                  <h3 className="mb-6 font-semibold text-sm uppercase tracking-wider text-foreground">{section.title}</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {section.links.map((link, linkIdx) => (
                      <li
                        key={linkIdx}
                        className="font-medium hover:text-foreground transition-shadow duration-200"
                      >
                        {isInternalLink(link.href) ? (
                          <Link
                            to={link.href}
                            className="inline-block hover:translate-x-0.5 transition-transform duration-200"
                          >
                            {link.name}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block hover:translate-x-0.5 transition-transform duration-200"
                          >
                            {link.name}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            {/* Badges */}
            <div className="flex flex-row gap-3 lg:flex-col lg:gap-4 lg:ml-auto lg:items-end">
              {/* Product Hunt Badge */}
              <a
                href="https://www.producthunt.com/products/freetradejournal?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-freetradejournal"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100 transition-opacity duration-200"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1012535&theme=neutral&t=1757000479250"
                  alt="FreeTradeJournal - Track, analyse, and improve your trading performance | Product Hunt"
                  className="w-[150px] h-[32px] sm:w-[200px] sm:h-[43px] lg:w-[250px] lg:h-[54px]"
                  width="250"
                  height="54"
                />
              </a>
              {/* Peerlist Badge */}
              <a
                href="https://peerlist.io/richy7/project/free-trade-journal"
                target="_blank"
                rel="noreferrer"
                className="opacity-80 hover:opacity-100 transition-opacity duration-200"
              >
                <img
                  src="https://peerlist.io/api/v1/projects/embed/PRJHEOG6A7OOGQDDMIO6KA9M7ABO7A?showUpvote=false&theme=light"
                  alt="Free Trade journal"
                  className="w-auto h-[32px] sm:h-[43px] lg:h-[54px]"
                  width={250}
                  height={54}
                />
              </a>
            </div>
          </div>
        </div>
        {/* Gradient bottom divider */}
        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <motion.div
          className="pt-8 flex flex-col justify-between gap-4 text-sm font-medium text-muted-foreground/70 md:flex-row md:items-center md:text-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="order-2 lg:order-1">{copyright}</p>
          <ul className="order-1 flex flex-col gap-3 md:order-2 md:flex-row md:gap-6">
            {legalLinks.map((link, idx) => (
              <li key={idx} className="hover:text-foreground transition-colors duration-200">
                {isInternalLink(link.href) ? (
                  <Link to={link.href}>{link.name}</Link>
                ) : (
                  <a href={link.href} target="_blank" rel="noopener noreferrer">{link.name}</a>
                )}
              </li>
            ))}
            <li className="md:border-l md:border-border/50 md:pl-6">
              <FeedbackButton
                variant="ghost"
                className="h-auto p-0 text-muted-foreground/70 hover:text-foreground text-sm font-medium"
                buttonText="Feedback"
              />
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
};
