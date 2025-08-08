# Performance Management System

A mobile-first web application for managing employee OKRs and competency evaluations across multiple companies. Designed for mixed workforce environments (office workers + operational workers).

## 🎯 Overview

Enterprise performance management system handling **4000+ employees across 27 companies** with:
- **Three-status evaluation workflow**: draft → submitted → completed
- **Mobile-first responsive design** optimized for managers and HR
- **Bilingual support** (English/Spanish) with instant language switching
- **Mixed workforce authentication** (email + password / username + PIN)
- **Performance cycle management** with read-only enforcement during closed periods
- **Server Actions architecture** for improved type safety and performance
- **Complete audit trails** and multi-company data isolation

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Set up database
yarn db:push && yarn db:seed

# Start development server
yarn dev
```

Visit http://localhost:3000 and use demo credentials:
- **HR**: hr@demo.com / password123 (admin + team management)
- **Manager**: manager@demo.com / password123 (team evaluations)
- **Employee**: employee1@demo.com / password123 (view evaluations)
- **Operational Worker**: worker1 / 1234 (PIN login)

## 🏗️ Tech Stack

**Frontend & Backend:**
- Next.js 15.4.5 (App Router + TypeScript)
- Tailwind CSS 4.0 + React 19.1.0
- NextAuth v5.0.0-beta.29 (JWT strategy)

**Database:**
- SQLite with Prisma ORM 6.13.0
- 8-table relational schema with complete audit trails
- Unified evaluation system with JSON data storage
- Performance cycle management with status enforcement

**Deployment:**
- Docker containerization ready
- Windows Server compatible
- Node.js runtime

## 📱 Key Features

### 🌐 Bilingual Interface (NEW!)
- **English/Spanish Support**: Complete translations for all interfaces
- **Instant Language Switching**: 🇺🇸/🇪🇸 toggle button in all pages  
- **Persistent Preference**: Language choice saved across sessions
- **Professional UX**: Native-language experience for bilingual workforces
- **Complete Coverage**: All text, forms, evaluations, and analytics translated

### Mobile-First Evaluation Interface
- **Progressive disclosure**: One decision per screen with fixed item card
- **Star rating system**: Intuitive 1-5 scale with auto-focus on comments
- **Unified evaluation**: OKRs (🎯) and Competencies (⭐) in single flow
- **Three-tier system**: Company/Department/Manager level items
- **Auto-save**: No data loss during evaluations
- **Thumb-friendly**: Minimum 44px touch targets
- **Universal access**: Works for HR, managers, and employees

### Three-Status Evaluation Workflow
**Simple and Effective:**
1. **`draft`** → Manager creates evaluation with ratings and comments (auto-save enabled)
2. **`submitted`** → Manager submits completed evaluation → becomes read-only for manager
3. **`completed`** → Employee approves the evaluation → final status

**Key Features:**
- **Auto-save**: 2-second delay prevents data loss during evaluation creation
- **Complete validation**: All items must have both rating (1-5) and comment before submission
- **Manager lock-out**: Cannot edit or recall after submission (contact HR to unlock)
- **Employee approval**: Simple one-click approval process
- **HR oversight**: Dashboard tracks overdue drafts and pending approvals
- **Error correction**: HR can unlock submitted evaluations back to draft status

### HR Team Management (NEW!)
- **Dual-role support**: HR users can both manage teams and access admin functions
- **Team evaluations**: HR managers have their own direct reports to evaluate
- **Seamless navigation**: Dashboard ↔ Evaluations ↔ My Evaluations workflow
- **Real-time data**: Dynamic team summaries and completion tracking
- **Back navigation**: Easy return to dashboard from evaluation views

### Performance Cycle Management (NEW!)
- **Annual/Quarterly Cycles**: Create performance review periods with defined start/end dates
- **Status Control**: Active → Closed → Archived workflow with automatic enforcement
- **Read-Only Enforcement**: Managers cannot edit when cycles are closed
- **Partial Assessments**: HR can make individual item ratings with custom evaluation dates
- **Visual Indicators**: Clear status banners and cycle selectors throughout the UI
- **Audit Trail**: Complete tracking of cycle operations and status changes

### Multi-Company Architecture
- **Data isolation**: Complete separation between companies
- **Scalable**: Handles 4000+ employees efficiently
- **Audit trail**: Complete change tracking
- **Role-based access**: HR, Manager, Employee permissions

### User Management (3 Methods)
1. **Visual Interface**: `yarn db:studio`
2. **CSV Import**: `yarn db:import users.csv`
3. **Server Actions**: `/src/lib/actions/users.ts`

## 📊 Database Schema

```sql
-- Companies: Multi-tenant isolation
Company { id, name, code, active }

-- Users: Mixed workforce with HRIS integration identifiers
User { 
  id, companyId, name, email?, username?, role,
  passwordHash, pinCode?, userType, managerId,
  employeeId?, personID?, department?, shift?
}

-- Traditional Evaluations: JSON-based evaluation data with cycle association
Evaluation {
  id, employeeId, managerId, companyId, cycleId?,
  evaluationItemsData, overallRating,
  status, periodType, periodDate
  -- status: "draft" | "submitted" | "completed"
}

