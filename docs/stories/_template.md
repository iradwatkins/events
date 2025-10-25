# Story [STORY_ID]: [STORY_TITLE]

**Epic:** [Epic Number] - [Epic Name]
**Priority:** [P0/P1/P2]
**Effort:** [Story Points]
**Sprint:** [Week X]
**Status:** [Draft/Ready/In Progress/QA/Complete]

---

## User Story

**As a** [user role]
**I want to** [action/goal]
**So that** [benefit/value]

---

## Acceptance Criteria

- [ ] [Criterion 1 - specific, testable]
- [ ] [Criterion 2 - what defines success]
- [ ] [Criterion 3 - edge cases handled]
- [ ] [Criterion 4 - error states covered]

---

## Dev Notes

### Context

[Brief explanation of what this story involves, any relevant background]

### Technical Approach

[High-level approach to implementing this story]

### Dependencies

- **Blocked by:** [Story IDs that must complete first]
- **Blocks:** [Story IDs that depend on this]
- **External:** [Any external setup required - Stripe, Email, etc.]

### Design/Mockups

[Link to Figma, screenshots, or describe UI expectations]

---

## Tasks

### 1. [Task Name]

**Description:** [What needs to be done]

**Subtasks:**
- [ ] [Specific subtask]
- [ ] [Another subtask]
- [ ] [Testing step]

**Files to Create/Modify:**
- `[path/to/file.tsx]` - [Description]
- `[path/to/another.ts]` - [Description]

**Validation:**
- [ ] [How to verify this task is complete]

---

### 2. [Task Name]

**Description:** [What needs to be done]

**Subtasks:**
- [ ] [Specific subtask]
- [ ] [Another subtask]

**Files to Create/Modify:**
- `[path/to/file.tsx]` - [Description]

**Validation:**
- [ ] [How to verify this task is complete]

---

## Testing

### Unit Tests

```typescript
// tests/[component].test.tsx
describe("[ComponentName]", () => {
  it("[test case description]", () => {
    // Test implementation
  });
});
```

**Test Cases:**
- [ ] [Test case 1]
- [ ] [Test case 2]
- [ ] [Test case 3]

### E2E Tests

```typescript
// tests/e2e/[feature].spec.ts
test("[feature flow description]", async ({ page }) => {
  // Test implementation
});
```

**E2E Scenarios:**
- [ ] [Happy path scenario]
- [ ] [Error scenario]
- [ ] [Edge case scenario]

### Manual Testing Checklist

- [ ] Desktop browser (Chrome, Firefox, Safari)
- [ ] Mobile responsive (iOS Safari, Android Chrome)
- [ ] Accessibility (keyboard navigation, screen reader)
- [ ] Performance (page load, interaction speed)

---

## Dev Agent Record

**CRITICAL:** Only the dev agent (James) should modify this section.

### Agent Model Used

- Model: [claude-sonnet-4.5, etc.]
- Date: [YYYY-MM-DD]

### Task Completion Checkboxes

- [ ] Task 1 complete
- [ ] Task 2 complete
- [ ] All tests passing
- [ ] Linting passing
- [ ] Ready for review

### Debug Log References

[Link to .ai/debug-log.md entries if applicable]

### Completion Notes

[Notes from the dev agent about implementation details, gotchas, or future improvements]

### File List

**Files Created:**
- `[path/to/file.tsx]`

**Files Modified:**
- `[path/to/modified.tsx]`

**Files Deleted:**
- `[path/to/deleted.tsx]`

### Change Log

| Date | Change | By |
|------|--------|-----|
| YYYY-MM-DD | Story created | [PM Agent] |
| YYYY-MM-DD | Implementation started | [Dev Agent] |
| YYYY-MM-DD | Ready for review | [Dev Agent] |

---

## QA Notes

[Notes from QA testing, bugs found, regression issues]

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tasks completed
- [ ] Unit tests written and passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Linting and formatting passing
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner approved

---

## References

- **Epic:** [Link to epic file]
- **PRD Section:** [Link to relevant PRD section]
- **Design:** [Figma link or mockup reference]
- **Related Stories:** [Links to related stories]

---

**Document Control**

**Created:** [Date]
**Last Updated:** [Date]
**Owner:** [PM Agent Name]
