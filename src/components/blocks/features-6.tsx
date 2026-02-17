import { lazy, Suspense } from 'react'
import { Activity, CalendarDays, Globe, HardDrive } from 'lucide-react'

const ShowcasePlayer = lazy(() => import('@/components/remotion/ShowcasePlayer'))

export function FreeTradeJournalFeatures() {
    return (
        <section className="py-14 sm:py-16">
            <div className="mx-auto max-w-7xl space-y-16 px-6">
                <div className="relative z-10 grid items-center gap-6 md:grid-cols-2 md:gap-16">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">Professional trading journal & analytics</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-lg sm:ml-auto">Track every trade, spot what's working, and build consistency — with professional analytics, journaling, and performance tools. Free forever, no credit card required.</p>
                </div>
                <div className="relative rounded-3xl p-3 md:-mx-8 lg:col-span-3">
                    <div className="relative">
                        <img
                          src="/images/landing/Trading dashboard New screenshot.png"
                          alt="FreeTradeJournal Dashboard"
                          className="z-10 w-full aspect-video rounded-2xl object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 z-20 rounded-2xl overflow-hidden">
                            <Suspense fallback={null}>
                                <ShowcasePlayer />
                            </Suspense>
                        </div>
                    </div>
                </div>
                <div className="relative mx-auto grid grid-cols-2 gap-6 lg:gap-8 lg:grid-cols-4">
                    <div className="space-y-4 p-6 rounded-xl border border-transparent hover:bg-muted/80 hover:shadow-md transition-shadow duration-200 min-h-[140px] flex flex-col">
                        <div className="flex items-center gap-3">
                            <Activity className="size-6 text-amber-400" />
                            <h3 className="text-base font-semibold">Real-Time Metrics</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed font-medium flex-1">Live P&L tracking, win rate calculations, and profit factor analytics update instantly.</p>
                    </div>
                    <div className="space-y-4 p-6 rounded-xl border border-transparent hover:bg-muted/80 hover:shadow-md transition-shadow duration-200 min-h-[140px] flex flex-col">
                        <div className="flex items-center gap-3">
                            <Globe className="size-6 text-primary" />
                            <h3 className="text-base font-semibold">Multi-Market Support</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed font-medium flex-1">Track forex pairs, futures contracts, and indices with instrument-specific analytics.</p>
                    </div>
                    <div className="space-y-4 p-6 rounded-xl border border-transparent hover:bg-muted/80 hover:shadow-md transition-shadow duration-200 min-h-[140px] flex flex-col">
                        <div className="flex items-center gap-3">
                            <HardDrive className="size-6 text-amber-300" />
                            <h3 className="text-base font-semibold">Local Storage</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed font-medium flex-1">Your data stays on your device with secure local storage. No servers, no accounts required.</p>
                    </div>
                    <div className="space-y-4 p-6 rounded-xl border border-transparent hover:bg-muted/80 hover:shadow-md transition-shadow duration-200 min-h-[140px] flex flex-col">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="size-6 text-primary" />
                            <h3 className="text-base font-semibold">Calendar Heatmap</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed font-medium flex-1">Visual calendar showing daily P&L performance with color-coded profit/loss days.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
