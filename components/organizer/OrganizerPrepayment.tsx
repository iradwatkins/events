'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, CreditCard, Smartphone, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SquareCardPayment } from '@/components/checkout/SquareCardPayment'

interface OrganizerPrepaymentProps {
  eventId: string
  eventName: string
  estimatedTickets: number
  pricePerTicket: number // in dollars (e.g., 0.30)
  onPaymentSuccess: () => void
  onCancel: () => void
}

export function OrganizerPrepayment({
  eventId,
  eventName,
  estimatedTickets,
  pricePerTicket,
  onPaymentSuccess,
  onCancel,
}: OrganizerPrepaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<'square' | 'cashapp' | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  const totalAmount = estimatedTickets * pricePerTicket
  const totalAmountCents = Math.round(totalAmount * 100)

  const handlePaymentMethodSelect = (method: 'square' | 'cashapp') => {
    setSelectedMethod(method)
    setShowPayment(true)
  }

  const handleSquarePaymentSuccess = async (result: Record<string, unknown>) => {
    console.log('[Prepayment] Square payment successful:', result)
    // TODO: Call Convex mutation to update payment config
    onPaymentSuccess()
  }

  const handleSquarePaymentError = (error: string) => {
    console.error('[Prepayment] Payment error:', error)
    alert(`Payment failed: ${error}`)
  }

  if (showPayment && selectedMethod === 'square') {
    return (
      <div className="max-w-2xl mx-auto">
        <SquareCardPayment
          applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || ''}
          locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ''}
          total={totalAmountCents}
          environment={process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox'}
          onPaymentSuccess={handleSquarePaymentSuccess}
          onPaymentError={handleSquarePaymentError}
          onBack={() => {
            setShowPayment(false)
            setSelectedMethod(null)
          }}
        />
      </div>
    )
  }

  if (showPayment && selectedMethod === 'cashapp') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-green-600" />
            Pay with CashApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              CashApp payment integration coming soon. Please use Square payment for now.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Total Amount: ${totalAmount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              {estimatedTickets} tickets × ${pricePerTicket.toFixed(2)} each
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 mb-2">
              <strong>Send CashApp payment to:</strong>
            </p>
            <p className="text-xl font-bold text-green-900">$SteppersLife</p>
            <p className="text-sm text-green-700 mt-2">
              Include event ID in note: <strong>{eventId}</strong>
            </p>
          </div>

          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              After sending payment, our team will verify and activate your event within 24 hours.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowPayment(false)
                setSelectedMethod(null)
              }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={onPaymentSuccess}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              I've Sent Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Platform Fee Payment
        </h2>
        <p className="text-gray-600">
          Pay upfront for "{eventName}" and collect 100% of ticket sales
        </p>
      </div>

      {/* Payment Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Platform Fee</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">
              ${totalAmount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              {estimatedTickets} tickets × ${pricePerTicket.toFixed(2)} each
            </p>
          </div>

          <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900 mb-1">What happens after payment:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>✓ Your event is activated immediately</li>
                  <li>✓ Customers can purchase tickets</li>
                  <li>✓ You receive 100% of ticket sales revenue</li>
                  <li>✓ No additional fees per transaction</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Square Payment */}
        <button
          onClick={() => handlePaymentMethodSelect('square')}
          className="bg-white rounded-lg border-2 border-gray-200 p-6 text-left hover:border-blue-600 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Square</h3>
              <p className="text-sm text-blue-600">Credit/Debit Card</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Instant activation
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Secure payment processing
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              All major cards accepted
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-blue-900">Recommended</p>
          </div>
        </button>

        {/* CashApp Payment */}
        <button
          onClick={() => handlePaymentMethodSelect('cashapp')}
          className="bg-white rounded-lg border-2 border-gray-200 p-6 text-left hover:border-green-600 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">CashApp</h3>
              <p className="text-sm text-green-600">Mobile Payment</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Pay from your phone
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              No card needed
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Manual verification (24hrs)
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-green-900">Alternative Option</p>
          </div>
        </button>
      </div>

      <div className="text-center">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-900"
        >
          Cancel and Go Back
        </Button>
      </div>
    </div>
  )
}
