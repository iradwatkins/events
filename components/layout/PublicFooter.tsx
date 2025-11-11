"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">About</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SteppersLife Events is your premier platform for discovering and attending stepping events.
            </p>
          </div>

          {/* For Organizers */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">For Organizers</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/organizer/events/create" className="hover:text-primary transition-colors">
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
              Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for the stepping community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
