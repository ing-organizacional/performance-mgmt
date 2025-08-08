# CLAUDE.md

This file provides critical guidance to Claude Code (claude.ai/code) for this repository.

## Project Overview

Performance Management System - Enterprise web application managing employee evaluations across 4000+ employees in 27 companies. Mobile-first design with bilingual support (English/Spanish) for mixed workforces.

## Critical Architecture

**Tech Stack:**
- Next.js 15.4.5 + App Router + TypeScript + Tailwind CSS 4.0
- SQLite with Prisma ORM 6.13.0 (8-table schema)
- NextAuth v5.0.0-beta.29 authentication
- React 19.1.0 mobile-first responsive design
- **YARN package manager** (never npm)

**Database Models (8 tables):**
- `Company` - Multi-tenant isolation
- `User` - Mixed workforce (email/PIN auth, HRIS integration)
- `Evaluation` - Unified JSON evaluation data + 3-status workflow (draft→submitted→completed)
- `EvaluationItem` - Individual OKR/Competency definitions 
- `EvaluationItemAssignment` - Employee-item assignments
- `PerformanceCycle` - Annual/quarterly cycles with read-only enforcement
- `PartialAssessment` - HR assessment tracking
- `AuditLog` - Complete change tracking

**Key Files:**
- `/src/lib/prisma-client.ts` - Database connection (always use this)
- `/src/auth.ts` - NextAuth v5 configuration
- `/src/middleware.ts` - Route protection
- `/prisma/schema.prisma` - Database schema
- `/src/lib/i18n.ts` - Bilingual translations
- `/src/lib/actions/` - Server Actions (users, evaluations, cycles)
- `/src/lib/seed.ts` - Database seeding

**Active APIs (14 endpoints):**
- `/api/auth/[...nextauth]` - NextAuth authentication (POST)
- `/api/health` - System health check (GET)
- `/api/evaluations` - Evaluation CRUD (GET/POST)
- `/api/evaluations/[id]` - Individual evaluations (GET)
- `/api/evaluation-items` + `/api/evaluation-items/[id]` - Item management (GET/PUT/DELETE)
- `/api/manager/team` + `/api/manager/team-assignments` - Team data (GET)
- `/api/partial-assessments` - HR assessments (GET/POST)
- `/api/admin/companies` - Company data (GET)
- `/api/admin/import` - CSV import (POST)
- `/api/admin/reset-database` - DB reset (POST)

**Server Actions (preferred architecture):**
- `/src/lib/actions/users.ts` - User management (create, update, delete)
- `/src/lib/actions/cycles.ts` - Cycle management (create, update status)
- `/src/lib/actions/evaluations.ts` - Evaluation workflow (submit, approve, unlock)

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
- HR manages all accounts via Server Actions or CSV import

**User Management Methods:**
1. **Server Actions**: `/src/lib/actions/users.ts` (createUser, updateUser, deleteUser)
2. **CSV Import**: `/api/admin/import` with bulk user creation
3. **Prisma Studio**: `yarn db:studio` for visual database editing

## Development Guidelines

**Critical Rules:**
- Always use `/src/lib/prisma-client.ts` for database operations
- Use YARN exclusively (never npm)
- Follow NextAuth v5 patterns with JWT strategy
- Maintain company-based data isolation
- Apply TypeScript casting: `result as ModelType`

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

## Current System State (August 2025)

**Recent Changes in Working Directory:**
- Enhanced evaluation system with improved UX and bilingual support
- Comprehensive evaluation locking for submitted evaluations
- Improved evaluation selection logic (shows most recently updated)
- Dynamic performance summary and cycle integration
- Deadline management utilities for evaluation items

**Branch Status:** Currently on `my-evaluations` branch

**Build Status:** ✅ Clean TypeScript compilation and ESLint passes

**Key Recent Commits:**
- `e6f63a0` - Enhanced evaluation system UX with improved styling and bilingual support  
- `bada0f6` - Implemented comprehensive evaluation locking for submitted evaluations

**Production Readiness:**
- Core functionality complete and tested
- Security audit completed (change default secrets before production)
- Mobile-optimized and bilingual
- Comprehensive evaluation workflow implemented
- Performance cycles with read-only enforcement active
- Server Actions architecture reduces API complexity