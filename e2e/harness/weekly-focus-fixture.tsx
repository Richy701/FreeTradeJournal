// Local-only browser fixture; external requests are blocked by its harness.
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Coach from '@/pages/Coach';
import { WeeklyFocus } from '@/components/weekly-focus';
import Changelog from '@/pages/Changelog';
import { WhatsNewDialog } from '@/components/whats-new-dialog';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/coach" element={<Coach />} />
      <Route path="/dashboard" element={<main className="mx-auto max-w-3xl p-4"><WeeklyFocus compact /></main>} />
      <Route path="/changelog" element={<Changelog />} />
      <Route path="/__weekly-whats-new" element={<WhatsNewDialog open onOpenChange={() => {}} sinceVersion="2.91.1" />} />
    </Routes>
    <Toaster />
  </BrowserRouter>,
);