-- Structured Evaluation Items: Individual OKR/Competency definitions
EvaluationItem {
  id, companyId, cycleId?, title, description,
  type, level, createdBy, assignedTo?, active, sortOrder
}

-- Individual Item Assignments: Employee-specific item assignments
EvaluationItemAssignment {
  id, evaluationItemId, employeeId, assignedBy, companyId
}

-- Performance Cycles: Annual/quarterly review periods with status management
PerformanceCycle {
  id, companyId, name, startDate, endDate,
  status, closedBy?, closedAt?
}

-- Partial Assessments: Granular item tracking with evaluation date history
PartialAssessment {
  id, cycleId, employeeId, evaluationItemId,
  rating?, comment?, assessedBy, assessedAt,
  evaluationDate, assessmentType, isActive, companyId
}

-- AuditLog: Complete change tracking
AuditLog { id, evaluationId, userId, action, oldData, newData }
```

## 🔧 Development Commands

```bash
# Database
yarn db:studio              # Visual database editor
yarn db:seed                # Add demo data
yarn db:import users.csv    # Import users from CSV
yarn db:reset               # Reset database + seed
yarn db:generate            # Generate Prisma client
yarn db:push                # Push schema changes

# Development
yarn dev                    # Start dev server
yarn build                 # Production build
yarn start                 # Production server (dev/test only)
# For production with standalone output, use:
node .next/standalone/server.js
yarn lint                  # Code linting
```

## 👥 User Management

### 🔑 Employee Identification Keys

The system uses multiple keys to identify employees:

**🎯 Primary Business Key:**
- **`personID`** - National ID (Cédula, DNI, Social Security) - **REQUIRED**
  - Most reliable identifier (never changes)
  - Used for manager assignment and duplicate detection
  - Example: `12345678`

**🏢 Company Keys:**
- **`employeeId`** - Company-assigned employee number (Optional)
  - Examples: `EMP001`, `MGR001`, `HR001`
  - Used for reporting and alternative manager assignment
  - May change with reorganization

**🔐 Authentication Keys:**
- **`email`** - For office workers (login identifier)
  - Example: `john.doe@company.com`
- **`username`** - For operational workers (login identifier)
  - Example: `john_worker`, `station_01`

**🎯 Key Hierarchy (Most to Least Reliable):**
1. `personID` - National ID (preferred for all operations)
2. `employeeId` - Company ID (good for internal references)
3. `email` - Can change when employees move
4. `username` - For operational workers only

### CSV Import Format
```csv
name,email,username,role,department,userType,password,employeeId,personID,managerPersonID,managerEmployeeId,companyCode
Michael Chen,michael.chen@demo.com,,manager,Engineering,office,password123,MGR001,87654321,,,DEMO_001
John Smith,john@company.com,,employee,Sales,office,password123,EMP001,12345678,87654321,,DEMO_001
Maria Worker,,maria.worker,employee,Manufacturing,operational,1234,EMP002,23456789,,MGR001,DEMO_001
```

**📋 Required Fields:**
- **`name`** - Full employee name (required)
- **`personID`** - National ID/Cédula (required) - **Primary business key**
- **`role`** - employee, manager, or hr (required) 
- Either **`email`** OR **`username`** (at least one required for authentication)

**👤 Manager Assignment (choose one method):**
- **`managerPersonID`** - Manager's National ID (**PREFERRED** - most reliable)
- **`managerEmployeeId`** - Manager's Employee ID (alternative method)

**🏢 Optional HRIS Integration Fields:**
- `employeeId` - Company-assigned ID (EMP001, MGR001) for HRIS integration
- `department` - Department/team name
- `userType` - office (default) or operational
- `companyCode` - Company identifier (defaults to current user's company)

**📝 CSV Template Files:**
- **`/public/user-import-template.csv`** - Clean import template
- **`/public/user-import-instructions.md`** - Comprehensive import guide

**💡 Best Practices:**
- Always use `personID` as the primary identifier
- Use `managerPersonID` for manager assignment (more reliable than employeeId)
- Ensure PersonIDs are unique across your organization
- Keep a backup mapping of PersonID to EmployeeID for reference

### Server Actions Examples
```typescript
// User management via Server Actions (not REST APIs)
import { createUser, updateUser, deleteUser } from '@/lib/actions/users'

// Create user
const newUser = await createUser({
  name: "New User",
  email: "new@demo.com", 
  role: "employee",
  companyId: "company-id"
})

// Update user  
const updatedUser = await updateUser("user-id", {
  department: "New Department"
})

// Delete user
await deleteUser("user-id")
```

### Implementation Architecture
**Server Actions (Preferred):**
- Evaluation workflow uses Next.js Server Actions for form submissions
- Better type safety and progressive enhancement
- Located in `/src/lib/actions/` directory

**Available REST APIs (Legacy/Integration):**
```bash
# Import users from CSV
curl -X POST http://localhost:3000/api/admin/import \
  -H "Content-Type: application/json" \
  -d '{"users": [{"name":"User","email":"user@demo.com"}]}'

