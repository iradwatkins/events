"use client";

import { useState } from "react";
import {
  CreditCard,
  Package,
  Users,
  Calculator,
  Check,
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

type PaymentModel = "PREPAY" | "CREDIT_CARD" | "CONSIGNMENT";
type PackageSize = 100 | 250 | 500 | 1000 | 2500;

const PACKAGES: { size: PackageSize; price: number; popular?: boolean }[] = [
  { size: 100, price: 30 },
  { size: 250, price: 75 },
  { size: 500, price: 150, popular: true },
  { size: 1000, price: 300 },
  { size: 2500, price: 750 },
];

const POWER_UP_PRICE_PER_TICKET = 0.5;

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
    const prepayPackage = PACKAGES.find((p) => p.size >= quantity) || PACKAGES[PACKAGES.length - 1];
    const prepayUpfrontCost = prepayPackage.price + powerUpQuantity * POWER_UP_PRICE_PER_TICKET;
    const prepayProcessingFee = revenue * 0.029; // 2.9% processing only
    const prepayNet = revenue - prepayProcessingFee - prepayUpfrontCost;

    // CREDIT_CARD calculation
    const ccPlatformFee = revenue * 0.037 + 1.79 * Math.ceil(quantity / 10); // Assuming orders of 10
    const ccTotalWithPlatform = revenue + ccPlatformFee;
    const ccProcessingFee = ccTotalWithPlatform * 0.029;
    const ccNet = revenue - ccPlatformFee;

    // CONSIGNMENT calculation
    const consignPlatformFee = quantity * 1.79 + revenue * 0.037;
    const consignNet = revenue - consignPlatformFee;

    return {
      prepay: {
        upfront: prepayUpfrontCost,
        platformFee: 0,
        processingFee: prepayProcessingFee,
        net: prepayNet,
        total: revenue,
      },
      creditCard: {
        upfront: 0,
        platformFee: ccPlatformFee,
        processingFee: ccProcessingFee,
        net: ccNet,
        total: revenue,
      },
      consignment: {
        upfront: 0,
        platformFee: consignPlatformFee,
        processingFee: 0,
        net: consignNet,
        total: revenue,
        settlementDue: consignPlatformFee,
      },
    };
  };

  const fees = calculateFees();

  const faqs = [
    {
      question: "What are power-ups?",
      answer:
        "Power-ups are emergency ticket allocations available at $0.50 per ticket when you need more tickets quickly after using your initial package.",
    },
    {
      question: "When is consignment settlement due?",
      answer:
        "Settlement is due exactly 24 hours before your event starts. You'll receive reminders and can pay easily via Square or Cash App.",
    },
    {
      question: "Can I mix payment models?",
      answer:
        "Yes! You can choose different payment models for different events. Each event can have its own payment configuration.",
    },
    {
      question: "What if I can't settle on time?",
      answer:
        "Contact our support team immediately. We can work out payment plans or alternative arrangements to ensure your event proceeds smoothly.",
    },
    {
      question: "Do charity events get discounts?",
      answer: "Yes! Registered charity events receive 50% off platform fees automatically.",
    },
    {
      question: "How do split payments work?",
      answer:
        "With the Credit Card model, payments are automatically split. Customers pay online, and your revenue (minus fees) is instantly deposited to your Stripe account.",
    },
  ];

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section with Background Image */}
        <div className="relative bg-primary text-white py-20 overflow-hidden">
          {/* Background Image Overlay */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2940&auto=format&fit=crop"
              alt="Event crowd"
              fill
              className="object-cover opacity-20"
              priority
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-emerald-200 relative">
              {/* Model Image */}
              <div className="h-48 relative">
                <Image
                  src="https://images.unsplash.com/photo-1556742400-b5b7e6f9f7f0?q=80&w=2940&auto=format&fit=crop"
                  alt="PREPAY model"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-primary flex items-end">
                  <div className="p-6 text-white">
                    <Package className="w-12 h-12 mb-3" />
                    <h3 className="text-2xl font-bold mb-2">PREPAY</h3>
                    <p className="text-emerald-100">Buy Tickets in Bulk, Save on Fees</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900">$0.30</p>
                  <p className="text-gray-600">per ticket upfront</p>
                </div>

                <div className="mb-6">
                  <p className="font-semibold text-gray-900 mb-2">Package Options:</p>
                  <div className="space-y-2">
                    {PACKAGES.map((pkg) => (
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
                    <span className="text-sm text-gray-700">
                      Lowest fees (2.9% processing only)
                    </span>
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

                <div className="flex gap-4 justify-center items-center">
                  {/* Square Logo */}
                  <svg className="h-8" viewBox="0 0 44 44" fill="none">
                    <rect width="44" height="44" rx="8" fill="#00D632" />
                    <path
                      d="M29.5 20.5C29.5 20.9 29.3 21.3 29 21.5L26.2 24.3C26 24.5 25.7 24.6 25.4 24.6C25.1 24.6 24.8 24.5 24.6 24.3C24.2 23.9 24.2 23.3 24.6 22.9L25.7 21.8H18.5C17.9 21.8 17.5 21.4 17.5 20.8C17.5 20.2 17.9 19.8 18.5 19.8H25.7L24.6 18.7C24.2 18.3 24.2 17.7 24.6 17.3C25 16.9 25.6 16.9 26 17.3L28.8 20.1C29.2 20.3 29.4 20.6 29.5 20.5ZM33 11H11C9.3 11 8 12.3 8 14V30C8 31.7 9.3 33 11 33H33C34.7 33 36 31.7 36 30V14C36 12.3 34.7 11 33 11Z"
                      fill="white"
                    />
                  </svg>

                  {/* Cash App Logo */}
                  <svg className="h-8" viewBox="0 0 120 120" fill="none">
                    <rect width="120" height="120" rx="24" fill="#00D632" />
                    <path
                      d="M84.5 42.5C84.5 41.1 83.4 40 82 40C80.6 40 79.5 41.1 79.5 42.5C79.5 46.4 77.1 49.8 73.5 51.3C72.2 51.9 71.7 53.5 72.3 54.8C72.7 55.7 73.6 56.2 74.5 56.2C74.8 56.2 75.2 56.1 75.5 56C81.1 53.6 84.5 48.5 84.5 42.5ZM67.2 44.8C66.7 42.3 64.5 40.5 62 40.5H53.5V36.5C53.5 35.1 52.4 34 51 34C49.6 34 48.5 35.1 48.5 36.5V40.5H45C43.6 40.5 42.5 41.6 42.5 43C42.5 44.4 43.6 45.5 45 45.5H48.5V65.5H45C43.6 65.5 42.5 66.6 42.5 68C42.5 69.4 43.6 70.5 45 70.5H48.5V74.5C48.5 75.9 49.6 77 51 77C52.4 77 53.5 75.9 53.5 74.5V70.5H62.5C65 70.5 67.2 68.7 67.7 66.2C68 63.7 66.7 61.5 64.5 60.5C66.7 59.5 68 57.3 67.7 54.8C67.2 52.3 65 50.5 62.5 50.5H53.5V45.5H62C62.3 45.5 62.5 45.7 62.5 46V47C62.5 48.4 63.6 49.5 65 49.5C66.4 49.5 67.5 48.4 67.5 47V46C67.5 45.5 67.4 45.1 67.2 44.8ZM62.5 55.5C62.8 55.5 63 55.7 63 56V57C63 57.3 62.8 57.5 62.5 57.5H53.5V55.5H62.5ZM53.5 65.5V63.5H62.5C62.8 63.5 63 63.7 63 64V65C63 65.3 62.8 65.5 62.5 65.5H53.5Z"
                      fill="white"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* CREDIT_CARD Model */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-border relative">
              {/* Model Image */}
              <div className="h-48 relative">
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2940&auto=format&fit=crop"
                  alt="Credit Card model"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-primary flex items-end">
                  <div className="p-6 text-white">
                    <CreditCard className="w-12 h-12 mb-3" />
                    <h3 className="text-2xl font-bold mb-2">CREDIT CARD</h3>
                    <p className="text-blue-100">Pay As You Sell - Split Payments</p>
                  </div>
                </div>
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
                  {/* Stripe Logo */}
                  <svg className="h-10" viewBox="0 0 60 25" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M59.64 11.28C59.64 7.04 57.72 4.52 53.92 4.52C50.1 4.52 47.74 7.04 47.74 11.24C47.74 16.12 50.54 18.08 54.58 18.08C56.5 18.08 57.98 17.64 58.98 17.12V14.24C57.98 14.72 56.66 15.04 54.94 15.04C53.36 15.04 51.82 14.54 51.64 12.48H59.58C59.58 12.28 59.64 11.68 59.64 11.28ZM51.6 9.92C51.6 7.94 52.76 7.32 53.88 7.32C54.98 7.32 56.06 7.94 56.06 9.92H51.6ZM41.16 4.52C39.56 4.52 38.52 5.24 37.94 5.72L37.76 4.76H34.34V22.48L38 21.72V17.3C38.6 17.68 39.44 18.08 40.98 18.08C43.66 18.08 46.12 16.06 46.12 11.16C46.1 6.82 43.64 4.52 41.16 4.52ZM40.32 15.02C39.34 15.02 38.72 14.7 38.28 14.32V8.14C38.76 7.72 39.4 7.42 40.32 7.42C41.86 7.42 42.94 9.04 42.94 11.2C42.94 13.42 41.9 15.02 40.32 15.02ZM28.62 3.8L32.3 3.02V0L28.62 0.76V3.8ZM32.3 4.76H28.62V17.84H32.3V4.76ZM23.24 5.78L23.02 4.76H19.64V17.84H23.32V8.48C24.14 7.38 25.58 7.64 26.06 7.82V4.52C25.56 4.32 24.06 3.98 23.24 5.78ZM14.82 2.12L11.2 2.86L11.18 14.52C11.18 16.64 12.74 18.1 14.96 18.1C16.16 18.1 17.04 17.88 17.46 17.64V14.76C17.06 14.92 14.84 15.52 14.84 13.4V7.66H17.46V4.76H14.84L14.82 2.12ZM5.52 9.42C5.52 8.86 5.96 8.62 6.72 8.62C7.86 8.62 9.26 8.96 10.4 9.58V6.26C9.14 5.72 7.88 5.48 6.72 5.48C3.82 5.48 1.9 6.98 1.9 9.64C1.9 13.68 7.14 13.08 7.14 14.64C7.14 15.3 6.6 15.5 5.78 15.5C4.52 15.5 2.94 15 1.66 14.32V17.7C3.08 18.32 4.52 18.58 5.78 18.58C8.76 18.58 10.82 17.14 10.82 14.42C10.8 10.08 5.52 10.78 5.52 9.42Z"
                      fill="#6772E5"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* CONSIGNMENT Model */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-primary/30 relative">
              {/* Model Image */}
              <div className="h-48 relative">
                <Image
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940&auto=format&fit=crop"
                  alt="Consignment model"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-primary flex items-end">
                  <div className="p-6 text-white">
                    <Users className="w-12 h-12 mb-3" />
                    <h3 className="text-2xl font-bold mb-2">CONSIGNMENT</h3>
                    <p className="text-blue-100">Sell First, Settle Later</p>
                  </div>
                </div>
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
                  <div className="bg-accent border border-primary/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
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

                <div className="flex gap-4 justify-center items-center">
                  {/* Square Logo */}
                  <svg className="h-8" viewBox="0 0 44 44" fill="none">
                    <rect width="44" height="44" rx="8" fill="#00D632" />
                    <path
                      d="M29.5 20.5C29.5 20.9 29.3 21.3 29 21.5L26.2 24.3C26 24.5 25.7 24.6 25.4 24.6C25.1 24.6 24.8 24.5 24.6 24.3C24.2 23.9 24.2 23.3 24.6 22.9L25.7 21.8H18.5C17.9 21.8 17.5 21.4 17.5 20.8C17.5 20.2 17.9 19.8 18.5 19.8H25.7L24.6 18.7C24.2 18.3 24.2 17.7 24.6 17.3C25 16.9 25.6 16.9 26 17.3L28.8 20.1C29.2 20.3 29.4 20.6 29.5 20.5ZM33 11H11C9.3 11 8 12.3 8 14V30C8 31.7 9.3 33 11 33H33C34.7 33 36 31.7 36 30V14C36 12.3 34.7 11 33 11Z"
                      fill="white"
                    />
                  </svg>

                  {/* Cash App Logo */}
                  <svg className="h-8" viewBox="0 0 120 120" fill="none">
                    <rect width="120" height="120" rx="24" fill="#00D632" />
                    <path
                      d="M84.5 42.5C84.5 41.1 83.4 40 82 40C80.6 40 79.5 41.1 79.5 42.5C79.5 46.4 77.1 49.8 73.5 51.3C72.2 51.9 71.7 53.5 72.3 54.8C72.7 55.7 73.6 56.2 74.5 56.2C74.8 56.2 75.2 56.1 75.5 56C81.1 53.6 84.5 48.5 84.5 42.5ZM67.2 44.8C66.7 42.3 64.5 40.5 62 40.5H53.5V36.5C53.5 35.1 52.4 34 51 34C49.6 34 48.5 35.1 48.5 36.5V40.5H45C43.6 40.5 42.5 41.6 42.5 43C42.5 44.4 43.6 45.5 45 45.5H48.5V65.5H45C43.6 65.5 42.5 66.6 42.5 68C42.5 69.4 43.6 70.5 45 70.5H48.5V74.5C48.5 75.9 49.6 77 51 77C52.4 77 53.5 75.9 53.5 74.5V70.5H62.5C65 70.5 67.2 68.7 67.7 66.2C68 63.7 66.7 61.5 64.5 60.5C66.7 59.5 68 57.3 67.7 54.8C67.2 52.3 65 50.5 62.5 50.5H53.5V45.5H62C62.3 45.5 62.5 45.7 62.5 46V47C62.5 48.4 63.6 49.5 65 49.5C66.4 49.5 67.5 48.4 67.5 47V46C67.5 45.5 67.4 45.1 67.2 44.8ZM62.5 55.5C62.8 55.5 63 55.7 63 56V57C63 57.3 62.8 57.5 62.5 57.5H53.5V55.5H62.5ZM53.5 65.5V63.5H62.5C62.8 63.5 63 63.7 63 64V65C63 65.3 62.8 65.5 62.5 65.5H53.5Z"
                      fill="white"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Calculator with Background Image */}
        <div id="calculator" className="relative bg-gray-50 py-16">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2940&auto=format&fit=crop"
              alt="Calculator background"
              fill
              className="object-cover opacity-5"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="bg-accent rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-primary">CREDIT CARD</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Upfront Cost:</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fees:</span>
                      <span className="font-semibold">
                        ${fees.creditCard.platformFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing:</span>
                      <span className="font-semibold">
                        ${fees.creditCard.processingFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold">Your Revenue:</span>
                        <span className="font-bold text-primary">
                          ${fees.creditCard.net.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONSIGNMENT Results */}
                <div className="bg-accent rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-primary">CONSIGNMENT</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Upfront Cost:</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fees:</span>
                      <span className="font-semibold">
                        ${fees.consignment.platformFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing:</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold">Your Revenue:</span>
                        <span className="font-bold text-primary">
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

        {/* Features Grid with Background */}
        <div className="relative py-16 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2940&auto=format&fit=crop"
              alt="Features background"
              fill
              className="object-cover opacity-10"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Powerful Features for Every Event
              </h2>
              <p className="text-lg text-gray-600">
                Everything you need to sell tickets successfully
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur p-4 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Early Bird Pricing</h3>
                  <p className="text-sm text-gray-600">
                    Set time-based pricing tiers to boost early sales
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur p-4 rounded-lg">
                <Users className="w-6 h-6 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Staff Commissions</h3>
                  <p className="text-sm text-gray-600">
                    Motivate your team with percentage or fixed commissions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur p-4 rounded-lg">
                <Package className="w-6 h-6 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Multi-Event Bundles</h3>
                  <p className="text-sm text-gray-600">
                    Create package deals across multiple events
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur p-4 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Discount Codes</h3>
                  <p className="text-sm text-gray-600">
                    Offer percentage or fixed amount discounts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur p-4 rounded-lg">
                <Check className="w-6 h-6 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Assigned Seating</h3>
                  <p className="text-sm text-gray-600">
                    Visual seating charts with section pricing
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur p-4 rounded-lg">
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

        {/* CTA Section with Background */}
        <div className="relative bg-primary text-white py-16 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2940&auto=format&fit=crop"
              alt="CTA background"
              fill
              className="object-cover opacity-20"
            />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
        <PublicFooter />
      </div>
    </>
  );
}
