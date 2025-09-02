import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemePresetsProvider } from '@/contexts/theme-presets';
import { AuthProvider } from '@/contexts/auth-context';
import { AccountProvider } from '@/contexts/account-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import Layout from '@/components/Layout';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';

// Lazy load heavy components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const TradeLog = lazy(() => import('@/pages/TradeLog'));
const Goals = lazy(() => import('@/pages/Goals'));
const Journal = lazy(() => import('@/pages/Journal'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/Profile'));
const Signup = lazy(() => import('@/pages/Signup'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('@/pages/TermsAndConditions'));

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="tradevault-theme">
      <ThemePresetsProvider>
        <AuthProvider>
          <AccountProvider>
            <Router>
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
            <Analytics />
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            }>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                
                {/* Protected routes */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/trades" element={<TradeLog />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Routes>
            </Suspense>
            </Router>
          </AccountProvider>
        </AuthProvider>
      </ThemePresetsProvider>
    </ThemeProvider>
  );
}

export default App;