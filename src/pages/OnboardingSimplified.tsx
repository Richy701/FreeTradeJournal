import { hasExistingOnboardingData } from '@/utils/onboarding';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useAccounts, type TradingAccount } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { trackEvent } from '@/lib/analytics';
import { SUPPORTED_CURRENCIES, DEFAULT_VALUES, BROKERS } from '@/constants/trading';
import { LIFETIME_RETIRES_AT } from '@/constants/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UnitInput } from '@/components/money-input';
import { parseOnboardingBalance } from '@/lib/onboarding-balance';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Check, CaretLeft, Wallet, Monitor, Buildings, FileText, Plant, ChartBar, Lightning, Trophy, BookOpen, Target } from '@phosphor-icons/react';
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
  { id: 5, title: 'Review' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', icon: Plant, label: 'Just Starting Out', sub: 'Under 1 year' },
  { value: 'developing', icon: ChartBar, label: 'Building Skills', sub: '1-3 years' },
  { value: 'experienced', icon: Lightning, label: 'Experienced', sub: '3-5 years' },
  { value: 'veteran', icon: Trophy, label: 'Veteran Trader', sub: '5+ years' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'live' as TradingAccount['type'], icon: Wallet, label: 'Live Account', sub: 'Real money' },
  { value: 'demo' as TradingAccount['type'], icon: Monitor, label: 'Demo Account', sub: 'Practice mode' },
  { value: 'prop-firm' as TradingAccount['type'], icon: Buildings, label: 'Prop Firm', sub: 'Evaluation or funded' },
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
      const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
      const { httpsCallable } = await import('firebase/functions');
      await httpsCallable(await getFirebaseFunctions(), 'completeOnboarding')({});
    } catch {
      // Keep local setup usable if the connection or server is unavailable.
      toast.warning('Setup is saved on this device, but we could not save completion to your account.');
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
        if (hasExistingOnboardingData(user.uid)) {
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
    if (step > currentStep) {
      trackEvent('onboarding_step_completed', { step: currentStep, stepName: STEPS[currentStep - 1]?.title });
    }
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

      trackEvent('onboarding_completed', { skipped: true });
      toast.success('Welcome to FreeTradeJournal! You can update your settings anytime.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to setup account. Please try again.');
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const balance = parseOnboardingBalance(data.currentBalance);
    if (balance === null) {
      toast.error('Enter a valid starting balance. Use 0 if the account is unfunded.');
      goToStep(4);
      return;
    }
    setLoading(true);

    const newAccount = {
      name: data.accountName || DEFAULT_VALUES.ACCOUNT_NAME,
      type: data.accountType,
      broker: data.broker || 'Not specified',
      currency: data.currency,
      balance,
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

      trackEvent('onboarding_completed', { skipped: false, experienceLevel: data.experienceLevel, accountType: data.accountType });
      toast.success('Setup complete! Welcome to FreeTradeJournal!');
      navigate('/dashboard', { state: { promptFirstTrade: true } });
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

  const selectionCardClass = (selected: boolean) =>
    `relative p-5 rounded-lg border text-left transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
            <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div className="space-y-5">
                <p className="text-xs font-medium text-muted-foreground">YOUR TRADING WORKSPACE</p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">A clearer view of every trade.</h1>
                <p className="max-w-md text-base leading-relaxed text-muted-foreground">Set up your account, then log a trade or import your history. Your journal and performance will build from there.</p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button onClick={() => goToStep(2)} size="lg">Set up my journal<ArrowRight className="ml-2 h-4 w-4" /></Button>
                  <Button variant="ghost" onClick={handleSkipOnboarding} disabled={loading}>{loading ? 'Setting up…' : 'Explore first'}</Button>
                </div>
                <p className="text-xs text-muted-foreground">You can change your preferences later in Settings.</p>
              </div>
              <ol className="divide-y divide-border rounded-xl border bg-muted/20 px-5">
                {[
                  ['Your experience', 'Choose the level of guidance that suits you.'],
                  ['Your account', 'Keep trades grouped by account and currency.'],
                  ['Your first trade', 'Add one manually or import a broker CSV.'],
                ].map(([title, detail], index) => <li key={title} className="flex gap-4 py-5">
                  <span className="pt-0.5 text-xs tabular-nums text-muted-foreground">0{index + 1}</span>
                  <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p></div>
                </li>)}
              </ol>
            </div>
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
              className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-x-12 [&>div:last-child]:lg:col-start-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={activeFadeUpItem} className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">How long have you been trading?</h1>
                <p className="text-muted-foreground">Choose the level of guidance that fits you. You can change this later.</p>
              </motion.div>

              <motion.div variants={activeFadeUpItem} className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                {EXPERIENCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = data.experienceLevel === opt.value;
                  return (
                    <button
                      key={opt.value}
                      aria-pressed={selected}
                      onClick={() => setData({ ...data, experienceLevel: opt.value })}
                      className={selectionCardClass(selected)}
                    >
                      {selected && <Check className="absolute right-4 top-4 h-4 w-4 text-primary" weight="bold" aria-hidden="true" />}
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
              className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-x-12 [&>div:last-child]:lg:col-start-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={activeFadeUpItem} className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">What type of account?</h1>
                <p className="text-muted-foreground">This keeps your trades organised. You can add more accounts later.</p>
              </motion.div>

              <motion.div variants={activeFadeUpItem} className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                {ACCOUNT_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = data.accountType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      aria-pressed={selected}
                      onClick={() => setData({ ...data, accountType: opt.value })}
                      className={selectionCardClass(selected)}
                    >
                      {selected && <Check className="absolute right-4 top-4 h-4 w-4 text-primary" weight="bold" aria-hidden="true" />}
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
              className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-x-12 [&>div:last-child]:lg:col-start-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={activeFadeUpItem} className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Name your account</h1>
                <p className="text-muted-foreground">Choose a name you’ll recognise and the currency this account uses.</p>
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

                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-currency">Currency</Label>
                    <Select
                      value={data.currency}
                      onValueChange={(value) => setData({ ...data, currency: value })}
                    >
                      <SelectTrigger id="onboarding-currency" className="h-11">
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
                    <UnitInput
                      id="balance"
                      className="h-11"
                      prefix={SUPPORTED_CURRENCIES.find(c => c.code === data.currency)?.symbol ?? '$'}
                      value={data.currentBalance}
                      onChange={(e) => setData({ ...data, currentBalance: e.target.value })}
                      placeholder={DEFAULT_VALUES.STARTING_BALANCE.toString()}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="broker">
                    <span>Broker </span>
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="broker"
                    className="h-11"
                    list="onboarding-brokers"
                    value={data.broker}
                    onChange={(e) => setData({ ...data, broker: e.target.value })}
                    placeholder="e.g., FTMO, Apex, TopStep..."
                  />
                  <datalist id="onboarding-brokers">
                    {BROKERS.filter(b => b !== 'Other').map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
              </motion.div>

              <motion.div variants={activeFadeUpItem}>
                <Button onClick={() => {
                  if (parseOnboardingBalance(data.currentBalance) === null) {
                    toast.error('Enter a valid starting balance. Use 0 if the account is unfunded.');
                    return;
                  }
                  goToStep(5);
                }} size="lg" className="w-full">
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
              className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-x-12 [&>div:last-child]:lg:col-start-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <div className="space-y-2 lg:row-span-2">
                <motion.h1 variants={activeFadeUpItem} className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Review your account
                </motion.h1>
                <motion.p variants={activeFadeUpItem} className="max-w-lg text-muted-foreground leading-relaxed">
                  Check these details before creating your account. Next, you can add your first trade or import your history.
                </motion.p>
                <motion.p variants={activeFadeUpItem} className="max-w-lg text-sm text-muted-foreground leading-relaxed">
                  {Date.now() < LIFETIME_RETIRES_AT
                    ? 'Your first 14 days include every Pro feature — unlimited AI coaching, cloud sync, and full analytics. No card needed.'
                    : 'Want every Pro feature, including more AI coaching, cloud sync and full analytics? You can upgrade to Pro anytime from the sidebar.'}
                </motion.p>
              </div>

              <motion.div
                variants={activeFadeUpItem}
                className="bg-muted/30 rounded-xl p-4 text-left border border-border/50 space-y-2"
              >
                <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-sm">Account details</h3><Button variant="ghost" size="sm" onClick={() => goToStep(4)} disabled={loading}>Edit details</Button></div>
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
                    <span>Setting up...</span>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      <span>Create account &amp; add a trade</span>
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
            <img src="/favicon.svg" alt="FTJ" className="w-8 h-8 rounded-[12%]" />
            <span className="hidden sm:inline font-bold text-sm">FreeTradeJournal</span>
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
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
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
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Header */}
      <header className="relative flex items-center gap-4 px-6 py-4 border-b border-border/50 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img src="/favicon.svg" alt="FTJ" className="w-8 h-8 rounded-[12%]" />
          <span className="hidden sm:inline font-bold text-sm">FreeTradeJournal</span>
        </div>

        <div className="flex-1" />

        {/* Step counter + Back + Skip */}
        <div className="flex items-center gap-3 shrink-0">
          {currentStep > 1 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentStep} of {STEPS.length}
            </span>
          )}
          {currentStep > 1 && (
            <button
              onClick={() => goToStep(currentStep - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={loading}
              aria-label="Go back"
            >
              <CaretLeft className="h-5 w-5" />
            </button>
          )}
          {currentStep > 1 && (
            <button
              onClick={handleSkipOnboarding}
              disabled={loading}
              className="min-h-11 px-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Skip
            </button>
          )}
        </div>
      </header>

      <main className={`relative flex-1 px-4 py-5 sm:px-8 sm:py-6 ${currentStep === 1 ? 'flex items-center' : ''}`}>
        <div className="w-full">
          {currentStep > 1 && <nav aria-label="Setup steps" className="mb-8">
            <ol className="grid grid-cols-4 gap-2 sm:gap-4">
              {STEPS.slice(1).map(step => <li key={step.id} aria-current={currentStep === step.id ? 'step' : undefined} className="space-y-2">
                <div className={`h-1 rounded-full ${currentStep >= step.id ? 'bg-primary' : 'bg-muted'}`} />
                <span className={`text-xs sm:text-sm ${currentStep === step.id ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{step.title}</span>
              </li>)}
            </ol>
          </nav>}
          <div className={currentStep === 1 ? 'px-2 py-8 sm:px-8 sm:py-12' : 'rounded-xl border bg-card p-6 sm:p-8'}>
            <AnimatePresence custom={direction} mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>
        </div>
      </main>

    </div>
  );
}
