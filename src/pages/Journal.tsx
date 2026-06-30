import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  PenNib
} from '@phosphor-icons/react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useThemePresets } from '@/contexts/theme-presets';
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
import { useDemoGuard } from '@/hooks/use-demo-guard';
import { toast } from 'sonner';
import { renderMarkdown } from '@/lib/markdown';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
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
  tradeId?: string;
  entryType: 'general' | 'pre-trade' | 'post-trade';
  screenshots?: string[];
  accountId?: string;
}

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

// Renders entry content (as markdown) clamped to ~3 lines with a Read more/Show
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
        className={`text-sm leading-relaxed text-foreground/90 break-words [&>*:first-child]:mt-0 ${!expanded ? 'max-h-[4.5rem] overflow-hidden' : ''}`}
        style={
          !expanded && overflowing
            ? {
                maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
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

const TEMPLATE_BODIES = {
  'pre-trade': '**Setup:** \n\n**Bias:** Bullish / Bearish / Neutral\n\n**Entry trigger:** \n\n**Stop loss:** \n\n**Take profit:** \n\n**Risk (% of account):** \n\n**What could invalidate this trade:** ',
  'post-trade': '**What was the plan:**\n\n**What actually happened:**\n\n**Did I follow my rules?** Yes / No\nIf not, why:\n\n**Emotional state during trade:**\n\n**Key lesson:**\n\n**What I\'d do differently:** ',
  general: '**Market conditions:**\n\n**Key levels watched:**\n\n**How I felt:** Focused / Distracted / Confident / Cautious\n\n**What went well:**\n\n**What to improve:**\n\n**Tomorrow\'s focus:** ',
} as const;

// Full insert (header + body) for the editor's quick-insert chips, which only
// fill the content field and so need the section title inline.
function templateInsert(type: keyof typeof TEMPLATE_BODIES): string {
  return `## ${TEMPLATE_TITLES[type]}\n\n${TEMPLATE_BODIES[type]}`;
}

const mockEntries: JournalEntry[] = [];

// Mirrors the trade-log account filter: an entry belongs to the active account,
// and legacy account-less entries fall back to a "default" account.
function matchesActiveAccount(
  entry: { accountId?: string },
  account: { id: string } | null
): boolean {
  if (!account) return true;
  if (entry.accountId === account.id) return true;
  if (!entry.accountId && account.id.includes('default')) return true;
  return false;
}

export default function Journal() {
  const { themeColors, alpha } = useThemePresets();
  const { isDemo, user } = useAuth();
  const demoGuard = useDemoGuard();
  const { isPro } = useProStatus();
  const { accounts, activeAccount, loading: accountsLoading } = useAccounts();
  const userStorage = useUserStorage();
  const { getTrades: getDemoTrades, getJournalEntries: getDemoEntries } = useDemoData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState<JournalEntry[]>(mockEntries);
  const [totalEntryCount, setTotalEntryCount] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
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
    tradeId: '',
    entryType: 'general' as 'general' | 'pre-trade' | 'post-trade'
  });

  // Free tier journal cap. Only NEW entries past the cap are blocked; existing
  // entries are always kept and editable (so users already over the cap keep
  // full access to their own data). Pro and demo are unlimited.
  const atFreeJournalLimit = !isPro && !isDemo && totalEntryCount >= FREE_JOURNAL_ENTRY_LIMIT;
  const nearFreeJournalLimit =
    !isPro && !isDemo && !atFreeJournalLimit && totalEntryCount >= FREE_JOURNAL_ENTRY_LIMIT - 10;

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
          .filter((e: any) => matchesActiveAccount(e, activeAccount))
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
  }, [isDemo, activeAccount, accountsLoading]);

  // Load trades from localStorage or demo data with loading state
  useEffect(() => {
    const loadTrades = async () => {
      setIsLoadingTrades(true);
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

        const storedTrades = userStorage.getItem('trades');
        if (storedTrades) {
          const parsedTrades = JSON.parse(storedTrades).map((trade: any) => ({
            ...trade,
            entryTime: new Date(trade.entryTime),
            exitTime: new Date(trade.exitTime)
          }));
          setTrades(parsedTrades);
          
        }
      } catch (error) {
        console.error('Error loading trades:', error);
      }
      setIsLoadingTrades(false);
    };

    loadTrades();
  }, []);

  // Deep link: /journal?trade=<id>. If this trade already has a journal entry,
  // open it for editing instead of starting a blank one (which previously created
  // a duplicate / appeared to overwrite). Otherwise open a new pre-linked entry.
  useEffect(() => {
    if (isLoadingTrades || !entriesLoaded) return;
    const tradeId = searchParams.get('trade');
    if (!tradeId) return;
    const trade = trades.find(t => t.id === tradeId);
    if (trade) {
      const existing = entries.find(e => e.tradeId === tradeId);
      if (existing) {
        startEdit(existing);
      } else {
        handleTradeSelection(tradeId);
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
    const others = all.filter((e: any) => e.accountId !== currentId);
    const mine = currentAccountEntries.map(e => ({ ...e, accountId: e.accountId || currentId }));
    const merged = [...others, ...mine];
    await userStorage.setItem('journalEntries', JSON.stringify(merged));
    setTotalEntryCount(merged.length);
  };

  // Resolve stored screenshot refs into editable previews. Carries `ref` so an
  // unchanged image isn't re-uploaded/re-written on save.
  const resolveScreenshots = async (refs: string[]): Promise<UploadedImage[]> => {
    const out: UploadedImage[] = [];
    for (const refStr of refs) {
      if (isImageRef(refStr)) {
        const id = refStr.slice(4);
        const data = await getImage(id);
        if (data) out.push({ id, dataUrl: data, ref: refStr });
      } else if (isCloudRef(refStr)) {
        const url = await resolveImageRef(refStr);
        if (url) out.push({ id: newImageId(), dataUrl: url, ref: refStr });
      } else if (refStr && refStr.startsWith('data:')) {
        out.push({ id: newImageId(), dataUrl: refStr });
      }
    }
    return out;
  };

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;
    if (demoGuard('save journal entries')) return;

    // Block creating NEW entries past the free cap (editing existing is allowed).
    if (!editingEntry && atFreeJournalLimit) {
      toast.error(
        `You've reached the free limit of ${FREE_JOURNAL_ENTRY_LIMIT} journal entries. Your existing entries are safe — upgrade to Pro for unlimited journaling.`
      );
      return;
    }

    setIsSubmitting(true);

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
        screenshots.push(stored);
      }

      if (editingEntry) {
        const updatedEntry: JournalEntry = {
          ...editingEntry,
          title: newEntry.title,
          content: newEntry.content,
          tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          emotions: newEntry.emotions.length > 0 ? newEntry.emotions : undefined,
          mood: newEntry.mood,
          tradeId: newEntry.tradeId || undefined,
          entryType: newEntry.entryType,
          screenshots: screenshots.length > 0 ? screenshots : undefined,
          accountId: editingEntry.accountId || activeAccount?.id,
        };

        const updatedEntries = entries.map(entry =>
          entry.id === editingEntry.id ? updatedEntry : entry
        );
        // Persist first; only update UI once the write durably lands.
        await persistEntries(updatedEntries);

        // Clean up screenshots removed during this edit.
        const removed = (editingEntry.screenshots || []).filter(
          r => !screenshots.includes(r)
        );
        for (const r of removed) {
          if (isImageRef(r)) await deleteImage(r.slice(4));
          else if (isCloudRef(r)) await deleteCloudImage(r);
        }

        setEntries(updatedEntries);
        setEditingEntry(null);
      } else {
        const entry: JournalEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: newEntry.title,
          content: newEntry.content,
          date: new Date(),
          tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          emotions: newEntry.emotions.length > 0 ? newEntry.emotions : undefined,
          mood: newEntry.mood,
          tradeId: newEntry.tradeId || undefined,
          entryType: newEntry.entryType,
          screenshots: screenshots.length > 0 ? screenshots : undefined,
          accountId: activeAccount?.id,
        };

        const updatedEntries = [entry, ...entries];
        await persistEntries(updatedEntries);
        setEntries(updatedEntries);
      }

      setNewEntry({ title: '', content: '', tags: '', emotions: [], mood: 'neutral' as 'bullish' | 'bearish' | 'neutral', tradeId: '', entryType: 'general' });
      setSelectedTrade(null);
      setUploadedImages([]);
      setShowNewEntry(false);
      trackEvent('journal_entry_saved', { type: editingEntry ? 'edit' : 'new' });
      toast.success(editingEntry ? 'Entry updated!' : 'Journal entry saved!');
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      toast.error('Could not save your entry — your device storage may be full. Try removing a screenshot and saving again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTradeSelection = (tradeId: string) => {
    const resolvedId = tradeId === 'none' ? '' : tradeId;
    setNewEntry(prev => ({ ...prev, tradeId: resolvedId }));
    
    if (resolvedId) {
      const selectedTrade = trades.find(t => t.id === tradeId);
      if (selectedTrade) {
        setSelectedTrade(selectedTrade);
        
        // Auto-populate fields based on trade
        const isWinning = selectedTrade.pnl > 0;
        const suggestedMood = isWinning ? 'bullish' : 'bearish';
        const suggestedTitle = `${selectedTrade.symbol} ${selectedTrade.side.toUpperCase()} - ${isWinning ? 'Win' : 'Loss'}`;
        
        setNewEntry(prev => ({
          ...prev,
          title: suggestedTitle,
          mood: suggestedMood,
          tags: [selectedTrade.symbol, selectedTrade.strategy || '', isWinning ? 'winner' : 'loser'].filter(Boolean).join(', '),
          emotions: isWinning ? ['confident', 'satisfied'] : ['disappointed', 'frustrated']
        }));
      }
    } else {
      setSelectedTrade(null);
    }
  };

  const formatTradeOption = (trade: Trade) => {
    const isWin = trade.pnl > 0;
    const pnlColor = isWin ? themeColors.profit : themeColors.loss;
    const pnlPrefix = isWin ? '+' : '';
    return {
      label: `${trade.symbol} ${trade.side.toUpperCase()} • ${pnlPrefix}$${trade.pnl.toFixed(2)} • ${format(trade.entryTime, 'MMM dd')}`,
      value: trade.id,
      trade,
      isWin
    };
  };

  const quickStartEntry = (type: 'pre-trade' | 'post-trade', tradeId?: string) => {
    setNewEntry({
      title: TEMPLATE_TITLES[type],
      content: TEMPLATE_BODIES[type],
      tags: '',
      emotions: [],
      mood: 'neutral' as 'bullish' | 'bearish' | 'neutral',
      tradeId: tradeId || '',
      entryType: type
    });
    setUploadedImages([]);
    setSelectedTrade(null);
    setShowNewEntry(true);
  };

  // Common trading emotions
  const availableEmotions = [
    'confident', 'anxious', 'excited', 'fearful', 'greedy', 'patient',
    'impulsive', 'frustrated', 'satisfied', 'disappointed', 'hopeful',
    'stressed', 'calm', 'overwhelmed', 'focused', 'doubtful', 'optimistic',
    'regretful', 'disciplined', 'revenge-trading'
  ];

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
        toast.error(`${file.name || 'Image'} is too large (max 15MB)`);
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
    if (demoGuard('edit journal entries')) return;
    setEditingEntry(entry);
    setNewEntry({
      title: entry.title,
      content: entry.content,
      tags: entry.tags.join(', '),
      emotions: entry.emotions || [],
      mood: entry.mood,
      tradeId: entry.tradeId || '',
      entryType: entry.entryType
    });
    setUploadedImages([]);
    const linkedTrade = getLinkedTrade(entry.tradeId);
    setSelectedTrade(linkedTrade || null);
    setShowNewEntry(true);
    // Resolve stored screenshot refs into editable previews. Block saving until
    // they're loaded so a fast save can't drop the entry's existing screenshots.
    if ((entry.screenshots || []).length > 0) {
      setImagesLoading(true);
      resolveScreenshots(entry.screenshots || [])
        .then(imgs => setUploadedImages(imgs))
        .finally(() => setImagesLoading(false));
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (demoGuard('delete journal entries')) return;
    if (confirm('Are you sure you want to delete this journal entry?')) {
      const target = entries.find(entry => entry.id === entryId);
      const updatedEntries = entries.filter(entry => entry.id !== entryId);
      setEntries(updatedEntries);
      try {
        await persistEntries(updatedEntries);
        for (const r of target?.screenshots || []) {
          if (isImageRef(r)) await deleteImage(r.slice(4));
          else if (isCloudRef(r)) await deleteCloudImage(r);
        }
      } catch (err) {
        console.error('Failed to delete journal entry:', err);
        toast.error('Could not delete the entry. Please try again.');
      }
    }
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setNewEntry({ title: '', content: '', tags: '', emotions: [], mood: 'neutral' as 'bullish' | 'bearish' | 'neutral', tradeId: '', entryType: 'general' });
    setUploadedImages([]);
    setImagesLoading(false);
    setSelectedTrade(null);
    setShowNewEntry(false);
  };

  const getLinkedTrade = (tradeId?: string) => {
    if (!tradeId) return null;
    return trades.find(t => t.id === tradeId);
  };

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
    let filtered = entries.filter(entry => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      // Date range filter
      if (dateRange.start && dateRange.end) {
        const entryDate = new Date(entry.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include the entire end day
        
        if (!isWithinInterval(entryDate, { start: startDate, end: endDate })) {
          return false;
        }
      }
      
      // Market filter
      if (selectedMarket !== 'all') {
        const linkedTrade = getLinkedTrade(entry.tradeId);
        if (!linkedTrade || linkedTrade.market !== selectedMarket) {
          return false;
        }
      }
      
      // Tag filter
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag => entry.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      
      // P&L range filter
      if ((pnlRange.min || pnlRange.max) && entry.tradeId) {
        const linkedTrade = getLinkedTrade(entry.tradeId);
        if (linkedTrade) {
          const pnl = linkedTrade.pnl;
          if (pnlRange.min && pnl < parseFloat(pnlRange.min)) return false;
          if (pnlRange.max && pnl > parseFloat(pnlRange.max)) return false;
        } else {
          return false; // No linked trade, so can't filter by P&L
        }
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
          const tradeA = getLinkedTrade(a.tradeId);
          const tradeB = getLinkedTrade(b.tradeId);
          const pnlA = tradeA ? tradeA.pnl : 0;
          const pnlB = tradeB ? tradeB.pnl : 0;
          comparison = pnlA - pnlB;
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
      if (!entry.tradeId) return;
      const trade = trades.find(t => t.id === entry.tradeId);
      if (trade) buckets[entry.mood].push(Number(trade.pnl) || 0);
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
    if (dateRange.start && dateRange.end) count++;
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

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'bullish': return <TrendUp className="h-3 w-3" />;
      case 'bearish': return <TrendDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
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
                  onClick={() => setShowNewEntry(true)}
                  className="gap-2 shadow-lg"
                  style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                >
                  <Plus className="h-4 w-4" />
                  New Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {(nearFreeJournalLimit || atFreeJournalLimit) && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
            <WarningCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {atFreeJournalLimit
                  ? `You've reached the free limit of ${FREE_JOURNAL_ENTRY_LIMIT} journal entries`
                  : `You're approaching the free journal limit — ${entries.length} of ${FREE_JOURNAL_ENTRY_LIMIT} entries used`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {atFreeJournalLimit
                  ? 'Your existing entries are safe and stay editable. Upgrade to Pro to add new entries with unlimited journaling.'
                  : 'Upgrade to Pro for unlimited journal entries before you hit the cap.'}
              </p>
            </div>
            <Link to="/pricing" className="shrink-0">
              <Button size="sm" style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                Upgrade
              </Button>
            </Link>
          </div>
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
                value: entries.filter(e => e.tradeId).length,
                label: 'Linked Trades',
                color: themeColors.primary,
                subtitle: 'Trade-connected'
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
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'bullish', label: 'Bullish', color: themeColors.profit },
                  { key: 'neutral', label: 'Neutral', color: themeColors.primary },
                  { key: 'bearish', label: 'Bearish', color: themeColors.loss },
                ] as const).map(({ key, label, color }) => {
                  const stat = moodPnlStats[key];
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2"
                    >
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      {stat.avg !== null ? (
                        <>
                          <p
                            className="text-xl font-bold tabular-nums"
                            style={{ color }}
                          >
                            {stat.avg >= 0 ? '+' : ''}${stat.avg.toFixed(2)}
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
          <div className="space-y-4">
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
                onClick={cancelEdit}
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
                  </div>
                </div>
                <Textarea
                  id="journal-content"
                  placeholder="Share your thoughts, analysis, market observations, lessons learned..."
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  className="min-h-36 sm:min-h-44 bg-background/60 border-border/50 resize-none text-sm leading-relaxed"
                />
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
                      value={newEntry.tradeId || 'none'}
                      onValueChange={(value) => handleTradeSelection(value)}
                    >
                      <SelectTrigger className="w-full h-11 bg-background/60 border-border/50 focus:border-primary/50 text-sm">
                        <SelectValue placeholder="Choose a trade to analyze..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Choose a trade to analyze...</SelectItem>
                        {trades.map((trade) => {
                          const formattedTrade = formatTradeOption(trade);
                          return (
                            <SelectItem key={trade.id} value={trade.id}>
                              {formattedTrade.label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Trade Preview */}
                {selectedTrade && (
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
                        {selectedTrade.pnl > 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground/70 text-[10px] uppercase tracking-wider">Entry</span>
                        <div className="font-semibold text-foreground mt-0.5">{selectedTrade.entryPrice}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground/70 text-[10px] uppercase tracking-wider">Exit</span>
                        <div className="font-semibold text-foreground mt-0.5">{selectedTrade.exitPrice}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground/70 text-[10px] uppercase tracking-wider">Date</span>
                        <div className="font-semibold text-foreground mt-0.5">{format(selectedTrade.entryTime, 'MMM dd')}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    Tags
                  </label>
                  <Input
                    placeholder="e.g., EUR/USD, analysis, strategy"
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                    className="bg-background/60 border-border/50 h-11"
                  />
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
                  {availableEmotions.map((emotion) => {
                    const isSelected = newEntry.emotions.includes(emotion);
                    return (
                      <button
                        key={emotion}
                        type="button"
                        onClick={() => toggleEmotion(emotion)}
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
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground hidden sm:block">
                {newEntry.title.trim() && newEntry.content.trim()
                  ? 'Ready to save'
                  : 'Fill in title and content to save'}
              </p>
              <div className="flex gap-3 ml-auto">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
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
                        <SelectTrigger className="w-full">
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
                        <SelectTrigger className="w-full">
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
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="bg-background/50 border-muted-foreground/20 w-full"
                      />
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
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
                      <SelectTrigger className="bg-background/50 border-muted-foreground/20">
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
                    <label className="text-sm font-medium">Mood</label>
                    <Select value={selectedMood} onValueChange={setSelectedMood}>
                      <SelectTrigger className="bg-background/50 border-muted-foreground/20">
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
                    <label className="text-sm font-medium">Entry Type</label>
                    <Select value={selectedEntryType} onValueChange={setSelectedEntryType}>
                      <SelectTrigger className="bg-background/50 border-muted-foreground/20">
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
                  <MagnifyingGlass className="h-6 w-6 text-muted-foreground/50" />
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
                        setNewEntry({
                          title: TEMPLATE_TITLES.general,
                          content: TEMPLATE_BODIES.general,
                          tags: '',
                          emotions: [],
                          mood: 'neutral' as const,
                          tradeId: '',
                          entryType: 'general' as const,
                        });
                        setUploadedImages([]);
                        setSelectedTrade(null);
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
                  onClick={() => setShowNewEntry(true)}
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
              const linkedTrade = getLinkedTrade(entry.tradeId);
              
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
                              className="flex items-center gap-1 font-medium border text-[10px] px-2 py-0"
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
                                {linkedTrade.symbol} {linkedTrade.pnl > 0 ? '+' : ''}${linkedTrade.pnl.toFixed(2)}
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
                      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                          <LinkSimple className="h-3 w-3" />
                          Linked Trade
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground/60 text-[10px] uppercase tracking-wider block">Side</span>
                            <span className="font-semibold text-foreground">{linkedTrade.side.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground/60 text-[10px] uppercase tracking-wider block">Entry</span>
                            <span className="font-semibold text-foreground">{linkedTrade.entryPrice}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground/60 text-[10px] uppercase tracking-wider block">Exit</span>
                            <span className="font-semibold text-foreground">{linkedTrade.exitPrice}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground/60 text-[10px] uppercase tracking-wider block">R:R</span>
                            <span className="font-semibold text-foreground">{linkedTrade.riskReward ? linkedTrade.riskReward.toFixed(2) : 'N/A'}</span>
                          </div>
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
                      <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 rounded-lg px-3 py-2.5">
                        {entry.emotions && entry.emotions.map((emotion) => (
                          <Badge
                            key={emotion}
                            variant="secondary"
                            className="text-[10px] bg-muted/50 hover:bg-muted/70 transition-colors"
                          >
                            {emotion}
                          </Badge>
                        ))}
                        {entry.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] bg-muted/50 hover:bg-muted/70 transition-colors"
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
        onClick={() => setShowNewEntry(true)}
        className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50"
        style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
        aria-label="New entry"
      >
        <Plus className="h-5 w-5" />
      </Button>
      <AppFooter />

      {/* Image Lightbox */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setEnlargedImage(null)}
        >
          <StoredImage
            src={enlargedImage}
            alt="Enlarged screenshot"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}