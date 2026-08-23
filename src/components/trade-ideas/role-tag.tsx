import { useThemePresets } from '@/contexts/theme-presets'
import type { IdeaRole } from '@/types/trade-ideas'

/** Small "Dev" tag after a handle for FreeTradeJournal team accounts. */
export function RoleTag({ role }: { role: IdeaRole }) {
  const { themeColors, alpha } = useThemePresets()
  if (role !== 'dev') return null
  return (
    <span
      className="rounded-full px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide shrink-0"
      style={{ backgroundColor: alpha(themeColors.primary, '15'), color: themeColors.primary }}
      title="FreeTradeJournal team"
    >
      Dev
    </span>
  )
}
