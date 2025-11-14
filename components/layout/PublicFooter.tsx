"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ChevronDown } from "lucide-react";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const footerSections = [
    {
      id: "about",
      title: "About",
      content: (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          SteppersLife Events is your premier platform for discovering and attending stepping
          events.
        </p>
      ),
    },
    {
      id: "organizers",
      title: "For Organizers",
      links: [
        { href: "/organizer/events/create", label: "Create Event" },
        { href: "/pricing", label: "Pricing" },
        { href: "/help", label: "Help Center" },
      ],
    },
    {
      id: "resources",
      title: "Resources",
      links: [
        { href: "/", label: "Browse Events" },
        { href: "/shop", label: "Shop" },
        { href: "/my-tickets", label: "My Tickets" },
      ],
    },
    {
      id: "legal",
      title: "Legal",
      links: [
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
      ],
    },
  ];

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        {/* Mobile Collapsible Sections */}
        <div className="md:hidden space-y-2">
          {footerSections.map((section) => (
            <div key={section.id} className="border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between py-3 text-left"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openSection === section.id ? "rotate-180" : ""
                  }`}
                />
              </button>
              <React.Fragment>
                {openSection === section.id && (
                  <div className="overflow-hidden">
                    <div className="pb-3">
                      {section.content ? (
                        section.content
                      ) : (
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          {section.links?.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                className="hover:text-primary transition-colors block"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            </div>
          ))}
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">About</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SteppersLife Events is your premier platform for discovering and attending stepping
              events.
            </p>
          </div>

          {/* For Organizers */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">For Organizers</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="/organizer/events/create"
                  className="hover:text-primary transition-colors"
                >
                  Create Event
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/my-tickets" className="hover:text-primary transition-colors">
                  My Tickets
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
              &copy; {currentYear} SteppersLife Events. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for the stepping
              community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
