'use client';

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeatureShowcaseProps {
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    images: {
        src: string;
        alt: string;
        className?: string;
    }[];
    reverseLayout?: boolean;
    imageLayout?: 'stack' | 'grid' | 'carousel' | 'overlap';
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
    title,
    description,
    images,
    reverseLayout = false,
    imageLayout = 'stack',
}) => {

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.15,
            }
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut" as const
            }
        },
    };

    const layoutClasses = reverseLayout
        ? "lg:grid-cols-2 lg:grid-flow-col-dense"
        : "lg:grid-cols-2";

    const textOrderClass = reverseLayout ? "lg:col-start-2" : "";
    const imageOrderClass = reverseLayout ? "lg:col-start-1" : "";

    const renderImages = () => {
        switch (imageLayout) {
            case 'grid':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        {images.map((img, index) => (
                            <motion.div
                                key={index}
                                className="relative overflow-hidden rounded-2xl shadow-2xl"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className={cn(
                                        "w-full h-full object-cover hover:scale-105 transition-transform duration-500",
                                        img.className
                                    )}
                                />
                            </motion.div>
                        ))}
                    </div>
                );
            
            case 'overlap':
                return (
                    <div className="relative h-[400px] md:h-[600px]">
                        {images.map((img, index) => (
                            <motion.div
                                key={index}
                                className={cn(
                                    "absolute rounded-2xl shadow-2xl overflow-hidden",
                                    index === 0 ? "w-[85%] h-[85%] z-20" : "w-[75%] h-[75%] z-10",
                                    index === 0 ? "top-0 left-0" : "bottom-0 right-0"
                                )}
                                initial={{ 
                                    opacity: 0, 
                                    x: index === 0 ? -50 : 50,
                                    y: index === 0 ? -50 : 50 
                                }}
                                whileInView={{ 
                                    opacity: 1, 
                                    x: 0,
                                    y: 0 
                                }}
                                transition={{ duration: 0.8, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className={cn(
                                        "w-full h-full object-cover",
                                        img.className
                                    )}
                                />
                            </motion.div>
                        ))}
                    </div>
                );
            
            case 'carousel':
                return (
                    <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                        <div className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide">
                            {images.map((img, index) => (
                                <motion.div
                                    key={index}
                                    className="flex-shrink-0 w-full snap-center"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <img
                                        src={img.src}
                                        alt={img.alt}
                                        className={cn(
                                            "w-full h-auto",
                                            img.className
                                        )}
                                    />
                                </motion.div>
                            ))}
                        </div>
                        {/* Carousel indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                            {images.map((_, index) => (
                                <div
                                    key={index}
                                    className="w-2 h-2 rounded-full bg-white/50"
                                />
                            ))}
                        </div>
                    </div>
                );
            
            case 'stack':
            default:
                // Single image display with enhanced presentation
                if (images.length === 1) {
                    return (
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            viewport={{ once: true }}
                        >
                            {/* Decorative background blur */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 blur-3xl opacity-50" />
                            
                            {/* Main image container */}
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/10">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <img
                                        src={images[0].src}
                                        alt={images[0].alt}
                                        className={cn(
                                            "w-full h-auto",
                                            images[0].className
                                        )}
                                    />
                                    {/* Subtle gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                                </motion.div>
                            </div>
                        </motion.div>
                    );
                }
                
                // Multiple images stacked
                return (
                    <div className="relative">
                        {images.map((img, index) => (
                            <motion.div
                                key={index}
                                className={cn(
                                    "relative rounded-3xl shadow-2xl overflow-hidden",
                                    index > 0 && "mt-[-20%]"
                                )}
                                initial={{ 
                                    opacity: 0, 
                                    y: 50,
                                    scale: 0.95
                                }}
                                whileInView={{ 
                                    opacity: 1, 
                                    y: 0,
                                    scale: 1
                                }}
                                transition={{ 
                                    duration: 0.6, 
                                    delay: index * 0.15,
                                    ease: "easeOut"
                                }}
                                viewport={{ once: true }}
                                style={{
                                    zIndex: images.length - index
                                }}
                                whileHover={{ 
                                    y: -10,
                                    transition: { duration: 0.3 }
                                }}
                            >
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className={cn(
                                        "w-full h-auto",
                                        img.className
                                    )}
                                />
                                {/* Gradient overlay for depth */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                            </motion.div>
                        ))}
                    </div>
                );
        }
    };

    return (
        <section className="relative py-16 md:py-24 overflow-hidden">
            <div className="w-full px-4 sm:px-6 md:px-12 relative z-10 mx-auto" style={{maxWidth: '1280px'}}>
                <motion.div
                    className={`grid grid-cols-1 gap-12 lg:gap-20 w-full items-center ${layoutClasses}`}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {/* Text Content */}
                    <motion.div
                        className={`flex flex-col items-start gap-6 w-full ${textOrderClass}`}
                        variants={itemVariants}
                    >
                        <div className="space-y-4 w-full">
                            <h2 className="text-foreground text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                                {title}
                            </h2>
                        </div>

                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                            {description}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                                Try It Now
                            </button>
                            <button className="border border-border hover:border-primary/50 text-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-200">
                                Learn More
                            </button>
                        </div>
                    </motion.div>

                    {/* Image Content */}
                    <motion.div
                        className={`relative w-full ${imageOrderClass}`}
                        variants={itemVariants}
                    >
                        {renderImages()}
                    </motion.div>
                </motion.div>
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
            </div>
        </section>
    );
};

export default FeatureShowcase;