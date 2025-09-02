import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts, type TradingAccount } from '@/contexts/account-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseCSV, validateCSVFile } from '@/utils/csv-parser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faArrowRight, 
  faArrowLeft, 
  faCheck,
  faDollarSign,
  faEuroSign,
  faPoundSign,
  faYenSign,
  faGlobe,
  faClock,
  faArrowUp,
  faSpinner,
  faCheckCircle,
  faUser,
  faCog,
  faDatabase,
  faBullseye,
  faRocket,
  faBuilding
} from '@fortawesome/free-solid-svg-icons';

interface OnboardingData {
  experience: string;
  accountName: string;
  accountType: TradingAccount['type'];
  broker: string;
  accountSize: string;
  currency: string;
  timezone: string;
  riskTolerance: string;
  currentBalance: string;
  dataImportOption: 'manual' | 'fresh' | 'upload';
  manualTrades: Array<{
    symbol: string;
    side: 'long' | 'short';
    entryPrice: string;
    exitPrice: string;
    quantity: string;
    pnl: string;
    date: string;
  }>;
  tradingGoals: string[];
  completedAt: string;
}

const STEPS = [
  { id: 1, title: 'Welcome', description: 'Let\'s get you started', icon: faChartLine },
  { id: 2, title: 'Experience', description: 'Tell us about your trading background', icon: faUser },
  { id: 3, title: 'Account', description: 'Set up your trading account', icon: faBuilding },
  { id: 4, title: 'Preferences', description: 'Configure your settings', icon: faCog },
  { id: 5, title: 'Trading Data', description: 'Import your existing trades', icon: faDatabase },
  { id: 6, title: 'Goals', description: 'Set your trading objectives', icon: faBullseye },
  { id: 7, title: 'Complete', description: 'You\'re all set!', icon: faRocket }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({
    tradingGoals: [],
    manualTrades: [],
    dataImportOption: 'fresh',
    accountName: 'Main Account',
    accountType: 'demo',
    broker: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [stepAnimation, setStepAnimation] = useState('');
  const [csvUploadState, setCsvUploadState] = useState({
    isUploading: false,
    uploadSuccess: false,
    uploadError: '',
    parseResult: null as any,
  });

  const { user } = useAuth();
  const { addAccount } = useAccounts();
  const navigate = useNavigate();

  // Helper function to get currency icon
  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'USD': return faDollarSign;
      case 'EUR': return faEuroSign;
      case 'GBP': return faPoundSign;
      case 'JPY': return faYenSign;
      default: return faDollarSign;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setStepAnimation('animate-out slide-out-to-left-2 duration-300');
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setStepAnimation('animate-in slide-in-from-right-2 duration-300');
      }, 150);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStepAnimation('animate-out slide-out-to-right-2 duration-300');
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setStepAnimation('animate-in slide-in-from-left-2 duration-300');
      }, 150);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvUploadState({
      isUploading: true,
      uploadSuccess: false,
      uploadError: '',
      parseResult: null
    });

    try {
      const content = await validateCSVFile(file);
      const result = parseCSV(content);

      if (result.success) {
        setCsvUploadState({
          isUploading: false,
          uploadSuccess: true,
          uploadError: '',
          parseResult: result
        });

        setData(prev => ({
          ...prev,
          manualTrades: result.trades
        }));

      } else {
        setCsvUploadState({
          isUploading: false,
          uploadSuccess: false,
          uploadError: result.errors.join('; '),
          parseResult: result
        });
      }

    } catch (error) {
      setCsvUploadState({
        isUploading: false,
        uploadSuccess: false,
        uploadError: error instanceof Error ? error.message : 'Failed to parse CSV file',
        parseResult: null
      });
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const onboardingData: OnboardingData = {
        ...data,
        completedAt: new Date().toISOString()
      } as OnboardingData;

      if (data.accountName && data.accountType && data.broker && data.currency) {
        addAccount({
          name: data.accountName,
          type: data.accountType,
          broker: data.broker,
          currency: data.currency,
          balance: data.currentBalance ? parseFloat(data.currentBalance) : undefined,
          isDefault: true
        });
      }

      localStorage.setItem('onboarding', JSON.stringify(onboardingData));
      localStorage.setItem('onboardingCompleted', 'true');

      if (data.manualTrades && data.manualTrades.length > 0) {
        const formattedTrades = data.manualTrades.map((trade, index) => ({
          id: `onboarding-${index}-${Date.now()}`,
          symbol: trade.symbol,
          side: trade.side,
          entryPrice: parseFloat(trade.entryPrice) || 0,
          exitPrice: parseFloat(trade.exitPrice) || 0,
          quantity: parseFloat(trade.quantity) || 1,
          entryTime: new Date(trade.date + 'T09:00:00'),
          exitTime: new Date(trade.date + 'T15:00:00'),
          commission: 0,
          pnl: parseFloat(trade.pnl) || 0,
          pnlPercentage: 0,
          notes: 'Imported during onboarding',
          strategy: 'Manual Entry',
          tags: ['onboarding']
        }));

        localStorage.setItem('trades', JSON.stringify(formattedTrades));
      }

      const initialSettings = {
        defaultCommission: '0',
        currency: data.currency || 'USD',
        timezone: data.timezone || 'America/New_York',
        riskPerTrade: data.riskTolerance === 'conservative' ? '1.5' :
                     data.riskTolerance === 'moderate' ? '2.5' : '4',
        accountSize: data.currentBalance || '10000',
        notifications: {
          tradeAlerts: true,
          dailyReports: false,
          weeklyReports: true,
          riskAlerts: true
        },
        displaySettings: {
          showPnlAsPercentage: false,
          hideSmallTrades: false,
          defaultChartPeriod: '1M'
        }
      };

      localStorage.setItem('settings', JSON.stringify(initialSettings));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (goal: string) => {
    const currentGoals = data.tradingGoals || [];
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];

    setData(prev => ({ ...prev, tradingGoals: updatedGoals }));
  };

  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6 py-4">
            <div className="flex items-center justify-center">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-inner">
                <FontAwesomeIcon icon={faChartLine} className="h-16 w-16 text-primary" />
              </div>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome to TradeVault</h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Let's set up your trading journal to track your performance and improve your results.
                This will only take a few minutes.
              </p>
            </div>
            <div className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Hi {user?.displayName?.split(' ')[0] || 'there'}! 👋
              </p>
              <Button 
                onClick={handleNext} 
                size="lg"
                className="w-full max-w-sm mx-auto h-14 text-base rounded-2xl font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-xl transition-all duration-300 hover:scale-105"
              >
                Get Started
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Trading Experience</h2>
              <p className="text-muted-foreground text-base">Help us personalize your experience</p>
            </div>

            <div className="space-y-6 max-w-lg mx-auto">
              <div className="space-y-3">
                <Label className="text-base font-medium">How long have you been trading?</Label>
                <Select value={data.experience} onValueChange={(value) => setData(prev => ({ ...prev, experience: value }))}>
                  <SelectTrigger className="h-14 text-base rounded-xl">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Just starting out (0-1 years)</SelectItem>
                    <SelectItem value="intermediate">Some experience (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Experienced (3-5 years)</SelectItem>
                    <SelectItem value="expert">Very experienced (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">What's your risk tolerance?</Label>
                <Select value={data.riskTolerance} onValueChange={(value) => setData(prev => ({ ...prev, riskTolerance: value }))}>
                  <SelectTrigger className="h-14 text-base rounded-xl">
                    <SelectValue placeholder="Select your risk preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative (1-2% per trade)</SelectItem>
                    <SelectItem value="moderate">Moderate (2-3% per trade)</SelectItem>
                    <SelectItem value="aggressive">Aggressive (3-5% per trade)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8 max-w-lg mx-auto">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg"
                disabled={!data.experience || !data.riskTolerance}
              >
                Continue
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Set Up Your Trading Account</h2>
              <p className="text-muted-foreground text-base">Tell us about your trading account</p>
            </div>

            <div className="space-y-6 max-w-lg mx-auto">
              <div className="space-y-3">
                <Label className="text-base font-medium">Account Name</Label>
                <Input
                  placeholder="e.g., Main Live Account, FTMO Challenge"
                  value={data.accountName}
                  onChange={(e) => setData(prev => ({ ...prev, accountName: e.target.value }))}
                  className="h-14 text-base rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Account Type</Label>
                <Select value={data.accountType} onValueChange={(value: TradingAccount['type']) => setData(prev => ({ ...prev, accountType: value }))}>
                  <SelectTrigger className="h-14 text-base rounded-xl">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo Account</SelectItem>
                    <SelectItem value="live">Live Account</SelectItem>
                    <SelectItem value="prop-firm">Prop Firm</SelectItem>
                    <SelectItem value="paper">Paper Trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Broker</Label>
                <Select value={data.broker} onValueChange={(value) => setData(prev => ({ ...prev, broker: value }))}>
                  <SelectTrigger className="h-14 text-base rounded-xl">
                    <SelectValue placeholder="Select your broker" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
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

              <div className="space-y-3">
                <Label className="text-base font-medium">Currency</Label>
                <Select value={data.currency} onValueChange={(value) => setData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger className="h-14 text-base rounded-xl">
                    <SelectValue placeholder="Select your currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4" />
                        <span>USD ($)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="EUR">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faEuroSign} className="h-4 w-4" />
                        <span>EUR (€)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="GBP">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faPoundSign} className="h-4 w-4" />
                        <span>GBP (£)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="JPY">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faYenSign} className="h-4 w-4" />
                        <span>JPY (¥)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8 max-w-lg mx-auto">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg"
                disabled={!data.accountName || !data.accountType || !data.broker || !data.currency}
              >
                Continue
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Preferences</h2>
              <p className="text-muted-foreground text-base">Configure your trading setup</p>
            </div>

            <div className="space-y-6 max-w-lg mx-auto">
              <div className="space-y-3">
                <Label className="text-base font-medium">Starting Account Size</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="10000"
                    value={data.accountSize}
                    onChange={(e) => setData(prev => ({ ...prev, accountSize: e.target.value }))}
                    className="h-14 text-base rounded-xl pl-12"
                  />
                  <FontAwesomeIcon icon={faDollarSign} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Timezone</Label>
                <Select value={data.timezone} onValueChange={(value) => setData(prev => ({ ...prev, timezone: value }))}>
                  <SelectTrigger className="h-14 text-base rounded-xl">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                        <span>Eastern Time (ET)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                        <span>Central Time (CT)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                        <span>Pacific Time (PT)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Europe/London">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                        <span>London (GMT)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Asia/Tokyo">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                        <span>Tokyo (JST)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8 max-w-lg mx-auto">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg"
                disabled={!data.accountSize || !data.timezone}
              >
                Continue
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Trading Data</h2>
              <p className="text-muted-foreground text-base">Help us set up your journal with existing data</p>
            </div>

            <div className="space-y-8 max-w-lg mx-auto">
              <div className="space-y-3">
                <Label className="text-base font-medium">Current Account Balance</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="10000"
                    value={data.currentBalance || ''}
                    onChange={(e) => setData(prev => ({ ...prev, currentBalance: e.target.value }))}
                    className="h-14 text-base rounded-xl pl-12"
                  />
                  <FontAwesomeIcon 
                    icon={getCurrencyIcon(data.currency || 'USD')} 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  What's your current trading account balance?
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">How would you like to get started?</Label>
                <div className="space-y-3">
                  {[
                    { 
                      key: 'fresh', 
                      title: 'Start Fresh', 
                      description: 'Begin with a clean trading journal' 
                    },
                    { 
                      key: 'manual', 
                      title: 'Add Recent Trades', 
                      description: 'Manually enter your last few trades' 
                    },
                    { 
                      key: 'upload', 
                      title: 'Import CSV/Excel', 
                      description: 'Upload your trading history file' 
                    }
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setData(prev => ({ ...prev, dataImportOption: option.key }))}
                      className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                        data.dataImportOption === option.key
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-semibold text-base">{option.title}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                        {data.dataImportOption === option.key && (
                          <FontAwesomeIcon icon={faCheck} className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {data.dataImportOption === 'manual' && (
                <div className="space-y-6 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Recent Trades</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newTrade = {
                          symbol: '',
                          side: 'long' as const,
                          entryPrice: '',
                          exitPrice: '',
                          quantity: '',
                          pnl: '',
                          date: new Date().toISOString().split('T')[0]
                        };
                        setData(prev => ({
                          ...prev,
                          manualTrades: [...(prev.manualTrades || []), newTrade]
                        }));
                      }}
                      className="h-9 rounded-xl"
                    >
                      Add Trade
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {(data.manualTrades || []).map((trade, index) => (
                      <div key={index} className="p-4 border rounded-2xl bg-muted/20 space-y-4">
                        {/* Mobile-first layout */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Symbol</Label>
                              <Input
                                placeholder="EURUSD"
                                value={trade.symbol}
                                onChange={(e) => {
                                  const updatedTrades = [...(data.manualTrades || [])];
                                  updatedTrades[index] = { ...trade, symbol: e.target.value };
                                  setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                                }}
                                className="h-10 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Side</Label>
                              <Select 
                                value={trade.side} 
                                onValueChange={(value: 'long' | 'short') => {
                                  const updatedTrades = [...(data.manualTrades || [])];
                                  updatedTrades[index] = { ...trade, side: value };
                                  setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                                }}
                              >
                                <SelectTrigger className="h-10 rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="long">Long</SelectItem>
                                  <SelectItem value="short">Short</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Entry Price</Label>
                              <Input
                                type="number"
                                step="0.0001"
                                placeholder="1.0850"
                                value={trade.entryPrice}
                                onChange={(e) => {
                                  const updatedTrades = [...(data.manualTrades || [])];
                                  updatedTrades[index] = { ...trade, entryPrice: e.target.value };
                                  setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                                }}
                                className="h-10 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Exit Price</Label>
                              <Input
                                type="number"
                                step="0.0001"
                                placeholder="1.0890"
                                value={trade.exitPrice}
                                onChange={(e) => {
                                  const updatedTrades = [...(data.manualTrades || [])];
                                  updatedTrades[index] = { ...trade, exitPrice: e.target.value };
                                  setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                                }}
                                className="h-10 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">P&L</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="150"
                                value={trade.pnl}
                                onChange={(e) => {
                                  const updatedTrades = [...(data.manualTrades || [])];
                                  updatedTrades[index] = { ...trade, pnl: e.target.value };
                                  setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                                }}
                                className="h-10 rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm font-medium">Date</Label>
                              <Input
                                type="date"
                                value={trade.date}
                                onChange={(e) => {
                                  const updatedTrades = [...(data.manualTrades || [])];
                                  updatedTrades[index] = { ...trade, date: e.target.value };
                                  setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                                }}
                                className="h-10 rounded-xl"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updatedTrades = [...(data.manualTrades || [])];
                                updatedTrades.splice(index, 1);
                                setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                              }}
                              className="h-10 text-destructive hover:text-destructive rounded-xl whitespace-nowrap"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(data.manualTrades || []).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl">
                      <p>Click "Add Trade" to enter your recent trades</p>
                    </div>
                  )}
                </div>
              )}

              {data.dataImportOption === 'upload' && (
                <div className="space-y-6 border-t pt-6">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Upload Trading History</Label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleCSVUpload}
                        disabled={csvUploadState.isUploading}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className={`cursor-pointer inline-flex flex-col items-center gap-4 ${
                          csvUploadState.isUploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="p-4 rounded-full bg-primary/10">
                          <FontAwesomeIcon icon={faArrowUp} className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="font-semibold text-lg">
                            {csvUploadState.isUploading ? 'Processing...' : 'Choose CSV file'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Supports MT4, MT5, and most trading platforms
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {csvUploadState.uploadError && (
                    <Alert variant="destructive" className="rounded-xl">
                      <AlertDescription>{csvUploadState.uploadError}</AlertDescription>
                    </Alert>
                  )}

                  {csvUploadState.uploadSuccess && csvUploadState.parseResult && (
                    <Alert className="rounded-xl">
                      <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                      <AlertDescription>
                        Successfully imported {csvUploadState.parseResult.summary.successfulParsed} trades
                        {csvUploadState.parseResult.summary.dateRange && (
                          <span> from {csvUploadState.parseResult.summary.dateRange.earliest} to {csvUploadState.parseResult.summary.dateRange.latest}</span>
                        )}
                        {csvUploadState.parseResult.summary.failed > 0 && (
                          <span>. {csvUploadState.parseResult.summary.failed} rows had issues and were skipped.</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {(data.manualTrades || []).length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Imported Trades ({(data.manualTrades || []).length})</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-xl p-4 bg-muted/20">
                        <div className="space-y-3">
                          {(data.manualTrades || []).slice(0, 5).map((trade, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
                              <div className="font-medium">{trade.symbol} {trade.side.toUpperCase()}</div>
                              <div className={`font-semibold ${parseFloat(trade.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${parseFloat(trade.pnl).toFixed(2)}
                              </div>
                            </div>
                          ))}
                          {(data.manualTrades || []).length > 5 && (
                            <div className="text-center text-muted-foreground pt-2">
                              ... and {(data.manualTrades || []).length - 5} more trades
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8 max-w-lg mx-auto">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg"
                disabled={!data.currentBalance || data.currentBalance.trim() === '' || parseFloat(data.currentBalance) <= 0}
              >
                Continue
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 6:
        const goals = [
          'Consistent monthly profits',
          'Improve win rate',
          'Reduce drawdowns',
          'Scale account size',
          'Learn new strategies',
          'Better risk management'
        ];

        return (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Trading Goals</h2>
              <p className="text-muted-foreground text-base">What do you want to achieve? (Select all that apply)</p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
              {goals.map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                    (data.tradingGoals || []).includes(goal)
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base">{goal}</span>
                    {(data.tradingGoals || []).includes(goal) && (
                      <FontAwesomeIcon icon={faCheck} className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8 max-w-lg mx-auto">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                size="lg"
                className="flex-1 h-14 text-base rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg"
                disabled={!data.tradingGoals?.length}
              >
                Continue
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="text-center space-y-8 py-4">
            <div className="flex items-center justify-center">
              <div className="p-6 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 shadow-inner">
                <FontAwesomeIcon icon={faCheck} className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">You're all set!</h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Your TradeVault account is configured and ready to use. Start logging your trades and tracking your performance.
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <Button 
                onClick={handleComplete} 
                size="lg"
                className="w-full max-w-sm mx-auto h-14 text-base rounded-2xl font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-xl transition-all duration-300 hover:scale-105" 
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Enter TradeVault'}
              </Button>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You can always change these settings later in your account preferences.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      {/* Background decoration - hidden on mobile */}
      <div className="absolute inset-0 -z-10 hidden sm:block">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/3 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-300/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-xl">
              <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Welcome to TradeVault
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
              Let's get your trading journal set up in just a few steps
            </p>
          </div>
        </div>

        {/* Progress section */}
        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="flex justify-between text-sm font-medium px-2">
            <span className="text-foreground">Step {currentStep} of {STEPS.length}</span>
            <span className="text-muted-foreground">{Math.round(progressPercentage)}% complete</span>
          </div>

          {/* Responsive step indicators */}
          <div className="flex justify-center">
            <div className="flex items-start space-x-3 sm:space-x-6 overflow-x-auto px-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center space-y-2 flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      index + 1 < currentStep
                        ? 'bg-primary text-white shadow-lg'
                        : index + 1 === currentStep
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1 < currentStep ? (
                      <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5" />
                    ) : index + 1 === currentStep && loading ? (
                      <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={step.icon} className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center min-w-16 leading-tight transition-colors duration-300 ${
                    index + 1 <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Progress 
            value={progressPercentage} 
            className="h-2 bg-muted/50 rounded-full overflow-hidden"
          />
        </div>

        {/* Content card */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm rounded-3xl overflow-hidden max-w-2xl mx-auto">
          <CardContent className={`p-6 sm:p-8 ${stepAnimation}`}>
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}