"use client"

import { type Icon } from '@phosphor-icons/react'
import { Link, useLocation } from "react-router-dom"
import { useThemePresets } from "@/contexts/theme-presets"
import { trackEvent } from "@/lib/analytics"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

function isItemActive(url: string, pathname: string): boolean {
  if (url === "/dashboard") return pathname === "/dashboard"
  return pathname.startsWith(url)
}

export type NavItem = {
  title: string
  url: string
  icon: Icon
  /** Small tag after the title, e.g. "Beta". Hidden when the sidebar is collapsed to icons. */
  badge?: string
  /** Unread-style count. Takes the badge's place while it is above zero; `countCap` and up render as "cap+". */
  count?: number
  countCap?: number
}

function formatCount(count: number, cap?: number): string {
  return cap !== undefined && count > cap ? `${cap}+` : String(count)
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const { pathname } = useLocation()
  const { themeColors, alpha } = useThemePresets()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="px-3 py-2">
          <SidebarGroupLabel className="h-7 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">{group.label}</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {group.items.map((item) => {
              const active = isItemActive(item.url, pathname)
              const count = item.count && item.count > 0 ? formatCount(item.count, item.countCap) : null
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={count ? `${item.title} (${count} new)` : item.badge ? `${item.title} (${item.badge})` : item.title}
                    isActive={active}
                    className={`relative rounded-lg px-2.5 ${isMobile ? "h-11" : "h-10"}`}
                    // The active row is the only coloured thing in the list, so
                    // it reads as "you are here" without a left rail.
                    style={
                      active
                        ? {
                            backgroundColor: alpha(themeColors.primary, '08'),
                            color: themeColors.primary,
                          }
                        : undefined
                    }
                  >
                    <Link
                      to={item.url}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        trackEvent('sidebar_nav_clicked', { item: item.title, url: item.url })
                        isMobile && setOpenMobile(false)
                      }}
                    >
                      {active && <span aria-hidden="true" className="absolute left-0 h-4 w-0.5 rounded-full" style={{ backgroundColor: themeColors.primary }} />}
                      <div className="flex items-center justify-center size-5 shrink-0">
                        <item.icon className="size-4" weight={active ? 'fill' : 'regular'} />
                      </div>
                      <span>{item.title}</span>
                      {count ? (
                        <span
                          className="ml-auto min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-semibold tabular-nums group-data-[collapsible=icon]:hidden"
                          style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                          aria-label={`${count} new`}
                        >
                          {count}
                        </span>
                      ) : item.badge && (
                        <span
                          className="ml-auto rounded-full px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide group-data-[collapsible=icon]:hidden"
                          style={{ backgroundColor: alpha(themeColors.primary, '08'), color: themeColors.primary }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
