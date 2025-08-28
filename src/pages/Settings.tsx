import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemePresets } from '@/contexts/theme-presets';
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
  faCalculator
} from '@fortawesome/free-solid-svg-icons';
import { SiteHeader } from '@/components/site-header';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { currentTheme, setTheme: setColorTheme, availableThemes, themeColors } = useThemePresets();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [defaultCommission, setDefaultCommission] = useState<string>('0');
  const [currency, setCurrency] = useState<string>('USD');
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [riskPerTrade, setRiskPerTrade] = useState<string>('2');
  const [accountSize, setAccountSize] = useState<string>('10000');
  const [notifications, setNotifications] = useState({
    tradeAlerts: true,
    dailyReports: false,
    weeklyReports: true,
    riskAlerts: true
  });
  const [displaySettings, setDisplaySettings] = useState({
    showPnlAsPercentage: false,
    hideSmallTrades: false,
    defaultChartPeriod: '1M'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setDefaultCommission(settings.defaultCommission || '0');
      setCurrency(settings.currency || 'USD');
      setTimezone(settings.timezone || 'America/New_York');
      setRiskPerTrade(settings.riskPerTrade || '2');
      setAccountSize(settings.accountSize || '10000');
      setNotifications(settings.notifications || {
        tradeAlerts: true,
        dailyReports: false,
        weeklyReports: true,
        riskAlerts: true
      });
      setDisplaySettings(settings.displaySettings || {
        showPnlAsPercentage: false,
        hideSmallTrades: false,
        defaultChartPeriod: '1M'
      });
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      defaultCommission,
      currency,
      timezone,
      riskPerTrade,
      accountSize,
      notifications,
      displaySettings
    };
    localStorage.setItem('settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getTradeStats = () => {
    const trades = JSON.parse(localStorage.getItem('trades') || '[]');
    return {
      total: trades.length,
      thisMonth: trades.filter((t: any) => {
        const tradeDate = new Date(t.exitTime);
        const now = new Date();
        return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
      }).length,
      totalPnL: trades.reduce((sum: number, t: any) => sum + t.pnl, 0)
    };
  };

  const stats = getTradeStats();

  const exportData = () => {
    const trades = localStorage.getItem('trades') || '[]';
    const settings = localStorage.getItem('settings') || '{}';
    const data = {
      trades: JSON.parse(trades),
      settings: JSON.parse(settings),
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `tradevault_backup_${new Date().toISOString().split('T')[0]}.json`);
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
          localStorage.setItem('trades', JSON.stringify(data.trades));
        }
        if (data.settings) {
          localStorage.setItem('settings', JSON.stringify(data.settings));
          setDefaultCommission(data.settings.defaultCommission || '0');
          setCurrency(data.settings.currency || 'USD');
          setTimezone(data.settings.timezone || 'America/New_York');
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
      localStorage.removeItem('trades');
      localStorage.removeItem('settings');
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
      <SiteHeader className="hidden md:block" />
      <div className="min-h-screen bg-background">
        <div className="w-full px-6 md:px-12 py-8 mx-auto" style={{maxWidth: '1200px'}}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground/85 text-sm sm:text-base md:text-lg leading-[1.6]">Manage your trading preferences and account settings</p>
            </div>
            <div className="flex gap-3">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-semibold text-muted-foreground">{stats.total} Total Trades</Badge>
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold text-muted-foreground">{stats.thisMonth} This Month</Badge>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto sm:h-12 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="general" className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground transition-all">
                <FontAwesomeIcon icon={faPalette} className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="trading" className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground transition-all">
                <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" />
                Trading
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground transition-all">
                <FontAwesomeIcon icon={faShield} className="h-4 w-4" />
                Risk
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground transition-all">
                <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground transition-all">
                <FontAwesomeIcon icon={faDatabase} className="h-4 w-4" />
                Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <div className="space-y-6">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faPalette} className="h-5 w-5" />
                      Appearance & Localization
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/85 leading-[1.6]">
                      Customize your trading journal appearance and regional settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger>
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

                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger>
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
                        <Select value={timezone} onValueChange={setTimezone}>
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
                          value={displaySettings.defaultChartPeriod} 
                          onValueChange={(value) => setDisplaySettings(prev => ({ ...prev, defaultChartPeriod: value }))}
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
                          checked={displaySettings.showPnlAsPercentage}
                          onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, showPnlAsPercentage: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Hide Small Trades</Label>
                          <p className="text-sm text-muted-foreground">Hide trades under $10 from charts</p>
                        </div>
                        <Switch
                          checked={displaySettings.hideSmallTrades}
                          onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, hideSmallTrades: checked }))}
                        />
                      </div>
                    </div>
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
                          value={defaultCommission}
                          onChange={(e) => setDefaultCommission(e.target.value)}
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
                          value={accountSize}
                          onChange={(e) => setAccountSize(e.target.value)}
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
                    <h4 className="text-lg font-semibold">Performance Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col space-y-2 p-6 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-sm font-semibold text-muted-foreground">Total Trades</span>
                        <span className="text-3xl font-bold">{stats.total}</span>
                      </div>
                      <div className="flex flex-col space-y-2 p-6 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-sm font-semibold text-muted-foreground">This Month</span>
                        <span className="text-3xl font-bold">{stats.thisMonth}</span>
                      </div>
                      <div className="flex flex-col space-y-2 p-6 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-sm font-semibold text-muted-foreground">Total P&L</span>
                        <span className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faShield} className="h-5 w-5" />
                    Risk Management
                  </CardTitle>
                  <CardDescription>
                    Configure risk parameters and position sizing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Max Risk per Trade (%)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          value={riskPerTrade}
                          onChange={(e) => setRiskPerTrade(e.target.value)}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Recommended: 1-2% for conservative trading
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Position Size Calculator</Label>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex justify-between text-sm">
                          <span>Max Risk Amount:</span>
                          <span className="font-medium">
                            ${((parseFloat(accountSize) * parseFloat(riskPerTrade)) / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span>Account Size:</span>
                          <span className="font-medium">${parseFloat(accountSize).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Risk Guidelines</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                        <div className="font-semibold text-primary">Conservative (1-2%)</div>
                        <div className="text-muted-foreground/85">Recommended for beginners and steady growth</div>
                      </div>
                      <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                        <div className="font-semibold text-primary">Moderate (2-3%)</div>
                        <div className="text-muted-foreground/85">For experienced traders with proven systems</div>
                      </div>
                      <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                        <div className="font-semibold text-primary">Aggressive (3-5%)</div>
                        <div className="text-muted-foreground/85">High risk, only for very experienced traders</div>
                      </div>
                      <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                        <div className="font-semibold text-destructive">Dangerous (5%+)</div>
                        <div className="text-muted-foreground/85">Not recommended - high blow-up risk</div>
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
                        checked={notifications.tradeAlerts}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, tradeAlerts: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Daily Performance Reports</Label>
                        <p className="text-sm text-muted-foreground">Daily summary of your trading activity</p>
                      </div>
                      <Switch
                        checked={notifications.dailyReports}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, dailyReports: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Performance Reports</Label>
                        <p className="text-sm text-muted-foreground">Weekly analysis of your trading performance</p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Risk Management Alerts</Label>
                        <p className="text-sm text-muted-foreground">Alerts when approaching risk limits</p>
                      </div>
                      <Switch
                        checked={notifications.riskAlerts}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, riskAlerts: checked }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="p-6 rounded-xl bg-muted/20 border border-border/50">
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faBell} className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">Browser Notifications</div>
                        <div className="text-sm text-muted-foreground/85 mt-1 leading-[1.6]">
                          Enable browser notifications to receive alerts even when TradeVault is not actively open. 
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
            
            <div className="flex justify-end pt-8">
              <Button onClick={saveSettings} size="lg" className="px-8 py-3 font-semibold">
                {saved ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
                    Settings Saved!
                  </>
                ) : (
                  'Save All Settings'
                )}
              </Button>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}