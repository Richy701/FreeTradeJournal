import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';
import { useThemePresets, computeThemeVars } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { MARKET_DATA_ENABLED } from '@/config/market-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/contexts/auth-context';
import { useDemoGuard } from '@/hooks/use-demo-guard';
import { useAccounts, FREE_TRADING_ACCOUNT_LIMIT, type TradingAccount } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { Sliders, Wallet, Gauge, Database, CreditCard, Check, DownloadSimple, UploadSimple, Sun, Moon, Monitor, Crown, Bell, PencilSimple, Lock, CircleNotch, Robot, CloudCheck, Infinity as InfinityIcon, Headset } from '@phosphor-icons/react';
import { trackEvent } from '@/lib/analytics';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { useProStatus } from '@/contexts/pro-context';
import { useSync } from '@/contexts/sync-context';
import { ProBadge } from '@/components/pro-badge';
import { PRO_FEATURES } from '@/constants/pricing';
import { ReferralCard } from '@/components/referral-card';
import { PushNotificationPrompt } from '@/components/push-notification-prompt';
import { belongsToAccount } from '@/lib/account-scope';
import { ExitSurveyDialog } from '@/components/exit-survey-dialog';
import { ProGate } from '@/components/pro-gate';
import { ThemeStudio, ThemeMiniPreview, PREVIEW_DEFAULTS } from '@/components/theme-studio';

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

const BROKER_CUSTOM = '__custom__';

