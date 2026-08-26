import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Flag, CircleNotch } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useThemePresets } from '@/contexts/theme-presets'
import { reportTradeIdea, callableMessage } from '@/lib/trade-ideas'
import { IDEA_REPORT_REASONS, type CommunityIdea, type IdeaReportReason } from '@/types/trade-ideas'
import { IdeaPreviewCard } from './idea-preview-card'

interface ReportIdeaDialogProps {
  idea: CommunityIdea | null
  onOpenChange: (open: boolean) => void
  onReported: (ideaId: string, hidden: boolean) => void
}

export function ReportIdeaDialog({ idea, onOpenChange, onReported }: ReportIdeaDialogProps) {
  const { themeColors, alpha } = useThemePresets()
  const [reason, setReason] = useState<IdeaReportReason | null>(null)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = idea !== null

  useEffect(() => {
    if (idea) {
      setReason(null)
      setNote('')
      setError(null)
    }
  }, [idea])

  const submit = async () => {
    if (!idea || !reason) return
    setSending(true)
    setError(null)
    try {
      const res = await reportTradeIdea(idea.id, reason, note.trim())
      toast.success(res.alreadyReported ? 'You already reported this one.' : 'Thanks, we will take a look.')
      onReported(idea.id, res.hidden)
      onOpenChange(false)
    } catch (err) {
      setError(callableMessage(err, 'Could not send that report.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!sending) onOpenChange(v) }}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <div className="px-6 pt-5 pb-4 border-b flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
            <Flag className="h-5 w-5" style={{ color: themeColors.primary }} aria-hidden="true" />
          </div>
          <DialogHeader className="p-0 space-y-0.5 text-left">
            <DialogTitle className="text-base">Report this idea</DialogTitle>
            <DialogDescription className="text-xs">
              {idea ? `@${idea.handle}'s ${idea.symbol} ${idea.direction}. Reports go to the FreeTradeJournal team.` : ''}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-4 space-y-4">
          {idea && (
            <IdeaPreviewCard
              caption="You are reporting"
              preview={{ avatar: idea, handle: idea.handle, market: idea.market, symbol: idea.symbol, direction: idea.direction, entry: idea.entry, stop: idea.stop, target: idea.target, outcome: idea.outcome, when: 'posted', post: idea.kind === 'post' ? { title: idea.title ?? '' } : undefined }}
            />
          )}
          <RadioGroup value={reason ?? ''} onValueChange={v => setReason(v as IdeaReportReason)} aria-label="Reason" className="gap-1.5">
            {IDEA_REPORT_REASONS.map(r => {
              const active = reason === r.value
              return (
                <label
                  key={r.value}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
                  style={{
                    borderColor: active ? themeColors.primary : 'hsl(var(--border))',
                    backgroundColor: active ? alpha(themeColors.primary, '10') : undefined,
                  }}
                >
                  <RadioGroupItem value={r.value} style={active ? { borderColor: themeColors.primary, color: themeColors.primary } : undefined} />
                  {r.label}
                </label>
              )
            })}
          </RadioGroup>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="idea-report-note">Anything else (optional)</label>
            <Textarea
              id="idea-report-note"
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 300))}
              rows={2}
              className="resize-none"
            />
          </div>
          {error && (
            <p className="text-xs rounded-md border px-3 py-2" role="alert" style={{ color: themeColors.loss, borderColor: alpha(themeColors.loss, '40') }}>
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
            <Button
              onClick={submit}
              disabled={!reason || sending}
              style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
            >
              {sending && <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Send report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
