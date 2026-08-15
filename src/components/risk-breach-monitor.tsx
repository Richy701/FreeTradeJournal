import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useSettings } from '@/contexts/settings-context'
import { useUserStorage } from '@/utils/user-storage'
import { useDemoData } from '@/hooks/use-demo-data'
import { onSyncChange } from '@/contexts/sync-context'
import { evaluateRiskRules, getRuleLabel, type RiskRule } from '@/lib/risk-rules'
import { trackEvent } from '@/lib/analytics'

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Headless, mounted once in the app shell: watches every trade write (Trade
// Log, calendar quick-add, imports, cloud sync) and toasts the moment a risk
// limit is crossed — breaches used to surface only while the Goals page was
// open. Also owns the violation counters the Goals page displays.
export function RiskBreachMonitor() {
  const { isDemo } = useAuth()
  const { getCurrencySymbol } = useSettings()
  const userStorage = useUserStorage()
  const { getTrades } = useDemoData()
  // Breach state per rule id from the previous check, so toasts fire on the
  // TRANSITION into breach — not again on every re-check while the (often
  // lifetime-scoped) condition still holds. A rule id first seen while
  // already breached is baselined silently instead of toasting on app load.
  const breachStateRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    if (isDemo) return

    const check = () => {
      let rules: RiskRule[]
      let trades: any[]
      try {
        const raw = userStorage.getItem('riskRules')
        rules = raw ? JSON.parse(raw) : []
        trades = getTrades()
      } catch {
        return
      }
      if (rules.length === 0) return

      // Reset violation counters on a new day so the badge stays meaningful.
      const today = todayKey()
      let persist = false
      if (userStorage.getItem('riskRulesViolationDate') !== today) {
        if (rules.some(r => (r.violations || 0) > 0)) persist = true
        rules = rules.map(r => ({ ...r, violations: 0 }))
        userStorage.setItem('riskRulesViolationDate', today)
      }

      const sym = getCurrencySymbol()
      const prev = breachStateRef.current
      const next: Record<string, boolean> = {}

      const updated = rules.map(rule => {
        const status = evaluateRiskRules([rule], trades)[0]
        next[rule.id] = status.breached
        if (status.breached && prev[rule.id] === false) {
          persist = true
          trackEvent('risk_limit_breached', { type: rule.type })
          toast.error('Risk Limit Hit', {
            description: `${getRuleLabel(rule.type)}: ${sym}${status.current.toFixed(0)} against your ${sym}${rule.value} limit.`,
            duration: 8000,
          })
          return { ...rule, violations: (rule.violations || 0) + 1 }
        }
        return rule
      })

      breachStateRef.current = next
      if (persist) {
        userStorage.setItem('riskRules', JSON.stringify(updated))
      }
    }

    check()
    const rerun = () => check()
    window.addEventListener('tradesUpdated', rerun)
    window.addEventListener('storage', rerun)
    const offSync = onSyncChange(rerun)
    return () => {
      window.removeEventListener('tradesUpdated', rerun)
      window.removeEventListener('storage', rerun)
      offSync?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, userStorage, getTrades])

  return null
}
