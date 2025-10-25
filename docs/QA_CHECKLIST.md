# QA Checklist
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025

---

## Pre-Release Checklist

### Functional Testing

#### Event Creation
- [ ] Can create Save the Date event
- [ ] Can create Free Event
- [ ] Can create Ticketed Event
- [ ] Image upload works (JPG, PNG, WebP)
- [ ] Category selection works
- [ ] Rich text editor saves formatting
- [ ] Date picker prevents past dates
- [ ] Events save as DRAFT status
- [ ] Events appear in organizer dashboard immediately

#### Event Management
- [ ] Can edit existing events
- [ ] Can publish events
- [ ] Can unpublish events
- [ ] Published events visible publicly
- [ ] Draft events not visible publicly

#### Ticket Purchase
- [ ] Public can view event detail pages
- [ ] Ticket inventory displays correctly
- [ ] Can add tickets to cart
- [ ] Checkout form validates required fields
- [ ] Stripe payment processes successfully
- [ ] Order confirmation page displays
- [ ] Email delivered within 2 minutes

#### QR Scanning
- [ ] Scanner PWA loads on mobile
- [ ] Camera activates
- [ ] Valid QR codes scan successfully
- [ ] Invalid QR codes show error
- [ ] Duplicate scans prevented
- [ ] Scan history logs correctly
- [ ] Manual lookup works

#### Search & Discovery
- [ ] Event listing page shows all published events
- [ ] Category filtering works
- [ ] Search returns relevant results
- [ ] Homepage displays featured events

#### User Dashboard
- [ ] My Tickets shows purchased tickets
- [ ] Tickets grouped: Upcoming, Past
- [ ] QR codes display correctly
- [ ] Download QR works
- [ ] Resend email works
- [ ] Order history complete

---

### Browser Testing

#### Desktop
- [ ] Chrome 90+ (Windows, macOS)
- [ ] Firefox 88+ (Windows, macOS)
- [ ] Safari 14+ (macOS)
- [ ] Edge 90+ (Windows)

#### Mobile
- [ ] iOS Safari 14+ (iPhone)
- [ ] Android Chrome 90+ (Android phone)
- [ ] Mobile responsive (320px to 2560px)

---

### Performance Testing

- [ ] Page load time <2s (p95)
- [ ] Time to interactive <3s
- [ ] Lighthouse score >85
- [ ] No console errors
- [ ] No memory leaks

---

### Security Testing

- [ ] HTTPS enforced
- [ ] Authentication required for protected routes
- [ ] Authorization checks working (can't edit others' events)
- [ ] XSS prevention working
- [ ] CSRF protection enabled
- [ ] Input validation working
- [ ] QR codes tamper-proof (HMAC)

---

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Color contrast >4.5:1
- [ ] ARIA labels present
- [ ] Form labels associated
- [ ] Alt text on images

---

### Edge Cases

- [ ] Large file upload (4.9MB) works
- [ ] Very long event names (99 chars) display correctly
- [ ] Special characters in event names work
- [ ] Events on same day sort correctly
- [ ] Sold out events display correctly
- [ ] Expired sales period blocks purchase
- [ ] Concurrent ticket purchases (inventory accurate)

---

### Error Handling

- [ ] 404 page displays for missing events
- [ ] Payment failure shows user-friendly error
- [ ] Network error handled gracefully
- [ ] Image upload failure recovers
- [ ] QR scan failure shows error message

---

### Regression Testing

- [ ] Previous stories still work
- [ ] No new bugs introduced
- [ ] Database schema migrations successful
- [ ] API backwards compatible

---

## Sign-Off

**Tested By:** ___________________
**Date:** ___________________
**Environment:** [ ] Staging [ ] Production
**Result:** [ ] Pass [ ] Fail
**Notes:** ___________________

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** QA Team
