// Only served by the local analysis-offer-check.ts browser fixture.
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AIAnalysis } from '@/components/ai-analysis';
import Pricing from '@/pages/Pricing';
import { getDemoAIResponse } from '@/lib/demo-ai';
import { DEMO_TRADES } from '@/data/demo-data';
import '@/index.css';

localStorage.setItem('user_offer-preview_ftj-ai-analysis-cache_preview', JSON.stringify({
  analysis: getDemoAIResponse('analysis', null), usage: { used: 5, limit: 5, remaining: 0 },
  timestamp: Date.now(), period: 'all', tradeCount: DEMO_TRADES.length,
}));

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/__offer-preview" element={<main className="mx-auto max-w-3xl p-4 sm:p-6"><AIAnalysis trades={DEMO_TRADES} /></main>} />
      <Route path="/pricing" element={<Pricing />} />
    </Routes>
  </BrowserRouter>,
);
