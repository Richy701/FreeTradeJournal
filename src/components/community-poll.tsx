import { useState, useEffect } from 'react'
import { X, Users, MessageCircle, Send } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useThemePresets } from '@/contexts/theme-presets'
import { toast } from 'sonner'

const POLL_ID = 'community-platform-v1'
const OPTIONS = [
  { value: 'discord', label: 'Discord', icon: MessageCircle },
  { value: 'telegram', label: 'Telegram', icon: Send },
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

    // Check localStorage first, then fall back to Firestore
    const existingVote = localStorage.getItem(getVoteKey(user.uid)) as PollOption | null
    if (existingVote) {
      setVoted(existingVote)
      loadResults()
      setVisible(true)
      return
    }

    // Check Firestore for prior vote (covers cleared localStorage / new device)
    async function checkServerVote() {
      try {
        const { getFirebaseFirestore } = await import('@/lib/firebase-lazy')
        const db = await getFirebaseFirestore()
        const { doc, getDoc } = await import('firebase/firestore')
        const snap = await getDoc(doc(db, 'polls', POLL_ID, 'userVotes', user!.uid))
        if (snap.exists()) {
          const option = snap.data().option as PollOption
          localStorage.setItem(getVoteKey(user!.uid), option)
          setVoted(option)
          await loadResults()
        }
      } catch {
        // Silently fail — poll will just show voting buttons
      }
      setVisible(true)
    }
    checkServerVote()
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
      const { doc, getDoc, runTransaction, increment } = await import('firebase/firestore')

      // Check if user already voted (server-side dedup)
      const userVoteRef = doc(db, 'polls', POLL_ID, 'userVotes', user.uid)
      const existingVote = await getDoc(userVoteRef)
      if (existingVote.exists()) {
        // Already voted — just sync local state
        const previousOption = existingVote.data().option as PollOption
        localStorage.setItem(getVoteKey(user.uid), previousOption)
        setVoted(previousOption)
        await loadResults()
        toast.info('You have already voted!')
        return
      }

      // Atomic write: record user vote + increment tally
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userVoteRef)
        if (snap.exists()) throw new Error('already-voted')
        tx.set(userVoteRef, { option, votedAt: new Date().toISOString() })
        tx.set(
          doc(db, 'polls', POLL_ID),
          { votes: { [option]: increment(1) } },
          { merge: true }
        )
      })

      localStorage.setItem(getVoteKey(user.uid), option)
      setVoted(option)
      await loadResults()
      toast.success('Thanks for voting!')
    } catch (err) {
      if (err instanceof Error && err.message === 'already-voted') {
        toast.info('You have already voted!')
      } else {
        toast.error('Failed to submit vote. Please try again.')
      }
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
    <div
      className="mx-4 mb-4 rounded-xl border bg-card px-4 py-4 relative overflow-hidden"
      style={{ borderColor: `${themeColors.primary}30` }}
    >
      {/* Accent gradient at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.primary}60)` }}
      />

      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted"
        aria-label="Dismiss poll"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${themeColors.primary}18` }}
        >
          <Users className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
        </div>
        <p className="text-sm font-semibold pr-6">
          We're starting a community!
        </p>
      </div>
      <p className="text-xs text-muted-foreground mb-3 ml-8">
        Which platform would you prefer? Your vote helps us decide.
      </p>

      {!voted ? (
        <div className="flex gap-2 ml-8">
          {OPTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => handleVote(opt.value)}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 px-3 rounded-lg border transition-all duration-150 disabled:opacity-50"
                style={{
                  borderColor: `${themeColors.primary}30`,
                  backgroundColor: 'var(--card)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = themeColors.primary
                  e.currentTarget.style.backgroundColor = `${themeColors.primary}10`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${themeColors.primary}30`
                  e.currentTarget.style.backgroundColor = 'var(--card)'
                }}
              >
                <Icon className="h-4 w-4" style={{ color: themeColors.primary }} />
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2.5 ml-8">
          {OPTIONS.map(opt => {
            const count = results?.[opt.value] ?? 0
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const isSelected = voted === opt.value
            const Icon = opt.icon
            return (
              <div key={opt.value}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: isSelected ? themeColors.primary : 'var(--muted-foreground)' }}
                    />
                    <span className={isSelected ? 'font-semibold' : 'text-muted-foreground'}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${themeColors.primary}18`,
                          color: themeColors.primary,
                        }}
                      >
                        your vote
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground tabular-nums font-medium">{pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      backgroundColor: isSelected ? themeColors.primary : 'var(--muted-foreground)',
                      opacity: isSelected ? 1 : 0.3,
                    }}
                  />
                </div>
              </div>
            )
          })}
          <p className="text-[10px] text-muted-foreground text-right tabular-nums">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
          </p>
        </div>
      )}
    </div>
  )
}
