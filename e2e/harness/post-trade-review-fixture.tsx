import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Dashboard from '@/pages/Dashboard';
import TradeLog from '@/pages/TradeLog';
import Journal from '@/pages/Journal';
import Changelog from '@/pages/Changelog';
import { WhatsNewDialog } from '@/components/whats-new-dialog';
import { DEMO_TRADES } from '@/data/demo-data';
import '@/index.css';

// Existing demo data only; the harness blocks all external requests.
if (!localStorage.getItem('user_focus-preview_trades')) {
  localStorage.setItem('user_focus-preview_trades', JSON.stringify(DEMO_TRADES.map(trade => ({...trade, accountId: 'account-a'}))));
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Routes>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/trades" element={<TradeLog />} />
  <Route path="/journal" element={<Journal />} />
  <Route path="/changelog" element={<Changelog />} />
  <Route path="/__review-whats-new" element={<WhatsNewDialog open onOpenChange={() => {}} sinceVersion="2.91.1" />} />
</Routes><Toaster /></BrowserRouter>);
