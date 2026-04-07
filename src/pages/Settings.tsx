import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts, type TradingAccount } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faDownload,
  faUpload,
  faSun,
  faMoon,
  faDesktop,
  faCrown,
  faArrowTrendUp,
  faArrowTrendDown,
} from '@fortawesome/free-solid-svg-icons';
import { SlidersHorizontal, Wallet, BarChart2, Shield, Database, CreditCard } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { useProStatus } from '@/contexts/pro-context';
import { useSync } from '@/contexts/sync-context';
import { ProBadge } from '@/components/pro-badge';
import { PRO_FEATURES } from '@/constants/pricing';

const BROKERS = [
  'OANDA','IC Markets','MetaTrader 4','MetaTrader 5','Pepperstone','IG',
  'Interactive Brokers','FTMO','The5ers','Apex Trader Funding','E8 Markets',
  'Topfutures Funded','FundedNext','Lux Trading Firm','NinjaTrader',
  'TradingView','Tradovate','AMP Futures','Discount Trading',
  'Schwab','E*TRADE','TopstepTrader','Other',
];

const CURRENCIES = [
  { value: 'USD', symbol: '$', label: 'USD' },
  { value: 'EUR', symbol: '€', label: 'EUR' },
  { value: 'GBP', symbol: '£', label: 'GBP' },
  { value: 'JPY', symbol: '¥', label: 'JPY' },
  { value: 'CAD', symbol: 'C$', label: 'CAD' },
  { value: 'AUD', symbol: 'A$', label: 'AUD' },
] as const;

