import { lazy, Suspense, useState, useEffect } from 'react'
import { Activity, CalendarDays, Globe, HardDrive } from 'lucide-react'

const ShowcasePlayer = lazy(() => import('@/components/remotion/ShowcasePlayer'))

export function FreeTradeJournalFeatures() {
    const [showPlayer, setShowPlayer] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setShowPlayer(true), 3000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <section className="py-14 sm:py-16">
            <div className="mx-auto max-w-7xl space-y-16 px-6">
                <div className="relative z-10 grid items-center gap-6 md:grid-cols-2 md:gap-16">
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">Professional trading journal & analytics</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-lg sm:ml-auto">Track every trade, spot what's working, and build consistency — with professional analytics, journaling, and performance tools. Free forever, no credit card required.</p>
                </div>
                <div className="relative rounded-3xl p-0 md:p-3 md:-mx-8 lg:col-span-3">
                    <div className="aspect-video rounded-2xl overflow-hidden">
                        {showPlayer ? (
                            <Suspense fallback={
                                <img
                                  src="/images/landing/trading-dashboard-screenshot.png"
                                  alt="FreeTradeJournal Dashboard"
                                  className="w-full h-full object-cover"
                                  width={1280}
                                  height={720}
                                />
                            }>
                                <ShowcasePlayer />
                            </Suspense>
                        ) : (
                            <img
                              src="/images/landing/trading-dashboard-screenshot.png"
                              alt="FreeTradeJournal Dashboard"
                              className="w-full aspect-video rounded-2xl object-cover"
                              decoding="async"
                              width={1280}
                              height={720}
                            />
                        )}
                    </div>
                </div>
                {/* Asymmetric bento grid — hero card + offset smaller cards */}
                <div className="relative mx-auto grid grid-cols-2 gap-4 lg:gap-5 lg:grid-cols-12 lg:grid-rows-2">
                    {/* Hero feature — spans 2 cols + 2 rows on lg */}
                    <div className="col-span-2 lg:col-span-5 lg:row-span-2 space-y-5 p-8 rounded-2xl bg-gradient-to-br from-primary/[0.06] to-transparent border border-primary/10 hover:border-primary/20 hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <Activity className="size-6 text-primary" />
                            </div>
                            <h3 className="font-display text-lg font-semibold">Real-Time Metrics</h3>
                        </div>
                        <p className="text-muted-foreground text-base leading-relaxed font-medium flex-1">Live P&L tracking, win rate calculations, and profit factor analytics that update instantly as you log trades. See your edge in real-time.</p>
                        {/* Decorative chart line */}
                        <svg className="absolute bottom-0 right-0 w-48 h-32 text-primary/[0.06]" viewBox="0 0 200 120" fill="none"><polyline points="0,100 30,80 60,90 90,40 120,55 150,20 180,35 200,10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {/* Top-right card */}
                    <div className="lg:col-span-4 space-y-4 p-6 rounded-xl border border-border/50 hover:bg-muted/60 hover:shadow-md transition-all duration-200 flex flex-col">
                        <div className="flex items-center gap-3">
                            <Globe className="size-5 text-primary" />
                            <h3 className="text-base font-semibold">Multi-Market Support</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed font-medium flex-1">Track forex pairs, futures contracts, and indices with instrument-specific analytics.</p>
                    </div>
                    {/* Far-right card */}
                    <div className="lg:col-span-3 space-y-4 p-6 rounded-xl border border-border/50 hover:bg-muted/60 hover:shadow-md transition-all duration-200 flex flex-col">
                        <div className="flex items-center gap-3">
                            <HardDrive className="size-5 text-amber-300" />
                            <h3 className="text-base font-semibold">Local Storage</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed font-medium flex-1">Your data stays on your device with secure local storage. No servers required.</p>
                    </div>
                    {/* Bottom-right card — spans remaining cols */}
                    <div className="col-span-2 lg:col-span-7 space-y-4 p-6 rounded-xl border border-border/50 hover:bg-muted/60 hover:shadow-md transition-all duration-200 flex flex-col">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="size-5 text-primary" />
                            <h3 className="text-base font-semibold">Calendar Heatmap</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed font-medium flex-1">Visual calendar showing daily P&L performance with color-coded profit/loss days. Spot patterns and track consistency at a glance.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
