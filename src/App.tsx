import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemePresetsProvider } from '@/contexts/theme-presets';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import Layout from '@/components/Layout';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import TradeLog from '@/pages/TradeLog';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Onboarding from '@/pages/Onboarding';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="tradevault-theme">
      <ThemePresetsProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes */}
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trades" element={<TradeLog />} />
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