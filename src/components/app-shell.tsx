'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { cn } from '@/lib/utils'
import { Separator } from '@/shared/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/ui/sidebar'

type BreadcrumbItem = {
  label: string
  href?: string
}

type AppShellProps = {
  title: string
  description: string
  children: ReactNode
  actions?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  contentClassName?: string
}

export function AppShell({
  title,
  description,
  children,
  actions,
  breadcrumbs,
  contentClassName,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <div className="min-w-0">
              {breadcrumbs?.length ? (
                <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1
                    const key = `${item.label}-${index}`

                    return (
                      <span key={key} className="inline-flex items-center gap-1">
                        {item.href && !isLast ? (
                          <Link href={item.href} className="transition-colors hover:text-foreground">
                            {item.label}
                          </Link>
                        ) : (
                          <span>{item.label}</span>
                        )}
                        {!isLast ? <span>/</span> : null}
                      </span>
                    )
                  })}
                </nav>
              ) : null}
              <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
        <div className="flex-1 bg-muted/30">
          <div className={cn('mx-auto w-full max-w-7xl px-4 py-6', contentClassName)}>{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
