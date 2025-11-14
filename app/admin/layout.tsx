"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  AlertCircle,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Upload,
  Package,
  ShoppingCart,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Upload Flyers", href: "/admin/events/upload-flyers", icon: Upload },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "CRM", href: "/admin/crm", icon: Database },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile, mobileMenuOpen]);

  // Sidebar content component (reused for desktop and mobile)
  const SidebarContent = () => (
    <>
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
              >
                <Link href="/" className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-white flex-shrink-0" />
                  <div>
                    <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                    <p className="text-xs text-primary-foreground/80">SteppersLife</p>
                  </div>
                </Link>
              </motion.div>
            )}
            {sidebarCollapsed && !isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mx-auto"
              >
                <Link href="/" className="block">
                  <Shield className="w-8 h-8 text-white" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-white hover:bg-primary/80 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-lg transition-all min-h-[48px]
                ${
                  isActive
                    ? "bg-white text-foreground shadow-md"
                    : "text-white hover:bg-primary/80 hover:shadow-sm"
                }
                ${sidebarCollapsed && !isMobile ? "justify-center" : ""}
              `}
              title={sidebarCollapsed && !isMobile ? item.name : undefined}
            >
              <Icon
                className={`flex-shrink-0 ${sidebarCollapsed && !isMobile ? "w-6 h-6" : "w-5 h-5"}`}
              />
              <AnimatePresence mode="wait">
                {(!sidebarCollapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium text-sm whitespace-nowrap overflow-hidden"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Toggle */}
      <div className="border-t border-primary/80 p-4">
        <AnimatePresence mode="wait">
          {(!sidebarCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4"
            >
              <div className="bg-primary/80 rounded-lg p-3">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser?.name || "Guest"}
                </p>
                <p className="text-xs text-primary-foreground/80 truncate">
                  {currentUser?.email || "Not logged in"}
                </p>
              </div>
              <Link
                href="/"
                className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-3 bg-primary/80 text-white rounded-lg hover:bg-primary/70 transition-colors text-sm min-h-[48px]"
              >
                <LogOut className="w-5 h-5" />
                Exit Admin
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theme Toggle Button */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 mb-2 bg-primary/80 text-white rounded-lg hover:bg-primary/70 transition-colors min-h-[48px]"
            title={
              sidebarCollapsed && !isMobile
                ? theme === "dark"
                  ? "Light mode"
                  : "Dark mode"
                : undefined
            }
          >
            {theme === "dark" ? (
              <>
                <Sun className={sidebarCollapsed && !isMobile ? "w-5 h-5" : "w-4 h-4"} />
                <AnimatePresence mode="wait">
                  {(!sidebarCollapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      Light Mode
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <>
                <Moon className={sidebarCollapsed && !isMobile ? "w-5 h-5" : "w-4 h-4"} />
                <AnimatePresence mode="wait">
                  {(!sidebarCollapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      Dark Mode
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </button>
        )}

        {/* Collapse Toggle Button (Desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-primary/80 text-white rounded-lg hover:bg-primary/70 transition-colors min-h-[48px]"
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
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header with Hamburger */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
            <div className="w-10 h-10 bg-accent text-foreground rounded-full flex items-center justify-center font-bold text-sm">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-primary shadow-xl flex flex-col fixed h-screen z-50"
        >
          <SidebarContent />
        </motion.aside>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <motion.aside
          initial={{ x: "-100%" }}
          animate={{ x: mobileMenuOpen ? 0 : "-100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-primary shadow-xl flex flex-col fixed h-screen z-50 w-[280px]"
        >
          <SidebarContent />
        </motion.aside>
      )}

      {/* Main Content Area */}
      <motion.div
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : sidebarCollapsed ? 80 : 280,
          paddingTop: isMobile ? 64 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 flex flex-col min-h-screen"
      >
        {/* Top Header Bar (Desktop only) */}
        {!isMobile && (
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {navigation.find((item) => item.href === pathname)?.name || "Admin Dashboard"}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    System Administration & Management
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent text-foreground rounded-full flex items-center justify-center font-bold">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 px-4 md:px-6 py-6 md:py-8 overflow-y-auto">{children}</main>
      </motion.div>
    </div>
  );
}
