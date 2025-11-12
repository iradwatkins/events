# Payment System Best Practices Guide
## Events SteppersLife - Code Quality Standards

---

## 🎯 Overview

This document outlines the coding standards and best practices implemented in the payment system. Following these patterns ensures maintainability, reliability, and security.

---

## 📁 Project Structure

```
/root/websites/events-stepperslife/
├── lib/
│   ├── constants/
│   │   └── payment.ts          # All magic numbers and config values
│   ├── validations/
│   │   └── payment.ts          # Zod schemas for input validation
│   ├── utils/
│   │   └── payment.ts          # Shared utility functions
│   └── types/
│       └── payment.ts          # TypeScript type definitions
├── app/api/
│   ├── paypal/
│   │   ├── create-order/route.ts
│   │   └── capture-order/route.ts
│   ├── credits/
│   │   ├── purchase-with-square/route.ts
│   │   └── purchase-with-paypal/route.ts
│   └── webhooks/
│       ├── square/route.ts
│       └── paypal/route.ts
└── components/
    └── checkout/
        └── PayPalPayment.tsx
```

---

## ✅ Best Practices Implemented

### 1. **No Magic Numbers**

❌ **Bad:**
```typescript
const amount = credits * 30; // What is 30?
const fee = total * 0.037 + 179; // Why these numbers?
```

✅ **Good:**
```typescript
import { PRICING } from '@/lib/constants/payment';

const amount = credits * PRICING.PRICE_PER_TICKET_CENTS;
const fee = total * (PRICING.PLATFORM_FEE_PERCENTAGE / 100) + PRICING.PLATFORM_FEE_FIXED_CENTS;
```

**Location:** All constants in `/lib/constants/payment.ts`

---

### 2. **Input Validation with Zod**

❌ **Bad:**
```typescript
const { amount, userId } = await request.json();
if (!amount || !userId) {
  return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
}
```

✅ **Good:**
```typescript
import { paypalCreateOrderSchema, validateRequest } from '@/lib/validations/payment';

const body = await request.json();
const validation = validateRequest(paypalCreateOrderSchema, body);

if (!validation.success) {
  const errorMessage = formatValidationError(validation.error);
  return NextResponse.json(
    createErrorResponse(errorMessage, {
      code: 'VALIDATION_ERROR',
      fields: validation.error.errors,
    }),
    { status: 400 }
  );
}

const { amount, userId } = validation.data; // Type-safe!
```

**Benefits:**
- Type-safe validated data
- Detailed error messages
- Automatic validation of types, ranges, formats
- Self-documenting schemas

---

### 3. **Proper TypeScript Types**

❌ **Bad:**
```typescript
async function POST(request: NextRequest): Promise<NextResponse> {
  // ...
  return NextResponse.json({ success: true, data: result });
}
```

✅ **Good:**
```typescript
import type { PaymentSuccessResponse, PaymentErrorResponse } from '@/lib/types/payment';

async function POST(
  request: NextRequest
): Promise<NextResponse<PaymentSuccessResponse | PaymentErrorResponse>> {
  // ...
  return NextResponse.json(createSuccessResponse(result));
}
```

**Benefits:**
- IDE autocomplete and type checking
- Catch type errors at compile time
- Self-documenting code
- Prevents runtime type mismatches

---

### 4. **Structured Logging**

❌ **Bad:**
```typescript
console.log('Payment created');
console.error('Error:', error);
```

✅ **Good:**
```typescript
import { logPaymentEvent, logPaymentError, LOG_PREFIX } from '@/lib/utils/payment';

logPaymentEvent(LOG_PREFIX.SQUARE, 'credit_purchase_start', {
  requestId,
  userId,
  credits,
  amountInCents,
});

logPaymentError(LOG_PREFIX.SQUARE, error, {
  requestId,
  userId,
  credits,
  stage: 'payment_creation',
});
```

**Log Format (JSON):**
```json
{
  "timestamp": "2025-11-11T02:00:00.000Z",
  "requestId": "req_1699654800000_xyz123",
  "prefix": "[Square]",
  "event": "credit_purchase_start",
  "userId": "user_123",
  "credits": 1000,
  "amountInCents": 30000
}
```

**Benefits:**
- Structured, searchable logs
- Request tracing with unique IDs
- Contextual error information
- Easy debugging and monitoring

---

### 5. **Error Handling with Context**

❌ **Bad:**
```typescript
try {
  // ...
} catch (error: any) {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Server error' }, { status: 500 });
}
```

