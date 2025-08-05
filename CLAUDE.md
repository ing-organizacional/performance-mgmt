# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Performance Management System - A mobile-first web application for managing employee OKRs and competency evaluations across 27 companies with 4000+ employees. Built for mixed workforce (office workers + operational workers) with full bilingual support.

## Critical Architecture

**Tech Stack:**
- Next.js 15 with App Router + TypeScript + Tailwind CSS
- SQLite database with Prisma ORM (4-table schema)
- NextAuth v5 for authentication
- Mobile-first responsive design
- **Package Manager: YARN** (never use npm)

**Database Schema (4 tables only):**
- `Company` - Multi-tenant company isolation
- `User` - Mixed workforce (office: email/password, operational: username/PIN)
- `Evaluation` - Unified evaluation system with evaluationItemsData JSON field
- `AuditLog` - Complete change tracking

**Key Files:**
- `/src/lib/prisma-client.ts` - Database connection (use this, not prisma.ts)
- `/src/auth.ts` - NextAuth v5 configuration
- `/src/middleware.ts` - Route protection
- `/prisma/schema.prisma` - Database schema
- `/src/lib/i18n.ts` - Bilingual translations (English/Spanish)

## Essential Commands

**Development:**
```bash
yarn dev                    # Start development server
yarn db:studio             # Open visual database editor
yarn db:seed               # Add demo data
yarn db:import users.csv   # Import users from CSV
yarn db:reset              # Reset DB + seed data
yarn build                 # Production build
yarn lint                  # Code linting
yarn tsc --noEmit          # TypeScript check
```

**Database Management:**
- Database file: `/prisma/dev.db`
- Demo credentials in console after `yarn db:seed`
- User management: API, CSV import, or Prisma Studio

**User Management (3 methods):**
1. **Prisma Studio:** `yarn db:studio` (visual interface)
2. **CSV Import:** `yarn db:import file.csv` (bulk operations)
3. **Admin API:** `/api/admin/users` (programmatic)

## Mobile-First UI Architecture

**Manager Evaluations Page (`/evaluations`):**
- Sticky header with navigation and sign out
- **Fixed compact summary card** (recent update) - shows team metrics
- Scrollable employee list with status indicators
- Mobile optimized with touch-friendly targets

**Employee Evaluation Flow (`/evaluate/[id]`):**
- Progressive disclosure (one decision per screen)
- Fixed evaluation item card (always visible)
- Star rating system (1-5 scale) with auto-focus on textarea
- Step-by-step wizard with progress bar
- Auto-save functionality
- Thumb-friendly touch targets (44px minimum)

**Role-Based Navigation:**
- HR → `/dashboard` (completion tracking, analytics)
- Manager → `/evaluations` (employee list → evaluation flow)
- Employee → `/my-evaluations` (view history, current status)

## Unified Evaluation System (CRITICAL)

**Current Implementation:**
- **Single data field:** `evaluationItemsData` (JSON string in database)
- **Unified interface:** Combines OKRs and Competencies in one array
- **Item structure:** Each item has `type: 'okr' | 'competency'`
- **Three-tier system:** Company/Department/Manager levels
- **Visual differentiation:** 🎯 for OKRs, ⭐ for Competencies

**IMPORTANT - Never use these fields (deprecated):**
- ❌ `okrsData` - Removed from schema
- ❌ `competenciesData` - Removed from schema
- ❌ Separate OKR/Competency models - All unified

**Evaluation Item Structure:**
```typescript
interface EvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  rating: number | null
  comment: string
  level?: 'company' | 'department' | 'manager'
  createdBy?: string
}
```

## Authentication System

**Mixed Workforce Support:**
- Office workers: email + password
- Operational workers: username + PIN
- HR manages all accounts
- No AD dependency (optional integration available)

**Login Patterns:**
- `hr@demo.com / password123` (HR admin) 
- `manager@demo.com / password123` (Manager)
- `employee1@demo.com / password123` (Office worker)
- `worker1 / 1234` (Operational worker with PIN)

**Password Field Features:**
- Black dots (not default browser gray)
- Eye icon to show/hide password
- Mobile-optimized input handling

## Bilingual Support (English/Spanish)

**Implementation:**
- Translation context: `/src/contexts/LanguageContext.tsx`
- Translation definitions: `/src/lib/i18n.ts`
- Language switcher: `/src/components/LanguageSwitcher.tsx`
- Usage pattern: `const { t } = useLanguage()` then `{t.common.loading}`

