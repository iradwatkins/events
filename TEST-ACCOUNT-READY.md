# Test Account Setup Complete

## ✅ Account Ready for Testing

**Created:** November 11, 2025

---

## 🔐 Login Credentials

```
Email:    organizer1@stepperslife.com
Password: Bobby321!
Role:     Organizer
```

---

## 💳 Account Details

**User ID:** `kh77xbfm5kcgn526jd7h1mks7h7v8vnt`

**Credits:**
- Total Credits: **300 tickets**
- Used Credits: **0 tickets**
- Remaining: **300 tickets**
- First Event Free: **Available** (not used yet)

---

## 🔗 Access Links

**Login Page:**
```
https://events.stepperslife.com/login
```

**Organizer Dashboard:**
```
https://events.stepperslife.com/organizer/dashboard
```

**Create Event:**
```
https://events.stepperslife.com/organizer/events/create
```

**Credits Page:**
```
https://events.stepperslife.com/organizer/credits
```

---

## 🧪 What You Can Test

### 1. **Login & Authentication**
- Test password login
- Verify organizer role access
- Check welcome popup

### 2. **Create Events**
- Create ticketed events
- Set up ticket tiers
- Configure pricing

### 3. **Credit System**
- View credit balance (300 tickets)
- Create events using credits
- Test credit deduction on ticket sales
- Purchase additional credits

### 4. **Payment Methods**
- Square card payments
- PayPal payments
- Cash App Pay
- Cash payments (manual credit)

### 5. **Ticket Sales**
- Create orders
- Generate QR codes
- Send confirmation emails
- Test different payment flows

---

## 📊 Account Status

✅ **User Created:** Yes  
✅ **Password Set:** Yes (Bobby321!)  
✅ **Role Assigned:** Organizer  
✅ **Credits Initialized:** Yes (300 tickets)  
✅ **Email Verified:** No (optional for testing)  
✅ **Welcome Popup:** Not shown yet  
✅ **Payment Methods:** All available (Square, PayPal, Cash App, Cash)

---

## 🔄 Reset Commands (if needed)

**Reset credits back to 300:**
```bash
npx convex run credits/mutations:resetToFreeCredits '{"organizerId": "kh77xbfm5kcgn526jd7h1mks7h7v8vnt"}'
```

**Check current balance:**
```bash
npx convex run credits/queries:getCreditBalance '{"organizerId": "kh77xbfm5kcgn526jd7h1mks7h7v8vnt"}'
```

**View user details:**
```bash
npx convex run users/queries:getUserByEmail '{"email": "organizer1@stepperslife.com"}'
```

---

## 🎯 Recommended Test Flow

1. **Login** at https://events.stepperslife.com/login
2. **Check Dashboard** - Verify 300 credits shown
3. **Create an Event** - Use some credits
4. **Set up Tickets** - Create ticket tiers
5. **Test Purchase** - Buy a ticket with different payment methods
6. **Check Credits** - Verify deduction
7. **Test PayPal** - Purchase additional credits

---

**Account is ready for testing!** 🚀
