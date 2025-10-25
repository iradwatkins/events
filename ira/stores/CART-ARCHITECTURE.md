# Shopping Cart Architecture - SteppersLife Stores

**Project**: stores.stepperslife.com
**Version**: 1.0
**Last Updated**: 2025-10-09

---

## Overview

SteppersLife Stores implements a **single-vendor cart system** where customers can only checkout from ONE store at a time. This is an **intentional architectural decision** that aligns with our marketplace model.

---

## Business Model: Single-Vendor Checkout

### Like Etsy, NOT Like Amazon

```
┌─────────────────────────────────────────────┐
│  ETSY MODEL (Our Approach)                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                             │
│  Shop at Store A → Checkout → Order #1     │
│  Shop at Store B → Checkout → Order #2     │
│                                             │
│  Result: Separate orders per vendor         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  AMAZON MODEL (Not Our Approach)            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                             │
│  Shop multiple vendors → Single checkout   │
│                                             │
│  Result: Platform splits order internally   │
└─────────────────────────────────────────────┘
```

---

## Why Single-Vendor Cart?

### ✅ **Advantages**

1. **Simpler Order Fulfillment**
   - Each vendor manages their own orders independently
   - No coordination required between vendors
   - Vendor ships directly to customer
   - Clear responsibility and accountability

2. **Cleaner Payment Processing**
   - Stripe Connect: One payout per order
   - Platform fee (7%) calculated per vendor
   - No complex payment splitting logic
   - Easier dispute resolution

3. **Vendor Independence**
   - Each vendor sets their own shipping rates
   - Vendor-specific shipping policies
   - Independent return/refund policies
   - No shared inventory concerns

4. **Better Customer Experience**
   - Clear shipping timeline per vendor
   - No confusion about who's shipping what
   - Single tracking number per order
   - Easier to track order status

5. **Phase 1 Simplicity**
   - Faster time to market
   - Less complex checkout flow
   - Easier to test and validate
   - Reduced edge cases

### ⚠️ **Trade-offs**

1. **Multiple Checkouts Required**
   - If customer wants items from multiple stores, they must complete separate checkouts
   - Could be seen as friction in user experience
   - Mitigation: Clear messaging about single-vendor policy

2. **Cart Switching**
   - Customer must clear cart to shop at different store
   - Mitigation: Better UX messaging (see below)

---

## Technical Implementation

### Cart Data Structure

**Redis Storage** (`cart:session-id`):
```typescript
{
  storeSlug: "marcus-steppin-gear",  // LOCKS cart to this store
  items: [
    {
      cartItemId: "product-id-variant-id",
      productId: "clxxx",
      productName: "Chicago Steppin Shoes",
      productSlug: "chicago-steppin-shoes",
      variantId: "clyyy",
      variantName: "Large",
      price: 75.00,
      quantity: 1,
      image: "https://...",
      storeSlug: "marcus-steppin-gear"  // Redundant for validation
    }
  ]
}
```

**TTL**: 7 days (604800 seconds)

### Store Validation Logic

**File**: `app/api/cart/add/route.ts`

```typescript
// Get current cart
const cart = await redisHelpers.getCart(cartId) || {
  items: [],
  storeSlug: validatedData.storeSlug
}

// Verify all items are from the same store
if (cart.storeSlug && cart.storeSlug !== validatedData.storeSlug) {
  return NextResponse.json({
    error: "You can only add items from one store at a time. Please clear your cart first.",
  }, { status: 400 })
}

// Add item to cart
cart.storeSlug = validatedData.storeSlug
cart.items.push(newItem)

// Save to Redis
await redisHelpers.setCart(cartId, cart, 604800)
```

### Key Enforcement Points

1. **On Add to Cart** (`POST /api/cart/add`)
   - Check if cart has different `storeSlug`
   - Reject if attempting to add from different store
   - Return 400 error with clear message

2. **On Cart Display** (`/cart`)
   - Show all items from single store
   - "Continue Shopping" link returns to that store
   - Clear indication of which store items are from

3. **On Checkout** (`/checkout`)
   - All items will be from same store (guaranteed by cart validation)
   - Single order created for single vendor
   - Single Stripe payment to vendor's Stripe Connect account

---

## User Experience Flow

### Happy Path: Shopping Within One Store

