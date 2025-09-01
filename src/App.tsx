import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemePresetsProvider } from '@/contexts/theme-presets';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import Layout from '@/components/Layout';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import TradeLog from '@/pages/TradeLog';
import Goals from '@/pages/Goals';
import Journal from '@/pages/Journal';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Onboarding from '@/pages/Onboarding';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsAndConditions from '@/pages/TermsAndConditions';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="tradevault-theme">
      <ThemePresetsProvider>
        <AuthProvider>
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
          </Router>
        </AuthProvider>
      </ThemePresetsProvider>
    </ThemeProvider>
  );
}

export default App;