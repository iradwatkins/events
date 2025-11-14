"use client";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function TermsPage() {
  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Terms of Service page coming soon.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            For questions, please contact us at support@stepperslife.com
          </p>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
