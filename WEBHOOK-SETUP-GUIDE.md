# Payment System Webhook Configuration Guide
## Events SteppersLife.com

**Date:** November 11, 2025
**Status:** Production Ready - Webhooks Need Configuration

---

## ✅ Completed Setup

### Payment Integration Status
- ✅ Square Payment SDK - Production Mode
- ✅ PayPal Payment SDK - Production Mode
- ✅ Cash App Pay - Production Mode
- ✅ Credit Purchase Flow (Square & PayPal)
- ✅ Event Ticket Checkout (All 3 payment methods)
- ✅ Webhook Handlers Created & Deployed

### Verified Endpoints
All webhook endpoints are live and accessible:

```bash
✅ https://events.stepperslife.com/api/webhooks/square
✅ https://events.stepperslife.com/api/webhooks/paypal
✅ https://events.stepperslife.com/api/paypal/create-order
✅ https://events.stepperslife.com/api/paypal/capture-order
✅ https://events.stepperslife.com/api/credits/purchase-with-square
✅ https://events.stepperslife.com/api/credits/purchase-with-paypal
```

---

## 🔧 Required Webhook Configuration

### 1. PayPal Webhook Update

**Current Status:** ⚠️ Webhook exists but points to old URL

**What You Need to Do:**

1. **Login to PayPal Developer Dashboard**
   - URL: https://developer.paypal.com/dashboard/
   - Use your PayPal business account credentials

2. **Navigate to Webhooks**
   - Click "Apps & Credentials" in top menu
   - Select your app (or create one if needed)
   - Click "Webhooks" tab

3. **Update Existing Webhook**
   - Find webhook ID: `5NK114525U789563D`
   - **Change URL from:** `https://www.stepperslife.com/api/v1/payments/webhook/paypal`
   - **Change URL to:** `https://events.stepperslife.com/api/webhooks/paypal`

4. **Verify Event Subscriptions**
   Make sure these events are checked:
   - ✅ `PAYMENT.SALE.COMPLETED` (Required)
   - ✅ `PAYMENT.SALE.DENIED` (Required)
   - ✅ `PAYMENT.SALE.REFUNDED` (Required)
   - ✅ `CUSTOMER.DISPUTE.CREATED` (Recommended)
   - ⚪ `PAYMENT.PAYOUTS-ITEM.SUCCEEDED` (Optional - for settlements)
   - ⚪ `PAYMENT.PAYOUTS-ITEM.FAILED` (Optional - for settlements)

5. **Test the Webhook**
   - PayPal provides a "Send Test Notification" button
   - Send a test for `PAYMENT.SALE.COMPLETED`
   - You should receive a 200 OK response

**Current Credentials in .env.local:**
```bash
PAYPAL_CLIENT_ID=AWcmEjsKDeNUzvVQJyvc3lq5n4NXsh7-sHPgGT4ZiPFo8X6csYZcElZg2wsu_xsZE22DUoXOtF3MolVK
PAYPAL_SECRET_KEY=EOKT1tTTaBV8EOx-4yMwF0xtSYaO0D2fVkU8frfqITvV-QYgU2Ep3MG3ttqqdbug9LeevJ9p7BgDFXmp
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AWcmEjsKDeNUzvVQJyvc3lq5n4NXsh7-sHPgGT4ZiPFo8X6csYZcElZg2wsu_xsZE22DUoXOtF3MolVK
PAYPAL_ENVIRONMENT=production
PAYPAL_WEBHOOK_ID=5NK114525U789563D
```

---

### 2. Square Webhook Registration

**Current Status:** ⚠️ Webhook handler exists but not registered in Square Dashboard

**What You Need to Do:**

1. **Login to Square Developer Dashboard**
   - URL: https://developer.squareup.com/apps
   - Use your Square account credentials

2. **Select Your Application**
   - App Name: **Steppers Life App**
   - Application ID: `sq0idp-XG8irNWHf98C62-iqowH6Q`
   - Environment: **Production**

