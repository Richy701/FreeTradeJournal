export const useSettings = () => ({
  getCurrencySymbol: () => '$',
  formatCurrency: (v: number, showSign = true) =>
    (showSign && v > 0 ? '+' : v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
});
