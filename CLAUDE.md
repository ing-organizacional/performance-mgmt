# CLAUDE.md

This file provides critical guidance to Claude Code (claude.ai/code) for this repository.

## Project Overview

Performance Management System - Enterprise web application managing employee evaluations across 4000+ employees in 27 companies. Mobile-first design with bilingual support (English/Spanish) for mixed workforces.

## Critical Architecture

**Tech Stack:**

- Next.js 15.4.5 + App Router + TypeScript + Tailwind CSS 4.0
- SQLite with Prisma ORM 6.13.0 (9-table schema)
- NextAuth v5.0.0-beta.29 authentication
- React 19.1.0 mobile-first responsive design
- **YARN 4.9.2 (Berry)** package manager (never npm)
- **Node.js 22.18.0** minimum required
- **Zod ^4.0.14** validation (custom implementation)

**Database Models (9 tables):**

- `Company` - Multi-tenant isolation
- `User` - Mixed workforce (email/PIN/biometric auth, HRIS integration)
- `Evaluation` - Unified JSON evaluation data + 3-status workflow (draft→submitted→completed)
- `EvaluationItem` - Individual OKR/Competency definitions
- `EvaluationItemAssignment` - Employee-item assignments
- `PerformanceCycle` - Annual/quarterly cycles with read-only enforcement
- `PartialAssessment` - HR assessment tracking
- `AuditLog` - Complete change tracking
- `BiometricCredential` - WebAuthn/FIDO2 biometric authentication

**Key Files:**

- `/src/lib/prisma-client.ts` - Database connection (always use this)
- `/src/auth.ts` - NextAuth v5 configuration
- `/src/middleware.ts` - Route protection
- `/prisma/schema.prisma` - Database schema
- `/src/lib/i18n.ts` - Bilingual translations
- `/src/lib/actions/` - Server Actions (users, evaluations, cycles)
- `/src/lib/seed.ts` - Database seeding

**Active APIs (8 endpoints):**

- `/api/auth/[...nextauth]` - NextAuth authentication (GET/POST)
- `/api/auth/update-last-login` - Login timestamp tracking (POST)
- `/api/health` - System health check (GET)
- `/api/evaluation-items` + `/api/evaluation-items/[id]` - Item management (GET/PUT)
- `/api/manager/team` - Team data (GET)
- `/api/admin/import` - CSV import (POST)
- `/api/admin/reset-database` - DB reset (POST)

**Server Actions (preferred architecture):**

- `/src/lib/actions/users.ts` - User management (create, update, delete)
- `/src/lib/actions/cycles.ts` - Cycle management (create, update status)
- `/src/lib/actions/evaluations.ts` - Evaluation workflow (submit, approve, unlock)
- `/src/lib/actions/biometric.ts` - WebAuthn/FIDO2 biometric authentication
- `/src/lib/actions/export.ts` + `exports.ts` - Advanced export system
- `/src/lib/actions/index.ts` - Centralized action exports

## Essential Commands

```bash
yarn dev                    # Development server
yarn db:studio             # Database editor
yarn db:seed               # Demo data + test users
yarn db:reset              # Reset + seed
yarn build                 # Production build
yarn lint && yarn tsc --noEmit  # Code quality check
```

**Demo Credentials:**

- HR: `hr@demo.com / password123` (admin)
- Manager: `manager@demo.com / password123` (team lead)
- Employee: `employee1@demo.com / password123` (worker)
- Operational: `worker1 / 1234` (PIN login)

## Current System Features

**Evaluation Workflow (CRITICAL):**

- **3-Status System**: draft → submitted → completed
- **Manager Process**: Create evaluation, add ratings+comments, submit
- **Employee Process**: Approve submitted evaluations
- **HR Controls**: Can unlock submitted evaluations back to draft
- **Auto-save**: 2-second delay on manager evaluation forms

**Performance Cycle Management:**

- **Cycle Status**: Active (editable) → Closed (read-only for managers) → Archived
- **HR Controls**: Create/close/reopen cycles via CycleSelector component
- **Visual Indicators**: Red banners show when cycles are closed
- **Partial Assessments**: HR can rate individual items with custom evaluation dates

**Role-Based Access:**

- **HR**: `/dashboard` → cycle management, team overview, deadline tracking
- **Managers**: `/evaluations` → team evaluation list, evaluation forms
- **Employees**: `/my-evaluations` → view received evaluations, approve pending ones

**Mobile-First Design:**

- Touch-friendly 44px minimum targets
- Progressive disclosure (one decision per screen)
- Star rating system (1-5 scale) with auto-focus
- Bilingual support (English/Spanish) with language switcher

## Authentication & User Management

**Mixed Workforce Support:**

- Office workers: `email + password`
- Operational workers: `username + PIN`
- **Biometric Authentication**: WebAuthn/FIDO2 (Face ID, Touch ID, Fingerprint)
- HR manages all accounts via Server Actions or CSV import

**User Management Methods:**

