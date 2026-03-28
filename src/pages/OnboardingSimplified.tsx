import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useAccounts, type TradingAccount } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { SUPPORTED_CURRENCIES, DEFAULT_VALUES } from '@/constants/trading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, ArrowRight, Check, Rocket, ChevronLeft, Wallet, Monitor, Building2, FileText } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface SimplifiedOnboardingData {
  experienceLevel: string;
  accountName: string;
  accountType: TradingAccount['type'];
  broker: string;
  currency: string;
  currentBalance: string;
}

const STEPS = [
  { id: 1, title: 'Welcome' },
  { id: 2, title: 'Experience' },
  { id: 3, title: 'Account' },
  { id: 4, title: 'Details' },
  { id: 5, title: 'Ready' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', emoji: '🌱', label: 'Just Starting Out', sub: 'Under 1 year' },
  { value: 'developing', emoji: '📈', label: 'Building Skills', sub: '1–3 years' },
  { value: 'experienced', emoji: '⚡', label: 'Battle Tested', sub: '3–5 years' },
  { value: 'veteran', emoji: '🏆', label: 'Veteran Trader', sub: '5+ years' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'live' as TradingAccount['type'], icon: Wallet, label: 'Live Account', sub: 'Real money' },
  { value: 'demo' as TradingAccount['type'], icon: Monitor, label: 'Demo Account', sub: 'Practice mode' },
  { value: 'prop-firm' as TradingAccount['type'], icon: Building2, label: 'Prop Firm', sub: 'Funded account' },
  { value: 'paper' as TradingAccount['type'], icon: FileText, label: 'Paper Trading', sub: 'Simulation' },
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
    transition: { staggerChildren: 0.08 },
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
    experienceLevel: '',
    accountName: DEFAULT_VALUES.ACCOUNT_NAME,
    accountType: DEFAULT_VALUES.ACCOUNT_TYPE,
    broker: '',
    currency: DEFAULT_VALUES.CURRENCY,
    currentBalance: DEFAULT_VALUES.STARTING_BALANCE.toString(),
  });
  const [loading, setLoading] = useState(false);
  const [checkingRemoteData, setCheckingRemoteData] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { isPro, isLoading: isProLoading } = useProStatus();
  const { addAccount } = useAccounts();
  const userStorage = useUserStorage();
  const navigate = useNavigate();

  // Persist onboarding completion to Firestore for all users so it survives localStorage clearing
  const persistOnboardingToFirestore = useCallback(async () => {
    if (!user) return;
    try {
      const { getFirebaseFirestore } = await import('@/lib/firebase-lazy');
      const db = await getFirebaseFirestore();
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', user.uid), { onboardingCompleted: true }, { merge: true });
    } catch {
      // Non-critical — localStorage is the primary source of truth
    }
  }, [user]);

  // CRITICAL: Check Firestore for existing data before allowing onboarding
  // Prevents account ID mismatches that orphan trades
  useEffect(() => {
    async function checkForExistingData() {
      if (!user || isProLoading) return;
      if (!isPro) {
        setCheckingRemoteData(false);
        return;
      }

      try {
        // Check if user already has local data
        const hasLocalAccounts = userStorage.getItem('accounts') !== null;
        const hasLocalTrades = userStorage.getItem('trades') !== null;

        if (hasLocalAccounts && hasLocalTrades) {
          // User has local data, no need to check remote
          setCheckingRemoteData(false);
          return;
        }

        // Pro user without local data - check Firestore for existing trades
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const getSyncDataFn = httpsCallable(functions, 'getSyncData');

        const result = await getSyncDataFn({}) as { data: { data: Record<string, string> } };
        const remoteData = result.data.data;

        const remoteTrades = remoteData['trades'];
        const remoteAccounts = remoteData['accounts'];

        if (!remoteTrades || remoteTrades === '[]') {
          // No remote trades - new user, proceed with onboarding
          setCheckingRemoteData(false);
          return;
        }

        // Parse remote data
        const trades = JSON.parse(remoteTrades);
        const accounts = remoteAccounts ? JSON.parse(remoteAccounts) : [];

        if (trades.length > 0) {
          console.log(`[Onboarding] Found ${trades.length} existing trades in Firestore`);

          // Extract unique account IDs from trades
          const tradeAccountIds = new Set<string>();
          trades.forEach((trade: any) => {
            if (trade.accountId) tradeAccountIds.add(trade.accountId);
          });

          // Create missing accounts
          const existingAccountIds = new Set(accounts.map((a: any) => a.id));
          const missingAccountIds = [...tradeAccountIds].filter(id => !existingAccountIds.has(id));

          if (missingAccountIds.length > 0) {
            console.log(`[Onboarding] Creating ${missingAccountIds.length} missing accounts`);

            // Create accounts for orphaned trades
            for (const accId of missingAccountIds) {
              const tradesForAccount = trades.filter((t: any) => t.accountId === accId).length;
              const newAccount = {
                id: accId,
                name: `Recovered Account (${tradesForAccount} trades)`,
                type: 'demo' as const,
                broker: 'Unknown',
                currency: 'USD',
                initialBalance: 10000,
                createdAt: new Date().toISOString()
              };
              accounts.push(newAccount);
            }

            // Save fixed accounts back to Firestore
            const syncDataFn = httpsCallable(functions, 'syncData');
            await syncDataFn({ key: 'accounts', value: JSON.stringify(accounts) });
            console.log('[Onboarding] Fixed missing accounts in Firestore');
          }

          // Restore data locally
          userStorage.setItem('trades', remoteTrades);
          userStorage.setItem('accounts', JSON.stringify(accounts));

          // Mark onboarding as complete
          userStorage.setItem('onboardingCompleted', 'true');
          userStorage.setItem('onboarding', JSON.stringify({
            skipped: false,
            completedAt: new Date().toISOString(),
            autoRestored: true
          }));
          persistOnboardingToFirestore();

          toast.success(`Welcome back! Restored ${trades.length} trades across ${accounts.length} account${accounts.length > 1 ? 's' : ''}.`);
          navigate('/dashboard', { replace: true });
          return;
        }

        setCheckingRemoteData(false);
      } catch (error) {
        console.error('[Onboarding] Error checking remote data:', error);
        setCheckingRemoteData(false);
      }
    }

    checkForExistingData();
  }, [user, isPro, isProLoading, userStorage, addAccount, navigate]);

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
      persistOnboardingToFirestore();

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
      persistOnboardingToFirestore();

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

  // Progress bar shown from step 2 onward: step2=25%, step3=50%, step4=75%, step5=100%
  const progressPercent = currentStep > 1
    ? ((currentStep - 1) / (STEPS.length - 1)) * 100
    : 0;

  const selectionCardClass = (selected: boolean) =>
    `p-4 rounded-xl border text-left transition-all cursor-pointer ${
      selected
        ? 'border-primary bg-primary/5 ring-1 ring-primary'
        : 'border-border hover:border-primary/40 hover:bg-muted/40'
    }`;

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
              className="text-center space-y-10"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={activeFadeUpItem}
                className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center"
              >
                <TrendingUp className="h-10 w-10 text-primary" />
              </motion.div>

              <div className="space-y-3">
                <motion.h1 variants={activeFadeUpItem} className="text-4xl font-bold tracking-tight">
                  Welcome to{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-amber-500">
                    FreeTradeJournal
                  </span>
                </motion.h1>
                <motion.p variants={activeFadeUpItem} className="text-muted-foreground text-lg max-w-xs mx-auto leading-relaxed">
                  Track, analyze, and level up your trading — completely free.
                </motion.p>
              </div>

              <motion.div variants={activeFadeUpItem} className="space-y-3 max-w-xs mx-auto">
                <Button onClick={() => goToStep(2)} size="lg" className="w-full">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button
                  onClick={handleSkipOnboarding}
                  disabled={loading}
                  className="block w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Skip setup for now
                </button>
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
              className="space-y-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={activeFadeUpItem} className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">How long have you been trading?</h2>
                <p className="text-muted-foreground">We'll tailor your experience to your level</p>
              </motion.div>

              <motion.div variants={activeFadeUpItem} className="grid grid-cols-2 gap-3">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setData({ ...data, experienceLevel: opt.value })}
                    className={selectionCardClass(data.experienceLevel === opt.value)}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <p className="font-semibold mt-2 text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </motion.div>

              <motion.div variants={activeFadeUpItem}>
                <Button
                  onClick={() => goToStep(3)}
                  size="lg"
                  className="w-full"
                  disabled={!data.experienceLevel}
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
              className="space-y-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={activeFadeUpItem} className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">What type of account?</h2>
                <p className="text-muted-foreground">Choose how you trade</p>
              </motion.div>

              <motion.div variants={activeFadeUpItem} className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = data.accountType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setData({ ...data, accountType: opt.value })}
                      className={selectionCardClass(selected)}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                        selected ? 'bg-primary/15' : 'bg-muted'
                      }`}>
                        <Icon className={`h-5 w-5 transition-colors ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                    </button>
                  );
                })}
              </motion.div>

              <motion.div variants={activeFadeUpItem}>
                <Button onClick={() => goToStep(4)} size="lg" className="w-full">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step-4"
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
              <motion.div variants={activeFadeUpItem} className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Name your account</h2>
                <p className="text-muted-foreground">A few quick details to get you set up</p>
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
                    <Label>Currency</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="balance">Starting Balance</Label>
                    <Input
                      id="balance"
                      className="h-11"
                      type="number"
                      value={data.currentBalance}
                      onChange={(e) => setData({ ...data, currentBalance: e.target.value })}
                      placeholder={DEFAULT_VALUES.STARTING_BALANCE.toString()}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="broker">
                    Broker{' '}
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="broker"
                    className="h-11"
                    value={data.broker}
                    onChange={(e) => setData({ ...data, broker: e.target.value })}
                    placeholder="e.g., FTMO, Apex, TopStep…"
                  />
                </div>
              </motion.div>

              <motion.div variants={activeFadeUpItem}>
                <Button onClick={() => goToStep(5)} size="lg" className="w-full">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step-5"
            custom={direction}
            variants={activeStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.div
              className="space-y-8 text-center"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="mx-auto w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <Check className="h-10 w-10 text-green-500" />
              </motion.div>

              <div className="space-y-2">
                <motion.h2 variants={activeFadeUpItem} className="text-3xl font-bold tracking-tight">
                  You're all set!
                </motion.h2>
                <motion.p variants={activeFadeUpItem} className="text-muted-foreground">
                  Your account is ready. Start tracking trades and improving your edge.
                </motion.p>
              </div>

              <motion.div
                variants={activeFadeUpItem}
                className="bg-muted/30 rounded-xl p-4 text-left border border-border/50 space-y-2"
              >
                <h3 className="font-semibold text-sm">Quick summary</h3>
                <div className="text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span>{data.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{data.accountType === 'prop-firm' ? 'Prop Firm' : data.accountType}</span>
                  </div>
                  {data.broker && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Broker</span>
                      <span>{data.broker}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency</span>
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
                    'Setting up…'
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Enter FreeTradeJournal
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  You can import trades and change settings anytime
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (checkingRemoteData || isProLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm">FreeTradeJournal</span>
          </div>
          <div className="flex-1 mx-8">
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <Skeleton className="h-4 w-10" />
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-8">
            <div className="text-center space-y-3">
              <Skeleton className="h-9 w-64 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border/50 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-sm">FreeTradeJournal</span>
        </div>

        {/* Progress bar */}
        <div className="flex-1 mx-4">
          {currentStep > 1 && (
            <div className="h-1.5 bg-muted rounded-full overflow-hidden max-w-sm mx-auto">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: [0.23, 0.86, 0.39, 0.96] as const }}
              />
            </div>
          )}
        </div>

        {/* Back + Skip */}
        <div className="flex items-center gap-3 shrink-0">
          {currentStep > 1 && currentStep < 5 && (
            <button
              onClick={() => goToStep(currentStep - 1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentStep > 1 && currentStep < 5 && (
            <button
              onClick={handleSkipOnboarding}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence custom={direction} mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer – social proof */}
      <footer className="py-4 border-t border-border/30 shrink-0">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap px-4">
          <span>Free forever</span>
          <span className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
          <span>No credit card required</span>
          <span className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
          <span>Your data stays yours</span>
        </div>
      </footer>
    </div>
  );
}
