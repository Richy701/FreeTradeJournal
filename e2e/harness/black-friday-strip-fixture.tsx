// Only served by the local black-friday-banners-check.mjs browser fixture:
// the real BlackFridayStrip above a stand-in page, with auth/pro mocked.
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { BlackFridayStrip } from '@/components/black-friday-strip';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-12 items-center border-b px-4 text-sm font-semibold">Mobile header stand-in</div>
      <BlackFridayStrip />
      <main className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Page content sits under the strip.</p>
      </main>
    </div>
  </BrowserRouter>,
);
