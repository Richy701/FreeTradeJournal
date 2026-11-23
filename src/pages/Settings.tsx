import { useState, useEffect, type ReactNode } from 'react';
import { readFocusRecords } from '@/lib/weekly-focus';
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
import { BROKER_TIMEZONES } from '@/utils/timezone';
import { useUserStorage } from '@/utils/user-storage';
import { openCookieSettings } from '@/lib/cookie-consent';
import { Sliders, Wallet, Gauge, Database, CreditCard, Check, DownloadSimple, UploadSimple, Cookie, Sun, Moon, Monitor, Crown, Bell, PencilSimple, Lock, CircleNotch, Robot, CloudCheck, Infinity as InfinityIcon, Headset, Plus } from '@phosphor-icons/react';
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
import { UnitInput, parseNumberInput } from '@/components/money-input';

import { BROKERS } from '@/constants/trading';
import { Progress } from '@/components/ui/progress'

const CURRENCIES = [
  { value: 'USD', symbol: '$', label: 'USD' },
  { value: 'EUR', symbol: '€', label: 'EUR' },
  { value: 'GBP', symbol: '£', label: 'GBP' },
  { value: 'JPY', symbol: '¥', label: 'JPY' },
  { value: 'CAD', symbol: 'C$', label: 'CAD' },
  { value: 'AUD', symbol: 'A$', label: 'AUD' },
] as const;