3. **Add Webhook Endpoint**
   - Click "Webhooks" in left sidebar
   - Click "Add Endpoint" button
   - Enter Webhook URL: `https://events.stepperslife.com/api/webhooks/square`
   - API Version: Use latest (currently v2)

4. **Subscribe to Events**
   Check these event types:
   - ✅ `payment.created` (Required)
   - ✅ `payment.updated` (Required)
   - ✅ `refund.created` (Required)
   - ✅ `refund.updated` (Required)

5. **Copy Signature Key**
   - After creating webhook, Square will show a **Signature Key**
   - **IMPORTANT:** Copy this key immediately (only shown once!)
   - Add it to `.env.local` file:

   ```bash
   SQUARE_WEBHOOK_SIGNATURE_KEY=your-signature-key-here
   ```

6. **Update .env.local and Restart**
   ```bash
   cd /root/websites/events-stepperslife
   nano .env.local
   # Add the signature key
   pm2 restart events.stepperslife.com
   ```

7. **Test the Webhook**
   - Square provides a "Send Test Event" button
   - Send test for `payment.updated`
   - Verify you receive 200 OK response

**Current Square Credentials:**
```bash
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-XG8irNWHf98C62-iqowH6Q
NEXT_PUBLIC_SQUARE_LOCATION_ID=L0Q2YC1SPBGD8
NEXT_PUBLIC_SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=EAAAlwLSKasNtDyFEQ4mDkK9Ces5pQ9FQ4_kiolkTnjd-4qHlOx2K9-VrGC7QcOi
SQUARE_LOCATION_ID=L0Q2YC1SPBGD8
SQUARE_ENVIRONMENT=production
SQUARE_WEBHOOK_SIGNATURE_KEY=<TO BE ADDED>
```

---

## 🧪 Testing Guide

### Pre-Testing Checklist
- ✅ Webhooks configured in PayPal dashboard
- ✅ Webhooks configured in Square dashboard
- ✅ Signature key added to .env.local
- ✅ PM2 restarted with new environment

### Test 1: Credit Purchase with Square

1. **Navigate to Credits Page**
   ```
   https://events.stepperslife.com/organizer/credits
   ```

2. **Open Purchase Credits Modal**
   - Click "Purchase More Credits" button
   - Should see credit packages: 500, 1000, 2500 tickets

3. **Test Square Payment**
   - Select a package (e.g., 1000 credits / $300)
   - Choose "Credit Card" payment method
   - Wait for Square card form to load
   - Use Square test card:
     ```
     Card: 4111 1111 1111 1111
     Exp: Any future date (e.g., 12/26)
     CVV: 111
     Zip: 12345
     ```
   - Click "Purchase $300"

4. **Expected Result**
   - ✅ Payment processes successfully
   - ✅ Modal closes
   - ✅ Credit balance updates immediately
   - ✅ Transaction appears in Convex `creditTransactions` table
   - ✅ `squarePaymentId` is populated

5. **Verify in Logs**
   ```bash
   pm2 logs events.stepperslife.com --lines 50
   ```
   Look for: `[Square Webhook] Payment completed`

---

### Test 2: Credit Purchase with PayPal

1. **Open Purchase Credits Modal**
   - Navigate to credits page
   - Click "Purchase More Credits"

2. **Test PayPal Payment**
   - Select a package
   - Choose "PayPal" payment method
   - Wait for PayPal buttons to load
   - Click "PayPal" button
   - Login with PayPal sandbox account (if using sandbox) or real account
   - Approve payment

3. **Expected Result**
   - ✅ Payment completes in PayPal popup
   - ✅ Modal closes
   - ✅ Credits added to balance
   - ✅ Transaction has `paypalOrderId` populated

4. **Verify Webhook**
   ```bash
   pm2 logs events.stepperslife.com --lines 50
   ```
   Look for: `[PayPal Webhook] Payment completed`

---

### Test 3: Event Ticket Purchase - Square