✅ **Good:**
```typescript
try {
  // ...
} catch (error: unknown) {
  const duration = Date.now() - startTime;

  logPaymentError(LOG_PREFIX.SQUARE, error, {
    requestId,
    duration,
    type: 'credit_purchase_error',
    userId,
    credits,
  });

  // Handle specific error types
  if (error instanceof Error && error.name === 'AbortError') {
    return NextResponse.json(
      createErrorResponse('Request timed out', { code: 'TIMEOUT' }),
      { status: 504 }
    );
  }

  // Handle provider-specific errors
  if (error && typeof error === 'object' && 'result' in error) {
    const squareError = error as { result?: { errors?: Array<{ detail?: string }> } };
    const errorDetail = squareError.result?.errors?.[0]?.detail;
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.PAYMENT_FAILED, {
        code: 'SQUARE_API_ERROR',
        details: errorDetail,
      }),
      { status: 400 }
    );
  }

  return NextResponse.json(
    createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, {
      code: 'INTERNAL_ERROR',
      requestId,
    }),
    { status: 500 }
  );
}
```

**Benefits:**
- Detailed error context for debugging
- Specific error handling for different scenarios
- User-friendly error messages
- Proper HTTP status codes

---

### 6. **Request ID Tracking**

✅ **Implementation:**
```typescript
const requestId = generateRequestId(); // "req_1699654800000_xyz123"

// Include in all logs
logPaymentEvent(LOG_PREFIX.PAYPAL, 'create_order_start', { requestId });

// Return in error responses
return NextResponse.json(
  createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, { requestId }),
  { status: 500 }
);
```

**Benefits:**
- Trace entire request lifecycle
- Correlate logs across services
- Easier debugging in production
- Customer support can reference specific requests

---

### 7. **Performance Monitoring**

✅ **Implementation:**
```typescript
const startTime = Date.now();

try {
  // ... payment processing ...

  const duration = Date.now() - startTime;
  logPaymentEvent(LOG_PREFIX.PAYPAL, 'create_order_success', {
    requestId,
    orderId,
    duration, // Track how long it took
  });
} catch (error) {
  const duration = Date.now() - startTime;
  logPaymentError(LOG_PREFIX.PAYPAL, error, {
    requestId,
    duration,
  });
}
```

**Benefits:**
- Identify slow API calls
- Monitor performance trends
- Set up alerts for slow requests
- Optimize bottlenecks

---

### 8. **Caching for API Efficiency**

❌ **Bad:**
```typescript
// Get new token on every request
async function getPayPalToken() {
  const response = await fetch(`${API_BASE}/v1/oauth2/token`, ...);
  const data = await response.json();
  return data.access_token;
}
```

✅ **Good:**
```typescript
let cachedPayPalToken: PayPalAccessToken | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid
  if (cachedPayPalToken && cachedPayPalToken.expiresAt > now) {
    return cachedPayPalToken.token;
  }

  // Fetch new token only when needed
  const response = await fetch(`${API_BASE}/v1/oauth2/token`, ...);
  const data = await response.json();

  cachedPayPalToken = {
    token: data.access_token,
    expiresAt: now + TIMEOUTS.TOKEN_CACHE_DURATION, // 50 minutes
  };

  return data.access_token;
}
```

**Benefits:**
- Reduced API calls to PayPal
- Faster response times
- Lower costs (fewer token requests)
- Better rate limit compliance

---

### 9. **Timeout Protection**

✅ **Implementation:**
```typescript
import { TIMEOUTS } from '@/lib/constants/payment';

const orderResponse = await fetch(`${apiBase}/v2/checkout/orders`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify(orderPayload),
  signal: AbortSignal.timeout(TIMEOUTS.PAYPAL_API_TIMEOUT), // 30 seconds
});
```

**Benefits:**
- Prevent hung requests
- Better user experience
- Resource cleanup
- Proper error messaging

---

### 10. **Idempotency**

✅ **Implementation:**
```typescript
const idempotencyKey = randomUUID();

const paymentRequest = {
  sourceId,
  idempotencyKey, // Square uses this for deduplication
  amountMoney: { ... },
  // ...
};

// PayPal
const orderResponse = await fetch(`${apiBase}/v2/checkout/orders`, {
  headers: {
    'PayPal-Request-Id': requestId, // PayPal idempotency header
    // ...
  },
});
```

**Benefits:**
- Prevent duplicate payments
- Safe retry logic
- Consistent behavior on network issues
- PCI compliance

---

### 11. **Utility Functions for DRY Code**

❌ **Bad (duplicated):**
```typescript
// In file 1:
const dollars = (amount / 100).toFixed(2);

// In file 2:
const dollars = (cents / 100).toFixed(2);

// In file 3:
const dollars = (amountInCents / 100).toFixed(2);
```

