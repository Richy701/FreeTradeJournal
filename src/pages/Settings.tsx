import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts, type TradingAccount } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { SUPPORTED_CURRENCIES, DEFAULT_VALUES } from '@/constants/trading';
import { useEmailNotifications, sendTestEmail } from '@/hooks/use-email-notifications';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faCheck, 
  faDownload, 
  faTrash, 
  faUpload, 
  faShield, 
  faBell, 
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
  faChartSimple
} from '@fortawesome/free-solid-svg-icons';
import { SiteHeader } from '@/components/site-header';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { currentTheme, setTheme: setColorTheme, availableThemes, themeColors } = useThemePresets();
  const { logout, user } = useAuth();
  const { accounts, activeAccount, addAccount, updateAccount, deleteAccount } = useAccounts();
  const { settings, updateSettings, formatCurrency, getCurrencySymbol } = useSettings();
  const { getNotificationSettings, updateNotificationSettings } = useEmailNotifications();
  const userStorage = useUserStorage();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(getNotificationSettings());
  const [isTestingEmail, setIsTestingEmail] = useState(false);
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
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
    const trades = userStorage.getItem('trades') || '[]';
    const settings = userStorage.getItem('settings') || '{}';
    const data = {
      trades: JSON.parse(trades),
      settings: JSON.parse(settings),
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ftj_backup_${new Date().toISOString().split('T')[0]}.json`);
    a.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.trades) {
          userStorage.setItem('trades', JSON.stringify(data.trades));
        }
        if (data.settings) {
          userStorage.setItem('settings', JSON.stringify(data.settings));
          // Settings are loaded from context, no need to set them here
        }
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      userStorage.removeItem('trades');
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
      <SiteHeader />
      <div className="min-h-screen bg-background">
        <div className="w-full px-6 md:px-12 py-8 mx-auto" style={{maxWidth: '1200px'}}>
          {/* Animated Header with Gradient Background */}
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 border border-primary/20 shadow-xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
                    Settings
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg mt-2 max-w-2xl">
                    Personalize your trading experience and manage your preferences
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Badge className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/30 backdrop-blur-sm">
                    <FontAwesomeIcon icon={faChartLine} className="mr-2 h-3 w-3 text-green-500" />
                    {stats.total} Total Trades
                  </Badge>
                  <Badge className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/30 backdrop-blur-sm">
                    <FontAwesomeIcon icon={faClock} className="mr-2 h-3 w-3 text-blue-500" />
                    {stats.thisMonth} This Month
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 h-auto p-2 bg-gradient-to-br from-muted/30 to-muted/50 backdrop-blur-sm rounded-xl border border-border/50">
              <TabsTrigger value="general" className="group relative flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:border-primary/30 hover:bg-background/70">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-primary/0 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/5 transition-all" />
                <FontAwesomeIcon icon={faPalette} className="relative h-4 w-4 group-data-[state=active]:text-primary transition-colors" />
                <span className="relative">General</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="group relative flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:border-primary/30 hover:bg-background/70">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-primary/0 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/5 transition-all" />
                <FontAwesomeIcon icon={faBuilding} className="relative h-4 w-4 group-data-[state=active]:text-primary transition-colors" />
                <span className="relative">Accounts</span>
              </TabsTrigger>
              <TabsTrigger value="trading" className="group relative flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:border-primary/30 hover:bg-background/70">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-primary/0 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/5 transition-all" />
                <FontAwesomeIcon icon={faChartLine} className="relative h-4 w-4 group-data-[state=active]:text-primary transition-colors" />
                <span className="relative">Trading</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="group relative flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:border-primary/30 hover:bg-background/70">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-primary/0 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/5 transition-all" />
                <FontAwesomeIcon icon={faShield} className="relative h-4 w-4 group-data-[state=active]:text-primary transition-colors" />
                <span className="relative">Risk</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="group relative flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:border-primary/30 hover:bg-background/70">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-primary/0 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/5 transition-all" />
                <FontAwesomeIcon icon={faBell} className="relative h-4 w-4 group-data-[state=active]:text-primary transition-colors" />
                <span className="relative">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="group relative flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:border-primary/30 hover:bg-background/70">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-primary/0 group-data-[state=active]:from-primary/10 group-data-[state=active]:to-primary/5 transition-all" />
                <FontAwesomeIcon icon={faDatabase} className="relative h-4 w-4 group-data-[state=active]:text-primary transition-colors" />
                <span className="relative">Data</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <div className="space-y-6">
                {/* Main Appearance Card */}
                <Card className="relative overflow-hidden border-border/50 shadow-xl bg-gradient-to-br from-background via-background/95 to-muted/30">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <CardHeader className="relative pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                      <FontAwesomeIcon icon={faPalette} className="h-5 w-5 text-primary" />
                    </div>
                    Appearance & Localization
                  </CardTitle>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    Customize your trading journal appearance and regional settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-semibold">
                          <FontAwesomeIcon icon={faSun} className="h-4 w-4 text-primary" />
                          Theme
                        </Label>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger className="h-12 bg-background/50 border-border/60 hover:border-primary/50 transition-all duration-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faSun} className="h-4 w-4" />
                                Light Mode
                              </div>
                            </SelectItem>
                            <SelectItem value="dark">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faMoon} className="h-4 w-4" />
                                Dark Mode
                              </div>
                            </SelectItem>
                            <SelectItem value="system">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faDesktop} className="h-4 w-4" />
                                System Default
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred color scheme
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-semibold">
                          <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4 text-primary" />
                          Currency
                        </Label>
                        <Select value={settings.currency} onValueChange={(value) => updateSettings({ currency: value })}>
                          <SelectTrigger className="h-12 bg-background/50 border-border/60 hover:border-primary/50 transition-all duration-200">
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
                        <p className="text-sm text-muted-foreground">
                          Default currency for P&L calculations
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select value={settings.timezone} onValueChange={(value) => updateSettings({ timezone: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                                Eastern Time (ET)
                              </div>
                            </SelectItem>
                            <SelectItem value="America/Chicago">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                                Central Time (CT)
                              </div>
                            </SelectItem>
                            <SelectItem value="America/Denver">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                                Mountain Time (MT)
                              </div>
                            </SelectItem>
                            <SelectItem value="America/Los_Angeles">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                                Pacific Time (PT)
                              </div>
                            </SelectItem>
                            <SelectItem value="Europe/London">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                                London (GMT)
                              </div>
                            </SelectItem>
                            <SelectItem value="Europe/Berlin">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                                Berlin (CET)
                              </div>
                            </SelectItem>
                            <SelectItem value="Asia/Tokyo">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                                Tokyo (JST)
                              </div>
                            </SelectItem>
                            <SelectItem value="Asia/Hong_Kong">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                                Hong Kong (HKT)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Used for trade timestamps and market hours
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Default Chart Period</Label>
                        <Select 
                          value={settings.displaySettings.defaultChartPeriod} 
                          onValueChange={(value) => updateSettings({ displaySettings: { ...settings.displaySettings, defaultChartPeriod: value } })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1W">1 Week</SelectItem>
                            <SelectItem value="1M">1 Month</SelectItem>
                            <SelectItem value="3M">3 Months</SelectItem>
                            <SelectItem value="6M">6 Months</SelectItem>
                            <SelectItem value="1Y">1 Year</SelectItem>
                            <SelectItem value="ALL">All Time</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Default time period for analytics charts
                        </p>
                      </div>
                    </div>

                    <Separator />
                    
                    {/* Color Theme Selection */}
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold">Color Theme</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(availableThemes).map(([key, preset]) => (
                          <button
                            key={key}
                            onClick={() => setColorTheme(key)}
                            className={`p-6 rounded-xl border-2 transition-all hover:shadow-md ${
                              currentTheme === key 
                                ? 'border-primary bg-muted/30 shadow-sm' 
                                : 'border-border/50 hover:border-primary/30 hover:bg-muted/20'
                            }`}
                          >
                            <div className="space-y-4">
                              <div className="text-base font-semibold">{preset.name}</div>
                              <div className="flex gap-3 justify-center">
                                <div 
                                  className="w-7 h-7 rounded-full border-2 border-background shadow-md" 
                                  style={{ backgroundColor: preset.colors.profit }}
                                />
                                <div 
                                  className="w-7 h-7 rounded-full border-2 border-background shadow-md" 
                                  style={{ backgroundColor: preset.colors.loss }}
                                />
                                <div 
                                  className="w-7 h-7 rounded-full border-2 border-background shadow-md" 
                                  style={{ backgroundColor: preset.colors.primary }}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div 
                                  className="py-2 px-3 rounded-lg text-white text-center font-semibold shadow-sm"
                                  style={{ backgroundColor: preset.colors.profit }}
                                >
                                  +$250
                                </div>
                                <div 
                                  className="py-2 px-3 rounded-lg text-white text-center font-semibold shadow-sm"
                                  style={{ backgroundColor: preset.colors.loss }}
                                >
                                  -$150
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Choose a color theme for profit/loss visualization and UI elements
                      </p>
                    </div>

                    <Separator />
                    
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold">Display Preferences</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Show P&L as Percentage</Label>
                          <p className="text-sm text-muted-foreground">Display returns as % instead of dollar amounts</p>
                        </div>
                        <Switch
                          checked={settings.displaySettings.showPnlAsPercentage}
                          onCheckedChange={(checked) => updateSettings({ displaySettings: { ...settings.displaySettings, showPnlAsPercentage: checked } })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Hide Small Trades</Label>
                          <p className="text-sm text-muted-foreground">Hide trades under $10 from charts</p>
                        </div>
                        <Switch
                          checked={settings.displaySettings.hideSmallTrades}
                          onCheckedChange={(checked) => updateSettings({ displaySettings: { ...settings.displaySettings, hideSmallTrades: checked } })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="accounts" className="mt-6">
              <div className="space-y-6">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faBuilding} className="h-5 w-5" />
                      Trading Accounts
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/85 leading-[1.6]">
                      Manage your trading accounts to track performance separately
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Account List */}
                    <div className="space-y-4">
                      {accounts.map((account) => (
                        <div key={account.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border/50 rounded-lg bg-muted/20 gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold truncate">
                                    {account.name}
                                  </span>
                                  <div className="flex gap-2 flex-wrap">
                                    {account.isDefault && (
                                      <Badge variant="secondary" className="text-xs">Default</Badge>
                                    )}
                                    {activeAccount?.id === account.id && (
                                      <Badge variant="outline" className="text-xs">Active</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {account.broker} • {account.type} • {account.currency}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditForm(account)}
                                className="h-8 w-8 p-0 hover:bg-muted ml-2"
                              >
                                <FontAwesomeIcon icon={faPencil} className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAccount(account.id, { isDefault: true })}
                              disabled={account.isDefault}
                              className="flex-1 sm:flex-none"
                            >
                              Set Default
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteAccount(account.id)}
                              disabled={accounts.length <= 1}
                              className="flex-1 sm:flex-none"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Edit Account Form */}
                    {editForm && (
                      <div className="p-4 border border-border/50 rounded-lg bg-muted/10">
                        <h4 className="font-semibold mb-4">Edit Account</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Account Name</Label>
                            <Input
                              placeholder="e.g., Main Live Account"
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
                              placeholder="10000"
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
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => {
                              if (editForm.name && editForm.broker) {
                                updateAccount(editForm.id, editForm);
                                setEditForm(null);
                              }
                            }}
                            disabled={!editForm.name || !editForm.broker}
                          >
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditForm(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Add Account Form */}
                    {showAddAccount && (
                      <div className="p-4 border border-border/50 rounded-lg bg-muted/10">
                        <h4 className="font-semibold mb-4">Add New Account</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Account Name</Label>
                            <Input
                              placeholder="e.g., Main Live Account"
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
                              placeholder="10000"
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
                        <div className="flex gap-2 mt-4">
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
                          >
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
                      <Button onClick={() => setShowAddAccount(true)} className="w-full" variant="outline">
                        <FontAwesomeIcon icon={faBuilding} className="mr-2 h-4 w-4" />
                        Add New Account
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trading" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faChartLine} className="h-5 w-5" />
                    Trading Defaults
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/85 leading-[1.6]">
                    Configure default values and trading preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Default Commission per Trade</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={settings.defaultCommission}
                          onChange={(e) => updateSettings({ defaultCommission: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="pl-8"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pre-filled when adding new trades
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Account Size</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="1000"
                          value={settings.accountSize}
                          onChange={(e) => updateSettings({ accountSize: parseFloat(e.target.value) || 0 })}
                          placeholder="10000"
                          className="pl-8"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Used for position sizing calculations
                      </p>
                    </div>
                  </div>

                  <Separator />
                  
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total P&L Card */}
                      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background to-muted/20 p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                            <p className={`text-2xl font-bold mt-2 ${stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(stats.totalPnL, true)}
                            </p>
                          </div>
                          <div className={`rounded-lg p-2 ${stats.totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <FontAwesomeIcon 
                              icon={stats.totalPnL >= 0 ? faArrowTrendUp : faArrowTrendDown} 
                              className={`h-5 w-5 ${stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Win Rate Card */}
                      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background to-muted/20 p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                            <p className="text-2xl font-bold mt-2">{stats.winRate.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stats.wins}W / {stats.losses}L
                            </p>
                          </div>
                          <div className="rounded-lg p-2" style={{ backgroundColor: `${themeColors.primary}20` }}>
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
                            className="h-full transition-all duration-500"
                            style={{ 
                              width: `${stats.winRate}%`,
                              backgroundColor: stats.winRate >= 50 ? themeColors.profit : themeColors.loss
                            }}
                          />
                        </div>
                      </div>

                      {/* Profit Factor Card */}
                      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background to-muted/20 p-6">
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
                          <div className={`rounded-lg p-2 ${stats.profitFactor > 1 ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                            <FontAwesomeIcon 
                              icon={faTrophy} 
                              className={`h-5 w-5 ${stats.profitFactor > 1 ? 'text-green-500' : 'text-orange-500'}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Current Streak Card */}
                      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background to-muted/20 p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                            <p className={`text-2xl font-bold mt-2 ${stats.currentStreak > 0 ? 'text-green-500' : stats.currentStreak < 0 ? 'text-red-500' : ''}`}>
                              {Math.abs(stats.currentStreak)} {stats.currentStreak > 0 ? 'Wins' : stats.currentStreak < 0 ? 'Losses' : 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Max: {stats.maxWinStreak}W / {stats.maxLossStreak}L
                            </p>
                          </div>
                          <div className={`rounded-lg p-2 ${Math.abs(stats.currentStreak) >= 3 ? 'bg-orange-500/10' : 'bg-muted'}`}>
                            <FontAwesomeIcon 
                              icon={faFire} 
                              className={`h-5 w-5 ${Math.abs(stats.currentStreak) >= 3 ? 'text-orange-500' : 'text-muted-foreground'}`}
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
                        <p className="text-xl font-bold text-green-500">
                          {formatCurrency(stats.avgWin, true)}
                        </p>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground">Avg Loss</p>
                        <p className="text-xl font-bold text-red-500">
                          {formatCurrency(-stats.avgLoss, true)}
                        </p>
                      </div>
                    </div>

                    {/* Best/Worst Trade */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-green-500/5 to-green-500/10">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg p-2 bg-green-500/20">
                            <FontAwesomeIcon icon={faMedal} className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Best Trade</p>
                            <p className="text-lg font-bold text-green-500">
                              {formatCurrency(stats.bestTrade, true)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-red-500/5 to-red-500/10">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg p-2 bg-red-500/20">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Worst Trade</p>
                            <p className="text-lg font-bold text-red-500">
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
              {/* Risk Management Header */}
              <div className="relative overflow-hidden rounded-2xl p-6 border shadow-lg" 
                   style={{ 
                     background: `linear-gradient(135deg, ${themeColors.loss}10 0%, ${themeColors.loss}05 50%, transparent 100%)`,
                     borderColor: `${themeColors.loss}20`
                   }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl animate-pulse" 
                     style={{ backgroundColor: `${themeColors.loss}10` }} />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl animate-pulse delay-1000" 
                     style={{ backgroundColor: `${themeColors.primary}10` }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl shadow-lg" 
                         style={{ background: `linear-gradient(135deg, ${themeColors.loss}20, ${themeColors.primary}20)` }}>
                      <FontAwesomeIcon icon={faShield} className="h-6 w-6" style={{ color: themeColors.loss }} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Risk Management</h3>
                      <p className="text-muted-foreground">Protect your capital with smart position sizing</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Parameters Card */}
                <Card className="lg:col-span-2 relative overflow-hidden border-border/50 shadow-xl bg-gradient-to-br from-background to-muted/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <FontAwesomeIcon icon={faCalculator} className="h-4 w-4 text-primary" />
                      </div>
                      Risk Parameters
                    </CardTitle>
                    <CardDescription>Configure your risk tolerance and position sizing</CardDescription>
                  </CardHeader>
                  <CardContent className="relative space-y-6">
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
                              className="h-12 pr-12 text-lg font-semibold bg-background/50 border-border/60 hover:border-primary/50 transition-all"
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
                                className="h-full transition-all duration-500 rounded-full" 
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
                            placeholder="10000"
                            className="h-12 pl-12 text-lg font-semibold bg-background/50 border-border/60 hover:border-primary/50 transition-all"
                          />
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-muted-foreground">{getCurrencySymbol()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Your total trading capital</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Calculator Card */}
                <Card className="relative overflow-hidden border-border/50 shadow-xl" 
                      style={{ background: `linear-gradient(135deg, ${themeColors.profit}05, ${themeColors.primary}05)` }}>
                  <div className="absolute top-0 left-0 w-20 h-20 rounded-full blur-xl" 
                       style={{ backgroundColor: `${themeColors.profit}10` }} />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" style={{ color: themeColors.profit }} />
                      Risk Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border" 
                           style={{ 
                             background: `linear-gradient(135deg, ${themeColors.profit}10, ${themeColors.profit}05)`,
                             borderColor: `${themeColors.profit}20`
                           }}>
                        <div className="text-sm text-muted-foreground mb-1">Max Risk per Trade</div>
                        <div className="text-xl font-bold" style={{ color: themeColors.profit }}>
                          {formatCurrency((settings.accountSize * settings.riskPerTrade) / 100, false)}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl border" 
                           style={{ 
                             background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
                             borderColor: `${themeColors.primary}20`
                           }}>
                        <div className="text-sm text-muted-foreground mb-1">Account Balance</div>
                        <div className="text-xl font-bold" style={{ color: themeColors.primary }}>
                          {formatCurrency(settings.accountSize, false)}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border" 
                           style={{ 
                             background: `linear-gradient(135deg, ${themeColors.loss}10, ${themeColors.loss}05)`,
                             borderColor: `${themeColors.loss}20`
                           }}>
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
              <Card className="relative overflow-hidden border-border/50 shadow-xl" 
                    style={{ background: `linear-gradient(135deg, transparent, ${themeColors.primary}05)` }}>
                <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl" 
                     style={{ backgroundColor: `${themeColors.primary}05` }} />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.primary}20` }}>
                      <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" style={{ color: themeColors.primary }} />
                    </div>
                    Risk Guidelines & Tips
                  </CardTitle>
                  <CardDescription>Professional risk management recommendations</CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="group p-4 rounded-xl border hover:shadow-lg transition-all" 
                         style={{ 
                           background: `linear-gradient(135deg, ${themeColors.profit}10, ${themeColors.profit}05)`,
                           borderColor: `${themeColors.profit}20`
                         }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColors.profit }}></div>
                        <div className="font-bold" style={{ color: themeColors.profit }}>Conservative</div>
                      </div>
                      <div className="text-lg font-bold mb-1" style={{ color: themeColors.profit }}>1-2%</div>
                      <div className="text-sm text-muted-foreground">Perfect for beginners and steady growth</div>
                    </div>
                    
                    <div className="group p-4 rounded-xl border hover:shadow-lg transition-all" 
                         style={{ 
                           background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
                           borderColor: `${themeColors.primary}20`
                         }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColors.primary }}></div>
                        <div className="font-bold" style={{ color: themeColors.primary }}>Moderate</div>
                      </div>
                      <div className="text-lg font-bold mb-1" style={{ color: themeColors.primary }}>2-3%</div>
                      <div className="text-sm text-muted-foreground">For experienced traders</div>
                    </div>
                    
                    <div className="group p-4 rounded-xl border hover:shadow-lg transition-all" 
                         style={{ 
                           background: `linear-gradient(135deg, ${themeColors.loss}15, ${themeColors.loss}08)`,
                           borderColor: `${themeColors.loss}25`
                         }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColors.loss }}></div>
                        <div className="font-bold" style={{ color: themeColors.loss }}>Aggressive</div>
                      </div>
                      <div className="text-lg font-bold mb-1" style={{ color: themeColors.loss }}>3-5%</div>
                      <div className="text-sm text-muted-foreground">High risk, proven systems only</div>
                    </div>
                    
                    <div className="group p-4 rounded-xl border hover:shadow-lg transition-all" 
                         style={{ 
                           background: `linear-gradient(135deg, ${themeColors.loss}20, ${themeColors.loss}10)`,
                           borderColor: `${themeColors.loss}30`
                         }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: themeColors.loss }}></div>
                        <div className="font-bold" style={{ color: themeColors.loss }}>Dangerous</div>
                      </div>
                      <div className="text-lg font-bold mb-1" style={{ color: themeColors.loss }}>5%+</div>
                      <div className="text-sm text-muted-foreground">High blow-up risk</div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl border" 
                       style={{ 
                         background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.profit}10)`,
                         borderColor: `${themeColors.primary}20`
                       }}>
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

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
                    Notifications & Alerts
                  </CardTitle>
                  <CardDescription>
                    Configure when and how you receive trading alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Trade Entry/Exit Alerts</Label>
                        <p className="text-sm text-muted-foreground">Get notified when you add new trades</p>
                      </div>
                      <Switch
                        checked={settings.notifications.tradeAlerts}
                        onCheckedChange={(checked) => updateSettings({ notifications: { ...settings.notifications, tradeAlerts: checked } })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Daily Performance Reports</Label>
                        <p className="text-sm text-muted-foreground">Daily summary of your trading activity</p>
                      </div>
                      <Switch
                        checked={settings.notifications.dailyReports}
                        onCheckedChange={(checked) => updateSettings({ notifications: { ...settings.notifications, dailyReports: checked } })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Performance Reports</Label>
                        <p className="text-sm text-muted-foreground">Weekly analysis of your trading performance</p>
                      </div>
                      <Switch
                        checked={settings.notifications.weeklyReports}
                        onCheckedChange={(checked) => updateSettings({ notifications: { ...settings.notifications, weeklyReports: checked } })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Risk Management Alerts</Label>
                        <p className="text-sm text-muted-foreground">Alerts when approaching risk limits</p>
                      </div>
                      <Switch
                        checked={settings.notifications.riskAlerts}
                        onCheckedChange={(checked) => updateSettings({ notifications: { ...settings.notifications, riskAlerts: checked } })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faBell} className="h-4 w-4 text-primary" />
                      <h3 className="text-lg font-semibold">Email Notifications</h3>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Welcome Emails</Label>
                        <p className="text-sm text-muted-foreground">Send welcome email to new users</p>
                      </div>
                      <Switch
                        checked={emailNotifications.welcomeEmails}
                        onCheckedChange={(checked) => {
                          const updated = { ...emailNotifications, welcomeEmails: checked };
                          setEmailNotifications(updated);
                          updateNotificationSettings(updated);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>All Trade Alerts</Label>
                        <p className="text-sm text-muted-foreground">Email for every trade closed</p>
                      </div>
                      <Switch
                        checked={emailNotifications.tradeAlerts}
                        onCheckedChange={(checked) => {
                          const updated = { ...emailNotifications, tradeAlerts: checked };
                          setEmailNotifications(updated);
                          updateNotificationSettings(updated);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Big Win Alerts</Label>
                        <p className="text-sm text-muted-foreground">Email alerts for significant winning trades</p>
                      </div>
                      <Switch
                        checked={emailNotifications.bigWinAlerts}
                        onCheckedChange={(checked) => {
                          const updated = { ...emailNotifications, bigWinAlerts: checked };
                          setEmailNotifications(updated);
                          updateNotificationSettings(updated);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Big Loss Alerts</Label>
                        <p className="text-sm text-muted-foreground">Email alerts for significant losing trades</p>
                      </div>
                      <Switch
                        checked={emailNotifications.bigLossAlerts}
                        onCheckedChange={(checked) => {
                          const updated = { ...emailNotifications, bigLossAlerts: checked };
                          setEmailNotifications(updated);
                          updateNotificationSettings(updated);
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="winThreshold">Big Win Threshold ($)</Label>
                        <Input
                          id="winThreshold"
                          type="number"
                          value={emailNotifications.winThreshold}
                          onChange={(e) => {
                            const updated = { ...emailNotifications, winThreshold: Number(e.target.value) };
                            setEmailNotifications(updated);
                            updateNotificationSettings(updated);
                          }}
                          className="max-w-[200px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lossThreshold">Big Loss Threshold ($)</Label>
                        <Input
                          id="lossThreshold"
                          type="number"
                          value={emailNotifications.lossThreshold}
                          onChange={(e) => {
                            const updated = { ...emailNotifications, lossThreshold: Number(e.target.value) };
                            setEmailNotifications(updated);
                            updateNotificationSettings(updated);
                          }}
                          className="max-w-[200px]"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!user?.email) return;
                          setIsTestingEmail(true);
                          const result = await sendTestEmail(user.email);
                          setIsTestingEmail(false);
                          if (result.success) {
                            alert('Test email sent successfully! Check your inbox.');
                          } else {
                            alert(`Failed to send test email: ${result.error}`);
                          }
                        }}
                        disabled={!user?.email || isTestingEmail}
                        className="w-fit"
                      >
                        {isTestingEmail ? 'Sending...' : 'Send Test Email'}
                      </Button>
                      {!user?.email && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Email address required for email notifications
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="p-6 rounded-xl bg-muted/20 border border-border/50">
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faBell} className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">Browser Notifications</div>
                        <div className="text-sm text-muted-foreground/85 mt-1 leading-[1.6]">
                          Enable browser notifications to receive alerts even when FreeTradeJournal is not actively open. 
                          You can manage these in your browser settings.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Backup & Restore</CardTitle>
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
                  Export creates a JSON file with all your trades and settings. 
                  Import will merge the data with your existing records.
                </p>
              </CardContent>
            </Card>

            {/* Account section */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle>Account</CardTitle>
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

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5" />
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
            
            <div className="flex justify-center pt-8">
              <Button 
                onClick={saveSettings} 
                size="lg" 
                className="relative px-12 py-4 font-bold text-lg bg-gradient-to-r from-primary via-primary/90 to-primary hover:from-primary/90 hover:via-primary hover:to-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {saved ? (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="h-5 w-5 text-green-400 animate-pulse" />
                    Settings Saved!
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
                    Save All Settings
                  </div>
                )}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-pulse opacity-30" />
              </Button>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}