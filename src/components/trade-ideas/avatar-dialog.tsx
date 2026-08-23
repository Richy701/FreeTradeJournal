import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { UserCircle, CircleNotch } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { updateIdeaAvatar, callableMessage } from '@/lib/trade-ideas'
import type { IdeaAvatar, IdeaProfile } from '@/types/trade-ideas'
import { IdeaAvatar as IdeaAvatarBadge } from './idea-avatar'
import { AvatarPicker } from './avatar-picker'

interface AvatarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: IdeaProfile
  onSaved: (avatar: IdeaAvatar) => void
}

export function AvatarDialog({ open, onOpenChange, profile, onSaved }: AvatarDialogProps) {
  const { themeColors, alpha } = useThemePresets()
  const demoGuard = useDemoGuard()
  const [avatar, setAvatar] = useState<IdeaAvatar>({ avatarEmoji: profile.avatarEmoji, avatarColor: profile.avatarColor })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setAvatar({ avatarEmoji: profile.avatarEmoji, avatarColor: profile.avatarColor })
  }, [open, profile.avatarEmoji, profile.avatarColor])

  const changed = avatar.avatarEmoji !== profile.avatarEmoji || avatar.avatarColor !== profile.avatarColor

  const save = async () => {
    if (demoGuard('change your avatar')) return
    setSaving(true)
    try {
      const saved = await updateIdeaAvatar(avatar)
      onSaved(saved)
      toast.success('Avatar updated')
      onOpenChange(false)
    } catch (err) {
      toast.error(callableMessage(err, 'Could not save that avatar.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) onOpenChange(v) }}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <div className="px-6 pt-5 pb-4 border-b flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
            <UserCircle className="h-5 w-5" style={{ color: themeColors.primary }} aria-hidden="true" />
          </div>
          <DialogHeader className="p-0 space-y-0.5 text-left">
            <DialogTitle className="text-base">Change avatar</DialogTitle>
            <DialogDescription className="text-xs">Shows next to @{profile.handle} on every idea you have posted.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 rounded-xl border p-4" style={{ backgroundColor: alpha(themeColors.primary, '06') }}>
            <IdeaAvatarBadge avatar={avatar} handle={profile.handle} size="lg" />
            <div className="leading-tight">
              <p className="text-sm font-semibold">@{profile.handle}</p>
              <p className="text-xs text-muted-foreground">Preview</p>
            </div>
          </div>
          <AvatarPicker value={avatar} onChange={setAvatar} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving || !changed} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
              {saving && <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Save avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
