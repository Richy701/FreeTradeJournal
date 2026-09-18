import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { CustomizeSheet } from './customize-sheet';
vi.mock('@/contexts/settings-context', () => {
  const settings = { settings: { dashboardLayout: null }, updateSettings: () => {} };
  return { useSettings: () => settings };
});
vi.mock('@/contexts/theme-presets', () => {
  const theme = { themeColors: { primary: '#f59e0b' }, alpha: () => 'rgba(0,0,0,0.1)' };
  return { useThemePresets: () => theme };
});
it('renders Customize as an icon-only button that still opens the panel', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<CustomizeSheet />));
    const button = container.querySelector('button[aria-label="Customize"]') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.textContent?.trim()).toBe(''); // icon only, no label text
    expect(button.querySelector('svg')).not.toBeNull();
    await act(async () => { button.click(); });
    expect(document.body.textContent).toContain('Customize');
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
