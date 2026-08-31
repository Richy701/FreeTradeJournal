import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { trackActivity, trackGateHit } from '@/lib/track-activity';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NoticeBanner } from '@/components/notice-banner';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { trackEvent } from '@/lib/analytics';
import { Badge } from '@/components/ui/badge';
import { 
  TrendUp, 
  TrendDown, 
  Minus, 
  Clock, 
  ChartBar, 
  SpinnerGap, 
  WarningCircle, 
  ArrowRight,
  Heart, 
  UploadSimple, 
  X, 
  PencilSimple,
  Trash,
  Funnel,
  Sliders,
  Calendar,
  CurrencyDollar,
  ArrowsDownUp,
  CaretDown,
  BookOpen,
  Plus,
  MagnifyingGlass,
  Tag,
  LinkSimple,
  PenNib,
  Brain
} from '@phosphor-icons/react';
import { AIJournalReview } from '@/components/ai-journal-review';
import { AIJournalOnSave, type OnSaveCoachData } from '@/components/ai-journal-onsave';
import { format } from 'date-fns';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useAccounts } from '@/contexts/account-context';
import { FREE_JOURNAL_ENTRY_LIMIT } from '@/constants/pricing';
import { useUserStorage } from '@/utils/user-storage';
import {
  compressImage,
  putImage,
  getImage,
  deleteImage,
  newImageId,
  isImageRef,
  isCloudRef,
  uploadCloudImage,
  deleteCloudImage,
  resolveImageRef,
} from '@/utils/image-store';
import { StoredImage } from '@/components/stored-image';
import { useDemoData } from '@/hooks/use-demo-data';
import { buildSessionReview, buildJournalDraft } from '@/lib/session-review';
import type { RiskRule } from '@/lib/risk-rules';
import { useDemoGuard } from '@/hooks/use-demo-guard';
import { toast } from 'sonner';
import { renderMarkdown } from '@/lib/markdown';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Trade {
  id: string
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  stopLoss?: number
  takeProfit?: number
  lotSize: number
  entryTime: Date
  exitTime: Date
  spread: number
  commission: number
  swap: number
  pnl: number
  pnlPercentage: number
  riskReward?: number
  notes?: string
  strategy?: string
  tags?: string[]
  screenshots?: string[]
  market?: 'forex' | 'futures' | 'indices'
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  tags: string[];
  mood: 'bullish' | 'bearish' | 'neutral';
  emotions?: string[];
  // Legacy single link. Kept in sync with tradeIds[0] on save so older
  // readers (heatmap quick-add, demo data) keep working.
  tradeId?: string;
  // Every trade this entry covers. One pre-trade plan or post-trade review
  // can span a scaled-in position or several fills of the same idea.
  tradeIds?: string[];
  entryType: 'general' | 'pre-trade' | 'post-trade';
  screenshots?: string[];
  accountId?: string;
}

// Linked trade ids for an entry, whichever shape it was saved in.
const linkedTradeIdsOf = (entry: { tradeId?: string; tradeIds?: string[] }): string[] =>
  entry.tradeIds && entry.tradeIds.length > 0
    ? entry.tradeIds
    : entry.tradeId
      ? [entry.tradeId]
      : [];

// Journal entries cover a handful of fills, not a whole month. Keeps the
// deep-link URL and the preview card sane.
const MAX_LINKED_TRADES = 20;

// An image staged in the editor: `dataUrl` drives the preview, `id` is its
// IndexedDB key. `ref` is the already-stored reference (`idb:`/`fb:`) when the
// image was loaded from an existing entry, so re-saving doesn't re-upload it.
type UploadedImage = { id: string; dataUrl: string; ref?: string };

// Render a small, safe subset of markdown for journal entries: `#`/`##`/`###`
// headers, **bold**, `code`, "- " bullet lists, "1." numbered lists, and
// paragraphs (blank lines separate them). Escapes user-typed text first so
// "price < 100" renders literally and can't inject markup. Preserves line
// breaks that the old plain-<p> render collapsed.
function renderJournalMarkdown(content: string): string {
  return renderMarkdown(content, {
    escape: true,
    maxHeadingLevel: 3,
    classes: {
      heading: level =>
        level === 1
          ? 'text-base font-semibold text-foreground mt-3 mb-1'
          : level === 2
          ? 'text-sm font-semibold text-foreground mt-3 mb-1'
          : 'text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-3 mb-1',
      paragraph: 'my-1.5',
      ul: 'list-disc pl-5 space-y-1 my-2',
      ol: 'list-decimal pl-5 space-y-1 my-2',
      code: 'px-1 py-0.5 rounded bg-muted text-xs font-mono',
    },
  });
}

