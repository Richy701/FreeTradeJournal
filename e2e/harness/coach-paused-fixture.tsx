// Only served by the local coach-paused-check.ts browser fixture.
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TradingCoach } from '@/components/trading-coach';
import Pricing from '@/pages/Pricing';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/__coach-paused" element={<main className="mx-auto max-w-3xl p-4 sm:p-6"><TradingCoach /></main>} />
      <Route path="/pricing" element={<Pricing />} />
    </Routes>
  </BrowserRouter>,
);
