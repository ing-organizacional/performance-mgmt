# Semantic Versioning Guidelines

Performance Management System follows [Semantic Versioning 2.0.0](https://semver.org/) principles.

## 📋 Version Format: MAJOR.MINOR.PATCH

### MAJOR Version (X.0.0)
**Increment when making incompatible API changes or breaking changes**

Examples:
- Database schema changes requiring data migration
- Removing or significantly changing API endpoints
- Changing authentication mechanisms
- Removing features or changing user workflows
- NextAuth version upgrades that break compatibility

**Current**: v2.x.x

### MINOR Version (1.X.0)
**Increment when adding functionality in a backward compatible manner**

Examples:
- New evaluation features (e.g., peer reviews, 360 feedback)
- New export formats or reporting capabilities
- Additional authentication methods (e.g., SSO integration)
- New admin dashboard features
- Performance cycle enhancements
- New user roles or permissions

**Guidelines**:
- Must maintain backward compatibility
- New features should be opt-in when possible
- Database changes must be additive only

### PATCH Version (1.0.X)
**Increment for backward compatible bug fixes and security patches**

Examples:
- Security vulnerability fixes
- Bug fixes in evaluation workflows
- Performance optimizations
- Documentation updates
- UI/UX improvements that don't change functionality
- Dependency updates (without breaking changes)

## 🏷️ Version History

### v2.2.0 - Speech Recognition & UX Enhancements (August 16, 2025)
**Minor release: New speech-to-text features, improved UX, and comprehensive bug fixes**

**🎤 Speech Recognition Enhancements:**
- **NEW**: Conservative text enhancement for speech-to-text output with 90%+ confidence
- Fixed microphone access permissions for speech recognition (security policy)
- Added language-aware speech recognition support (Spanish/English)
- Improved speech input reliability and error handling

**🌐 Bilingual & UX Improvements:**
- **NEW**: Enhanced autosave feedback with success confirmation and minimum visibility duration
- **NEW**: Bilingual autosave messages (English/Spanish) with proper translations
- Fixed mixed language issues in evaluation approval messages
- Improved input visibility across all forms with consistent text colors

**🔧 Critical Bug Fixes:**
- Fixed evaluation cycle association bug preventing dashboard accuracy
- Resolved dashboard completion statistics cache invalidation issues
- Fixed navigation inconsistencies (archive page back button)
- Standardized header styling across all dashboard pages

**📊 Dashboard & Navigation:**
- Fixed audit dashboard auto-scroll to bottom issue
- Consistent header layout and spacing across all pages
- Improved filter input visibility in audit page
- Enhanced accessibility with proper touch targets and focus states

**📋 Technical Improvements:**
- Automatic linking of new evaluations to active performance cycles
- Enhanced cache invalidation for real-time dashboard updates
- Better error handling and user feedback mechanisms
- Improved component consistency and maintainability

### v2.1.1 - Internationalization & Audit Enhancements (August 15, 2025)
**Patch release: Bilingual improvements and audit logging enhancements**

**🌐 Internationalization Fixes:**
- Fixed hardcoded English text in AI improvement error messages
- Made all date picker calendars fully bilingual with proper `lang` attributes
- Fixed hardcoded English text in audit dashboard
- Replaced emoji with consistent Lucide icons in audit dashboard
- Removed duplicate translation keys and fixed type definitions

**📋 Audit System Improvements:**
- Added comprehensive audit logging for company-wide item management (create, update, deactivate)
- Implemented `auditEvaluationItem` function with complete before/after data tracking
- Enhanced audit trail for company-wide competency and OKR changes
- Improved audit dashboard with better bilingual support

**✨ Quality Improvements:**
- Fixed TypeScript compilation issues
- Clean ESLint and build process
- Enhanced user experience with consistent language support across all date inputs

### v2.1.0 - Mobile-First Dashboard & Enhanced UX (August 15, 2025)
**Minor release: Comprehensive mobile optimization and UX improvements**

**New Features:**
- ✅ Complete mobile-responsive dashboard experience with hamburger navigation
- ✅ Enhanced authentication page with bilingual branding ("Bienvenido a Performa")
- ✅ Touch-optimized interactions with 44px minimum touch targets
- ✅ Consistent Lucide icon system throughout the application
- ✅ Mobile-first footer design with centered layout

**Improvements:**
- ✅ Compact mobile layouts with proper text handling and overflow prevention
- ✅ GPT-5 model compatibility with optimized token handling
- ✅ Enhanced responsive breakpoint system across all components
- ✅ Improved Spanish translations for better mobile text fit

**Bug Fixes:**
- ✅ Text overflow in mobile colored status boxes
- ✅ OpenAI API parameter compatibility for GPT-5 models
- ✅ Temperature parameter restrictions for reasoning models

### v2.0.0 - AI-Powered Performance Management (August 14, 2025)
**Major release: Enterprise AI integration and advanced features**

**New Features:**
- ✅ Complete AI-powered text improvement system (OpenAI, Anthropic, Ollama)
- ✅ Context-aware AI prompts for objectives, key results, and competencies
- ✅ Company-level AI feature flags and permissions system
- ✅ Version history management for AI-improved content
- ✅ Streaming UI with professional text animation effects

**Enhanced Features:**
- ✅ Employee archive system with complete lifecycle management
- ✅ Advanced component architecture with single responsibility principle
- ✅ Desktop-first dashboard with professional gradient backgrounds
- ✅ Enhanced export system with PDF generation capabilities

**Security & Performance:**
- ✅ Secure API key management for LLM providers
- ✅ AI input validation and content filtering
- ✅ Rate limiting for AI endpoints
- ✅ Comprehensive audit logging for AI operations

### v1.0.0 - First Production Release (August 10, 2025)
**Major milestone: Production-ready enterprise system**

**Security & Infrastructure:**
- ✅ All critical security vulnerabilities resolved
- ✅ NextAuth v5 with WebAuthn/FIDO2 biometric authentication
- ✅ Enterprise-grade security headers and CSRF protection
- ✅ API surface reduced by 17% (6 → 5 endpoints)
- ✅ Server Actions architecture for enhanced security

**Core Features:**
- ✅ Complete performance evaluation system (draft → submitted → completed)
- ✅ Performance cycle management with read-only enforcement
- ✅ Multi-modal authentication (email/password, username/PIN, biometric)
- ✅ Bilingual support (English/Spanish)
- ✅ Mobile-first responsive design
- ✅ Role-based access control (HR, Manager, Employee)

**Architecture:**
- ✅ Modular component architecture (68-80% line reduction in key components)
- ✅ Server Actions-first approach with minimal REST API
- ✅ Enterprise CSV import system with preview/execute workflow
- ✅ Comprehensive audit logging and change tracking
- ✅ Advanced export system (PDF, Excel) with role-based filtering

**Database:**
- ✅ 10-table relational schema with multi-tenant isolation
- ✅ SQLite with Prisma ORM for type-safe database operations
- ✅ Performance cycles with status enforcement
- ✅ Complete audit trail for all changes

### Pre-v1.0.0 Development
- v0.1.0 - Initial development version

## 🔄 Release Process

### 1. Version Planning
- **Monthly Major/Minor releases** for new features
- **Weekly Patch releases** for bug fixes and security updates
- **Immediate Hotfixes** for critical security issues

### 2. Branch Strategy
- **main**: Production-ready code (tagged releases)
- **develop**: Integration branch (merge weekly to main)  
- **feature/**: Short-lived feature branches (1-5 commits)
- **hotfix/**: Critical fixes (immediate merge to main + develop)

### 3. Commit Message Format
```
type(scope): description

feat(auth): add SSO integration support
fix(evaluations): resolve evaluation submission bug  
security(deps): update vulnerable dependencies
docs(api): update API documentation for v1.1.0
```

### 4. Release Workflow
```bash
# 1. Update version in package.json
npm version major|minor|patch

# 2. Update CHANGELOG.md
# Document all changes since last release

# 3. Create release PR
gh pr create --title "Release v1.1.0" --body "Release notes..."

# 4. After merge, tag the release
git tag v1.1.0
git push origin v1.1.0

# 5. Create GitHub release
gh release create v1.1.0 --title "v1.1.0" --notes "Release notes..."
```

## 📊 Version Compatibility Matrix

### NextAuth Compatibility
- **v1.0.x**: NextAuth v5.0.0-beta.29
- **Future v1.1.x**: NextAuth v5.0.0 stable (when released)

### Next.js Compatibility  
- **v1.0.x**: Next.js 15.4.5 (App Router)
- **Node.js**: 22.18.0+ required

### Database Migrations
- **v1.0.x**: No breaking schema changes planned
- **v2.0.x**: May include schema migrations for new features

## 🚨 Breaking Change Policy

### Major Version Requirements
- **Advance Notice**: 30 days minimum for planned breaking changes
- **Migration Guide**: Detailed upgrade instructions provided
- **Deprecation Period**: Features marked deprecated for 1 major version before removal
- **LTS Support**: Previous major version supported for 6 months

### Emergency Breaking Changes
- **Security-Critical**: May be implemented immediately with hotfix
- **Communication**: Immediate notification via all channels
- **Support**: Extended support window for emergency changes

## 📈 Future Roadmap

### Planned Major Versions

**v2.2.0 - Advanced Analytics (Q1 2026)**
- Peer review and 360-degree feedback
- Advanced reporting and analytics dashboard
- Performance trend analysis and insights
- Enhanced export capabilities

**v3.0.0 - Enterprise Integration (Q3 2026)**
- SSO integration (SAML, OIDC)
- Multi-language expansion beyond English/Spanish

**v4.0.0 - Enterprise Scale (2027)**  
- Microservices architecture
- Advanced role-based permissions
- API rate limiting and quotas
- Enterprise compliance features (SOX, GDPR)

## 🔍 Version Verification

### Check Current Version
```bash
# Package version
node -p "require('./package.json').version"

# Git tags
git tag --list | sort -V

# Latest release
gh release list --limit 1
```

### Verify Compatibility
```bash
# Check dependencies
yarn audit
yarn outdated

# Verify build
yarn build
yarn test
```

---

**Maintained by**: Development Team  
**Last Updated**: August 15, 2025  
**Next Review**: September 15, 2025