import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts, type TradingAccount } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { DEFAULT_VALUES } from '@/constants/trading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faCheck,
  faDownload,
  faTrash,
  faUpload,
  faShield,
  faChartLine,
  faDatabase,
  faPalette,
  faSun,
  faMoon,
  faDesktop,
  faDollarSign,
  faGlobe,
  faClock,
  faCoins,
  faMoneyBill,
  faEuroSign,
  faPoundSign,
  faYenSign,
  faCalculator,
  faBuilding,
  faPencil,
  faTrophy,
  faFire,
  faArrowTrendUp,
  faArrowTrendDown,
  faPercent,
  faMedal,
  faChartSimple,
  faCrown,
  faCloud
} from '@fortawesome/free-solid-svg-icons';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { useProStatus } from '@/contexts/pro-context';
import { useSync } from '@/contexts/sync-context';
import { ProBadge } from '@/components/pro-badge';
import { FREE_FEATURES, PRO_FEATURES } from '@/constants/pricing';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { currentTheme, setTheme: setColorTheme, availableThemes, themeColors, alpha, setCustomColors, customColors } = useThemePresets();
  const { logout, user } = useAuth();
  const { accounts, activeAccount, addAccount, updateAccount, deleteAccount } = useAccounts();
  const { settings, updateSettings, formatCurrency, getCurrencySymbol } = useSettings();
  const userStorage = useUserStorage();
  const { isPro, subscription } = useProStatus();
  const { syncStatus, lastSyncTime } = useSync();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'general');
  const [showProWelcome, setShowProWelcome] = useState(false);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setActiveTab('subscription');
      setShowProWelcome(true);
      toast.success('Welcome to Pro! Your upgrade is complete.');
      // Clear the query params so refresh doesn't re-trigger
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'demo' as TradingAccount['type'],
    broker: '',
    currency: 'USD',
    balance: '',
    isDefault: false
  });
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TradingAccount | null>(null);

  // No need to load settings from localStorage anymore - using context

  const saveSettings = () => {
    // Settings are automatically saved via context
    toast.success('Settings saved!');
  };

  const getTradeStats = () => {
    const trades = JSON.parse(userStorage.getItem('trades') || '[]')
      .filter((t: any) => !activeAccount || t.accountId === activeAccount.id || (!t.accountId && activeAccount.id.includes('default')));
    
    const now = new Date();
    const thisMonth = trades.filter((t: any) => {
      const tradeDate = new Date(t.exitTime);
      return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
    });
    
    const winningTrades = trades.filter((t: any) => t.pnl > 0);
    const losingTrades = trades.filter((t: any) => t.pnl < 0);
    
    const totalPnL = trades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    const monthlyPnL = thisMonth.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum: number, t: any) => sum + t.pnl, 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum: number, t: any) => sum + t.pnl, 0) / losingTrades.length)
      : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
    
    // Calculate best and worst trades
    const bestTrade = trades.length > 0 
      ? Math.max(...trades.map((t: any) => t.pnl || 0))
      : 0;
    const worstTrade = trades.length > 0 
      ? Math.min(...trades.map((t: any) => t.pnl || 0))
      : 0;
    
    // Calculate streak
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    
    const sortedTrades = [...trades].sort((a: any, b: any) => 
      new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime()
    );
    
    for (const trade of sortedTrades) {
      if (trade.pnl > 0) {
        tempWinStreak++;
        tempLossStreak = 0;
        if (currentStreak >= 0) currentStreak++;
        else currentStreak = 1;
        maxWinStreak = Math.max(maxWinStreak, tempWinStreak);
      } else if (trade.pnl < 0) {
        tempLossStreak++;
        tempWinStreak = 0;
        if (currentStreak <= 0) currentStreak--;
        else currentStreak = -1;
        maxLossStreak = Math.max(maxLossStreak, tempLossStreak);
      }
    }
    
    return {
      total: trades.length,
      thisMonth: thisMonth.length,
      totalPnL,
      monthlyPnL,
      winRate,
      wins: winningTrades.length,
      losses: losingTrades.length,
      avgWin,
      avgLoss,
      profitFactor,
      bestTrade,
      worstTrade,
      currentStreak,
      maxWinStreak,
      maxLossStreak,
      accountName: activeAccount?.name || 'All Accounts'
    };
  };

  const stats = getTradeStats();

  const exportData = () => {
    // Export ALL data (not just trades + settings)
    const trades = userStorage.getItem('trades') || '[]';
    const accounts = userStorage.getItem('accounts') || '[]';
    const journalEntries = userStorage.getItem('journalEntries') || '[]';
    const goals = userStorage.getItem('goals') || '[]';
    const riskRules = userStorage.getItem('riskRules') || '[]';
    const settings = userStorage.getItem('settings') || '{}';
    const onboarding = userStorage.getItem('onboarding') || '{}';
    const onboardingCompleted = userStorage.getItem('onboardingCompleted') || 'false';

    const data = {
      trades: JSON.parse(trades),
      accounts: JSON.parse(accounts),
      journalEntries: JSON.parse(journalEntries),
      goals: JSON.parse(goals),
      riskRules: JSON.parse(riskRules),
      settings: JSON.parse(settings),
      onboarding: JSON.parse(onboarding),
      onboardingCompleted: onboardingCompleted === 'true',
      exportDate: new Date().toISOString(),
      version: '2.0', // Mark new export format
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ftj_backup_${new Date().toISOString().split('T')[0]}.json`);
    a.click();

    // Track last backup date
    userStorage.setItem('lastBackupDate', new Date().toISOString());
    toast.success('Full backup exported successfully!');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Import all available data fields
        if (data.trades) {
          userStorage.setItem('trades', JSON.stringify(data.trades));
        }
        if (data.accounts) {
          userStorage.setItem('accounts', JSON.stringify(data.accounts));
        }
        if (data.journalEntries) {
          userStorage.setItem('journalEntries', JSON.stringify(data.journalEntries));
        }
        if (data.goals) {
          userStorage.setItem('goals', JSON.stringify(data.goals));
        }
        if (data.riskRules) {
          userStorage.setItem('riskRules', JSON.stringify(data.riskRules));
        }
        if (data.settings) {
          userStorage.setItem('settings', JSON.stringify(data.settings));
        }
        if (data.onboarding) {
          userStorage.setItem('onboarding', JSON.stringify(data.onboarding));
        }
        if (data.onboardingCompleted !== undefined) {
          userStorage.setItem('onboardingCompleted', String(data.onboardingCompleted));
        }

        const itemCount = [
          data.trades?.length || 0,
          data.accounts?.length || 0,
          data.journalEntries?.length || 0,
          data.goals?.length || 0,
        ].reduce((a, b) => a + b, 0);

        toast.success(`Successfully imported ${itemCount} items!`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Error importing data:', error);
        toast.error('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      userStorage.removeItem('trades');
      userStorage.removeItem('journalEntries');
      userStorage.removeItem('goals');
      userStorage.removeItem('accounts');
      userStorage.removeItem('settings');
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <SiteHeader />
      {/* Frosted Glass Header */}
      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-4" style={{maxWidth: '1200px', margin: '0 auto'}}>
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>
                Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Personalize your trading experience and manage your preferences
              </p>
            </div>
            <div className="flex gap-3">
              <Badge
                variant="outline"
                className="px-3 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: `${alpha(themeColors.profit, '12')}`,
                  color: themeColors.profit,
                  borderColor: `${alpha(themeColors.profit, '30')}`
                }}>
                <FontAwesomeIcon icon={faChartLine} className="mr-1.5 h-3 w-3" />
                {stats.total} Trades
              </Badge>
              <Badge
                variant="outline"
                className="px-3 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: `${alpha(themeColors.primary, '12')}`,
                  color: themeColors.primary,
                  borderColor: `${alpha(themeColors.primary, '30')}`
                }}>
                <FontAwesomeIcon icon={faClock} className="mr-1.5 h-3 w-3" />
                {stats.thisMonth} This Month
              </Badge>
            </div>
          </div>
        </div>
      </div>

        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 mx-auto" style={{maxWidth: '1200px'}}>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 h-auto p-1.5 bg-muted/30 backdrop-blur-sm rounded-xl border-0">
              <TabsTrigger value="general" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-shadow data-[state=active]:bg-background data-[state=active]:shadow-md hover:bg-background/50">
                <FontAwesomeIcon icon={faPalette} className="h-3.5 w-3.5" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-shadow data-[state=active]:bg-background data-[state=active]:shadow-md hover:bg-background/50">
                <FontAwesomeIcon icon={faBuilding} className="h-3.5 w-3.5" />
                <span>Accounts</span>
              </TabsTrigger>
              <TabsTrigger value="trading" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-shadow data-[state=active]:bg-background data-[state=active]:shadow-md hover:bg-background/50">
                <FontAwesomeIcon icon={faChartLine} className="h-3.5 w-3.5" />
                <span>Trading</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-shadow data-[state=active]:bg-background data-[state=active]:shadow-md hover:bg-background/50">
                <FontAwesomeIcon icon={faShield} className="h-3.5 w-3.5" />
                <span>Risk</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-shadow data-[state=active]:bg-background data-[state=active]:shadow-md hover:bg-background/50">
                <FontAwesomeIcon icon={faDatabase} className="h-3.5 w-3.5" />
                <span>Data</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-shadow data-[state=active]:bg-background data-[state=active]:shadow-md hover:bg-background/50">
                <FontAwesomeIcon icon={faCrown} className="h-3.5 w-3.5" />
                <span>Subscription</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <div className="space-y-6">
                {/* Section Label */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg shadow-sm" style={{ backgroundColor: `${alpha(themeColors.primary, '20')}` }}>
                    <FontAwesomeIcon icon={faPalette} className="h-4 w-4" style={{ color: themeColors.primary }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Appearance & Localization</h3>
                    <p className="text-xs text-muted-foreground">Customize your trading journal experience</p>
                  </div>
                </div>

                {/* Enhanced Theme & Regional Settings */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Theme Settings Card */}
                  <Card className="xl:col-span-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FontAwesomeIcon icon={faSun} className="h-4 w-4" style={{ color: themeColors.primary }} />
                        Theme & Display
                      </CardTitle>
                      <CardDescription>
                        Control your visual experience and display preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label className="flex items-center gap-2 text-base font-bold">
                            <FontAwesomeIcon icon={faSun} className="h-4 w-4" style={{ color: themeColors.primary }} />
                            Theme Mode
                          </Label>
                          <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger className="h-11 bg-background/60 border-border/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon icon={faSun} className="h-4 w-4 text-yellow-500" />
                                  <span>Light Mode</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon icon={faMoon} className="h-4 w-4 text-blue-400" />
                                  <span>Dark Mode</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="system">
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon icon={faDesktop} className="h-4 w-4 text-muted-foreground" />
                                  <span>System Default</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                      </div>
                    </CardContent>
                  </Card>

                  {/* Regional Settings Card */}
                  <Card className="">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" style={{ color: themeColors.primary }} />
                        Regional Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-sm font-semibold">
                          <FontAwesomeIcon icon={faDollarSign} className="h-3 w-3" style={{ color: themeColors.profit }} />
                          Currency
                        </Label>
                        <Select value={activeAccount?.currency || settings.currency} onValueChange={(value) => {
                          updateSettings({ currency: value });
                          if (activeAccount) {
                            updateAccount(activeAccount.id, { ...activeAccount, currency: value });
                          }
                        }}>
                          <SelectTrigger className="h-11 bg-background/60 border-border/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4" />
                                USD ($)
                              </div>
                            </SelectItem>
                            <SelectItem value="EUR">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faEuroSign} className="h-4 w-4" />
                                EUR (€)
                              </div>
                            </SelectItem>
                            <SelectItem value="GBP">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faPoundSign} className="h-4 w-4" />
                                GBP (£)
                              </div>
                            </SelectItem>
                            <SelectItem value="JPY">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faYenSign} className="h-4 w-4" />
                                JPY (¥)
                              </div>
                            </SelectItem>
                            <SelectItem value="CAD">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4" />
                                CAD ($)
                              </div>
                            </SelectItem>
                            <SelectItem value="AUD">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4" />
                                AUD ($)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Default currency for P&L calculations
                        </p>
                      </div>

                    </CardContent>
                  </Card>
                </div>

                {/* Color Theme Selection */}
                <Card className="">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FontAwesomeIcon icon={faPalette} className="h-4 w-4" style={{ color: themeColors.primary }} />
                      Color Themes
                    </CardTitle>
                    <CardDescription>
                      Sets the colors for profit, loss, and UI accent across the app
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-3">
                      {Object.entries(availableThemes).map(([key, preset]) => {
                        const isSelected = currentTheme === key;
                        return (
                          <div
                            key={key}
                            onClick={() => setColorTheme(key)}
                            tabIndex={0}
                            role="button"
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setColorTheme(key); } }}
                            className="relative rounded-lg border-2 p-3 cursor-pointer transition-shadow duration-150 hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            style={{
                              borderColor: isSelected ? preset.colors.primary : 'hsl(var(--border))',
                              backgroundColor: isSelected ? `${preset.colors.primary}08` : 'transparent',
                            }}
                          >
                            {/* Color bar — three swatches side by side */}
                            <div className="flex rounded-md overflow-hidden h-3 mb-2.5">
                              <div className="flex-1" style={{ backgroundColor: preset.colors.profit }} />
                              <div className="flex-1" style={{ backgroundColor: preset.colors.primary }} />
                              <div className="flex-1" style={{ backgroundColor: preset.colors.loss }} />
                            </div>

                            {/* Name + check */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-foreground truncate">{preset.name}</span>
                              {isSelected && (
                                <FontAwesomeIcon icon={faCheck} className="h-3 w-3 flex-shrink-0" style={{ color: preset.colors.primary }} />
                              )}
                            </div>

                            {/* Labels under swatches */}
                            <div className="flex mt-1.5 text-[10px] text-muted-foreground">
                              <span className="flex-1">Profit</span>
                              <span className="flex-1 text-center">Accent</span>
                              <span className="flex-1 text-right">Loss</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Color Pickers — inline when "custom" theme is selected */}
                    {currentTheme === 'custom' && (
                      <>
                        <Separator className="my-5" />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faPalette} className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                            <span className="text-sm font-semibold">Pick your colors</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {([
                              { key: 'primary' as const, label: 'Accent' },
                              { key: 'profit' as const, label: 'Profit' },
                              { key: 'loss' as const, label: 'Loss' },
                            ]).map(({ key, label }) => (
                              <div key={key} className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex items-center gap-2.5 w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                      <div
                                        className="h-5 w-5 rounded-md border shadow-sm shrink-0"
                                        style={{ backgroundColor: customColors[key] }}
                                      />
                                      <span className="uppercase tracking-wide text-xs text-muted-foreground flex-1 text-left">
                                        {customColors[key]}
                                      </span>
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-3 space-y-3" align="start">
                                    <HexColorPicker
                                      color={customColors[key]}
                                      onChange={(color) => setCustomColors({ [key]: color })}
                                    />
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-8 w-8 rounded-md border shadow-sm shrink-0"
                                        style={{ backgroundColor: customColors[key] }}
                                      />
                                      <Input
                                        value={customColors[key]}
                                        maxLength={7}
                                        className="h-8 font-mono text-sm uppercase"
                                        onChange={(e) => {
                                          let v = e.target.value
                                          if (!v.startsWith('#')) v = '#' + v
                                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                                            if (v.length === 7) {
                                              setCustomColors({ [key]: v.toLowerCase() })
                                            }
                                          }
                                        }}
                                      />
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            <TabsContent value="accounts" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg shadow-sm" style={{ backgroundColor: `${alpha(themeColors.primary, '20')}` }}>
                    <FontAwesomeIcon icon={faBuilding} className="h-4 w-4" style={{ color: themeColors.primary }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Trading Accounts</h3>
                    <p className="text-xs text-muted-foreground">Manage your accounts to track performance separately</p>
                  </div>
                </div>

                <Card className="">
                  <CardContent className="space-y-6 pt-6">
                    {/* Enhanced Account List */}
                    <div className="grid gap-4">
                      {accounts.map((account, index) => (
                        <div key={account.id}>
                          {editForm?.id === account.id ? (
                            /* Inline Edit Form - replaces the card */
                            <div className="rounded-xl bg-background/60 p-5"
                                 style={{ border: `1px solid ${alpha(themeColors.primary, '30')}` }}>
                              <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: `${alpha(themeColors.primary, '20')}` }}>
                                  <FontAwesomeIcon icon={faPencil} className="h-4 w-4" style={{ color: themeColors.primary }} />
                                </div>
                                <h4 className="text-base font-semibold">Edit Account</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Account Name</Label>
                                  <Input
                                    placeholder="e.g., Main Live Account…"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Account Type</Label>
                                  <Select value={editForm.type} onValueChange={(value: TradingAccount['type']) => setEditForm(prev => prev ? { ...prev, type: value } : null)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="demo">Demo Account</SelectItem>
                                      <SelectItem value="live">Live Account</SelectItem>
                                      <SelectItem value="prop-firm">Prop Firm</SelectItem>
                                      <SelectItem value="paper">Paper Trading</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Broker</Label>
                                  <Select value={editForm.broker} onValueChange={(value) => setEditForm(prev => prev ? { ...prev, broker: value } : null)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select broker..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="OANDA">OANDA</SelectItem>
                                      <SelectItem value="IC Markets">IC Markets</SelectItem>
                                      <SelectItem value="MetaTrader 4">MetaTrader 4</SelectItem>
                                      <SelectItem value="MetaTrader 5">MetaTrader 5</SelectItem>
                                      <SelectItem value="Pepperstone">Pepperstone</SelectItem>
                                      <SelectItem value="IG">IG</SelectItem>
                                      <SelectItem value="Interactive Brokers">Interactive Brokers</SelectItem>
                                      <SelectItem value="FTMO">FTMO</SelectItem>
                                      <SelectItem value="The5ers">The5ers</SelectItem>
                                      <SelectItem value="Apex Trader Funding">Apex Trader Funding</SelectItem>
                                      <SelectItem value="E8 Markets">E8 Markets</SelectItem>
                                      <SelectItem value="Topfutures Funded">Topfutures Funded</SelectItem>
                                      <SelectItem value="FundedNext">FundedNext</SelectItem>
                                      <SelectItem value="Lux Trading Firm">Lux Trading Firm</SelectItem>
                                      <SelectItem value="NinjaTrader">NinjaTrader</SelectItem>
                                      <SelectItem value="TradingView">TradingView</SelectItem>
                                      <SelectItem value="Tradovate">Tradovate</SelectItem>
                                      <SelectItem value="AMP Futures">AMP Futures</SelectItem>
                                      <SelectItem value="Discount Trading">Discount Trading</SelectItem>
                                      <SelectItem value="Schwab">Schwab</SelectItem>
                                      <SelectItem value="E*TRADE">E*TRADE</SelectItem>
                                      <SelectItem value="TopstepTrader">TopstepTrader</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Currency</Label>
                                  <Select value={editForm.currency} onValueChange={(value) => setEditForm(prev => prev ? { ...prev, currency: value } : null)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Balance (Optional)</Label>
                            <Input
                              type="number"
                              placeholder="10000…"
                              value={editForm.balance || ''}
                              onChange={(e) => setEditForm(prev => prev ? { ...prev, balance: e.target.value ? parseFloat(e.target.value) : undefined } : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Default Account</Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={editForm.isDefault}
                                onCheckedChange={(checked) => setEditForm(prev => prev ? { ...prev, isDefault: checked } : null)}
                              />
                              <Label>Set as default account</Label>
                            </div>
                          </div>
                        </div>
                              <div className="flex gap-3 mt-6">
                                <Button
                                  onClick={() => {
                                    if (editForm.name && editForm.broker) {
                                      updateAccount(editForm.id, editForm);
                                      if (activeAccount && editForm.id === activeAccount.id && editForm.currency !== settings.currency) {
                                        updateSettings({ currency: editForm.currency });
                                      }
                                      setEditForm(null);
                                    }
                                  }}
                                  disabled={!editForm.name || !editForm.broker}
                                  className="font-semibold hover:shadow-md transition-shadow"
                                  style={{
                                    backgroundColor: themeColors.primary,
                                    borderColor: themeColors.primary
                                  }}
                                >
                                  <FontAwesomeIcon icon={faCheck} className="h-4 w-4 mr-2" />
                                  Save Changes
                                </Button>
                                <Button variant="outline" onClick={() => setEditForm(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Normal Account Card */
                            <div className="rounded-xl bg-background/40 hover:bg-background/60 transition-shadow duration-200 hover:shadow-md"
                                 style={{
                                   border: activeAccount?.id === account.id ? `1px solid ${alpha(themeColors.primary, '30')}` : '1px solid transparent'
                                 }}>
                              <div className="p-5">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-3 mb-3">
                                      <div className="p-2 rounded-lg mt-0.5"
                                           style={{ backgroundColor: `${alpha(account.type === 'live' ? themeColors.profit : themeColors.primary, '20')}` }}>
                                        <FontAwesomeIcon
                                          icon={account.type === 'live' ? faCoins : account.type === 'demo' ? faChartLine : faTrophy}
                                          className="h-4 w-4"
                                          style={{ color: account.type === 'live' ? themeColors.profit : themeColors.primary }}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <h4 className="font-bold text-lg truncate">
                                            {account.name}
                                          </h4>
                                          <div className="flex gap-2 flex-wrap">
                                            {account.isDefault && (
                                              <Badge className="text-xs font-semibold"
                                                     style={{
                                                       backgroundColor: `${alpha(themeColors.profit, '15')}`,
                                                       color: themeColors.profit,
                                                       borderColor: `${alpha(themeColors.profit, '30')}`
                                                     }}>
                                                <FontAwesomeIcon icon={faMedal} className="h-3 w-3 mr-1" />
                                                Default
                                              </Badge>
                                            )}
                                            {activeAccount?.id === account.id && (
                                              <Badge className="text-xs font-semibold"
                                                     style={{
                                                       backgroundColor: `${alpha(themeColors.primary, '15')}`,
                                                       color: themeColors.primary,
                                                       borderColor: `${alpha(themeColors.primary, '30')}`
                                                     }}>
                                                <FontAwesomeIcon icon={faFire} className="h-3 w-3 mr-1" />
                                                Active
                                              </Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs font-medium capitalize">
                                              {account.type.replace('-', ' ')}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground flex-wrap">
                                          <div className="flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faBuilding} className="h-3 w-3" />
                                            <span className="font-medium">{account.broker}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faCoins} className="h-3 w-3" />
                                            <span className="font-medium">{account.currency}</span>
                                          </div>
                                          {account.balance && (
                                            <div className="flex items-center gap-1.5">
                                              <FontAwesomeIcon icon={faDollarSign} className="h-3 w-3" />
                                              <span className="font-semibold" style={{ color: themeColors.profit }}>
                                                {formatCurrency(account.balance, false)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditForm(account)}
                                        className="h-10 w-10 p-0 rounded-lg hover:bg-background/80 transition-shadow"
                                        aria-label="Edit account"
                                      >
                                        <FontAwesomeIcon icon={faPencil} className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateAccount(account.id, { isDefault: true })}
                                      disabled={account.isDefault}
                                      className="min-w-[120px] font-semibold hover:shadow-md transition-shadow"
                                      style={account.isDefault ? {} : {
                                        borderColor: `${alpha(themeColors.primary, '30')}`,
                                        color: themeColors.primary
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faMedal} className="h-3 w-3 mr-2" />
                                      {account.isDefault ? 'Default' : 'Set Default'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => { if (!window.confirm('Are you sure you want to delete this account? This cannot be undone.')) return; deleteAccount(account.id); }}
                                      disabled={accounts.length <= 1}
                                      className="min-w-[100px] font-semibold hover:shadow-md transition-shadow hover:border-destructive hover:text-destructive"
                                    >
                                      <FontAwesomeIcon icon={faTrash} className="h-3 w-3 mr-2" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Account Form */}
                    {showAddAccount && (
                      <div className="rounded-xl bg-background/60 p-6"
                           style={{ border: `1px solid ${alpha(themeColors.profit, '20')}` }}>
                          <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${alpha(themeColors.profit, '20')}` }}>
                              <FontAwesomeIcon icon={faBuilding} className="h-4 w-4" style={{ color: themeColors.profit }} />
                            </div>
                            <h4 className="text-base font-semibold">Add New Account</h4>
                          </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Account Name</Label>
                            <Input
                              placeholder="e.g., Main Live Account…"
                              value={accountForm.name}
                              onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Account Type</Label>
                            <Select value={accountForm.type} onValueChange={(value: TradingAccount['type']) => setAccountForm(prev => ({ ...prev, type: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="demo">Demo Account</SelectItem>
                                <SelectItem value="live">Live Account</SelectItem>
                                <SelectItem value="prop-firm">Prop Firm</SelectItem>
                                <SelectItem value="paper">Paper Trading</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Broker</Label>
                            <Select value={accountForm.broker} onValueChange={(value) => setAccountForm(prev => ({ ...prev, broker: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select broker..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OANDA">OANDA</SelectItem>
                                <SelectItem value="IC Markets">IC Markets</SelectItem>
                                <SelectItem value="MetaTrader 4">MetaTrader 4</SelectItem>
                                <SelectItem value="MetaTrader 5">MetaTrader 5</SelectItem>
                                <SelectItem value="Pepperstone">Pepperstone</SelectItem>
                                <SelectItem value="IG">IG</SelectItem>
                                <SelectItem value="Interactive Brokers">Interactive Brokers</SelectItem>
                                <SelectItem value="FTMO">FTMO</SelectItem>
                                <SelectItem value="The5ers">The5ers</SelectItem>
                                <SelectItem value="Apex Trader Funding">Apex Trader Funding</SelectItem>
                                <SelectItem value="E8 Markets">E8 Markets</SelectItem>
                                <SelectItem value="Topfutures Funded">Topfutures Funded</SelectItem>
                                <SelectItem value="FundedNext">FundedNext</SelectItem>
                                <SelectItem value="Lux Trading Firm">Lux Trading Firm</SelectItem>
                                <SelectItem value="NinjaTrader">NinjaTrader</SelectItem>
                                <SelectItem value="TradingView">TradingView</SelectItem>
                                <SelectItem value="Tradovate">Tradovate</SelectItem>
                                <SelectItem value="AMP Futures">AMP Futures</SelectItem>
                                <SelectItem value="Discount Trading">Discount Trading</SelectItem>
                                <SelectItem value="Schwab">Schwab</SelectItem>
                                <SelectItem value="E*TRADE">E*TRADE</SelectItem>
                                <SelectItem value="TopstepTrader">TopstepTrader</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select value={accountForm.currency} onValueChange={(value) => setAccountForm(prev => ({ ...prev, currency: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Initial Balance (Optional)</Label>
                            <Input
                              type="number"
                              placeholder="10000…"
                              value={accountForm.balance}
                              onChange={(e) => setAccountForm(prev => ({ ...prev, balance: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={accountForm.isDefault}
                              onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, isDefault: checked }))}
                            />
                            <Label>Set as default account</Label>
                          </div>
                        </div>
                          <div className="flex gap-3 mt-6">
                            <Button
                              onClick={() => {
                                if (accountForm.name && accountForm.broker) {
                                  addAccount({
                                    ...accountForm,
                                    balance: accountForm.balance ? parseFloat(accountForm.balance) : undefined
                                  });
                                  setAccountForm({
                                    name: '',
                                    type: 'demo',
                                    broker: '',
                                    currency: 'USD',
                                    balance: '',
                                    isDefault: false
                                  });
                                  setShowAddAccount(false);
                                }
                              }}
                              disabled={!accountForm.name || !accountForm.broker}
                              className="font-semibold hover:shadow-md transition-shadow"
                              style={{
                                backgroundColor: themeColors.profit,
                                borderColor: themeColors.profit
                              }}
                            >
                              <FontAwesomeIcon icon={faBuilding} className="h-4 w-4 mr-2" />
                              Add Account
                            </Button>
                            <Button variant="outline" onClick={() => setShowAddAccount(false)}>
                              Cancel
                            </Button>
                          </div>
                      </div>
                    )}

                    {/* Add Account Button */}
                    {!showAddAccount && !editForm && (
                      <Button
                        onClick={() => setShowAddAccount(true)}
                        variant="outline"
                        className="w-full h-11 font-medium transition-shadow hover:shadow-md"
                        style={{
                          borderColor: `${alpha(themeColors.primary, '30')}`,
                          color: themeColors.primary
                        }}
                      >
                        <FontAwesomeIcon icon={faBuilding} className="h-4 w-4 mr-2" />
                        Add New Account
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trading" className="mt-6">
              <Card className="">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" style={{ color: themeColors.primary }} />
                    Trading Defaults
                  </CardTitle>
                  <CardDescription>
                    Configure default values and trading preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <FontAwesomeIcon icon={faChartSimple} className="h-5 w-5" style={{ color: themeColors.primary }} />
                        Performance Summary
                      </h4>
                      <Badge variant="outline" className="font-medium">
                        {stats.accountName}
                      </Badge>
                    </div>
                    
                    {/* Main Performance Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
                      {/* Total P&L Card */}
                      <div className="rounded-xl bg-muted/30 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                            <p className="text-2xl font-bold mt-2" 
                               style={{ color: stats.totalPnL >= 0 ? themeColors.profit : themeColors.loss }}>
                              {formatCurrency(stats.totalPnL, true)}
                            </p>
                          </div>
                          <div className="rounded-lg p-2">
                            <FontAwesomeIcon 
                              icon={stats.totalPnL >= 0 ? faArrowTrendUp : faArrowTrendDown} 
                              className="h-5 w-5"
                              style={{ color: stats.totalPnL >= 0 ? themeColors.profit : themeColors.loss }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Win Rate Card */}
                      <div className="rounded-xl bg-muted/30 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                            <p className="text-2xl font-bold mt-2">{stats.winRate.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stats.wins}W / {stats.losses}L
                            </p>
                          </div>
                          <div className="rounded-lg p-2">
                            <FontAwesomeIcon 
                              icon={faPercent} 
                              className="h-5 w-5"
                              style={{ color: themeColors.primary }}
                            />
                          </div>
                        </div>
                        {/* Win rate progress bar */}
                        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-[width] duration-500 rounded-full"
                            style={{ 
                              width: `${stats.winRate}%`,
                              backgroundColor: stats.winRate >= 50 ? themeColors.profit : themeColors.loss
                            }}
                          />
                        </div>
                      </div>

                      {/* Profit Factor Card */}
                      <div className="rounded-xl bg-muted/30 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Profit Factor</p>
                            <p className="text-2xl font-bold mt-2">
                              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stats.profitFactor > 1 ? 'Profitable' : stats.profitFactor === 0 ? 'No Data' : 'Unprofitable'}
                            </p>
                          </div>
                          <div className="rounded-lg p-2">
                            <FontAwesomeIcon 
                              icon={faTrophy} 
                              className="h-5 w-5"
                              style={{ color: stats.profitFactor > 1 ? themeColors.profit : themeColors.primary }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Current Streak Card */}
                      <div className="rounded-xl bg-muted/30 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                            <p className="text-2xl font-bold mt-2" 
                               style={{ 
                                 color: stats.currentStreak > 0 ? themeColors.profit : 
                                        stats.currentStreak < 0 ? themeColors.loss : 'inherit'
                               }}>
                              {Math.abs(stats.currentStreak)} {stats.currentStreak > 0 ? 'Wins' : stats.currentStreak < 0 ? 'Losses' : 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Max: {stats.maxWinStreak}W / {stats.maxLossStreak}L
                            </p>
                          </div>
                          <div className="rounded-lg p-2">
                            <FontAwesomeIcon 
                              icon={faFire} 
                              className="h-5 w-5"
                              style={{ color: Math.abs(stats.currentStreak) >= 3 ? themeColors.primary : themeColors.primary }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground">Total Trades</p>
                        <p className="text-xl font-bold">{stats.total}</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground">This Month</p>
                        <p className="text-xl font-bold">{stats.thisMonth}</p>
                        <p className="text-xs text-muted-foreground">
                          P&L: {formatCurrency(stats.monthlyPnL, true)}
                        </p>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground">Avg Win</p>
                        <p className="text-xl font-bold" style={{ color: themeColors.profit }}>
                          {formatCurrency(stats.avgWin, true)}
                        </p>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground">Avg Loss</p>
                        <p className="text-xl font-bold" style={{ color: themeColors.loss }}>
                          {formatCurrency(-stats.avgLoss, true)}
                        </p>
                      </div>
                    </div>

                    {/* Best/Worst Trade */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg p-2">
                            <FontAwesomeIcon icon={faMedal} className="h-4 w-4" style={{ color: themeColors.profit }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Best Trade</p>
                            <p className="text-lg font-bold" style={{ color: themeColors.profit }}>
                              {formatCurrency(stats.bestTrade, true)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg p-2">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" style={{ color: themeColors.loss }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Worst Trade</p>
                            <p className="text-lg font-bold" style={{ color: themeColors.loss }}>
                              {formatCurrency(stats.worstTrade, true)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="mt-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg shadow-sm" style={{ backgroundColor: `${alpha(themeColors.loss, '20')}` }}>
                  <FontAwesomeIcon icon={faShield} className="h-4 w-4" style={{ color: themeColors.loss }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Risk Management</h3>
                  <p className="text-xs text-muted-foreground">Protect your capital with smart position sizing</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Parameters Card */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FontAwesomeIcon icon={faCalculator} className="h-4 w-4" style={{ color: themeColors.primary }} />
                      Risk Parameters
                    </CardTitle>
                    <CardDescription>Configure your risk tolerance and position sizing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-semibold">
                          <FontAwesomeIcon icon={faPercent} className="h-4 w-4" style={{ color: themeColors.primary }} />
                          Risk per Trade (%)
                        </Label>
                        <div className="space-y-3">
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="10"
                              value={settings.riskPerTrade}
                              onChange={(e) => updateSettings({ riskPerTrade: parseFloat(e.target.value) || 0 })}
                              className="h-12 pr-12 text-lg font-semibold bg-background/50 border-border/60 hover:border-primary/50 transition-[border-color]"
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-muted-foreground">%</span>
                          </div>
                          {/* Risk Level Indicator */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Conservative</span>
                              <span>Aggressive</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-[width] duration-500 rounded-full" 
                                style={{ 
                                  width: `${Math.min((settings.riskPerTrade / 5) * 100, 100)}%`,
                                  backgroundColor: settings.riskPerTrade <= 2 ? themeColors.profit : settings.riskPerTrade <= 4 ? themeColors.primary : themeColors.loss
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {settings.riskPerTrade <= 2 ? '✅ Conservative (Recommended)' : 
                               settings.riskPerTrade <= 4 ? '⚠️ Moderate Risk' : 
                               '🔥 High Risk'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-semibold">
                          <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4" style={{ color: themeColors.profit }} />
                          Account Size
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="1000"
                            value={settings.accountSize}
                            onChange={(e) => updateSettings({ accountSize: parseFloat(e.target.value) || 0 })}
                            placeholder="10000…"
                            className="h-12 pl-12 text-lg font-semibold bg-background/50 border-border/60 hover:border-primary/50 transition-[border-color]"
                          />
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-muted-foreground">{getCurrencySymbol()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Your total trading capital</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Calculator Card */}
                <Card className="">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" style={{ color: themeColors.profit }} />
                      Risk Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-background/40"
                           style={{ border: `1px solid ${alpha(themeColors.profit, '20')}` }}>
                        <div className="text-sm text-muted-foreground mb-1">Max Risk per Trade</div>
                        <div className="text-xl font-bold" style={{ color: themeColors.profit }}>
                          {formatCurrency((settings.accountSize * settings.riskPerTrade) / 100, false)}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-background/40"
                           style={{ border: `1px solid ${alpha(themeColors.primary, '20')}` }}>
                        <div className="text-sm text-muted-foreground mb-1">Account Balance</div>
                        <div className="text-xl font-bold" style={{ color: themeColors.primary }}>
                          {formatCurrency(settings.accountSize, false)}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-background/40"
                           style={{ border: `1px solid ${alpha(themeColors.loss, '20')}` }}>
                        <div className="text-sm text-muted-foreground mb-1">Risk Ratio</div>
                        <div className="text-lg font-bold" style={{ color: themeColors.loss }}>
                          1:{Math.round(100 / settings.riskPerTrade)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.round(100 / settings.riskPerTrade)} trades to lose account
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Risk Guidelines */}
              <Card className="">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" style={{ color: themeColors.primary }} />
                    Risk Guidelines & Tips
                  </CardTitle>
                  <CardDescription>Professional risk management recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-background/40"
                         style={{ border: `1px solid ${alpha(themeColors.profit, '20')}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColors.profit }}></div>
                        <div className="font-bold" style={{ color: themeColors.profit }}>Conservative</div>
                      </div>
                      <div className="text-lg font-bold mb-1" style={{ color: themeColors.profit }}>1-2%</div>
                      <div className="text-sm text-muted-foreground">Perfect for beginners and steady growth</div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-background/40"
                         style={{ border: `1px solid ${alpha(themeColors.primary, '20')}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColors.primary }}></div>
                        <div className="font-bold" style={{ color: themeColors.primary }}>Moderate</div>
                      </div>
                      <div className="text-lg font-bold mb-1" style={{ color: themeColors.primary }}>2-3%</div>
                      <div className="text-sm text-muted-foreground">For experienced traders</div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-background/40"
                         style={{ border: `1px solid ${alpha(themeColors.loss, '25')}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColors.loss }}></div>
                        <div className="font-bold" style={{ color: themeColors.loss }}>Aggressive</div>
                      </div>
                      <div className="text-lg font-bold mb-1" style={{ color: themeColors.loss }}>3-5%</div>
                      <div className="text-sm text-muted-foreground">High risk, proven systems only</div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-background/40"
                         style={{ border: `1px solid ${alpha(themeColors.loss, '30')}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: themeColors.loss }}></div>
                        <div className="font-bold" style={{ color: themeColors.loss }}>Dangerous</div>
                      </div>
                      <div className="text-lg font-bold mb-1" style={{ color: themeColors.loss }}>5%+</div>
                      <div className="text-sm text-muted-foreground">High blow-up risk</div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-background/40"
                       style={{ border: `1px solid ${alpha(themeColors.primary, '20')}` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <FontAwesomeIcon icon={faMedal} className="h-4 w-4" style={{ color: themeColors.primary }} />
                      <span className="font-bold" style={{ color: themeColors.primary }}>Pro Tips</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="mt-1" style={{ color: themeColors.profit }}>✓</span>
                        <span>Never risk more than you can afford to lose</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1" style={{ color: themeColors.profit }}>✓</span>
                        <span>Always use stop losses on every trade</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1" style={{ color: themeColors.profit }}>✓</span>
                        <span>Keep risk consistent across all trades</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1" style={{ color: themeColors.profit }}>✓</span>
                        <span>Size positions based on distance to stop loss</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data">
          <div className="space-y-6">
            <Card className="">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FontAwesomeIcon icon={faDatabase} className="h-4 w-4" style={{ color: themeColors.primary }} />
                  Backup & Restore
                </CardTitle>
                <CardDescription>
                  Export your data for backup or import from a previous backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" onClick={exportData}>
                    <FontAwesomeIcon icon={faDownload} className="mr-2 h-4 w-4" />
                    Export All Data
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => document.getElementById('import-data')?.click()}
                  >
                    <FontAwesomeIcon icon={faUpload} className="mr-2 h-4 w-4" />
                    Import Data
                  </Button>
                  <input
                    id="import-data"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importData}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Export creates a JSON file with all your data (trades, journal, goals, accounts, settings).
                  Import will restore all data from a backup file.
                </p>

                {/* Storage Usage Display */}
                {(() => {
                  const calculateStorageSize = () => {
                    let total = 0;
                    const keys = ['trades', 'accounts', 'journalEntries', 'goals', 'riskRules', 'settings', 'onboarding'];
                    keys.forEach(key => {
                      const data = userStorage.getItem(key);
                      if (data) total += new Blob([data]).size;
                    });
                    return total;
                  };

                  const sizeBytes = calculateStorageSize();
                  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
                  const estimatedLimit = 10; // ~10MB typical localStorage limit
                  const percentUsed = (parseFloat(sizeMB) / estimatedLimit) * 100;
                  const isNearLimit = percentUsed > 80;

                  const lastBackup = userStorage.getItem('lastBackupDate');
                  const daysSinceBackup = lastBackup
                    ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  const needsBackup = !lastBackup || (daysSinceBackup !== null && daysSinceBackup > 30);

                  return (
                    <div className="space-y-3 mt-4">
                      {/* Storage Usage */}
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Storage Usage</span>
                          <span className="text-sm" style={{ color: isNearLimit ? themeColors.loss : 'hsl(var(--muted-foreground))' }}>
                            {sizeMB} MB / ~{estimatedLimit} MB
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(percentUsed, 100)}%`,
                              backgroundColor: isNearLimit ? themeColors.loss : themeColors.profit
                            }}
                          />
                        </div>
                        {isNearLimit && (
                          <p className="text-xs mt-2" style={{ color: themeColors.loss }}>
                            ⚠️ Storage almost full! Consider exporting and deleting old trades.
                          </p>
                        )}
                      </div>

                      {/* Backup Reminder */}
                      {!isPro && needsBackup && (
                        <div className="p-3 rounded-lg border" style={{
                          backgroundColor: 'hsl(var(--amber-500) / 0.1)',
                          borderColor: 'hsl(var(--amber-500) / 0.3)'
                        }}>
                          <div className="flex items-start gap-2">
                            <span className="text-lg">💾</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">
                                {lastBackup ? `Last backup: ${daysSinceBackup} days ago` : 'No backup yet'}
                              </p>
                              <p className="text-xs text-muted-foreground mb-2">
                                Free tier data is stored locally only. Regular backups prevent data loss!
                              </p>
                              <Button size="sm" variant="outline" onClick={exportData} className="text-xs h-7">
                                Backup Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cloud Sync Upsell for Free Users */}
                      {!isPro && (
                        <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">☁️</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">Want automatic cloud backup?</p>
                              <p className="text-xs text-muted-foreground mb-2">
                                Pro users get automatic cloud sync across all devices. Never lose data again!
                              </p>
                              <Link to="/pricing">
                                <Button size="sm" variant="outline" className="text-xs h-7">
                                  Upgrade to Pro
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Account section */}
            <Card className="">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Account</CardTitle>
                <CardDescription>
                  Manage your account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50">
                  <div>
                    <div className="font-medium">{user?.displayName || 'User'}</div>
                    <div className="text-sm text-muted-foreground">{user?.email}</div>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="" style={{ border: `1px solid hsl(var(--destructive) / 0.3)` }}>
              <CardHeader className="pb-4">
                <CardTitle className="text-destructive flex items-center gap-2 text-base">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions - please be careful
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="destructive" 
                  onClick={clearAllData}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                  Delete All Data
                </Button>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all your trades and settings. This action cannot be undone.
                </p>
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            <TabsContent value="subscription" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg shadow-sm" style={{ backgroundColor: `${alpha(themeColors.primary, '20')}` }}>
                    <FontAwesomeIcon icon={faCrown} className="h-4 w-4" style={{ color: themeColors.primary }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Subscription</h3>
                    <p className="text-xs text-muted-foreground">Manage your plan and billing</p>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FontAwesomeIcon icon={faCrown} className="h-4 w-4" style={{ color: isPro ? '#f59e0b' : themeColors.primary }} />
                      Current Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isPro ? (
                      <>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">Pro</span>
                              <ProBadge size="md" />
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{subscription?.planType} plan</p>
                          </div>
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 capitalize">
                            {subscription?.status || 'Active'}
                          </Badge>
                        </div>
                        {subscription?.currentPeriodEnd && subscription.planType !== 'lifetime' && (
                          <p className="text-sm text-muted-foreground">
                            {subscription.status === 'cancelled' ? 'Access until' : 'Renews on'}{' '}
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        )}
                        {subscription?.stripeCustomerId && (
                          <Button
                            variant="outline"
                            onClick={async () => {
                              try {
                                const { redirectToPortal } = await import('@/lib/stripe');
                                await redirectToPortal();
                              } catch (error) {
                                toast.error('Failed to open subscription portal');
                              }
                            }}
                          >
                            Manage Subscription
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50">
                          <div className="space-y-1">
                            <span className="font-semibold text-lg">Free</span>
                            <p className="text-sm text-muted-foreground">You're on the free plan</p>
                          </div>
                          <Badge variant="outline">Free</Badge>
                        </div>
                        <div className="space-y-2 pt-2">
                          <p className="text-sm font-medium">Upgrade to Pro to unlock:</p>
                          <ul className="space-y-1.5">
                            {PRO_FEATURES.map((f) => (
                              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FontAwesomeIcon icon={faCheck} className="h-3 w-3 text-amber-500" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          className="mt-4 font-semibold"
                          style={{ backgroundColor: '#f59e0b' }}
                          onClick={() => navigate('/pricing')}
                        >
                          <FontAwesomeIcon icon={faCrown} className="h-4 w-4 mr-2" />
                          Upgrade to Pro
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Cloud Sync Status — Pro users only */}
                {isPro && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FontAwesomeIcon icon={faCloud} className="h-4 w-4" style={{ color: themeColors.primary }} />
                        Cloud Sync
                      </CardTitle>
                      <CardDescription>Your trades sync automatically across devices</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${
                            syncStatus === 'synced' ? 'bg-green-500' :
                            syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' :
                            syncStatus === 'error' ? 'bg-red-500' :
                            'bg-muted-foreground/40'
                          }`} />
                          <div>
                            <p className="text-sm font-medium capitalize">{syncStatus === 'idle' ? 'Not connected' : syncStatus}</p>
                            {lastSyncTime && (
                              <p className="text-xs text-muted-foreground">
                                Last synced {new Date(lastSyncTime).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <div className="flex justify-center pt-6">
              <Button
                onClick={saveSettings}
                size="lg"
                className="px-8 py-3 font-medium shadow-lg gap-2"
                style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
              >
                <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                Save All Settings
              </Button>
            </div>
          </Tabs>
        </div>
      </div>
      <AppFooter />

      {/* Pro Welcome Dialog */}
      <Dialog open={showProWelcome} onOpenChange={setShowProWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center items-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <FontAwesomeIcon icon={faCrown} className="h-8 w-8 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-bold">Welcome to Pro!</DialogTitle>
            <DialogDescription className="text-base">
              Your upgrade is complete. You now have access to all premium features.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {PRO_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3 text-green-500" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
          <Button
            className="mt-6 w-full"
            onClick={() => setShowProWelcome(false)}
          >
            Get Started
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}