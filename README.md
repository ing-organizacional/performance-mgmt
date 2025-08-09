# Performance Management System

A **secure, mobile-first** web application for managing employee OKRs and competency evaluations across multiple companies. Enterprise-grade security with **all critical vulnerabilities resolved** and comprehensive audit trails. Designed for mixed workforce environments (office workers + operational workers).

## 🎯 Overview

Enterprise performance management system handling **4000+ employees across 27 companies** with:

- **Three-status evaluation workflow**: draft → submitted → completed
- **Mobile-first responsive design** optimized for managers and HR
- **Bilingual support** (English/Spanish) with instant language switching
- **Multi-modal authentication** (email + password / username + PIN / biometric)
- **WebAuthn/FIDO2 biometric authentication** (Face ID, Touch ID, Fingerprint)
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
- **Role-based Access Control**: HR, Manager, Employee permissions
- **Company Data Isolation**: Complete multi-tenant architecture
- **Audit Logging**: Every action tracked with user, timestamp, and changes

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

### Mobile-First UX

- **Touch Optimized**: 44px minimum touch targets throughout
- **Progressive Disclosure**: One decision per screen approach
- **Gesture Support**: Swipe navigation and touch interactions
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

**9 Core Tables:**

- `Company` - Multi-tenant root with isolation
- `User` - Employee data with role hierarchy
- `Evaluation` - Performance evaluation records
- `EvaluationItem` - OKR/Competency definitions
- `EvaluationItemAssignment` - Individual assignments
- `PerformanceCycle` - Time-based evaluation periods
- `PartialAssessment` - Granular rating tracking
- `AuditLog` - Complete change history
- `BiometricCredential` - WebAuthn credential storage

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

## 🌐 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t performance-mgmt .

# Run container
docker run -p 3000:3000 performance-mgmt
```

### Production Environment

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
├── components/          # Reusable React components
├── lib/                 # Business logic and utilities
│   ├── actions/         # Server Actions
│   ├── services/        # Business services
│   └── utils/           # Helper functions
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions
```

### Contributing Guidelines

- Use Server Actions for data mutations
- Maintain company-based data isolation
- Follow TypeScript strict mode
- Test mobile-first responsive design
- Update bilingual translations
- Maintain audit trails for changes

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

### REST API Endpoints (Legacy)

- `GET /api/health` - System health check
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/evaluation-items` - Evaluation item management
- `POST /api/admin/import` - CSV user import
- `POST /api/admin/reset-database` - Database reset (dev only)

## 🤝 Support

For issues and questions:

- Check existing documentation
- Review demo data and test workflows
- Submit issues with detailed reproduction steps
- Include browser/device information for UI issues

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Built with ❤️ for enterprise performance management
