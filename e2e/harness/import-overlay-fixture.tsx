// Local-only fixture for import-overlay-check.mjs: the real ImportProgressOverlay,
// the Trade Log glow class, and the real landing hero, with contexts stubbed.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ImportProgressOverlay, type ImportSummary } from '@/components/import-progress-overlay';
import { HeroGeometric } from '@/components/blocks/shape-landing-hero';
import { ProductTour } from '@/components/blocks/product-tour';
import '@/index.css';

const view = new URLSearchParams(location.search).get('view');
const scenario = new URLSearchParams(location.search).get('scenario');

const SUMMARIES: Record<string, ImportSummary> = {
  win: { imported: 47, duplicates: 3, failedRows: 0, netPnl: 1284.5 },
  loss: { imported: 12, duplicates: 0, failedRows: 2, netPnl: -340.25 },
  none: { imported: 0, duplicates: 18, failedRows: 0, netPnl: 0 },
};

function OverlayView() {
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [glow, setGlow] = useState(false);
  return (
    <div style={{ padding: 24 }}>
      <button data-testid="run" onClick={() => setSummary(SUMMARIES[scenario || 'win'])}>Import</button>
      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <tbody>
          {['NQ', 'ES', 'EURUSD', 'GC'].map((s, i) => (
            <tr key={s} data-testid={`row-${i}`} className={i < 2 && glow ? 'animate-import-glow' : ''} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <td style={{ padding: 12 }}>{s}</td><td style={{ padding: 12 }}>{i < 2 ? 'new' : 'existing'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ImportProgressOverlay summary={summary} onClose={() => { setSummary(null); setGlow(true); }} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  view === 'tour' ? (
    <div className="px-4 py-10"><ProductTour /></div>
  ) : view === 'hero' ? (
    <MemoryRouter>
      <HeroGeometric homepage title1="The Free Trading Journal" title2="That Improves Your Results" />
    </MemoryRouter>
  ) : <OverlayView />,
);
