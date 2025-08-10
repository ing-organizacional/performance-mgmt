# Performance Management System

A **secure, hybrid-design** web application for managing employee OKRs and competency evaluations across multiple companies. Features **desktop-first dashboard** for HR professionals and **mobile-first application pages** for managers and employees. Enterprise-grade security with **all critical vulnerabilities resolved** and comprehensive audit trails.

## 🎯 Overview

Enterprise performance management system handling **4000+ employees across 27 companies** with hybrid UX design:

- **Three-status evaluation workflow**: draft → submitted → completed
- **Hybrid responsive design**: Desktop-first dashboard for HR, mobile-first application pages
- **Professional component architecture** with 80%+ size reductions and single responsibility principle
- **Bilingual support** (English/Spanish) with instant language switching
- **Multi-modal authentication** (email + password / username + PIN / biometric)
- **WebAuthn/FIDO2 biometric authentication** (Face ID, Touch ID, Fingerprint)
- **Enterprise SSO ready** (Microsoft Active Directory & Google Workspace) - [📋 Integration Guide](SSO_INTEGRATION.md)
- **Performance cycle management** with read-only enforcement during closed periods
- **Server Actions architecture** for improved type safety and performance
- **Complete audit trails** and multi-company data isolation

## 🚀 Quick Start (Secure & Updated)

```bash
# Install dependencies (all security-updated)
yarn install

# Set up database
yarn db:push && yarn db:seed

# Start development server
yarn dev

# Verify security (optional)
yarn tsc --noEmit && yarn lint
```

## 🏗️ Tech Stack

**Frontend & Backend:**

- **Next.js 15.4.5** (App Router + TypeScript 5.9.2)
- **Tailwind CSS 4.0** + React 19.1.0
- **NextAuth v5.0.0-beta.29** (JWT strategy)
- **Node.js 22.18.0** + Yarn 4.9.2 (Berry)
- **Zod 4.0.15** validation + **@types/node 22.17.1**

**Database:**

- SQLite with Prisma ORM 6.13.0
- **9-table relational schema** with complete audit trails
- Unified evaluation system with JSON data storage
- Performance cycle management with status enforcement
- BiometricCredential table for WebAuthn/FIDO2 authentication

**Deployment:**

- Docker containerization ready
- Windows Server compatible
- Rate limiting and security headers implemented

## 📱 Key Features

### Authentication & Security

- **Multi-modal Authentication**: Email/password, username/PIN, biometric (WebAuthn/FIDO2)
- **Enterprise SSO Support**: Microsoft Active Directory & Google Workspace integration
- **Role-based Access Control**: HR, Manager, Employee permissions
- **Company Data Isolation**: Complete multi-tenant architecture  
- **Audit Logging**: Every action tracked with user, timestamp, and changes
- **Bilingual Interface**: Complete English/Spanish translation with instant language switching

#### Enterprise SSO Features

- **Microsoft Azure AD/Entra ID**: Corporate directory integration with group-based role mapping
- **Google Workspace**: GSuite integration with domain restrictions
- **Hybrid Authentication**: SSO + traditional methods for mixed environments
- **Automatic Provisioning**: New employees get immediate access via corporate directory
- **Centralized Deactivation**: Terminated employees immediately lose access
- **📋 [Complete SSO Integration Guide](SSO_INTEGRATION.md)**: Comprehensive implementation plan

### Evaluation Management

- **3-Status Workflow**: Draft evaluations → Manager submits → Employee approves
- **Auto-save Functionality**: Real-time draft saving with 2-second delay
- **Flexible Item System**: OKRs and competencies with company/department/manager assignment
- **Deadline Management**: Configurable evaluation deadlines with notifications

### Performance Cycles

- **Cycle Status Control**: Active (editable) → Closed (read-only) → Archived
- **Read-only Enforcement**: Prevents evaluation changes during closed periods
- **HR Management**: Create, close, reopen cycles with complete control
- **Visual Indicators**: Clear status banners and notifications

### Hybrid UX Design System

- **Dashboard Pages**: Desktop-first with professional gradient backgrounds and enhanced visual hierarchy
- **Application Pages**: Mobile-first with touch-optimized interactions for field use
- **Touch Optimized**: 44px minimum touch targets throughout all pages
- **Progressive Disclosure**: One decision per screen approach
- **Component Architecture**: Single responsibility principle with custom hooks for business logic
- **Responsive Design**: Seamless experience across all device sizes

### Internationalization

