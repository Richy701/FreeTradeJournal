import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts, type TradingAccount } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { SUPPORTED_CURRENCIES, DEFAULT_VALUES } from '@/constants/trading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, ArrowRight, Check, Rocket, SkipForward, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';

interface SimplifiedOnboardingData {
  accountName: string;
  accountType: TradingAccount['type'];
  broker: string;
  currency: string;
  currentBalance: string;
}

const STEPS = [
  { id: 1, title: 'Welcome' },
  { id: 2, title: 'Setup' },
  { id: 3, title: 'Ready' }
];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { duration: 0.35, ease: [0.23, 0.86, 0.39, 0.96] as const },
      opacity: { duration: 0.25 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: {
      x: { duration: 0.35, ease: [0.23, 0.86, 0.39, 0.96] as const },
      opacity: { duration: 0.2 },
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 0.86, 0.39, 0.96] as const,
    },
  },
};

export default function OnboardingSimplified() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<SimplifiedOnboardingData>({
    accountName: DEFAULT_VALUES.ACCOUNT_NAME,
    accountType: DEFAULT_VALUES.ACCOUNT_TYPE,
    broker: '',
    currency: DEFAULT_VALUES.CURRENCY,
    currentBalance: DEFAULT_VALUES.STARTING_BALANCE.toString()
  });
  const [loading, setLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { addAccount } = useAccounts();
  const userStorage = useUserStorage();
  const navigate = useNavigate();

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const handleSkipOnboarding = async () => {
    setLoading(true);

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

  const activeStepVariants = shouldReduceMotion ? {
    enter: { opacity: 1, x: 0 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 1, x: 0 },
  } : stepVariants;

  const activeFadeUpItem = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 },
  } : fadeUpItem;

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step-1"
            custom={direction}
            variants={activeStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.div
              className="space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <div className="text-center space-y-4">
                <motion.h2 variants={activeFadeUpItem} className="text-3xl font-bold">
                  Welcome,{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground/90 to-primary/70">
                    {user?.displayName?.split(' ')[0] || 'Trader'}
                  </span>
                  !
                </motion.h2>
                <motion.p variants={activeFadeUpItem} className="text-muted-foreground max-w-md mx-auto">
                  Let's quickly set up your account. This will only take a minute.
                </motion.p>
              </div>

              <motion.div variants={activeFadeUpItem} className="space-y-4">
                <Button
                  onClick={() => goToStep(2)}
                  size="lg"
                  className="w-full"
                >
                  Quick Setup (1 minute)
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  onClick={handleSkipOnboarding}
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip for Now
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You can always configure your settings later
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step-2"
            custom={direction}
            variants={activeStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.div
              className="space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={activeFadeUpItem} className="flex items-center gap-3">
                <button
                  onClick={() => goToStep(1)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold">Quick Account Setup</h2>
                  <p className="text-sm text-muted-foreground">
                    Just the essentials to get you started
                  </p>
                </div>
              </motion.div>

              <motion.div variants={activeFadeUpItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    className="h-11"
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
                      <SelectTrigger className="h-11">
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
                      <SelectTrigger className="h-11">
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
                    className="h-11"
                    value={data.broker}
                    onChange={(e) => setData({ ...data, broker: e.target.value })}
                    placeholder="e.g., FTMO, Apex, TopStep…"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balance">Starting Balance (Optional)</Label>
                  <Input
                    id="balance"
                    className="h-11"
                    type="number"
                    value={data.currentBalance}
                    onChange={(e) => setData({ ...data, currentBalance: e.target.value })}
                    placeholder={DEFAULT_VALUES.STARTING_BALANCE.toString()}
                  />
                </div>
              </motion.div>

              <motion.div variants={activeFadeUpItem} className="flex gap-3">
                <Button
                  onClick={handleSkipOnboarding}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Skip Setup
                </Button>
                <Button
                  onClick={() => goToStep(3)}
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step-3"
            custom={direction}
            variants={activeStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.div
              className="space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <div className="text-center space-y-4">
                <motion.div
                  className="mx-auto w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                >
                  <Check className="h-8 w-8 text-green-500" />
                </motion.div>
                <motion.h2 variants={activeFadeUpItem} className="text-3xl font-bold">
                  You're All Set!
                </motion.h2>
                <motion.p variants={activeFadeUpItem} className="text-muted-foreground max-w-md mx-auto">
                  Your account is ready. Start tracking your trades and improve your performance!
                </motion.p>
              </div>

              <motion.div
                variants={activeFadeUpItem}
                className="bg-muted/30 backdrop-blur-sm rounded-lg p-4 space-y-2 border border-border/50"
              >
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
              </motion.div>

              <motion.div variants={activeFadeUpItem} className="space-y-3">
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
                      <Rocket className="mr-2 h-4 w-4" />
                      Enter FreeTradeJournal
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => goToStep(2)}
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back to Setup
                </Button>
              </motion.div>

              <motion.p variants={activeFadeUpItem} className="text-xs text-center text-muted-foreground">
                You can import trades and customize settings from the dashboard
              </motion.p>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50 animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000" />

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">FreeTradeJournal</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                {STEPS.map((step) => (
                  <span
                    key={step.id}
                    className={currentStep >= step.id ? 'text-foreground font-medium' : ''}
                  >
                    {step.title}
                  </span>
                ))}
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={false}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4, ease: [0.23, 0.86, 0.39, 0.96] as const }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 min-h-[380px] relative">
            <AnimatePresence custom={direction} mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
