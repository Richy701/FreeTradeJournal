import { Check } from '@phosphor-icons/react'
import { AVATAR_COLORS, AVATAR_EMOJIS } from '@/constants/avatars'
import type { IdeaAvatar } from '@/types/trade-ideas'

/** Emoji grid + colour swatches. Same choices as the Profile page avatar. */
export function AvatarPicker({ value, onChange }: { value: IdeaAvatar; onChange: (next: IdeaAvatar) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground" id="avatar-emoji-label">Avatar</span>
        <div className="grid grid-cols-10 gap-1.5" role="group" aria-labelledby="avatar-emoji-label">
          {AVATAR_EMOJIS.map(emoji => {
            const active = value.avatarEmoji === emoji
            return (
              <button
                key={emoji}
                type="button"
                aria-pressed={active}
                aria-label={`Avatar ${emoji}`}
                onClick={() => onChange({ ...value, avatarEmoji: active ? null : emoji })}
                className="aspect-square rounded-lg border text-lg leading-none flex items-center justify-center transition-colors hover:bg-muted/40"
                style={active ? { borderColor: value.avatarColor, backgroundColor: `${value.avatarColor}22` } : undefined}
              >
                {emoji}
              </button>
            )
          })}
        </div>
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground" id="avatar-color-label">Colour</span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="avatar-color-label">
          {AVATAR_COLORS.map(color => {
            const active = value.avatarColor === color
            return (
              <button
                key={color}
                type="button"
                aria-pressed={active}
                aria-label={`Colour ${color}`}
                onClick={() => onChange({ ...value, avatarColor: color })}
                className="h-7 w-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: color, boxShadow: active ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${color}` : undefined }}
              >
                {active && <Check className="h-3.5 w-3.5 text-white" weight="bold" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
