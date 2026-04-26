import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useThemePresets } from '@/contexts/theme-presets'
import { toast } from 'sonner'

const POLL_ID = 'community-platform-v1'
const OPTIONS = [
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' },
] as const
type PollOption = typeof OPTIONS[number]['value']

function getDismissKey(uid: string) {
  return `poll-${POLL_ID}-${uid}`
}

function getVoteKey(uid: string) {
  return `poll-vote-${POLL_ID}-${uid}`
}

export function CommunityPoll() {
  const { user, isDemo } = useAuth()
  const { themeColors } = useThemePresets()
  const [visible, setVisible] = useState(false)
  const [voted, setVoted] = useState<PollOption | null>(null)
  const [results, setResults] = useState<Record<string, number> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user || isDemo) return
    const dismissed = localStorage.getItem(getDismissKey(user.uid))
    if (dismissed) return
    const existingVote = localStorage.getItem(getVoteKey(user.uid)) as PollOption | null
    if (existingVote) {
      setVoted(existingVote)
      loadResults()
    }
    setVisible(true)
  }, [user, isDemo])

  async function loadResults() {
    try {
      const { getFirebaseFirestore } = await import('@/lib/firebase-lazy')
      const db = await getFirebaseFirestore()
      const { doc, getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, 'polls', POLL_ID))
      if (snap.exists()) {
        setResults(snap.data().votes ?? {})
      }
    } catch {
      // Silently fail — results are optional
    }
  }

  async function handleVote(option: PollOption) {
    if (!user || submitting) return
    setSubmitting(true)
    try {
      const { getFirebaseFirestore } = await import('@/lib/firebase-lazy')
      const db = await getFirebaseFirestore()
      const { doc, setDoc, increment } = await import('firebase/firestore')
      await setDoc(
        doc(db, 'polls', POLL_ID),
        { votes: { [option]: increment(1) } },
        { merge: true }
      )
      localStorage.setItem(getVoteKey(user.uid), option)
      setVoted(option)
      await loadResults()
      toast.success('Thanks for voting!')
    } catch {
      toast.error('Failed to submit vote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function dismiss() {
    setVisible(false)
    if (user) localStorage.setItem(getDismissKey(user.uid), '1')
  }

  if (!visible || !user || isDemo) return null

  const totalVotes = results ? Object.values(results).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="mx-4 mb-4 rounded-xl border border-border/60 bg-card px-4 py-3 relative">
      <button
        onClick={dismiss}
        className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Dismiss poll"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-sm font-semibold mb-1 pr-6">
        We're starting a community!
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        Which platform would you prefer? Your vote helps us decide.
      </p>

      {!voted ? (
        <div className="flex gap-2">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleVote(opt.value)}
              disabled={submitting}
              className="flex-1 text-sm font-medium py-2 px-3 rounded-lg border border-border/60 hover:border-foreground/30 transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--card)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {OPTIONS.map(opt => {
            const count = results?.[opt.value] ?? 0
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const isSelected = voted === opt.value
            return (
              <div key={opt.value}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={isSelected ? 'font-semibold' : 'text-muted-foreground'}>
                    {opt.label} {isSelected && '(your vote)'}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isSelected ? themeColors.primary : 'var(--muted-foreground)',
                      opacity: isSelected ? 1 : 0.4,
                    }}
                  />
                </div>
              </div>
            )
          })}
          <p className="text-[10px] text-muted-foreground text-right">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  )
}
