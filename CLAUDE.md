# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Performance Management System - A mobile-first web application for managing employee OKRs and competency evaluations across 27 companies with 4000+ employees. Built for mixed workforce (office workers + operational workers) with full bilingual support (English/Spanish).

## Critical Architecture

**Tech Stack:**
- Next.js 15.4.5 with App Router + TypeScript 5 + Tailwind CSS 4.0
- SQLite database with Prisma ORM 6.13.0 (8-table relational schema)
- NextAuth v5.0.0-beta.29 for authentication
- React 19.1.0 with mobile-first responsive design
- **Package Manager: YARN** (never use npm)

**Database Schema (8 models):**
- `Company` - Multi-tenant company isolation
- `User` - Mixed workforce with personID/employeeId identifiers for HRIS integration
- `Evaluation` - Unified evaluation system with evaluationItemsData JSON field + cycleId
- `EvaluationItem` - Individual OKR/Competency definitions with 3-tier assignment system + deadline management
- `EvaluationItemAssignment` - Individual item-to-employee assignments with manager tracking
- `PerformanceCycle` - Annual/quarterly performance cycles with status management + creator audit trail
- `PartialAssessment` - Individual item assessments with evaluation date tracking and version control
- `AuditLog` - Complete change tracking for all evaluation operations

**Key Files:**
- `/src/lib/prisma-client.ts` - Database connection (use this, not prisma.ts)
- `/src/auth.ts` - NextAuth v5 configuration
- `/src/middleware.ts` - Route protection
- `/prisma/schema.prisma` - Database schema with cycle management + deadline fields
- `/src/lib/i18n.ts` - Bilingual translations (English/Spanish)
- `/src/lib/seed.ts` - Database seeding with HR test accounts and default cycle
- `/src/lib/cycle-permissions.ts` - Performance cycle permission validation
- `/src/lib/deadline-utils.ts` - Deadline calculation and urgency management utilities
- `/src/components/features/cycles/CycleSelector.tsx` - Cycle management UI component
- `/src/components/features/cycles/CycleStatusBanner.tsx` - Read-only status indicator
- `/src/components/features/evaluation/DeadlineDisplay.tsx` - Deadline visualization components

**Key API Endpoints (14 implemented):**
- **Authentication**:
  - `/api/auth/[...nextauth]` - NextAuth v5 authentication routes (POST)
  - `/api/auth/update-last-login` - Track user login times (POST)
- **Core Evaluation System**:
  - `/api/evaluations` - Personal evaluations for logged-in user (GET/POST)
  - `/api/evaluations/[id]` - Individual evaluation operations (GET/PUT/DELETE)
  - `/api/evaluation-items` - OKR/Competency management with 3-tier assignments + deadlines (GET/POST)
  - `/api/evaluation-items/[id]` - Individual item operations with deadline management (GET/PUT/DELETE)
  - `/api/evaluation-items/assign` - Individual item assignments (POST)
  - `/api/partial-assessments` - Granular performance tracking (POST)
- **Manager Functions**:
  - `/api/manager/team` - Team data for managers and HR (GET)
  - `/api/manager/team-assignments` - Team assignment management (GET)
- **Admin Functions**:
  - `/api/admin/companies` - Company management (GET)
  - `/api/admin/import` - CSV user import with enhanced field support (POST)
  - `/api/admin/reset-database` - Development database reset (POST)
- **Manager Functions**:
  - `/api/manager/team-assignments` - Team assignment management (GET)
- **Utility**:
  - `/api/health` - System health check (GET)

**User Management via Server Actions** (not REST APIs):
- `/src/lib/actions/users.ts` - createUser, updateUser, deleteUser Server Actions
- `/src/lib/actions/cycles.ts` - createCycle, updateCycleStatus Server Actions
- `/src/lib/actions/evaluations.ts` - evaluation management Server Actions

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
3. **Server Actions:** `/src/lib/actions/users.ts` (createUser, updateUser, deleteUser)

## Mobile-First UI Architecture

**HR Dashboard Page (`/dashboard`):**
- Overview analytics and completion tracking
- **Performance Cycle Management**: CycleSelector with create/close/reopen capabilities
- **Triple navigation buttons**: "Employee Evaluations" + "My Evaluations" + "Deadlines"
- Quick actions for exports and user management
- Mobile-optimized compact button styling (text-xs, small icons)