const NAV = [
  { id: 'general',      label: 'General',      Icon: SlidersHorizontal },
  { id: 'accounts',     label: 'Accounts',     Icon: Wallet },
  { id: 'performance',  label: 'Performance',  Icon: BarChart2 },
  { id: 'risk',         label: 'Risk',         Icon: Shield },
  { id: 'data',         label: 'Data',         Icon: Database },
  { id: 'subscription', label: 'Subscription', Icon: CreditCard },
] as const;

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { currentTheme, setTheme: setColorTheme, availableThemes, themeColors, alpha, setCustomColors, customColors } = useThemePresets();
  const { user } = useAuth();
  const { accounts, activeAccount, addAccount, updateAccount, deleteAccount } = useAccounts();
  const { settings, updateSettings, formatCurrency, getCurrencySymbol } = useSettings();
  const userStorage = useUserStorage();
  const { isPro, subscription } = useProStatus();
  const { syncStatus, lastSyncTime } = useSync();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showProWelcome, setShowProWelcome] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<string>('general');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setActiveSection(id);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { threshold: 0.15, rootMargin: '-80px 0px -55% 0px' }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setShowProWelcome(true);
      toast.success('Welcome to Pro! Your upgrade is complete.');
      setSearchParams({}, { replace: true });
      setTimeout(() => scrollTo('subscription'), 600);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'demo' as TradingAccount['type'],
    broker: '',
    currency: 'USD',
    balance: '',
    isDefault: false,
  });
  const [editForm, setEditForm] = useState<TradingAccount | null>(null);

  const getTradeStats = () => {
    const trades = JSON.parse(userStorage.getItem('trades') || '[]')
      .filter((t: any) => !activeAccount || t.accountId === activeAccount.id || (!t.accountId && activeAccount.id.includes('default')));
    const now = new Date();
    const thisMonth = trades.filter((t: any) => {
      const d = new Date(t.exitTime);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const wins = trades.filter((t: any) => t.pnl > 0);
    const losses = trades.filter((t: any) => t.pnl < 0);
    const totalPnL = trades.reduce((s: number, t: any) => s + (t.pnl || 0), 0);
    const monthlyPnL = thisMonth.reduce((s: number, t: any) => s + (t.pnl || 0), 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s: number, t: any) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s: number, t: any) => s + t.pnl, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
    const bestTrade = trades.length > 0 ? Math.max(...trades.map((t: any) => t.pnl || 0)) : 0;
    const worstTrade = trades.length > 0 ? Math.min(...trades.map((t: any) => t.pnl || 0)) : 0;
    let currentStreak = 0, maxWinStreak = 0, maxLossStreak = 0, tw = 0, tl = 0;
    for (const t of [...trades].sort((a: any, b: any) => new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime())) {
      if (t.pnl > 0) { tw++; tl = 0; currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1; maxWinStreak = Math.max(maxWinStreak, tw); }
      else if (t.pnl < 0) { tl++; tw = 0; currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1; maxLossStreak = Math.max(maxLossStreak, tl); }
    }
    return { total: trades.length, thisMonth: thisMonth.length, totalPnL, monthlyPnL, winRate, wins: wins.length, losses: losses.length, avgWin, avgLoss, profitFactor, bestTrade, worstTrade, currentStreak, maxWinStreak, maxLossStreak, accountName: activeAccount?.name || 'All Accounts' };
  };

  const stats = getTradeStats();

  const exportData = () => {
    const keys = ['trades','accounts','journalEntries','goals','riskRules','settings','onboarding','onboardingCompleted'];
    const raw: Record<string, any> = {};
    keys.forEach(k => { const v = userStorage.getItem(k); if (v) try { raw[k] = JSON.parse(v); } catch { raw[k] = v; } });
    const blob = new Blob([JSON.stringify({ ...raw, exportDate: new Date().toISOString(), version: '2.0' }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ftj_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    userStorage.setItem('lastBackupDate', new Date().toISOString());
    toast.success('Backup exported!');
  };


  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.trades) userStorage.setItem('trades', JSON.stringify(data.trades));
        if (data.accounts) userStorage.setItem('accounts', JSON.stringify(data.accounts));
        if (data.journalEntries) userStorage.setItem('journalEntries', JSON.stringify(data.journalEntries));
        if (data.goals) userStorage.setItem('goals', JSON.stringify(data.goals));
        if (data.riskRules) userStorage.setItem('riskRules', JSON.stringify(data.riskRules));
        if (data.settings) userStorage.setItem('settings', JSON.stringify(data.settings));
        if (data.onboarding) userStorage.setItem('onboarding', JSON.stringify(data.onboarding));
        if (data.onboardingCompleted !== undefined) userStorage.setItem('onboardingCompleted', String(data.onboardingCompleted));
        const count = [data.trades?.length||0, data.accounts?.length||0, data.journalEntries?.length||0, data.goals?.length||0].reduce((a,b)=>a+b,0);
        toast.success(`Imported ${count} items!`);
        setTimeout(() => window.location.reload(), 2000);
      } catch { toast.error('Error importing data. Check the file format.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllData = () => {
    ['trades','journalEntries','goals','accounts','settings'].forEach(k => userStorage.removeItem(k));
    window.location.reload();
  };

  const storageUsed = (() => {
    let total = 0;
    ['trades','accounts','journalEntries','goals','riskRules','settings','onboarding'].forEach(k => {
      const v = userStorage.getItem(k);
      if (v) total += new Blob([v]).size;
    });
    return { mb: (total / 1048576).toFixed(2), pct: (total / 1048576 / 10) * 100 };
  })();

  const lastBackup = userStorage.getItem('lastBackupDate');
  const daysSince = lastBackup ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000) : null;
  const needsBackup = !lastBackup || (daysSince !== null && daysSince > 30);

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />

        {/* Page header */}
        <div className="border-b border-border/60">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your preferences and account</p>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-b border-border/60 overflow-x-auto">
          <div className="flex gap-0 px-4 min-w-max">
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeSection === id ? 'border-current' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                style={activeSection === id ? { color: themeColors.primary, borderColor: themeColors.primary } : {}}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-10 items-start">

            {/* ── Sidebar nav ─────────────────────────────────────────── */}
            <nav className="hidden md:block w-44 shrink-0 sticky top-6 self-start">
              <ul className="space-y-px">
                {NAV.map(({ id, label, Icon }) => {
                  const isActive = activeSection === id;
                  return (
                    <li key={id} className="relative">
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full transition-opacity"
                        style={{ backgroundColor: themeColors.primary, opacity: isActive ? 1 : 0 }}
                      />
                      <button
                        onClick={() => scrollTo(id)}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                          isActive
                            ? 'text-foreground bg-muted/60 font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0 transition-colors"
                          style={isActive ? { color: themeColors.primary } : {}}
                          aria-hidden="true"
                        />
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* ── Scrollable content ───────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-12 pb-16">

              {/* ── GENERAL ─────────────────────────────────────────────── */}
              <section
                id="general"
                ref={(el) => { sectionRefs.current['general'] = el; }}
                className="scroll-mt-24 space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-0.5 rounded-full shrink-0" style={{ backgroundColor: themeColors.primary }} />
                  <h2 className="text-base font-semibold">General</h2>
                </div>

                {/* Appearance */}
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>
                  </div>
                  <div className="divide-y divide-border/50">

                    {/* Theme mode */}
                    <div className="px-5 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="sm:w-44 shrink-0">
                        <p className="text-sm font-medium">Theme Mode</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Light, dark, or system</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 max-w-xs">
                        {([
                          { value: 'light', label: 'Light', icon: faSun },
                          { value: 'dark', label: 'Dark', icon: faMoon },
                          { value: 'system', label: 'System', icon: faDesktop },
                        ] as const).map(({ value, label, icon }) => (
                          <button
                            key={value}
                            onClick={() => setTheme(value)}
                            aria-pressed={theme === value}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs transition-all ${
                              theme === value ? 'font-semibold' : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/40'
                            }`}
                            style={theme === value ? { borderColor: `${themeColors.primary}60`, backgroundColor: `${themeColors.primary}10` } : {}}
                          >
                            <FontAwesomeIcon icon={icon} aria-hidden="true" className="h-4 w-4" style={theme === value ? { color: themeColors.primary } : {}} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="px-5 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="sm:w-44 shrink-0">
                        <p className="text-sm font-medium">Display Currency</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Used for P&amp;L display</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CURRENCIES.map(({ value, symbol, label }) => {
                          const isActive = (activeAccount?.currency || settings.currency) === value;
                          return (
                            <button
                              key={value}
                              onClick={() => {
                                updateSettings({ currency: value });
                                if (activeAccount) updateAccount(activeAccount.id, { ...activeAccount, currency: value });
                              }}
                              aria-pressed={isActive}
                              className={`flex flex-col items-center gap-0.5 rounded-xl border px-4 py-3 text-xs transition-all min-w-[3.5rem] ${
                                isActive ? 'font-semibold' : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/40'
                              }`}
                              style={isActive ? { borderColor: `${themeColors.primary}60`, backgroundColor: `${themeColors.primary}14` } : {}}
                            >
                              <span className="text-sm font-bold" style={isActive ? { color: themeColors.primary } : {}}>{symbol}</span>
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color theme */}
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color Theme</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Accent, profit, and loss colors across the app</p>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {Object.entries(availableThemes).map(([key, preset]) => {
                        const isSelected = currentTheme === key;
                        return (
                          <div
                            key={key}
                            onClick={() => setColorTheme(key)}
                            tabIndex={0}
                            role="button"
                            aria-pressed={isSelected}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setColorTheme(key); } }}
                            className="rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            style={{ borderColor: isSelected ? preset.colors.primary : 'hsl(var(--border))', backgroundColor: isSelected ? `${preset.colors.primary}08` : 'transparent' }}
                          >
                            <div className="flex rounded-md overflow-hidden h-2.5 mb-2.5">
                              <div className="flex-1" style={{ backgroundColor: preset.colors.profit }} />
                              <div className="flex-1" style={{ backgroundColor: preset.colors.primary }} />
                              <div className="flex-1" style={{ backgroundColor: preset.colors.loss }} />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium truncate">{preset.name}</span>
                              {isSelected && <FontAwesomeIcon icon={faCheck} aria-hidden="true" className="h-3 w-3 shrink-0" style={{ color: preset.colors.primary }} />}
                            </div>
                            <div className="flex mt-1 text-[10px] text-muted-foreground">
                              <span className="flex-1">Profit</span>
                              <span className="flex-1 text-center">Accent</span>
                              <span className="flex-1 text-right">Loss</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {currentTheme === 'custom' && (
                      <div className="pt-4 border-t border-border/50 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom colors</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {([
                            { key: 'primary' as const, label: 'Accent' },
                            { key: 'profit' as const, label: 'Profit' },
                            { key: 'loss' as const, label: 'Loss' },
                          ]).map(({ key, label }) => (
                            <div key={key} className="space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button type="button" className="flex items-center gap-2.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    <div className="h-5 w-5 rounded-md border shrink-0" style={{ backgroundColor: customColors[key] }} />
                                    <span className="uppercase text-xs text-muted-foreground flex-1 text-left">{customColors[key]}</span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3 space-y-3" align="start">
                                  <HexColorPicker color={customColors[key]} onChange={(c) => setCustomColors({ [key]: c })} />
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-md border shrink-0" style={{ backgroundColor: customColors[key] }} />
                                    <Input value={customColors[key]} maxLength={7} className="h-8 font-mono text-sm uppercase" onChange={(e) => {
                                      let v = e.target.value;
                                      if (!v.startsWith('#')) v = '#' + v;
                                      if (/^#[0-9a-fA-F]{0,6}$/.test(v) && v.length === 7) setCustomColors({ [key]: v.toLowerCase() });
                                    }} />
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── ACCOUNTS ────────────────────────────────────────────── */}
              <section
                id="accounts"
                ref={(el) => { sectionRefs.current['accounts'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-0.5 rounded-full shrink-0" style={{ backgroundColor: themeColors.primary }} />
                  <div>
                    <h2 className="text-base font-semibold">Accounts</h2>
                    <p className="text-xs text-muted-foreground">Manage trading accounts to track performance separately</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/50">
                  {accounts.map((account) => (
                    <div key={account.id}>
                      {editForm?.id === account.id ? (
                        <div className="p-5 space-y-4">
                          <p className="text-sm font-semibold">Edit Account</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Account Name</Label>
                              <Input placeholder="e.g. Main Live Account" value={editForm.name} onChange={(e) => setEditForm(p => p ? { ...p, name: e.target.value } : null)} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Account Type</Label>
                              <Select value={editForm.type} onValueChange={(v: TradingAccount['type']) => setEditForm(p => p ? { ...p, type: v } : null)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="demo">Demo</SelectItem>
                                  <SelectItem value="live">Live</SelectItem>
                                  <SelectItem value="prop-firm">Prop Firm</SelectItem>
                                  <SelectItem value="paper">Paper</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Broker</Label>
                              <Select value={editForm.broker} onValueChange={(v) => setEditForm(p => p ? { ...p, broker: v } : null)}>
                                <SelectTrigger><SelectValue placeholder="Select broker…" /></SelectTrigger>
                                <SelectContent>{BROKERS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Currency</Label>
                              <Select value={editForm.currency} onValueChange={(v) => setEditForm(p => p ? { ...p, currency: v } : null)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Balance (Optional)</Label>
                              <Input type="number" placeholder="10000" value={editForm.balance || ''} onChange={(e) => setEditForm(p => p ? { ...p, balance: e.target.value ? parseFloat(e.target.value) : undefined } : null)} />
                            </div>
                            <div className="flex items-center gap-2 pt-5">
                              <Switch checked={editForm.isDefault} onCheckedChange={(c) => setEditForm(p => p ? { ...p, isDefault: c } : null)} />
                              <Label className="text-xs">Set as default</Label>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" onClick={() => { if (editForm.name && editForm.broker) { updateAccount(editForm.id, editForm); if (activeAccount && editForm.id === activeAccount.id && editForm.currency !== settings.currency) updateSettings({ currency: editForm.currency }); setEditForm(null); } }} disabled={!editForm.name || !editForm.broker} style={{ backgroundColor: themeColors.primary }}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditForm(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 px-5 py-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{account.name}</span>
                              {account.isDefault && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: alpha(themeColors.profit, '15'), color: themeColors.profit }}>Default</span>}
                              {activeAccount?.id === account.id && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: alpha(themeColors.primary, '15'), color: themeColors.primary }}>Active</span>}
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{account.type.replace('-', ' ')}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{account.broker} · {account.currency}{account.balance ? ` · ${formatCurrency(account.balance, false)}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!account.isDefault && (
                              <button onClick={() => updateAccount(account.id, { isDefault: true })} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">Set default</button>
                            )}
                            <button onClick={() => setEditForm(account)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">Edit</button>
                            <button onClick={() => setDeleteAccountId(account.id)} disabled={accounts.length <= 1} className="text-xs text-destructive hover:text-destructive/80 px-2 py-1 rounded hover:bg-destructive/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {showAddAccount && (
                    <div className="p-5 space-y-4">
                      <p className="text-sm font-semibold">Add Account</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Account Name</Label>
                          <Input placeholder="e.g. Main Live Account" value={accountForm.name} onChange={(e) => setAccountForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Account Type</Label>
                          <Select value={accountForm.type} onValueChange={(v: TradingAccount['type']) => setAccountForm(p => ({ ...p, type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="demo">Demo</SelectItem>
                              <SelectItem value="live">Live</SelectItem>
                              <SelectItem value="prop-firm">Prop Firm</SelectItem>
                              <SelectItem value="paper">Paper</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Broker</Label>
                          <Select value={accountForm.broker} onValueChange={(v) => setAccountForm(p => ({ ...p, broker: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select broker…" /></SelectTrigger>
                            <SelectContent>{BROKERS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Currency</Label>
                          <Select value={accountForm.currency} onValueChange={(v) => setAccountForm(p => ({ ...p, currency: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Initial Balance (Optional)</Label>
                          <Input type="number" placeholder="10000" value={accountForm.balance} onChange={(e) => setAccountForm(p => ({ ...p, balance: e.target.value }))} />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                          <Switch checked={accountForm.isDefault} onCheckedChange={(c) => setAccountForm(p => ({ ...p, isDefault: c }))} />
                          <Label className="text-xs">Set as default</Label>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={() => { if (accountForm.name && accountForm.broker) { addAccount({ ...accountForm, balance: accountForm.balance ? parseFloat(accountForm.balance) : undefined }); setAccountForm({ name:'',type:'demo',broker:'',currency:'USD',balance:'',isDefault:false }); setShowAddAccount(false); } }} disabled={!accountForm.name || !accountForm.broker} style={{ backgroundColor: themeColors.profit }}>Add Account</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddAccount(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {!showAddAccount && !editForm && (
                    <button
                      onClick={() => setShowAddAccount(true)}
                      className="flex w-full items-center justify-center gap-2 px-5 py-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-lg leading-none">+</span>
                      Add Account
                    </button>
                  )}
                </div>
              </section>

              {/* ── PERFORMANCE ─────────────────────────────────────────── */}
              <section
                id="performance"
                ref={(el) => { sectionRefs.current['performance'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-0.5 rounded-full shrink-0" style={{ backgroundColor: themeColors.primary }} />
                  <div>
                    <h2 className="text-base font-semibold">Performance</h2>
                    <p className="text-xs text-muted-foreground">Stats for {stats.accountName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total P&L', value: formatCurrency(stats.totalPnL, true), color: stats.totalPnL >= 0 ? themeColors.profit : themeColors.loss, icon: stats.totalPnL >= 0 ? faArrowTrendUp : faArrowTrendDown },
                    { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, sub: `${stats.wins}W / ${stats.losses}L`, color: stats.winRate >= 50 ? themeColors.profit : themeColors.loss },
                    { label: 'Profit Factor', value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2), sub: stats.profitFactor > 1 ? 'Profitable' : stats.profitFactor === 0 ? 'No data' : 'Unprofitable', color: stats.profitFactor > 1 ? themeColors.profit : themeColors.loss },
                    { label: 'Streak', value: `${Math.abs(stats.currentStreak)} ${stats.currentStreak > 0 ? 'Wins' : stats.currentStreak < 0 ? 'Losses' : 'N/A'}`, sub: `Max: ${stats.maxWinStreak}W / ${stats.maxLossStreak}L`, color: stats.currentStreak > 0 ? themeColors.profit : stats.currentStreak < 0 ? themeColors.loss : undefined },
                  ].map(({ label, value, sub, color, icon }) => (
                    <div key={label} className="rounded-xl border border-border/50 bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        {icon && <FontAwesomeIcon icon={icon} aria-hidden="true" className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color }} />}
                      </div>
                      <p className="text-xl font-bold mt-1.5" style={{ color }}>{value}</p>
                      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Trades', value: String(stats.total) },
                    { label: 'This Month', value: String(stats.thisMonth), sub: formatCurrency(stats.monthlyPnL, true) },
                    { label: 'Best Trade', value: formatCurrency(stats.bestTrade, true), color: themeColors.profit },
                    { label: 'Worst Trade', value: formatCurrency(stats.worstTrade, true), color: themeColors.loss },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} className="rounded-xl border border-border/50 bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-base font-bold mt-1" style={{ color }}>{value}</p>
                      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                    </div>
                  ))}
                </div>
              </section>

              {/* ── RISK ────────────────────────────────────────────────── */}
              <section
                id="risk"
                ref={(el) => { sectionRefs.current['risk'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-0.5 rounded-full shrink-0" style={{ backgroundColor: themeColors.primary }} />
                  <div>
                    <h2 className="text-base font-semibold">Risk Management</h2>
                    <p className="text-xs text-muted-foreground">Protect your capital with smart position sizing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Parameters */}
                  <div className="lg:col-span-2 rounded-xl border border-border/50 overflow-hidden">
                    <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parameters</p>
                    </div>
                    <div className="divide-y divide-border/50">
                      <div className="px-5 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="sm:w-44 shrink-0">
                          <p className="text-sm font-medium">Risk per Trade</p>
                          <p className="text-xs text-muted-foreground mt-0.5">% of account per trade</p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="relative max-w-[160px]">
                            <Input type="number" name="riskPerTrade" inputMode="decimal" autoComplete="off" step="0.1" min="0.1" max="10" value={settings.riskPerTrade} onChange={(e) => updateSettings({ riskPerTrade: parseFloat(e.target.value) || 0 })} className="h-10 pr-7" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                          </div>
                          <div className="space-y-1 max-w-[160px]">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min((settings.riskPerTrade / 5) * 100, 100)}%`, backgroundColor: settings.riskPerTrade <= 2 ? themeColors.profit : settings.riskPerTrade <= 4 ? themeColors.primary : themeColors.loss }} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {settings.riskPerTrade <= 2 ? 'Conservative — recommended' : settings.riskPerTrade <= 4 ? 'Moderate risk' : 'High risk'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="sm:w-44 shrink-0">
                          <p className="text-sm font-medium">Account Size</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Total trading capital</p>
                        </div>
                        <div className="flex-1">
                          <div className="relative max-w-[160px]">
                            <Input type="number" name="accountSize" inputMode="decimal" autoComplete="off" step="1000" value={settings.accountSize} onChange={(e) => updateSettings({ accountSize: parseFloat(e.target.value) || 0 })} placeholder="10000" className="h-10 pl-6" />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{getCurrencySymbol()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calculator */}
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calculator</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {[
                        { label: 'Max risk per trade', value: formatCurrency((settings.accountSize * settings.riskPerTrade) / 100, false), color: themeColors.profit },
                        { label: 'Account balance', value: formatCurrency(settings.accountSize, false), color: themeColors.primary },
                        { label: 'Trades to blow account', value: String(Math.round(100 / settings.riskPerTrade)), color: themeColors.loss },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-lg p-3 bg-muted/40">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-lg font-bold mt-0.5" style={{ color }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Guidelines */}
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guidelines</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Conservative', range: '1–2%', color: themeColors.profit, desc: 'Beginners, steady growth' },
                        { label: 'Moderate', range: '2–3%', color: themeColors.primary, desc: 'Experienced traders' },
                        { label: 'Aggressive', range: '3–5%', color: themeColors.loss, desc: 'Proven systems only' },
                        { label: 'Dangerous', range: '5%+', color: themeColors.loss, desc: 'High blow-up risk', pulse: true },
                      ].map(({ label, range, color, desc, pulse }) => (
                        <div key={label} className="rounded-lg p-3 bg-muted/40">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className={`w-2 h-2 rounded-full shrink-0${pulse ? ' animate-pulse' : ''}`} style={{ backgroundColor: color }} />
                            <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                          </div>
                          <p className="text-base font-bold">{range}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg p-4 bg-muted/40 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['Never risk more than you can afford to lose', 'Always use stop losses on every trade', 'Keep risk consistent across all trades', 'Size positions based on distance to stop loss'].map(tip => (
                        <div key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-0.5 text-xs" style={{ color: themeColors.profit }}>✓</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── DATA ────────────────────────────────────────────────── */}
              <section
                id="data"
                ref={(el) => { sectionRefs.current['data'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-0.5 rounded-full shrink-0" style={{ backgroundColor: themeColors.primary }} />
                  <div>
                    <h2 className="text-base font-semibold">Data &amp; Privacy</h2>
                    <p className="text-xs text-muted-foreground">Export, import, and manage your data</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 divide-y divide-border/50 overflow-hidden">
                  {/* Backup */}
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-sm font-medium">Backup &amp; Restore</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Export all data or restore from a previous backup</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={exportData}>
                        <FontAwesomeIcon icon={faDownload} className="mr-2 h-3.5 w-3.5" />
                        Export Data
                      </Button>
<Button variant="outline" size="sm" onClick={() => document.getElementById('import-data')?.click()}>
                        <FontAwesomeIcon icon={faUpload} className="mr-2 h-3.5 w-3.5" />
                        Import Data
                      </Button>
                      <input id="import-data" type="file" accept=".json" className="hidden" onChange={importData} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Storage used</span>
                        <span style={{ color: parseFloat(storageUsed.mb) / 10 > 0.8 ? themeColors.loss : undefined }}>{storageUsed.mb} MB / ~10 MB</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(storageUsed.pct, 100)}%`, backgroundColor: storageUsed.pct > 80 ? themeColors.loss : themeColors.profit }} />
                      </div>
                    </div>
                    {!isPro && needsBackup && (
                      <div className="rounded-lg p-3 bg-amber-500/5 border border-amber-500/20">
                        <p className="text-sm font-medium">{lastBackup ? `Last backup: ${daysSince} days ago` : 'No backup yet'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 mb-2">Free tier data is stored locally. Back up regularly to avoid data loss.</p>
                        <Button size="sm" variant="outline" onClick={exportData} className="h-7 text-xs">Backup Now</Button>
                      </div>
                    )}
                    {!isPro && (
                      <div className="rounded-lg p-3 bg-muted/40">
                        <p className="text-sm font-medium">Want automatic cloud backup?</p>
                        <p className="text-xs text-muted-foreground mt-0.5 mb-2">Pro users get automatic sync across all devices.</p>
                        <Link to="/pricing"><Button size="sm" variant="outline" className="h-7 text-xs">Upgrade to Pro</Button></Link>
                      </div>
                    )}
                  </div>

                  {/* Danger zone */}
                  <div className="px-5 py-4 space-y-2">
                    <p className="text-sm font-medium text-destructive">Danger Zone</p>
                    <p className="text-xs text-muted-foreground">Permanently deletes all trades, journals, goals, and settings. Cannot be undone.</p>
                    <Button variant="destructive" size="sm" className="mt-1" onClick={() => setShowDeleteConfirm(true)}>Delete All Data</Button>
                  </div>
                </div>
              </section>

              {/* ── SUBSCRIPTION ────────────────────────────────────────── */}
              <section
                id="subscription"
                ref={(el) => { sectionRefs.current['subscription'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-0.5 rounded-full shrink-0" style={{ backgroundColor: themeColors.primary }} />
                  <div>
                    <h2 className="text-base font-semibold">Subscription</h2>
                    <p className="text-xs text-muted-foreground">Manage your plan and billing</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 divide-y divide-border/50 overflow-hidden">
                  <div className="p-5 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</p>
                    {isPro ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <ProBadge size="md" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{subscription?.planType} plan</p>
                          </div>
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 capitalize">
                            {subscription?.status === 'on_trial' ? 'Trial' : subscription?.status || 'Active'}
                          </Badge>
                        </div>
                        {subscription?.currentPeriodEnd && subscription.planType !== 'lifetime' && (
                          <p className="text-xs text-muted-foreground">
                            {subscription.status === 'cancelled' ? 'Access until' : subscription.status === 'on_trial' ? 'Trial ends on' : 'Renews on'}{' '}
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        )}
                        {subscription?.stripeCustomerId && (
                          <Button variant="outline" size="sm" onClick={async () => {
                            try { const { redirectToPortal } = await import('@/lib/stripe'); await redirectToPortal(); }
                            catch { toast.error('Failed to open subscription portal'); }
                          }}>Manage Subscription</Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">Free</p>
                            <p className="text-xs text-muted-foreground">You're on the free plan</p>
                          </div>
                          <Badge variant="outline">Free</Badge>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Upgrade to unlock</p>
                          <ul className="space-y-1.5">
                            {PRO_FEATURES.map(f => (
                              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="text-amber-500 text-xs">✓</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button size="sm" className="font-semibold" style={{ backgroundColor: '#f59e0b' }} onClick={() => navigate('/pricing')}>
                          <FontAwesomeIcon icon={faCrown} className="mr-2 h-3.5 w-3.5" />
                          Upgrade to Pro
                        </Button>
                      </div>
                    )}
                  </div>

                  {isPro && (
                    <div className="px-5 py-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium">Cloud Sync</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your trades sync automatically across all devices</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2 w-2 rounded-full shrink-0${syncStatus === 'syncing' ? ' animate-pulse' : ''}`} style={{ backgroundColor: syncStatus === 'synced' ? '#22c55e' : syncStatus === 'syncing' ? '#f59e0b' : syncStatus === 'error' ? '#ef4444' : 'hsl(var(--muted-foreground) / 0.4)' }} />
                        <div>
                          <p className="text-sm font-medium capitalize">{syncStatus === 'idle' ? 'Not connected' : syncStatus}</p>
                          {lastSyncTime && <p className="text-xs text-muted-foreground">Last synced {new Date(lastSyncTime).toLocaleTimeString()}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

            </div>{/* end scrollable content */}
          </div>
        </div>

        <AppFooter />
      </div>

      {/* Delete All Data Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete All Data?</DialogTitle>
            <DialogDescription>This permanently deletes all trades, journals, goals, and settings. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => { setShowDeleteConfirm(false); clearAllData(); }}>Delete Everything</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={!!deleteAccountId} onOpenChange={(open) => { if (!open) setDeleteAccountId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
            <DialogDescription>This will permanently delete the account and cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteAccountId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => { if (deleteAccountId) { deleteAccount(deleteAccountId); setDeleteAccountId(null); } }}>Delete Account</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pro Welcome Dialog */}
      <Dialog open={showProWelcome} onOpenChange={setShowProWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center items-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <FontAwesomeIcon icon={faCrown} className="h-8 w-8 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-bold">Welcome to Pro!</DialogTitle>
            <DialogDescription className="text-base">Your upgrade is complete. You now have access to all premium features.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {PRO_FEATURES.map(feature => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3 text-green-500" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
          <Button className="mt-6 w-full" onClick={() => setShowProWelcome(false)}>Get Started</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
