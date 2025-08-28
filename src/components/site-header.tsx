import { Separator } from "@/components/ui/separator"
import { useThemePresets } from '@/contexts/theme-presets'
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"

export function SiteHeader() {
  const { themeColors } = useThemePresets()
  const location = useLocation()
  const pathname = location.pathname
  
  const getBreadcrumbItems = () => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (segments.length === 0 || segments[0] === 'dashboard') {
      return [{ label: 'Dashboard', href: '/dashboard', isActive: true }]
    }
    
    const items = [{ label: 'Dashboard', href: '/dashboard', isActive: false }]
    
    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const label = segment.charAt(0).toUpperCase() + segment.slice(1)
      const isActive = index === segments.length - 1
      
      items.push({ label, href, isActive })
    })
    
    return items
  }

  const breadcrumbItems = getBreadcrumbItems()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <div key={item.href} className="flex items-center">
              <BreadcrumbItem className="hidden md:block">
                {item.isActive ? (
                  <BreadcrumbPage style={{color: themeColors.primary}}>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}