**Manager/HR Evaluations Page (`/evaluations`):**
- **Back button navigation** for HR users (returns to dashboard)
- **Cycle Status Banner** - shows read-only status when cycles are closed
- Sticky header with streamlined navigation
- **Single "Assignments" button** (redundant "My Evaluations" removed)
- **Fixed compact summary card** - shows team metrics
- Scrollable employee list with status indicators
- **Read-only enforcement** based on cycle status
- Mobile optimized with touch-friendly targets

**Employee Evaluation Flow (`/evaluate/[id]`):**
- Progressive disclosure (one decision per screen)
- Fixed evaluation item card (always visible) with deadline indicators
- Star rating system (1-5 scale) with auto-focus on textarea
- Step-by-step wizard with progress bar
- Auto-save functionality
- Thumb-friendly touch targets (44px minimum)
- **Deadline Display**: Shows evaluation deadlines with urgency indicators

**My Evaluations Page (`/my-evaluations`):**
- **Universal access** - works for employees, managers, and HR
- Shows evaluations received by the logged-in user
- Real-time data fetching from API
- Performance history and summary analytics

**Deadline Management Page (`/dashboard/deadlines`):**
- **HR-only access** - comprehensive deadline oversight interface
- **Urgency-based organization**: Overdue, due soon, this week, future
- **Filtering capabilities**: Filter by urgency level with visual indicators
- **Dual view modes**: Groups by department/manager OR flat list view
- **Progress tracking**: Visual progress bars and completion statistics
- **Role-based data**: Shows who set deadlines and assignment levels

**Role-Based Navigation:**
- HR → `/dashboard` (analytics + cycle management) ↔ `/evaluations` (manage teams) ↔ `/my-evaluations` (personal) ↔ `/dashboard/deadlines` (deadline oversight)
- Manager → `/evaluations` (employee list → evaluation flow) ↔ `/my-evaluations` (personal)
- Employee → `/my-evaluations` (view history, current status)

## Performance Cycle Management (CRITICAL)

**Enterprise-Grade Cycle Control:**
- **Annual/Quarterly Cycles**: Create performance review periods with start/end dates
- **Status Management**: Active → Closed → Archived workflow
- **Read-Only Enforcement**: Automatic restriction of edit permissions based on cycle status
- **Partial Assessment System**: HR can make individual item assessments with custom evaluation dates
- **Audit Trail**: Complete tracking of cycle operations and closures

**Cycle Status Rules (Ridiculously Simple):**
1. **ACTIVE**: Normal editing permissions for all users
2. **CLOSED**: Read-only for managers, HR can edit partial assessments only
3. **ARCHIVED**: Read-only for everyone (historical reference)

**HR Cycle Management Workflow:**
1. **Create Cycle**: Dashboard → CycleSelector → "+ New Cycle"
2. **Monitor Progress**: Real-time evaluation completion tracking
3. **Make Partial Assessments**: Individual OKR/competency ratings with evaluation dates
4. **Close Cycle**: Dashboard → CycleSelector → ⚙️ → "🔒 Close Cycle"
5. **Reopen if Needed**: Dashboard → CycleSelector → ⚙️ → "🔓 Reopen Cycle"

**Manager Experience During Closed Cycles:**
- **Visual Indicators**: Red CycleStatusBanner appears on evaluation pages
- **Clear Messaging**: "Performance cycle is closed. All evaluations are now read-only."
- **Historical Access**: Can view all past evaluations and cycle data
- **No Disruption**: Normal workflow during active cycles

**Partial Assessment Features:**
- **Evaluation Date Tracking**: Record when performance actually occurred vs. when assessed
- **Assessment Types**: manager_initial, hr_adjustment, manager_update
- **Version Control**: Latest version flagging with complete history
- **HR Flexibility**: Make corrections and adjustments even after cycle closure

## Evaluation System Architecture (CRITICAL)

**Dual System Implementation:**
The system supports both traditional evaluations and the new structured evaluation items system:

**Traditional Evaluations (Evaluation model):**
- **Single data field:** `evaluationItemsData` (JSON string in database)
- **Unified interface:** Combines OKRs and Competencies in one array
- **Backward compatibility:** Supports existing evaluation workflows
- **Cycle association:** Links to PerformanceCycle via `cycleId`

