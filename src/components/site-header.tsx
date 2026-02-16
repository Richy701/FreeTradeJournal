import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import {
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLocation, useNavigate } from "react-router-dom"
import { User, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

function UserAvatar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const name = user.displayName || user.email?.split('@')[0] || 'User'
  const avatar = user.photoURL || ''

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Avatar className="h-7 w-7 rounded-full ring-1 ring-border">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="rounded-full text-xs">{name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-40 rounded-lg">
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="h-4 w-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SiteHeader({ className }: { className?: string }) {
  const { themeColors } = useThemePresets()
  const { user } = useAuth()
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
      'profile': 'Profile',
      'privacy': 'Privacy Policy',
      'terms': 'Terms & Conditions',
      'cookie-policy': 'Cookie Policy',
      'documentation': 'Documentation',
    }
    
    // For public pages (privacy, terms), Home should link to landing page
    const isPublicPage = ['privacy', 'terms', 'cookie-policy', 'documentation'].includes(segments[0])
    const homeHref = user && !isPublicPage ? '/dashboard' : '/'
    
    if (segments.length === 0) {
      return [{ label: 'Home', href: homeHref, isActive: true }]
    }
    
    if (segments.length === 1 && segments[0] === 'dashboard') {
      return [
        { label: 'Home', href: homeHref, isActive: false },
        { label: 'Dashboard', href: '/dashboard', isActive: true }
      ]
    }
    
    const items = [{ label: 'Home', href: homeHref, isActive: false }]
    
    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const label = segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      const isActive = index === segments.length - 1
      
      items.push({ label, href, isActive })
    })
    
    return items
  }

  const breadcrumbItems = getBreadcrumbItems()
  
  // Determine if we should use landing page theme (for public pages) or dashboard theme
  const isPublicPage = ['privacy', 'terms', 'cookie-policy', 'documentation'].includes(pathname.split('/').filter(Boolean)[0])

  return (
    <header className={`hidden md:flex h-16 shrink-0 items-center gap-2 px-4 ${className || ''}`}>
      {hasSidebar && <SidebarTrigger />}
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={`${item.href}-${index}`}>
              <BreadcrumbItem>
                {item.isActive ? (
                  <BreadcrumbPage 
                    className={isPublicPage ? "text-primary" : ""}
                    style={!isPublicPage ? {color: themeColors.primary} : {}}
                  >
                    {item.label}
                  </BreadcrumbPage>
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
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        {user && (
          <UserAvatar />
        )}
      </div>
    </header>
  )
}