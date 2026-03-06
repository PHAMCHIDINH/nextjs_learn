'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusSquare,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import { departmentLabels } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/shared/ui/sidebar'

type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  exact?: boolean
}

const studentItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/post/new', label: 'Đăng tin', icon: PlusSquare },
  { href: '/chat', label: 'Tin nhắn', icon: MessageSquare },
]

const adminItems: NavItem[] = [{ href: '/admin', label: 'Admin panel', icon: ShieldCheck, exact: true }]

export function AppSidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const items = user?.role === 'admin' ? [...studentItems, ...adminItems] : studentItems

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Chợ Sinh Viên">
              <Link href="/">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Chợ Sinh Viên</span>
                  <span className="truncate text-xs text-muted-foreground">shadcn app shell</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-background/60 p-3">
          <Avatar className="size-10">
            <AvatarImage src={user?.avatar} alt={user?.name ?? 'User'} />
            <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{user?.name ?? 'Tai khoan'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user ? departmentLabels[user.department] : 'Chưa đăng nhập'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Đăng xuất</span>
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
