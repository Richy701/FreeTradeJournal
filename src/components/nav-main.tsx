"use client"

import { type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useThemePresets } from "@/contexts/theme-presets"
import {
  SidebarGroup,
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
  const { themeColors, alpha } = useThemePresets()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const active = isItemActive(item.url, pathname)
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={active}
                className="relative"
                style={
                  active
                    ? { backgroundColor: alpha(themeColors.primary, '15') }
                    : undefined
                }
              >
                <Link
                  to={item.url}
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <div
                    className="flex items-center justify-center size-6 rounded-md"
                    style={{
                      backgroundColor: active ? alpha(themeColors.primary, '20') : 'transparent',
                      color: active ? themeColors.primary : undefined,
                    }}
                  >
                    <item.icon className="size-4" />
                  </div>
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