**Translation Structure:**
- `t.common.*` - Common UI elements
- `t.auth.*` - Authentication pages
- `t.nav.*` - Navigation elements
- `t.evaluations.*` - Evaluation interface
- `t.okrs.*` - OKR specific terms (minimal)
- `t.dashboard.*` - Dashboard/analytics
- `t.users.*` - User management

**Best Practices:**
- Always check translations are complete for both languages
- Use `{t.key}` pattern consistently
- Test language switching functionality
- Maintain professional tone in both languages

## Development Guidelines

**Critical Rules:**
- Always use `/src/lib/prisma-client.ts` for database operations
- Keep mobile-first design principles
- Maintain 4-table database simplicity
- Store evaluation data as JSON in `evaluationItemsData` field
- Use company-based data isolation
- Follow NextAuth v5 patterns (not v4)
- Use YARN exclusively (never npm)

**When Adding Features:**
- Test on mobile devices first
- Ensure company data isolation
- Add proper error handling
- Update documentation if touching user operations
- Maintain audit trail in database
- Check bilingual support works properly

**Code Quality Standards:**
- TypeScript compilation must be clean (`yarn tsc --noEmit`)
- ESLint warnings should be addressed
- Mobile-first responsive design
- Proper error boundaries
- Loading states for all async operations

**File Patterns:**
- Use unified evaluation system patterns
- Follow established component structure
- Maintain consistent styling with Tailwind
- Proper TypeScript interfaces for all data

## Security Audit Findings (Updated 2024-08-05)

**FIXED Security Issues:**
- ✅ All TypeScript compilation errors resolved
- ✅ Export functions updated for unified evaluation system
- ✅ Code quality improved with proper type safety
- ✅ Translation keys cleaned up (28% reduction)

**CRITICAL Security Issues to Fix Before Production:**
1. **Default Secrets**: Change all NEXTAUTH_SECRET values from defaults
   - Use: `openssl rand -base64 32` for secure secrets
   - Update: `.env`, `docker-compose.yml`, all environment files

2. **Admin API Security**: Add role-based access control to `/api/admin/*` endpoints
   - Current issue: Any authenticated user can access admin functions
   - Fix needed: Middleware to verify `role === 'hr'` before admin operations

3. **Demo Credentials**: Remove hardcoded demo credentials from login page
   - File: `/src/app/login/page.tsx` 
   - Security risk: Information disclosure in production

**API Endpoints Requiring Protection:**
- `/api/admin/users` - User management (GET, POST)
- `/api/admin/users/[id]` - User operations (PUT, DELETE)
- `/api/admin/companies` - Company management
- `/api/admin/import` - CSV import functionality

**Security Best Practices Implemented:**
- ✅ bcryptjs password hashing (salt rounds: 12)
- ✅ NextAuth v5 with JWT strategy
- ✅ Company-based data isolation
- ✅ Input validation on API endpoints
- ✅ Audit logging for all changes
- ✅ Non-root Docker container user (1001:1001)
- ✅ Clean TypeScript compilation
- ✅ Proper type safety throughout

**Additional Hardening Recommendations:**
- Add rate limiting to auth endpoints
- Implement generic error messages in production
- Add HTTPS/SSL certificates for deployment
- Set up automated security scanning

## Recent Updates (2024-08-05)

**Major Changes:**
1. **Unified Evaluation System**: Combined OKRs and Competencies into single `evaluationItemsData` field
2. **TypeScript Cleanup**: All compilation errors resolved, proper type safety
3. **Translation Optimization**: Removed unused keys, 28% file size reduction
4. **Export Functions**: Updated for new unified data structure (PDF/Excel)
5. **UI Improvements**: Compact manager summary card, better mobile experience
6. **Code Quality**: ESLint warnings addressed, better maintainability

**Breaking Changes:**
- `okrsData` and `competenciesData` fields removed from database
- All evaluation data now in unified `evaluationItemsData` JSON field
- Export functions use new data structure
- Translation keys cleaned up (some removed)

**Performance Notes:**
- SQLite handles the scale easily (4K employees across 27 companies)
- JSON queries for evaluation data are efficient
- Mobile-optimized bundle size critical for operational workers
- TypeScript compilation is clean and fast

## GitHub Repository

**Repository:** https://github.com/ing-organizacional/performance-mgmt
**Branch:** main
**Status:** Production-ready (with security fixes)

**Commit Patterns:**
- Use descriptive commit messages
- Include security/breaking change notes
- Add co-authorship for Claude contributions:
```
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

This system has a solid architecture and is ready for deployment with the above security fixes.