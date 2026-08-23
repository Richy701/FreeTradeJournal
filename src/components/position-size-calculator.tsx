import { useEffect, useMemo, useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { fetchQuote } from '@/services/market-data'
import {
  FOREX_PAIRS, FUTURES_CONTRACTS, ACCOUNT_CURRENCIES, CURRENCY_SYMBOLS,
  type AccountCurrency,
} from '@/constants/contract-specs'
import { PositionCheckAi } from '@/components/position-check-ai'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Gauge, ArrowsLeftRight, Warning, SlidersHorizontal, ListChecks } from '@phosphor-icons/react'

const STORAGE_KEY = 'ftj-position-calculator-v1'

interface SavedState {
  mode: 'forex' | 'futures'
  accountCurrency: AccountCurrency
  balance: string
  riskMode: 'percent' | 'fixed'
  riskValue: string
  pair: string
  stopPips: string
  tpPips: string
  contract: string
  stopValue: string
  stopUnit: 'ticks' | 'points'
  tpValue: string
}

const DEFAULTS: SavedState = {
  mode: 'forex',
  accountCurrency: 'USD',
  balance: '10000',
  riskMode: 'percent',
  riskValue: '1',
  pair: 'EURUSD',
  stopPips: '20',
  tpPips: '',
  contract: 'MNQ',
  stopValue: '40',
  stopUnit: 'ticks',
  tpValue: '',
}