1. **Navigate to Event**
   ```
   https://events.stepperslife.com/events
   ```
   - Select any active event
   - Click "Get Tickets"

2. **Complete Checkout Form**
   - Select a ticket tier
   - Enter quantity (e.g., 2)
   - Enter buyer name: "Test Buyer"
   - Enter buyer email: "test@example.com"
   - Click "Continue to Payment"

3. **Pay with Square**
   - Select "Credit/Debit Card" payment method
   - Wait for card form to load
   - Enter test card details (same as above)
   - Complete payment

4. **Expected Result**
   - ✅ Success screen appears
   - ✅ "Payment Successful!" message shown
   - ✅ Order created in Convex with status "completed"
   - ✅ Tickets generated with QR codes
   - ✅ Email sent to test@example.com
   - ✅ Organizer credits deducted (if PREPAY model)

---

### Test 4: Event Ticket Purchase - PayPal

1. **Same checkout flow as Test 3**

2. **Pay with PayPal**
   - Select "PayPal" payment method
   - PayPal buttons should appear
   - Click PayPal button
   - Complete payment flow

3. **Expected Result**
   - ✅ Same as Test 3 results
   - ✅ Order has PayPal order ID
   - ✅ Webhook processes payment

---

### Test 5: Event Ticket Purchase - Cash App

1. **Same checkout flow**

2. **Pay with Cash App**
   - Select "Cash App Pay" payment method
   - QR code should appear
   - Scan with Cash App mobile app
   - Approve payment

3. **Expected Result**
   - ✅ Payment completes via Cash App
   - ✅ Order finalizes
   - ✅ Tickets created

---

## 🔍 Monitoring & Debugging

### View Application Logs
```bash
# Real-time logs
pm2 logs events.stepperslife.com

# Last 100 lines
pm2 logs events.stepperslife.com --lines 100

# Error logs only
pm2 logs events.stepperslife.com --err
```

### Check Webhook Logs

**PayPal Webhook Logs:**
- Login to PayPal Developer Dashboard
- Go to Webhooks section
- Click on webhook ID
- View "Recent Deliveries" tab
- Check for 200 responses

**Square Webhook Logs:**
- Login to Square Developer Dashboard
- Go to Webhooks section
- Click on webhook endpoint
- View "Event Log" tab
- Verify successful deliveries

### Database Verification (Convex)

Check data in Convex dashboard: https://dashboard.convex.dev

**Credit Transactions:**
```typescript
// Query: creditTransactions
// Look for:
- organizerId: matches user ID
- ticketsPurchased: correct amount
- amountPaid: correct price in cents
- status: "COMPLETED"
- squarePaymentId or paypalOrderId: populated
```

**Orders:**
```typescript
// Query: orders
// Look for:
- status: "completed"
- totalCents: correct total
- paymentIntentId: populated with payment ID
- tickets: array of ticket IDs created
```

