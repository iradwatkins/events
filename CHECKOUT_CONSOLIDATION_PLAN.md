# Checkout System Consolidation Plan

## Executive Summary

This document outlines the architectural plan to consolidate the checkout system and eliminate code duplication across the application. Based on comprehensive code analysis, we identified **400-500 lines of duplicated code** (35-45% redundancy) across three separate checkout implementations.

## Current State Analysis

### Existing Checkout Pages

1. **Event Checkout** (`app/events/[eventId]/checkout/page.tsx`) - 1,109 lines
   - Supports: Individual tickets, bundles, all payment methods (Card, Cash App, Cash In-Person)
   - Complete implementation with proper payment hierarchy
   - Most feature-complete checkout

2. **~~Bundle Checkout~~** (`app/bundles/[bundleId]/checkout/page.tsx`) - **REMOVED** ✅
   - Was: 415 lines, Square only
   - Status: Successfully removed - bundles now use event checkout
   - Redirect: Bundle detail page now links to parent event checkout with pre-selected bundle

3. **Product Checkout** (`app/shop/checkout/page.tsx`) - 606 lines
   - Supports: Square only (needs Stripe, Cash App, Cash support)
   - Missing payment hierarchy implementation
   - Independent physical product purchases

### Code Duplication Identified

Duplicated across all checkout pages:
- Contact information forms (name, email, phone)
- Payment method selection UI
- Order summary calculation and display
- Success/confirmation screens
- Error handling patterns
- Loading states and animations
- Square payment integration logic
- Fee calculation (embedded, not centralized)

### Cleanup Completed ✅

1. **Removed unused backup files:**
   - `lib/square.ts.unused`
   - `components/checkout/square-card-payment.tsx.unused`
   - `components/checkout/cashapp-qr-payment.tsx.unused`

2. **Removed unused payment components:**
   - `components/checkout/SquarePaymentForm.tsx` (not imported anywhere)
   - `components/checkout/TestPaymentForm.tsx` (not imported anywhere)

3. **Removed redundant bundle checkout:**
   - Deleted `app/bundles/[bundleId]/checkout/` directory
   - Updated bundle detail page to redirect to event checkout
   - Now uses unified event checkout with query params

## Payment Method Hierarchy (Current Implementation)

### Organizer Level (Event Payment Config)
- Choose merchant processor: Square, Stripe, PayPal
- Enable/disable online payment methods:
  - Credit/Debit Cards
  - Cash App Pay
- Managed via: `app/organizer/events/[eventId]/payment-methods/page.tsx`
- Backend: `convex/paymentConfig/mutations.ts::updatePaymentMethods`

### Staff Level (Individual Staff Settings)
- Toggle "Accept Cash In-Person" only
- Cannot configure merchant accounts or online payments
- Managed via: `app/staff/settings/page.tsx`
- Backend: `convex/staff/mutations.ts::updateCashSettings`

### Payment Visibility Rules
- **No processor configured:** Only "Cash In-Person" option visible
- **Processor configured:** Show enabled online methods + cash (if staff accepts)
- **Cash orders:** Do not require merchant setup, always available when staff opts in

## Recommended Consolidation Architecture

### Phase 1: Create Shared Components (High Priority)

#### 1.1 Shared Checkout Layout Component
**File:** `components/checkout/CheckoutLayout.tsx`

**Purpose:** Unified checkout container with consistent styling, progress indicators, and responsive layout

**Features:**
- Responsive grid layout (desktop: 2-column, mobile: stacked)
- Progress indicator (Contact → Payment → Confirmation)
- Breadcrumb navigation
- Security badges and trust indicators

#### 1.2 Unified Payment Method Selector
**File:** `components/checkout/PaymentMethodSelector.tsx`

**Purpose:** Consolidated payment method selection that respects payment hierarchy

**Props:**
```typescript
interface PaymentMethodSelectorProps {
  eventId?: Id<"events">;
  availableMethods: {
    creditCard: boolean;
    cashApp: boolean;
    cash: boolean;
  };
  selectedMethod: 'card' | 'cashapp' | 'cash';
  onMethodChange: (method: 'card' | 'cashapp' | 'cash') => void;
  merchantProcessor?: 'SQUARE' | 'STRIPE' | 'PAYPAL';
}
```

