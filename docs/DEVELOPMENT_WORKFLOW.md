# Development Workflow
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025

---

## Story Workflow

### 1. Story Selection

**Process:**
1. Review [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)
2. Select next story in sequence
3. Ensure dependencies completed

**Example:**
- Current: Story 2.1 (Save the Date Event)
- Next: Story 2.2 (Free Event)
- Blocked by: None

---

### 2. Story Implementation

**Steps:**
1. Read story file completely
2. Execute tasks in order (1 → 2 → 3...)
3. Mark subtasks as complete [x]
4. Update Dev Agent Record section
5. Run tests after each task
6. Commit code with conventional commits

**Dev Agent Responsibilities:**
- Implement all tasks/subtasks
- Write tests alongside features
- Update File List section
- Add Completion Notes
- Mark task checkboxes
- Update Change Log

**DO NOT MODIFY:**
- Story description
- Acceptance Criteria
- User Story

**ONLY MODIFY:**
- Dev Agent Record section
- Task checkboxes
- Status field (when complete)

---

### 3. Testing

**Required:**
- Unit tests for all new components/functions
- Integration tests for Convex mutations
- E2E test for critical flows
- Manual testing per QA_CHECKLIST.md

**Commands:**
```bash
npm run lint         # Linting
npm test             # Unit tests
npx playwright test  # E2E tests
npm run build        # TypeScript check
```

---

### 4. Code Review

**Before Submitting:**
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Linting passing
- [ ] TypeScript compiles
- [ ] No console errors
- [ ] Mobile responsive tested
- [ ] File List updated in story

**Review Checklist:**
- Code follows coding-standards.md
- Security best practices followed
- Performance considered
- Accessibility implemented

---

### 5. Story Completion

**Definition of Done:**
- [ ] All tasks completed
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Story status: "Ready for Review"

---

## Git Workflow

### Branch Naming

```bash
feature/story-2.1-save-the-date
feature/story-2.2-free-event
fix/ticket-validation-bug
refactor/payment-flow
```

### Commit Messages

**Format:**
```
<type>(<scope>): <subject>

[optional body]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Add tests
- `docs`: Documentation
- `style`: Formatting
- `chore`: Build/dependencies

**Examples:**
```
feat(events): add Save the Date event creation
fix(tickets): resolve QR validation error
test(scanning): add manual lookup tests
docs(readme): update deployment instructions
```

---

## Development Environment

### Setup

```bash
# Clone repository
git clone <repo-url>
cd event.stepperslife.com

# Install dependencies
npm install

# Set up environment variables
cp .env.production.example .env.local
# Edit .env.local with your keys

# Start Convex
npx convex dev

# Start Next.js
npm run dev
```

### Local Testing

```bash
# Development server
http://localhost:3004

# Convex dashboard
https://dashboard.convex.dev
```

---

## Deployment

### Staging

```bash
git push origin main
# Auto-deploys to staging (if CI/CD configured)
```

### Production

```bash
# See deployment-guide.md for full instructions
npm run build
pm2 reload events-stepperslife
```

---

## Troubleshooting

### Common Issues

**Convex schema errors:**
```bash
npx convex dev
# Apply schema changes
```

**TypeScript errors:**
```bash
npm run build
# Check errors
```

**Tests failing:**
```bash
npm test -- --watch
# Debug specific test
```

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** Development Team
