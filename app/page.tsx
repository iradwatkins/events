export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Stepperslife Events
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Event Ticketing Platform - Under Development
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-semibold">System Status</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Next.js 16.0 Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Convex Backend Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>TypeScript Enabled</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Tailwind CSS v4</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-500">⚠</span>
                <span>Stripe Integration (Setup Required)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-500">⚠</span>
                <span>Google OAuth (Setup Required)</span>
              </div>
            </div>
          </div>

          {/* Features Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Planned Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Event Management</h3>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>• Create & manage events</li>
                  <li>• Multiple ticket tiers</li>
                  <li>• Real-time availability</li>
                  <li>• Event analytics</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Payment Processing</h3>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>• Stripe Connect integration</li>
                  <li>• Automatic split payments</li>
                  <li>• Platform fees (10%)</li>
                  <li>• Organizer payouts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">User Experience</h3>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>• Google OAuth sign-in</li>
                  <li>• QR code tickets</li>
                  <li>• Mobile-friendly</li>
                  <li>• Email notifications</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Organizer Tools</h3>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>• Dashboard analytics</li>
                  <li>• Ticket scanning</li>
                  <li>• Attendee management</li>
                  <li>• Revenue tracking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Configuration Required Card */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="text-yellow-500 mr-2">⚠</span>
              Configuration Required
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">1. Stripe Setup</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Add your Stripe API keys to <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">.env.local</code>
                </p>
                <ul className="ml-4 mt-1 text-gray-500 dark:text-gray-400">
                  <li>• STRIPE_SECRET_KEY</li>
                  <li>• NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</li>
                  <li>• STRIPE_WEBHOOK_SECRET</li>
                  <li>• STRIPE_CONNECT_CLIENT_ID</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">2. Stripe Connect</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Enable Stripe Connect in your Stripe Dashboard for split payments
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">3. Webhook Endpoint</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure webhook: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">https://events.stepperslife.com/api/stripe/webhook</code>
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Tech Stack</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl mb-2">⚛️</div>
                <div className="font-semibold">Next.js 16</div>
                <div className="text-sm text-gray-500">React Framework</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl mb-2">🔷</div>
                <div className="font-semibold">TypeScript</div>
                <div className="text-sm text-gray-500">Type Safety</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl mb-2">💳</div>
                <div className="font-semibold">Stripe</div>
                <div className="text-sm text-gray-500">Payments</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl mb-2">🗄️</div>
                <div className="font-semibold">Convex</div>
                <div className="text-sm text-gray-500">Backend</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
          <p>Ready for development • Port 3004 • https://events.stepperslife.com</p>
        </div>
      </div>
    </div>
  );
}