**Structured Evaluation Items (EvaluationItem model):**
- **Separate model:** Individual OKR/Competency definitions stored as records
- **3-tier assignment system:** Company/Department/Manager level assignments
- **Individual assignments:** EvaluationItemAssignment table for specific employee-item links
- **Partial assessments:** Granular tracking via PartialAssessment model
- **Cycle integration:** Full performance cycle workflow support
- **Deadline management:** Evaluation deadlines with role-based permissions and urgency tracking

**Current Data Structure:**
```typescript
// Traditional evaluation item (JSON stored)
interface TraditionalEvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  rating: number | null
  comment: string
  level?: 'company' | 'department' | 'manager'
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
}

// Structured evaluation item (database model)
interface StructuredEvaluationItem {
  id: string
  companyId: string
  cycleId?: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  createdBy: string
  assignedTo?: string
  active: boolean
  sortOrder: number
  evaluationDeadline?: Date | null
  deadlineSetBy?: string | null
  deadlineSetByUser?: User // Relation for audit trail
}
```

## Authentication System

**Mixed Workforce Support:**
- Office workers: email + password
- Operational workers: username + PIN
- HR manages all accounts
- No AD dependency (optional integration available)

**Login Patterns:**
- `hr@demo.com / password123` (HR Admin - no direct reports, admin functions only)
- `hr1@demo.com / password123` (HR Manager - Human Resources team, 4 employees)
- `hr2@demo.com / password123` (HR Manager - Talent Acquisition team, 4 employees)
- `hr3@demo.com / password123` (HR Manager - Learning & Development team, 4 employees)
- `manager@demo.com / password123` (Manager - Operations team, 8 employees)
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
- **Maintain 8-table relational database integrity** (Company, User, Evaluation, EvaluationItem, EvaluationItemAssignment, PerformanceCycle, PartialAssessment, AuditLog)
- Store unified evaluation data as JSON in `evaluationItemsData` field for backward compatibility
- Use company-based data isolation across all models
- Follow NextAuth v5 patterns (not v4) with JWT strategy
- Use YARN exclusively (never npm)
- Apply type casting when needed for Prisma string/union type compatibility (`result as ModelType`)

**When Adding Features:**
- Test on mobile devices first
- Ensure company data isolation across all database queries
- Add proper error handling with user-friendly messages
- Update CLAUDE.md documentation if touching core functionality
- Maintain audit trail in database for evaluation changes
- Check bilingual support works properly (English/Spanish)
- Test with different user roles (HR, Manager, Employee)
- Verify navigation flows work for all roles
- Ensure consistent button styling (text-xs, compact design)
- Test language switching functionality
- **Apply type casting for Prisma results**: `const result = await prisma.model.method(...); return result as ModelType`

**Development Patterns:**

**1. Database Operations Pattern:**
```typescript
// Always use this pattern for Prisma operations
const result = await prisma.evaluationItem.create({
  data: { /* ... */ }
})
return result as EvaluationItem // Required for union type compatibility
```

**2. API Route Structure:**
```typescript
// All API routes follow this pattern
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  // Ensure company isolation
  const items = await prisma.model.findMany({
    where: { companyId: user.companyId }
  })
  return NextResponse.json(items as ModelType[])
}
```

**3. Component Organization:**
```typescript
// Feature-based component organization (NEW ARCHITECTURE)
src/components/
├── ui/              // Reusable UI primitives (ConfirmDialog, LoadingSpinner, Toast)
├── features/        // Domain-specific components
│   ├── cycles/      // Performance cycle components (CycleSelector, CycleStatusBanner)
│   ├── dashboard/   // Dashboard components (export-button)
│   ├── evaluation/  // Evaluation components (DeadlineDisplay)
│   └── users/       // User management components (future)
├── forms/           // Form components (UserForm)
├── layout/          // Layout components (LanguageSwitcher)
├── providers/       // React context providers (auth-provider)
└── index.ts         // Centralized exports
```

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

## Security Audit Findings (Updated 2025-08-06)

**FIXED Security Issues:**
- ✅ All TypeScript compilation errors resolved (evaluation-service.ts, user-service.ts)
- ✅ Export functions updated for unified evaluation system
- ✅ Code quality improved with proper type safety and casting
- ✅ Demo credentials properly secured (only shown in development mode)
- ✅ Translation keys cleaned up (28% reduction)

**CRITICAL Security Issues to Fix Before Production:**
1. **Default Secrets**: Change all NEXTAUTH_SECRET values from defaults
   - Use: `openssl rand -base64 32` for secure secrets
   - Update: `.env`, `docker-compose.yml`, all environment files