- **Bilingual Support**: Complete English/Spanish translation
- **Instant Switching**: Language toggle without page reload
- **Cultural Adaptation**: Date formats, number formats, currency

### Export & Reporting

- **Multiple Formats**: PDF individual reports, Excel team summaries
- **Role-based Access**: Filtered data based on user permissions
- **Performance Analytics**: Rating distributions and trends
- **Audit Reports**: Complete change tracking and compliance

### CSV Import & Data Management

- **Manual CSV Import**: Multi-step workflow with preview and validation
- **Scheduled Imports**: Automated imports from external systems (HRIS, APIs, URLs)
- **Enterprise Features**: Upsert operations, audit logging, rollback capability
- **Data Sources**: Support for URL/HTTP, REST APIs, SFTP (coming soon)
- **Preview Mode**: Review all changes before execution
- **Error Recovery**: Detailed validation with selective fixes
- **Notification System**: Email alerts for import success/failure

## 🔒 Security Features

- **WebAuthn/FIDO2**: Face ID, Touch ID, Fingerprint authentication
- **Password Security**: bcryptjs hashing with 12 salt rounds
- **Session Management**: JWT tokens with 24-hour expiration
- **Rate Limiting**: Brute force protection on sensitive endpoints
- **Input Validation**: Comprehensive Zod 4.0.15 schema validation
- **Security Headers**: CSP, X-Frame-Options, CSRF protection
- **Dependency Security**: All dependencies updated and vulnerability-free
- **HTTPS Ready**: SSL/TLS encryption support

## 📊 Database Schema

**10 Core Tables:**

- `Company` - Multi-tenant root with isolation
- `User` - Employee data with role hierarchy
- `Evaluation` - Performance evaluation records
- `EvaluationItem` - OKR/Competency definitions (company/department levels only)
- `EvaluationItemAssignment` - Individual assignments
- `PerformanceCycle` - Time-based evaluation periods
- `PartialAssessment` - Granular rating tracking
- `AuditLog` - Complete change history
- `BiometricCredential` - WebAuthn credential storage
- `ScheduledImport` - Automated CSV import configuration

## 🚀 Getting Started

### Prerequisites

- **Node.js 22.18.0** or higher (REQUIRED - verified compatible)
- **Yarn 4.9.2 (Berry)** package manager (never use npm)
- Modern browser with WebAuthn support (for biometric auth)
- **TypeScript 5.9.2** for development (auto-installed)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd performance-mgmt

# Install dependencies with Yarn Berry
yarn install

# Generate Prisma client
yarn db:generate

# Initialize database
yarn db:push

# Seed with demo data
yarn db:seed

