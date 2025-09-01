import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { useThemePresets } from '@/contexts/theme-presets'
import {
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"

export function SiteHeader({ className }: { className?: string }) {
  const { themeColors } = useThemePresets()
  const location = useLocation()
  const pathname = location.pathname
  
  // Check if we're in a sidebar context
  let hasSidebar = false
  try {
    useSidebar()
    hasSidebar = true
  } catch {
    hasSidebar = false
  }
  
  const getBreadcrumbItems = () => {
    const segments = pathname.split('/').filter(Boolean)
    
    // Map segments to better labels
    const segmentLabels: Record<string, string> = {
      'dashboard': 'Dashboard',
      'trades': 'Trade Log', 
      'goals': 'Goals & Risk Management',
      'journal': 'Journal',
      'settings': 'Settings',
      'profile': 'Profile'
    }
    
    if (segments.length === 0) {
      return [{ label: 'Home', href: '/', isActive: true }]
    }
    
    if (segments.length === 1 && segments[0] === 'dashboard') {
      return [
        { label: 'Home', href: '/', isActive: false },
        { label: 'Dashboard', href: '/dashboard', isActive: true }
      ]
    }
    
    const items = [{ label: 'Home', href: '/', isActive: false }]
    
    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const label = segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      const isActive = index === segments.length - 1
      
      items.push({ label, href, isActive })
    })
    
    return items
  }

  const breadcrumbItems = getBreadcrumbItems()

  return (
    <header className={`hidden md:flex h-16 shrink-0 items-center gap-2 px-4 ${className || ''}`}>
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                {item.isActive ? (
                  <BreadcrumbPage style={{color: themeColors.primary}}>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && (
                <BreadcrumbSeparator />
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}