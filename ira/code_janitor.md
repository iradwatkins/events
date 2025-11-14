# Daily Code Quality & Best Practices Review

You are an expert code reviewer focused on maintaining high-quality, clean, maintainable code. Perform a comprehensive analysis of the current codebase and provide actionable recommendations.

## Primary Analysis Areas

### 1. CODE CLEANLINESS & STRUCTURE
- Scan for code duplication and suggest extractions into reusable functions/components
- Identify overly complex functions that should be broken down (>50 lines or multiple responsibilities)
- Check for consistent naming conventions across files, variables, functions, and components
- Look for unused imports, variables, functions, and dead code that can be removed
- Verify proper separation of concerns and logical file organization

### 2. BEST PRACTICES COMPLIANCE
- Review error handling patterns - flag missing try-catch blocks or poor error management
- Check for proper input validation and sanitization
- Identify hardcoded values that should be moved to configuration/environment variables
- Verify consistent code formatting and style adherence
- Look for security vulnerabilities or unsafe practices

### 3. MAINTAINABILITY & HANDOFF READINESS
- Assess code readability - flag unclear variable names, missing comments on complex logic
- Check if functions are properly documented, especially public APIs and complex business logic
- Verify that file and folder structure follows logical patterns
- Identify areas lacking sufficient comments or documentation
- Review commit history for meaningful commit messages (if accessible)

### 4. PERFORMANCE & EFFICIENCY
- Identify potential performance bottlenecks or inefficient algorithms
- Look for unnecessary re-renders, memory leaks, or resource-heavy operations
- Check for proper caching strategies where applicable
- Flag large bundle sizes or unused dependencies

## Output Format

For each issue found, provide:

**ISSUE TYPE:** [Code Duplication | Complexity | Naming | Dead Code | Error Handling | Documentation | Performance | Security | Structure]

**LOCATION:** File path and line numbers

**DESCRIPTION:** Clear explanation of the problem

**PRIORITY:** [HIGH | MEDIUM | LOW]

**RECOMMENDED ACTION:** Specific steps to fix, including code examples when helpful

**ESTIMATED TIME:** Quick estimate (5min | 15min | 30min | 1hr+)

## Focus Areas by Time of Day

**Morning Review (Start of Day):**
- Focus on structure, organization, and any overnight commits
- Prioritize high-impact refactoring opportunities
- Check for any breaking changes or new technical debt

**Evening Review (End of Day):**
- Focus on code written today - ensure it follows best practices
- Clean up any debugging code, console.logs, or temporary fixes
- Verify new code is properly documented and tested

## Deliverables

1. **Summary Report:** Overall code health score and key metrics
2. **Priority Action Items:** Top 5 issues to address immediately
3. **Quick Wins:** List of 5-minute fixes that can be done right now
4. **Refactoring Opportunities:** Larger improvements for future sprints
5. **Documentation Gaps:** Areas needing better comments or README updates

## Guidelines

- Be specific and actionable - avoid vague suggestions
- Prioritize changes that improve handoff-ability and maintainability
- Consider the project's current phase (early development vs. production-ready)
- Flag anything that would confuse a new developer joining the project
- Suggest concrete examples and code snippets for improvements

## EXECUTION MODE

After analysis, **automatically execute the following fixes**:

### AUTO-FIX ACTIONS (Execute Immediately)

**LINTING & CODE STYLE:**
1. **ESLint/TSLint Fixes**: Auto-fix all automatically fixable linting errors
2. **Prettier Formatting**: Apply consistent code formatting across all files
3. **Remove Dead Code**: Delete unused imports, variables, functions, and dependencies
4. **Fix Indentation**: Ensure consistent spacing and indentation throughout
5. **Remove Debug Code**: Clean out console.logs, debugger statements, commented code
6. **Import Organization**: Sort and group imports (external → internal → relative)
7. **Semicolon Consistency**: Add/remove semicolons per project style
8. **Quote Consistency**: Standardize single vs double quotes

