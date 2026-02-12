'use client';

import React from "react";
import { motion } from "framer-motion";

interface SectionWithMockupProps {
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    primaryImageSrc: string;
    secondaryImageSrc: string;
    reverseLayout?: boolean;
}

const SectionWithMockup: React.FC<SectionWithMockupProps> = ({
    title,
    description,
    primaryImageSrc,
    secondaryImageSrc,
    reverseLayout = false,
}) => {

    const containerVariants = {
        hidden: {},
        visible: {
             transition: {
                staggerChildren: 0.2,
            }
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
    };

    const layoutClasses = reverseLayout
        ? "md:grid-cols-2 md:grid-flow-col-dense"
        : "md:grid-cols-2";

    const textOrderClass = reverseLayout ? "md:col-start-2" : "";
    const imageOrderClass = reverseLayout ? "md:col-start-1" : "";


    return (
        <section className="relative py-20 md:py-20">
            <div className="w-full px-6 md:px-12 relative z-10 mx-auto" style={{maxWidth: '1200px'}}>
                <motion.div
                     className={`grid grid-cols-1 gap-16 md:gap-16 w-full items-center ${layoutClasses}`}
                     variants={containerVariants}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true, amount: 0.2 }}
                >
                    {/* Text Content */}
                    <motion.div
                        className={`flex flex-col items-start gap-8 mt-10 md:mt-0 w-full max-w-[600px] mx-auto md:mx-0 ${textOrderClass}`}
                        variants={itemVariants}
                    >
                         <div className="space-y-4 w-full">
                            <h2 className="text-foreground text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.6] break-words">
                                {title}
                            </h2>
                        </div>

                        <p className="text-gray-300/85 text-lg leading-[1.6] font-normal">
                            {description}
                        </p>
                         
                         <div className="flex flex-col sm:flex-row gap-6 mt-8" style={{marginTop: '32px'}}>
                            <button className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-4 rounded-md font-bold text-lg shadow-lg hover:shadow-xl transition-shadow duration-200 min-w-[200px] focus:ring-2 focus:ring-primary/50">
                                Try Dashboard
                            </button>
                            <button className="border border-gray-600 hover:border-gray-500 text-foreground/85 px-8 py-4 rounded-md font-semibold text-lg transition-opacity duration-200 min-w-[160px] hover:opacity-80 focus:ring-2 focus:ring-gray-500/50">
                                View Features
                            </button>
                         </div>
                    </motion.div>

                    {/* App mockup/Image Content */}
                    <motion.div
                        className={`relative mt-10 md:mt-0 mx-auto ${imageOrderClass} w-full max-w-[400px] md:max-w-[550px] hover:scale-105 transition-transform duration-300`}
                        variants={itemVariants}
                    >
                        {/* Decorative Background Element */}
                        <motion.div
                             className={`absolute w-[320px] h-[340px] md:w-[520px] md:h-[550px] bg-muted/30 rounded-[40px] z-0 shadow-2xl`}
                             style={{
                                top: reverseLayout ? 'auto' : '8%',
                                bottom: reverseLayout ? '8%' : 'auto',
                                left: reverseLayout ? 'auto' : '5%',
                                right: reverseLayout ? '5%' : 'auto',
                                transform: reverseLayout ? 'translate(0, 0)' : 'translateY(8%)',
                                filter: 'blur(1px)'
                            }}
                            initial={{ y: reverseLayout ? 0 : 0 }}
                            whileInView={{ y: reverseLayout ? -25 : -35 }}
                            transition={{ duration: 1.2 }}
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            <div
                                className="relative w-full h-full bg-cover bg-center rounded-[40px] shadow-xl"
                                style={{
                                    backgroundImage: `url(${secondaryImageSrc})`,
                                }}
                            />
                        </motion.div>

                        {/* Main Mockup Card */}
                        <motion.div
                            className="relative w-full h-[420px] md:h-[680px] bg-card/20 rounded-[40px] backdrop-blur-[20px] backdrop-brightness-[105%] border border-white/10 z-10 overflow-hidden shadow-2xl"
                            initial={{ y: reverseLayout ? 0 : 0 }}
                            whileInView={{ y: reverseLayout ? 25 : 35 }}
                             transition={{ duration: 1.2, delay: 0.1 }}
                             viewport={{ once: true, amount: 0.5 }}
                        >
                            <div className="p-0 h-full">
                                <div
                                    className="h-full relative rounded-[40px] overflow-hidden"
                                    style={{
                                        backgroundSize: "contain",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat"
                                    }}
                                >
                                    {/* Primary Image */}
                                    <div
                                        className="w-full h-full bg-contain bg-center bg-no-repeat transition-transform duration-500 hover:scale-105"
                                        style={{
                                            backgroundImage: `url(${primaryImageSrc})`,
                                        }}
                                    />
                                    {/* Overlay for better text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Decorative bottom gradient */}
            <div
                className="absolute w-full h-px bottom-0 left-0 z-0"
                style={{
                    background:
                        "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%)",
                }}
            />
        </section>
    );
};


export default SectionWithMockup;