// Broker/prop-firm picker with a free-text "Custom…" option, so traders on firms
// that aren't in the preset list (Lucid, Tradeify, etc.) can enter their own.
function BrokerSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isKnown = (BROKERS as readonly string[]).includes(value);
  const customActive = !!value && !isKnown;
  const [showCustom, setShowCustom] = useState(customActive);
  const selectValue = isKnown ? value : showCustom || customActive ? BROKER_CUSTOM : '';

  return (
    <>
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === BROKER_CUSTOM) {
            setShowCustom(true);
            onChange('');
          } else {
            setShowCustom(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger><SelectValue placeholder="Select broker…" /></SelectTrigger>
        <SelectContent>
          {BROKERS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          <SelectItem value={BROKER_CUSTOM}>Custom…</SelectItem>
        </SelectContent>
      </Select>
      {(showCustom || customActive) && (
        <Input
          className="mt-2"
          placeholder="Enter prop firm / broker name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </>
  );
}

// Free plan is capped at FREE_TRADING_ACCOUNT_LIMIT trading accounts; Pro is
// unlimited. Existing accounts above the cap are grandfathered — the guard
// only blocks adding new ones, it never removes accounts a user already
// created. The cap itself is enforced in account-context's addAccount.

const NAV = [
  { id: 'general',       label: 'General',       Icon: Sliders },
  { id: 'accounts',      label: 'Accounts',      Icon: Wallet },
  { id: 'risk',          label: 'Risk',          Icon: Gauge },
  { id: 'data',          label: 'Data',          Icon: Database },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'subscription',  label: 'Subscription',  Icon: CreditCard },
] as const;

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { currentTheme, setTheme: setColorTheme, availableThemes, themeColors, alpha, setCustomColors, customColors } = useThemePresets();
  // Mode used to render the full-theme preview mocks
  const resolvedMode: 'light' | 'dark' = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  const { user, isDemo } = useAuth();
  const demoGuard = useDemoGuard();
  const { accounts, activeAccount, addAccount, updateAccount, deleteAccount } = useAccounts();
  const { settings, updateSettings, formatCurrency, getCurrencySymbol } = useSettings();
  const userStorage = useUserStorage();
  const { isPro, subscription, trialEndsAt } = useProStatus();
  const { syncStatus, lastSyncTime } = useSync();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showProWelcome, setShowProWelcome] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<string>('general');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
    trackEvent('settings_tab_viewed', { tab: id });
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
      trackEvent('checkout_completed');
      setSearchParams({}, { replace: true });
      setTimeout(() => scrollTo('subscription'), 600);
      setCheckoutPending(true);
    } else if (searchParams.get('tab')) {
      const tab = searchParams.get('tab')!;
      setTimeout(() => scrollTo(tab), 300);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only celebrate once the Stripe webhook has actually flipped the pro flag.
  // Celebrating off the redirect alone shows "everything is unlocked" over a
  // Subscription section that still says Free while the webhook lags.
  useEffect(() => {
    if (!checkoutPending) return;
    if (isPro) {
      setCheckoutPending(false);
      toast.dismiss('checkout-confirming');
      setShowProWelcome(true);
      toast.success('Welcome to Pro! Your upgrade is complete.');
    } else {
      toast.info('Payment received — unlocking your Pro features...', { id: 'checkout-confirming', duration: 15000 });
    }
  }, [checkoutPending, isPro]);

  // Prefetch the Stripe portal chunks once the Subscription section is in view,
  // so they aren't part of the click latency when opening the billing portal.
  useEffect(() => {
    if (activeSection !== 'subscription' || !isPro) return;
    import('@/lib/stripe').catch(() => {});
    import('@/lib/firebase-lazy').then(m => m.getFirebaseFunctions()).catch(() => {});
  }, [activeSection, isPro]);

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

  const exportData = () => {
    const keys = ['trades','accounts','journalEntries','tradingGoals','riskRules','settings','onboarding','onboardingCompleted','propFirmAccounts','propFirmTransactions'];
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
    if (demoGuard('import data')) { event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.trades) userStorage.setItem('trades', JSON.stringify(data.trades));
        if (data.accounts) userStorage.setItem('accounts', JSON.stringify(data.accounts));
        if (data.journalEntries) userStorage.setItem('journalEntries', JSON.stringify(data.journalEntries));
        if (data.tradingGoals) userStorage.setItem('tradingGoals', JSON.stringify(data.tradingGoals));
        if (data.riskRules) userStorage.setItem('riskRules', JSON.stringify(data.riskRules));
        if (data.settings) userStorage.setItem('settings', JSON.stringify(data.settings));
        if (data.onboarding) userStorage.setItem('onboarding', JSON.stringify(data.onboarding));
        if (data.onboardingCompleted !== undefined) userStorage.setItem('onboardingCompleted', String(data.onboardingCompleted));
        if (data.propFirmAccounts) userStorage.setItem('propFirmAccounts', JSON.stringify(data.propFirmAccounts));
        if (data.propFirmTransactions) userStorage.setItem('propFirmTransactions', JSON.stringify(data.propFirmTransactions));
        const count = [data.trades?.length||0, data.accounts?.length||0, data.journalEntries?.length||0, data.tradingGoals?.length||0, data.propFirmAccounts?.length||0].reduce((a,b)=>a+b,0);
        toast.success(`Imported ${count} items!`);
        setTimeout(() => window.location.reload(), 2000);
      } catch { toast.error('Error importing data. Check the file format.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllData = () => {
    if (demoGuard('manage your data')) return;
    ['trades','journalEntries','goals','tradingGoals','riskRules','accounts','settings'].forEach(k => userStorage.removeItem(k));
    window.location.reload();
  };

  const deleteMyAccount = async () => {
    if (demoGuard('delete your account')) {
      setShowDeleteAccountConfirm(false);
      return;
    }
    setDeletingAccount(true);
    try {
      const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
      const { httpsCallable } = await import('firebase/functions');
      const fns = await getFirebaseFunctions();
      const deleteAccount = httpsCallable(fns, 'deleteUserAccount');
      await deleteAccount();
      // Clear local data
      ['trades','journalEntries','goals','tradingGoals','accounts','settings','riskRules','onboarding','propFirmAccounts','propFirmTransactions'].forEach(k => userStorage.removeItem(k));
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      toast.error('Failed to delete account. Please try again or contact support.');
    } finally {
      setDeletingAccount(false);
      setShowDeleteAccountConfirm(false);
    }
  };

  const storageUsed = (() => {
    let total = 0;
    ['trades','accounts','journalEntries','tradingGoals','riskRules','settings','onboarding'].forEach(k => {
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

        <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg shrink-0 mt-0.5 bg-primary/10">
                <Sliders className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h1 className="font-display text-2xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground">Customize your experience and manage your account.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/60">
          <div className="w-full max-w-5xl mx-auto overflow-x-auto scrollbar-hide">
            <div className="flex gap-0 px-4 sm:px-6 lg:px-8 min-w-max">
              {NAV.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeSection === id ? 'text-primary border-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-12 pb-16">

              {/* Profile & plan summary */}
              <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.08] via-transparent to-transparent pointer-events-none" aria-hidden="true" />
                <div className="relative p-4 sm:p-5 flex flex-wrap items-center gap-4">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/25 shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-primary/10 ring-2 ring-primary/25 flex items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-primary">{(user?.displayName || user?.email || 'T').charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold capitalize truncate">{user?.displayName || 'Trader'}</p>
                      {isPro ? <ProBadge /> : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Free plan</span>
                      )}
                    </div>
                    {user?.email && <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>}
                  </div>
                  <div className="hidden md:flex items-center gap-5 shrink-0 pr-1">
                    {user?.metadata?.creationTime && (
                      <>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Member since</p>
                          <p className="text-sm font-semibold mt-0.5">
                            {new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(user.metadata.creationTime))}
                          </p>
                        </div>
                        <div className="h-8 w-px bg-border/70" aria-hidden="true" />
                      </>
                    )}
                    {isPro ? (
                      <button
                        onClick={() => scrollTo('subscription')}
                        className="text-xs font-medium text-primary hover:underline underline-offset-4"
                      >
                        Manage plan
                      </button>
                    ) : !isDemo && (
                      <Button size="sm" className="font-semibold" onClick={() => navigate('/pricing')}>
                        <Crown className="mr-1.5 h-3.5 w-3.5" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── GENERAL ─────────────────────────────────────────────── */}
              <section
                id="general"
                ref={(el) => { sectionRefs.current['general'] = el; }}
                className="scroll-mt-24 space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60 border border-border/60 shrink-0">
                    <Sliders aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">General</h2>
                    <p className="text-xs text-muted-foreground">Appearance and display preferences</p>
                  </div>
                </div>

                {/* Appearance */}
                <div className="rounded-xl border border-border/70 overflow-hidden">
                  <div className="px-4 sm:px-5 py-3.5 bg-muted/30 border-b border-border/70">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>
                  </div>
                  <div className="divide-y divide-border/50">

                    {/* Theme mode */}
                    <div className="px-4 sm:px-5 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="sm:w-44 shrink-0">
                        <p className="text-sm font-medium">Theme Mode</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Light, dark, or system</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 max-w-xs">
                        {([
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                          { value: 'system', label: 'System', icon: Monitor },
                        ] as const).map(({ value, label, icon }) => (
                          <button
                            key={value}
                            onClick={() => setTheme(value)}
                            aria-pressed={theme === value}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs transition-all ${
                              theme === value ? 'font-semibold border-primary/40 bg-primary/10' : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/40'
                            }`}
                          >
                            {(() => { const ThemeIcon = icon; return <ThemeIcon aria-hidden="true" className={`h-4 w-4 ${theme === value ? 'text-primary' : ''}`} />; })()}
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="px-4 sm:px-5 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
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
                              className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs transition-all min-w-[4rem] ${
                                isActive ? 'font-semibold border-primary/40 bg-primary/10' : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/40'
                              }`}
                            >
                              <span className={`text-sm font-bold ${isActive ? 'text-primary' : ''}`}>{symbol}</span>
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color theme */}
                <div className="rounded-xl border border-border/70 overflow-hidden">
                  <div className="px-5 py-3.5 bg-muted/30 border-b border-border/70">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color Theme</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Accent, profit, and loss colors across the app</p>
                  </div>
                  <div className="p-5 space-y-6">

                    {/* Accent themes: swap the data colors, keep the standard look */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accent colors</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Change the accent and profit/loss colors, keep the standard look</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {Object.entries(availableThemes).filter(([key, preset]) => !preset.cssOverrides && key !== 'custom').map(([key, preset]) => {
                          const isSelected = currentTheme === key;
                          return (
                            <div
                              key={key}
                              onClick={() => setColorTheme(key)}
                              tabIndex={0}
                              role="button"
                              aria-pressed={isSelected}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setColorTheme(key); } }}
                              className="group cursor-pointer outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              <div className="pointer-events-none transition-opacity group-hover:opacity-90" aria-hidden="true">
                                <ThemeMiniPreview
                                  vars={computeThemeVars(key, customColors, resolvedMode)}
                                  fallback={PREVIEW_DEFAULTS[resolvedMode]}
                                  style={isSelected ? { boxShadow: `0 0 0 2px ${preset.colors.primary}` } : undefined}
                                />
                              </div>
                              <span className={`mt-2 block text-xs truncate transition-colors ${isSelected ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground group-hover:text-foreground'}`}>{preset.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Full themes: restyle every surface, previewed as a mini app mock */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full themes</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Restyle everything — backgrounds, cards, and sidebar included</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {Object.entries(availableThemes).filter(([, preset]) => !!preset.cssOverrides).map(([key, preset]) => {
                          const isSelected = currentTheme === key;
                          return (
                            <div
                              key={key}
                              onClick={() => setColorTheme(key)}
                              tabIndex={0}
                              role="button"
                              aria-pressed={isSelected}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setColorTheme(key); } }}
                              className="group cursor-pointer outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              <div className="pointer-events-none transition-opacity group-hover:opacity-90" aria-hidden="true">
                                <ThemeMiniPreview
                                  vars={computeThemeVars(key, customColors, resolvedMode)}
                                  style={isSelected ? { boxShadow: `0 0 0 2px ${preset.colors.primary}` } : undefined}
                                />
                              </div>
                              <span className={`mt-2 block text-xs truncate transition-colors ${isSelected ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground group-hover:text-foreground'}`}>{preset.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom theme: free base colors + Pro Theme Studio */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your theme</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Pick your own accent, profit, and loss colors</p>
                      </div>
                      {(() => {
                        const isSelected = currentTheme === 'custom';
                        return (
                          <div
                            onClick={() => setColorTheme('custom')}
                            tabIndex={0}
                            role="button"
                            aria-pressed={isSelected}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setColorTheme('custom'); } }}
                            className="group cursor-pointer outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background max-w-xs"
                          >
                            <div className="pointer-events-none transition-opacity group-hover:opacity-90" aria-hidden="true">
                              <ThemeMiniPreview
                                vars={computeThemeVars('custom', customColors, resolvedMode)}
                                fallback={PREVIEW_DEFAULTS[resolvedMode]}
                                style={isSelected ? { boxShadow: `0 0 0 2px ${customColors.primary}` } : undefined}
                              />
                            </div>
                            <span className={`mt-2 block text-xs truncate transition-colors ${isSelected ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground group-hover:text-foreground'}`}>Custom</span>
                          </div>
                        );
                      })()}

                      {currentTheme === 'custom' && (
                        <div className="pt-4 border-t border-border/70 space-y-5">
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base colors</p>
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

                          <ProGate featureName="Theme Studio">
                            <ThemeStudio />
                          </ProGate>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dashboard */}
                {MARKET_DATA_ENABLED && (
                  <div className="rounded-xl border border-border/70 overflow-hidden">
                    <div className="px-5 py-3.5 bg-muted/30 border-b border-border/70">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dashboard</p>
                      <p className="text-xs text-muted-foreground mt-0.5">What appears in the strip at the top of your dashboard</p>
                    </div>
                    <div className="divide-y divide-border/50">
                      <div className="px-4 sm:px-5 py-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">Live market prices</p>
                          <p className="text-xs text-muted-foreground mt-0.5">A ticker of the symbols you trade</p>
                        </div>
                        <Switch
                          checked={settings.showMarketPrices}
                          onCheckedChange={(c) => updateSettings({ showMarketPrices: c })}
                        />
                      </div>
                      <div className="px-4 sm:px-5 py-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">Macro snapshot</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Fed funds rate, Treasury yields, CPI, and unemployment</p>
                        </div>
                        <Switch
                          checked={settings.showMacroSnapshot}
                          onCheckedChange={(c) => updateSettings({ showMacroSnapshot: c })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ── ACCOUNTS ────────────────────────────────────────────── */}
              <section
                id="accounts"
                ref={(el) => { sectionRefs.current['accounts'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60 border border-border/60 shrink-0">
                    <Wallet aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Accounts</h2>
                    <p className="text-xs text-muted-foreground">Manage trading accounts to track performance separately</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/50">
                  {accounts.map((account) => (
                    <div key={account.id}>
                      {editForm?.id === account.id ? (
                        <div className="p-5 space-y-4">
                          <p className="text-sm font-semibold flex items-center gap-1.5"><PencilSimple className="h-4 w-4" /> Edit Account</p>
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
                              <BrokerSelect value={editForm.broker} onChange={(v) => setEditForm(p => p ? { ...p, broker: v } : null)} />
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
                            <Button size="sm" onClick={() => { if (editForm.name && editForm.broker) { updateAccount(editForm.id, editForm); if (activeAccount && editForm.id === activeAccount.id && editForm.currency !== settings.currency) updateSettings({ currency: editForm.currency }); setEditForm(null); } }} disabled={!editForm.name || !editForm.broker}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditForm(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-4">
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
                              <button onClick={() => updateAccount(account.id, { isDefault: true })} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded hover:bg-muted transition-colors">Set default</button>
                            )}
                            <button onClick={() => setEditForm(account)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded hover:bg-muted transition-colors flex items-center gap-1"><PencilSimple className="h-3.5 w-3.5" /> Edit</button>
                            <button onClick={() => setDeleteAccountId(account.id)} disabled={accounts.length <= 1} className="text-xs text-destructive hover:text-destructive/80 px-3 py-2 rounded hover:bg-destructive/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Delete</button>
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
                          <BrokerSelect value={accountForm.broker} onChange={(v) => setAccountForm(p => ({ ...p, broker: v }))} />
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
                        <Button size="sm" onClick={() => { if (demoGuard('add accounts')) return; if (accountForm.name && accountForm.broker) { addAccount({ ...accountForm, balance: accountForm.balance ? parseFloat(accountForm.balance) : undefined }); setAccountForm({ name:'',type:'demo',broker:'',currency:'USD',balance:'',isDefault:false }); setShowAddAccount(false); } }} disabled={!accountForm.name || !accountForm.broker} style={{ backgroundColor: themeColors.profit }}>Add Account</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddAccount(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {!showAddAccount && !editForm && (
                    !isPro && accounts.length >= FREE_TRADING_ACCOUNT_LIMIT ? (
                      <Link
                        to="/pricing"
                        onClick={() => trackEvent('pro_gate_cta_clicked', { feature: 'Multiple Accounts' })}
                        className="flex w-full items-center justify-center gap-2 px-5 py-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                      >
                        <Lock className="h-4 w-4" />
                        Upgrade to Pro for unlimited accounts
                      </Link>
                    ) : (
                      <button
                        onClick={() => setShowAddAccount(true)}
                        className="flex w-full items-center justify-center gap-2 px-5 py-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                      >
                        <span className="text-lg leading-none">+</span>
                        Add Account
                      </button>
                    )
                  )}
                </div>
              </section>

              {/* ── RISK ────────────────────────────────────────────────── */}
              <section
                id="risk"
                ref={(el) => { sectionRefs.current['risk'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60 border border-border/60 shrink-0">
                    <Gauge aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Risk Management</h2>
                    <p className="text-xs text-muted-foreground">Protect your capital with smart position sizing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Parameters */}
                  <div className="lg:col-span-2 rounded-xl border border-border/70 overflow-hidden">
                    <div className="px-5 py-3.5 bg-muted/30 border-b border-border/70">
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
                  <div className="rounded-xl border border-border/70 overflow-hidden">
                    <div className="px-5 py-3.5 bg-muted/30 border-b border-border/70">
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

                {/* Guidelines — static reference content, collapsed by default */}
                <div className="rounded-xl border border-border/70 overflow-hidden">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="guidelines" className="border-0">
                      <AccordionTrigger className="px-5 py-3.5 bg-muted/30 hover:no-underline">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk guidelines</span>
                      </AccordionTrigger>
                      <AccordionContent className="p-5 space-y-4 border-t border-border/70">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Conservative', range: '1–2%', color: themeColors.profit, desc: 'Beginners, steady growth' },
                        { label: 'Moderate', range: '2–3%', color: themeColors.primary, desc: 'Experienced traders' },
                        { label: 'Aggressive', range: '3–5%', color: themeColors.loss, desc: 'Proven systems only' },
                        { label: 'Dangerous', range: '5%+', color: themeColors.loss, desc: 'High blow-up risk', pulse: true },
                      ].map(({ label, range, color, desc, pulse }) => (
                        <div key={label} className="rounded-lg p-3 bg-muted/40">
                          <div className="mb-1.5">
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
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-profit" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </section>

              {/* ── DATA ────────────────────────────────────────────────── */}
              <section
                id="data"
                ref={(el) => { sectionRefs.current['data'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60 border border-border/60 shrink-0">
                    <Database aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Data &amp; Privacy</h2>
                    <p className="text-xs text-muted-foreground">Export, import, and manage your data</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 divide-y divide-border/50 overflow-hidden">
                  {/* Backup */}
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-sm font-medium">Backup &amp; Restore</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Export all data or restore from a previous backup</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={exportData}>
                        <DownloadSimple className="mr-2 h-3.5 w-3.5" />
                        Export Data
                      </Button>
<Button variant="outline" size="sm" onClick={() => document.getElementById('import-data')?.click()}>
                        <UploadSimple className="mr-2 h-3.5 w-3.5" />
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
                    {user && !isDemo ? (
                      <>
                        <p className="text-xs text-muted-foreground">Permanently delete your account, all data, and cancel any active subscription. This cannot be undone.</p>
                        <Button variant="destructive" size="sm" className="mt-1" onClick={() => setShowDeleteAccountConfirm(true)}>Delete My Account</Button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">Permanently deletes all trades, journals, goals, and settings. Cannot be undone.</p>
                        <Button variant="destructive" size="sm" className="mt-1" onClick={() => setShowDeleteConfirm(true)}>Delete All Data</Button>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* ── NOTIFICATIONS ─────────────────────────────────────── */}
              <section
                id="notifications"
                ref={(el) => { sectionRefs.current['notifications'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60 border border-border/60 shrink-0">
                    <Bell aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Notifications</h2>
                    <p className="text-xs text-muted-foreground">Manage push notification preferences</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 divide-y divide-border/50 overflow-hidden">
                  <PushNotificationPrompt />
                </div>
              </section>

              {/* ── SUBSCRIPTION ────────────────────────────────────────── */}
              <section
                id="subscription"
                ref={(el) => { sectionRefs.current['subscription'] = el; }}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60 border border-border/60 shrink-0">
                    <CreditCard aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Subscription</h2>
                    <p className="text-xs text-muted-foreground">Manage your plan and billing</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 divide-y divide-border/50 overflow-hidden">
                  <div className="p-5 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</p>
                    {isPro ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <ProBadge size="md" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                              {trialEndsAt ? 'Free trial' : subscription ? `${subscription.planType} plan` : 'Pro'}
                            </p>
                          </div>
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 capitalize">
                            {trialEndsAt || subscription?.status === 'on_trial' ? 'Trial' : subscription?.status || 'Active'}
                          </Badge>
                        </div>
                        {/* trialEndsAt set means the trial is the entitlement — any
                            subscription object left over is stale (cancelled/expired)
                            and its dates would only mislead here */}
                        {!trialEndsAt && subscription?.currentPeriodEnd && subscription.planType !== 'lifetime' && (
                          <p className="text-xs text-muted-foreground">
                            {subscription.status === 'cancelled' ? 'Access until' : subscription.status === 'on_trial' ? 'Trial ends on' : 'Renews on'}{' '}
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        )}
                        {trialEndsAt && (
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                              Your free Pro trial ends on {new Date(trialEndsAt).toLocaleDateString()} — no card on file, nothing is charged. Upgrade to keep Pro after it ends.
                            </p>
                            <Button size="sm" className="font-semibold" onClick={() => navigate('/pricing')}>
                              <Crown className="mr-2 h-3.5 w-3.5" />
                              Keep Pro
                            </Button>
                          </div>
                        )}
                        {subscription?.stripeCustomerId && (
                          <Button variant="outline" size="sm" disabled={portalLoading} onClick={async () => {
                            // Opening the Stripe portal is a Cloud Function + Stripe
                            // round-trip that can take a few seconds (cold start), so
                            // show a pending state immediately — otherwise the button
                            // looks dead and gets clicked repeatedly. Keep the spinner
                            // through the redirect; only clear it if the call fails.
                            setPortalLoading(true);
                            try {
                              const { redirectToPortal } = await import('@/lib/stripe');
                              await redirectToPortal();
                            } catch {
                              toast.error('Failed to open subscription portal');
                              setPortalLoading(false);
                            }
                          }}>
                            {portalLoading ? (
                              <><CircleNotch className="h-4 w-4 animate-spin" /> Opening…</>
                            ) : 'Manage Subscription'}
                          </Button>
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
                                <Check className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button size="sm" className="font-semibold" onClick={() => navigate('/pricing')}>
                          <Crown className="mr-2 h-3.5 w-3.5" />
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
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0${syncStatus === 'syncing' ? ' animate-pulse' : ''}`} style={{ backgroundColor: syncStatus === 'synced' ? '#22c55e' : syncStatus === 'syncing' ? '#f59e0b' : syncStatus === 'error' ? '#ef4444' : 'hsl(var(--muted-foreground) / 0.4)' }} />
                        <div>
                          <p className="text-sm font-medium capitalize">{syncStatus === 'idle' ? 'Not connected' : syncStatus}</p>
                          {lastSyncTime && <p className="text-xs text-muted-foreground">Last synced {new Date(lastSyncTime).toLocaleTimeString()}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Referral Program */}
                  {!isDemo && (
                    <div className="px-5 py-4 border-t border-border/70">
                      <ReferralCard />
                    </div>
                  )}
                </div>
              </section>

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

      {/* Delete My Account Confirmation Dialog */}
      <ExitSurveyDialog
        open={showDeleteAccountConfirm}
        onOpenChange={(open) => { if (!deletingAccount) setShowDeleteAccountConfirm(open); }}
        onConfirmDelete={deleteMyAccount}
        deleting={deletingAccount}
      />

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={!!deleteAccountId} onOpenChange={(open) => { if (!open) setDeleteAccountId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
            <DialogDescription>This permanently deletes the account along with all of its trades and journal entries. This cannot be undone.</DialogDescription>
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
            <div className="mx-auto mb-3">
              <ProBadge size="md" />
            </div>
            <DialogTitle className="text-xl font-bold">Welcome to Pro</DialogTitle>
            <DialogDescription>Everything is unlocked. Here's what changed:</DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            {[
              { icon: Robot, title: 'Unlimited AI', text: 'Coach FTJ, trade analysis, and reviews with no monthly cap.' },
              { icon: CloudCheck, title: 'Cloud sync & backup', text: 'Your trades and journal now sync across all your devices.' },
              { icon: InfinityIcon, title: 'No more limits', text: 'Unlimited journal entries, trading accounts, and prop tracking.' },
              { icon: Headset, title: 'Priority support', text: 'Faster help and early access to new features.' },
            ].map(({ icon: BenefitIcon, title, text }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <BenefitIcon className="h-[18px] w-[18px] text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{title}</p>
                  <p className="text-sm text-muted-foreground leading-snug mt-0.5">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              onClick={() => { setShowProWelcome(false); navigate('/coach'); }}
            >
              Try Coach FTJ
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowProWelcome(false)}>
              Explore on my own
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
