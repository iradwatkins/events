# 🎟️ QUICK REFERENCE CARD

## 🚀 Which System Should I Use?

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  NEED QUICK SETUP?                                      │
│  → Use: ticket-purchasing-system.html                   │
│  ✅ Pre-designed layout ready                           │
│  ✅ 9 tables, 76 seats                                  │
│  ✅ Start selling in 30 seconds                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  NEED CUSTOM LAYOUT?                                    │
│  → Use: complete-ticket-system.html                     │
│  ✅ Drag-and-drop designer                              │
│  ✅ Unlimited customization                             │
│  ✅ Save/export layouts                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ 30-Second Start Guide

### Simple System:
1. Open `ticket-purchasing-system.html`
2. Set prices (right sidebar)
3. Click seats to sell
4. Click "Checkout"
**DONE!** ✅

### Complete System:
1. Open `complete-ticket-system.html`
2. Designer Mode: Drag tables
3. Selling Mode: Set prices
4. Click seats to sell
**DONE!** ✅

---

## 🎨 Visual Status Guide

```
SEAT COLORS:
🟢 Green  = Available (click to buy)
🟡 Yellow = Selected (in your cart)
⚫ Grey   = Sold (cannot buy)
```

---

## 💰 Pricing Setup

| Item | Default | Where to Change |
|------|---------|-----------------|
| Regular Seat | $50 | Right sidebar input |
| VIP Seat | $100 | Right sidebar input |
| Tax Rate | 10% | Code: `subtotal * 0.1` |

---

## 🛒 Shopping Cart Features

✅ **Add**: Click available (green) seats
✅ **Remove**: Click × button in cart
✅ **Clear All**: "Clear Cart" button
✅ **Bulk Buy**: "Buy Entire Table" button
✅ **Checkout**: Fill form → Complete purchase

---

## 📊 What Happens at Checkout?

1. **Customer fills form**:
   - Name, Email, Phone
   - Payment method
   - Special requests

2. **System processes**:
   - Calculates total (with 10% tax)
   - Marks seats as SOLD (grey)
   - Logs purchase data
   - Shows confirmation

3. **Result**:
   - Seats become unavailable
   - Cart clears
   - Success message shows

---

## 🎯 Keyboard Shortcuts

| Action | How |
|--------|-----|
| **Select seat** | Click seat |
| **Remove from cart** | Click × in cart item |
| **Delete table** | Hover table → Click × (Designer) |
| **Clear all** | Clear Cart button |

---

## 📱 Mobile Features

✅ Touch-friendly seat selection
✅ Responsive layout
✅ Swipe-friendly cart
✅ Mobile checkout form

---

## 🔧 Common Customizations

### Change Table Layout (Simple System)
```javascript
// In code, find:
tables: [
    { id: 1, x: 100, y: 100, seats: 8, type: 'vip' },
    // Add more here
]
```

### Change Colors
```css
.seat.available { fill: #4CAF50; } /* Green */
.seat.selected { fill: #FFC107; } /* Yellow */
.seat.sold { fill: #999; }        /* Grey */
```

### Change Seat Sizes
```javascript
const seatRadius = 15;  // Change this number
```

---

## 💾 Data Export Format

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "tickets": [
        {
            "id": "1-3",
            "tableId": 1,
            "seatNumber": 3,
            "type": "vip",
            "price": 100
        }
    ],
    "total": 220
}
```

Check browser console after checkout!

---

## 🚨 Troubleshooting

### Seats not clickable?
- ✅ Make sure you're in "Selling Mode"
- ✅ Check seat isn't already sold (grey)

### Cart not updating?
- ✅ Refresh the page
- ✅ Check browser console for errors

### Layout not saving?
- ✅ Click "💾 Save Layout" button
- ✅ Check localStorage is enabled

### Drag-and-drop not working?
- ✅ Make sure you're in "Designer Mode"
- ✅ Try clicking and holding longer

---

## 📞 Feature Quick Reference

| Feature | Simple | Complete |
|---------|--------|----------|
| Pre-made layout | ✅ | ❌ |
| Custom layouts | ❌ | ✅ |
| Individual seats | ✅ | ✅ |
| Whole tables | ✅ | ✅ |
| VIP pricing | ✅ | ✅ |
| Shopping cart | ✅ | ✅ |
| Checkout | ✅ | ✅ |
| Designer mode | ❌ | ✅ |
| Save layouts | ❌ | ✅ |
| Export data | ✅ | ✅ |

---

## 🎉 Success Checklist

Before your event:
- [ ] Design floor plan
- [ ] Set ticket prices
- [ ] Test checkout process
- [ ] Export layout as backup
- [ ] Train staff on system

During event:
- [ ] Monitor sold seats
- [ ] Process purchases
- [ ] Handle special requests
- [ ] Export sales data

After event:
- [ ] Export final sales report
- [ ] Send confirmations
- [ ] Archive layout
- [ ] Review for next time

---

## 📚 Files You Have

1. **ticket-purchasing-system.html** - Simple, ready-to-use
2. **complete-ticket-system.html** - Full designer + seller
3. **TICKET-SYSTEM-GUIDE.md** - Complete documentation
4. **QUICK-REFERENCE.md** - This file!

---

## 🎯 Most Common Use Cases

### Wedding Reception
- Use: Complete System
- Tables: 15-20 round tables
- Seats: 150-200
- Special: Head table, dance floor

### Corporate Event
- Use: Simple System (quick setup)
- Tables: 10-15 tables
- Seats: 80-120
- Special: Stage for presentations

### Concert with Tables
- Use: Complete System
- Tables: 20-30 tables
- Seats: 200-300
- Special: Stage, bars

### Fundraising Gala
- Use: Complete System
- Tables: 15-25 tables
- Seats: 120-200
- Special: VIP tables, stage, auction area

---

## ⚡ Power User Tips

1. **Quick Select**: Hold Shift (future feature idea!)
2. **Bulk VIP**: Make front 3 rows VIP
3. **Price Strategy**: VIP = 2x regular price
4. **Layout Templates**: Save common layouts
5. **Export Often**: Export after every event

---

## 🎊 You're Ready!

Open the file → Set prices → Start selling! 🎟️

For detailed help, see: `TICKET-SYSTEM-GUIDE.md`
