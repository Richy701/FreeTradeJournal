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
        <SidebarGroup key={group.label} className="py-1">
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {group.items.map((item) => {
              const active = isItemActive(item.url, pathname)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={active}
                    className={isMobile ? "h-11" : "h-9"}
                    // The active row is the only coloured thing in the list, so
                    // it reads as "you are here" without a left rail.
                    style={
                      active
                        ? {
                            backgroundColor: alpha(themeColors.primary, '15'),
                            color: themeColors.primary,
                          }
                        : undefined
                    }
                  >
                    <Link
                      to={item.url}
                      onClick={() => {
                        trackEvent('sidebar_nav_clicked', { item: item.title, url: item.url })
                        isMobile && setOpenMobile(false)
                      }}
                    >
                      <div className="flex items-center justify-center size-6 rounded-md">
                        <item.icon className="size-4" weight={active ? 'fill' : 'regular'} />
                      </div>
                      <span>{item.title}</span>
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