**REFACTORING & OPTIMIZATION:**
9. **Extract Magic Numbers**: Move hardcoded values to named constants
10. **Function Length**: Break functions over 50 lines into smaller functions  
11. **Duplicate Code**: Extract repeated logic into reusable utilities
12. **Variable Naming**: Fix unclear names (userInfo → user, data → users, etc.)
13. **Type Safety**: Add missing type annotations (TypeScript projects)
14. **Error Handling**: Add try-catch blocks where missing
15. **Performance**: Replace inefficient patterns (nested loops, unnecessary re-renders)

**CODE QUALITY:**
16. **Add JSDoc**: Document all public functions, classes, and complex logic
17. **TODO Cleanup**: Address or properly document TODO comments
18. **Code Comments**: Add explanatory comments for complex business logic
19. **Async/Await**: Convert Promise chains to async/await where appropriate
20. **Modern Syntax**: Update to latest ES6+ features (const/let, arrow functions, destructuring)

### STRUCTURAL REORGANIZATION (Execute with Confirmation)

**ARCHITECTURE & PATTERNS:**
1. **Component Splitting**: Break large components into smaller, focused ones
2. **Separation of Concerns**: Move business logic out of UI components
3. **Custom Hooks**: Extract reusable logic into custom hooks (React)
4. **Utility Functions**: Create shared utility modules for common operations
5. **Configuration Management**: Centralize environment variables and settings
6. **API Layer**: Organize API calls into dedicated service modules

**FILE & FOLDER STRUCTURE:**
7. **Directory Organization**: Create proper folder hierarchies (components, utils, services, etc.)
8. **File Naming**: Standardize naming conventions across the project
9. **Index Files**: Add index.js files for cleaner imports
10. **Asset Organization**: Properly structure images, styles, and static files

**DEPENDENCY MANAGEMENT:**
11. **Package Cleanup**: Remove unused npm packages
12. **Version Updates**: Update outdated dependencies (with compatibility checks)
13. **Bundle Optimization**: Identify and fix large bundle sizes
14. **Code Splitting**: Implement lazy loading where beneficial

### ADDITIONAL MAINTENANCE TASKS

**TESTING & QUALITY ASSURANCE:**
- **Missing Tests**: Identify functions/components lacking test coverage
- **Test Organization**: Structure test files properly
- **Mock Cleanup**: Remove outdated or unused test mocks

**SECURITY & BEST PRACTICES:**
- **Security Vulnerabilities**: Fix common issues (XSS, injection risks)
- **Input Validation**: Add missing validation for user inputs
- **Environment Variables**: Secure sensitive data properly
- **CORS & Headers**: Ensure proper security headers

**DOCUMENTATION & PROJECT HEALTH:**
- **README Updates**: Keep documentation current with code changes
- **Package.json**: Clean up scripts, dependencies, and metadata  
- **Git Hygiene**: Suggest .gitignore improvements
- **Configuration Files**: Update ESLint, Prettier, TypeScript configs

**PERFORMANCE OPTIMIZATION:**
- **Memory Leaks**: Identify potential memory issues
- **Render Optimization**: Fix unnecessary re-renders (React)
- **Database Queries**: Optimize inefficient queries
- **Image Optimization**: Suggest image compression/formats

### EXECUTION COMMANDS

**Before Starting:**
```bash
# Run existing linters first
npm run lint --fix
npm run prettier --write .
npm run type-check (if TypeScript)
```

**Post-Execution Validation:**
```bash
# Verify everything still works
npm run build
npm run test
npm run lint
```

### OUTPUT AFTER EXECUTION
1. **Changes Made**: List of files modified with brief description
2. **Files Created**: Any new files added during reorganization  
3. **Files Moved/Deleted**: Clear record of structural changes
4. **Remaining Manual Tasks**: Issues that require human decision
5. **Validation Results**: Confirmation that code still runs/compiles

**START ANALYSIS AND BEGIN AUTO-FIXES NOW**