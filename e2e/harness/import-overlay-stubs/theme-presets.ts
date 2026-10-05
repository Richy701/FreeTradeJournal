export const useThemePresets = () => ({
  themeColors: { primary: '#f59e0b', profit: '#10b981', loss: '#ef4444', primaryButtonText: '#000000' },
  alpha: (color: string, a: string) => color + a,
});
