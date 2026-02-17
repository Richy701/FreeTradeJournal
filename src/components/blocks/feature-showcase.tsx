'use client';

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";

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
    const { enterDemoMode } = useAuth();
    const navigate = useNavigate();

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
                                <ResponsiveImage
                                    src={img.src}
                                    alt={img.alt}
                                    className={cn(
                                        "w-full h-full object-cover transition-transform duration-500",
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
                                <ResponsiveImage
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
                                    <ResponsiveImage
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
                            {/* Main image container */}
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/30">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ResponsiveImage
                                        src={images[0].src}
                                        alt={images[0].alt}
                                        className={cn(
                                            "w-full h-auto",
                                            images[0].className
                                        )}
                                    />
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
                                <ResponsiveImage
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
                );
        }
    };

    return (
        <section className="relative py-14 sm:py-16 overflow-hidden">
            <div className="w-full max-w-7xl px-6 relative z-10 mx-auto">
                <motion.div
                    className={`grid grid-cols-1 gap-12 lg:gap-20 w-full items-center ${layoutClasses}`}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {/* Text Content */}
                    <motion.div
                        className={`flex flex-col items-center lg:items-start text-center lg:text-left gap-6 w-full ${textOrderClass}`}
                        variants={itemVariants}
                    >
                        <div className="space-y-4 w-full">
                            <h2 className="text-foreground text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                                {title}
                            </h2>
                        </div>

                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                            {description}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center lg:justify-start">
                            <button
                                onClick={() => {
                                    enterDemoMode();
                                    navigate('/dashboard');
                                }}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300"
                            >
                                Try It Now
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="border-2 border-border hover:border-primary/50 text-foreground px-8 py-3 rounded-lg font-semibold text-base shadow-md hover:shadow-lg hover:scale-[1.02] transition-[transform,box-shadow] duration-300"
                            >
                                Sign Up Free
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

        </section>
    );
};

export default FeatureShowcase;