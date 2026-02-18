import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BarChart3, TrendingUp } from 'lucide-react'
import { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
        opacity: 1, 
        y: 0
    }
}

export function Features() {
    return (
        <section className="py-20 md:py-32 bg-background">
            <div className="mx-auto max-w-2xl px-6 lg:max-w-6xl">
                {/* Section Header */}
                <motion.div 
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Complete Trading Journal Platform
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Track forex pairs, futures contracts, and indices with comprehensive trade logging, performance analytics, and risk management tools.
                    </p>
                </motion.div>

                <motion.div 
                    className="mx-auto grid gap-6 lg:grid-cols-2"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <motion.div variants={itemVariants}>
                        <FeatureCard>
                            <CardHeader className="pb-3">
                                <CardHeading
                                    icon={TrendingUp}
                                    title="Multi-Market Trade Logging"
                                    description="Log trades across forex, futures, and indices with automatic P&L calculations, spread tracking, and commission accounting."
                                />
                            </CardHeader>

                            <div className="relative mb-6 border-t border-dashed sm:mb-0 overflow-hidden">
                                <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,hsl(var(--muted)),white_125%)]"></div>
                                <motion.div 
                                    className="aspect-[76/59] p-1 px-6"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <DualModeImage
                                        darkSrc="/screenshots/add%20a%20new%20trade%20original%20theme%20.png"
                                        lightSrc="/screenshots/add%20a%20new%20trade%20original%20theme%20.png"
                                        alt="trading dashboard illustration"
                                        width={1207}
                                        height={929}
                                    />
                                </motion.div>
                            </div>
                        </FeatureCard>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <FeatureCard>
                            <CardHeader className="pb-3">
                                <CardHeading
                                    icon={BarChart3}
                                    title="Performance Metrics Dashboard"
                                    description="Real-time win rate, profit factor, and equity curve visualization with calendar heatmaps showing daily performance."
                                />
                            </CardHeader>

                            <CardContent>
                                <div className="relative mb-6 sm:mb-0 overflow-hidden">
                                    <div className="absolute -inset-6 [background:radial-gradient(50%_50%_at_75%_50%,transparent,hsl(var(--background))_100%)]"></div>
                                    <motion.div 
                                        className="aspect-[76/59] border rounded-lg overflow-hidden"
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <DualModeImage
                                            darkSrc="/screenshots/P%26L%20STATS%20original%20theme.png"
                                            lightSrc="/screenshots/Stats%20cards%20original%20theme%20.png"
                                            alt="trading analytics illustration"
                                            width={1207}
                                            height={929}
                                        />
                                    </motion.div>
                                </div>
                            </CardContent>
                        </FeatureCard>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    )
}

interface FeatureCardProps {
    children: ReactNode
    className?: string
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <motion.div
        whileHover={{ 
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
        transition={{ duration: 0.3 }}
        className="h-full"
    >
        <Card className={cn('group relative rounded-lg shadow-lg hover:shadow-xl transition-[transform,box-shadow] duration-300 h-full border-2 hover:border-primary/30', className)}>
            <CardDecorator />
            {children}
        </Card>
    </motion.div>
)

const CardDecorator = () => (
    <>
        <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
        <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
        <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
        <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
    </>
)

interface CardHeadingProps {
    icon: LucideIcon
    title: string
    description: string
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
    <div className="p-6">
        <motion.div 
            className="text-muted-foreground flex items-center gap-3 mb-6"
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors"
            >
                <Icon className="size-5 text-primary" />
            </motion.div>
            <span className="font-medium text-sm uppercase tracking-wide">{title}</span>
        </motion.div>
        <h3 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
            {description}
        </h3>
    </div>
)

interface DualModeImageProps {
    darkSrc: string
    lightSrc: string
    alt: string
    width: number
    height: number
    className?: string
}

const DualModeImage = ({ darkSrc, lightSrc, alt, width, height, className }: DualModeImageProps) => (
    <>
        <img
            src={darkSrc}
            className={cn('hidden dark:block', className)}
            alt={`${alt} dark`}
            width={width}
            height={height}
        />
        <img
            src={lightSrc}
            className={cn('shadow dark:hidden', className)}
            alt={`${alt} light`}
            width={width}
            height={height}
        />
    </>
)

// Unused interfaces for CircularUI component
// interface CircleConfig { ... }
// interface CircularUIProps { ... }

// CircularUI component commented out as it's not currently used
// const CircularUI = ({ label, circles, className }: CircularUIProps) => (...
