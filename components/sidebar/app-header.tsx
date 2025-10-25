'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { usePathname } from 'next/navigation'

export function AppHeader() {
  const pathname = usePathname()

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)

    if (paths[0] === 'organizer') {
      if (paths.length === 1 || (paths.length === 2 && paths[1] === 'events')) {
        return [
          { label: 'Dashboard', href: '/organizer/events', isLast: true }
        ]
      }

      if (paths[1] === 'events' && paths[2] === 'create') {
        return [
          { label: 'Dashboard', href: '/organizer/events', isLast: false },
          { label: 'Create Event', href: '/organizer/events/create', isLast: true }
        ]
      }

      if (paths[1] === 'events' && paths[2]) {
        return [
          { label: 'Dashboard', href: '/organizer/events', isLast: false },
          { label: 'Event Details', href: pathname, isLast: true }
        ]
      }
    }

    return [{ label: 'Dashboard', href: '/organizer/events', isLast: true }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
      <SidebarTrigger className="-ml-1" />
      <Separator className="mr-2 h-4" orientation="vertical" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem className="hidden md:block">
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

import * as React from 'react'