const getSymbolForCurrency = (code: string): string =>
  CURRENCIES.find(c => c.value === code)?.symbol ?? '$';

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
        <SelectTrigger aria-label="Broker"><SelectValue placeholder="Select broker…" /></SelectTrigger>
        <SelectContent>
          {BROKERS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          <SelectItem value={BROKER_CUSTOM}>Custom…</SelectItem>
        </SelectContent>
      </Select>
      {(showCustom || customActive) && (
        <Input
          className="mt-2"
          aria-label="Custom broker name"
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
  { id: 'appearance',    label: 'Appearance',    Icon: Sun },
  { id: 'accounts',      label: 'Accounts',      Icon: Wallet },
  { id: 'risk',          label: 'Risk',          Icon: Gauge },
  { id: 'data',          label: 'Data',          Icon: Database },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'subscription',  label: 'Subscription',  Icon: CreditCard },
] as const;

// Layout primitives every section is built from, so the page reads as one
// system: a section divider, and titled groups made of label/control rows.
function SectionHeading({ id, title }: { id: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <h2 id={id} className="text-lg font-semibold tracking-tight shrink-0">{title}</h2>
      <div className="flex-1 border-t border-border/60" aria-hidden="true" />
    </div>
  );
}

function SettingsGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0 rounded-xl border border-border/70 bg-card divide-y divide-border/50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children, stacked = false }: { label: ReactNode; description?: ReactNode; children?: ReactNode; stacked?: boolean }) {
  return (
    <div className={`px-5 py-4 flex flex-col gap-3 ${stacked ? "" : "sm:flex-row sm:items-center sm:justify-between sm:gap-6"}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children && <div className={stacked ? "w-full" : "shrink-0 sm:max-w-[60%]"}>{children}</div>}
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { currentTheme, setTheme: setColorTheme, availableThemes, themeColors, alpha, setCustomColors, customColors } = useThemePresets();
  // Mode used to render the full-theme preview mocks
  const resolvedMode: 'light' | 'dark' = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>(resolvedMode);
  const { user, isDemo } = useAuth();
  const demoGuard = useDemoGuard();
  const { accounts, activeAccount, addAccount, updateAccount, deleteAccount } = useAccounts();
  const { settings, updateSettings, formatCurrency, getCurrencySymbol } = useSettings();
  const userStorage = useUserStorage();
  const { isPro, isDev, subscription, trialEndsAt } = useProStatus();
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

  // One long page; the sticky tab bar scrolls to a section and follows the
  // scroll position. ?tab= deep links (sidebar, checkout redirect) land on
  // the right section.
  const [activeSection, setActiveSection] = useState<string>('general');
  const selectTab = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSearchParams({ tab: id }, { replace: true });
    trackEvent('settings_tab_viewed', { tab: id });
  };

  const urlTab = searchParams.get('tab');
  useEffect(() => {
    if (urlTab && NAV.some(n => n.id === urlTab)) setActiveSection(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab]);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      trackEvent('checkout_completed');
      setSearchParams({}, { replace: true });
      setTimeout(() => selectTab('subscription'), 600);
      setCheckoutPending(true);
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
    brokerTimezone: '',
  });
  const [editForm, setEditForm] = useState<TradingAccount | null>(null);

  const exportData = async () => {
    const keys = ['trades','accounts','journalEntries','tradingGoals','riskRules','settings','onboarding','onboardingCompleted','propFirmAccounts','propFirmTransactions','coachingFocus'];
    const raw: Record<string, any> = {};
    keys.forEach(k => { const v = userStorage.getItem(k); if (v) try { raw[k] = JSON.parse(v); } catch { raw[k] = v; } });

    // Include journal screenshot bytes: idb: refs point into this device's
    // IndexedDB, so a backup without them silently loses every screenshot.
    const images: Record<string, string> = {};
    try {
      const { isImageRef, getImage } = await import('@/utils/image-store');
      const entries = Array.isArray(raw.journalEntries) ? raw.journalEntries : [];
      for (const entry of entries) {
        for (const ref of entry?.screenshots || []) {
          if (typeof ref === 'string' && isImageRef(ref)) {
            const id = ref.slice(4);
            if (!images[id]) {
              const data = await getImage(id);
              if (data) images[id] = data;
            }
          }
        }
      }
    } catch { /* screenshots best-effort — the rest of the backup still exports */ }

    const payload: Record<string, any> = { ...raw, exportDate: new Date().toISOString(), version: '2.1' };
    if (Object.keys(images).length > 0) payload.images = images;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const coachingFocus = data.coachingFocus !== undefined ? readFocusRecords(JSON.stringify(data.coachingFocus)) : undefined;
        const writes: Promise<void>[] = [];
        if (data.trades) writes.push(userStorage.setItem('trades', JSON.stringify(data.trades)));
        if (data.accounts) writes.push(userStorage.setItem('accounts', JSON.stringify(data.accounts)));
        if (data.journalEntries) writes.push(userStorage.setItem('journalEntries', JSON.stringify(data.journalEntries)));
        if (data.tradingGoals) writes.push(userStorage.setItem('tradingGoals', JSON.stringify(data.tradingGoals)));
        if (data.riskRules) writes.push(userStorage.setItem('riskRules', JSON.stringify(data.riskRules)));
        if (data.settings) writes.push(userStorage.setItem('settings', JSON.stringify(data.settings)));
        if (data.onboarding) writes.push(userStorage.setItem('onboarding', JSON.stringify(data.onboarding)));
        if (data.onboardingCompleted !== undefined) writes.push(userStorage.setItem('onboardingCompleted', String(data.onboardingCompleted)));
        if (data.propFirmAccounts) writes.push(userStorage.setItem('propFirmAccounts', JSON.stringify(data.propFirmAccounts)));
        if (data.propFirmTransactions) writes.push(userStorage.setItem('propFirmTransactions', JSON.stringify(data.propFirmTransactions)));
        if (coachingFocus) writes.push(userStorage.setItem('coachingFocus', JSON.stringify(coachingFocus)));

        // Restore screenshot bytes bundled by v2.1 backups
        if (data.images && typeof data.images === 'object') {
          try {
            const { putImage } = await import('@/utils/image-store');
            for (const [id, dataUrl] of Object.entries(data.images)) {
              if (typeof dataUrl === 'string') writes.push(putImage(id, dataUrl));
            }
          } catch { /* IndexedDB unavailable — refs stay unresolved but data imports */ }
        }

        // Imported settings are a deliberate local choice — mark dirty so a
        // concurrent sync pull can't overwrite them before they push.
        if (data.settings && user?.uid) {
          const { markSettingsDirty } = await import('@/utils/user-storage');
          markSettingsDirty(user.uid);
        }

        // Await everything — the old fire-and-forget writes raced the reload
        // and could drop the tail of a large import.
        await Promise.all(writes);
        const count = [data.trades?.length||0, data.accounts?.length||0, data.journalEntries?.length||0, data.tradingGoals?.length||0, data.propFirmAccounts?.length||0].reduce((a,b)=>a+b,0);
        toast.success(`Imported ${count} items!`);
        setTimeout(() => window.location.reload(), 800);
      } catch { toast.error('Error importing data. Check the file format.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllData = async () => {
    if (demoGuard('manage your data')) return;
    // Pro users have a cloud copy: it MUST be cleared first, or auto-restore
    // pulls everything back on reload — while the IndexedDB screenshots we
    // deleted below are gone for good. If the cloud clear fails, abort before
    // touching anything local so the two never diverge.
    if (isPro) {
      try {
        const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
        const { httpsCallable } = await import('firebase/functions');
        const fns = await getFirebaseFunctions();
        await httpsCallable(fns, 'clearSyncData')();
      } catch {
        toast.error('Could not clear your cloud backup — nothing was deleted. Check your connection and try again.');
        return;
      }
    }
    // clearUserData enumerates every user-scoped key (the old hand-kept list
    // missed prop-firm and onboarding data); screenshots live in IndexedDB.
    userStorage.clearUserData();
    try {
      const { clearAllImages } = await import('@/utils/image-store');
      await clearAllImages();
    } catch { /* best effort */ }
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
      // Clear ALL local data — every user-scoped key plus the IndexedDB
      // screenshot store (the old key list left prop/onboarding data and
      // every screenshot behind after "delete my account").
      userStorage.clearUserData();
      try {
        const { clearAllImages } = await import('@/utils/image-store');
        await clearAllImages();
      } catch { /* best effort */ }
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

        <header className="px-4 sm:px-6 lg:px-8 py-6 border-b">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your workspace, accounts, and trading preferences.</p>
        </header>
        <div className="flex flex-col gap-5 px-4 sm:px-6 lg:px-8 py-6">
        {/* Section navigation */}
        {/* top offset = SiteHeader height (h-12 / md:h-16), which is sticky above this */}
        <div className="sticky top-12 md:top-16 z-30 bg-background border-b w-full">
          <nav aria-label="Settings sections" className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max pb-2">
              {NAV.map(({ id, label, Icon }) => {
                const isActive = activeSection === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectTab(id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-md border transition-colors whitespace-nowrap ${
                      isActive ? 'border-border bg-muted font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="min-w-0 w-full">
          <div>
            <div className="space-y-12 pb-2">

              {/* ── GENERAL ─────────────────────────────────────────────── */}
              <section
                id="general"
                aria-labelledby="settings-general"
                className="scroll-mt-40 md:scroll-mt-44 space-y-8"
              >
                  <SectionHeading id="settings-general" title="General" />

                  <div className={`grid gap-6 ${MARKET_DATA_ENABLED ? "lg:grid-cols-2 lg:[&>div]:flex lg:[&>div]:flex-col lg:[&>div>div:last-child]:flex-1" : ""}`}>
                  <SettingsGroup title="Display preferences" description="Choose the currency used to show your results.">
                    <SettingRow stacked label="Display currency" description="Used wherever P&L is shown">
                      <div className="grid grid-cols-3 gap-2">
                        {CURRENCIES.map(({ value, symbol, label }) => {
                          const isActive = (activeAccount?.currency || settings.currency) === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                updateSettings({ currency: value });
                                if (activeAccount) updateAccount(activeAccount.id, { ...activeAccount, currency: value });
                              }}
                              aria-pressed={isActive}
                              className={`rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                                isActive ? 'font-semibold border-primary/40 bg-primary/10 text-foreground' : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/40'
                              }`}
                            >
                              <span className={`font-bold mr-1 ${isActive ? 'text-primary' : ''}`}>{symbol}</span>{label}
                            </button>
                          );
                        })}
                      </div>
                    </SettingRow>
                  </SettingsGroup>

                  {MARKET_DATA_ENABLED && (
                    <SettingsGroup title="Dashboard" description="What appears in the strip at the top of your dashboard.">
                      <SettingRow label="Live market prices" description="A ticker of the symbols you trade">
                        <Switch checked={settings.showMarketPrices} onCheckedChange={(c) => updateSettings({ showMarketPrices: c })} aria-label="Live market prices" />
                      </SettingRow>
                      <SettingRow label="Macro snapshot" description="Fed funds rate, Treasury yields, CPI, and unemployment">
                        <Switch checked={settings.showMacroSnapshot} onCheckedChange={(c) => updateSettings({ showMacroSnapshot: c })} aria-label="Macro snapshot" />
                      </SettingRow>
                    </SettingsGroup>
                  )}
                  </div>
              </section>

              <section id="appearance" aria-labelledby="settings-appearance" className="scroll-mt-40 md:scroll-mt-44 space-y-6">
                <SectionHeading id="settings-appearance" title="Appearance" />
                <SettingsGroup title="Display mode" description="Choose how the app looks on this device.">
                    <SettingRow stacked label="Theme mode" description="Light, dark, or follow the system">
                      <div className="flex gap-2">
                        {([
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                          { value: 'system', label: 'System', icon: Monitor },
                        ] as const).map(({ value, label, icon: ThemeIcon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setTheme(value)}
                            aria-pressed={theme === value}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
                              theme === value ? 'font-semibold border-primary/40 bg-primary/10 text-foreground' : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/40'
                            }`}
                          >
                            <ThemeIcon aria-hidden="true" className={`h-3.5 w-3.5 ${theme === value ? 'text-primary' : ''}`} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </SettingRow>
                </SettingsGroup>
                  <SettingsGroup title="Theme & customization" description="Choose a palette, compare surfaces, or build your own.">
                    <div className="px-5 py-5 space-y-7">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                        <p className="text-xs text-muted-foreground">Preview a mode without changing your workspace.</p>
                        <div className="flex gap-1" role="group" aria-label="Theme preview mode">
                          {(['light','dark'] as const).map(mode => <Button key={mode} size="sm" variant={previewMode === mode ? 'secondary' : 'outline'} aria-pressed={previewMode === mode} onClick={() => setPreviewMode(mode)} className="capitalize">{mode}</Button>)}
                        </div>
                      </div>


                      {/* Accent themes: swap the data colors, keep the standard look */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Accent colors</p>
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
                                <div className={`flex items-center gap-2 rounded-md border p-3 ${isSelected ? 'border-foreground' : 'border-border'}`} aria-hidden="true">
                                  {[preset.colors.primary,preset.colors.profit,preset.colors.loss].map((color,i)=><span key={i} className="h-5 w-5 rounded-full border border-black/10" style={{backgroundColor:color}} />)}
                                  {isSelected && <Check className="h-3.5 w-3.5 ml-auto" />}
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
                          <p className="text-sm font-medium">Full themes</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Restyle everything, backgrounds, cards, and sidebar included</p>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                                <div className={`grid grid-cols-2 gap-2 rounded-lg p-2 border ${isSelected ? 'border-foreground' : 'border-border'}`} aria-hidden="true">
                                  {(['light','dark'] as const).map(mode => <div key={mode} className="min-w-0 space-y-1.5"><ThemeMiniPreview vars={computeThemeVars(key,customColors,mode)} fallback={PREVIEW_DEFAULTS[mode]} /><span className="block text-[10px] text-muted-foreground capitalize">{mode}</span></div>)}
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
                          <p className="text-sm font-medium">Your theme</p>
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
                                  vars={computeThemeVars('custom', customColors, previewMode)}
                                  fallback={PREVIEW_DEFAULTS[previewMode]}
                                  style={isSelected ? { boxShadow: `0 0 0 2px ${customColors.primary}` } : undefined}
                                />
                              </div>
                              <span className={`mt-2 block text-xs truncate transition-colors ${isSelected ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground group-hover:text-foreground'}`}>Custom</span>
                            </div>
                          );
                        })()}

                        {currentTheme === 'custom' && (
                          <div className="pt-5 border-t border-border/60 space-y-5">
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
                                          <Input aria-label={`${label} color hex code`} value={customColors[key]} maxLength={7} className="h-8 font-mono text-sm uppercase" onChange={(e) => {
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
                  </SettingsGroup>

              </section>

              {/* ── ACCOUNTS ────────────────────────────────────────────── */}
              <section
                id="accounts"
                aria-labelledby="settings-accounts"
                className="scroll-mt-40 md:scroll-mt-44 space-y-8"
              >
                  <SectionHeading id="settings-accounts" title="Accounts" />

                  <SettingsGroup title="Trading accounts" description="Each account keeps its own trades, so performance is tracked separately.">
                    {accounts.map((account) => (
                      <div key={account.id}>
                        {editForm?.id === account.id ? (
                          <div className="px-5 py-5 space-y-4">
                            <p className="text-sm font-semibold">Edit account</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="edit-account-name" className="text-xs">Account name</Label>
                                <Input id="edit-account-name" placeholder="e.g. Main Live Account" value={editForm.name} onChange={(e) => setEditForm(p => p ? { ...p, name: e.target.value } : null)} />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Account type</Label>
                                <Select value={editForm.type} onValueChange={(v: TradingAccount['type']) => setEditForm(p => p ? { ...p, type: v } : null)}>
                                  <SelectTrigger aria-label="Account type"><SelectValue /></SelectTrigger>
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
                                  <SelectTrigger aria-label="Currency"><SelectValue /></SelectTrigger>
                                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Broker time zone (CSV import)</Label>
                                <Select value={editForm.brokerTimezone || 'device'} onValueChange={(v) => setEditForm(p => p ? { ...p, brokerTimezone: v === 'device' ? undefined : v } : null)}>
                                  <SelectTrigger aria-label="Broker time zone (CSV import)"><SelectValue /></SelectTrigger>
                                  <SelectContent>{BROKER_TIMEZONES.map(z => <SelectItem key={z.value || 'device'} value={z.value || 'device'}>{z.label}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Balance (optional)</Label>
                                <UnitInput aria-label="Balance (optional)" prefix={getSymbolForCurrency(editForm.currency)} placeholder="10000" value={editForm.balance ?? ''} onChange={(e) => setEditForm(p => p ? { ...p, balance: parseNumberInput(e.target.value) } : null)} />
                              </div>
                              <div className="flex items-center gap-2 pt-5">
                                <Switch aria-label="Set as default account" checked={editForm.isDefault} onCheckedChange={(c) => setEditForm(p => p ? { ...p, isDefault: c } : null)} />
                                <Label className="text-xs">Set as default</Label>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <Button size="sm" onClick={() => { if (editForm.name && editForm.broker) { updateAccount(editForm.id, editForm); if (activeAccount && editForm.id === activeAccount.id && editForm.currency !== settings.currency) updateSettings({ currency: editForm.currency }); setEditForm(null); } }} disabled={!editForm.name || !editForm.broker} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText || '#fff' }}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditForm(null)}>Cancel</Button>
                              {(!editForm.name || !editForm.broker) && (
                                <span className="text-[11px] text-muted-foreground">{!editForm.name ? 'Enter an account name' : 'Pick a broker'} to save</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_17rem] items-center gap-4 px-5 py-5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold">{account.name}</span>
                                {activeAccount?.id === account.id && <Badge variant="secondary" className="gap-1 text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-primary" />In use</Badge>}
                                {account.isDefault && <Badge variant="outline" className="text-[10px]">Default</Badge>}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground capitalize">{account.type.replace('-', ' ')}</p>
                            </div>
                            <dl className="grid grid-cols-2 gap-5 text-sm">
                              <div><dt className="text-xs text-muted-foreground">Broker</dt><dd className="mt-1 break-words">{account.broker || 'Not specified'}</dd></div>
                              <div><dt className="text-xs text-muted-foreground">Currency / balance</dt><dd className="mt-1 tabular-nums">{account.currency}{account.balance ? ` · ${formatCurrency(account.balance, false)}` : ''}</dd></div>
                            </dl>
                            <div className="flex items-center gap-2 flex-wrap xl:justify-end">
                              {!account.isDefault && <Button variant="ghost" size="sm" onClick={() => updateAccount(account.id, { isDefault: true })}>Set default</Button>}
                              <Button variant="outline" size="sm" onClick={() => setEditForm(account)}><PencilSimple className="h-3.5 w-3.5" /> Edit</Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteAccountId(account.id)} disabled={accounts.length <= 1}>Delete</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {showAddAccount && (
                      <div className="px-5 py-5 space-y-4">
                        <p className="text-sm font-semibold">Add account</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="new-account-name" className="text-xs">Account name</Label>
                            <Input id="new-account-name" placeholder="e.g. Main Live Account" value={accountForm.name} onChange={(e) => setAccountForm(p => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Account type</Label>
                            <Select value={accountForm.type} onValueChange={(v: TradingAccount['type']) => setAccountForm(p => ({ ...p, type: v }))}>
                              <SelectTrigger aria-label="Account type"><SelectValue /></SelectTrigger>
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
                              <SelectTrigger aria-label="Currency"><SelectValue /></SelectTrigger>
                              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Broker time zone (CSV import)</Label>
                            <Select value={accountForm.brokerTimezone || 'device'} onValueChange={(v) => setAccountForm(p => ({ ...p, brokerTimezone: v === 'device' ? '' : v }))}>
                              <SelectTrigger aria-label="Broker time zone (CSV import)"><SelectValue /></SelectTrigger>
                              <SelectContent>{BROKER_TIMEZONES.map(z => <SelectItem key={z.value || 'device'} value={z.value || 'device'}>{z.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Initial balance (optional)</Label>
                            <UnitInput aria-label="Initial balance (optional)" prefix={getSymbolForCurrency(accountForm.currency)} placeholder="10000" value={accountForm.balance} onChange={(e) => setAccountForm(p => ({ ...p, balance: e.target.value }))} />
                          </div>
                          <div className="flex items-center gap-2 pt-5">
                            <Switch aria-label="Set as default account" checked={accountForm.isDefault} onCheckedChange={(c) => setAccountForm(p => ({ ...p, isDefault: c }))} />
                            <Label className="text-xs">Set as default</Label>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" onClick={() => { if (demoGuard('add accounts')) return; if (accountForm.name && accountForm.broker) { addAccount({ ...accountForm, balance: parseNumberInput(accountForm.balance), brokerTimezone: accountForm.brokerTimezone || undefined }); setAccountForm({ name:'',type:'demo',broker:'',currency:'USD',balance:'',isDefault:false,brokerTimezone:'' }); setShowAddAccount(false); } }} disabled={!accountForm.name || !accountForm.broker} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText || '#fff' }}>Add Account</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowAddAccount(false)}>Cancel</Button>
                          {(!accountForm.name || !accountForm.broker) && (
                            <span className="text-[11px] text-muted-foreground">{!accountForm.name ? 'Enter an account name' : 'Pick a broker'} to add</span>
                          )}
                        </div>
                      </div>
                    )}

                    {!showAddAccount && !editForm && (
                      !isPro && accounts.length >= FREE_TRADING_ACCOUNT_LIMIT ? (
                        <Link
                          to="/pricing"
                          onClick={() => trackEvent('pro_gate_cta_clicked', { feature: 'Multiple Accounts' })}
                          className="flex w-full items-center gap-2 px-5 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                        >
                          <Lock className="h-4 w-4" />
                          Upgrade to Pro for unlimited accounts
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddAccount(true)}
                          className="flex w-full items-center gap-2 px-5 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Add account
                        </button>
                      )
                    )}
                  </SettingsGroup>
              </section>

              {/* ── RISK ────────────────────────────────────────────────── */}
              <section
                id="risk"
                aria-labelledby="settings-risk"
                className="scroll-mt-40 md:scroll-mt-44 space-y-8"
              >
                  <SectionHeading id="settings-risk" title="Risk" />

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <h3 className="text-sm font-semibold">Position sizing</h3>
                      <p className="text-xs text-muted-foreground">How much of the account one trade may put at risk.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Inputs */}
                      <div className="lg:col-span-2 grid sm:grid-cols-2 rounded-xl border border-border/70 bg-card overflow-hidden">
                        <div className="p-5 flex flex-col gap-4">
                          <div className="shrink-0">
                            <p className="text-sm font-medium">Risk per trade</p>
                            <p className="text-xs text-muted-foreground mt-0.5">% of the account per trade</p>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="relative w-full">
                              <Input aria-label="Risk per trade (%)" type="number" name="riskPerTrade" inputMode="decimal" autoComplete="off" step="0.1" min="0.1" max="10" value={settings.riskPerTrade} onChange={(e) => updateSettings({ riskPerTrade: parseFloat(e.target.value) || 0 })} className="h-9 pr-7" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                            </div>
                            <div className="flex items-center gap-2 w-full">
                              <Progress className="h-1 flex-1" value={(settings.riskPerTrade / 5) * 100} indicatorColor={settings.riskPerTrade <= 2 ? themeColors.profit : settings.riskPerTrade <= 4 ? themeColors.primary : themeColors.loss} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {settings.riskPerTrade <= 2 ? 'Conservative, the usual recommendation' : settings.riskPerTrade <= 4 ? 'Moderate' : 'High risk'}
                            </p>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                          <div className="shrink-0">
                            <p className="text-sm font-medium">Account size</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Total trading capital</p>
                          </div>
                          <div className="flex-1">
                            <div className="relative w-full">
                              <Input aria-label="Default account size" type="number" name="accountSize" inputMode="decimal" autoComplete="off" step="1000" value={settings.accountSize} onChange={(e) => updateSettings({ accountSize: parseFloat(e.target.value) || 0 })} placeholder="10000" className="h-9 pl-6" />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{getCurrencySymbol()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calculator: plain figures, no tiles */}
                      <div className="rounded-xl border border-border/70 bg-card overflow-hidden flex flex-col">
                        <div className="px-5 pt-4 pb-3">
                          <p className="text-sm font-medium">Your risk amount</p>
                        </div>
                        <dl className="px-5 pb-4 divide-y divide-border/50 flex-1">
                          {[
                            { label: 'Max risk per trade', value: formatCurrency((settings.accountSize * settings.riskPerTrade) / 100, false), emphasis: true },
                            { label: 'Account balance', value: formatCurrency(settings.accountSize, false) },
                            { label: 'Losing trades to zero', value: settings.riskPerTrade > 0 ? String(Math.round(100 / settings.riskPerTrade)) : '—' },
                          ].map(({ label, value, emphasis }) => (
                            <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
                              <dt className="text-xs text-muted-foreground">{label}</dt>
                              <dd className={`tabular-nums ${emphasis ? 'text-2xl font-semibold tracking-tight' : 'text-sm font-medium'}`}>{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  </div>

                  <SettingsGroup title="Guidelines" description="A reference for picking a risk level.">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="guidelines" className="border-0">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                          <span className="text-sm font-medium">How much to risk per trade</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5 space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { label: 'Conservative', range: '1–2%', color: themeColors.profit, desc: 'Beginners, steady growth' },
                              { label: 'Moderate', range: '2–3%', color: themeColors.primary, desc: 'Experienced traders' },
                              { label: 'Aggressive', range: '3–5%', color: themeColors.loss, desc: 'Proven systems only' },
                              { label: 'Dangerous', range: '5%+', color: themeColors.loss, desc: 'High blow-up risk' },
                            ].map(({ label, range, color, desc }) => (
                              <div key={label} className="rounded-lg p-3 bg-muted/40">
                                <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                                <p className="text-base font-bold mt-1">{range}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                              </div>
                            ))}
                          </div>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {['Never risk more than you can afford to lose', 'Always use stop losses on every trade', 'Keep risk consistent across all trades', 'Size positions based on distance to stop loss'].map(tip => (
                              <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-profit" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </SettingsGroup>
              </section>

              {/* ── DATA ────────────────────────────────────────────────── */}
              <section
                id="data"
                aria-labelledby="settings-data"
                className="scroll-mt-40 md:scroll-mt-44 space-y-8"
              >
                  <SectionHeading id="settings-data" title="Data & privacy" />

                  <SettingsGroup title="Backup" description="Export a copy of everything, or restore from one.">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50 [&>div]:!flex-col [&>div]:!items-start [&>div]:!gap-4">
                    <SettingRow label="Export" description="Download everything as a JSON file, screenshots included">
                      <Button variant="outline" size="sm" onClick={exportData}>
                        <DownloadSimple className="mr-2 h-3.5 w-3.5" />
                        Export data
                      </Button>
                    </SettingRow>
                    <SettingRow label="Restore" description="Import a backup file. Replaces what is on this device">
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('import-data')?.click()}>
                        <UploadSimple className="mr-2 h-3.5 w-3.5" />
                        Import data
                      </Button>
                      <input id="import-data" type="file" accept=".json" className="hidden" onChange={importData} />
                    </SettingRow>
                    </div>
                    <SettingRow label="Storage used" description={`${storageUsed.mb} MB of about 10 MB on this device`}>
                      <div className="w-full sm:w-44">
                        <Progress className="h-1" value={storageUsed.pct} indicatorColor={storageUsed.pct > 80 ? themeColors.loss : themeColors.profit} />
                      </div>
                    </SettingRow>
                    {!isPro && needsBackup && (
                      <SettingRow label={lastBackup ? `Last backup ${daysSince} days ago` : 'No backup yet'} description="Free plan data lives on this device only. Back up regularly.">
                        <Button size="sm" variant="outline" onClick={exportData}>Back up now</Button>
                      </SettingRow>
                    )}
                    {!isPro && (
                      <SettingRow label="Automatic cloud backup" description="Pro syncs your data across every device">
                        <Link to="/pricing"><Button size="sm" variant="outline">Upgrade to Pro</Button></Link>
                      </SettingRow>
                    )}
                  </SettingsGroup>

                  <div className="grid lg:grid-cols-2 gap-5 lg:[&>div]:flex lg:[&>div]:flex-col lg:[&>div>div:last-child]:flex-1 lg:[&>div>div:last-child]:flex lg:[&>div>div:last-child]:items-center lg:[&>div>div:last-child>div]:w-full [&_button]:whitespace-normal">
                  <SettingsGroup title="Privacy" description="What this site is allowed to remember about you.">
                    <SettingRow label="Cookie preferences" description="Choose whether optional analytics cookies are set">
                      <Button variant="outline" size="sm" onClick={openCookieSettings}>
                        <Cookie className="mr-2 h-3.5 w-3.5" />
                        Manage cookies
                      </Button>
                    </SettingRow>
                  </SettingsGroup>

                  <SettingsGroup title="Danger zone" description="Permanent actions. There is no undo.">
                    {user && !isDemo ? (
                      <SettingRow label="Delete my account" description="Removes your account, all data, and any active subscription. Cannot be undone.">
                        <Button variant="destructive" size="sm" onClick={() => setShowDeleteAccountConfirm(true)}>Delete account</Button>
                      </SettingRow>
                    ) : (
                      <SettingRow label="Delete all data" description="Removes every trade, journal entry, goal, and setting. Cannot be undone.">
                        <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>Delete all data</Button>
                      </SettingRow>
                    )}
                  </SettingsGroup>
                  </div>
              </section>

              {/* ── NOTIFICATIONS ─────────────────────────────────────── */}
              <section
                id="notifications"
                aria-labelledby="settings-notifications"
                className="scroll-mt-40 md:scroll-mt-44 space-y-8"
              >
                  <SectionHeading id="settings-notifications" title="Notifications" />
                  <div className="grid lg:grid-cols-[1fr_2fr] gap-5 items-start">
                    <div><h3 className="text-sm font-semibold">On this device</h3><p className="text-xs text-muted-foreground mt-1">Choose whether to receive reminders to log your trades.</p></div>
                    <div className="rounded-xl border border-border/70 bg-card overflow-hidden"><PushNotificationPrompt /></div>
                  </div>
              </section>

              {/* ── SUBSCRIPTION ────────────────────────────────────────── */}
              <section
                id="subscription"
                aria-labelledby="settings-subscription"
                className="scroll-mt-40 md:scroll-mt-44 space-y-8"
              >
                  <SectionHeading id="settings-subscription" title="Subscription" />

                  <div className="grid xl:grid-cols-2 gap-6 xl:[&>div]:flex xl:[&>div]:flex-col xl:[&>div>div:last-child]:flex-1">
                  <SettingsGroup title="Plan" description="Your current plan, billing, and sync status.">
                    {isPro ? (
                      <>
                        <SettingRow
                          label={<span className="flex items-center gap-2"><ProBadge variant={isDev ? 'dev' : 'pro'} /><span className="capitalize">{isDev ? 'Developer account' : trialEndsAt ? 'Free trial' : subscription ? `${subscription.planType} plan` : 'Pro'}</span></span>}
                          description={
                            trialEndsAt
                              ? `Trial ends ${new Date(trialEndsAt).toLocaleDateString()}. No card on file, nothing is charged.`
                              : !trialEndsAt && subscription?.currentPeriodEnd && subscription.planType !== 'lifetime'
                                ? `${subscription.status === 'cancelled' ? 'Access until' : subscription.status === 'on_trial' ? 'Trial ends' : 'Renews'} ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                                : undefined
                          }
                        >
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 capitalize">
                            {isDev ? 'Active' : trialEndsAt || subscription?.status === 'on_trial' ? 'Trial' : subscription?.status || 'Active'}
                          </Badge>
                        </SettingRow>
                        {trialEndsAt && (
                          <SettingRow label="Keep Pro after the trial" description="Pick a plan now so nothing changes when the trial ends">
                            <Button size="sm" className="font-semibold" onClick={() => navigate('/pricing')}>
                              <Crown className="mr-2 h-3.5 w-3.5" />
                              Keep Pro
                            </Button>
                          </SettingRow>
                        )}
                        {subscription?.stripeCustomerId && (
                          <SettingRow label="Billing" description="Update your card, download invoices, or cancel">
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
                              ) : 'Manage subscription'}
                            </Button>
                          </SettingRow>
                        )}
                        <SettingRow label="Cloud sync" description={lastSyncTime ? `Last synced ${new Date(lastSyncTime).toLocaleTimeString()}` : 'Your trades sync automatically across all devices'}>
                          <span className="flex items-center gap-2 text-sm">
                            <span className={`h-2 w-2 rounded-full shrink-0${syncStatus === 'syncing' ? ' animate-pulse' : ''}`} style={{ backgroundColor: syncStatus === 'synced' ? themeColors.profit : syncStatus === 'syncing' ? themeColors.primary : syncStatus === 'error' ? themeColors.loss : 'hsl(var(--muted-foreground) / 0.4)' }} />
                            <span className="capitalize">{syncStatus === 'idle' ? 'Not connected' : syncStatus}</span>
                          </span>
                        </SettingRow>
                      </>
                    ) : (
                      <>
                        <SettingRow label="Free plan" description="Everything on this device, with the free limits">
                          <Button size="sm" className="font-semibold" onClick={() => navigate('/pricing')}>
                            <Crown className="mr-2 h-3.5 w-3.5" />
                            Upgrade to Pro
                          </Button>
                        </SettingRow>
                        <div className="px-5 py-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Pro unlocks</p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                            {PRO_FEATURES.map(f => (
                              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </SettingsGroup>

                  {!isDemo && (
                    <SettingsGroup title="Referrals" description="Invite other traders and earn Pro time.">
                      <div className="px-5 py-4">
                        <ReferralCard />
                      </div>
                    </SettingsGroup>
                  )}
                  </div>
              </section>

            </div>
          </div>
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