# Get company data
curl http://localhost:3000/api/admin/companies
```

## 🔐 Authentication

**Mixed Workforce Support:**
- **Office Workers**: Standard email/password authentication
- **Operational Workers**: Simple username/PIN for non-email users
- **HR Management**: Complete control over user accounts
- **No AD Dependency**: Works independently (optional AD sync available)

## 📈 Performance & Scale

**Optimized for Enterprise:**
- **SQLite Performance**: Handles 4K employees + 16K evaluations/year efficiently
- **Mobile Optimization**: <1MB bundle size for operational workers
- **Real-time Updates**: Instant completion tracking and analytics
- **Company Isolation**: Zero data leakage between companies

## 🐳 Deployment

### Docker Deployment (Recommended for unRAID)

**Build and Run:**
```bash
# Build container
docker build -t performance-mgmt .

# Run with volume persistence
docker run -p 3000:3000 \
  -v /mnt/user/appdata/performance-mgmt:/app/data \
  -e NEXTAUTH_URL=http://your-server-ip:3000 \
  -e NEXTAUTH_SECRET=your-secure-secret \
  performance-mgmt
```

**🚀 Initial Setup in Docker:**
```bash
# 1. Start container and populate database
docker exec -it <container-name> npx tsx src/lib/seed-comprehensive.ts

# 2. Login with demo credentials:
#    HR: hr@demo.com / password123
#    Manager: manager@demo.com / password123
#    Employee: employee1@demo.com / password123

# 3. Access CSV import templates
docker exec -it <container-name> cp /app/public/user-import-template.csv /app/data/
docker exec -it <container-name> cp /app/public/user-import-instructions.md /app/data/
```

**📊 CSV Import in Docker:**
1. Copy template files from container to host system
2. Fill out CSV with your employee data following the template
3. Login as HR → Users → Advanced → Upload CSV
4. Review import results and fix any errors

**Docker Configuration:**
- **Port**: `3000:3000`
- **Volume**: `/your/data/path:/app/data` (for SQLite persistence)
- **Environment**:
  - `NEXTAUTH_URL` - Your server URL
  - `NEXTAUTH_SECRET` - Secure secret key
  - `DATABASE_URL` - Auto-configured to `/app/data/production.db`

**Windows Server Deployment:**
- Node.js runtime
- IIS with iisnode or standalone
- File-based SQLite database
- Simple backup (copy database file)

## 📚 Documentation

- `CLAUDE.md` - Development guidance for Claude Code
- `USER_MANAGEMENT.md` - Complete user management guide
- `example-users.csv` - CSV import template

## 🎯 Use Cases

**Perfect for:**
- Manufacturing companies with mixed office/floor workers
- Bilingual organizations (English/Spanish speaking workforces)
- Multi-location organizations needing unified performance tracking
- Companies requiring mobile-first manager experience
- Organizations with 100-5000 employees across multiple entities
- Businesses needing simple, audit-compliant performance management

**Key Benefits:**
- ⚡ **5-minute evaluation** per employee on mobile
- 🌐 **Bilingual support** for English/Spanish workforces
- 📊 **Real-time completion tracking** for HR
- 🔒 **Complete data isolation** between companies
- 📱 **Works offline** for operational environments
- 🚀 **Enterprise scale** with consumer simplicity
- 🔄 **Performance cycle control** with read-only enforcement
- 📝 **Partial assessment flexibility** for HR corrections

## 🔒 Security Status

**Current Status**: ✅ **Production Ready** (with security configuration)

**Recently Completed (August 2025):**
- ✅ **Three-status evaluation workflow** implemented and tested
- ✅ **Enhanced evaluation UX** with improved styling and bilingual support
- ✅ **Comprehensive evaluation locking** for submitted evaluations
- ✅ **Build system stability** - Clean TypeScript compilation and ESLint passes
- ✅ **Server Actions architecture** reduces API surface and improves type safety
- ✅ **Mobile-first responsive design** with bilingual support
- ✅ **Performance cycle management** with read-only enforcement
- ✅ **Complete audit trails** for all evaluation operations

**Pre-Production Requirements:**
1. **Change default secrets**: Generate secure `NEXTAUTH_SECRET` with `openssl rand -base64 32`
2. **Review admin endpoints**: Ensure proper role-based access control for `/api/admin/*`
3. **Environment configuration**: Remove demo credentials from production deployment

**Security Features:**
- ✅ Password hashing with bcryptjs (12 salt rounds)
- ✅ NextAuth v5 JWT authentication
- ✅ Company-based data isolation
- ✅ Complete audit logging
- ✅ Input validation and sanitization
- ✅ Non-root Docker container
- ✅ Clean TypeScript compilation
- ✅ Proper type safety throughout

**Production Checklist:**
- [ ] Generate secure `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- [ ] Add role-based access control middleware
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up database backups
- [ ] Enable security headers

See `CLAUDE.md` for detailed security audit findings and fixes.

## 🎯 System Architecture

**Deployment Grade**: B+ (Good with Security Fixes)

Built for HR managers who need ridiculously simple performance management that actually works.
