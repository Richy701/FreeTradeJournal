import { useState } from 'react'
import { Tag, WarningCircle } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import type { GroupStat, MistakeImpact } from '@/utils/trade-aggregates'

interface TagPerformanceProps {
  perTag: GroupStat[]
  perMistake: GroupStat[]
  mistakeImpact: MistakeImpact | null
  significanceThreshold: number
}

/**
 * Two tables for the Insights page: how each setup tag performs (trades, win
 * rate, average per trade, net) and what each "!" mistake tag has cost. Both
 * come straight from the shared aggregator, ranked by trade count so a
 * two-trade tag never outranks a thirty-trade one. Nothing renders until at
 * least one tag exists, so untagged accounts see no empty box.
 */
// Rows shown before the "Show all" toggle, so a long tag list does not dwarf
// the mistakes card beside it.
const VISIBLE_ROWS = 8

export function TagPerformance({ perTag, perMistake, mistakeImpact, significanceThreshold }: TagPerformanceProps) {
  const { themeColors } = useThemePresets()
  const { formatCurrency } = useSettings()
  const [showAllTags, setShowAllTags] = useState(false)
  const [showAllMistakes, setShowAllMistakes] = useState(false)

  if (perTag.length === 0 && perMistake.length === 0) return null

  const visibleTags = showAllTags ? perTag : perTag.slice(0, VISIBLE_ROWS)
  const visibleMistakes = showAllMistakes ? perMistake : perMistake.slice(0, VISIBLE_ROWS)
  const toggle = (all: boolean, total: number, set: (v: boolean) => void, noun: string) => total > VISIBLE_ROWS && (
    <Button variant="ghost" size="sm" className="self-start px-2 text-xs text-muted-foreground" onClick={() => set(!all)}>
      {all ? 'Show fewer' : `Show all ${total} ${noun}`}
    </Button>
  )

  const money = (v: number) => (
    <span style={{ color: v > 0 ? themeColors.profit : v < 0 ? themeColors.loss : undefined, fontVariantNumeric: 'tabular-nums' }}>
      {formatCurrency(v, true)}
    </span>
  )
  const num = (v: string | number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span>
  const thin = (g: GroupStat) => !g.significant
  const anyThin = [...perTag, ...perMistake].some(thin)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {perTag.length > 0 && (
        <div className="rounded-xl border bg-card/50 p-4 space-y-3 flex flex-col">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" style={{ color: themeColors.primary }} />
            <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Setups by tag</span>
          </div>
          <p className="text-sm text-muted-foreground">What each tagged setup makes per trade, on average</p>
          <div className="overflow-x-auto -mx-1 px-1 flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Win rate</TableHead>
                  <TableHead className="text-right">Avg per trade</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTags.map((g) => (
                  <TableRow key={g.key}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Link to={`/trades?tag=${encodeURIComponent(g.key)}`} className="hover:underline underline-offset-4">#{g.key}</Link>
                        {thin(g) && <span className="text-[10px] uppercase tracking-wide text-muted-foreground" title={`Fewer than ${significanceThreshold} trades`}>few</span>}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{num(g.count)}</TableCell>
                    <TableCell className="text-right">{num(`${Math.round(g.winRate)}%`)}</TableCell>
                    <TableCell className="text-right">{money(g.avgPnl)}</TableCell>
                    <TableCell className="text-right">{money(g.netPnl)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {toggle(showAllTags, perTag.length, setShowAllTags, 'tags')}
          {anyThin && (
            <p className="text-xs text-muted-foreground">
              Tags marked "few" have under {significanceThreshold} trades. Treat their numbers as a hint, not a verdict.
            </p>
          )}
        </div>
      )}

      {perMistake.length > 0 && mistakeImpact && (
        <div className="rounded-xl border bg-card/50 p-4 space-y-3 flex flex-col">
          <div className="flex items-center gap-2">
            <WarningCircle className="h-4 w-4" style={{ color: themeColors.loss }} />
            <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">What mistakes cost</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Trades tagged with a mistake average {formatCurrency(mistakeImpact.taggedAvgPnl, true)} each
            {mistakeImpact.cleanTrades > 0 && (
              <> against {formatCurrency(mistakeImpact.cleanAvgPnl, true)} on the other {mistakeImpact.cleanTrades} trades</>
            )}.
          </p>
          <div className="overflow-x-auto -mx-1 px-1 flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mistake</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Win rate</TableHead>
                  <TableHead className="text-right">Avg per trade</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMistakes.map((g) => (
                  <TableRow key={g.key}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Link to={`/trades?tag=${encodeURIComponent('!' + g.key)}`} className="hover:underline underline-offset-4">!{g.key}</Link>
                        {thin(g) && <span className="text-[10px] uppercase tracking-wide text-muted-foreground" title={`Fewer than ${significanceThreshold} trades`}>few</span>}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{num(g.count)}</TableCell>
                    <TableCell className="text-right">{num(`${Math.round(g.winRate)}%`)}</TableCell>
                    <TableCell className="text-right">{money(g.avgPnl)}</TableCell>
                    <TableCell className="text-right">{money(g.netPnl)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {toggle(showAllMistakes, perMistake.length, setShowAllMistakes, 'mistakes')}
          <p className="text-xs text-muted-foreground">
            Start a tag with ! to mark a mistake, like !chased or !moved-stop.
          </p>
        </div>
      )}
    </div>
  )
}
