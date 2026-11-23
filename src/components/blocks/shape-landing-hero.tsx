"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "dark:from-white/[0.08] from-black/[0.12]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    const shouldReduceMotion = useReducedMotion();
    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0, rotate } : {
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={shouldReduceMotion ? { opacity: 1, y: 0, rotate } : {
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={shouldReduceMotion ? {} : {
                    y: [0, 15, 0],
                }}
                transition={shouldReduceMotion ? {} : {
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: [0.4, 0, 0.6, 1],
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2",
                        "dark:border-white/[0.15] border-amber-600/[0.15]",
                        "dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] shadow-[0_8px_32px_0_rgba(180,130,0,0.12)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "dark:after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(180,130,0,0.15),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

/**
 * The landing hero's background on its own: soft amber wash, the floating
 * shapes, and the fade to the page background. Drop it inside any
 * `relative overflow-hidden` section so an offer page reads as the same site.
 * Content on top needs `relative z-10`.
 */
export function GeometricBackdrop() {
    return (
        <>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-yellow-600/[0.08] dark:from-amber-500/[0.05] dark:to-yellow-600/[0.05] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
                <ElegantShape
                    delay={0.3}
                    width={600}
                    height={140}
                    rotate={12}
                    gradient="dark:from-amber-500/[0.15] from-amber-500/[0.2]"
                    className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />

                <ElegantShape
                    delay={0.5}
                    width={500}
                    height={120}
                    rotate={-15}
                    gradient="dark:from-yellow-600/[0.15] from-yellow-600/[0.2]"
                    className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                />

                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="dark:from-amber-400/[0.15] from-amber-400/[0.2]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />

                <ElegantShape
                    delay={0.6}
                    width={200}
                    height={60}
                    rotate={20}
                    gradient="dark:from-amber-500/[0.15] from-amber-500/[0.2]"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />

                <ElegantShape
                    delay={0.7}
                    width={150}
                    height={40}
                    rotate={-25}
                    gradient="dark:from-yellow-500/[0.15] from-yellow-500/[0.2]"
                    className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                />
            </div>
            <div className="absolute inset-0 pointer-events-none z-[2]">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/80" />
            </div>
        </>
    );
}

function HeroGeometric({
    title1 = "Your trading journal",
    title2 = "Your next useful lesson",
    subtitle,
    showCTA = true,
    cta,
    compact = false,
    eyebrow,
    homepage = false,
}: {
    title1?: string;
    title2?: string;
    subtitle?: string;
    eyebrow?: React.ReactNode;
    homepage?: boolean;
    showCTA?: boolean;
    cta?: React.ReactNode;
    compact?: boolean;
}) {
    const { enterDemoMode } = useAuth();
    const navigate = useNavigate();
    return (
        <section className={cn("relative w-full overflow-hidden bg-background noise-overlay", homepage ? "pt-28 pb-12 sm:pt-32 sm:pb-16" : compact ? "py-12 sm:py-16" : "py-16 sm:py-20")}>
            <GeometricBackdrop />
            <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8">
                {eyebrow && <div className="mb-6">{eyebrow}</div>}
                <div className="grid min-w-0 grid-cols-1 items-end gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
                    <h1 className="min-w-0 max-w-4xl font-display text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.035em] [overflow-wrap:anywhere]">
                        <span className="block">{title1}</span>
                        <span className="mt-1 block text-amber-600 dark:text-amber-400">{title2}</span>
                    </h1>
                    <div className="min-w-0 max-w-xl space-y-6">
                        <p className="text-base leading-relaxed text-muted-foreground">{subtitle ?? "Free professional trading journal with AI-powered insights. Track, analyze, and optimize your performance — upgrade to Pro for coaching, trade reviews, and smart alerts."}</p>
                        {cta ? <div className="flex flex-wrap gap-3 [&>a]:max-w-full [&>a>button]:bg-amber-400 [&>a>button]:text-black [&_button]:h-auto [&_button]:min-h-11 [&_button]:min-w-0 [&_button]:max-w-full [&_button]:whitespace-normal [&_button]:bg-none [&_button]:text-sm [&_button]:shadow-none [&_button]:animate-none">{cta}</div> : showCTA && <>
                            <div className="flex flex-wrap gap-3">
                                <Button asChild className="h-auto min-h-11 max-w-full whitespace-normal bg-amber-400 px-5 text-sm text-black hover:bg-amber-300"><Link to="/signup">Sign Up Free</Link></Button>
                                <Button variant="outline" className="h-auto min-h-11 max-w-full whitespace-normal px-5 text-sm" onClick={() => { enterDemoMode(); navigate('/dashboard'); }}>View Live Demo</Button>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">4,000+ traders journaling · Free to start · No credit card required</p>
                        </>}
                    </div>
                </div>
            </div>
        </section>
    );
}

export { HeroGeometric }