2. **Admin API Security**: Add role-based access control to `/api/admin/*` endpoints
   - Current issue: Any authenticated user can access admin functions
   - Fix needed: Middleware to verify `role === 'hr'` before admin operations

**SECURE IMPLEMENTATIONS (Previously Flagged as Issues):**
- ✅ **Demo Credentials**: Actually secure - only visible in development mode via environment check
- ✅ **Login Page Security**: Production-ready implementation with proper environment detection

**API Endpoints Requiring Protection:**
- `/api/admin/companies` - Company management (GET) - **Implemented**
- `/api/admin/import` - CSV import functionality (POST) - **Implemented**  
- `/api/admin/reset-database` - Database reset (POST) - **Implemented**
- **Note**: User management is handled via Server Actions in `/src/lib/actions/users.ts`, not REST API endpoints

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

## Recent Updates (2025-08-05 - 2025-08-07)

**Major Changes:**
1. **Unified Evaluation System**: Combined OKRs and Competencies into single `evaluationItemsData` field
2. **TypeScript Cleanup**: All compilation errors resolved, proper type safety
3. **Translation Optimization**: Removed unused keys, 28% file size reduction
4. **Export Functions**: Updated for new unified data structure (PDF/Excel)
5. **UI Improvements**: Compact manager summary card, better mobile experience
6. **Code Quality**: ESLint warnings addressed, better maintainability
7. **HR Team Management**: Added support for HR users to manage their own teams
8. **Universal My Evaluations**: All roles can now access their personal evaluation history
9. **Streamlined Navigation**: Removed redundant buttons, standardized sizing across pages
10. **Enhanced Mobile UX**: Consistent button styling, improved language switcher subtlety
11. **Performance Cycle Management**: Complete cycle creation, status management, and read-only enforcement
12. **Partial Assessment System**: HR can make individual item assessments with evaluation date tracking
13. **Evaluation Deadlines**: Complete deadline management system with role-based permissions and urgency tracking
14. **Company Items Management**: Fixed badge update issues and improved state management for activate/deactivate functionality

**New Features Added:**
- **HR Manager Support**: HR users can access `/evaluations` page to manage their direct reports
- **Team Data API**: Extended `/api/manager/team` to support both manager and HR roles
- **Back Navigation**: Added back button to evaluations page for HR dashboard navigation
- **Test Data**: Three HR managers with teams (hr1@demo.com, hr2@demo.com, hr3@demo.com)
- **Real-time My Evaluations**: Dynamic data fetching based on logged-in user ID
- **Consistent Button Styling**: Standardized text-xs, compact padding across all pages
- **Performance Cycle APIs**: Complete CRUD operations for cycle management
- **Cycle Status Enforcement**: API-level validation of read-only permissions
- **Partial Assessment Tracking**: Individual item assessments with evaluation date history
- **Visual Status Indicators**: CycleSelector and CycleStatusBanner components
- **Deadline Management System**: Role-based deadline setting, urgency tracking, HR oversight interface
- **Deadline Utilities**: Comprehensive deadline calculation and styling utilities
- **Deadline Display Components**: Reusable deadline visualization with urgency indicators
- **Company Items Badge Fix**: Active/Inactive badges now properly reflect database state after toggle operations
- **Enhanced Translation Support**: Fixed hardcoded text in company items interface

**UI/UX Improvements:**
- Language switcher made more subtle (removed prominent orange border)
- Button height consistency fixed between English/Spanish versions
- Removed redundant "My Evaluations" button from evaluations page
- Standardized button sizes between dashboard and evaluations pages
- Added proper focus states and accessibility improvements
- **Cycle Management Interface**: Dropdown actions for close/reopen operations
- **Read-Only Status Banners**: Clear visual indicators when cycles are closed
- **Real-time Status Updates**: Cycle selector refreshes automatically after operations

**Breaking Changes:**
- `okrsData` and `competenciesData` fields removed from database
- All evaluation data now in unified `evaluationItemsData` JSON field
- Export functions use new data structure
- Translation keys cleaned up (some removed)
- Navigation flow updated for HR users
- **Database schema expanded**: Added PerformanceCycle and PartialAssessment tables
- **API changes**: Evaluation endpoints now include cycle validation
- **Permission system**: New role-based cycle access controls

