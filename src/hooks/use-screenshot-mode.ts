import { useSyncExternalStore } from 'react'
import { useTheme } from '@/components/theme-provider'

const subscribe = (notify: () => void) => {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const snapshot = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function useScreenshotMode(): 'light' | 'dark' {
  const { theme } = useTheme()
  const systemDark = useSyncExternalStore(subscribe, snapshot, () => false)
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
}
