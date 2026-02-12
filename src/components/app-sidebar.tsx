import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import {
  BarChart3,
  TrendingUp,
  Target,
  BookOpen,
  Settings2,
  Coffee,
  LineChart,
} from "lucide-react"
import { FeedbackButton } from '@/components/ui/feedback-button'

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { AccountSwitcher } from "@/components/account-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
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
]

function isItemActive(url: string, pathname: string): boolean {
  if (url === "/dashboard") return pathname === "/dashboard"
  return pathname.startsWith(url)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { themeColors, alpha } = useThemePresets()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  // Transform Firebase user to NavUser format
  const navUser = user ? {
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    avatar: user.photoURL || ''
  } : null

  if (!navUser) {
    return null
  }

  const settingsActive = isItemActive("/settings", pathname)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div
                  className="flex aspect-square size-8 items-center justify-center rounded-lg text-white"
                  style={{backgroundColor: themeColors.primary}}
                >
                  <LineChart className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">FreeTradeJournal</span>
                  <span className="truncate text-xs">Forex & Futures Journal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-3 pb-2">
          <AccountSwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <div className="mt-auto">
          <SidebarGroup>
            <SidebarGroupLabel>Support</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    isActive={settingsActive}
                    style={
                      settingsActive
                        ? { backgroundColor: `${alpha(themeColors.primary, '15')}` }
                        : undefined
                    }
                  >
                    <Link
                      to="/settings"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <Settings2 className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" asChild>
                    <a href="https://buymeacoffee.com/richy701" target="_blank" rel="noopener noreferrer">
                      <Coffee className="h-4 w-4" />
                      <span>Buy me a coffee</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <FeedbackButton
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-sm"
                    buttonText="Send Feedback"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
