"use client";

import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { DotFilledIcon } from "@radix-ui/react-icons";
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

function HeroGeometric({
    badge = "Design Collective",
    title1 = "Elevate Your Digital Vision",
    title2 = "Crafting Exceptional Websites",
}: {
    badge?: string;
    title1?: string;
    title2?: string;
}) {
    const { enterDemoMode } = useAuth();
    const navigate = useNavigate();
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5,
                staggerChildren: 0.2,
            },
        },
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background noise-overlay">
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

            <div className="relative z-10 container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/[0.08] dark:bg-white/[0.05] border border-foreground/[0.15] dark:border-white/[0.08] mb-8 md:mb-12"
                    >
                        <DotFilledIcon className="h-2 w-2 fill-primary/80" />
                        <span className="text-xs sm:text-sm text-foreground/60 tracking-wide">
                            {badge}
                        </span>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 md:mb-10 tracking-tight leading-[1.1] sm:leading-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/80 block">
                                {title1}
                            </span>
                            <span
                                className={cn(
                                    "bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground/90 to-primary/70 block mt-1 sm:mt-1"
                                )}
                            >
                                {title2}
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-10 md:mb-12 leading-relaxed font-light tracking-wide max-w-2xl mx-auto px-2 sm:px-4">
                            The complete trading journal platform for serious traders. 
                            Track, analyze, and optimize your trading performance with professional tools.
                        </p>
                    </motion.div>

                    {/* Social proof avatars */}
                    <motion.div
                        custom={3}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex items-center justify-center gap-3 mb-8 sm:mb-10"
                    >
                        <div className="flex -space-x-2.5">
                            {[
                                { initials: 'JM', bg: 'bg-amber-500' },
                                { initials: 'AR', bg: 'bg-yellow-600' },
                                { initials: 'KT', bg: 'bg-amber-600' },
                                { initials: 'DS', bg: 'bg-yellow-500' },
                                { initials: 'LP', bg: 'bg-amber-400' },
                            ].map((user, i) => (
                                <div
                                    key={i}
                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-background ${user.bg} flex items-center justify-center text-[10px] sm:text-xs font-bold text-black`}
                                >
                                    {user.initials}
                                </div>
                            ))}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">1,200+</span> traders journaling
                        </div>
                    </motion.div>

                    <motion.div
                        custom={4}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Button
                            onClick={() => {
                                enterDemoMode();
                                navigate('/dashboard');
                            }}
                            className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300 w-auto min-w-[160px] sm:min-w-[200px]"
                        >
                            View Live Demo
                        </Button>
                        <Link to="/signup">
                            <Button
                                variant="outline"
                                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base text-foreground shadow-md hover:shadow-lg hover:scale-[1.02] transition-[transform,box-shadow] duration-300 w-auto min-w-[160px] sm:min-w-[200px] border-2 border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/10"
                            >
                                Sign Up Free
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none z-[2]">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/80" />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-background" />
            </div>
        </div>
    );
}

export { HeroGeometric }