// Renders entry content (as markdown) clamped to ~10 lines with a Read more/Show
// less toggle. The toggle only appears when content actually overflows the
// collapsed height (measured), so entries that already fit don't show a dead
// "Read more". Uses a max-height clamp rather than line-clamp because markdown
// produces multiple block elements that -webkit-line-clamp can't truncate.
function ExpandableContent({ content, color }: { content: string; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const html = useMemo(() => renderJournalMarkdown(content), [content]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (expanded) return;
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [content, expanded, html]);

  return (
    <div>
      <div
        ref={ref}
        className={`text-sm leading-relaxed text-foreground/90 break-words [&>*:first-child]:mt-0 ${!expanded ? 'max-h-[15rem] overflow-hidden' : ''}`}
        style={
          !expanded && overflowing
            ? {
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
              }
            : undefined
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {(overflowing || expanded) && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs font-medium mt-1 hover:underline"
          style={{ color }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

// Shared entry templates, written in markdown so they render as headed sections.
// One source of truth for the editor's quick-insert buttons, the Pre/Post-Trade
// header buttons, and the empty-state starter cards.
const TEMPLATE_TITLES = {
  'pre-trade': 'Pre-Trade Analysis',
  'post-trade': 'Post-Trade Review',
  general: 'Daily Review',
} as const;

// Plain text, no markdown symbols — these are typed over in a bare textarea,
// where raw ### and ** read as clutter. Simple "Label:" lines render cleanly
// as paragraphs too.
const TEMPLATE_BODIES = {
  'pre-trade':
    'Instrument: \nSetup: \nBias: bullish / bearish / neutral\n\nEntry trigger: \nStop loss: \nTake profit: \nRisk (% of account): \n\nWhat proves this idea wrong before the stop does?\n',
  'post-trade':
    'The plan was: \nWhat actually happened: \nRules followed (yes / no — if not, why): \n\nEmotions during the trade: \n\nKey lesson: \nNext time I will: ',
  general:
    'Market conditions: \nKey levels watched: \nHeadspace: focused / distracted / confident / cautious\n\nWhat went well: \nWhat to improve: \n\nTomorrow\'s one focus: ',
} as const;

// Full insert (header + body) for the editor's quick-insert chips, which only
// fill the content field and so need the section title inline.
function templateInsert(type: keyof typeof TEMPLATE_BODIES): string {
  return `${TEMPLATE_TITLES[type]}\n\n${TEMPLATE_BODIES[type]}`;
}

// Common trading emotions
const AVAILABLE_EMOTIONS = [
  'confident', 'anxious', 'excited', 'fearful', 'greedy', 'patient',
  'impulsive', 'frustrated', 'satisfied', 'disappointed', 'hopeful',
  'stressed', 'calm', 'overwhelmed', 'focused', 'doubtful', 'optimistic',
  'regretful', 'disciplined', 'revenge-trading'
];

// Local YYYY-MM-DD for <input type="date"> values and same-day checks —
// deliberately local time, matching how the calendar buckets days.
function toLocalDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Parse a date-input value as LOCAL noon (new Date('yyyy-mm-dd') would parse
// UTC midnight and land on the previous day west of UTC).
function parseLocalDateInput(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

export default function Journal() {
  const { themeColors, alpha } = useThemePresets();
  const { formatCurrency, getCurrencySymbol } = useSettings();
  const { isDemo, user } = useAuth();
  const demoGuard = useDemoGuard();
  const { isPro, hasAIAccess, hasAutoAIAccess, updateFreeAiQuota } = useProStatus();
  const { accounts, activeAccount, loading: accountsLoading, isAllAccounts, scopeAccounts, isInScope } = useAccounts();
  const userStorage = useUserStorage();
  const { getTrades: getDemoTrades, getJournalEntries: getDemoEntries } = useDemoData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [totalEntryCount, setTotalEntryCount] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [onSaveCoachData, setOnSaveCoachData] = useState<OnSaveCoachData | null>(null);
  // In-editor writing coach: 2-3 AI follow-up questions on the current draft
  const [coachQuestions, setCoachQuestions] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  // Entry id awaiting delete confirmation (in-app dialog, not window.confirm)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  // Screenshot refs on the entry being edited that couldn't be resolved on this
  // device (evicted IndexedDB, other-device idb: refs). Kept verbatim on save so
  // an unrelated edit can never silently destroy them.
  const [unresolvedRefs, setUnresolvedRefs] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  // Closing the editor with unsaved typing asks first. The baseline is what
  // the editor opened with (blank, a template, or the entry being edited), so
  // a prefilled-but-untouched form closes without a prompt.
  const [pendingDiscard, setPendingDiscard] = useState<(() => void) | null>(null);
  const editorBaselineRef = useRef<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Reload entries/trades when they change elsewhere (Trade Log, CSV import,
  // dashboard calendar quick-add, other tabs).
  useEffect(() => {
    const handleDataChange = () => setRefreshKey(prev => prev + 1);
    window.addEventListener('storage', handleDataChange);
    window.addEventListener('tradesUpdated', handleDataChange);
    return () => {
      window.removeEventListener('storage', handleDataChange);
      window.removeEventListener('tradesUpdated', handleDataChange);
    };
  }, []);
  
  // Filter states
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pnlRange, setPnlRange] = useState<{ min: string; max: string }>({
    min: '',
    max: ''
  });
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedEntryType, setSelectedEntryType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    tags: '',
    emotions: [] as string[],
    mood: 'neutral' as 'bullish' | 'bearish' | 'neutral',
    tradeIds: [] as string[],
    entryType: 'general' as 'general' | 'pre-trade' | 'post-trade',
    entryDate: toLocalDateInput(new Date())
  });

  // The trades behind newEntry.tradeIds, in link order. Derived, so the form
  // can never show a trade the entry doesn't actually reference.
  const selectedTrades = useMemo(
    () => newEntry.tradeIds.map(id => trades.find(t => t.id === id)).filter((t): t is Trade => !!t),
    [newEntry.tradeIds, trades]
  );

  // Fingerprint of everything the editor can change, for the unsaved-changes check.
  const editorSnapshot = useCallback(
    () => JSON.stringify({ ...newEntry, images: uploadedImages.map(i => i.ref || i.id) }),
    [newEntry, uploadedImages]
  );

  // Bring the editor into view when it opens. The FAB and the edit pencils on
  // deep entries otherwise open it far above the viewport with nothing moving.
  // Runs after the session prefill below so the scroll lands on the final layout.
  useEffect(() => {
    if (!showNewEntry) { editorBaselineRef.current = null; return; }
    const frame = requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [showNewEntry, editingEntry]);

  // Open a brand new entry on a day you traded and the day's numbers are
  // already written down. The blank box is where journalling dies. Guarded on
  // an empty title AND body, and skipped entirely when editing, so it can
  // never overwrite something the trader typed. Plain arithmetic, no AI.
  // Today's numbers as journal-ready text, or null on a day with no trades.
  // Shared by the auto-fill below and the Pre/Post-Trade quick starts.
  const todayDraft = useCallback((): { title: string; content: string } | null => {
    let rules: RiskRule[] = [];
    try {
      const raw = userStorage.getItem('riskRules');
      rules = raw ? JSON.parse(raw) : [];
    } catch { /* corrupt rule state, treat as none set */ }

    const review = buildSessionReview(rules, trades);
    if (!review) return null;
    return buildJournalDraft(review, (v) => formatCurrency(v, false));
  }, [trades, userStorage, formatCurrency]);

  // One fill per opening of the form. Once it has filled (or found the form
  // already holds text), it stays quiet until the form is closed and reopened,
  // so a trades reload or an account switch can never put the numbers back
  // after the trader deleted them.
  const prefilledThisOpenRef = useRef(false);
  useEffect(() => {
    if (!showNewEntry) { prefilledThisOpenRef.current = false; return; }
    if (editingEntry || prefilledThisOpenRef.current) return;
    if (newEntry.title.trim() || newEntry.content.trim()) { prefilledThisOpenRef.current = true; return; }

    // Trades may still be loading on first open; try again when they land.
    const draft = todayDraft();
    if (!draft) return;

    prefilledThisOpenRef.current = true;
    setNewEntry(prev => (
      prev.title.trim() || prev.content.trim()
        ? prev
        : { ...prev, title: draft.title, content: draft.content }
    ));
    trackEvent('journal_prefilled_from_session', { source: 'new_entry' });
    // newEntry is deliberately absent from the deps so typing never re-triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewEntry, editingEntry, todayDraft]);

  // First settled state after opening becomes the dirty-check baseline: after
  // the session prefill (one render later) and, when editing, after the
  // entry's screenshots have resolved.
  useEffect(() => {
    if (!showNewEntry || imagesLoading || editorBaselineRef.current !== null) return;
    const frame = requestAnimationFrame(() => {
      if (editorBaselineRef.current === null) editorBaselineRef.current = editorSnapshot();
    });
    return () => cancelAnimationFrame(frame);
  }, [showNewEntry, imagesLoading, editorSnapshot]);

  // Ask the writing coach about the current draft (or for starters if empty).
  // Same quota/rate-limit rails as every other AI feature.
  const askCoach = async () => {
    setCoachLoading(true);
    trackEvent('ai_journal_assist_started', { hasDraft: newEntry.content.trim().length > 0 });
    try {
      // Local day, matching the calendar's day bucketing
      const today = toLocalDateInput(new Date());
      let dayPnl = 0;
      let tradeCount = 0;
      for (const t of trades) {
        if (toLocalDateInput(new Date(t.exitTime)) !== today) continue;
        dayPnl += Number(t.pnl) || 0;
        tradeCount++;
      }
      const { requestAIAssist } = await import('@/services/ai-assist');
      const response = await requestAIAssist({
        type: 'journal_assist',
        payload: {
          currency: getCurrencySymbol(),
          draft: newEntry.content.slice(0, 1200),
          mood: newEntry.mood,
          entryType: newEntry.entryType,
          dayStats: { tradeCount, dayPnl },
        },
      });
      if (response.freeUsage) updateFreeAiQuota(response.freeUsage);
      setCoachQuestions(response.result);
      trackEvent('ai_journal_assist_used');
    } catch (err: any) {
      trackEvent('ai_journal_assist_error', { message: err?.message });
      toast.error(err?.message || 'Coach is unavailable right now');
    } finally {
      setCoachLoading(false);
    }
  };

  // Stale coach questions shouldn't greet the next entry
  useEffect(() => {
    if (!showNewEntry) setCoachQuestions(null);
  }, [showNewEntry]);

  // Free tier journal cap. Only NEW entries past the cap are blocked; existing
  // entries are always kept and editable (so users already over the cap keep
  // full access to their own data). Pro and demo are unlimited.
  const atFreeJournalLimit = !isPro && !isDemo && totalEntryCount >= FREE_JOURNAL_ENTRY_LIMIT;
  const nearFreeJournalLimit =
    !isPro && !isDemo && !atFreeJournalLimit && totalEntryCount >= FREE_JOURNAL_ENTRY_LIMIT - 5;

  // Load entries from localStorage or demo data, scoped to the active account.
  // Re-runs when the active account changes so the journal mirrors the trade log.
  useEffect(() => {
    if (isDemo) {
      const demoEntries = getDemoEntries().map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
      }));
      setEntries(demoEntries);
      setTotalEntryCount(demoEntries.length);
      setEntriesLoaded(true);
      return;
    }

    // Wait for accounts to load before scoping/migrating.
    if (accountsLoading) return;

    let cancelled = false;
    const loadEntries = async () => {
      try {
        const raw = userStorage.getItem('journalEntries');
        let all: any[] = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(all)) all = [];

        // One-time, idempotent migration:
        //  - stamp accountId on legacy account-less entries (they were shared
        //    across every account); assign them to the default account.
        //  - externalize inline base64 screenshots into IndexedDB so the stored
        //    blob stays small (under the localStorage and 1MB cloud-sync caps).
        const defaultId =
          accounts.find(a => a.isDefault)?.id || activeAccount?.id || accounts[0]?.id;
        let changed = false;
        for (const e of all) {
          if (!e.accountId && defaultId) {
            e.accountId = defaultId;
            changed = true;
          }
          if (
            Array.isArray(e.screenshots) &&
            e.screenshots.some((s: any) => typeof s === 'string' && s.startsWith('data:'))
          ) {
            const refs: string[] = [];
            for (const s of e.screenshots) {
              if (typeof s === 'string' && s.startsWith('data:')) {
                // Pro: migrate inline images to cloud storage (fb:) so they
                // stay visible on every device — an idb: ref only exists in
                // THIS browser's IndexedDB but syncs to all of them.
                if (isPro && user?.uid) {
                  try {
                    refs.push(await uploadCloudImage(user.uid, s));
                    changed = true;
                    continue;
                  } catch { /* fall through to local IndexedDB */ }
                }
                const id = newImageId();
                try {
                  await putImage(id, s);
                  refs.push(`idb:${id}`);
                  changed = true;
                } catch {
                  refs.push(s); // keep inline if IndexedDB is unavailable
                }
              } else if (typeof s === 'string') {
                refs.push(s);
              }
            }
            e.screenshots = refs;
          }
        }
        if (changed) {
          try {
            await userStorage.setItem('journalEntries', JSON.stringify(all));
          } catch (err) {
            console.error('Journal migration save failed:', err);
          }
        }

        if (cancelled) return;
        setTotalEntryCount(all.length);
        const mine = all
          .filter((e: any) => scopeAccounts.length === 0 || isInScope(e))
          .map((e: any) => ({ ...e, date: new Date(e.date) }));
        setEntries(mine);
      } catch (error) {
        console.error('Error loading journal entries:', error);
      } finally {
        if (!cancelled) setEntriesLoaded(true);
      }
    };

    loadEntries();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, activeAccount, scopeAccounts, accountsLoading, refreshKey]);

  // Load trades scoped to the active account (mirrors the entry scoping above);
  // re-runs on account switch and when trades change elsewhere.
  useEffect(() => {
    const loadTrades = async () => {
      try {
        if (isDemo) {
          const demoTrades = getDemoTrades().map((trade: any) => ({
            ...trade,
            entryTime: new Date(trade.entryTime),
            exitTime: new Date(trade.exitTime),
          }));
          setTrades(demoTrades);
          setIsLoadingTrades(false);
          return;
        }

        if (accountsLoading) return;

        const storedTrades = userStorage.getItem('trades');
        if (storedTrades) {
          const parsedTrades = JSON.parse(storedTrades)
            .filter((trade: any) => scopeAccounts.length === 0 || isInScope(trade))
            .map((trade: any) => ({
              ...trade,
              entryTime: new Date(trade.entryTime),
              exitTime: new Date(trade.exitTime)
            }));
          setTrades(parsedTrades);
        } else {
          setTrades([]);
        }
      } catch (error) {
        console.error('Error loading trades:', error);
      }
      setIsLoadingTrades(false);
    };

    loadTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, activeAccount, scopeAccounts, accountsLoading, refreshKey]);

  // Deep link: /journal?trade=<id> or ?trade=<id>,<id>,<id> (Trade Log
  // "Journal selected"). A single trade that already has an entry opens that
  // entry for editing instead of starting a blank one (which previously created
  // a duplicate / appeared to overwrite). A group opens its existing entry only
  // when one covers exactly those trades. Otherwise open a new pre-linked entry.
  useEffect(() => {
    if (isLoadingTrades || !entriesLoaded) return;
    const param = searchParams.get('trade');
    if (!param) return;
    const ids = Array.from(new Set(param.split(',').map(s => s.trim()).filter(Boolean)))
      .filter(id => trades.some(t => t.id === id))
      .slice(0, MAX_LINKED_TRADES);
    if (ids.length > 0) {
      const existing = entries.find(e => {
        const linked = linkedTradeIdsOf(e);
        if (ids.length === 1) return linked.includes(ids[0]);
        return linked.length === ids.length && ids.every(id => linked.includes(id));
      });
      if (existing) {
        startEdit(existing);
      } else {
        linkTrades(ids);
        setShowNewEntry(true);
      }
    }
    searchParams.delete('trade');
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingTrades, entriesLoaded, trades, entries, searchParams]);

  // Merge the active account's entries back into the full cross-account store,
  // preserving every other account's entries (mirrors how trades are persisted).
  // Awaits the real write so callers can trust success/failure.
  const persistEntries = async (currentAccountEntries: JournalEntry[]) => {
    const currentId = activeAccount?.id;
    let all: any[] = [];
    try {
      const raw = userStorage.getItem('journalEntries');
      all = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(all)) all = [];
    } catch {
      all = [];
    }
    // Exclude by id as well as accountId so an entry can never appear twice
    // (e.g. if the active account is briefly null and currentId is undefined).
    const mineIds = new Set(currentAccountEntries.map(e => e.id));
    const others = all.filter((e: any) => e.accountId !== currentId && !mineIds.has(e.id));
    const mine = currentAccountEntries.map(e => ({ ...e, accountId: e.accountId || currentId }));
    const merged = [...others, ...mine];
    await userStorage.setItem('journalEntries', JSON.stringify(merged));
    setTotalEntryCount(merged.length);
  };

  // Resolve stored screenshot refs into editable previews. Carries `ref` so an
  // unchanged image isn't re-uploaded/re-written on save. Refs that CAN'T be
  // resolved on this device (evicted IndexedDB, refs synced from another
  // device) are returned separately and preserved verbatim on save — treating
  // them as "removed" would permanently delete them on an unrelated edit.
  const resolveScreenshots = async (
    refs: string[]
  ): Promise<{ images: UploadedImage[]; unresolved: string[] }> => {
    const images: UploadedImage[] = [];
    const unresolved: string[] = [];
    for (const refStr of refs) {
      if (isImageRef(refStr)) {
        const id = refStr.slice(4);
        const data = await getImage(id);
        if (data) images.push({ id, dataUrl: data, ref: refStr });
        else unresolved.push(refStr);
      } else if (isCloudRef(refStr)) {
        const url = await resolveImageRef(refStr);
        if (url) images.push({ id: newImageId(), dataUrl: url, ref: refStr });
        else unresolved.push(refStr);
      } else if (refStr && refStr.startsWith('data:')) {
        images.push({ id: newImageId(), dataUrl: refStr });
      }
    }
    return { images, unresolved };
  };

  // The combined "All accounts" view is read-only: persistEntries merges
  // against the single active account, so writes there could misfile or
  // resurrect other accounts' entries.
  const guardAllAccounts = () => {
    if (!isAllAccounts) return false;
    toast.warning('Viewing all accounts. Switch to a single account to add or edit journal entries.');
    return true;
  };

  // Every way into a blank editor. Guarded up front so the All-accounts
  // warning fires before anyone types, not at save.
  const openNewEntry = () => {
    if (guardAllAccounts()) return;
    if (showNewEntry) {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setShowNewEntry(true);
  };

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;
    if (guardAllAccounts()) return;
    if (demoGuard('save journal entries')) return;

    // Block creating NEW entries past the free cap (editing existing is allowed).
    if (!editingEntry && atFreeJournalLimit) {
      trackGateHit('journal_cap', { entries: FREE_JOURNAL_ENTRY_LIMIT });
      toast.error(
        `You've reached the free limit of ${FREE_JOURNAL_ENTRY_LIMIT} journal entries. Your existing entries are safe — upgrade to Pro for unlimited journaling.`
      );
      return;
    }

    setIsSubmitting(true);

    // Track refs stored during THIS save so they can be cleaned up if the
    // entry write itself fails (otherwise they'd be orphaned in storage).
    const newlyStored: string[] = [];
    try {
      // Persist screenshots and keep only lightweight refs in the entry.
      // Pro: upload to Firebase Storage (cross-device) with a local IndexedDB
      // fallback. Free: IndexedDB only. Unchanged images keep their existing ref.
      const screenshots: string[] = [];
      for (const img of uploadedImages) {
        if (img.ref) {
          screenshots.push(img.ref);
          continue;
        }
        let stored: string | null = null;
        if (isPro && user?.uid) {
          try {
            stored = await uploadCloudImage(user.uid, img.dataUrl);
          } catch {
            stored = null; // fall back to local storage below
          }
        }
        if (!stored) {
          await putImage(img.id, img.dataUrl);
          stored = `idb:${img.id}`;
        }
        newlyStored.push(stored);
        screenshots.push(stored);
      }
      // Refs that couldn't be previewed on this device ride along untouched.
      screenshots.push(...unresolvedRefs);

      // Resolve the entry date from the editor's date field: keep the original
      // timestamp when the day is unchanged, otherwise stamp local noon of the
      // picked day so it lands on the right calendar cell in every timezone.
      const pickedDate = parseLocalDateInput(newEntry.entryDate);
      const baseDate = editingEntry ? new Date(editingEntry.date) : new Date();
      const entryDate =
        !pickedDate || toLocalDateInput(baseDate) === newEntry.entryDate
          ? baseDate
          : pickedDate;

      if (editingEntry) {
        const updatedEntry: JournalEntry = {
          ...editingEntry,
          title: newEntry.title,
          content: newEntry.content,
          date: entryDate,
          tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          emotions: newEntry.emotions.length > 0 ? newEntry.emotions : undefined,
          mood: newEntry.mood,
          tradeId: newEntry.tradeIds[0] || undefined,
          tradeIds: newEntry.tradeIds.length > 0 ? newEntry.tradeIds : undefined,
          entryType: newEntry.entryType,
          screenshots: screenshots.length > 0 ? screenshots : undefined,
          accountId: editingEntry.accountId || activeAccount?.id,
        };

        const updatedEntries = entries.map(entry =>
          entry.id === editingEntry.id ? updatedEntry : entry
        );
        // Persist first; only update UI once the write durably lands.
        await persistEntries(updatedEntries);

        // Clean up screenshots removed during this edit. Best-effort: the entry
        // is already saved, so a failed delete must not fall through to the
        // catch (which would toast an error and remove this save's images).
        const removed = (editingEntry.screenshots || []).filter(
          r => !screenshots.includes(r)
        );
        newlyStored.length = 0;
        for (const r of removed) {
          try {
            if (isImageRef(r)) await deleteImage(r.slice(4));
            else if (isCloudRef(r)) await deleteCloudImage(r);
          } catch { /* orphan is better than data loss */ }
        }

        setEntries(updatedEntries);
        setEditingEntry(null);
      } else {
        const entry: JournalEntry = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
          title: newEntry.title,
          content: newEntry.content,
          date: entryDate,
          tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          emotions: newEntry.emotions.length > 0 ? newEntry.emotions : undefined,
          mood: newEntry.mood,
          tradeId: newEntry.tradeIds[0] || undefined,
          tradeIds: newEntry.tradeIds.length > 0 ? newEntry.tradeIds : undefined,
          entryType: newEntry.entryType,
          screenshots: screenshots.length > 0 ? screenshots : undefined,
          accountId: activeAccount?.id,
        };

        const updatedEntries = [entry, ...entries];
        await persistEntries(updatedEntries);
        setEntries(updatedEntries);
      }

      setNewEntry({ title: '', content: '', tags: '', emotions: [], mood: 'neutral' as 'bullish' | 'bearish' | 'neutral', tradeIds: [], entryType: 'general', entryDate: toLocalDateInput(new Date()) });
      setUploadedImages([]);
      setUnresolvedRefs([]);
      setShowNewEntry(false);
      trackEvent('journal_entry_saved', { type: editingEntry ? 'edit' : 'new', linkedTrades: selectedTrades.length });
      trackActivity('journal_entry_saved', { type: editingEntry ? 'edit' : 'new', entryCount: totalEntryCount });
      toast.success(editingEntry ? 'Entry updated!' : 'Journal entry saved!');

      // On-save coach: the entry is durably saved, so let the coach react to
      // substantial NEW entries automatically. Locals (newEntry, selectedTrades)
      // are still the pre-reset values within this call.
      if (
        !editingEntry &&
        hasAutoAIAccess &&
        !isDemo &&
        newEntry.content.trim().length >= 80 &&
        userStorage.getItem('journalOnSaveCoachDisabled') !== '1'
      ) {
        const today = toLocalDateInput(new Date());
        let dayPnl = 0;
        let tradeCount = 0;
        for (const t of trades) {
          if (toLocalDateInput(new Date(t.exitTime)) !== today) continue;
          dayPnl += Number(t.pnl) || 0;
          tradeCount++;
        }
        setOnSaveCoachData({
          content: newEntry.content,
          mood: newEntry.mood,
          emotions: newEntry.emotions,
          entryType: newEntry.entryType,
          currency: getCurrencySymbol(),
          dayStats: { tradeCount, dayPnl },
          // Several linked fills read to the coach as one position: the
          // symbols joined, the first fill's side, the combined result.
          trade: selectedTrades.length > 0
            ? {
                symbol: Array.from(new Set(selectedTrades.map(t => t.symbol))).join('/'),
                side: selectedTrades[0].side,
                pnl: selectedTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0),
              }
            : undefined,
        });
      }
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      // The entry itself didn't land — clean up images stored during this save
      // so they aren't orphaned in IndexedDB / cloud storage.
      for (const r of newlyStored) {
        try {
          if (isImageRef(r)) await deleteImage(r.slice(4));
          else if (isCloudRef(r)) await deleteCloudImage(r);
        } catch { /* best effort */ }
      }
      toast.error('Could not save your entry — your device storage may be full. Try removing a screenshot and saving again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Attach trades to the draft. Suggests title/mood/tags/emotions from the
  // whole linked set, but never overwrites what the user already typed or
  // chose; only blanks and defaults get filled.
  const linkTrades = (ids: string[]) => {
    const incoming = ids.filter(id => id !== 'none' && trades.some(t => t.id === id));
    if (incoming.length === 0) return;
    setNewEntry(prev => {
      const merged = Array.from(new Set([...prev.tradeIds, ...incoming])).slice(0, MAX_LINKED_TRADES);
      const linked = merged.map(id => trades.find(t => t.id === id)).filter((t): t is Trade => !!t);
      if (linked.length === 0) return prev;

      const total = linked.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
      const isWinning = total > 0;
      const symbols = Array.from(new Set(linked.map(t => t.symbol)));
      const sides = Array.from(new Set(linked.map(t => t.side.toUpperCase())));
      const head = symbols.length === 1
        ? `${symbols[0]} ${sides.length === 1 ? sides[0] : 'LONG/SHORT'}`
        : symbols.join('/');
      const suggestedTitle = linked.length > 1
        ? `${head} x${linked.length} - ${isWinning ? 'Win' : 'Loss'}`
        : `${head} - ${isWinning ? 'Win' : 'Loss'}`;
      const strategies = Array.from(new Set(linked.map(t => t.strategy || '').filter(Boolean)));

      return {
        ...prev,
        tradeIds: merged,
        title: prev.title.trim() ? prev.title : suggestedTitle,
        mood: prev.mood === 'neutral' ? (isWinning ? 'bullish' : 'bearish') : prev.mood,
        tags: prev.tags.trim()
          ? prev.tags
          : [...symbols, ...strategies, isWinning ? 'winner' : 'loser'].join(', '),
        emotions: prev.emotions.length > 0
          ? prev.emotions
          : isWinning ? ['confident', 'satisfied'] : ['disappointed', 'frustrated'],
      };
    });
  };

  const unlinkTrade = (id: string) => {
    setNewEntry(prev => ({ ...prev, tradeIds: prev.tradeIds.filter(t => t !== id) }));
  };

  const formatTradeOption = (trade: Trade) =>
    `${trade.symbol} ${trade.side.toUpperCase()} • ${formatCurrency(trade.pnl, true)} • ${format(trade.entryTime, 'MMM dd')}`;

  const quickStartEntry = (type: 'pre-trade' | 'post-trade', tradeIds?: string[]) => {
    if (guardAllAccounts()) return;
    withDirtyCheck(() => startQuickEntry(type, tradeIds));
  };

  const startQuickEntry = (type: 'pre-trade' | 'post-trade', tradeIds?: string[]) => {
    // Facts first, then the blank form. On a pre-trade note this is the most
    // useful it gets: you see you are already down for the day before you
    // plan the next entry. The draft's own title is dropped here so the
    // template keeps naming the entry.
    editorBaselineRef.current = null;
    setEditingEntry(null);
    const draft = todayDraft();
    if (draft) trackEvent('journal_prefilled_from_session', { source: type });
    setNewEntry({
      title: TEMPLATE_TITLES[type],
      content: draft ? `${draft.content}${TEMPLATE_BODIES[type]}` : TEMPLATE_BODIES[type],
      tags: '',
      emotions: [],
      mood: 'neutral' as 'bullish' | 'bearish' | 'neutral',
      tradeIds: (tradeIds || []).filter(id => trades.some(t => t.id === id)).slice(0, MAX_LINKED_TRADES),
      entryType: type,
      entryDate: toLocalDateInput(new Date())
    });
    setUploadedImages([]);
    setUnresolvedRefs([]);
    setShowNewEntry(true);
  };

  const toggleEmotion = (emotion: string) => {
    setNewEntry(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : [...prev.emotions, emotion]
    }));
  };

  // Image upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 15 * 1024 * 1024) { // generous source cap; we compress below
        toast.warning(`${file.name || 'Image'} is too large (max 15MB)`);
        continue;
      }
      try {
        const dataUrl = await compressImage(file);
        setUploadedImages(prev => [...prev, { id: newImageId(), dataUrl }]);
      } catch {
        toast.error('Could not process that image');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Paste screenshots straight from the clipboard (Cmd/Ctrl+V) while the editor is open
  useEffect(() => {
    if (!showNewEntry) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        processFiles(imageFiles);
        toast.success(imageFiles.length === 1 ? 'Screenshot pasted' : `${imageFiles.length} screenshots pasted`);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showNewEntry]);

  // Edit and delete functions
  const startEdit = (entry: JournalEntry) => {
    if (guardAllAccounts()) return;
    if (demoGuard('edit journal entries')) return;
    if (editingEntry?.id === entry.id && showNewEntry) {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    withDirtyCheck(() => beginEdit(entry));
  };

  const beginEdit = (entry: JournalEntry) => {
    editorBaselineRef.current = null;
    setEditingEntry(entry);
    setNewEntry({
      title: entry.title,
      content: entry.content,
      tags: entry.tags.join(', '),
      emotions: entry.emotions || [],
      mood: entry.mood,
      tradeIds: linkedTradeIdsOf(entry),
      entryType: entry.entryType,
      entryDate: toLocalDateInput(new Date(entry.date))
    });
    setUploadedImages([]);
    setShowNewEntry(true);
    // Resolve stored screenshot refs into editable previews. Block saving until
    // they're loaded so a fast save can't drop the entry's existing screenshots.
    setUnresolvedRefs([]);
    if ((entry.screenshots || []).length > 0) {
      setImagesLoading(true);
      resolveScreenshots(entry.screenshots || [])
        .then(({ images, unresolved }) => {
          setUploadedImages(images);
          setUnresolvedRefs(unresolved);
        })
        .finally(() => setImagesLoading(false));
    }
  };

  const deleteEntry = (entryId: string) => {
    if (guardAllAccounts()) return;
    if (demoGuard('delete journal entries')) return;
    setPendingDeleteId(entryId);
  };

  const confirmDeleteEntry = async (entryId: string) => {
    const target = entries.find(entry => entry.id === entryId);
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    try {
      // Persist first — if the write fails, the entry stays visible instead
      // of looking deleted until the next reload.
      await persistEntries(updatedEntries);
      setEntries(updatedEntries);
      for (const r of target?.screenshots || []) {
        try {
          if (isImageRef(r)) await deleteImage(r.slice(4));
          else if (isCloudRef(r)) await deleteCloudImage(r);
        } catch { /* entry is gone; an orphaned image is acceptable */ }
      }
    } catch (err) {
      console.error('Failed to delete journal entry:', err);
      toast.error('Could not delete the entry. Please try again.');
    }
  };

  // Run `action` now, or after the trader confirms throwing away unsaved typing.
  const withDirtyCheck = (action: () => void) => {
    const baseline = editorBaselineRef.current;
    if (showNewEntry && baseline !== null && baseline !== editorSnapshot()) {
      setPendingDiscard(() => action);
      return;
    }
    action();
  };

  const requestCloseEditor = () => withDirtyCheck(cancelEdit);

  const cancelEdit = () => {
    setEditingEntry(null);
    setNewEntry({ title: '', content: '', tags: '', emotions: [], mood: 'neutral' as 'bullish' | 'bearish' | 'neutral', tradeIds: [], entryType: 'general', entryDate: toLocalDateInput(new Date()) });
    setUploadedImages([]);
    setUnresolvedRefs([]);
    setImagesLoading(false);
    setShowNewEntry(false);
  };

  // Trades an entry links to, resolved against the loaded list. Trades from
  // another account (or deleted ones) simply drop out.
  const getLinkedTrades = (entry: { tradeId?: string; tradeIds?: string[] }): Trade[] =>
    linkedTradeIdsOf(entry)
      .map(id => trades.find(t => t.id === id))
      .filter((t): t is Trade => !!t);

  const linkedPnl = (linked: Trade[]) => linked.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);

  // Extract all unique tags from entries
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [entries]);

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    const filtered = entries.filter(entry => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      // Date range filter — either bound works on its own, both parsed as
      // local days so the boundary matches what the date picker shows.
      if (dateRange.start || dateRange.end) {
        const entryDate = new Date(entry.date);
        const startDate = dateRange.start ? parseLocalDateInput(dateRange.start) : null;
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
          if (entryDate < startDate) return false;
        }
        const endDate = dateRange.end ? parseLocalDateInput(dateRange.end) : null;
        if (endDate) {
          endDate.setHours(23, 59, 59, 999); // Include the entire end day
          if (entryDate > endDate) return false;
        }
      }
      
      // Market filter
      if (selectedMarket !== 'all') {
        const linked = getLinkedTrades(entry);
        if (!linked.some(t => t.market === selectedMarket)) {
          return false;
        }
      }
      
      // Tag filter
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag => entry.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      
      // P&L range filter — entries without a linked trade have no P&L, so a
      // P&L filter excludes them (previously they slipped through unfiltered).
      // Several linked trades count as their combined result.
      if (pnlRange.min || pnlRange.max) {
        const linked = getLinkedTrades(entry);
        if (linked.length === 0) return false;
        const pnl = linkedPnl(linked);
        if (pnlRange.min && pnl < parseFloat(pnlRange.min)) return false;
        if (pnlRange.max && pnl > parseFloat(pnlRange.max)) return false;
      }
      
      // Mood filter
      if (selectedMood !== 'all' && entry.mood !== selectedMood) {
        return false;
      }
      
      // Entry type filter
      if (selectedEntryType !== 'all' && entry.entryType !== selectedEntryType) {
        return false;
      }
      
      return true;
    });
    
    // Sort entries
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'pnl':
          comparison = linkedPnl(getLinkedTrades(a)) - linkedPnl(getLinkedTrades(b));
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [entries, searchTerm, dateRange, selectedMarket, selectedTags, pnlRange, selectedMood, selectedEntryType, sortBy, sortOrder, trades]);

  // Mood vs P&L correlation
  const moodPnlStats = useMemo(() => {
    const buckets: Record<'bullish' | 'bearish' | 'neutral', number[]> = { bullish: [], bearish: [], neutral: [] };
    entries.forEach(entry => {
      // One data point per entry: a multi-trade review counts once, at its
      // combined result, so a scaled-in position doesn't triple-weight a mood.
      const linked = getLinkedTrades(entry);
      if (linked.length > 0) buckets[entry.mood].push(linkedPnl(linked));
    });
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    return {
      bullish: { avg: avg(buckets.bullish), count: buckets.bullish.length },
      bearish: { avg: avg(buckets.bearish), count: buckets.bearish.length },
      neutral: { avg: avg(buckets.neutral), count: buckets.neutral.length },
      hasData: buckets.bullish.length + buckets.bearish.length + buckets.neutral.length >= 2,
    };
  }, [entries, trades]);

  // Reset filters
  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedMarket('all');
    setSelectedTags([]);
    setPnlRange({ min: '', max: '' });
    setSelectedMood('all');
    setSelectedEntryType('all');
    setSortBy('date');
    setSortOrder('desc');
    setSearchTerm('');
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateRange.start || dateRange.end) count++;
    if (selectedMarket !== 'all') count++;
    if (selectedTags.length > 0) count++;
    if (pnlRange.min || pnlRange.max) count++;
    if (selectedMood !== 'all') count++;
    if (selectedEntryType !== 'all') count++;
    if (searchTerm) count++;
    return count;
  }, [dateRange, selectedMarket, selectedTags, pnlRange, selectedMood, selectedEntryType, searchTerm]);

  const getMoodStyle = (mood: string) => {
    switch (mood) {
      case 'bullish': 
        return {
          backgroundColor: `${alpha(themeColors.profit, '15')}`,
          color: themeColors.profit,
          borderColor: `${alpha(themeColors.profit, '30')}`
        };
      case 'bearish': 
        return {
          backgroundColor: `${alpha(themeColors.loss, '15')}`,
          color: themeColors.loss,
          borderColor: `${alpha(themeColors.loss, '30')}`
        };
      default: 
        return {
          backgroundColor: 'hsl(var(--muted))',
          color: 'hsl(var(--muted-foreground))',
          borderColor: 'hsl(var(--border))'
        };
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'bullish': return themeColors.profit;
      case 'bearish': return themeColors.loss;
      default: return themeColors.primary;
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <SiteHeader />
      {/* Header Section */}
      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                  <BookOpen className="h-5 w-5" style={{ color: themeColors.primary }} />
                </div>
                <div className="space-y-0.5 min-w-0 text-left">
                  <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>
                    Trading Journal
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {entries.length > 0
                      ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} · ${entries.filter(e => e.mood === 'bullish').length} bullish · ${entries.filter(e => e.mood === 'bearish').length} bearish`
                      : 'Document your trading thoughts and observations'}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex gap-3 shrink-0">
                {entries.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setAiReviewOpen(true)}
                    className="gap-2 border-2"
                  >
                    <Brain className="h-4 w-4" />
                    AI Review
                  </Button>
                )}
                {trades.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => quickStartEntry('pre-trade')}
                      className="gap-2 border-2"
                    >
                      <Clock className="h-4 w-4" />
                      Pre-Trade
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => quickStartEntry('post-trade')}
                      className="gap-2 border-2"
                    >
                      <ChartBar className="h-4 w-4" />
                      Post-Trade
                    </Button>
                  </div>
                )}
                <Button
                  onClick={openNewEntry}
                  className="gap-2 shadow-lg"
                  style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                >
                  <Plus className="h-4 w-4" />
                  New Entry
                </Button>
              </div>
            </div>
            {/* Mobile: the same actions as the desktop button group, one row; New Entry is the floating button */}
            {(entries.length > 0 || trades.length > 0) && (
              <div className="flex gap-2 sm:hidden">
                {entries.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setAiReviewOpen(true)} className="gap-1.5 flex-1">
                    <Brain className="h-4 w-4" />
                    AI Review
                  </Button>
                )}
                {trades.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => quickStartEntry('pre-trade')} className="gap-1.5 flex-1">
                      <Clock className="h-4 w-4" />
                      Pre-Trade
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => quickStartEntry('post-trade')} className="gap-1.5 flex-1">
                      <ChartBar className="h-4 w-4" />
                      Post-Trade
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* pb-24 on mobile keeps the last row clear of the floating add button */}
      <div className="flex-1 w-full px-4 pt-6 pb-24 sm:px-6 sm:pb-6 lg:px-8 space-y-6">

        {(nearFreeJournalLimit || atFreeJournalLimit) && (
          <NoticeBanner
            tone="warning"
            icon={WarningCircle}
            title={atFreeJournalLimit
              ? `You've reached the free limit of ${FREE_JOURNAL_ENTRY_LIMIT} journal entries`
              : `${totalEntryCount} of ${FREE_JOURNAL_ENTRY_LIMIT} free journal entries used across your accounts`}
            description={atFreeJournalLimit
              ? 'Your existing entries are safe and stay editable. Upgrade to Pro to add new entries.'
              : 'Upgrade to Pro for unlimited journal entries before you hit the cap.'}
            actions={
              <Button asChild size="sm" className="shadow-none">
                <Link to="/pricing">Upgrade <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            }
          />
        )}

        {/* Quick Stats */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              {
                Icon: BookOpen,
                value: entries.length,
                label: 'Total Entries',
                color: themeColors.primary,
                subtitle: 'All time'
              },
              {
                Icon: TrendUp,
                value: entries.filter(e => e.mood === 'bullish').length,
                label: 'Bullish',
                color: themeColors.profit,
                subtitle: `${entries.length > 0 ? Math.round((entries.filter(e => e.mood === 'bullish').length / entries.length) * 100) : 0}% of entries`
              },
              {
                Icon: TrendDown,
                value: entries.filter(e => e.mood === 'bearish').length,
                label: 'Bearish',
                color: themeColors.loss,
                subtitle: `${entries.length > 0 ? Math.round((entries.filter(e => e.mood === 'bearish').length / entries.length) * 100) : 0}% of entries`
              },
              {
                Icon: LinkSimple,
                value: entries.filter(e => linkedTradeIdsOf(e).length > 0).length,
                label: 'Linked Entries',
                color: themeColors.primary,
                subtitle: 'With a trade attached'
              }
            ].map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.Icon className="h-3.5 w-3.5 shrink-0" style={{ color: stat.color, opacity: 0.7 }} aria-hidden="true" />
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">{stat.label}</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums leading-none" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{stat.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mood vs P&L correlation */}
        {moodPnlStats.hasData && (
          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-semibold">Sentiment vs. P&L</CardTitle>
              <p className="text-xs text-muted-foreground">Average trade P&L grouped by your market sentiment when you journaled</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-3 divide-x divide-border/60">
                {([
                  { key: 'bullish', label: 'Bullish' },
                  { key: 'neutral', label: 'Neutral' },
                  { key: 'bearish', label: 'Bearish' },
                ] as const).map(({ key, label }) => {
                  const stat = moodPnlStats[key];
                  // The number is a result, so it takes the result's colour, not the mood's
                  const color = stat.avg === null || stat.avg === 0
                    ? 'hsl(var(--foreground))'
                    : stat.avg > 0 ? themeColors.profit : themeColors.loss;
                  return (
                    <div
                      key={key}
                      className="px-4 first:pl-0 last:pr-0 space-y-2"
                    >
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      {stat.avg !== null ? (
                        <>
                          <p
                            className="text-xl font-bold tabular-nums"
                            style={{ color }}
                          >
                            {formatCurrency(stat.avg, true)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{stat.count} linked {stat.count === 1 ? 'trade' : 'trades'}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {showNewEntry && (
          <div
            ref={editorRef}
            className="space-y-4 scroll-mt-4"
            onKeyDown={(e) => {
              // Cmd/Ctrl+Enter saves from anywhere in the editor
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!isSubmitting && !imagesLoading && newEntry.title.trim() && newEntry.content.trim()) handleAddEntry();
              }
            }}
          >
            {/* Form Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-lg shadow-sm"
                  style={{ backgroundColor: `${alpha(themeColors.primary, '20')}` }}
                >
                  {editingEntry ? <BookOpen className="h-4 w-4" style={{ color: themeColors.primary }} /> : <Plus className="h-4 w-4" style={{ color: themeColors.primary }} />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{editingEntry ? 'Edit Entry' : 'New Journal Entry'}</h2>
                  <p className="text-xs text-muted-foreground">Capture your trading insights</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={requestCloseEditor}
                className="h-11 w-11 p-0 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Entry Type Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'general', label: 'General', icon: <Minus className="h-3.5 w-3.5" /> },
                { value: 'pre-trade', label: 'Pre-Trade', icon: <Clock className="h-3.5 w-3.5" /> },
                { value: 'post-trade', label: 'Post-Trade', icon: <ChartBar className="h-3.5 w-3.5" /> }
              ] as const).map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setNewEntry({ ...newEntry, entryType: type.value })}
                  aria-pressed={newEntry.entryType === type.value}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-shadow duration-200"
                  style={newEntry.entryType === type.value
                    ? { backgroundColor: `${alpha(themeColors.primary, '15')}`, color: themeColors.primary, borderColor: `${alpha(themeColors.primary, '30')}` }
                    : {}
                  }
                >
                  {type.icon}
                  {type.label}
                </Button>
              ))}
            </div>

            {/* Writing */}
            <div className="rounded-xl border bg-card/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <PenNib className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Writing</span>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="journal-title" className="text-xs text-muted-foreground">Title</label>
                <Input
                  id="journal-title"
                  placeholder="What's on your mind about the markets?"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="bg-background/60 border-border/50 h-11 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label htmlFor="journal-content" className="text-xs text-muted-foreground">Content</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {([
                      { label: 'Pre-trade', type: 'pre-trade' },
                      { label: 'Post-trade', type: 'post-trade' },
                      { label: 'Daily review', type: 'general' },
                    ] as const).map((tpl) => (
                      <button
                        key={tpl.type}
                        type="button"
                        onClick={() => {
                          const content = newEntry.content.trim();
                          const text = templateInsert(tpl.type);
                          setNewEntry({
                            ...newEntry,
                            content: content ? `${content}\n\n${text}` : text,
                            entryType: tpl.type,
                          });
                        }}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        {tpl.label}
                      </button>
                    ))}
                    {hasAIAccess && (
                      <button
                        type="button"
                        onClick={askCoach}
                        disabled={coachLoading}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors disabled:opacity-60"
                        style={{ borderColor: alpha(themeColors.primary, '40'), color: themeColors.primary, backgroundColor: alpha(themeColors.primary, '08') }}
                      >
                        {coachLoading ? <SpinnerGap className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                        Ask Coach
                      </button>
                    )}
                  </div>
                </div>
                <Textarea
                  id="journal-content"
                  placeholder="Share your thoughts, analysis, market observations, lessons learned..."
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  className="min-h-36 sm:min-h-44 bg-background/60 border-border/50 resize-none text-sm leading-relaxed"
                />
                {coachQuestions && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line flex-1">{coachQuestions}</p>
                      <button
                        type="button"
                        onClick={() => setCoachQuestions(null)}
                        className="text-muted-foreground hover:text-foreground shrink-0 p-1 -m-1"
                        aria-label="Dismiss coach questions"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const content = newEntry.content.trim();
                        setNewEntry({ ...newEntry, content: content ? `${content}\n\n${coachQuestions}` : coachQuestions });
                        setCoachQuestions(null);
                      }}
                      className="text-xs font-medium hover:underline"
                      style={{ color: themeColors.primary }}
                    >
                      Add to entry
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Context */}
            <div className="rounded-xl border bg-card/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <LinkSimple className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Context</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ChartBar className="h-3 w-3" />
                  Link to Trade
                  {isLoadingTrades && <SpinnerGap className="h-3 w-3 animate-spin" />}
                </label>
                  {isLoadingTrades ? (
                    <div className="h-11 px-3 rounded-lg bg-background/60 border border-border/50 flex items-center gap-2">
                      <SpinnerGap className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading trades...</span>
                    </div>
                  ) : trades.length === 0 ? (
                    <div className="h-11 px-3 rounded-lg bg-background/60 border border-border/50 flex items-center gap-2">
                      <WarningCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">No trades found. Upload trades in Trade Log first.</span>
                    </div>
                  ) : (
                    <Select
                      // Always resets to the placeholder: each pick adds a
                      // trade to the linked set below rather than replacing it.
                      value="none"
                      onValueChange={(value) => linkTrades([value])}
                      disabled={newEntry.tradeIds.length >= MAX_LINKED_TRADES}
                    >
                      <SelectTrigger aria-label="Link to trade" className="w-full h-11 bg-background/60 border-border/50 focus:border-primary/50 text-sm">
                        <SelectValue placeholder="Choose a trade to analyze..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          {newEntry.tradeIds.length > 0 ? 'Add another trade...' : 'Choose a trade to analyze...'}
                        </SelectItem>
                        {trades.filter(t => !newEntry.tradeIds.includes(t.id)).map((trade) => {
                          return (
                            <SelectItem key={trade.id} value={trade.id}>
                              {formatTradeOption(trade)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedTrades.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedTrades.map((trade) => (
                        <Badge
                          key={trade.id}
                          variant="outline"
                          className="gap-1 pl-2 pr-1 py-0.5 text-[11px] font-medium border"
                          style={{
                            color: trade.pnl > 0 ? themeColors.profit : themeColors.loss,
                            backgroundColor: alpha(trade.pnl > 0 ? themeColors.profit : themeColors.loss, '10'),
                            borderColor: alpha(trade.pnl > 0 ? themeColors.profit : themeColors.loss, '30'),
                          }}
                        >
                          {trade.symbol} {trade.side.toUpperCase()} {formatCurrency(trade.pnl, true)}
                          <button
                            type="button"
                            onClick={() => unlinkTrade(trade.id)}
                            aria-label={`Unlink ${trade.symbol} trade`}
                            className="ml-0.5 rounded-sm p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trade Preview: one trade shows its prices, a group shows one row per fill and the combined result */}
                {selectedTrades.length === 1 && (() => {
                  const selectedTrade = selectedTrades[0];
                  return (
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: `${alpha(selectedTrade.pnl > 0 ? themeColors.profit : themeColors.loss, '08')}`,
                      border: `1px solid ${alpha(selectedTrade.pnl > 0 ? themeColors.profit : themeColors.loss, '25')}`
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{selectedTrade.symbol} · {selectedTrade.side.toUpperCase()}</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: selectedTrade.pnl > 0 ? themeColors.profit : themeColors.loss }}
                      >
                        {formatCurrency(selectedTrade.pnl, true)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Entry</span>
                        <div className="font-semibold text-foreground mt-0.5">{selectedTrade.entryPrice}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Exit</span>
                        <div className="font-semibold text-foreground mt-0.5">{selectedTrade.exitPrice}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Date</span>
                        <div className="font-semibold text-foreground mt-0.5">{format(selectedTrade.entryTime, 'MMM dd')}</div>
                      </div>
                    </div>
                  </div>
                  );
                })()}
                {selectedTrades.length > 1 && (() => {
                  const total = linkedPnl(selectedTrades);
                  const tone = total > 0 ? themeColors.profit : themeColors.loss;
                  return (
                  <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: alpha(tone, '08'), border: `1px solid ${alpha(tone, '25')}` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {selectedTrades.length} trades · combined
                      </span>
                      <span className="text-sm font-bold" style={{ color: tone }}>
                        {formatCurrency(total, true)}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {selectedTrades.map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground truncate">
                            {format(trade.entryTime, 'MMM dd, HH:mm')} · {trade.symbol} {trade.side.toUpperCase()} · {trade.entryPrice} → {trade.exitPrice}
                          </span>
                          <span className="font-semibold shrink-0" style={{ color: trade.pnl > 0 ? themeColors.profit : themeColors.loss }}>
                            {formatCurrency(trade.pnl, true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Date
                    </span>
                    <DatePicker
                      date={newEntry.entryDate ? parseLocalDateInput(newEntry.entryDate) ?? undefined : undefined}
                      onDateChange={(d) => setNewEntry({ ...newEntry, entryDate: d ? toLocalDateInput(d) : '' })}
                      placeholder="Pick a date"
                      className="w-full bg-background/60 border-border/50 h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="journal-tags-input" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      Tags
                    </label>
                    <Input
                      id="journal-tags-input"
                      placeholder="e.g., EUR/USD, analysis, strategy"
                      value={newEntry.tags}
                      onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                      className="bg-background/60 border-border/50 h-11"
                    />
                  </div>
                </div>
            </div>

            {/* Mindset */}
            <div className="rounded-xl border bg-card/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Mindset</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Market Sentiment</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'bullish', label: 'Bullish', icon: <TrendUp className="h-4 w-4" />, color: themeColors.profit },
                    { value: 'neutral', label: 'Neutral', icon: <Minus className="h-4 w-4" />, color: themeColors.primary },
                    { value: 'bearish', label: 'Bearish', icon: <TrendDown className="h-4 w-4" />, color: themeColors.loss }
                  ] as const).map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => setNewEntry({ ...newEntry, mood: mood.value })}
                      aria-pressed={newEntry.mood === mood.value}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 text-xs font-medium transition-colors duration-150"
                      style={newEntry.mood === mood.value
                        ? { backgroundColor: alpha(mood.color, '15'), borderColor: alpha(mood.color, '40'), color: mood.color }
                        : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
                      }
                    >
                      {mood.icon}
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Emotions</label>
                  {newEntry.emotions.length > 0 && (
                    <span className="text-[10px] font-medium" style={{ color: themeColors.primary }}>
                      {newEntry.emotions.length} selected
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_EMOTIONS.map((emotion) => {
                    const isSelected = newEntry.emotions.includes(emotion);
                    return (
                      <button
                        key={emotion}
                        type="button"
                        onClick={() => toggleEmotion(emotion)}
                        aria-pressed={isSelected}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 ${
                          isSelected
                            ? ''
                            : 'bg-muted/50 border-border/70 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                        style={isSelected ? { backgroundColor: alpha(themeColors.primary, '15'), borderColor: alpha(themeColors.primary, '40'), color: themeColors.primary } : undefined}
                      >
                        {emotion}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Screenshots */}
            <div className="rounded-xl border bg-card/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <UploadSimple className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Screenshots</span>
              </div>

              <div
                className="border-2 border-dashed rounded-xl p-8 text-center transition-shadow duration-200"
                  style={isDragOver
                    ? { borderColor: `${alpha(themeColors.primary, '50')}`, backgroundColor: `${alpha(themeColors.primary, '05')}` }
                    : { borderColor: 'hsl(var(--border))', backgroundColor: 'transparent' }
                  }
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-2">
                    <div
                      className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${alpha(themeColors.primary, '10')}` }}
                    >
                      <UploadSimple className="h-5 w-5" style={{ color: themeColors.primary }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop chart screenshots here</p>
                      <label className="inline-block">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          aria-label="Upload chart screenshots"
                        />
                        <span className="text-sm cursor-pointer hover:underline" style={{ color: themeColors.primary }}>
                          or browse files
                        </span>
                      </label>
                    </div>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG &middot; optimized automatically &middot; or paste with {navigator.platform.toLowerCase().includes('mac') ? '⌘V' : 'Ctrl+V'}</p>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {uploadedImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.dataUrl}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 sm:h-28 object-cover rounded-lg border border-border/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1.5 right-1.5 rounded-full w-6 h-6 flex items-center justify-center text-white bg-black/50 hover:bg-black/70 opacity-70 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                          aria-label="Remove image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {unresolvedRefs.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {unresolvedRefs.length} existing screenshot{unresolvedRefs.length !== 1 ? 's' : ''} can't be previewed on this device — {unresolvedRefs.length === 1 ? 'it stays' : 'they stay'} attached to the entry when you save.
                  </p>
                )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {newEntry.title.trim() && newEntry.content.trim()
                  ? 'Ready to save'
                  : 'Fill in title and content to save'}
              </p>
              <div className="flex gap-3 ml-auto">
                <Button
                  variant="outline"
                  onClick={requestCloseEditor}
                  className="border-border/50"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEntry}
                  className="shadow-lg gap-2 px-6"
                  style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                  disabled={isSubmitting || imagesLoading || !newEntry.title.trim() || !newEntry.content.trim()}
                >
                  {(isSubmitting || imagesLoading) && <SpinnerGap className="h-4 w-4 animate-spin" />}
                  {imagesLoading
                    ? 'Loading images...'
                    : isSubmitting
                    ? (editingEntry ? 'Updating...' : 'Saving...')
                    : (editingEntry ? 'Update Entry' : 'Save Entry')
                  }
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-muted-foreground/20 focus:border-primary/50"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Funnel className="h-4 w-4" />
                <span className="sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1 sm:flex-initial">
                    <ArrowsDownUp className="h-4 w-4" />
                    <span className="sm:inline">Sort</span>
                    <CaretDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end" sideOffset={5}>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sort By</label>
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger aria-label="Sort by" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="pnl">P&L</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Order</label>
                      <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                        <SelectTrigger aria-label="Sort order" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Newest First</SelectItem>
                          <SelectItem value="asc">Oldest First</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <Card className="">
              <CardContent className="pt-6 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date Range Filter */}
                  <div className="space-y-2 col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Date Range
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <DatePicker
                        date={dateRange.start ? parseLocalDateInput(dateRange.start) ?? undefined : undefined}
                        onDateChange={(d) => setDateRange({ ...dateRange, start: d ? toLocalDateInput(d) : '' })}
                        placeholder="Start date"
                        className="bg-background/50 border-muted-foreground/20 w-full"
                      />
                      <DatePicker
                        date={dateRange.end ? parseLocalDateInput(dateRange.end) ?? undefined : undefined}
                        onDateChange={(d) => setDateRange({ ...dateRange, end: d ? toLocalDateInput(d) : '' })}
                        placeholder="End date"
                        className="bg-background/50 border-muted-foreground/20 w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Market Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <ChartBar className="h-3 w-3" />
                      Market
                    </label>
                    <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                      <SelectTrigger aria-label="Filter by market" className="bg-background/50 border-muted-foreground/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Markets</SelectItem>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="futures">Futures</SelectItem>
                        <SelectItem value="indices">Indices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Mood Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Heart className="h-3 w-3" />
                      Mood
                    </label>
                    <Select value={selectedMood} onValueChange={setSelectedMood}>
                      <SelectTrigger aria-label="Filter by mood" className="bg-background/50 border-muted-foreground/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Moods</SelectItem>
                        <SelectItem value="bullish">Bullish</SelectItem>
                        <SelectItem value="bearish">Bearish</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Entry Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <PenNib className="h-3 w-3" />
                      Entry Type
                    </label>
                    <Select value={selectedEntryType} onValueChange={setSelectedEntryType}>
                      <SelectTrigger aria-label="Filter by entry type" className="bg-background/50 border-muted-foreground/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="pre-trade">Pre-Trade</SelectItem>
                        <SelectItem value="post-trade">Post-Trade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* P&L Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <CurrencyDollar className="h-3 w-3" />
                      P&L Range
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={pnlRange.min}
                        onChange={(e) => setPnlRange({ ...pnlRange, min: e.target.value })}
                        className="bg-background/50 border-muted-foreground/20"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={pnlRange.max}
                        onChange={(e) => setPnlRange({ ...pnlRange, max: e.target.value })}
                        className="bg-background/50 border-muted-foreground/20"
                      />
                    </div>
                  </div>
                  
                  {/* Tag Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      Tag
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background/50 border-muted-foreground/20 min-h-[40px] max-h-24 overflow-y-auto">
                      {allTags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No tags available</span>
                      ) : (
                        allTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedTags(
                                selectedTags.includes(tag)
                                  ? selectedTags.filter(t => t !== tag)
                                  : [...selectedTags, tag]
                              );
                            }}
                            aria-pressed={selectedTags.includes(tag)}
                            className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                              selectedTags.includes(tag)
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-muted-foreground/30 hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {tag}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Filter Summary */}
                {activeFilterCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-muted-foreground/10">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredAndSortedEntries.length} of {entries.length} entries
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-4">
          {filteredAndSortedEntries.length === 0 ? (
            searchTerm || activeFilterCount > 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="p-3 rounded-xl mb-4 bg-muted/40">
                  <MagnifyingGlass className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No entries found</h3>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters.</p>
                <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2">
                  <X className="h-3 w-3" />
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 sm:py-16 text-center">
                <div
                  className="p-4 rounded-2xl mb-6"
                  style={{ backgroundColor: alpha(themeColors.primary, '12') }}
                >
                  <BookOpen className="h-8 w-8" style={{ color: themeColors.primary }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Start your trading journal</h3>
                <p className="text-sm text-muted-foreground mb-10 max-w-md leading-relaxed">
                  Document your setups, track your psychology, and review your decisions. Traders who journal consistently improve faster.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mb-8">
                  {([
                    {
                      Icon: PenNib,
                      label: 'Pre-trade plan',
                      desc: 'Document your setup and reasoning before you enter.',
                      color: themeColors.profit,
                      onClick: () => quickStartEntry('pre-trade'),
                    },
                    {
                      Icon: ChartBar,
                      label: 'Post-trade review',
                      desc: 'Analyze your execution and what you learned.',
                      color: themeColors.loss,
                      onClick: () => quickStartEntry('post-trade'),
                    },
                    {
                      Icon: Calendar,
                      label: 'Daily reflection',
                      desc: 'End-of-day review of conditions and emotions.',
                      color: themeColors.primary,
                      onClick: () => {
                        if (guardAllAccounts()) return;
                        setNewEntry({
                          title: TEMPLATE_TITLES.general,
                          content: TEMPLATE_BODIES.general,
                          tags: '',
                          emotions: [],
                          mood: 'neutral' as const,
                          tradeIds: [],
                          entryType: 'general' as const,
                          entryDate: toLocalDateInput(new Date()),
                        });
                        setUploadedImages([]);
                        setUnresolvedRefs([]);
                        setShowNewEntry(true);
                      },
                    },
                  ] as const).map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={t.onClick}
                      className="rounded-xl border border-border/50 bg-card/50 p-4 text-left space-y-3 hover:border-border hover:bg-card transition-colors group"
                    >
                      <div
                        className="p-2 rounded-lg w-fit"
                        style={{ backgroundColor: alpha(t.color, '12') }}
                      >
                        <t.Icon className="h-4 w-4" style={{ color: t.color }} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{t.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mb-3">or start from scratch</p>
                <Button
                  onClick={openNewEntry}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Blank entry
                </Button>
              </div>
            )
          ) : (
            filteredAndSortedEntries.map((entry) => {
              const linkedTrades = getLinkedTrades(entry);
              const linkedTrade = linkedTrades.length === 1 ? linkedTrades[0] : null;
              const groupPnl = linkedPnl(linkedTrades);
              const groupTone = groupPnl > 0 ? themeColors.profit : themeColors.loss;

              return (
                <Card
                  key={entry.id}
                  className="overflow-hidden"
                >
                  <CardHeader className="pb-2 pt-5 px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-muted">
                          <PenNib className="h-4 w-4" style={{ color: getMoodColor(entry.mood) }} />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg font-semibold leading-tight text-foreground break-words">
                            {entry.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-xs text-muted-foreground">
                              {format(entry.date, 'MMM dd, yyyy')}
                            </span>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 font-medium border text-[10px] px-2 py-0 capitalize"
                              style={getMoodStyle(entry.mood)}
                            >
                              {entry.mood}
                            </Badge>
                            {linkedTrade && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold border px-2 py-0"
                                style={{
                                  color: linkedTrade.pnl > 0 ? themeColors.profit : themeColors.loss,
                                  backgroundColor: linkedTrade.pnl > 0 ? `${alpha(themeColors.profit, '12')}` : `${alpha(themeColors.loss, '12')}`,
                                  borderColor: linkedTrade.pnl > 0 ? `${alpha(themeColors.profit, '30')}` : `${alpha(themeColors.loss, '30')}`
                                }}
                              >
                                {linkedTrade.symbol} {formatCurrency(linkedTrade.pnl, true)}
                              </Badge>
                            )}
                            {linkedTrades.length > 1 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold border px-2 py-0"
                                style={{
                                  color: groupTone,
                                  backgroundColor: alpha(groupTone, '12'),
                                  borderColor: alpha(groupTone, '30')
                                }}
                              >
                                {linkedTrades.length} trades {formatCurrency(groupPnl, true)}
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-medium hidden sm:inline-flex px-2 py-0"
                            >
                              {entry.entryType === 'general' ? 'General' :
                               entry.entryType === 'pre-trade' ? 'Pre-Trade' : 'Post-Trade'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(entry)}
                          className="h-9 w-9 p-0 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                          aria-label="Edit entry"
                        >
                          <PencilSimple className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEntry(entry.id)}
                          className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          aria-label="Delete entry"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-2 space-y-3">
                    <ExpandableContent content={entry.content} color={themeColors.primary} />

                    {linkedTrade && (
                      <div className="border-t border-border/60 pt-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                          <LinkSimple className="h-3 w-3" />
                          Linked Trade
                        </div>
                        <div className={`grid grid-cols-2 gap-3 text-xs ${linkedTrade.riskReward ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Side</span>
                            <span className="font-semibold text-foreground">{linkedTrade.side.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Entry</span>
                            <span className="font-semibold text-foreground">{linkedTrade.entryPrice}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Exit</span>
                            <span className="font-semibold text-foreground">{linkedTrade.exitPrice}</span>
                          </div>
                          {/* Only when the trade recorded one; an "N/A" cell is noise */}
                          {linkedTrade.riskReward ? (
                            <div>
                              <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">R:R</span>
                              <span className="font-semibold text-foreground">{linkedTrade.riskReward.toFixed(2)}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {linkedTrades.length > 1 && (
                      <div className="border-t border-border/60 pt-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                            <LinkSimple className="h-3 w-3" />
                            Linked Trades ({linkedTrades.length})
                          </div>
                          <span className="text-xs font-bold" style={{ color: groupTone }}>
                            {formatCurrency(groupPnl, true)}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {linkedTrades.map((t) => (
                            <div key={t.id} className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground truncate">
                                {format(t.entryTime, 'MMM dd, HH:mm')} · {t.symbol} {t.side.toUpperCase()} · {t.entryPrice} → {t.exitPrice}
                                {t.riskReward ? ` · ${t.riskReward.toFixed(2)}R` : ''}
                              </span>
                              <span className="font-semibold shrink-0" style={{ color: t.pnl > 0 ? themeColors.profit : themeColors.loss }}>
                                {formatCurrency(t.pnl, true)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.screenshots && entry.screenshots.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {entry.screenshots.map((screenshot, index) => (
                          <button key={index} type="button" className="group relative cursor-pointer text-left" onClick={() => setEnlargedImage(screenshot)}>
                            <StoredImage
                              src={screenshot}
                              alt={`Chart ${index + 1}`}
                              className="w-full h-40 sm:h-56 object-cover rounded-lg border border-border/20 shadow-sm hover:border-primary/30 hover:scale-[1.01] transition-[transform,border-color] duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center pointer-events-none">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1.5 rounded-md text-xs font-medium">
                                Click to enlarge
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {((entry.emotions && entry.emotions.length > 0) || entry.tags.length > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
                        {/* Emotions are filled chips, tags are outlined, so the two read as different things */}
                        {entry.emotions && entry.emotions.map((emotion) => (
                          <Badge
                            key={emotion}
                            variant="secondary"
                            className="text-[10px] bg-muted/50 hover:bg-muted/70 transition-colors"
                          >
                            {emotion}
                          </Badge>
                        ))}
                        {entry.emotions && entry.emotions.length > 0 && entry.tags.length > 0 && (
                          <span className="h-3.5 w-px bg-border mx-0.5" aria-hidden="true" />
                        )}
                        {entry.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[10px] font-medium text-muted-foreground border-border/70 bg-transparent"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
      
      {/* Mobile Floating Action Button */}
      <Button
        onClick={openNewEntry}
        className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50"
        style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
        aria-label="New entry"
      >
        <Plus className="h-5 w-5" />
      </Button>
      <AppFooter />

      <AIJournalReview
        open={aiReviewOpen}
        onOpenChange={setAiReviewOpen}
        entries={entries}
        trades={trades}
      />

      <AIJournalOnSave
        data={onSaveCoachData}
        onClose={() => setOnSaveCoachData(null)}
        onDisable={() => {
          userStorage.setItem('journalOnSaveCoachDisabled', '1');
          setOnSaveCoachData(null);
        }}
      />

      <ImageLightbox
        open={enlargedImage !== null}
        onOpenChange={(open) => { if (!open) setEnlargedImage(null) }}
        title="Enlarged screenshot"
      >
        {enlargedImage && (
          <StoredImage
            src={enlargedImage}
            alt="Enlarged screenshot"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        )}
      </ImageLightbox>

      <ConfirmDialog
        open={pendingDiscard !== null}
        onOpenChange={(open) => { if (!open) setPendingDiscard(null) }}
        title="Discard unsaved changes?"
        description="What you typed in this entry will be lost."
        confirmLabel="Discard"
        onConfirm={() => { pendingDiscard?.(); }}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null) }}
        title="Delete this journal entry?"
        description="The entry and its screenshots will be removed."
        onConfirm={() => { if (pendingDeleteId) confirmDeleteEntry(pendingDeleteId) }}
      />
    </div>
  );
}