1. **Server Actions**: `/src/lib/actions/users.ts` (createUser, updateUser, deleteUser)
2. **CSV Import**: `/api/admin/import` with bulk user creation
3. **Prisma Studio**: `yarn db:studio` for visual database editing

## Advanced Biometric Authentication

**WebAuthn/FIDO2 Implementation:**

- Face ID, Touch ID, Fingerprint support
- Device registration and management
- Counter-based replay protection
- Multiple credential support per user

**Biometric Features:**

- `/src/lib/actions/biometric.ts` - Server Actions for credential management
- `BiometricCredential` database table - Secure credential storage
- Device naming and type tracking (Face ID, Touch ID, Fingerprint)
- Active credential management with counter-based replay protection
- Last usage tracking and multiple device support per user

**Implementation Details:**

- WebAuthn Level 2 compliant
- Cross-platform authenticator support (Platform + Roaming)
- Base64-encoded public key storage
- Signature counter verification
- User verification required for sensitive operations
- Browser compatibility: Chrome 67+, Firefox 60+, Safari 14+

**Usage Workflow:**

1. User registers biometric credential via `/src/components/ui/BiometricAuth.tsx`
2. PublicKeyCredential stored securely in database
3. Authentication via WebAuthn challenge-response
4. Session created through NextAuth credentials provider

## Development Guidelines

**Critical Rules:**

- Always use `/src/lib/prisma-client.ts` for database operations
- Use YARN exclusively (never npm)
- Follow NextAuth v5 patterns with JWT strategy
- Maintain company-based data isolation
- Apply TypeScript casting: `result as ModelType` (AUDIT NOTE: Some unsafe type assertions found)

**Security Requirements (Updated December 2025):**

- ⚠️ **Remove hardcoded demo passwords** from seed files before production
- ✅ **Zod validation implemented** - comprehensive input validation active
- ⚠️ **Add CSRF protection** and Content Security Policy headers
- ✅ **Rate limiting active** for admin endpoints (10 attempts/hour)  
- ⚠️ **Console.log cleanup** - restrict to development environments only
- ⚠️ **Fix unsafe type assertions** with proper type guards
- ✅ **Database indexes optimized** - 20+ strategic indexes implemented

**Code Quality Requirements:**

- Clean TypeScript compilation: `yarn tsc --noEmit`
- Pass ESLint checks: `yarn lint`
- Mobile-first responsive design
- Proper error handling with user-friendly messages

**When Adding Features:**

- Test mobile-first design
- Ensure company data isolation in all queries
- Update bilingual translations (English/Spanish)
- Test with different user roles (HR/Manager/Employee)
- Maintain audit trail for data changes
- **SECURITY REQUIREMENTS (Post-Audit):**
  - Add Zod schema validation for all inputs
  - Implement proper error handling without information disclosure
  - Add comprehensive type safety (no unsafe assertions)
  - Test for N+1 query problems
  - Ensure no console.log statements in production code
  - Add appropriate security headers and protections

## Current System State (August 2025)

**Comprehensive Code Audit Completed:**

- Complete security vulnerability assessment performed
- Performance bottlenecks and optimization opportunities identified
- Architecture analysis and improvement recommendations provided
- All documentation updated with audit findings

**Branch Status:** Currently on `develop` branch (99 commits in last month - very active development)

**Build Status:** ✅ Clean TypeScript compilation and ESLint passes

**Security Status:** ⚠️ CRITICAL ISSUES IDENTIFIED - See SECURITY.md for details

**Key Audit Findings:**

- ⚠️ **Hardcoded demo passwords** in seed files (`/src/lib/seed.ts:108-109`, login page displays)
- ✅ **Rate limiting implemented** for admin import endpoint (10 attempts/hour)
- ⚠️ **Console.log in seed files** - development only, not production APIs
- ⚠️ **N+1 query problems** in team data fetching (performance impact)
- ⚠️ **Large components** violating single responsibility principle
- ⚠️ **Missing security controls** (CSRF protection, Content Security Policy)

**Production Readiness:**

- ✅ **Core functionality complete and tested**
- ✅ **Advanced biometric authentication system** (WebAuthn/FIDO2)
- ✅ **Mobile-optimized and bilingual** (English/Spanish)
- ✅ **Comprehensive evaluation workflow** (3-status system)
- ✅ **Performance cycles** with read-only enforcement active
- ✅ **Server Actions architecture** reduces API complexity (8 APIs vs original 21)
- ✅ **Next.js caching optimizations** implemented (`unstable_cache`)
- ⚠️ **Security hardening needed** - CSRF protection and CSP headers
- ⚠️ **Demo data cleanup** - remove hardcoded passwords before production

**Estimated Fix Timeline:**

- ✅ **Major optimizations completed** - caching, API reduction, biometric auth
- ⚠️ **Remaining security hardening**: 1-2 weeks (CSRF, CSP, demo cleanup)
- ⚠️ **Component refactoring**: 2-4 weeks (break down large components)
- ⚠️ **Production deployment prep**: 1 week (environment setup, final testing)
