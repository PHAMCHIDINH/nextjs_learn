'use client'

import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { useAuth } from '@/core/providers/auth-provider'
import { cn } from '@/lib/utils'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'

type PageShellProps = {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  const { user } = useAuth()
  const shouldShowSidebar = Boolean(user)

  if (!shouldShowSidebar) {
    return (
      <div className={cn('min-h-screen', className)}>
        <Header />
        {children}
        <Footer />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className={cn('min-h-screen', className)}>
          <Header />
          {children}
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
