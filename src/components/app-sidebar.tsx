import { DEMO_ACCOUNTS } from '@/data/demo-data'
import { isScreenshotPreview } from '@/lib/screenshot-preview'
import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import {
  ChartBar,
  TrendUp,
  Target,
  BookOpen,
  Lightbulb,
  Buildings,
  Calculator,
  Brain,
  GearSix,
  Megaphone,
  UserPlus,
  SignOut,
  Eye,
  Rocket,
  RssSimple,
  Tag,
  Question,
  Fire,
  Lightning,
  CheckCircle,
  Gift,
  User,
  CaretUpDown,
  CaretUp,
  ChatCircleText,
  DotsThree,
} from '@phosphor-icons/react'
import { FeedbackButton } from '@/components/feedback-button'
import { WhatsNewDialog } from '@/components/whats-new-dialog'
import { ProBadge } from '@/components/pro-badge'
import { useProStatus } from '@/contexts/pro-context'
import { useLoggingStreak, isWeekend } from '@/hooks/use-logging-streak'
import { Button } from '@/components/ui/button'
import { isBlackFriday, BLACK_FRIDAY_YEARLY_PRICE } from '@/constants/pricing'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserStorage } from "@/utils/user-storage"

import { NavMain, type NavGroup } from "@/components/nav-main"
import { AccountSwitcher } from "@/components/account-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: ChartBar },
      { title: "AI Coach", url: "/coach", icon: Brain },
      { title: "Trade Log", url: "/trades", icon: TrendUp },
      { title: "Journal", url: "/journal", icon: BookOpen },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Goals & Risk", url: "/goals", icon: Target },
      { title: "Trade Insights", url: "/ideas", icon: Lightbulb },
      { title: "PropTracker", url: "/prop-tracker", icon: Buildings },
      { title: "Position Calculator", url: "/calculator", icon: Calculator },
    ],
  },
]

function isItemActive(url: string, pathname: string): boolean {
  if (url === "/dashboard") return pathname === "/dashboard"
  return pathname.startsWith(url)
}