# Start development server
yarn dev
```

### Environment Setup

Create `.env.local`:

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Development Commands

- `yarn dev` - Start development server with Turbo mode
- `yarn build` - Production build
- `yarn start` - Start production server
- `yarn db:studio` - Open Prisma Studio database editor
- `yarn db:reset` - Reset database and reseed
- `yarn lint` - Run ESLint
- `yarn tsc --noEmit` - Type checking

## 🧪 Demo Data

The seed script creates comprehensive demo data:

**Companies:**

- DEMO S.A. (40 employees across 5 departments)

**User Roles:**

- HR Director (super admin)
- Department Managers (5 managers)
- Employees (33 staff members)
- Operational Workers (PIN-only authentication)

**Evaluation Items:**

- Company-wide OKRs and competencies
- Department-specific goals
- Manager-assigned objectives

## 🎨 UX/UI Design System

### Hybrid Design Approach

**Dashboard Pages (`/dashboard/*`):**

- Desktop-first professional interface for HR users
- Gradient backgrounds with backdrop blur effects
- Enhanced visual hierarchy with glass morphism design
- Professional statistics cards and modal patterns
- Optimized for data analysis and administrative tasks

**Application Pages (`/evaluations`, `/users`, `/settings`):**

- Mobile-first touch-optimized interface for field use
- Clean, simple interfaces prioritizing usability
- Touch-friendly interactions with 44px minimum targets
- Progressive disclosure for focused task completion
- Optimized for managers and employees on mobile devices

**Universal Standards:**

- 44px minimum touch targets on all pages
- Comprehensive bilingual support (English/Spanish)
- Single responsibility component architecture
- Consistent modal patterns and user interactions

## 🌐 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t performance-mgmt .

# Run container
docker run -p 3000:3000 performance-mgmt
```

### Production Environment

**Recent UX/UI Achievements (August 2025):**

- ✅ **Dashboard Transformation**: Professional desktop-first interface with gradient backgrounds
- ✅ **Component Architecture**: 80-87% size reductions through focused component extraction  
- ✅ **Bilingual Enhancement**: Comprehensive translation support across all new components
- ✅ **Design System Clarity**: Dashboard = desktop-first, Application = mobile-first
- ✅ **Touch Target Compliance**: 100% adherence to 44px minimum across all pages

**Environment Variables:**

```bash
DATABASE_URL="file:./data/production.db"
NEXTAUTH_SECRET="[32-byte-cryptographic-secret]"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

**Security Checklist:**

- [ ] Configure HTTPS/SSL certificates
- [x] Set up rate limiting (IMPLEMENTED)
- [x] Enable security headers (CSP, X-Frame-Options implemented)
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Remove demo seed data
- [x] Update dependencies (ALL COMPLETED - August 9, 2025)
- [x] Fix security vulnerabilities (CRITICAL ISSUES RESOLVED)

## 🧑‍💻 Development

### Architecture

- **Server Actions**: Primary data mutations (preferred over API routes)
- **Next.js App Router**: File-based routing with layouts
- **TypeScript**: Full type safety throughout
- **Prisma**: Type-safe database operations
- **Tailwind CSS**: Utility-first styling

### Code Organization

```text
src/
├── app/                 # Next.js App Router pages
│   ├── (dashboard)/     # Dashboard routes with shared layout
│   │   ├── components/  # Focused UI components
│   │   └── hooks/       # Custom business logic hooks
│   └── (admin)/         # Admin routes with specialized components
├── components/          # Reusable React components
├── lib/                 # Business logic and utilities
│   ├── actions/         # Server Actions (preferred architecture)
│   │   └── evaluations/ # Modular evaluation system
│   ├── translations/    # Bilingual translation system
│   ├── services/        # Business services
│   └── utils/           # Helper functions
├── hooks/               # Global custom React hooks
└── types/               # TypeScript type definitions
```

### Component Architecture Excellence

**Major Refactoring Completed (August 2025):**

- **80-87% size reduction** in main components through focused component extraction
- **Single responsibility principle** applied throughout
- **Reusable modal components** for consistent UX patterns
- **Custom hooks** for business logic separation
- **Hybrid UX design**: Desktop-first dashboard, mobile-first application pages

**Examples of Improved Architecture:**

**Dashboard Module Refactoring (Desktop-First):**

```typescript
// DepartmentRatingsClient: 538 → 80 lines (85% reduction)
- DepartmentRatingCard.tsx (285 lines) - Main functionality
- RatingsHeader.tsx (47 lines) - Desktop navigation with export
- OverviewSection.tsx (65 lines) - Performance insights
- useDepartmentRatings.ts (25 lines) - Business logic hook

// PendingEvaluationsClient: Complete desktop-first redesign
- Professional gradient backgrounds with backdrop blur
- Enhanced employee cards with avatar integration
- 11 new bilingual translation keys
```

**Application Module Refactoring (Mobile-First Maintained):**
```typescript
// UsersClient: 856 → 115 lines (87% reduction)
- UsersHeader.tsx - Mobile-optimized navigation
- UsersList.tsx - Touch-friendly user cards
- UserFormModal.tsx - Mobile-first form design
- useUsers.ts - Complete state management
```

### Contributing Guidelines

- Use Server Actions for data mutations (preferred over API routes)
- Maintain company-based data isolation
- Follow TypeScript strict mode with comprehensive type safety
- **Apply mobile-first design** for application pages (evaluations, users, settings)
- **Apply desktop-first design** ONLY for dashboard pages (/dashboard/*)
- **Ensure 44px minimum touch targets** on all pages regardless of design approach
- Update bilingual translations (English/Spanish) for all new features
- Maintain audit trails for changes and user actions
- Apply single responsibility principle - extract components when exceeding 200 lines
- Use custom hooks for business logic separation
- **Dashboard pages**: Implement gradient backgrounds and glass morphism effects
- **Application pages**: Maintain clean, simple mobile-first interfaces

## 🔍 Testing

### Manual Testing

1. **Authentication Flow**
   - Test email/password login
   - Test username/PIN login
   - Test biometric authentication (on supported devices)

2. **Evaluation Workflow**
   - Create draft evaluation
   - Submit as manager
   - Approve as employee
   - Unlock as HR (if needed)

3. **Performance Cycles**
   - Create new cycle
   - Close cycle (read-only enforcement)
   - Reopen cycle

4. **Multi-company Isolation**
   - Verify data separation between companies
   - Test role-based access controls

### Browser Compatibility

- **WebAuthn Support**: Chrome 67+, Firefox 60+, Safari 14+, Edge 18+
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Desktop**: All modern browsers with JavaScript enabled

## 📖 API Documentation

### Server Actions (Preferred)

- `evaluations.ts` - Evaluation workflow management
- `users.ts` - User CRUD operations
- `cycles.ts` - Performance cycle management
- `team.ts` - Team data with 5-minute caching
- `biometric.ts` - WebAuthn credential management
- `csv-import.ts` - Enterprise CSV import with preview/execute
- `scheduled-import.ts` - Automated import scheduling
- `admin.ts` - Admin operations (database reset via Server Actions)

### REST API Endpoints (Minimal)

- `GET /api/health` - System health check
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `POST /api/auth/update-last-login` - Login timestamp tracking
- `GET/PUT /api/evaluation-items` - Evaluation item management (2 endpoints)

## 📚 Additional Documentation

- **[📋 SSO Integration Guide](SSO_INTEGRATION.md)** - Comprehensive Microsoft Active Directory & Google Workspace integration
- **[📖 Versioning Guidelines](VERSIONING.md)** - Semantic versioning and release management
- **[🔒 Security Documentation](SECURITY.md)** - Security features, compliance, and risk assessment
- **[🚀 Deployment Guide](DEPLOYMENT.md)** - Production deployment with Docker and security hardening
- **[👥 User Management Guide](USER_MANAGEMENT.md)** - Managing users via Prisma Studio, CSV import, and Server Actions
- **[🔍 API Audit](API_AUDIT.md)** - Complete audit of API endpoints and Server Actions migration

## 🤝 Support

For issues and questions:

- Check existing documentation above
- Review demo data and test workflows
- Submit issues with detailed reproduction steps
- Include browser/device information for UI issues

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📥 Enterprise CSV Import System

### Overview

The **Enterprise CSV Import System** provides comprehensive data management capabilities for HR teams to efficiently manage employee data with enterprise-grade features including preview, validation, upsert operations, audit logging, and automated scheduling.

### Manual CSV Import Features

**Multi-Step Workflow:**

1. **Upload & Validation** - Drag & drop CSV files with instant validation
2. **Preview Changes** - Review all create/update operations before execution
3. **Configuration** - Choose update strategies and validation rules
4. **Execution** - Process imports with detailed progress tracking
5. **Completion** - View results with rollback options

**Enterprise Capabilities:**

- **Upsert Operations**: Create new users and update existing ones intelligently
- **Preview Mode**: See exactly what changes will be made before committing
- **Selective Updates**: Choose which fields to update for existing users
- **Error Recovery**: Detailed validation with actionable error messages
- **Audit Logging**: Complete tracking of who imported what and when
- **Rollback Support**: Undo imports if needed with full change history

**Data Validation:**

- Required fields validation (name, email/username, role)
- Email format and uniqueness checking
- Role validation against system roles
- Manager relationship validation
- Company code and department validation
- Employee ID and Person ID uniqueness

### Scheduled Imports

**Automated Data Sync:**

- **Multiple Data Sources**: URL/HTTP endpoints, REST APIs, SFTP servers
- **Flexible Scheduling**: Daily, weekly, monthly with timezone support
- **Authentication Support**: Basic Auth, Bearer tokens, API keys
- **Notification System**: Email alerts for success/failure status
- **Error Handling**: Automatic retry and detailed error reporting

**Configuration Options:**

```typescript
{
  name: "Daily HRIS Sync",
  schedule: {
    frequency: "daily",
    time: "09:00",
    timezone: "America/New_York"
  },
  source: {
    type: "url",
    url: "https://hris.company.com/employees.csv",
    credentials: {
      apiKey: "your-api-key"
    }
  },
  importOptions: {
    updateExisting: true,
    createNew: true,
    notificationEmails: ["hr@company.com"]
  }
}
```

### Usage Guide

#### Manual Import Process

1. **Access the Import System**
   ```
   Navigate to: /users/advanced → Manual Import tab
   ```

2. **Upload CSV File**
   - Drag & drop or click to select CSV file
   - System validates format and required columns
   - View any validation errors immediately

3. **Preview Changes**
   - Review all users to be created (green rows)
   - Review all users to be updated (blue rows)
   - See validation errors for problematic rows (red rows)
   - Verify manager relationships and department assignments

4. **Configure Import Options**
   - Choose whether to update existing users
   - Choose whether to create new users
   - Select which fields to update for existing users
   - Set password requirements for new users

5. **Execute Import**
   - Click "Execute Import" to process changes
   - Monitor progress with detailed status updates
   - Review final results with creation/update counts

6. **Post-Import Actions**
   - View import history and audit logs
   - Use rollback feature if changes need to be undone
   - Export results for documentation

#### Scheduled Import Setup

1. **Create New Schedule**
   ```
   Navigate to: /users/advanced → Scheduled Imports tab → Create Schedule
   ```

2. **Basic Configuration**
   - **Name**: "Daily HRIS Sync"
   - **Description**: Optional description for the import
   - **Schedule**: Set frequency, time, and timezone

3. **Data Source Setup**
   - **URL Source**: Direct HTTP/HTTPS endpoints
   - **API Source**: REST APIs with JSON-to-CSV conversion
   - **SFTP Source**: Secure file transfer (coming soon)
   - **Authentication**: Username/password, API keys, bearer tokens

4. **Import Options**
   - Configure same upsert options as manual imports
   - Set up email notifications for success/failure
   - Choose validation levels and error handling

5. **Activation & Monitoring**
   - Enable the scheduled import
   - Monitor execution history and status
   - Receive email notifications for each run
   - View detailed logs and error reports

### CSV Format Requirements

**Required Columns:**
```csv
name,email,role,department,position
```

**Complete Format Example:**
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,companyCode,position,shift,password
John Doe,john@company.com,johndoe,employee,Engineering,office,EMP001,ID123456,MGR789,EMP100,COMP01,Software Engineer,Day,temporaryPass123
Jane Smith,jane@company.com,janesmith,manager,Engineering,office,EMP100,ID789012,,,,Engineering Manager,Day,temporaryPass456
```

**Optional Fields:**
- `username` - For PIN-based authentication users
- `employeeId` - Company employee number
- `personID` - National ID number
- `managerPersonID` - Manager's national ID for relationship mapping
- `managerEmployeeId` - Manager's employee ID for relationship mapping
- `companyCode` - Company identifier (defaults to user's company)
- `position` - Job title
- `shift` - Work shift information
- `password` - Temporary password (auto-generated if not provided)

### Technical Implementation

#### Server Actions

**Manual Import Actions:**
```typescript
// Preview import before execution
const preview = await previewCSVImport(formData, options)

// Execute the actual import
const result = await executeCSVImport(formData, options)

// View import history
const history = await getImportHistory()

// Rollback a previous import
const rollback = await rollbackImport(importId)
```

**Scheduled Import Actions:**
```typescript
// Create new scheduled import
const schedule = await createScheduledImport(config)

// Update existing schedule
const updated = await updateScheduledImport(id, changes)

// Execute schedule manually
const result = await executeScheduledImport(id)

// Get all schedules
const schedules = await getScheduledImports()
```

#### Database Schema

**ScheduledImport Table:**
```sql
CREATE TABLE ScheduledImport (
  id           TEXT PRIMARY KEY,
  companyId    TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  enabled      BOOLEAN DEFAULT true,
  schedule     JSON NOT NULL,  -- {frequency, time, timezone}
  source       JSON NOT NULL,  -- {type, url, credentials}
  importOptions JSON NOT NULL, -- {updateExisting, createNew, notifications}
  lastRun      DATETIME,
  nextRun      DATETIME,
  status       TEXT DEFAULT 'active',
  errorMessage TEXT,
  createdBy    TEXT NOT NULL,
  createdAt    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Security & Compliance

**Data Protection:**

- All imports are company-isolated (multi-tenant safe)
- Credentials stored securely with encryption
- Audit logs track all import activities
- Role-based access (HR only)

**Validation & Safety:**

- Comprehensive input validation with Zod schemas
- Preview-first approach prevents accidental data corruption
- Rollback capability for error recovery
- Rate limiting on API endpoints

**Monitoring & Alerts:**

- Email notifications for scheduled import status
- Detailed error reporting and logging
- Import history with searchable audit trails
- Performance metrics and execution tracking

### Best Practices

**CSV File Preparation:**

- Use UTF-8 encoding to support international characters
- Include header row with exact column names
- Validate data before upload (email formats, required fields)
- Test with small batches before large imports

**Scheduled Import Setup:**

- Start with manual testing before scheduling
- Use appropriate scheduling frequency (avoid overloading systems)
- Set up monitoring notifications
- Regularly review import logs and performance

**Data Management:**

- Regular backups before large imports
- Use preview mode for all significant changes
- Document import schedules and data sources
- Monitor for data quality issues

---

## Built with ❤️ for enterprise performance management
