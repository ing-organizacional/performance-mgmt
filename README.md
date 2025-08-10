# Performance Management System

Enterprise web application managing employee evaluations across **4000+ employees in 27 companies**. Features **hybrid responsive design**: desktop-first dashboards for HR, mobile-first applications for field use.

## 🎯 Overview

**Production-ready enterprise system** with hybrid UX architecture:

- **Three-status workflow**: draft → submitted → completed
- **Multi-modal authentication**: email/password, username/PIN, biometric (WebAuthn/FIDO2)
- **Enterprise SSO integration**: Microsoft Active Directory & Google Workspace
- **Bilingual support**: Complete English/Spanish translation with instant switching
- **Comprehensive audit trails**: All actions tracked with multi-company data isolation
- **Performance cycle management**: Read-only enforcement during closed periods

## 🚀 Quick Start

```bash
yarn install              # Install dependencies
yarn db:push && yarn db:seed  # Set up database with demo data
yarn dev                  # Start development server
yarn lint && yarn tsc --noEmit  # Verify code quality
```

## 🏗️ Tech Stack

- **Next.js 15.4.5** + App Router + TypeScript 5.9.2
- **React 19.1.0** + Tailwind CSS 4.0
- **NextAuth v5.0.0-beta.29** (JWT authentication)
- **Prisma ORM 6.13.0** + SQLite (10-table schema)
- **Node.js 22.18.0** + Yarn 4.9.2 (Berry)
- **Server Actions architecture** for type safety
- **WebAuthn/FIDO2** biometric authentication
- **Zod 4.0.15** validation with comprehensive input sanitization

## 📱 Key Features

### Core Functionality
- **3-status evaluation workflow**: Draft → Submit → Complete
- **Performance cycle management**: Active/closed/archived with read-only enforcement
- **Multi-modal authentication**: Email/password, username/PIN, biometric
- **Enterprise SSO ready**: Microsoft AD & Google Workspace integration
- **Complete audit trails**: All actions tracked with timestamps
- **Bilingual support**: English/Spanish with instant switching

### Architecture Excellence
- **Hybrid UX design**: Desktop-first dashboards, mobile-first applications
- **Component architecture**: Single responsibility principle with 80%+ size reductions
- **Server Actions**: Type-safe data mutations with optimized caching
- **Touch accessibility**: 44px minimum targets throughout
- **Multi-tenant isolation**: Complete company data separation

### Enterprise Data Management
- **CSV import system**: Preview, validate, execute with rollback capability
- **Scheduled imports**: Automated sync from HRIS/APIs
- **Export capabilities**: PDF/Excel reports with role-based access
- **Performance analytics**: Rating distributions and trend analysis

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

**Core Tables**: Company, User, Evaluation, EvaluationItem, EvaluationItemAssignment, PerformanceCycle, PartialAssessment, AuditLog, BiometricCredential, ScheduledImport

- Multi-tenant architecture with complete company isolation
- Comprehensive audit trails for all data changes
- WebAuthn credential storage for biometric authentication
- Automated import scheduling and execution tracking

## 🚀 Getting Started

**Prerequisites**: Node.js 22.18.0+, Yarn 4.9.2 (Berry), modern browser

```bash
git clone [repository-url]
cd performance-mgmt
yarn install
yarn db:generate && yarn db:push && yarn db:seed
yarn dev
```

**Environment**: Create `.env.local` with `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

**Commands**: `yarn dev` (development), `yarn build` (production), `yarn db:studio` (database editor), `yarn lint && yarn tsc --noEmit` (code quality)

## 🧪 Demo Data

**DEMO S.A.**: 40 employees across 5 departments with HR Director, Managers, Employees, and PIN-only Operational Workers. Includes company/department/manager-level OKRs and competencies.

## 🎨 UX/UI Design System

**Hybrid Architecture**: Desktop-first dashboards with professional gradients and glass morphism for HR workflows. Mobile-first applications with 44px touch targets for field use. Single responsibility component architecture with 80%+ size reductions. Complete bilingual support (English/Spanish) with instant switching.

## 🌐 Production Deployment

**Docker Ready**: `docker build -t performance-mgmt . && docker run -p 3000:3000 performance-mgmt`

**Environment Variables**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NODE_ENV=production`

**Production Checklist**: Configure HTTPS, database backups, monitoring, remove demo data

**Status**: ✅ Rate limiting, security headers, dependencies updated, vulnerabilities resolved

## 🧑‍💻 Development

**Architecture**: Server Actions (preferred), Next.js App Router, TypeScript, Prisma, Tailwind CSS

**Structure**: `/app` (routes), `/components` (reusable UI), `/lib` (actions/translations/services), `/hooks` (custom logic)

**Component Excellence**: 80%+ size reductions through single responsibility principle. Major components extracted into focused, reusable modules with custom hooks for business logic separation.

**Development Guidelines**: Use Server Actions, maintain data isolation, TypeScript strict mode, hybrid design (desktop dashboards/mobile apps), 44px touch targets, bilingual support, audit trails, component extraction at 200+ lines.

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

Comprehensive data management for HR teams with preview, validation, upsert operations, audit logging, and automated scheduling.

### Import Features

**Workflow**: Upload → Preview → Configure → Execute → Review with rollback capability

**Capabilities**: Upsert operations, selective updates, comprehensive validation, audit logging, error recovery

**Validation**: Required fields, email uniqueness, role validation, manager relationships, company isolation

### Scheduled Imports

**Automated Sync**: URL/HTTP endpoints, REST APIs, SFTP with flexible scheduling (daily/weekly/monthly)

**Features**: Multiple authentication methods, email notifications, error handling, automatic retry

### Usage

**Manual Import**: `/users/advanced` → Upload CSV → Preview changes → Configure options → Execute → Review results

**Scheduled Import**: Create schedule → Configure data source → Set import options → Enable monitoring

**Access**: HR role required for all import operations

### CSV Format

**Required**: `name,email,role,department,position`
**Optional**: username, employeeId, personID, manager relationships, companyCode, shift, password

**Example**: `John Doe,john@company.com,johndoe,employee,Engineering,office,EMP001,ID123456,...`

### Technical Implementation

**Server Actions**: `previewCSVImport`, `executeCSVImport`, `getImportHistory`, `rollbackImport`, `createScheduledImport`, `executeScheduledImport`

**Database**: `ScheduledImport` table with JSON fields for schedule configuration, data sources, and import options

### Security & Compliance

**Protection**: Company-isolated, encrypted credentials, complete audit trails, HR-only access
**Safety**: Zod validation, preview-first approach, rollback capability, rate limiting
**Monitoring**: Email notifications, detailed logging, searchable audit history

### Best Practices

**Preparation**: UTF-8 encoding, exact column headers, validate data, test with small batches
**Scheduling**: Manual testing first, appropriate frequency, monitoring setup
**Management**: Regular backups, preview mode, documentation, quality monitoring

---

**Built for Enterprise Performance Management** - Scalable, secure, accessible
