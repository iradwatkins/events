# Testing Strategy
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025

---

## Testing Pyramid

```
        /\
       /E2E\          10% - E2E Tests (Playwright)
      /------\
     /  INT   \       20% - Integration Tests
    /----------\
   /    UNIT    \     70% - Unit Tests (Jest/Vitest)
  /--------------\
```

---

## 1. Unit Tests (70%)

**Tool:** Jest + React Testing Library

**Coverage Target:** >80%

**What to Test:**
- Component rendering
- User interactions (clicks, form submissions)
- Utility functions
- Validation logic
- Data transformations

**Example:**
```typescript
// components/events/CategorySelector.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { CategorySelector } from "./CategorySelector";

describe("CategorySelector", () => {
  it("renders all categories", () => {
    render(<CategorySelector selected={[]} onChange={() => {}} />);
    expect(screen.getByText("Set")).toBeInTheDocument();
    expect(screen.getByText("Workshop")).toBeInTheDocument();
  });

  it("toggles category selection", () => {
    const onChange = jest.fn();
    render(<CategorySelector selected={[]} onChange={onChange} />);
    
    fireEvent.click(screen.getByLabelText("Set"));
    expect(onChange).toHaveBeenCalledWith(["Set"]);
  });
});
```

**Run:**
```bash
npm test
npm run test:coverage
```

---

## 2. Integration Tests (20%)

**Tool:** Jest + Convex Test Helpers

**What to Test:**
- Convex mutations with database
- Complex user flows
- Real-time subscription behavior

**Example:**
```typescript
// convex/events/mutations.test.ts
import { convexTest } from "convex-test";
import { api } from "./_generated/api";

test("createSaveTheDateEvent creates event", async () => {
  const t = convexTest(schema);
  
  const eventId = await t.mutation(api.events.mutations.createSaveTheDateEvent, {
    name: "Test Event",
    startDate: Date.now() + 86400000,
    organizerName: "Test Organizer",
    categories: ["Set"],
    imageId: "test-image-id" as any,
  });

  expect(eventId).toBeDefined();
  
  const event = await t.query(api.events.queries.getEvent, { eventId });
  expect(event.name).toBe("Test Event");
  expect(event.status).toBe("DRAFT");
});
```

---

## 3. E2E Tests (10%)

**Tool:** Playwright

**Coverage Target:** Critical user flows only

**What to Test:**
- Complete purchase flow
- Event creation flow
- Scanner flow
- Authentication flow

**Example:**
```typescript
// tests/e2e/purchase-flow.spec.ts
import { test, expect } from "@playwright/test";

test("user can purchase tickets", async ({ page }) => {
  // Navigate to events page
  await page.goto("/events");
  
  // Click first event
  await page.click("text=Summer Steppers Social");
  
  // Select quantity
  await page.fill("#quantity", "2");
  
  // Click buy tickets
  await page.click("text=Buy Tickets");
  
  // Fill checkout form
  await page.fill("#name", "John Doe");
  await page.fill("#email", "john@example.com");
  
  // NOTE: Use Stripe test mode for card input
  // Fill Stripe Elements iframe...
  
  // Submit payment
  await page.click("text=Complete Purchase");
  
  // Wait for success page
  await expect(page).toHaveURL(/checkout\/success/);
  await expect(page.locator("text=Order confirmed")).toBeVisible();
});
```

**Run:**
```bash
npx playwright test
npx playwright test --ui  # Debug mode
```

---

## Test Data Strategy

**Unit Tests:**
- Mock data in test files
- Factory functions for complex objects

**Integration Tests:**
- Fresh database per test (Convex test utils)
- Seed minimal data needed

**E2E Tests:**
- Stripe test mode
- Test credit card: `4242 4242 4242 4242`
- Clean database before each run

---

## CI/CD Integration

**.github/workflows/test.yml:**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - run: npx playwright install
      - run: npx playwright test
```

---

## Testing Checklist (Per Story)

- [ ] Unit tests for all new components
- [ ] Unit tests for all new utility functions
- [ ] Integration tests for Convex mutations
- [ ] E2E test for critical user flow (if applicable)
- [ ] All tests passing
- [ ] Coverage >80% for new code
- [ ] Manual testing completed (see QA_CHECKLIST.md)

---

## Performance Testing

**Tool:** Lighthouse CI

**Metrics:**
- Performance Score >85
- Accessibility Score >90
- Best Practices Score >90
- SEO Score >90

**Run:**
```bash
npm run lighthouse
```

---

## Security Testing

**Tools:**
- npm audit (dependency vulnerabilities)
- Snyk (automated security scanning)
- Manual penetration testing (Phase 2)

**Run:**
```bash
npm audit
npm audit fix
```

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** QA Team
