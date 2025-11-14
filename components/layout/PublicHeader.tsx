"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  Plus,
  LogOut,
  User,
  Ticket,
  Calendar,
  LogIn,
  Sun,
  Moon,
  Menu,
  X,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";

interface PublicHeaderProps {
  showCreateButton?: boolean;
  showNavigation?: boolean;
}

export function PublicHeader({
  showCreateButton = true,
  showNavigation = true,
}: PublicHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigationLinks = [
    { href: "/", label: "Events" },
    { href: "/shop", label: "Shop" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div
              className="relative w-auto h-19 sm:h-[91px] md:h-[106px] lg:h-[122px]"
              style={{ aspectRatio: "3/1" }}
            >
              {mounted && (
                <Image
                  key={theme}
                  src={
                    theme === "dark"
                      ? "/logos/stepperslife-logo-dark.svg"
                      : "/logos/stepperslife-logo-light.svg"
                  }
                  alt="SteppersLife Events"
                  fill
                  className="object-contain"
                  priority
                />
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          {showNavigation && (
            <nav className="hidden lg:flex items-center gap-6">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button - Hidden on mobile (forced light theme) */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hidden md:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            )}

            {/* Shop Cart Icon (visible on all devices) */}
            <Link
              href="/shop"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center min-h-[48px] min-w-[48px]"
              title="Shop"
              aria-label="Shop"
            >
              <ShoppingBag className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </Link>

            {isAuthenticated ? (
              <>
                {/* Profile Dropdown */}
                <div className="relative hidden sm:block" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>

                  <React.Fragment>
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <Link
                          href="/my-tickets"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Ticket className="w-4 h-4" />
                          My Tickets
                        </Link>
                        <Link
                          href="/organizer/events"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          My Events
                        </Link>
                        {user?.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}

                        {/* Sign Out */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700 mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                </div>

                {/* Create Event Button */}
                {showCreateButton && (
                  <div className="hidden sm:block">
                    <Link
                      href="/organizer/events/create"
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Create Event</span>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Logged out navigation - Single Sign In button */}
                <div className="hidden sm:block">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden md:inline">Sign In</span>
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <React.Fragment>
          {isMobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-2">
              {/* Navigation Links */}
              {showNavigation &&
                navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}

              {/* Theme Toggle for Mobile */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[48px]"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-5 h-5" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5" />
                      Dark Mode
                    </>
                  )}
                </button>
              )}

              {isAuthenticated ? (
                <>
                  {/* Mobile Profile Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    <Link
                      href="/my-tickets"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Ticket className="w-4 h-4" />
                      My Tickets
                    </Link>
                    <Link
                      href="/organizer/events"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      My Events
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    {showCreateButton && (
                      <Link
                        href="/organizer/events/create"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create Event
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Mobile menu - Single Sign In button */}
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors font-medium min-h-[48px]"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                </>
              )}
            </div>
          )}
        </React.Fragment>
      </div>
    </header>
  );
}
