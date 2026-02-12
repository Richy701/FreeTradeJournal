"use client"

import { type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useThemePresets } from "@/contexts/theme-presets"
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

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const { pathname } = useLocation()
  const { themeColors } = useThemePresets()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active = isItemActive(item.url, pathname)
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={active}
                style={
                  active
                    ? { backgroundColor: `${themeColors.primary}15` }
                    : undefined
                }
              >
                <Link
                  to={item.url}
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
