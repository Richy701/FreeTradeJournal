import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import {
  BarChart3,
  TrendingUp,
  Target,
  BookOpen,
  Lightbulb,
  Settings2,
  Coffee,
  Megaphone,
  UserPlus,
  LogOut,
  Eye,
} from "lucide-react"
import { FeedbackButton } from '@/components/ui/feedback-button'
import { WhatsNewDialog } from '@/components/whats-new-dialog'

import { NavMain } from "@/components/nav-main"
import { AccountSwitcher } from "@/components/account-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  {
    title: "Trade Insights",
    url: "/ideas",
    icon: Lightbulb,
  },
]

function isItemActive(url: string, pathname: string): boolean {
  if (url === "/dashboard") return pathname === "/dashboard"
  return pathname.startsWith(url)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { themeColors, alpha } = useThemePresets()
  const { user, isDemo, exitDemoMode } = useAuth()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false)

  if (!user) {
    return null
  }

  const settingsActive = isItemActive("/settings", pathname)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="pb-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <img src="/favicon.svg" alt="FTJ" className="size-8 rounded-lg flex-shrink-0" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">FreeTradeJournal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {isDemo ? (
          <div className="px-3">
            <div className="flex items-center gap-2 h-9 px-2.5 text-sm font-medium rounded-md border bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Eye className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">Demo Account</span>
            </div>
          </div>
        ) : (
          <div className="px-3">
            <AccountSwitcher />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter className="gap-0">
        <SidebarMenu className="gap-0.5 px-1">
          {isDemo ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" asChild>
                  <Link
                    to="/signup"
                    onClick={() => { exitDemoMode(); isMobile && setOpenMobile(false); }}
                    className="!bg-gradient-to-r from-amber-500/20 to-yellow-500/20 font-medium"
                  >
                    <UserPlus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Sign Up Free</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="sm"
                  onClick={() => { exitDemoMode(); isMobile && setOpenMobile(false); }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Exit Demo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="sm"
                  onClick={() => setWhatsNewOpen(true)}
                >
                  <Megaphone className="h-4 w-4" />
                  <span>What's New</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  className="relative"
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
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <WhatsNewDialog open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
    </Sidebar>
  )
}
