import { BarChart3, Lock, TrendingUp, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function TradeVaultFeatures() {
    return (
        <section className="py-20 md:py-20">
            <div className="mx-auto space-y-16 px-6 md:px-12" style={{maxWidth: '1200px'}}>
                <div className="relative z-10 grid items-center gap-8 md:grid-cols-2 md:gap-16">
                    <h2 className="text-3xl font-bold leading-[1.6]">Professional forex & futures analytics</h2>
                    <p className="text-lg text-gray-300/85 leading-[1.6] max-w-lg sm:ml-auto font-normal">Monitor real-time P&L, win rates, profit factors, and equity curves. Track trades across multiple markets with automatic calculations and interactive visualizations.</p>
                </div>
                <div className="relative rounded-3xl p-3 md:-mx-8 lg:col-span-3">
                    <div className="aspect-[16/9] relative">
                        <div className="bg-gradient-to-t z-1 from-background absolute inset-0 to-transparent"></div>
                        <img src="/screenshots/Trading%20Dasboard%20original%20theme.png" className="absolute inset-0 z-10 w-full h-full object-contain rounded-2xl border border-gray-700/30" alt="TradeVault Dashboard" width={2797} height={1137} />
                    </div>
                </div>
                <div className="relative mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-8">
                    <Card className="relative overflow-hidden hover:opacity-90 transition-opacity duration-200 border border-gray-800/50 hover:border-gray-700/70">
                        <CardContent className="relative m-auto size-fit p-4">
                            <div className="relative w-full p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
                                <img 
                                    src="/screenshots/winrate-original-theme.png" 
                                    className="w-full h-auto rounded-md" 
                                    alt="TradeVault Win Rate"
                                />
                            </div>
                            <h2 className="mt-6 text-center text-xl font-bold leading-[1.6]">Win Rate Analytics</h2>
                            <p className="mt-2 text-center text-gray-400/85 font-normal leading-[1.6]">Real-time win rate tracking with visual breakdown</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="relative overflow-hidden hover:opacity-90 transition-opacity duration-200 border border-gray-800/50 hover:border-gray-700/70">
                        <CardContent className="relative m-auto size-fit p-4">
                            <div className="relative w-full p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
                                <img 
                                    src="/screenshots/Stats%20cards%20original%20theme%20.png" 
                                    className="w-full h-auto rounded-md" 
                                    alt="TradeVault Key Metrics"
                                />
                            </div>
                            <h2 className="mt-6 text-center text-xl font-bold leading-[1.6]">Performance Metrics</h2>
                            <p className="mt-2 text-center text-gray-400/85 font-normal leading-[1.6]">Total P&L, Profit Factor & Trade Count</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="relative overflow-hidden hover:opacity-90 transition-opacity duration-200 border border-gray-800/50 hover:border-gray-700/70">
                        <CardContent className="p-4">
                            <div className="relative w-full p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
                                <img 
                                    src="/screenshots/Equity%20edge%20.png" 
                                    className="w-full h-auto rounded-md" 
                                    alt="TradeVault Equity Curve"
                                />
                            </div>
                            <div className="relative z-10 mt-6 space-y-2 text-center">
                                <h2 className="text-xl font-bold leading-[1.6]">Equity Curve</h2>
                                <p className="text-gray-300/85 font-normal leading-[1.6]">Interactive equity curve visualization showing performance trends</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}