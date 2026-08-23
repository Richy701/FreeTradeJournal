import { ListChecks } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useThemePresets } from '@/contexts/theme-presets'
import { TRADE_IDEA_RULES, TRADE_IDEA_LIMITS } from '@/constants/trade-idea-rules'

/** The numbered rules and the limits line, used in the aside and the rules dialog. */
export function CommunityRulesList({ columns = false }: { columns?: boolean }) {
  return (
    <>
      <ol className={columns ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4' : 'space-y-3'}>
        {TRADE_IDEA_RULES.map((rule, i) => (
          <li key={rule.title} className="flex gap-3">
            <span className="text-xs font-semibold tabular-nums text-muted-foreground w-4 shrink-0 pt-0.5">{i + 1}.</span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{rule.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{rule.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 pt-4 border-t space-y-1.5">
        {TRADE_IDEA_LIMITS.map(line => (
          <p key={line} className="text-xs text-muted-foreground leading-relaxed">{line}</p>
        ))}
      </div>
    </>
  )
}

export function CommunityRulesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { themeColors, alpha } = useThemePresets()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl p-0 overflow-hidden gap-0">
        <div className="px-6 pt-5 pb-4 border-b flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
            <ListChecks className="h-5 w-5" style={{ color: themeColors.primary }} aria-hidden="true" />
          </div>
          <DialogHeader className="p-0 space-y-0.5 text-left">
            <DialogTitle className="text-base">Community rules</DialogTitle>
            <DialogDescription className="text-xs">What keeps the feed worth reading.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          <CommunityRulesList columns />
        </div>
      </DialogContent>
    </Dialog>
  )
}
