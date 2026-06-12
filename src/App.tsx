import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { SpinnerGap } from '@phosphor-icons/react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemePresetsProvider } from '@/contexts/theme-presets';
import { AuthProvider } from '@/contexts/auth-context';
import { ProProvider } from '@/contexts/pro-context';
import { SyncProvider } from '@/contexts/sync-context';
import { AccountProvider } from '@/contexts/account-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { ProtectedRoute } from '@/components/protected-route';
import { PropTrackerRoute } from '@/components/PropTrackerRoute';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { ScrollToTop } from '@/components/scroll-to-top';
import { CookieConsent } from '@/components/CookieConsent';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { PWAUpdateNotification } from '@/components/PWAUpdateNotification';
import { FeedbackListener } from '@/components/feedback-listener';
import { Toaster } from 'sonner';
const Analytics = lazy(() => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights })));
import { PostHogProvider } from 'posthog-js/react';
import { posthog } from '@/lib/posthog';
import { PostHogTracker } from '@/components/PostHogTracker';
import { initGA } from '@/lib/analytics';
import Layout from '@/components/Layout';
import { useReferralTracker } from '@/hooks/use-referral-tracker';
import { lazyWithRetry } from '@/lib/lazy-with-retry';

// Lazy load all page components for smaller initial bundle.
// lazyWithRetry self-heals stale-chunk failures after a deploy (see lazy-with-retry.ts).
const LandingPage = lazyWithRetry(() => import('@/pages/LandingPage'));
const Login = lazyWithRetry(() => import('@/pages/Login'));
const Dashboard = lazyWithRetry(() => import('@/pages/Dashboard'));
const TradeLog = lazyWithRetry(() => import('@/pages/TradeLog'));
const Goals = lazyWithRetry(() => import('@/pages/Goals'));
const Journal = lazyWithRetry(() => import('@/pages/Journal'));
const Settings = lazyWithRetry(() => import('@/pages/Settings'));
const Profile = lazyWithRetry(() => import('@/pages/Profile'));
const Signup = lazyWithRetry(() => import('@/pages/Signup'));
const Onboarding = lazyWithRetry(() => import('@/pages/OnboardingSimplified'));
const PrivacyPolicy = lazyWithRetry(() => import('@/pages/PrivacyPolicy'));
const TermsAndConditions = lazyWithRetry(() => import('@/pages/TermsAndConditions'));
const CookiePolicy = lazyWithRetry(() => import('@/pages/CookiePolicy'));
const Documentation = lazyWithRetry(() => import('@/pages/Documentation'));
const ForexTradingJournal = lazyWithRetry(() => import('@/pages/ForexTradingJournal'));
const FuturesTradingTracker = lazyWithRetry(() => import('@/pages/FuturesTradingTracker'));
const PropFirmDashboard = lazyWithRetry(() => import('@/pages/PropFirmDashboard'));
const TradeIdeas = lazyWithRetry(() => import('@/pages/TradeIdeas'))
const Coach = lazyWithRetry(() => import('@/pages/Coach'));
const DayTradingJournal = lazyWithRetry(() => import('@/pages/DayTradingJournal'));
const OnlineTradingJournal = lazyWithRetry(() => import('@/pages/OnlineTradingJournal'));
const Changelog = lazyWithRetry(() => import('@/pages/Changelog'));
const Pricing = lazyWithRetry(() => import('@/pages/Pricing'));
const ForgotPassword = lazyWithRetry(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazyWithRetry(() => import('@/pages/VerifyEmail'));
const Affiliate = lazyWithRetry(() => import('@/pages/Affiliate'));
const FTMOReview = lazyWithRetry(() => import('@/pages/FTMOReview'));
const The5ersReview = lazyWithRetry(() => import('@/pages/The5ersReview'));
const TopOneFuturesReview = lazyWithRetry(() => import('@/pages/TopOneFuturesReview'));
const NotFound = lazyWithRetry(() => import('@/pages/NotFound'));

const toastOptions = {
  style: {
    background: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    border: '1px solid hsl(var(--border))',
  },
};

function ReferralTracker() {
  useReferralTracker();
  return null;
}

function App() {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <PostHogProvider client={posthog}>
    <ThemeProvider defaultTheme="dark" storageKey="ftj-theme">
      <ThemePresetsProvider>
        <AuthProvider>
          <ProProvider>
          <SyncProvider>
          <AccountProvider>
            <SettingsProvider>
              <Router>
            <PostHogTracker />
            <ReferralTracker />
            <ScrollToTop />
            <SEOMeta />
            <StructuredData />
            <Toaster
              richColors
              position="top-right"
              toastOptions={toastOptions}
            />
            <Suspense fallback={null}>
              <Analytics />
              <SpeedInsights />
            </Suspense>
            <CookieConsent />
            <PWAInstallPrompt />
            <PWAUpdateNotification />
            <FeedbackListener />
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center" role="status">
                <SpinnerGap className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/pricing" element={<Pricing />} />
                
                {/* SEO Landing Pages */}
                <Route path="/forex-trading-journal" element={<ForexTradingJournal />} />
                <Route path="/futures-trading-tracker" element={<FuturesTradingTracker />} />
                <Route path="/prop-firm-dashboard" element={<PropFirmDashboard />} />
                <Route path="/day-trading-journal" element={<DayTradingJournal />} />
                <Route path="/online-trading-journal" element={<OnlineTradingJournal />} />
                <Route path="/affiliate" element={<Affiliate />} />
                <Route path="/ftmo-review" element={<FTMOReview />} />
                <Route path="/the5ers-review" element={<The5ersReview />} />
                <Route path="/top-one-futures-review" element={<TopOneFuturesReview />} />
                
                {/* Prop Tracker — public landing for guests, full app for authenticated users */}
                <Route path="/prop-tracker" element={<PropTrackerRoute />} />

                {/* Protected routes */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/coach" element={<Coach />} />
                  <Route path="/trades" element={<TradeLog />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/ideas" element={<TradeIdeas />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                {/* 404 catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </Router>
            </SettingsProvider>
          </AccountProvider>
          </SyncProvider>
          </ProProvider>
        </AuthProvider>
      </ThemePresetsProvider>
    </ThemeProvider>
    </PostHogProvider>
  );
}

export default App;