function loadSaved(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

const num = (s: string): number => {
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : NaN
}

function fmt(n: number, dp = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

function Segmented({ options, value, onChange }: {
  options: { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
}) {
  const { themeColors, alpha } = useThemePresets()
  return (
    <div className="flex gap-0.5 rounded-lg bg-muted p-1">
      {options.map(o => {
        const isActive = value === o.key
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
            style={isActive
              ? { backgroundColor: alpha(themeColors.primary, '12'), color: themeColors.primary }
              : { color: 'hsl(var(--muted-foreground))' }}
            aria-pressed={isActive}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ResultTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold tabular-nums font-mono text-foreground leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono tabular-nums text-foreground">{value}</span>
    </div>
  )
}

// Shared by the in-app page and the public SEO page so the wording stays in
// one place.
export function CalculatorDisclaimer() {
  return (
    <div className="rounded-xl border bg-card/50 p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
      <p>
        This is an educational tool, not trading advice. The results are arithmetic from the numbers you enter; they are not a recommendation to take any trade, and a correctly sized position can still be a bad trade.
      </p>
      <p>
        Pip sizes and contract values follow common conventions and official exchange specifications, but brokers differ. Some quote gold and silver pips differently, CFD contract sizes vary by platform, and exchanges revise specs. Check the pip or tick value shown here against your own platform before you rely on it.
      </p>
      <p>
        Exchange rates used for currency conversion are delayed snapshots, not live executable prices, so the calculated size can differ slightly from your broker's. Trading involves real risk of loss. Position sizing limits how much one trade can cost you; it does not make losses impossible.
      </p>
    </div>
  )
}

export function PositionSizeCalculator() {
  const { themeColors, alpha } = useThemePresets()
  const [state, setState] = useState<SavedState>(loadSaved)
  const [liveRate, setLiveRate] = useState<number | null>(null)
  const [rateFailed, setRateFailed] = useState(false)
  const [manualRate, setManualRate] = useState('')

  const set = (patch: Partial<SavedState>) => setState(s => ({ ...s, ...patch }))

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* quota */ }
  }, [state])

  const pairSpec = FOREX_PAIRS.find(p => p.symbol === state.pair) || FOREX_PAIRS[0]
  const contractSpec = FUTURES_CONTRACTS.find(c => c.symbol === state.contract) || FUTURES_CONTRACTS[0]
  const ccy = state.mode === 'futures' ? '$' : CURRENCY_SYMBOLS[state.accountCurrency]

  // Pip value is denominated in the pair's quote currency. When the account is
  // held in a different currency we need one conversion rate; fetched live via
  // the same-origin quote proxy, editable manually if the fetch fails.
  const needsConversion = state.mode === 'forex' && pairSpec.quote !== state.accountCurrency
  useEffect(() => {
    if (!needsConversion) { setLiveRate(null); setRateFailed(false); return }
    let cancelled = false
    setLiveRate(null)
    setRateFailed(false)
    setManualRate('')
    const direct = `${pairSpec.quote}${state.accountCurrency}`
    const inverse = `${state.accountCurrency}${pairSpec.quote}`
    ;(async () => {
      const d = await fetchQuote(direct)
      if (cancelled) return
      if (d && d.price > 0) { setLiveRate(d.price); return }
      const inv = await fetchQuote(inverse)
      if (cancelled) return
      if (inv && inv.price > 0) { setLiveRate(1 / inv.price); return }
      setRateFailed(true)
    })()
    return () => { cancelled = true }
  }, [needsConversion, pairSpec.quote, state.accountCurrency])

  const conversionRate = needsConversion
    ? (manualRate !== '' ? num(manualRate) : (liveRate ?? NaN))
    : 1

  const results = useMemo(() => {
    const balance = num(state.balance)
    const riskInput = num(state.riskValue)
    if (Number.isNaN(riskInput)) return null
    const riskAmount = state.riskMode === 'percent'
      ? (Number.isNaN(balance) ? NaN : balance * riskInput / 100)
      : riskInput
    if (Number.isNaN(riskAmount)) return null
    const riskPercent = Number.isNaN(balance) ? null : (riskAmount / balance) * 100

    if (state.mode === 'forex') {
      const stop = num(state.stopPips)
      if (Number.isNaN(stop) || Number.isNaN(conversionRate)) return null
      const pipValuePerLot = pairSpec.pipSize * pairSpec.contractSize * conversionRate
      const rawLots = riskAmount / (stop * pipValuePerLot)
      const lots = Math.floor(rawLots * 100) / 100
      const tp = parseFloat(state.tpPips)
      const hasTp = Number.isFinite(tp) && tp > 0
      return {
        kind: 'forex' as const,
        riskAmount,
        riskPercent,
        pipValuePerLot,
        lots,
        units: Math.round(lots * pairSpec.contractSize),
        actualRisk: lots * stop * pipValuePerLot,
        pipValueAtSize: lots * pipValuePerLot,
        reward: hasTp ? lots * tp * pipValuePerLot : null,
        rr: hasTp ? tp / stop : null,
        tooSmall: lots < 0.01,
      }
    }

    const stop = num(state.stopValue)
    if (Number.isNaN(stop)) return null
    const stopTicks = state.stopUnit === 'ticks' ? stop : stop / contractSpec.tickSize
    const riskPerContract = stopTicks * contractSpec.tickValue
    const contracts = Math.floor(riskAmount / riskPerContract)
    const tp = parseFloat(state.tpValue)
    const hasTp = Number.isFinite(tp) && tp > 0
    const tpTicks = state.stopUnit === 'ticks' ? tp : tp / contractSpec.tickSize
    return {
      kind: 'futures' as const,
      riskAmount,
      riskPercent,
      riskPerContract,
      contracts,
      actualRisk: contracts * riskPerContract,
      reward: hasTp ? contracts * tpTicks * contractSpec.tickValue : null,
      rr: hasTp ? tp / stop : null,
      tooSmall: contracts < 1,
    }
  }, [state, pairSpec, contractSpec, conversionRate])

  const instrument = state.mode === 'forex' ? pairSpec.symbol : contractSpec.symbol

  // Everything the AI risk check needs about this plan, pre-formatted so the
  // prompt stays free of raw floats. Null while the inputs are incomplete.
  const aiPayload = useMemo(() => {
    if (!results || results.tooSmall) return null
    const base = {
      mode: state.mode,
      instrument: state.mode === 'forex' ? pairSpec.symbol : `${contractSpec.symbol} (${contractSpec.name})`,
      accountCurrency: ccy.trim(),
      balance: fmt(num(state.balance), 0),
      riskAmount: fmt(results.riskAmount),
      riskPercent: results.riskPercent !== null ? fmt(results.riskPercent, 1) : 'unknown',
      rewardRisk: results.rr !== null ? fmt(results.rr, 1) : null,
    }
    if (results.kind === 'forex') {
      return {
        ...base,
        stopDescription: `${state.stopPips} pips`,
        positionDescription: `${fmt(results.lots)} lots (${results.units.toLocaleString()} units)`,
      }
    }
    return {
      ...base,
      stopDescription: `${state.stopValue} ${state.stopUnit}`,
      positionDescription: `${results.contracts} ${results.contracts === 1 ? 'contract' : 'contracts'}`,
    }
  }, [results, state, pairSpec, contractSpec, ccy])

  const pairGroups = useMemo(() => {
    const groups: Record<string, typeof FOREX_PAIRS> = {}
    for (const p of FOREX_PAIRS) (groups[p.group] ||= []).push(p)
    return groups
  }, [])

  const contractGroups = useMemo(() => {
    const groups: Record<string, typeof FUTURES_CONTRACTS> = {}
    for (const c of FUTURES_CONTRACTS) (groups[c.group] ||= []).push(c)
    return groups
  }, [])

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-12">

      {/* Inputs */}
      <div className="xl:col-span-4 rounded-xl border bg-card/50">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="h-4 w-4 shrink-0" style={{ color: themeColors.primary }} />
            <span className="text-sm font-semibold text-foreground truncate">Trade inputs</span>
          </div>
          <div className="w-40 shrink-0">
            <Segmented
              options={[{ key: 'forex', label: 'Forex' }, { key: 'futures', label: 'Futures' }]}
              value={state.mode}
              onChange={mode => set({ mode: mode as SavedState['mode'] })}
            />
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {state.mode === 'forex' ? (
              <Field label="Account currency">
                <Select value={state.accountCurrency} onValueChange={v => set({ accountCurrency: v as AccountCurrency })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <Field label="Account currency" hint="Futures settle in US dollars.">
                <Input value="USD" disabled className="h-10" />
              </Field>
            )}
            <Field label="Account balance">
              <Input
                type="number" inputMode="decimal" min="0" placeholder="10000"
                value={state.balance} onChange={e => set({ balance: e.target.value })}
                className="h-10"
              />
            </Field>
          </div>

          <Field label="Risk per trade">
            <div className="grid grid-cols-2 gap-3 items-center">
              <Segmented
                options={[{ key: 'percent', label: '%' }, { key: 'fixed', label: 'Fixed' }]}
                value={state.riskMode}
                onChange={riskMode => set({ riskMode: riskMode as SavedState['riskMode'] })}
              />
              <Input
                type="number" inputMode="decimal" min="0" step="0.1" placeholder={state.riskMode === 'percent' ? '1' : '100'}
                value={state.riskValue} onChange={e => set({ riskValue: e.target.value })}
                className="h-10"
              />
            </div>
          </Field>

          {state.mode === 'forex' ? (
            <>
              <Field label="Currency pair" hint={pairSpec.note}>
                <Select value={state.pair} onValueChange={pair => set({ pair })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(pairGroups).map(([group, pairs]) => (
                      <SelectGroup key={group}>
                        <SelectLabel>{group}</SelectLabel>
                        {pairs.map(p => <SelectItem key={p.symbol} value={p.symbol}>{p.symbol}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stop loss (pips)">
                  <Input
                    type="number" inputMode="decimal" min="0" placeholder="20"
                    value={state.stopPips} onChange={e => set({ stopPips: e.target.value })}
                    className="h-10"
                  />
                </Field>
                <Field label="Take profit (pips)">
                  <Input
                    type="number" inputMode="decimal" min="0" placeholder="Optional"
                    value={state.tpPips} onChange={e => set({ tpPips: e.target.value })}
                    className="h-10"
                  />
                </Field>
              </div>
              {needsConversion && (
                <Field
                  label={`Exchange rate: 1 ${pairSpec.quote} in ${state.accountCurrency}`}
                  hint={rateFailed && manualRate === ''
                    ? 'Live rate unavailable — enter the rate manually.'
                    : manualRate !== '' ? 'Using your manual rate.' : liveRate ? 'Live rate, editable.' : 'Fetching live rate...'}
                >
                  <div className="relative">
                    <ArrowsLeftRight className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number" inputMode="decimal" min="0" step="0.0001"
                      value={manualRate !== '' ? manualRate : (liveRate !== null ? String(Number(liveRate.toFixed(5))) : '')}
                      onChange={e => setManualRate(e.target.value)}
                      placeholder={rateFailed ? 'e.g. 1.2650' : 'Fetching...'}
                      className="h-10 pl-9"
                    />
                  </div>
                </Field>
              )}
            </>
          ) : (
            <>
              <Field label="Contract">
                <Select value={state.contract} onValueChange={contract => set({ contract })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(contractGroups).map(([group, contracts]) => (
                      <SelectGroup key={group}>
                        <SelectLabel>{group}</SelectLabel>
                        {contracts.map(c => (
                          <SelectItem key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3 items-end">
                <Field label={`Stop loss (${state.stopUnit})`}>
                  <Input
                    type="number" inputMode="decimal" min="0" placeholder="40"
                    value={state.stopValue} onChange={e => set({ stopValue: e.target.value })}
                    className="h-10"
                  />
                </Field>
                <Field label="Stop measured in">
                  <Segmented
                    options={[{ key: 'ticks', label: 'Ticks' }, { key: 'points', label: 'Points' }]}
                    value={state.stopUnit}
                    onChange={stopUnit => set({ stopUnit: stopUnit as SavedState['stopUnit'] })}
                  />
                </Field>
              </div>
              <Field label={`Take profit (${state.stopUnit})`}>
                <Input
                  type="number" inputMode="decimal" min="0" placeholder="Optional"
                  value={state.tpValue} onChange={e => set({ tpValue: e.target.value })}
                  className="h-10"
                />
              </Field>
            </>
          )}
        </div>
      </div>

      {/* Results — the last card stretches so the column bottom lines up with
          the inputs card next to it. */}
      <div className="xl:col-span-5 flex flex-col gap-4 sm:gap-6 [&>*:last-child]:flex-1">
        <div className={`rounded-xl border bg-card/50 p-5 sm:p-6 ${!results ? 'flex items-center justify-center' : ''}`}>
          {!results ? (
            <div className="flex flex-col items-center gap-2 text-center max-w-sm">
              <Gauge className="h-6 w-6" style={{ color: themeColors.primary }} />
              <p className="text-sm text-muted-foreground">
                Fill in your balance, risk, and stop loss to see your position size.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-1">
                Position size — {results.kind === 'forex' ? pairSpec.symbol : `${contractSpec.symbol} · ${contractSpec.name}`}
              </p>
              {results.kind === 'forex' ? (
                <>
                  <p className="text-4xl sm:text-5xl font-bold tabular-nums font-mono" style={{ color: themeColors.primary }}>
                    {fmt(results.lots)} <span className="text-xl font-semibold text-foreground">lots</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    = {fmt(results.lots * 10, 1)} mini lots · {fmt(results.lots * 100, 0)} micro lots · {results.units.toLocaleString()} units
                  </p>
                </>
              ) : (
                <p className="text-4xl sm:text-5xl font-bold tabular-nums font-mono" style={{ color: themeColors.primary }}>
                  {results.contracts} <span className="text-xl font-semibold text-foreground">{results.contracts === 1 ? 'contract' : 'contracts'}</span>
                </p>
              )}
              {!results.tooSmall && (
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/50">
                  Risking {ccy}{fmt(results.riskAmount)}{results.riskPercent !== null ? ` (${fmt(results.riskPercent, 1)}% of account)` : ''} with a {results.kind === 'forex' ? `${state.stopPips}-pip` : `${state.stopValue}-${state.stopUnit.replace(/s$/, '')}`} stop on {results.kind === 'forex' ? pairSpec.symbol : contractSpec.symbol}.
                </p>
              )}
              {results.tooSmall && (
                <div className="flex items-start gap-2 mt-4 rounded-lg p-3" style={{ backgroundColor: alpha(themeColors.loss, '10') }}>
                  <Warning className="h-4 w-4 shrink-0 mt-0.5" style={{ color: themeColors.loss }} />
                  <p className="text-xs text-muted-foreground">
                    {results.kind === 'forex'
                      ? 'This stop is too wide for your risk amount — even 0.01 lots would risk more than your target. Widen the risk, tighten the stop, or skip the trade.'
                      : `One contract already risks $${fmt(results.riskPerContract)}, more than your $${fmt(results.riskAmount)} target. Consider the micro version of this contract, a tighter stop, or a larger risk budget.`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {results && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <ResultTile
              label="Target risk"
              value={`${ccy}${fmt(results.riskAmount)}`}
              sub={results.riskPercent !== null ? `${fmt(results.riskPercent, 1)}% of account` : undefined}
            />
            <ResultTile
              label="Actual risk at this size"
              value={`${ccy}${fmt(results.actualRisk)}`}
              sub="Rounded down, never above target"
            />
            {results.kind === 'forex' ? (
              <ResultTile
                label="Pip value at this size"
                value={`${ccy}${fmt(results.pipValueAtSize)}`}
                sub={`${ccy}${fmt(results.pipValuePerLot)} per standard lot`}
              />
            ) : (
              <ResultTile
                label="Risk per contract"
                value={`$${fmt(results.riskPerContract)}`}
                sub={`${state.stopValue || '—'} ${state.stopUnit} stop`}
              />
            )}
            {results.reward !== null && results.rr !== null ? (
              <ResultTile
                label="Potential reward"
                value={`${ccy}${fmt(results.reward)}`}
                sub={`Risk : reward 1 : ${fmt(results.rr, 1)}`}
              />
            ) : (
              <ResultTile label="Risk : reward" value="—" sub="Add a take profit to see it" />
            )}
          </div>
        )}

        {results && !results.tooSmall && (
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* What the size would be at other risk levels */}
            {results.riskPercent !== null && (
              <div className="rounded-xl border bg-card/50 p-4 flex flex-col">
                <p className="text-sm font-semibold text-foreground mb-2">Size at other risk levels</p>
                <div className="flex-1 flex flex-col justify-evenly">
                {[0.25, 0.5, 1, 1.5, 2, 3].map(pct => {
                  const balance = num(state.balance)
                  const risk = balance * pct / 100
                  const size = results.kind === 'forex'
                    ? `${fmt(Math.floor((risk / (num(state.stopPips) * results.pipValuePerLot)) * 100) / 100)} lots`
                    : `${Math.floor(risk / results.riskPerContract)} ${Math.floor(risk / results.riskPerContract) === 1 ? 'contract' : 'contracts'}`
                  const isCurrent = results.riskPercent !== null && Math.abs(results.riskPercent - pct) < 0.05
                  return (
                    <div
                      key={pct}
                      className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1"
                      style={isCurrent ? { backgroundColor: alpha(themeColors.primary, '10') } : undefined}
                    >
                      <span className={`text-xs ${isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {pct}% · {ccy}{fmt(risk, 0)}
                      </span>
                      <span className={`text-xs font-mono tabular-nums ${isCurrent ? 'font-semibold' : ''}`} style={isCurrent ? { color: themeColors.primary } : undefined}>
                        {size}
                      </span>
                    </div>
                  )
                })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 pt-2">Same stop, different risk per trade.</p>
              </div>
            )}

            {/* Dollar outcomes at 1R/2R/3R with the current size */}
            <div className="rounded-xl border bg-card/50 p-4 flex flex-col">
              <p className="text-sm font-semibold text-foreground mb-2">Profit targets</p>
              <div className="flex-1 flex flex-col justify-evenly">
              {[1, 2, 3].map(r => {
                const stopDist = results.kind === 'forex' ? num(state.stopPips) : num(state.stopValue)
                const unit = results.kind === 'forex' ? 'pips' : state.stopUnit
                const reward = results.actualRisk * r
                return (
                  <div key={r} className="flex items-baseline justify-between gap-2 px-2 py-1">
                    <span className="text-xs text-muted-foreground">
                      {r}R · {fmt(stopDist * r, stopDist * r % 1 === 0 ? 0 : 1)} {unit} away
                    </span>
                    <span className="text-xs font-mono tabular-nums" style={{ color: themeColors.profit }}>
                      +{ccy}{fmt(reward)}
                    </span>
                  </div>
                )
              })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 pt-2">
                What this position makes if the trade runs 1, 2, or 3 times your risk before stopping out.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI check + contract specs — specs card stretches to the shared bottom edge */}
      <div className="xl:col-span-3 flex flex-col gap-4 sm:gap-6 [&>*:last-child]:flex-1">
        <PositionCheckAi payload={aiPayload} instrument={instrument} />

        <div className="rounded-xl border bg-card/50 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="h-4 w-4" style={{ color: themeColors.primary }} />
            <span className="text-sm font-semibold text-foreground">
              {state.mode === 'forex' ? pairSpec.symbol : contractSpec.symbol} specs
            </span>
          </div>
          <div className="divide-y divide-border/60">
          {state.mode === 'forex' ? (
            <>
              <SpecRow label="Pip size" value={String(pairSpec.pipSize)} />
              <SpecRow label="Units per lot" value={pairSpec.contractSize.toLocaleString()} />
              <SpecRow
                label="Pip value per lot"
                value={Number.isNaN(conversionRate)
                  ? `${pairSpec.quote} ${fmt(pairSpec.pipSize * pairSpec.contractSize)}`
                  : `${ccy}${fmt(pairSpec.pipSize * pairSpec.contractSize * conversionRate)}`}
              />
              {needsConversion && !Number.isNaN(conversionRate) && (
                <SpecRow label={`${pairSpec.quote} to ${state.accountCurrency}`} value={fmt(conversionRate, 4)} />
              )}
            </>
          ) : (
            <>
              <SpecRow label="Tick size" value={String(contractSpec.tickSize)} />
              <SpecRow label="Tick value" value={`$${fmt(contractSpec.tickValue)}`} />
              <SpecRow label="Per point" value={`$${fmt(contractSpec.tickValue / contractSpec.tickSize)}`} />
              <SpecRow label="Ticks per point" value={fmt(1 / contractSpec.tickSize, 0)} />
            </>
          )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-auto pt-4">
            Verify against your broker before trading.
          </p>
        </div>
      </div>
    </div>
  )
}
