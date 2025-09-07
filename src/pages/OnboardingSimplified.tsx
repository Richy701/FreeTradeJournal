import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts, type TradingAccount } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { SUPPORTED_CURRENCIES, DEFAULT_VALUES } from '@/constants/trading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faArrowRight, 
  faCheck,
  faRocket,
  faBuilding,
  faForward
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface SimplifiedOnboardingData {
  accountName: string;
  accountType: TradingAccount['type'];
  broker: string;
  currency: string;
  currentBalance: string;
}

const STEPS = [
  { id: 1, title: 'Welcome', description: 'Welcome to FreeTradeJournal' },
  { id: 2, title: 'Quick Setup', description: 'Basic account information' },
  { id: 3, title: 'Ready!', description: 'Start tracking your trades' }
];

export default function OnboardingSimplified() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<SimplifiedOnboardingData>({
    accountName: DEFAULT_VALUES.ACCOUNT_NAME,
    accountType: DEFAULT_VALUES.ACCOUNT_TYPE,
    broker: '',
    currency: DEFAULT_VALUES.CURRENCY,
    currentBalance: DEFAULT_VALUES.STARTING_BALANCE.toString()
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addAccount } = useAccounts();
  const userStorage = useUserStorage();
  const navigate = useNavigate();

  const handleSkipOnboarding = async () => {
    setLoading(true);
    
    // Create a default account with minimal info
    const defaultAccount = {
      name: DEFAULT_VALUES.ACCOUNT_NAME,
      type: DEFAULT_VALUES.ACCOUNT_TYPE,
      broker: 'Not specified',
      currency: DEFAULT_VALUES.CURRENCY,
      balance: DEFAULT_VALUES.STARTING_BALANCE,
      isDefault: true
    };

    try {
      await addAccount(defaultAccount);
      
      // Mark onboarding as completed
      userStorage.setItem('onboardingCompleted', 'true');
      userStorage.setItem('onboarding', JSON.stringify({
        skipped: true,
        completedAt: new Date().toISOString()
      }));
      
      toast.success('Welcome to FreeTradeJournal! You can update your settings anytime.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to setup account. Please try again.');
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    const newAccount = {
      name: data.accountName || DEFAULT_VALUES.ACCOUNT_NAME,
      type: data.accountType,
      broker: data.broker || 'Not specified',
      currency: data.currency,
      balance: parseFloat(data.currentBalance) || DEFAULT_VALUES.STARTING_BALANCE,
      isDefault: true
    };

    try {
      await addAccount(newAccount);
      
      // Save onboarding data
      const onboardingData = {
        ...data,
        completedAt: new Date().toISOString()
      };
      
      userStorage.setItem('onboarding', JSON.stringify(onboardingData));
      userStorage.setItem('onboardingCompleted', 'true');
      
      toast.success('Setup complete! Welcome to FreeTradeJournal!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to complete setup. Please try again.');
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faChartLine} className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Welcome, {user?.displayName || 'Trader'}!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's quickly set up your account. This will only take a minute.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={() => setCurrentStep(2)}
                size="lg"
                className="w-full"
              >
                Quick Setup (1 minute)
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                onClick={handleSkipOnboarding}
                variant="outline"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                <FontAwesomeIcon icon={faForward} className="mr-2 h-4 w-4" />
                Skip for Now
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                You can always configure your settings later
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Quick Account Setup</h2>
              <p className="text-muted-foreground">
                Just the essentials to get you started
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={data.accountName}
                  onChange={(e) => setData({ ...data, accountName: e.target.value })}
                  placeholder={`e.g., ${DEFAULT_VALUES.ACCOUNT_NAME}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select 
                    value={data.accountType} 
                    onValueChange={(value: TradingAccount['type']) => 
                      setData({ ...data, accountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live Account</SelectItem>
                      <SelectItem value="demo">Demo Account</SelectItem>
                      <SelectItem value="prop-firm">Prop Firm Account</SelectItem>
                      <SelectItem value="paper">Paper Trading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={data.currency} 
                    onValueChange={(value) => setData({ ...data, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="broker">Broker (Optional)</Label>
                <Input
                  id="broker"
                  value={data.broker}
                  onChange={(e) => setData({ ...data, broker: e.target.value })}
                  placeholder="e.g., FTMO, Apex, TopStep"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">Starting Balance (Optional)</Label>
                <Input
                  id="balance"
                  type="number"
                  value={data.currentBalance}
                  onChange={(e) => setData({ ...data, currentBalance: e.target.value })}
                  placeholder={DEFAULT_VALUES.STARTING_BALANCE.toString()}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleSkipOnboarding}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Skip Setup
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                className="flex-1"
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
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCheck} className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold">You're All Set!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your account is ready. Start tracking your trades and improve your performance!
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Quick Summary:</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account:</span>
                  <span>{data.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{data.accountType}</span>
                </div>
                {data.broker && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Broker:</span>
                    <span>{data.broker}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span>{data.currency}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleComplete}
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <FontAwesomeIcon icon={faRocket} className="mr-2 h-4 w-4" />
                  Enter FreeTradeJournal
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You can import trades and customize settings from the dashboard
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">FreeTradeJournal</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}