**Tickets:**
```typescript
// Query: tickets
// Look for:
- orderId: matches order
- status: "valid"
- qrCodeUrl: generated QR code
- buyerEmail: correct email
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Failed to load payment form"
**Cause:** Square SDK not loading
**Solution:**
- Check NEXT_PUBLIC_SQUARE_APPLICATION_ID is correct
- Verify browser console for CORS errors
- Ensure production credentials match environment

### Issue 2: PayPal buttons not appearing
**Cause:** PayPal SDK initialization failed
**Solution:**
- Check NEXT_PUBLIC_PAYPAL_CLIENT_ID is correct
- Check browser console for errors
- Verify PayPal app is approved for production

### Issue 3: Webhook returns 401 Invalid Signature
**Cause:** Missing or incorrect signature key
**Solution:**
- For Square: Add SQUARE_WEBHOOK_SIGNATURE_KEY to .env.local
- For PayPal: Signature verification currently simplified for production
- Restart PM2 after adding keys

### Issue 4: Order not completing after payment
**Cause:** Webhook not firing or mutation failing
**Solution:**
- Check webhook is registered in payment provider dashboard
- Check PM2 logs for error messages
- Verify Convex mutations have correct permissions
- Check order ID matches between payment and Convex

### Issue 5: Credits not updating after purchase
**Cause:** purchaseCredits mutation failing
**Solution:**
- Check user has organizerCredits record initialized
- Verify mutation doesn't have permission errors
- Check PM2 logs for mutation errors

---

## 📊 Payment Flow Diagrams

### Credit Purchase Flow (Square)
```
User clicks "Purchase Credits"
    → PurchaseCreditsModal opens
    → User selects package (e.g., 1000 credits / $300)
    → User selects "Credit Card"
    → Square SDK loads card form
    → User enters card details
    → Click "Purchase"
    → Square tokenizes card (client-side)
    → POST /api/credits/purchase-with-square
        → Square createPayment API called
        → Payment processed
        → purchaseCredits mutation called
        → Credits added to organizerCredits table
        → Transaction recorded in creditTransactions
    → Success! Modal closes
    → Balance updates on page
```

### Event Ticket Purchase Flow (PayPal)
```
User selects event → Clicks "Get Tickets"
    → Fills out checkout form
    → Clicks "Continue to Payment"
    → Selects "PayPal" payment method
    → PayPal buttons render
    → User clicks PayPal button
    → POST /api/paypal/create-order
        → PayPal order created
        → Returns order ID
    → PayPal popup opens
    → User approves payment
    → POST /api/paypal/capture-order
        → PayPal captures payment
        → completeOrder mutation called
        → Order status → "completed"
        → Tickets generated
        → QR codes created
        → Email sent
    → Webhook fires (async)
        → POST /api/webhooks/paypal
        → PAYMENT.SALE.COMPLETED event
        → Logs completion (order already complete)
    → Success screen shown
    → User receives email with tickets
```

---

## 🎯 Success Criteria

**Payment System is Fully Operational When:**

- ✅ Square payments work in production
- ✅ PayPal payments work in production
- ✅ Cash App payments work in production
- ✅ Credit purchases add credits to organizer accounts
- ✅ Event ticket purchases create valid tickets
- ✅ QR codes are generated for all tickets
- ✅ Confirmation emails are sent
- ✅ Webhooks process events successfully
- ✅ No payment errors in logs
- ✅ All transactions are recorded in Convex

---

## 📞 Support & Resources

**Square Documentation:**
- Developer Dashboard: https://developer.squareup.com/apps
- Webhooks Guide: https://developer.squareup.com/docs/webhooks/overview
- Test Cards: https://developer.squareup.com/docs/testing/test-values

**PayPal Documentation:**
- Developer Dashboard: https://developer.paypal.com/dashboard/
- REST API Reference: https://developer.paypal.com/api/rest/
- Webhooks Guide: https://developer.paypal.com/api/rest/webhooks/

**Convex Dashboard:**
- https://dashboard.convex.dev
- Project: fearless-dragon-613

**Server Access:**
```bash
ssh root@72.60.28.175
cd /root/websites/events-stepperslife
pm2 logs events.stepperslife.com
```

---

## ✅ Final Checklist

Before going live with real customers:

- [ ] PayPal webhook updated to new URL
- [ ] Square webhook registered with signature key
- [ ] .env.local updated with signature key
- [ ] PM2 restarted
- [ ] Test credit purchase with Square (production)
- [ ] Test credit purchase with PayPal (production)
- [ ] Test ticket purchase with all 3 payment methods
- [ ] Verify webhook logs show 200 responses
- [ ] Verify emails are being sent
- [ ] Verify QR codes are generated
- [ ] Check Convex data is correct
- [ ] Test refund flow (optional but recommended)
- [ ] Document any issues encountered
- [ ] Celebrate! 🎉

---

**Last Updated:** November 11, 2025
**System Status:** ✅ Production Ready - Pending Webhook Configuration
