import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Landing page product tour: tabs over the real app screenshots. Auto-advances
// while it's on screen and the visitor isn't interacting; clicking a tab hands
// control to them and stops the autoplay.
const SLIDES = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        image: 'trading-dashboard-screenshot',
        alt: 'FreeTradeJournal dashboard with total P&L, win rate, profit factor and macro snapshot',
        caption: 'See your P&L, win rate and profit factor the moment you open the app.',
    },
    {
        id: 'trade-log',
        label: 'Trade Log',
        image: 'trading-log-screenshot',
        alt: 'Trade Log table with entries, exits, P&L and strategy tags',
        caption: 'Every trade in one table. Filter by symbol, side, strategy or date.',
    },
    {
        id: 'insights',
        label: 'Insights',
        image: 'trade-insights-screenshot',
        alt: 'Trade Insights with trader profile radar, long vs short win rate and strategy breakdown',
        caption: 'Find out which strategies and directions actually make you money.',
    },
    {
        id: 'journal',
        label: 'Journal',
        image: 'trading-journal-screenshot',
        alt: 'Trading journal entries with notes, mood tags and linked trades',
        caption: 'Write down what you saw and how you felt, next to the trades themselves.',
    },
    {
        id: 'proptracker',
        label: 'PropTracker',
        image: 'prop-tracker-screenshot',
        alt: 'PropTracker showing evaluation fees, payouts and net P&L per prop firm',
        caption: 'Track every evaluation fee and payout to see if prop firms are paying off.',
    },
] as const

const SLIDE_MS = 5500
const src = (name: string, w?: number) => `/images/screenshots/${name}${w ? `-${w}w` : ''}.webp`

export function ProductTour() {
    const reduceMotion = !!useReducedMotion()
    const [active, setActive] = useState(0)
    const [autoplay, setAutoplay] = useState(!reduceMotion)
    const [paused, setPaused] = useState(false)
    const [inView, setInView] = useState(false)
    const [pageVisible, setPageVisible] = useState(true)
    const rootRef = useRef<HTMLDivElement>(null)
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const onVisibility = () => setPageVisible(document.visibilityState === 'visible')
        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
    }, [])

    useEffect(() => {
        if (reduceMotion) setAutoplay(false)
    }, [reduceMotion])

    const running = autoplay && !paused && inView && pageVisible

    useEffect(() => {
        if (!running) return
        const t = window.setTimeout(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_MS)
        return () => clearTimeout(t)
    }, [running, active])

    // Warm the next screenshot so the crossfade never lands on a blank frame.
    useEffect(() => {
        if (!inView) return
        const next = SLIDES[(active + 1) % SLIDES.length]
        const img = new Image()
        img.src = src(next.image, 1280)
    }, [active, inView])

    const choose = useCallback((i: number) => {
        setAutoplay(false)
        setActive(i)
    }, [])

    const onTabKey = (e: React.KeyboardEvent, i: number) => {
        let next = -1
        if (e.key === 'ArrowRight') next = (i + 1) % SLIDES.length
        else if (e.key === 'ArrowLeft') next = (i - 1 + SLIDES.length) % SLIDES.length
        else if (e.key === 'Home') next = 0
        else if (e.key === 'End') next = SLIDES.length - 1
        if (next < 0) return
        e.preventDefault()
        choose(next)
        tabRefs.current[next]?.focus()
    }

    const slide = SLIDES[active]

    return (
        <div
            ref={rootRef}
            className="mx-auto w-full max-w-6xl"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false) }}
        >
            <div role="tablist" aria-label="Product tour" className="flex flex-wrap justify-center gap-x-1 gap-y-2 sm:gap-x-2 mb-5 sm:mb-6">
                {SLIDES.map((s, i) => {
                    const selected = i === active
                    return (
                        <button
                            key={s.id}
                            ref={(el) => { tabRefs.current[i] = el }}
                            role="tab"
                            id={`tour-tab-${s.id}`}
                            aria-selected={selected}
                            aria-controls="tour-panel"
                            tabIndex={selected ? 0 : -1}
                            onClick={() => choose(i)}
                            onKeyDown={(e) => onTabKey(e, i)}
                            className={cn(
                                'relative overflow-hidden rounded-lg px-3 sm:px-4 pt-2 pb-2.5 text-sm font-medium transition-colors duration-200',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                                selected ? 'text-foreground bg-muted/60' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                            )}
                        >
                            {s.label}
                            {selected && (
                                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-amber-500/20" aria-hidden="true">
                                    <motion.span
                                        key={`${active}-${running ? 'run' : 'hold'}`}
                                        className="block h-full rounded-full bg-amber-500"
                                        initial={{ width: running ? '0%' : '100%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: running ? SLIDE_MS / 1000 : 0, ease: 'linear' }}
                                    />
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            <div
                id="tour-panel"
                role="tabpanel"
                aria-labelledby={`tour-tab-${slide.id}`}
                className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-[#050505]"
            >
                <AnimatePresence initial={false}>
                    <motion.div
                        key={slide.id}
                        className="absolute inset-0"
                        initial={reduceMotion ? false : { opacity: 0, scale: 1.015 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Blurred copy fills any letterbox so wider shots (the
                            dashboard) don't show a hard edge against the stage */}
                        <img
                            src={src(slide.image, 640)}
                            alt=""
                            aria-hidden="true"
                            decoding="async"
                            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
                        />
                        <img
                            src={src(slide.image, 1280)}
                            srcSet={`${src(slide.image, 640)} 640w, ${src(slide.image, 1280)} 1280w, ${src(slide.image)} 3300w`}
                            sizes="(max-width: 1200px) 100vw, 1152px"
                            alt={slide.alt}
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-contain"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="mt-4 sm:mt-5 min-h-[3rem] text-center" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                        key={slide.id}
                        className="text-base sm:text-lg text-muted-foreground"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                    >
                        {slide.caption}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    )
}