**Bug Fixes (Latest):**
- **Company Items Badge Issue**: Fixed Active/Inactive badges not updating after toggle operations
- **API Parameter Fix**: Added `includeInactive=true` parameter to properly fetch all company items for management
- **Translation Fix**: Replaced hardcoded "Company-Wide" text with proper translation keys
- **TypeScript Error**: Fixed incorrect field name in evaluation item assignment deletion
- **Code Quality**: Resolved ESLint errors by replacing `any` types with proper interfaces

**Performance Notes:**
- SQLite handles the scale easily (4K employees across 27 companies)
- JSON queries for evaluation data are efficient
- Mobile-optimized bundle size critical for operational workers
- TypeScript compilation is clean and fast
- Reduced redundant API calls through better data management

## GitHub Repository

**Repository:** https://github.com/ing-organizacional/performance-mgmt
**Branch:** dashboard-enhancements (currently active development branch)
**Status:** Production-ready (with security fixes)

**Commit Patterns:**
- Use descriptive commit messages
- Include security/breaking change notes
- Add co-authorship for Claude contributions:
```
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Architecture Design Decisions

**Server Actions vs REST APIs:**
The application uses **Next.js Server Actions** for user management and admin operations instead of REST API endpoints:
- ✅ **User Management**: Server Actions in `/src/lib/actions/users.ts`
- ✅ **Cycle Management**: Server Actions in `/src/lib/actions/cycles.ts`  
- ✅ **Evaluation Management**: Server Actions in `/src/lib/actions/evaluations.ts`

**Benefits of Server Actions Approach:**
- Simplified architecture (no API layer needed)
- Better type safety with TypeScript
- Built-in form handling and progressive enhancement
- Direct database operations with Prisma
- Automatic revalidation and cache management

**When APIs are Still Used:**
- External integrations (CSV import, exports)
- Client-side data fetching (evaluation forms)
- Authentication endpoints (NextAuth)
- Health checks and monitoring

**Enhancement Opportunities:**
1. **Rate Limiting**: Add rate limiting to auth endpoints
2. **Error Standardization**: Implement consistent error response format across APIs  
3. **API Documentation**: Generate OpenAPI/Swagger documentation for the 14 endpoints
4. **Monitoring**: Add application performance monitoring (APM)
5. **Caching**: Implement Redis caching for frequently accessed data

This system has a robust architecture and is production-ready with the above security fixes and optional enhancements.

## API Documentation - Performance Cycle Management

### **Cycle Management APIs**

#### **GET /api/admin/cycles**
**Purpose**: List all performance cycles for the company  
**Access**: HR only  
**Response**:
```json
{
  "success": true,
  "cycles": [
    {
      "id": "cycle_123",
      "name": "2025 Annual Review",
      "status": "active",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.999Z",
      "closedBy": null,
      "closedAt": null,
      "_count": {
        "evaluations": 125,
        "evaluationItems": 8,
        "partialAssessments": 15
      }
    }
  ]
}
```

#### **POST /api/admin/cycles**
**Purpose**: Create a new performance cycle  
**Access**: HR only  
**Payload**:
```json
{
  "name": "2025 Q2 Review",
  "startDate": "2025-04-01",
  "endDate": "2025-06-30"
}
```

#### **PUT /api/admin/cycles/[id]**
**Purpose**: Update cycle or change status (close/reopen)  
**Access**: HR only  
**Payload**:
```json
{
  "status": "closed"  // or "active" to reopen
}
```

### **Partial Assessment APIs**

#### **GET /api/partial-assessments**  
**Purpose**: Get partial assessments for analysis  
**Access**: HR and Managers  
**Query Parameters**:
- `cycleId` - Filter by performance cycle
- `employeeId` - Filter by employee
- `evaluationItemId` - Filter by specific item

#### **POST /api/partial-assessments**
**Purpose**: Create or update partial assessment  
**Access**: HR (always), Managers (only during active cycles)  
**Payload**:
```json
{
  "cycleId": "cycle_123",
  "employeeId": "user_456", 
  "evaluationItemId": "item_789",
  "rating": 4,
  "comment": "Shows strong performance in this area",
  "evaluationDate": "2025-03-15T10:00:00.000Z",
  "assessmentType": "hr_adjustment"
}
```

### **Permission Validation Function**

#### **canEditInCycle(cycleId, userId, userRole, itemType)**
**Purpose**: Core permission checking for cycle-based editing  
**Returns**:
```typescript
{
  canEdit: boolean,
  canEditPartialAssessments: boolean,
  cycleStatus: string | null,
  reason?: string
}
```

**Rules**:
- **ACTIVE cycle**: Normal editing permissions
- **CLOSED cycle**: Read-only for managers, HR can edit partial assessments
- **ARCHIVED cycle**: Read-only for everyone

### **Enhanced Evaluation APIs**

#### **POST /api/evaluations** (Updated)
**Purpose**: Create/update evaluations with cycle validation  
**Added Features**:
- Automatic cycle assignment (uses active cycle if not specified)
- Cycle permission validation before allowing edits
- Enhanced error messages for cycle restrictions

**New Payload Fields**:
```json
{
  "employeeId": "user_123",
  "evaluationItems": [...],
  "overallRating": 4,
  "overallComment": "Great performance",
  "cycleId": "cycle_456"  // Optional - uses active cycle if omitted
}
```

### **Error Handling**

**Common Error Responses**:
```json
{
  "success": false,
  "error": "Performance cycle is closed",
  "status": 403
}
```

**Permission Denied**:
```json
{
  "success": false,
  "error": "Access denied - HR role required",
  "status": 403
}
```

This API design maintains the "ridiculously simple" philosophy while providing enterprise-grade cycle management and proper access controls.

## Evaluation Deadline Management (NEW)

### **Deadline System Overview**

**Role-Based Deadline Setting:**
- **HR**: Can set deadlines for all items (company, department, manager level)
- **Managers**: Can set deadlines only for department and manager level items they create or manage
- **Employees**: Cannot set deadlines (read-only access)

**Database Schema Extensions:**
```prisma
model EvaluationItem {
  // ... existing fields
  evaluationDeadline DateTime?
  deadlineSetBy      String? // User ID who set the deadline
  deadlineSetByUser  User? @relation("DeadlineSetBy", fields: [deadlineSetBy], references: [id])
}
```

### **Deadline Features**

**Urgency Classification:**
- **Overdue**: Past the deadline date (red indicators)
- **High**: Due within 3 days (orange indicators)
- **Medium**: Due within 7 days (yellow indicators)
- **Low**: More than 7 days remaining (green indicators)

**Visual Indicators:**
- **Card Badges**: Compact deadline display on evaluation cards
- **Progress Bars**: Visual urgency representation
- **Color Coding**: Consistent urgency color scheme across interface
- **Icons**: Clock, warning, and calendar icons for different states

**HR Deadline Overview (`/dashboard/deadlines`):**
- **Filtering**: Filter by urgency level (overdue, high, medium, low)
- **View Modes**: Groups by department/manager OR flat list view
- **Statistics**: Real-time urgency counts and progress tracking
- **Department Grouping**: Organized by department and manager hierarchy
- **Audit Trail**: Shows who set deadlines and when

### **Implementation Files**

**Core Utilities:**
- `/src/lib/deadline-utils.ts` - Deadline calculation and urgency classification
- `/src/components/features/evaluation/DeadlineDisplay.tsx` - Reusable deadline visualization components

**API Enhancements:**
- `/api/evaluation-items` - Added deadline parameter support with validation
- `/api/evaluation-items/[id]` - Deadline editing with role-based permissions
- **Note**: HR oversight data is integrated into existing endpoints, no separate `/api/evaluation-items/all` endpoint

**UI Integration:**
- `/src/app/evaluate/[id]/page.tsx` - Shows deadline on evaluation cards
- `/src/app/evaluations/assignments/page.tsx` - Deadline setting forms with role checks
- `/src/app/dashboard/deadlines/page.tsx` - Comprehensive HR deadline management interface

### **Deadline Validation Rules**

**Time Constraints:**
- Minimum: 1 hour in the future (prevents immediate deadlines)
- Maximum: 2 years in the future (prevents data entry errors)
- Timezone: Handled in local browser timezone

**Permission Logic:**
```typescript
// HR can edit all deadlines
if (userRole === 'hr') return true

