"use client";

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
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  // TEMPORARY: Access control disabled for testing
  // Check if user is admin
  // if (currentUser === undefined) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
  //     </div>
  //   );
  // }

  // if (!currentUser || currentUser.role !== "admin") {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //       <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
  //         <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
  //         <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
  //         <p className="text-gray-600 mb-6">
  //           You don't have permission to access the admin dashboard.
  //         </p>
  //         <Link
  //           href="/"
  //           className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
  //         >
  //           Go to Homepage
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 border-b border-red-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs text-red-100">System Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser?.name || "Guest"}</p>
                <p className="text-xs text-red-100">{currentUser?.email || "Not logged in"}</p>
              </div>
              <Link
                href="/"
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors text-sm"
              >
                Exit Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? "border-red-600 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