✅ **Good (centralized):**
```typescript
import { centsToDollars } from '@/lib/utils/payment';

const dollars = centsToDollars(amount); // Consistent everywhere
```

**Benefits:**
- Single source of truth
- Easier to update logic
- Consistent behavior
- Testable functions

---

### 12. **Standardized Response Formats**

✅ **Success Response:**
```typescript
{
  "success": true,
  "data": {
    "paymentId": "...",
    "credits": 1000
  },
  "message": "Successfully purchased 1000 ticket credits"
}
```

✅ **Error Response:**
```typescript
{
  "success": false,
  "error": "Invalid payment amount",
  "details": {
    "code": "VALIDATION_ERROR",
    "fields": [...]
  }
}
```

**Benefits:**
- Consistent client-side handling
- Easier error parsing
- Better UX
- API documentation

---

## 🔧 How to Apply Best Practices

### When Creating a New API Route:

1. **Create validation schema** in `/lib/validations/payment.ts`
2. **Import utility functions** from `/lib/utils/payment.ts`
3. **Import constants** from `/lib/constants/payment.ts`
4. **Import types** from `/lib/types/payment.ts`
5. **Follow the template:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { mySchema, validateRequest, formatValidationError } from '@/lib/validations/payment';
import { logPaymentEvent, logPaymentError, generateRequestId, createSuccessResponse, createErrorResponse } from '@/lib/utils/payment';
import { LOG_PREFIX, ERROR_MESSAGES } from '@/lib/constants/payment';
import type { MyResponseType } from '@/lib/types/payment';

export async function POST(request: NextRequest): Promise<NextResponse<MyResponseType>> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Validate input
    const body = await request.json();
    const validation = validateRequest(mySchema, body);
    if (!validation.success) {
      const errorMessage = formatValidationError(validation.error);
      logPaymentError(LOG_PREFIX.PAYPAL, new Error(errorMessage), { requestId });
      return NextResponse.json(createErrorResponse(errorMessage), { status: 400 });
    }

    const { field1, field2 } = validation.data;

    // 2. Log start
    logPaymentEvent(LOG_PREFIX.PAYPAL, 'operation_start', { requestId, field1, field2 });

    // 3. Do work
    const result = await doWork(field1, field2);

    // 4. Log success with duration
    const duration = Date.now() - startTime;
    logPaymentEvent(LOG_PREFIX.PAYPAL, 'operation_success', { requestId, duration });

    // 5. Return success
    return NextResponse.json(createSuccessResponse(result), { status: 200 });
  } catch (error: unknown) {
    // 6. Log error with context
    const duration = Date.now() - startTime;
    logPaymentError(LOG_PREFIX.PAYPAL, error, { requestId, duration });

    // 7. Return error
    return NextResponse.json(createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, { requestId }), { status: 500 });
  }
}
```

---

## 📊 Benefits Summary

| Practice | Benefit | Impact |
|----------|---------|--------|
| No Magic Numbers | Maintainability | High |
| Input Validation | Security & Reliability | Critical |
| TypeScript Types | Developer Experience | High |
| Structured Logging | Debugging & Monitoring | Critical |
| Error Handling | User Experience | High |
| Request ID Tracking | Support & Debugging | High |
| Performance Monitoring | Optimization | Medium |
| Caching | Performance & Cost | High |
| Timeouts | Reliability | Critical |
| Idempotency | Data Integrity | Critical |
| Utility Functions | Code Quality | Medium |
| Standard Responses | API Consistency | High |

---

## 🎓 Learning Resources

- **Zod Documentation:** https://zod.dev/
- **TypeScript Best Practices:** https://typescript-eslint.io/
- **API Error Handling:** https://www.rfc-editor.org/rfc/rfc7807
- **Structured Logging:** https://github.com/trentm/node-bunyan
- **Idempotency:** https://stripe.com/docs/api/idempotent_requests

---

## ✅ Checklist for Code Review

Before merging payment-related code, ensure:

- [ ] No magic numbers (all in constants file)
- [ ] Input validation with Zod schemas
- [ ] Proper TypeScript types on all functions
- [ ] Structured logging with request IDs
- [ ] Comprehensive error handling
- [ ] Timeout protection on external API calls
- [ ] Idempotency keys for payment operations
- [ ] Performance monitoring (start/end time logging)
- [ ] Standardized response formats
- [ ] Utility functions used (no duplication)
- [ ] JSDoc comments on complex functions
- [ ] Sensitive data not logged

---

**Last Updated:** November 11, 2025
**Status:** ✅ Production Standards
**Refactored Files:**
- `/app/api/paypal/create-order/route.ts`
- `/app/api/credits/purchase-with-square/route.ts`