// Avatar + name row pinned to the bottom of the sidebar. Reads the same
// userStorage avatar keys as the header menu in site-header.tsx.
function SidebarUser() {
  const { user, logout, isDemo } = useAuth()
  const { themeColors } = useThemePresets()
  const { isMobile, setOpenMobile } = useSidebar()
  const userStorage = useUserStorage()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = React.useState(() => userStorage.getItem('avatar') || '')
  const [avatarEmoji, setAvatarEmoji] = React.useState(() => userStorage.getItem('avatarEmoji') || '')
  const [avatarColor, setAvatarColor] = React.useState(() => userStorage.getItem('avatarColor') || '')

  React.useEffect(() => {
    const sync = () => {
      setAvatarUrl(userStorage.getItem('avatar') || '')
      setAvatarEmoji(userStorage.getItem('avatarEmoji') || '')
      setAvatarColor(userStorage.getItem('avatarColor') || '')
    }
    // 'storage' only fires in other tabs; Profile dispatches 'profileUpdated'
    // for this one so the row changes the moment a new avatar is picked.
    window.addEventListener('storage', sync)
    window.addEventListener('profileUpdated', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('profileUpdated', sync)
    }
  }, [userStorage])

  if (!user) return null

  const name = user.displayName || user.email?.split('@')[0] || 'User'
  const go = (to: string) => {
    isMobile && setOpenMobile(false)
    navigate(to)
  }

  return (
    <SidebarMenu className="px-1 pt-1">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="h-14 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/50 px-2.5" aria-label="Account menu">
              <Avatar className="h-7 w-7 rounded-full ring-1 ring-sidebar-border shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                <AvatarFallback
                  className="rounded-full font-semibold text-white"
                  style={{
                    backgroundColor: avatarColor || themeColors.primary,
                    fontSize: avatarEmoji ? '14px' : '11px',
                  }}
                >
                  {avatarEmoji || name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight min-w-0">
                <span className="truncate text-sm font-medium">{name}</span>
                <span className="truncate text-[11px] leading-tight text-sidebar-foreground/60">
                  {isScreenshotPreview(isDemo) ? 'Personal trading journal' : user.email}
                </span>
              </div>
              <CaretUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={8} className="min-w-48 rounded-lg">
            <DropdownMenuItem className={isMobile ? 'h-11' : ''} onClick={() => go('/profile')}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className={isMobile ? 'h-11' : ''} onClick={() => go('/settings')}>
              <GearSix className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className={`text-destructive focus:text-destructive ${isMobile ? 'h-11' : ''}`}
              onClick={async () => {
                try {
                  await logout()
                  navigate('/login')
                } catch (e) {
                  console.error('Failed to logout:', e)
                }
              }}
            >
              <SignOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { themeColors, alpha } = useThemePresets()
  const { user, isDemo, exitDemoMode } = useAuth()
  const { isPro, isDev, trialEndsAt } = useProStatus()
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null
  const { streak, bestStreak, loggedToday } = useLoggingStreak()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false)
  const [moreOpen, setMoreOpen] = React.useState(false)
  const [feedbackOpen, setFeedbackOpen] = React.useState(false)
  const navigate = useNavigate()
  const goTo = (to: string) => { navigate(to); if (isMobile) setOpenMobile(false) }
  const groups = navGroups

  if (!user) {
    return null
  }

  const settingsActive = isItemActive("/settings", pathname)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-3 px-3 pb-4 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="px-2" asChild>
              <Link to="/dashboard">
                <div className="size-8 shrink-0 overflow-hidden rounded-[12%]"><img src="/favicon.svg" alt="FTJ" className="w-full h-full object-cover" /></div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold flex items-center gap-1.5">
                    FreeTradeJournal
                    {isPro && <ProBadge variant={isDev ? 'dev' : 'pro'} />}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {isDemo ? (
          <div className="px-1">
            <div className="flex items-center gap-2 h-9 px-2.5 text-sm font-medium rounded-md border bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Eye className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate" title={DEMO_ACCOUNTS[0].name}>{DEMO_ACCOUNTS[0].name}</span>
            </div>
          </div>
        ) : (
          <div className="px-1">
            <AccountSwitcher />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="gap-2 border-t border-sidebar-border/60 pt-2">
        <NavMain groups={groups} />
      </SidebarContent>
      {!isDemo && streak > 0 && (
        <div className="px-4 pb-2 space-y-1.5">
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: alpha(themeColors.primary, '10') }}
          >
            {streak >= 7 ? (
              <Fire className="h-4 w-4 flex-shrink-0" style={{ color: themeColors.primary }} />
            ) : streak >= 3 ? (
              <Lightning className="h-4 w-4 flex-shrink-0" style={{ color: themeColors.primary }} />
            ) : (
              <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: themeColors.primary }} />
            )}
            <span
              className="font-semibold tabular-nums whitespace-nowrap min-w-0 truncate"
              style={{ color: themeColors.primary }}
            >
              {streak}-day streak
            </span>
            {!loggedToday && !isWeekend(new Date()) ? (
              <span className="text-xs text-sidebar-foreground/60 ml-auto whitespace-nowrap shrink-0">
                Log today!
              </span>
            ) : bestStreak > streak ? (
              <span className="text-xs text-sidebar-foreground/60 ml-auto tabular-nums whitespace-nowrap shrink-0">
                Best: {bestStreak}
              </span>
            ) : null}
          </div>
          {!isPro && streak >= 7 && !localStorage.getItem(`pro-nudge-streak-${user.uid}`) && (
            <Link
              to="/pricing"
              className="block rounded-lg px-3 py-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              style={{ backgroundColor: alpha(themeColors.primary, '5') }}
            >
              <span className="font-medium text-amber-500">{streak} days strong.</span>{' '}
              Pro's AI coach can help you keep improving.
            </Link>
          )}
        </div>
      )}
      <SidebarFooter
        className={`gap-2 px-3 pb-3 ${
          // 44px rows make an expanded "More" tall enough to push the whole nav
          // off a phone screen, so cap the footer and let it scroll instead.
          // 45vh hid the account row behind the fold once More was open.
          isMobile ? 'max-h-[62vh] overflow-y-auto' : ''
        }`}
      >
        <SidebarMenu
          className={`gap-1 px-0 [&_[data-sidebar=menu-button]]:rounded-lg ${
            // 28px rows are below the 44px minimum touch target on phones.
            isMobile ? '[&_[data-sidebar=menu-button]]:h-11' : ''
          }`}
        >
          {isDemo && !isScreenshotPreview(isDemo) ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" asChild>
                  <Link
                    to="/signup"
                    onClick={() => { isMobile && setOpenMobile(false); }}
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
                  <SignOut className="h-4 w-4" />
                  <span>Exit Demo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <>
              {!isPro && (
                // A card, not a nav row: as a tinted row it looked exactly like
                // the active Settings item and read as just another page.
                <li className="mb-1 list-none rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
                  <p className="text-sm font-semibold text-sidebar-foreground">Upgrade to Pro</p>
                  <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/70">
                    {isBlackFriday()
                      ? `Black Friday: Yearly $${BLACK_FRIDAY_YEARLY_PRICE} for the first year.`
                      : 'Full history, unlimited journal entries and the AI coach.'}
                  </p>
                  <Button asChild size="sm" className={`mt-3 w-full ${isMobile ? 'h-11' : ''}`}>
                    <Link to="/pricing" onClick={() => isMobile && setOpenMobile(false)}>See plans</Link>
                  </Button>
                </li>
              )}
              {trialDaysLeft !== null && (
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" asChild>
                    <Link
                      to="/pricing"
                      onClick={() => isMobile && setOpenMobile(false)}
                      className="font-medium"
                      style={{ backgroundColor: alpha(themeColors.primary, '15') }}
                    >
                      <Rocket className="h-4 w-4" style={{ color: themeColors.primary }} />
                      <span>
                        Pro trial · {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={settingsActive}
                  style={
                    settingsActive
                      ? { backgroundColor: alpha(themeColors.primary, '15'), color: themeColors.primary }
                      : undefined
                  }
                >
                  <Link to="/settings" onClick={() => isMobile && setOpenMobile(false)}>
                    <GearSix className="h-4 w-4" weight={settingsActive ? 'fill' : 'regular'} />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Everything below is secondary. Collapsed by default so Settings
                  and the upgrade prompt are not buried in a list of eight links. */}
              {/* Secondary links live in a pop-up menu so opening them never
                  changes the sidebar's height. */}
              <SidebarMenuItem>
                <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="sm" aria-label="More links">
                      <DotsThree className="h-4 w-4" />
                      <span>More</span>
                      <CaretUp
                        className={`h-3 w-3 ml-auto opacity-60 transition-transform duration-200 ${
                          moreOpen ? '' : 'rotate-180'
                        }`}
                      />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" sideOffset={8} className="min-w-52 rounded-lg">
                    {([
                      { label: 'Prop Firm Deals', icon: Tag, onSelect: () => goTo('/affiliate') },
                      { label: 'Blog', icon: RssSimple, onSelect: () => goTo('/blog') },
                      { label: 'Help & Docs', icon: Question, onSelect: () => goTo('/documentation') },
                      { label: 'Invite Friends', icon: Gift, onSelect: () => goTo('/settings?tab=subscription') },
                      { label: "What's New", icon: Megaphone, onSelect: () => setWhatsNewOpen(true) },
                      { label: 'Send Feedback', icon: ChatCircleText, onSelect: () => setFeedbackOpen(true) },
                    ] as const).map(({ label, icon: Icon, onSelect }) => (
                      <DropdownMenuItem key={label} className={isMobile ? 'h-11' : ''} onSelect={onSelect}>
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
        {(!isDemo || isScreenshotPreview(isDemo)) && (
          <>
            <SidebarSeparator className="mx-1 my-1" />
            <SidebarUser />
          </>
        )}
      </SidebarFooter>
      <WhatsNewDialog open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
      <FeedbackButton open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </Sidebar>
  )
}