**Features:**
- Automatically hides unavailable methods
- Shows appropriate payment processor logo
- Displays cash requirements (staff approval, 30-min hold)
- Accessibility compliant (keyboard navigation, ARIA labels)

#### 1.3 Contact Information Form Component
**File:** `components/checkout/ContactForm.tsx`

**Purpose:** Reusable contact form with validation

**Props:**
```typescript
interface ContactFormProps {
  values: {
    name: string;
    email?: string;
    phone: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  emailRequired?: boolean; // false for cash payments
  disabled?: boolean;
}
```

**Features:**
- Field-level validation
- Phone number formatting
- Email validation (when required)
- Error message display

#### 1.4 Order Summary Component
**File:** `components/checkout/OrderSummary.tsx`

**Purpose:** Consistent order summary display across all checkout types

**Props:**
```typescript
interface OrderSummaryProps {
  items: Array<{
    name: string;
    quantity: number;
    pricePerUnit: number;
    description?: string;
  }>;
  subtotal: number;
  fees: {
    platform?: number;
    processing?: number;
  };
  total: number;
  showFeeBreakdown?: boolean;
}
```

**Features:**
- Itemized list with quantities
- Collapsible fee breakdown
- Mobile-optimized layout
- Visual hierarchy (subtotal → fees → total)

#### 1.5 Payment Success Component
**File:** `components/checkout/PaymentSuccess.tsx`

**Purpose:** Unified success screen with appropriate actions

**Props:**
```typescript
interface PaymentSuccessProps {
  orderNumber: string;
  orderType: 'ticket' | 'product' | 'bundle';
  confirmationDetails: {
    email?: string;
    phone: string;
    ticketCount?: number;
    deliveryMethod?: string;
  };
  actions: Array<{
    label: string;
    href: string;
    primary?: boolean;
  }>;
}
```

### Phase 2: Centralize Business Logic (Medium Priority)

#### 2.1 Fee Calculation Utility
**File:** `lib/checkout/calculate-fees.ts`

**Purpose:** Centralized fee calculation following payment config rules

**Function:**
```typescript
export async function calculateOrderFees(params: {
  subtotal: number;
  eventId?: Id<"events">;
  paymentMethod: 'card' | 'cashapp' | 'cash';
}): Promise<{
  subtotal: number;
  platformFee: number;
  processingFee: number;
  totalAmount: number;
  paymentModel: string;
}>;
```

**Features:**
- Fetches payment config from Convex
- Applies correct fee model (PREPAY vs CREDIT_CARD)
- Handles charity discounts and low-price discounts
- Returns breakdown for display

#### 2.2 Payment Method Availability Checker
**File:** `lib/checkout/payment-availability.ts`

**Purpose:** Determine which payment methods are available for an event/product

**Function:**
```typescript
export async function getAvailablePaymentMethods(
  eventId?: Id<"events">
): Promise<{
  creditCard: boolean;
  cashApp: boolean;
  cash: boolean;
  merchantProcessor?: 'SQUARE' | 'STRIPE' | 'PAYPAL';
  cashRequiresStaffApproval: boolean;
}>;
```

**Features:**
- Queries payment config
- Checks staff availability for cash
- Returns only enabled methods
- Handles missing/incomplete config

#### 2.3 Consolidated Order Mutations
**File:** `convex/orders/unifiedCheckout.ts` (NEW)

**Purpose:** Single mutation for all order types

**Mutations:**
- `createOrder` - Handles tickets, bundles, products with unified flow
- `completePayment` - Processes payment confirmation
- `handleCashPayment` - Special handling for cash orders

**Benefits:**
- Single source of truth for order creation
- Consistent commission tracking
- Unified ticket generation
- Standardized error handling

### Phase 3: Update Existing Checkout Pages (High Priority)

#### 3.1 Event Checkout (Refactor)
**File:** `app/events/[eventId]/checkout/page.tsx`

**Current:** 1,109 lines (feature complete)
**Target:** ~400-500 lines (using shared components)

**Changes:**
- Import and use shared components
- Replace inline fee calculation with utility function
- Use unified payment method selector
- Maintain bundle support via query params

**Preserve:**
- Bundle selection UI (already working well)
- Staff referral tracking
- Multi-tier ticket selection

