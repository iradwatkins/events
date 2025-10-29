"use client";

import { useState } from "react";
import {
  CreditCard,
  Package,
  Users,
  Calculator,
  Check,
  AlertCircle,
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

type PaymentModel = "PREPAY" | "CREDIT_CARD" | "CONSIGNMENT";
type PackageSize = 100 | 250 | 500 | 1000 | 2500;

const PACKAGES: { size: PackageSize; price: number; popular?: boolean }[] = [
  { size: 100, price: 30 },
  { size: 250, price: 75 },
  { size: 500, price: 150, popular: true },
  { size: 1000, price: 300 },
  { size: 2500, price: 750 }
];

const POWER_UP_PRICE_PER_TICKET = 0.50;

export default function PricingPage() {
  const [ticketPrice, setTicketPrice] = useState<string>("50");
  const [ticketQuantity, setTicketQuantity] = useState<string>("100");
  const [selectedPackage, setSelectedPackage] = useState<PackageSize | null>(null);
  const [powerUpQuantity, setPowerUpQuantity] = useState<number>(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Calculate fees for each model
  const calculateFees = () => {
    const price = parseFloat(ticketPrice) || 0;
    const quantity = parseInt(ticketQuantity) || 0;
    const revenue = price * quantity;

    // PREPAY calculation
    const prepayPackage = PACKAGES.find(p => p.size >= quantity) || PACKAGES[PACKAGES.length - 1];
    const prepayUpfrontCost = prepayPackage.price + (powerUpQuantity * POWER_UP_PRICE_PER_TICKET);
    const prepayProcessingFee = revenue * 0.029; // 2.9% processing only
    const prepayNet = revenue - prepayProcessingFee - prepayUpfrontCost;

    // CREDIT_CARD calculation
    const ccPlatformFee = (revenue * 0.037) + (1.79 * Math.ceil(quantity / 10)); // Assuming orders of 10
    const ccTotalWithPlatform = revenue + ccPlatformFee;
    const ccProcessingFee = ccTotalWithPlatform * 0.029;
    const ccNet = revenue - ccPlatformFee;

    // CONSIGNMENT calculation
    const consignPlatformFee = (quantity * 1.79) + (revenue * 0.037);
    const consignNet = revenue - consignPlatformFee;

    return {
      prepay: {
        upfront: prepayUpfrontCost,
        platformFee: 0,
        processingFee: prepayProcessingFee,
        net: prepayNet,
        total: revenue
      },
      creditCard: {
        upfront: 0,
        platformFee: ccPlatformFee,
        processingFee: ccProcessingFee,
        net: ccNet,
        total: revenue
      },
      consignment: {
        upfront: 0,
        platformFee: consignPlatformFee,
        processingFee: 0,
        net: consignNet,
        total: revenue,
        settlementDue: consignPlatformFee
      }
    };
  };

  const fees = calculateFees();

  const faqs = [
    {
      question: "What are power-ups?",
      answer: "Power-ups are emergency ticket allocations available at $0.50 per ticket when you need more tickets quickly after using your initial package."
    },
    {
      question: "When is consignment settlement due?",
      answer: "Settlement is due exactly 24 hours before your event starts. You'll receive reminders and can pay easily via Square or Cash App."
    },
    {
      question: "Can I mix payment models?",
      answer: "Yes! You can choose different payment models for different events. Each event can have its own payment configuration."
    },
    {
      question: "What if I can't settle on time?",
      answer: "Contact our support team immediately. We can work out payment plans or alternative arrangements to ensure your event proceeds smoothly."
    },
    {
      question: "Do charity events get discounts?",
      answer: "Yes! Registered charity events receive 50% off platform fees automatically."
    },
    {
      question: "How do split payments work?",
      answer: "With the Credit Card model, payments are automatically split. Customers pay online, and your revenue (minus fees) is instantly deposited to your Stripe account."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Simple, Transparent Event Pricing</h1>
            <p className="text-xl mb-8 text-emerald-100">
              Choose the payment model that works best for your event
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/organizer/events/create"
                className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
              >
                Create Your Event
              </Link>
              <a
                href="#calculator"
                className="bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors border border-emerald-500"
              >
                Calculate Fees
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Special Offers Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold">New Organizers: Get 200 FREE tickets!</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>Charity Events: 50% off platform fees</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Low-price events under $20: Automatic 50% discount</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Models */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Three Flexible Payment Models</h2>
          <p className="text-lg text-gray-600">Pick the one that matches your event style</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* PREPAY Model */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-emerald-200">
            <div className="bg-emerald-600 text-white p-6">
              <Package className="w-12 h-12 mb-3" />
              <h3 className="text-2xl font-bold mb-2">PREPAY</h3>
              <p className="text-emerald-100">Buy Tickets in Bulk, Save on Fees</p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900">$0.30</p>
                <p className="text-gray-600">per ticket upfront</p>
              </div>

              <div className="mb-6">
                <p className="font-semibold text-gray-900 mb-2">Package Options:</p>
                <div className="space-y-2">
                  {PACKAGES.map(pkg => (
                    <div key={pkg.size} className="flex justify-between items-center">
                      <span className="text-gray-600">{pkg.size.toLocaleString()} tickets</span>
                      <span className="font-semibold">${pkg.price}</span>
                      {pkg.popular && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="font-semibold text-sm">Power-Ups Available!</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Need more tickets? Get power-ups at $0.50/ticket
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">Lowest fees (2.9% processing only)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">No platform fees on sales</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">Best for high-volume events</span>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <img src="/square-logo.png" alt="Square" className="h-8" />
                <img src="/cashapp-logo.png" alt="Cash App" className="h-8" />
              </div>
            </div>
          </div>

          {/* CREDIT_CARD Model */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-blue-200">
            <div className="bg-blue-600 text-white p-6">
              <CreditCard className="w-12 h-12 mb-3" />
              <h3 className="text-2xl font-bold mb-2">CREDIT CARD</h3>
              <p className="text-blue-100">Pay As You Sell - Split Payments</p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900">$0</p>
                <p className="text-gray-600">upfront cost</p>
              </div>

              <div className="mb-6">
                <p className="font-semibold text-gray-900 mb-2">How It Works:</p>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-semibold">1.</span>
                    Customer pays online via Stripe
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">2.</span>
                    Automatic split payment processing
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">3.</span>
                    Instant settlement to your account
                  </li>
                </ol>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-semibold text-sm mb-1">Fees:</p>
                  <p className="text-xs text-gray-600">3.7% + $1.79 platform fee</p>
                  <p className="text-xs text-gray-600">+ 2.9% processing</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">No upfront costs</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">Real-time online sales</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">Automatic payment splitting</span>
                </div>
              </div>

              <div className="flex justify-center">
                <img src="/stripe-logo.png" alt="Stripe" className="h-8" />
              </div>
            </div>
          </div>

          {/* CONSIGNMENT Model */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-200">
            <div className="bg-purple-600 text-white p-6">
              <Users className="w-12 h-12 mb-3" />
              <h3 className="text-2xl font-bold mb-2">CONSIGNMENT</h3>
              <p className="text-purple-100">Sell First, Settle Later</p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900">$0</p>
                <p className="text-gray-600">upfront cost</p>
              </div>

              <div className="mb-6">
                <p className="font-semibold text-gray-900 mb-2">How It Works:</p>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-semibold">1.</span>
                    Staff sells tickets (cash/card)
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">2.</span>
                    Track all sales in system
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">3.</span>
                    Settle 24 hours before event
                  </li>
                </ol>
              </div>

              <div className="mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-sm">Settlement Timeline</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Due 24 hours before event via Square/Cash App
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">Perfect for in-person sales</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">Great for street teams</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">Cash-friendly</span>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <img src="/square-logo.png" alt="Square" className="h-8" />
                <img src="/cashapp-logo.png" alt="Cash App" className="h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Calculator */}
      <div id="calculator" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Calculator className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fee Calculator</h2>
            <p className="text-lg text-gray-600">
              Compare costs and revenue across all payment models
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Price ($)
                </label>
                <input
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Sales
                </label>
                <input
                  type="number"
                  value={ticketQuantity}
                  onChange={(e) => setTicketQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* PREPAY Results */}
              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4 text-emerald-700">PREPAY</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upfront Cost:</span>
                    <span className="font-semibold">${fees.prepay.upfront.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fees:</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing:</span>
                    <span className="font-semibold">${fees.prepay.processingFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Your Revenue:</span>
                      <span className="font-bold text-emerald-600">
                        ${fees.prepay.net.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CREDIT_CARD Results */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4 text-blue-700">CREDIT CARD</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upfront Cost:</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fees:</span>
                    <span className="font-semibold">${fees.creditCard.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing:</span>
                    <span className="font-semibold">${fees.creditCard.processingFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Your Revenue:</span>
                      <span className="font-bold text-blue-600">
                        ${fees.creditCard.net.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONSIGNMENT Results */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4 text-purple-700">CONSIGNMENT</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upfront Cost:</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fees:</span>
                    <span className="font-semibold">${fees.consignment.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing:</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Your Revenue:</span>
                      <span className="font-bold text-purple-600">
                        ${fees.consignment.net.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Settlement due: ${fees.consignment.settlementDue?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features for Every Event</h2>
          <p className="text-lg text-gray-600">Everything you need to sell tickets successfully</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-emerald-600 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Early Bird Pricing</h3>
              <p className="text-sm text-gray-600">
                Set time-based pricing tiers to boost early sales
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-6 h-6 text-emerald-600 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Staff Commissions</h3>
              <p className="text-sm text-gray-600">
                Motivate your team with percentage or fixed commissions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package className="w-6 h-6 text-emerald-600 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Multi-Event Bundles</h3>
              <p className="text-sm text-gray-600">
                Create package deals across multiple events
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <DollarSign className="w-6 h-6 text-emerald-600 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Discount Codes</h3>
              <p className="text-sm text-gray-600">
                Offer percentage or fixed amount discounts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-6 h-6 text-emerald-600 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Assigned Seating</h3>
              <p className="text-sm text-gray-600">
                Visual seating charts with section pricing
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-emerald-600 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Real-Time Analytics</h3>
              <p className="text-sm text-gray-600">
                Track sales, revenue, and attendance in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <HelpCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Got questions? We've got answers</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Selling Tickets?</h2>
          <p className="text-xl mb-8 text-emerald-100">
            Join thousands of successful event organizers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/organizer/events/create"
              className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              Create Your First Event
            </Link>
            <a
              href="mailto:support@stepperslife.com"
              className="bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors border border-emerald-500"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}