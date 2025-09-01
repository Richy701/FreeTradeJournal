import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  BarChart3, 
  Loader2, 
  AlertCircle, 
  Heart, 
  Upload, 
  X, 
  Edit3, 
  Trash2,
  Filter,
  SlidersHorizontal,
  Calendar,
  DollarSign,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useThemePresets } from '@/contexts/theme-presets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faPlus, faSearch, faCalendarAlt, faTag } from '@fortawesome/free-solid-svg-icons';
import { SiteHeader } from '@/components/site-header';
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
}

const mockEntries: JournalEntry[] = [];

export default function Journal() {
  const { themeColors } = useThemePresets();
  const [entries, setEntries] = useState<JournalEntry[]>(mockEntries);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
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
  
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    tags: '',
    emotions: [] as string[],
    mood: 'neutral' as 'bullish' | 'bearish' | 'neutral',
    tradeId: '',
    entryType: 'general' as 'general' | 'pre-trade' | 'post-trade'
  });

  // Load entries from localStorage
  useEffect(() => {
    const loadEntries = () => {
      try {
        const savedEntries = localStorage.getItem('journalEntries');
        if (savedEntries) {
          const parsedEntries = JSON.parse(savedEntries).map((entry: any) => ({
            ...entry,
            date: new Date(entry.date)
          }));
          setEntries(parsedEntries);
        }
      } catch (error) {
        console.error('Error loading journal entries:', error);
      }
    };

    loadEntries();
  }, []);

  // Load trades from localStorage with loading state
  useEffect(() => {
    const loadTrades = async () => {
      setIsLoadingTrades(true);
      try {
        const storedTrades = localStorage.getItem('trades');
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

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      if (editingEntry) {
        // Update existing entry
        const updatedEntry: JournalEntry = {
          ...editingEntry,
          title: newEntry.title,
          content: newEntry.content,
          tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          emotions: newEntry.emotions.length > 0 ? newEntry.emotions : undefined,
          mood: newEntry.mood,
          tradeId: newEntry.tradeId || undefined,
          entryType: newEntry.entryType,
          screenshots: uploadedImages.length > 0 ? uploadedImages : undefined
        };

        const updatedEntries = entries.map(entry => 
          entry.id === editingEntry.id ? updatedEntry : entry
        );
        setEntries(updatedEntries);
        
        // Save to localStorage
        localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
        setEditingEntry(null);
      } else {
        // Create new entry with unique ID
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
          screenshots: uploadedImages.length > 0 ? uploadedImages : undefined
        };

        setEntries([entry, ...entries]);
        
        // Save to localStorage
        const updatedEntries = [entry, ...entries];
        localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      }

      setNewEntry({ title: '', content: '', tags: '', emotions: [], mood: 'neutral' as 'bullish' | 'bearish' | 'neutral', tradeId: '', entryType: 'general' });
      setSelectedTrade(null);
      setUploadedImages([]);
      setShowNewEntry(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTradeSelection = (tradeId: string) => {
    setNewEntry(prev => ({ ...prev, tradeId }));
    
    if (tradeId) {
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
    const pnlColor = isWin ? 'text-green-600' : 'text-red-600';
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
      title: type === 'pre-trade' ? 'Pre-Trade Analysis' : 'Post-Trade Review',
      content: type === 'pre-trade' 
        ? 'Market analysis and trade setup reasoning...' 
        : 'Trade outcome analysis and lessons learned...',
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

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) { // 5MB limit
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setUploadedImages(prev => [...prev, dataUrl]);
        };
        reader.readAsDataURL(file);
      }
    });
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

  // Edit and delete functions
  const startEdit = (entry: JournalEntry) => {
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
    setUploadedImages(entry.screenshots || []);
    const linkedTrade = getLinkedTrade(entry.tradeId);
    setSelectedTrade(linkedTrade || null);
    setShowNewEntry(true);
  };

  const deleteEntry = (entryId: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      const updatedEntries = entries.filter(entry => entry.id !== entryId);
      setEntries(updatedEntries);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    }
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setNewEntry({ title: '', content: '', tags: '', emotions: [], mood: 'neutral' as 'bullish' | 'bearish' | 'neutral', tradeId: '', entryType: 'general' });
    setUploadedImages([]);
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
      
      // Tags filter
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

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'bullish': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
      case 'bearish': return 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300 dark:border-red-500/30';
      default: return 'bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-300 dark:border-slate-500/30';
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'bullish': return <TrendingUp className="h-3 w-3" />;
      case 'bearish': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SiteHeader />
      {/* Header Section */}
      <div className="border-b bg-card/80 backdrop-blur-xl md:sticky md:top-0 z-10 shadow-sm">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8 sm:py-6 md:py-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-xl shadow-lg"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    <FontAwesomeIcon icon={faBookOpen} className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Trading Journal</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Document your trading thoughts and observations</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex gap-3">
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
                      <BarChart3 className="h-4 w-4" />
                      Post-Trade
                    </Button>
                  </div>
                )}
                <Button 
                  onClick={() => setShowNewEntry(true)} 
                  className="gap-2 shadow-lg"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                  New Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-4 sm:px-6 lg:px-8 sm:py-6 space-y-4 sm:space-y-6">

        {showNewEntry && (
          <Card className="bg-card/80 backdrop-blur-sm border-2 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${themeColors.primary}20` }}
                >
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4" style={{ color: themeColors.primary }} />
                </div>
                {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Entry Title</label>
                <Input
                  placeholder="What's on your mind about the markets?"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="bg-background/50 border-muted-foreground/20 focus:border-primary/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Content</label>
                <Textarea
                  placeholder="Share your thoughts, analysis, market observations, lessons learned, or trading insights..."
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  className="min-h-40 bg-background/50 border-muted-foreground/20 focus:border-primary/50 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground block pb-1">Entry Type</label>
                  <select
                    value={newEntry.entryType}
                    onChange={(e) => setNewEntry({ ...newEntry, entryType: e.target.value as any })}
                    className="w-full h-10 px-3 py-2 border rounded-md bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="general">General Thoughts</option>
                    <option value="pre-trade">Pre-Trade Analysis</option>
                    <option value="post-trade">Post-Trade Review</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 pb-1">
                    <BarChart3 className="h-3 w-3" />
                    Link to Trade {isLoadingTrades && <Loader2 className="h-3 w-3 animate-spin" />}
                  </label>
                  {isLoadingTrades ? (
                    <div className="w-full h-10 px-3 py-2 border rounded-md bg-background/50 border-muted-foreground/20 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading trades...</span>
                    </div>
                  ) : trades.length === 0 ? (
                    <div className="w-full h-10 px-3 py-2 border rounded-md bg-background/50 border-muted-foreground/20 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-muted-foreground">No trades found. Upload trades in Trade Log first.</span>
                    </div>
                  ) : (
                    <select
                      value={newEntry.tradeId}
                      onChange={(e) => handleTradeSelection(e.target.value)}
                      className="w-full h-10 px-3 py-2 border rounded-md bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Choose a trade to analyze...</option>
                      {trades.map((trade) => {
                        const formattedTrade = formatTradeOption(trade);
                        return (
                          <option key={trade.id} value={trade.id}>
                            {formattedTrade.label}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground block pb-1">Market Sentiment</label>
                  <select
                    value={newEntry.mood}
                    onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value as any })}
                    className="w-full h-10 px-3 py-2 border rounded-md bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="bullish">Bullish</option>
                    <option value="bearish">Bearish</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FontAwesomeIcon icon={faTag} className="h-3 w-3" />
                    Tags
                  </label>
                  <Input
                    placeholder="e.g., EUR/USD, analysis, strategy"
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                    className="bg-background/50 border-muted-foreground/20 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Heart className="h-3 w-3" />
                    Emotions
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background/50 border-muted-foreground/20 min-h-[40px]">
                    {availableEmotions.map((emotion) => (
                      <button
                        key={emotion}
                        type="button"
                        onClick={() => toggleEmotion(emotion)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          newEntry.emotions.includes(emotion)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-muted-foreground/30 hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {emotion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Upload className="h-3 w-3" />
                  Screenshots & Charts
                </label>
                
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-3">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Drop chart screenshots here, or</p>
                      <label className="inline-block">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <span 
                          className="text-sm cursor-pointer hover:underline"
                          style={{ color: themeColors.primary }}
                        >
                          browse files
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB each</p>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedTrade && (
                <div className="p-4 rounded-lg bg-muted/10 border border-muted-foreground/10">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                    Trade Preview: {selectedTrade.symbol}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground/70">Side</span>
                      <div className="font-semibold text-foreground">{selectedTrade.side.toUpperCase()}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground/70">P&L</span>
                      <div className={`font-semibold ${selectedTrade.pnl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {selectedTrade.pnl > 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground/70">Entry</span>
                      <div className="font-semibold text-foreground">{selectedTrade.entryPrice}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground/70">Date</span>
                      <div className="font-semibold text-foreground">{format(selectedTrade.entryTime, 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 justify-end pt-4 border-t border-muted-foreground/10">
                <Button 
                  variant="outline" 
                  onClick={cancelEdit}
                  className="border-muted-foreground/20"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddEntry}
                  className="shadow-md gap-2"
                  style={{ backgroundColor: themeColors.primary }}
                  disabled={isSubmitting || !newEntry.title.trim() || !newEntry.content.trim()}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting 
                    ? (editingEntry ? 'Updating...' : 'Saving...')
                    : (editingEntry ? 'Update Entry' : 'Save Entry')
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4 mb-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-muted-foreground/20 focus:border-primary/50"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
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
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <Card className="bg-card/60 backdrop-blur-sm border-muted-foreground/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Date Range
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="bg-background/50 border-muted-foreground/20"
                      />
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="bg-background/50 border-muted-foreground/20"
                      />
                    </div>
                  </div>
                  
                  {/* Market Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-3 w-3" />
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
                      <DollarSign className="h-3 w-3" />
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
                  
                  {/* Tags Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <FontAwesomeIcon icon={faTag} className="h-3 w-3" />
                      Tags
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

        <div className="grid gap-6">
          {filteredAndSortedEntries.length === 0 ? (
            <Card className="bg-card/60 backdrop-blur-sm border-2 border-dashed border-muted-foreground/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div 
                  className="p-4 rounded-full mb-6"
                  style={{ backgroundColor: `${themeColors.primary}10` }}
                >
                  <FontAwesomeIcon icon={faBookOpen} className="h-8 w-8" style={{ color: themeColors.primary }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No entries found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchTerm ? 'Try adjusting your search terms or create a new entry' : 'Start documenting your trading journey with insights, analysis, and market observations'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowNewEntry(true)} 
                    className="gap-2 shadow-lg"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    Create First Entry
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedEntries.map((entry) => {
              const linkedTrade = getLinkedTrade(entry.tradeId);
              
              return (
                <Card key={entry.id} className="bg-card border-border/50 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold leading-tight text-foreground">
                          {entry.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-medium shrink-0">
                            {entry.entryType === 'general' ? 'General' : 
                             entry.entryType === 'pre-trade' ? 'Pre-Trade' : 'Post-Trade'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(entry)}
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEntry(entry.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <FontAwesomeIcon icon={faCalendarAlt} className="h-3 w-3" />
                          <span>{format(entry.date, 'MMM dd, yyyy')}</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${getMoodColor(entry.mood)} flex items-center gap-1.5 font-medium`}
                        >
                          {getMoodIcon(entry.mood)}
                          {entry.mood}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {linkedTrade && (
                      <div className="p-3 rounded-md bg-muted/20 border border-border/30">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-muted-foreground">
                              Trade Details: {linkedTrade.symbol}
                            </h4>
                            <Badge 
                              variant="outline"
                              className={`text-xs font-medium ${
                                linkedTrade.pnl > 0 
                                  ? 'text-green-700 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950' 
                                  : 'text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950'
                              }`}
                            >
                              {linkedTrade.pnl > 0 ? '+' : ''}${linkedTrade.pnl.toFixed(2)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-muted-foreground/70">Side</span>
                              <div className="font-medium text-foreground">{linkedTrade.side.toUpperCase()}</div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-muted-foreground/70">Entry</span>
                              <div className="font-medium text-foreground">{linkedTrade.entryPrice}</div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-muted-foreground/70">Exit</span>
                              <div className="font-medium text-foreground">{linkedTrade.exitPrice}</div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-muted-foreground/70">R:R</span>
                              <div className="font-medium text-foreground">{linkedTrade.riskReward ? linkedTrade.riskReward.toFixed(2) : 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                    )}
                    
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/20">
                      <p className="text-sm leading-relaxed text-foreground">{entry.content}</p>
                    </div>

                    {entry.screenshots && entry.screenshots.length > 0 && (
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Upload className="h-4 w-4" />
                          Charts & Screenshots
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {entry.screenshots.map((screenshot, index) => (
                            <div key={index} className="group relative">
                              <img 
                                src={screenshot} 
                                alt={`Chart ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => window.open(screenshot, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-2 py-1 rounded text-xs">
                                  Click to enlarge
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {entry.emotions && entry.emotions.length > 0 && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Heart className="h-3 w-3" />
                            <span className="text-xs font-medium">Emotions:</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {entry.emotions.map((emotion) => (
                              <Badge 
                                key={emotion} 
                                variant="outline" 
                                className="text-xs bg-primary/5 border-primary/20 text-primary"
                              >
                                {emotion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {entry.tags.length > 0 && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FontAwesomeIcon icon={faTag} className="h-3 w-3" />
                            <span className="text-xs font-medium">Tags:</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {entry.tags.map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="text-xs bg-muted/50 hover:bg-muted/70 transition-colors"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
        className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        style={{ backgroundColor: themeColors.primary }}
      >
        <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
      </Button>
    </div>
  );
}