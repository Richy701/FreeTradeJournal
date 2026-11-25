import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { shouldApplyUpdateOnNavigate } from '@/lib/sw-update'

// When a new version has been installed in the background, the next in-app
// page change loads the new version instead (see src/lib/sw-update.ts).
export function ApplyUpdateOnNavigate() {
  const { pathname } = useLocation()
  const firstRender = useRef(true)

  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (shouldApplyUpdateOnNavigate()) window.location.reload()
  }, [pathname])

  return null
}
