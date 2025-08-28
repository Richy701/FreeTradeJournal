import * as React from "react"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import {
  BarChart3,
  TrendingUp,
  Target,
  BookOpen,
  Settings2,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Trade Log",
      url: "/trades",
      icon: TrendingUp,
    },
    {
      title: "Goals & Risk Management",
      url: "/goals",
      icon: Target,
    },
    {
      title: "Journal",
      url: "/journal",
      icon: BookOpen,
    },
  ],
  navSecondary: [
    {
      title: "Back to Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { themeColors } = useThemePresets()
  const { user } = useAuth()
  
  // Transform Firebase user to NavUser format
  const navUser = user ? {
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    avatar: user.photoURL || ''
  } : null

  if (!navUser) {
    return null
  }
  
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div 
                  className="flex aspect-square size-8 items-center justify-center rounded-lg text-white" 
                  style={{backgroundColor: themeColors.primary}}
                >
                  <TrendingUp className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TradeVault</span>
                  <span className="truncate text-xs">Forex & Futures Journal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems.navMain} />
        <NavSecondary items={navItems.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
