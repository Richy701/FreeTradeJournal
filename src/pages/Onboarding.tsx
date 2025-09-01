import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  faRocket
} from '@fortawesome/free-solid-svg-icons';

interface OnboardingData {
  experience: string;
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
  { id: 3, title: 'Account Setup', description: 'Configure your trading preferences', icon: faCog },
  { id: 4, title: 'Trading Data', description: 'Import your existing trades', icon: faDatabase },
  { id: 5, title: 'Goals', description: 'Set your trading objectives', icon: faBullseye },
  { id: 6, title: 'Complete', description: 'You\'re all set!', icon: faRocket }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({
    tradingGoals: [],
    manualTrades: [],
    dataImportOption: 'fresh'
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
        
        // Update the data with parsed trades
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

      // Save onboarding data
      localStorage.setItem('onboarding', JSON.stringify(onboardingData));
      localStorage.setItem('onboardingCompleted', 'true');

      // Convert manual trades to the app's trade format and save them
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
          pnlPercentage: 0, // We can calculate this if needed
          notes: 'Imported during onboarding',
          strategy: 'Manual Entry',
          tags: ['onboarding']
        }));

        // Save trades to localStorage
        localStorage.setItem('trades', JSON.stringify(formattedTrades));
      }

      // Save initial settings
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
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-primary/10">
                <FontAwesomeIcon icon={faChartLine} className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Welcome to TradeVault</h2>
              <p className="text-muted-foreground/85 max-w-md mx-auto leading-[1.6]">
                Let's set up your trading journal to track your performance and improve your results.
                This will only take a few minutes.
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Hi {user?.displayName?.split(' ')[0] || 'there'}! 👋
              </p>
              <Button 
                onClick={handleNext} 
                className="w-full h-12 rounded-xl font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg text-white"
              >
                Get Started
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Your Trading Experience</h2>
              <p className="text-muted-foreground/85">Help us personalize your experience</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How long have you been trading?</Label>
                <Select value={data.experience} onValueChange={(value) => setData(prev => ({ ...prev, experience: value }))}>
                  <SelectTrigger className="h-11">
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

              <div className="space-y-2">
                <Label>What's your risk tolerance?</Label>
                <Select value={data.riskTolerance} onValueChange={(value) => setData(prev => ({ ...prev, riskTolerance: value }))}>
                  <SelectTrigger className="h-11">
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

            <div className="flex flex-row flex-nowrap gap-3 sm:gap-4 pt-6 w-full">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="flex-1 h-12 rounded-xl font-medium min-w-0"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-1 h-12 rounded-xl font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg min-w-0"
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
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Account Preferences</h2>
              <p className="text-muted-foreground/85">Configure your trading setup</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountSize">Starting Account Size</Label>
                <div className="relative">
                  <Input
                    id="accountSize"
                    type="number"
                    placeholder="10000"
                    value={data.accountSize}
                    onChange={(e) => setData(prev => ({ ...prev, accountSize: e.target.value }))}
                    className="h-11 pl-8"
                  />
                  <FontAwesomeIcon icon={faDollarSign} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Currency</Label>
                <Select value={data.currency} onValueChange={(value) => setData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your currency" />
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
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={data.timezone} onValueChange={(value) => setData(prev => ({ ...prev, timezone: value }))}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your timezone" />
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
                    <SelectItem value="Asia/Tokyo">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                        Tokyo (JST)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-row flex-nowrap gap-3 sm:gap-4 pt-6 w-full">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="flex-1 h-12 rounded-xl font-medium min-w-0"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-1 h-12 rounded-xl font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg min-w-0"
                disabled={!data.accountSize || !data.currency || !data.timezone}
              >
                Continue
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Your Trading Data</h2>
              <p className="text-muted-foreground/85">Help us set up your journal with existing data</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentBalance">Current Account Balance</Label>
                <div className="relative">
                  <Input
                    id="currentBalance"
                    type="number"
                    placeholder="10000"
                    value={data.currentBalance || ''}
                    onChange={(e) => setData(prev => ({ ...prev, currentBalance: e.target.value }))}
                    className="h-11 pl-8"
                  />
                  <FontAwesomeIcon 
                    icon={getCurrencyIcon(data.currency || 'USD')} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  What's your current trading account balance?
                </p>
              </div>

              <div className="space-y-4">
                <Label>How would you like to get started?</Label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setData(prev => ({ ...prev, dataImportOption: 'fresh' }))}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                      data.dataImportOption === 'fresh'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Start Fresh</div>
                        <div className="text-sm text-muted-foreground">Begin with a clean trading journal</div>
                      </div>
                      {data.dataImportOption === 'fresh' && (
                        <FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setData(prev => ({ ...prev, dataImportOption: 'manual' }))}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                      data.dataImportOption === 'manual'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Add Recent Trades</div>
                        <div className="text-sm text-muted-foreground">Manually enter your last few trades</div>
                      </div>
                      {data.dataImportOption === 'manual' && (
                        <FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setData(prev => ({ ...prev, dataImportOption: 'upload' }))}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                      data.dataImportOption === 'upload'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Import CSV/Excel</div>
                        <div className="text-sm text-muted-foreground">Upload your trading history file</div>
                      </div>
                      {data.dataImportOption === 'upload' && (
                        <FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {data.dataImportOption === 'manual' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Recent Trades</Label>
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
                    >
                      Add Trade
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {(data.manualTrades || []).map((trade, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Symbol</Label>
                            <Input
                              placeholder="EURUSD"
                              value={trade.symbol}
                              onChange={(e) => {
                                const updatedTrades = [...(data.manualTrades || [])];
                                updatedTrades[index] = { ...trade, symbol: e.target.value };
                                setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                              }}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Side</Label>
                            <Select 
                              value={trade.side} 
                              onValueChange={(value: 'long' | 'short') => {
                                const updatedTrades = [...(data.manualTrades || [])];
                                updatedTrades[index] = { ...trade, side: value };
                                setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="long">Long</SelectItem>
                                <SelectItem value="short">Short</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Entry Price</Label>
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
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Exit Price</Label>
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
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">P&L</Label>
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
                              className="h-8"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex-1 mr-2">
                            <Label className="text-xs">Date</Label>
                            <Input
                              type="date"
                              value={trade.date}
                              onChange={(e) => {
                                const updatedTrades = [...(data.manualTrades || [])];
                                updatedTrades[index] = { ...trade, date: e.target.value };
                                setData(prev => ({ ...prev, manualTrades: updatedTrades }));
                              }}
                              className="h-8"
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
                            className="mt-4 text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {(data.manualTrades || []).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Click "Add Trade" to enter your recent trades</p>
                    </div>
                  )}
                </div>
              )}

              {data.dataImportOption === 'upload' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload Trading History</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
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
                        className={`cursor-pointer inline-flex flex-col items-center gap-2 ${
                          csvUploadState.isUploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="p-3 rounded-full bg-primary/10">
                          <FontAwesomeIcon icon={faArrowUp} className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">
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
                    <Alert variant="destructive">
                      <AlertDescription>{csvUploadState.uploadError}</AlertDescription>
                    </Alert>
                  )}

                  {csvUploadState.uploadSuccess && csvUploadState.parseResult && (
                    <Alert>
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

                  {csvUploadState.parseResult && csvUploadState.parseResult.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto">
                      <Label className="text-sm font-medium">Import Details:</Label>
                      <div className="mt-1 text-xs text-muted-foreground space-y-1">
                        {csvUploadState.parseResult.errors.slice(0, 5).map((error: string, index: number) => (
                          <div key={index}>• {error}</div>
                        ))}
                        {csvUploadState.parseResult.errors.length > 5 && (
                          <div>• ... and {csvUploadState.parseResult.errors.length - 5} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  {(data.manualTrades || []).length > 0 && (
                    <div className="space-y-2">
                      <Label>Imported Trades ({(data.manualTrades || []).length})</Label>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/20">
                        <div className="space-y-2 text-sm">
                          {(data.manualTrades || []).slice(0, 5).map((trade, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span>{trade.symbol} {trade.side.toUpperCase()}</span>
                              <span className={`font-medium ${parseFloat(trade.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${parseFloat(trade.pnl).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {(data.manualTrades || []).length > 5 && (
                            <div className="text-center text-muted-foreground">
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

            <div className="flex flex-row flex-nowrap gap-3 sm:gap-4 pt-6 w-full">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="flex-1 h-12 rounded-xl font-medium min-w-0"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-1 h-12 rounded-xl font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg min-w-0"
                disabled={!data.currentBalance || data.currentBalance.trim() === '' || parseFloat(data.currentBalance) <= 0}
              >
                Continue
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 5:
        const goals = [
          'Consistent monthly profits',
          'Improve win rate',
          'Reduce drawdowns',
          'Scale account size',
          'Learn new strategies',
          'Better risk management'
        ];

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Your Trading Goals</h2>
              <p className="text-muted-foreground/85">What do you want to achieve? (Select all that apply)</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {goals.map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                    (data.tradingGoals || []).includes(goal)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{goal}</span>
                    {(data.tradingGoals || []).includes(goal) && (
                      <FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-row flex-nowrap gap-3 sm:gap-4 pt-6 w-full">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="flex-1 h-12 rounded-xl font-medium min-w-0"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-1 h-12 rounded-xl font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg min-w-0"
                disabled={!data.tradingGoals?.length}
              >
                Continue
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-green-100 dark:bg-green-900/30">
                <FontAwesomeIcon icon={faCheck} className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">You're all set!</h2>
              <p className="text-muted-foreground/85 max-w-md mx-auto leading-[1.6]">
                Your TradeVault account is configured and ready to use. Start logging your trades and tracking your performance.
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={handleComplete} 
                className="w-full h-12 rounded-xl font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg text-white" 
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Enter TradeVault'}
              </Button>
              <p className="text-xs text-muted-foreground">
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration - hidden on mobile */}
      <div className="absolute inset-0 -z-10 hidden sm:block">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="w-full max-w-2xl space-y-8 relative min-w-0">
        {/* Logo and brand */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Welcome to TradeVault
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Let's get your trading journal set up in just a few steps
          </p>
        </div>

        {/* Modern progress indicator */}
        <div className="space-y-6">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-foreground">Step {currentStep} of {STEPS.length}</span>
            <span className="text-muted-foreground">{Math.round(progressPercentage)}% complete</span>
          </div>
          
          {/* Enhanced Step indicators with icons */}
          <div className="flex justify-center space-x-4 mb-6">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center space-y-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ${
                    index + 1 < currentStep
                      ? 'bg-primary text-white shadow-lg transform scale-100 animate-in zoom-in-50 duration-300'
                      : index + 1 === currentStep
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg scale-110 animate-pulse'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 transition-colors'
                  }`}
                >
                  {index + 1 < currentStep ? (
                    <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 animate-in zoom-in-50 duration-300" />
                  ) : index + 1 === currentStep && loading ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={step.icon} className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  index + 1 <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-3 bg-muted rounded-full overflow-hidden"
          />
        </div>

        {/* Content card with modern design */}
        <Card className="border-0 shadow-2xl bg-background/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-6 pt-6 sm:pt-8 px-4 sm:px-8">
            <div className="text-center space-y-3">
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                {STEPS[currentStep - 1]?.title}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                {STEPS[currentStep - 1]?.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className={`px-4 sm:px-8 pb-6 sm:pb-8 ${stepAnimation}`}>
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}