# Epic: Customer Reviews & Ratings System

**Epic ID**: EPIC-REVIEWS-001
**Priority**: 🚨 **CRITICAL** (P0)
**Type**: Brownfield Enhancement (New Feature)
**Estimated Effort**: 2 weeks (80 hours)
**Phase**: Phase 2 - Week 9-10
**Status**: 📋 Planning

---

## 🎯 Epic Goal

Implement an Etsy-style customer review and rating system that allows verified purchasers to rate and review products, building marketplace trust and helping customers make informed purchasing decisions.

**Success Metric**: 80% of delivered orders receive reviews within 30 days of shipment.

---

## 📊 Why This is CRITICAL

### Missing Core Etsy Feature
- **Etsy's #1 Trust Mechanism**: Product reviews with star ratings
- **Current State**: No reviews → customers have no social proof
- **Impact Without Reviews**:
  - ❌ Lower conversion rates (customers don't trust unknown sellers)
  - ❌ No vendor reputation system
  - ❌ No product quality feedback loop
  - ❌ Missing competitive advantage vs other marketplaces

### Business Impact
- **Without Reviews**: ~2-3% conversion rate (industry avg for no reviews)
- **With Reviews**: ~8-12% conversion rate (300-400% improvement)
- **ROI**: High - reviews drive 70% of marketplace trust

---

## 🏗️ Existing System Context

### Current Relevant Functionality:
- ✅ Orders are tracked with `StoreOrder` model
- ✅ Order items linked to products via `OrderItem` model
- ✅ Shipment tracking with `shippedAt`, `deliveredAt` timestamps
- ✅ Customer emails captured (`customerEmail`, `customerId`)
- ✅ Email notification system (Resend) already in place

### Technology Stack:
- **Framework**: Next.js 15.5.4 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: MinIO (for review photos)
- **Email**: Resend (for review requests)
- **UI**: Tailwind CSS + shadcn/ui components

### Integration Points:
1. **Product Pages** - Display reviews and average rating
2. **Store Pages** - Display shop-wide rating
3. **Order System** - Trigger review requests post-delivery
4. **Email System** - Send review request emails
5. **Vendor Dashboard** - Show incoming reviews, allow responses

---

## 📐 Database Schema (New Models)

### ProductReview Model

```prisma
model ProductReview {
  id              String    @id @default(cuid())

  // Relationships
  productId       String
  orderItemId     String    @unique  // One review per purchased item
  customerId      String?              // Null for guest reviews
  vendorStoreId   String               // For shop aggregation

  // Review Content
  rating          Int                  // 1-5 stars (required)
  title           String?   @db.VarChar(100)  // Optional (max 100 chars)
  review          String               // Required, min 10 chars
  photoUrls       String[]             // 0-3 photos

  // Metadata
  isVerifiedPurchase Boolean  @default(true)
  customerName       String
  customerEmail      String

  // Vendor Response
  vendorResponse     String?
  vendorRespondedAt  DateTime?

  // Moderation
  status             ReviewStatus @default(PUBLISHED)
  flaggedAt          DateTime?
  flagReason         String?

  // Helpfulness (Phase 2.1)
  helpfulCount       Int       @default(0)
  unhelpfulCount     Int       @default(0)

  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  product         Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItem       OrderItem   @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  customer        User?       @relation(fields: [customerId], references: [id], onDelete: SetNull)
  vendorStore     VendorStore @relation(fields: [vendorStoreId], references: [id], onDelete: Cascade)

  @@index([productId, status, createdAt])
  @@index([vendorStoreId, createdAt])
  @@index([customerId])
  @@index([orderItemId])
  @@map("ProductReview")
}

enum ReviewStatus {
  PUBLISHED
  FLAGGED
  HIDDEN
  DELETED
}
```

### ShopRating Model (Cached Aggregate)

```prisma
model ShopRating {
  id              String      @id @default(cuid())
  vendorStoreId   String      @unique

  // Aggregate Ratings
  averageRating   Decimal     @db.Decimal(3, 2)  // e.g., 4.87
  totalReviews    Int         @default(0)

  // Rating Distribution
  fiveStars       Int         @default(0)
  fourStars       Int         @default(0)
  threeStars      Int         @default(0)
  twoStars        Int         @default(0)
  oneStar         Int         @default(0)

  // Timestamps
  lastCalculated  DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  vendorStore     VendorStore @relation(fields: [vendorStoreId], references: [id], onDelete: Cascade)

  @@map("ShopRating")
}
```

### Updates to Existing Models

```prisma
// Product model - add review aggregates
model Product {
  // ... existing fields
  averageRating    Decimal?  @db.Decimal(3, 2)  // NEW
  reviewCount      Int       @default(0)         // NEW
  reviews          ProductReview[]                // NEW
}

// VendorStore model - add shop rating
model VendorStore {
  // ... existing fields
  averageRating    Decimal?  @db.Decimal(3, 2)  // NEW
  totalReviews     Int       @default(0)         // NEW
  shopRating       ShopRating?                    // NEW
  reviews          ProductReview[]                // NEW
}

// OrderItem model - add review relationship
model OrderItem {
  // ... existing fields
  review           ProductReview?                 // NEW
}
```

---

## 🔄 User Flows

### Flow 1: Customer Leaves Review

```
1. ORDER SHIPPED
   ↓
2. WAIT 3 DAYS (shippedAt + 3 days)
   ↓
3. AUTOMATED EMAIL: "How was your [Product Name]?"
   - Subject: "How did you like your order from [Vendor Name]?"
   - Magic link: /review/[orderItemToken]
   ↓
4. CUSTOMER CLICKS LINK
   - Product image, name, variant displayed
   - Pre-filled: Customer name, email
   - Required: Star rating (1-5)
   - Required: Written review (min 10 chars, max 1000)
   - Optional: Title (max 100 chars)
   - Optional: Upload photos (max 3, 5MB each)
   ↓
5. SUBMIT REVIEW
   - Validate inputs
   - Check for duplicate (orderItemId)
   - Upload photos to MinIO
   - Create ProductReview (status: PUBLISHED)
   ↓
6. UPDATE AGGREGATES
   - Product.averageRating, Product.reviewCount
   - VendorStore.averageRating, VendorStore.totalReviews
   - ShopRating table (full recalculation)
   ↓
7. NOTIFY VENDOR
   - Email: "You received a new review!"
   - Dashboard badge: "New Reviews (3)"
   ↓
8. CUSTOMER SEES THANK YOU
   - "Thanks for your review!"
   - Link to view review on product page
```

### Flow 2: Vendor Responds to Review

```
1. VENDOR SEES REVIEW in Dashboard
   - /dashboard/reviews (new page)
   - Shows all reviews with "Reply" button
   ↓
2. VENDOR CLICKS "Reply"
   - Modal with review details
   - Text area for response (max 500 chars)
   ↓
3. VENDOR SUBMITS RESPONSE
   - Update ProductReview.vendorResponse
   - Set ProductReview.vendorRespondedAt
   ↓
4. NOTIFY CUSTOMER
   - Email: "[Vendor] replied to your review"
   - Link to product page to see response
   ↓
5. DISPLAY ON PRODUCT PAGE
   - Review shows "Shop owner replied on [date]"
   - Response displayed below review
```

### Flow 3: Customer Flags Inappropriate Review

```
1. CUSTOMER SEES REVIEW on Product Page
   ↓
2. CLICKS "Flag as inappropriate"
   ↓
3. SELECT REASON (dropdown)
   - Spam or fake
   - Offensive language
   - Off-topic
   - Personal information
   - Other
   ↓
4. SUBMIT FLAG
   - Update ProductReview.status → FLAGGED
   - Set ProductReview.flaggedAt, flagReason
   ↓
5. NOTIFY ADMIN (email)
   - "Review flagged for moderation"
   - Link to admin review panel
   ↓
6. ADMIN REVIEWS
   - Valid flag → Hide (status: HIDDEN)
   - Invalid flag → Clear (status: PUBLISHED)
```

---

## 📋 Stories Breakdown

### Story 1: Database Schema & API Foundation
**Effort**: 8 hours
**Description**: Create database models, migrations, and core API endpoints

**Acceptance Criteria**:
1. ProductReview and ShopRating models created in Prisma schema
2. Migration applied successfully to production database
3. API endpoint: `POST /api/reviews/create` (create review)
4. API endpoint: `GET /api/reviews/[productId]` (get product reviews)
5. API endpoint: `POST /api/reviews/[reviewId]/respond` (vendor response)
6. API endpoint: `POST /api/reviews/[reviewId]/flag` (flag review)
7. All endpoints have Zod validation
8. Error handling for duplicate reviews

**Integration Verification**:
- Existing Product, OrderItem, VendorStore models unchanged
- No breaking changes to existing API routes
- Database indexes optimized for query performance

---

### Story 2: Review Submission Form & Email Trigger
**Effort**: 12 hours
**Description**: Build review submission page and automated email trigger

**Acceptance Criteria**:
1. Review submission page: `/review/[orderItemToken]`
2. Token generation for magic link (secure, single-use)
3. Form validation:
   - Star rating (1-5, required)
   - Written review (10-1000 chars, required)
   - Title (0-100 chars, optional)
   - Photos (0-3, max 5MB each, optional)
4. Photo upload to MinIO with compression
5. "Thank you" confirmation page after submission
6. Automated email trigger:
   - Scheduled job checks `shippedAt + 3 days`
   - Sends review request email via Resend
   - Email template with magic link
7. Email rate limiting (max 1 request per order item)

**Integration Verification**:
- Email system (Resend) working for review requests
- MinIO image upload consistent with product images
- No impact on existing order notification emails

---

### Story 3: Product Page Review Display
**Effort**: 12 hours
**Description**: Display reviews on product pages with star ratings

**Acceptance Criteria**:
1. Product page shows:
   - Average rating (stars + number, e.g., "4.8 ⭐")
   - Total review count (e.g., "Based on 24 reviews")
   - Rating distribution bar chart (5★, 4★, 3★, 2★, 1★)
2. Review list displays:
   - Customer name + "Verified Purchase" badge
   - Star rating
   - Review title (if provided)
   - Review text
   - Review photos (gallery, click to enlarge)
   - Vendor response (if provided)
   - Helpful/Unhelpful buttons (counts only, no interaction yet)
   - Review date
3. Sort options:
   - Most recent (default)
   - Highest rating
   - Lowest rating
4. Pagination: 10 reviews per page
5. Empty state: "No reviews yet. Be the first!"
6. SEO: Review schema.org markup for rich snippets

**Integration Verification**:
- Product page layout unchanged (reviews added at bottom)
- Existing product info, images, variants unaffected
- Page load performance <2s with 50 reviews

---

### Story 4: Shop Rating Display & Vendor Dashboard
**Effort**: 10 hours
**Description**: Show shop-wide rating on store pages and vendor review dashboard

**Acceptance Criteria**:
1. Store page (`/store/[slug]`) shows:
   - Shop average rating (stars + number)
   - Total reviews across all products
   - Link to "See all reviews"
2. Vendor dashboard (`/dashboard/reviews`) shows:
   - List of all reviews for vendor's products
   - Filter by rating (5★, 4★, 3★, 2★, 1★)
   - Filter by product
   - "Reply" button for reviews without response
   - Review response UI (modal or inline)
3. Dashboard sidebar badge:
   - "New Reviews (X)" notification
4. Shop rating calculation:
   - Recalculated on each new review
   - Stored in ShopRating table for performance
5. Email notification when new review received

**Integration Verification**:
- Vendor dashboard layout consistent with existing pages
- Dashboard sidebar navigation unchanged
- No performance impact on store page load

---

### Story 5: Review Moderation & Admin Tools
**Effort**: 8 hours
**Description**: Flag system and basic admin moderation panel

**Acceptance Criteria**:
1. "Flag as inappropriate" button on each review
2. Flag submission modal:
   - Reason dropdown (spam, offensive, off-topic, personal info, other)
   - Optional details text field
3. Flagged reviews marked with status: FLAGGED
4. Admin email notification when review flagged
5. Basic admin panel: `/admin/reviews/flagged`
   - List flagged reviews
   - View full review details
   - Actions: Hide, Clear flag
6. Hidden reviews not displayed to customers
7. Vendor can't see their own flagged reviews

**Integration Verification**:
- No impact on published review display
- Admin routes protected (existing auth middleware)
- Flag system doesn't affect review aggregates until hidden

---

### Story 6: Aggregate Calculation & Performance
**Effort**: 8 hours
**Description**: Optimize aggregate calculations and add background jobs

**Acceptance Criteria**:
1. Product aggregate update:
   - `averageRating` = AVG(ProductReview.rating WHERE status=PUBLISHED)
   - `reviewCount` = COUNT(ProductReview WHERE status=PUBLISHED)
   - Triggered on: New review, review hidden/unhidden
2. Shop aggregate update:
   - ShopRating table recalculated
   - Rating distribution (5★, 4★, etc.) updated
   - Triggered on: New review, review hidden/unhidden
3. Background job (cron):
   - Daily: Recalculate all shop ratings (sanity check)
   - Daily: Send review request emails for eligible orders
4. Database indexes verified:
   - `ProductReview(productId, status, createdAt)`
   - `ProductReview(vendorStoreId, createdAt)`
5. Query performance:
   - Product page reviews load <200ms
   - Shop rating calculation <100ms

**Integration Verification**:
- No impact on existing product/store queries
- Background jobs don't interfere with existing cron jobs
- Database performance maintained under load

---

### Story 7: Customer Edit/Delete & Polish
**Effort**: 6 hours
**Description**: Allow customers to edit/delete reviews, add final polish

**Acceptance Criteria**:
1. Customer can edit review within 48 hours of posting:
   - "Edit" link visible to review author only
   - Edit form pre-filled with existing content
   - Can change rating, text, photos
   - Updates `updatedAt` timestamp
2. Customer can delete review within 7 days:
   - "Delete" link with confirmation modal
   - Sets status to DELETED (soft delete)
   - Aggregates recalculated
3. "Was this review helpful?" buttons (non-functional UI):
   - Thumbs up/down icons
   - Shows count (hardcoded 0 for now)
   - **Phase 2.1**: Add functionality
4. Mobile responsiveness:
   - Review cards stack vertically on mobile
   - Photos display in mobile-friendly gallery
   - Star ratings readable on small screens
5. Loading states and skeleton UI:
   - Product page shows review skeleton while loading
   - Submission form has loading spinner

**Integration Verification**:
- Edit/delete only available to review authors
- Mobile layout consistent with existing responsive design
- Loading states match existing patterns

---

## 🎯 Success Criteria

### Technical Success:
- ✅ All 7 stories completed with acceptance criteria met
- ✅ No breaking changes to existing functionality
- ✅ Database queries optimized (<200ms for review lists)
- ✅ 16+ integration tests covering review workflows
- ✅ Mobile responsive (tested on 3+ devices)

### Business Success:
- 📊 80% of delivered orders receive reviews within 30 days
- 📊 Average 4.5+ star rating across all shops
- 📊 10%+ conversion rate improvement after launch
- 📊 50%+ of reviews include photos
- 📊 <1% flagged/hidden reviews

---

## 🚧 Risks & Mitigation

### Risk 1: Low Review Submission Rate
**Impact**: High - Feature doesn't drive trust if no reviews
**Likelihood**: Medium
**Mitigation**:
- Automated emails 3 days post-shipment (optimal timing)
- Clear, friendly email copy with one-click review link
- Mobile-optimized review form (most users on mobile)
- Future: Gentle reminder email at 7 days if no review

### Risk 2: Spam/Fake Reviews
**Impact**: High - Destroys marketplace trust
**Likelihood**: Low (verified purchase only)
**Mitigation**:
- Only verified purchases can review
- One review per order item (enforced by unique constraint)
- Flag system with admin moderation
- Future: ML-based spam detection

### Risk 3: Performance Impact on Product Pages
**Impact**: Medium - Slow pages hurt conversion
**Likelihood**: Low
**Mitigation**:
- Database indexes on all review queries
- ShopRating cached aggregate (no real-time calculation)
- Pagination (10 reviews per page)
- Future: Redis caching for review lists

### Risk 4: Negative Reviews Discourage Vendors
**Impact**: Medium - Vendors may leave platform
**Likelihood**: Medium
**Mitigation**:
- Vendor response feature (address concerns publicly)
- Flag system (inappropriate reviews can be hidden)
- Education: Negative reviews build trust when handled well
- Future: Vendor support guide on responding to reviews

---

## 🔄 Rollback Plan

### If Critical Issues Occur:

**Step 1: Feature Flag Off**
- Hide review submission form (return 404)
- Hide review display on product/store pages
- Keep database intact

**Step 2: Stop Background Jobs**
- Disable review request email cron job
- Keep existing reviews in database

**Step 3: Database Rollback (if needed)**
- Drop ProductReview, ShopRating tables
- Remove Product.averageRating, reviewCount columns
- Remove VendorStore.averageRating, totalReviews columns
- Run Prisma migration rollback

**Rollback Time**: <30 minutes

---

## 📚 Dependencies

### Required Before Starting:
- ✅ Order system with `shippedAt` tracking (exists)
- ✅ Email system (Resend) configured (exists)
- ✅ MinIO storage for images (exists)
- ✅ Customer email capture (`customerEmail`) (exists)

### Future Enhancements (Phase 2.1+):
- ⏸️ Review helpfulness voting (thumbs up/down)
- ⏸️ Time-weighted shop rating (recent reviews count more)
- ⏸️ Review photos with zoom/lightbox
- ⏸️ Review sorting by helpfulness
- ⏸️ Vendor badges based on ratings ("Top Rated Seller")
- ⏸️ Review reminder emails (if no review after 7 days)
- ⏸️ Customer review dashboard (/account/reviews)

---

## 📖 Reference: Etsy Review System

### What Etsy Does (That We're Implementing):
1. ✅ Verified purchase reviews only
2. ✅ 5-star rating system
3. ✅ Written reviews + optional photos
4. ✅ Vendor can respond once
5. ✅ Shop-wide rating (aggregate)
6. ✅ Review request emails post-delivery
7. ✅ Flag inappropriate reviews

### What Etsy Does (That We're Deferring):
- ⏸️ Review helpfulness voting
- ⏸️ Time-weighted shop ratings
- ⏸️ Seller badges based on ratings
- ⏸️ Review reminder emails
- ⏸️ Customer review history page

---

## ✅ Definition of Done

- [ ] All 7 stories completed with acceptance criteria met
- [ ] Database schema deployed to production
- [ ] 16+ integration tests passing
- [ ] Mobile responsive (tested on iPhone, Android, iPad)
- [ ] Email templates created and tested
- [ ] Vendor documentation updated (how to respond to reviews)
- [ ] Admin moderation guide created
- [ ] No regression in existing features (verified via testing)
- [ ] Performance benchmarks met (<200ms review queries)
- [ ] SEO: Schema.org markup added for reviews

---

## 📅 Timeline

**Week 9**:
- Mon-Tue: Story 1 (Database & API)
- Wed-Thu: Story 2 (Review Form & Emails)
- Fri: Story 3 (Product Page Display) - Start

**Week 10**:
- Mon: Story 3 (Product Page Display) - Finish
- Tue-Wed: Story 4 (Shop Rating & Dashboard)
- Thu: Story 5 (Moderation)
- Fri: Story 6 (Performance)
- Weekend: Story 7 (Polish & Testing)

**Total**: 64 hours (8 work days)

---

**Status**: 📋 Ready for Development
**Next Step**: Begin Story 1 (Database Schema & API Foundation)

---

## 🧠 Key Decisions Made (Ultra-Thinking)

1. **Review Granularity**: Per order item (Etsy-style) ✅
2. **Review Timing**: 3 days post-shipment (practical) ✅
3. **Photos**: Support 1-3 photos per review (high trust value) ✅
4. **Shop Rating**: Simple average (MVP), time-weighted later ✅
5. **Moderation**: Post-moderation with flag system (Etsy-style) ✅
6. **Vendor Response**: One reply per review (prevents spam) ✅
7. **Customer Edit**: 48 hours edit, 7 days delete (reasonable) ✅

---

**This epic is the #1 critical missing Etsy feature. Without reviews, we're just a product listing site, not a trusted marketplace.**
