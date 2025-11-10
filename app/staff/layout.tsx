'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  DollarSign,
  ArrowRightLeft,
  Users,
  ChevronLeft,
  ChevronRight,
  Home,
  Share2,
  Wallet,
  Settings,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navItems = [
    {
      title: 'Dashboard',
      href: '/staff/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Register Sale',
      href: '/staff/register-sale',
      icon: DollarSign,
    },
    {
      title: 'Cash Orders',
      href: '/staff/cash-orders',
      icon: Wallet,
    },
    {
      title: 'My Team',
      href: '/staff/my-team',
      icon: Users,
    },
    {
      title: 'Ticket Transfers',
      href: '/staff/transfers',
      icon: ArrowRightLeft,
    },
    {
      title: 'Settings',
      href: '/staff/settings',
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Collapsible Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-primary shadow-xl flex flex-col fixed h-screen z-50"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-primary/80">
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <Share2 className="w-8 h-8 text-white shrink-0" />
                  <div>
                    <h1 className="text-lg font-bold text-white">Staff Portal</h1>
                    <p className="text-xs text-primary-foreground/80">SteppersLife</p>
                  </div>
                </motion.div>
              )}
              {sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mx-auto"
                >
                  <Share2 className="w-8 h-8 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                  ${
                    isActive
                      ? "bg-white text-foreground shadow-md"
                      : "text-white hover:bg-primary/80 hover:shadow-sm"
                  }
                  ${sidebarCollapsed ? "justify-center" : ""}
                `}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <Icon className={`shrink-0 ${sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"}`} />
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium text-sm whitespace-nowrap overflow-hidden"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Footer with Home Link & Collapse Toggle */}
        <div className="border-t border-primary/80 p-4">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary/70 transition-colors text-sm"
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary/70 transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 min-h-screen"
      >
        <main>{children}</main>
      </motion.div>
    </div>
  )
}