#### 3.2 Product Checkout (Refactor + Enhance)
**File:** `app/shop/checkout/page.tsx`

**Current:** 606 lines (Square only)
**Target:** ~300-400 lines (using shared components)

**Changes:**
- Import and use shared components
- Add support for Stripe and Cash App
- Add cash payment option (for in-store pickup)
- Use unified order mutations

**New Features to Add:**
- Stripe payment support
- Cash App payment support
- Cash in-store pickup option
- Multiple payment processor support

### Phase 4: Additional Improvements (Low Priority)

#### 4.1 Centralized Payment Component Routing
**File:** `components/checkout/PaymentProcessor.tsx`

**Purpose:** Dynamically render the correct payment component based on processor

**Props:**
```typescript
interface PaymentProcessorProps {
  processor: 'SQUARE' | 'STRIPE' | 'PAYPAL';
  method: 'card' | 'cashapp';
  amount: number;
  onSuccess: (paymentDetails: any) => void;
  onError: (error: string) => void;
}
```

**Implementation:**
```typescript
switch (processor) {
  case 'SQUARE':
    return <SquareCardPayment {...props} />;
  case 'STRIPE':
    return <StripePayment {...props} />;
  case 'PAYPAL':
    return <PayPalPayment {...props} />;
}
```

#### 4.2 Testing Strategy
- Unit tests for fee calculation utility
- Integration tests for order creation flow
- E2E tests for complete checkout journeys
- Payment processor sandbox testing

## Implementation Priority

### Immediate (Week 1-2)
1. ✅ Remove unused files and redundant bundle checkout
2. Create shared components (CheckoutLayout, PaymentMethodSelector, ContactForm)
3. Extract fee calculation utility

### Short-term (Week 3-4)
4. Refactor event checkout to use shared components
5. Refactor product checkout to use shared components
6. Add Stripe/Cash App support to product checkout

### Medium-term (Month 2)
7. Create unified order mutation system
8. Implement centralized payment processor routing
9. Add comprehensive error handling

### Long-term (Month 3+)
10. Add automated testing suite
11. Performance optimization
12. Analytics and monitoring

## Expected Benefits

### Code Quality
- **Reduce codebase by 400-500 lines** (immediate)
- Single source of truth for checkout logic
- Easier maintenance and bug fixes
- Consistent user experience

### Developer Experience
- New features added once, work everywhere
- Clear separation of concerns
- Better TypeScript type safety
- Reduced onboarding time

### User Experience
- Consistent checkout flow across all purchase types
- All payment methods available everywhere
- Faster load times (smaller bundle sizes)
- Better mobile responsiveness

### Business Impact
- Easier to add new payment processors
- Faster feature development
- Reduced bug count
- Better conversion rates (consistent UX)

## Risks and Mitigation

### Risk: Breaking Existing Functionality
**Mitigation:**
- Implement changes incrementally
- Maintain backward compatibility during transition
- Comprehensive testing before deployment

### Risk: Payment Processor Integration Issues
**Mitigation:**
- Test all processors in sandbox mode
- Maintain separate components per processor initially
- Gradual migration to unified interface

### Risk: User Disruption
**Mitigation:**
- Deploy during low-traffic periods
- Feature flags for rollback capability
- Monitor error rates closely

## Success Metrics

1. **Code Reduction:** Achieve 30-40% reduction in checkout-related code
2. **Test Coverage:** Reach 80%+ coverage for checkout flows
3. **Performance:** Reduce checkout page load time by 20%
4. **Error Rate:** Reduce checkout errors by 50%
5. **Conversion Rate:** Maintain or improve current rates

## Next Steps

1. Review and approve this plan
2. Create GitHub issues for each phase
3. Set up feature branch: `feature/checkout-consolidation`
4. Begin Phase 1 implementation
5. Schedule regular progress reviews

## Questions for Review

1. Should we keep `createBundlePurchase` mutation or remove it entirely?
2. Do we want to support PayPal immediately or defer to future phase?
3. Should cash payment option be available for physical products (in-store pickup)?
4. What's the priority order: refactor first vs. add new features first?

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Author:** Claude Code Consolidation Analysis
**Status:** Ready for Review