```
1. Customer visits /store/marcus-steppin-gear
2. Adds "Shoes" to cart → ✅ Success
3. Continues browsing same store
4. Adds "Shirt" to cart → ✅ Success (same store)
5. Goes to /cart → Sees both items
6. Proceeds to checkout → Single order created
```

### Friction Point: Shopping Across Stores

```
1. Customer visits /store/marcus-steppin-gear
2. Adds "Shoes" to cart → ✅ Success
3. Navigates to /store/keishas-fashion
4. Tries to add "Dress" to cart → ❌ ERROR

   Current Message (Functional):
   "You can only add items from one store at a time.
    Please clear your cart first."

   Recommended Message (User-Friendly):
   "Ready to shop at Keisha's Fashion?

   You have 2 items from Marcus's Steppin Gear in your cart.

   To shop at Keisha's Fashion, you can:
   • Complete your purchase at Marcus's store first
   • Clear your cart to start shopping here

   [View Current Cart]  [Clear & Shop Here]  [Cancel]"
```

---

## API Endpoints

### Cart Operations

All cart operations enforce single-store rule:

```
POST   /api/cart/add       # Add item (validates storeSlug)
GET    /api/cart           # Get cart (single store)
PUT    /api/cart/update    # Update quantity
POST   /api/cart/remove    # Remove item
DELETE /api/cart           # Clear entire cart
```

---

## Future Enhancements (Phase 2)

If we decide to support multi-vendor carts in the future:

### Option A: Multiple Carts with Tabs

```typescript
// Redis Structure:
carts:session-id = {
  "marcus-steppin-gear": { items: [...], total: 150 },
  "keishas-fashion": { items: [...], total: 95 }
}

// UI: Cart page with tabs for each store
// Checkout: Create separate orders per store
```

### Option B: Saved Carts

```typescript
// Allow "saving" current cart when switching stores
// User can have multiple saved carts
// Must activate one cart at a time for checkout
```

### Trade-offs of Multi-Store Support

**Pros:**
- Better user experience for browsing multiple stores
- Less friction in shopping flow
- More sales potential

**Cons:**
- More complex checkout (multiple payments)
- Shipping cost calculation complexity
- Order management complexity
- Tax calculation per vendor
- Refund/return complexity
- Increased development time

**Decision**: Phase 1 keeps single-vendor cart. Phase 2 can reassess based on user feedback.

---

## Testing Scenarios

### Test Case 1: Same Store (Should Pass)
```
1. Add product A from Store X
2. Add product B from Store X
Expected: Both items in cart ✅
```

### Test Case 2: Different Store (Should Fail)
```
1. Add product A from Store X
2. Try to add product C from Store Y
Expected: Error message, item NOT added ❌
```

### Test Case 3: Clear and Switch
```
1. Add product A from Store X
2. Clear cart
3. Add product C from Store Y
Expected: Product C added successfully ✅
```

### Test Case 4: Cart Expiration
```
1. Add product A from Store X
2. Wait 7 days
3. Try to checkout
Expected: Cart expired, redirect to store
```

---

## Database Schema

### Orders Table

```prisma
model Order {
  id            String   @id @default(cuid())
  orderNumber   String   @unique // SL-ORD-XXXXX

  // SINGLE VENDOR per order
  storeId       String
  store         Store    @relation(fields: [storeId], references: [id])

  // Customer
  customerId    String?
  customerEmail String

  // Items (all from same store)
  items         OrderItem[]

  // Payment
  total         Decimal  @db.Decimal(10, 2)
  platformFee   Decimal  @db.Decimal(10, 2)  // 7%
  vendorPayout  Decimal  @db.Decimal(10, 2)  // total - platformFee

  // ...
}
```

**Key Constraint**: Every order has exactly ONE `storeId`. No multi-vendor orders.

---

## Documentation References

- [Database Schema](./DATABASE-SCHEMA.md) - Order structure
- [Implementation Roadmap](./IMPLEMENTATION-ROADMAP.md) - Week 4-5 cart/checkout
- [User Stories](./USER-STORIES-PHASE1.md) - Story 3.3 (Add to Cart)

---

## Summary

✅ **Current Implementation**: Correct and intentional
✅ **Business Model**: Single-vendor checkout (Etsy-style)
✅ **Technical Enforcement**: Redis cart with `storeSlug` validation
✅ **User Experience**: Clear messaging needed for cart switching

**No architecture changes needed.** The system is working as designed.

---

**Next Steps**:
1. Optionally improve error messaging UX
2. Continue to Week 5: Checkout & Orders implementation
