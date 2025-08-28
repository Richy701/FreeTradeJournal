import { BarChart3, Lock, TrendingUp, Zap } from 'lucide-react'

export function TradeVaultFeatures() {
    return (
        <section className="py-16 md:py-24">
            <div className="mx-auto max-w-6xl space-y-16 px-6">
                <div className="relative z-10 grid items-center gap-6 md:grid-cols-2 md:gap-16">
                    <h2 className="text-4xl lg:text-5xl font-bold leading-tight">Professional trading journal & analytics</h2>
                    <p className="text-lg lg:text-xl text-gray-300 leading-relaxed max-w-lg sm:ml-auto">Comprehensive trading platform with mood tracking, screenshot attachments, and cloud sync. Features beautiful equity curves, professional analytics, and secure Firebase storage.</p>
                </div>
                <div className="relative rounded-3xl p-3 md:-mx-8 lg:col-span-3">
                    <div className="aspect-[88/36] relative">
                        <div className="bg-gradient-to-t z-1 from-background absolute inset-0 to-transparent"></div>
                        <img src="/screenshots/Trading%20Dasboard%20original%20theme.png" className="absolute inset-0 z-10 w-full h-full object-cover rounded-2xl" alt="TradeVault Dashboard" width={2797} height={1137} />
                    </div>
                </div>
                <div className="relative mx-auto grid grid-cols-2 gap-6 lg:gap-8 lg:grid-cols-4">
                    <div className="space-y-4 p-6 rounded-xl hover:bg-gray-800/50 transition-colors duration-150 min-h-[140px] flex flex-col">
                        <div className="flex items-center gap-3">
                            <Zap className="size-6 text-yellow-500" />
                            <h3 className="text-base font-semibold">Real-Time Metrics</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed font-medium flex-1">Live P&L tracking, win rate calculations, and profit factor analytics update instantly.</p>
                    </div>
                    <div className="space-y-4 p-6 rounded-xl hover:bg-gray-800/50 transition-colors duration-150 min-h-[140px] flex flex-col">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="size-6 text-green-500" />
                            <h3 className="text-base font-semibold">Multi-Market Support</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed font-medium flex-1">Track forex pairs, futures contracts, and indices with instrument-specific analytics.</p>
                    </div>
                    <div className="space-y-4 p-6 rounded-xl hover:bg-gray-800/50 transition-colors duration-150 min-h-[140px] flex flex-col">
                        <div className="flex items-center gap-3">
                            <Lock className="size-6 text-blue-500" />
                            <h3 className="text-base font-semibold">Cloud Storage</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed font-medium flex-1">Secure Firebase cloud storage with multi-device sync and automatic backups.</p>
                    </div>
                    <div className="space-y-4 p-6 rounded-xl hover:bg-gray-800/50 transition-colors duration-150 min-h-[140px] flex flex-col">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="size-6 text-primary" />
                            <h3 className="text-base font-semibold">Calendar Heatmap</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed font-medium flex-1">Visual calendar showing daily P&L performance with color-coded profit/loss days.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