// Managers can edit non-company items they created or manage
if (userRole === 'manager') {
  if (item.level === 'company') return false
  return item.createdBy === userName || item.assignedTo === userId
}
```

**Audit Features:**
- Track who set each deadline (`deadlineSetBy` field)
- Role information stored for accountability
- Change history through existing audit log system

This deadline system provides enterprise-grade evaluation timeline management while maintaining the application's core simplicity principle.

## Implementation Status & Verification (2025-08-07)

**Verified API Endpoints (14 Total):**
- ✅ `/api/auth/[...nextauth]` - NextAuth v5 routes
- ✅ `/api/auth/update-last-login` - Login tracking  
- ✅ `/api/health` - Health check
- ✅ `/api/evaluations` - Evaluation management
- ✅ `/api/evaluations/[id]` - Individual evaluations
- ✅ `/api/evaluation-items` - OKR/competency items
- ✅ `/api/evaluation-items/[id]` - Individual items
- ✅ `/api/evaluation-items/assign` - Assignment management
- ✅ `/api/manager/team` - Team data access
- ✅ `/api/manager/team-assignments` - Team assignments
- ✅ `/api/partial-assessments` - Partial evaluation tracking
- ✅ `/api/admin/companies` - Company management
- ✅ `/api/admin/import` - CSV import
- ✅ `/api/admin/reset-database` - Database reset (dev only)

**Verified Component Structure:**
```
src/components/
├── features/
│   ├── cycles/                    # CycleSelector.tsx, CycleStatusBanner.tsx
│   ├── dashboard/                 # export-button.tsx, PDFExportCenter.tsx, DepartmentSelector.tsx, EmployeeSelector.tsx
│   └── evaluation/                # DeadlineDisplay.tsx
├── forms/                         # UserForm.tsx
├── layout/                        # LanguageSwitcher.tsx
├── providers/                     # auth-provider.tsx  
└── ui/                           # ConfirmDialog.tsx, LoadingSpinner.tsx, Toast.tsx, ToastContainer.tsx
```

**Server Actions Implementation:**
- ✅ User management via `/src/lib/actions/users.ts`
- ✅ Cycle management via `/src/lib/actions/cycles.ts`
- ✅ Evaluation operations via `/src/lib/actions/evaluations.ts`
- ✅ Export functionality via `/src/lib/actions/exports.ts` and `/src/lib/actions/export.ts`

## Current System Architecture & Capabilities (2025-08-07)

**Production-Ready Status:**
- ✅ **Build**: Clean TypeScript compilation, optimized bundle (99.7kB shared JS)
- ✅ **Database**: 8-table relational schema with complete audit trails
- ✅ **Authentication**: NextAuth v5 with mixed workforce support (email + PIN)
- ✅ **API**: 14 implemented endpoints with proper data validation
- ✅ **UI/UX**: Mobile-first responsive design with bilingual support
- ✅ **Performance**: SQLite handles 4K employees across 27 companies efficiently

**Core System Features:**
1. **Multi-Company Performance Management**: Complete tenant isolation with role-based access
2. **Mixed Workforce Authentication**: Office workers (email/password) + Operational workers (username/PIN)
3. **Flexible Evaluation System**: Dual support for JSON-based evaluations and structured evaluation items
4. **Performance Cycle Management**: Create, manage, and control evaluation periods with status enforcement
5. **Three-Tier Assignment System**: Company/Department/Manager level evaluation item assignments
6. **Deadline Management**: Role-based deadline setting with urgency tracking and HR oversight
7. **Partial Assessment Tracking**: Progressive evaluation data with version control and audit trails
8. **Export Functionality**: PDF and Excel export for individuals and company-wide reports
9. **Comprehensive Audit System**: Complete change tracking across all evaluation operations
10. **Bilingual Support**: Full English/Spanish localization with dynamic language switching

**Architecture Highlights:**
- **Component Architecture**: Feature-based organization with reusable UI components
- **API Design**: RESTful endpoints with proper error handling and company isolation
- **Type Safety**: Complete TypeScript coverage with proper Prisma type casting
- **Database Design**: Normalized 8-table schema supporting complex evaluation workflows
- **Security**: Company-based data isolation, bcrypt password hashing, JWT sessions
- **Mobile First**: Touch-friendly interfaces, gesture support, responsive design
- **Developer Experience**: YARN package management, hot reload, comprehensive linting

**Recent Critical Fixes (2025-08-06 - 2025-08-07):**
- ✅ **TypeScript Compilation**: Resolved all build errors with proper type casting
- ✅ **Service Layer**: Fixed evaluation-service.ts and user-service.ts type compatibility
- ✅ **Production Build**: Clean compilation with optimized static generation (26 pages)
- ✅ **Code Quality**: Zero ESLint warnings, proper error boundaries
- ✅ **User Management Enhancement**: Comprehensive UI improvements with i18n support, additional user fields (personID, userType, loginMethod, shift, PIN support)
- ✅ **Dashboard Components**: Added DepartmentSelector and EmployeeSelector for better data filtering
- ✅ **Turbopack Integration**: Enhanced development experience with faster builds (`yarn dev --turbo`)
- ✅ **Export System Refactoring**: Better organization and maintainability
- ✅ **Documentation Update**: Corrected outdated information and component paths
- ✅ **Three-Status Workflow Implementation (2025-08-07)**: Complete evaluation workflow system

## Three-Status Evaluation Workflow (IMPLEMENTED 2025-08-07)

### 🎯 RIDICULOUSLY SIMPLE Workflow: `draft` → `submitted` → `completed`

**Core Philosophy**: One-way flow with HR exception handling only

### Status Transitions
1. **draft → submitted**: Manager completes ALL items (rating + comment) and submits
2. **submitted → completed**: Employee approves the evaluation  
3. **submitted → draft**: ONLY HR can unlock for error correction (NO manager recall)

### Role Permissions
- **draft**: Manager can edit, Employee no access, HR can view
- **submitted**: Manager read-only (NO RECALL), Employee can approve, HR can unlock
- **completed**: Everyone read-only (permanent)

### ✅ Implementation Complete

#### Manager Interface Features
- **Auto-save**: 2-second delay after changes (non-blocking, asynchronous)
- **Progress Indicator**: "X of Y items completed" real-time updates
- **Submit Button**: Disabled until ALL items have rating AND comment
- **Locked After Submit**: Cannot edit or recall (must contact HR)
- **Visual Status**: Shows "Awaiting Employee Approval"
- **No Manual Save**: Single submit button only (auto-save handles drafts)

#### Employee Interface Features  
- **My Evaluations Page**: Universal access for all roles
- **Approval Notification**: Yellow banner "You have X evaluation(s) awaiting your approval"
- **One-Click Approve**: Simple approve button (no reject option)
- **Status Display**: "Awaiting Your Approval" for submitted evaluations
- **View Only**: Can view but not edit completed evaluations

#### HR Dashboard Sections
- **Overdue Drafts**: Shows drafts >7 days old with manager info
- **Pending Approvals**: Submitted evaluations with age indicators
- **Overdue Warnings**: Red highlights for approvals >3 days
- **Unlock Feature**: HR-exclusive ability to return submitted → draft
- **Quick Actions**: Direct links to view evaluations

### Server Actions in `/src/lib/actions/evaluations.ts`
```typescript
submitEvaluation(evaluationId) // Manager submits for approval
approveEvaluation(evaluationId) // Employee approves
unlockEvaluation(evaluationId) // HR unlocks (HR only)
// NO recallEvaluation - managers cannot recall!
```

### Key Implementation Details
- **Validation**: All items must have rating (1-5) AND comment (min 100 chars)
- **Auto-save**: Asynchronous, triggers on rating/comment changes
- **Audit Trail**: All status changes logged with userId and timestamp
- **TypeScript**: Clean compilation, proper type safety
- **Bilingual**: Full English/Spanish support for all new features

### Testing Guide
See `/EMPLOYEE_DIRECTORY.md` for comprehensive testing scenarios including:
- Complete evaluation flow (Ron Weasley - no current evaluation)
- Error correction via HR unlock
- Overdue scenarios (Draco Malfoy - overdue draft)
- Pending approvals (employee2@demo.com, employee3@demo.com)

### Common Pitfalls
1. **No Recall Button**: Managers CANNOT recall - only HR can unlock
2. **ALL Items Required**: Every item needs rating AND comment
3. **No Reject Option**: Employees can only approve (keeps it simple)
4. **Auto-save Delay**: 2 seconds, not instant
5. **One-Way Flow**: No backward navigation except HR unlock

### Database Status
- All 'approved' status migrated to 'completed'
- AuditLog tracks all workflow transitions
- Test data includes all status scenarios

### Files Modified
- `/src/lib/actions/evaluations.ts` - Server actions for workflow
- `/src/app/(dashboard)/evaluate/[id]/page.tsx` - Manager UI with auto-save
- `/src/app/(dashboard)/my-evaluations/MyEvaluationsClient.tsx` - Employee approval
- `/src/app/(dashboard)/dashboard/page.tsx` - HR dashboard sections
- `/src/lib/i18n.ts` - Bilingual workflow terminology
- `/src/types/database.ts` - TypeScript interfaces updated

**Implementation validated**: TypeScript clean, workflow tested, "ridiculously simple" maintained