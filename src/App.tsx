import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemePresetsProvider } from '@/contexts/theme-presets';
import { AuthProvider } from '@/contexts/auth-context';
import { AccountProvider } from '@/contexts/account-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { ProtectedRoute } from '@/components/protected-route';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { CookieConsent } from '@/components/CookieConsent';
import { Toaster } from 'sonner';
const Analytics = lazy(() => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights })));
import { initGA } from '@/lib/analytics';
import Layout from '@/components/Layout';

// Lazy load all page components for smaller initial bundle
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const TradeLog = lazy(() => import('@/pages/TradeLog'));
const Goals = lazy(() => import('@/pages/Goals'));
const Journal = lazy(() => import('@/pages/Journal'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/Profile'));
const Signup = lazy(() => import('@/pages/Signup'));
const Onboarding = lazy(() => import('@/pages/OnboardingSimplified'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('@/pages/TermsAndConditions'));
const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'));
const Documentation = lazy(() => import('@/pages/Documentation'));
const ForexTradingJournal = lazy(() => import('@/pages/ForexTradingJournal'));
const FuturesTradingTracker = lazy(() => import('@/pages/FuturesTradingTracker'));
const PropFirmDashboard = lazy(() => import('@/pages/PropFirmDashboard'));
const TradeIdeas = lazy(() => import('@/pages/TradeIdeas'));
const Changelog = lazy(() => import('@/pages/Changelog'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function App() {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="ftj-theme">
      <ThemePresetsProvider>
        <AuthProvider>
          <AccountProvider>
            <SettingsProvider>
              <Router>
            <SEOMeta />
            <StructuredData />
            <Toaster 
              richColors 
              position="top-right"
              toastOptions={{
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
            <Suspense fallback={null}>
              <Analytics />
              <SpeedInsights />
            </Suspense>
            <CookieConsent />
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center" role="status">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/changelog" element={<Changelog />} />
                
                {/* SEO Landing Pages */}
                <Route path="/forex-trading-journal" element={<ForexTradingJournal />} />
                <Route path="/futures-trading-tracker" element={<FuturesTradingTracker />} />
                <Route path="/prop-firm-dashboard" element={<PropFirmDashboard />} />
                
                {/* Protected routes */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
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
        </AuthProvider>
      </ThemePresetsProvider>
    </ThemeProvider>
  );
}

export default App;