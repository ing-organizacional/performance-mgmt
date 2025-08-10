# SSO Integration Guide: Microsoft Active Directory & Google Workspace

Enterprise Single Sign-On integration for seamless authentication with corporate identity providers.

---

## 📋 Overview

This document outlines the comprehensive plan for integrating Microsoft Active Directory (Azure AD/Entra ID) and Google Workspace SSO with the Performance Management System. The integration maintains full backward compatibility while adding enterprise-grade authentication capabilities.

### Current Authentication Methods
- ✅ Email + Password authentication
- ✅ Username + PIN authentication (operational workers)
- ✅ WebAuthn/FIDO2 biometric authentication
- 🆕 **Microsoft Active Directory SSO** (planned)
- 🆕 **Google Workspace SSO** (planned)

## 🔄 How SSO Integration Works

### Authentication Flow Comparison

#### **Traditional Login (Current):**
```
User → Login Form → Credentials Check → Database → Session Created
```

#### **SSO Login (Proposed):**
```
User → "Sign in with Microsoft/Google" → SSO Provider → Token Exchange → User Mapping → Session Created
```

### Detailed SSO Flow

#### **Step 1: User Initiates SSO**
- User visits the login page at `/login`
- Clicks "Sign in with Microsoft" or "Sign in with Google" button
- NextAuth v5 redirects to the selected SSO provider

#### **Step 2: SSO Provider Authentication**
- **Microsoft Azure AD**: User authenticates with corporate Active Directory credentials
- **Google Workspace**: User authenticates with Google Workspace account
- SSO provider validates credentials against their enterprise directory
- Multi-factor authentication applied if configured by IT

#### **Step 3: Authorization & Consent**
- SSO provider requests user consent to share profile information
- User authorizes the Performance Management System to access:
  - Basic profile (name, email)
  - Department information (if available)
  - Group memberships (for role mapping)

#### **Step 4: Token Exchange**
- NextAuth exchanges authorization code for access token
- Retrieves user profile data from SSO provider
- Profile data includes:
  ```json
  {
    "email": "john.doe@contoso.com",
    "name": "John Doe",
    "department": "Engineering", 
    "groups": ["Managers", "Engineering-Team"],
    "employeeId": "EMP-12345"
  }
  ```

#### **Step 5: User Mapping & Company Association**
- System maps SSO user to internal company structure
- Automatic role assignment based on directory groups
- Creates or updates user record with SSO identity
- Establishes session with appropriate permissions

## 🏢 Company & Domain Mapping

### Automatic Company Association

#### **Method 1: Email Domain Mapping**
```typescript
// Configuration examples
const domainMapping = {
  "contoso.com": "company-contoso-id",
  "acme.org": "company-acme-id", 
  "techcorp.net": "company-techcorp-id"
}

// User john.doe@contoso.com automatically maps to Contoso company
```

#### **Method 2: SSO Provider Configuration**
Each company configures their specific SSO settings:

```typescript
// Company-specific SSO configuration
{
  companyId: "company-contoso-id",
  providers: {
    "azure-ad": {
      tenantId: "12345-abcd-efgh-...",
      clientId: "app-client-id",
      roleMappings: {
        "HR-Admins": "hr",
        "Department-Managers": "manager",
        "All-Employees": "employee"
      }
    },
    "google": {
      workspaceDomain: "contoso.com",
      roleMappings: {
        "hr@contoso.com": "hr",
        "managers@contoso.com": "manager"
      }
    }
  }
}
```

## 🔐 Multi-Modal Authentication Architecture

### Hybrid Authentication Support
The system supports ALL authentication methods simultaneously:

```typescript
// Login options available to users:
{
  corporate: [
    "Sign in with Microsoft",    // Azure AD SSO
    "Sign in with Google"        // Google Workspace SSO
  ],
  traditional: [
    "Email & Password",          // Standard form login
    "Username & PIN",            // Operational workers  
    "Biometric Authentication"   // WebAuthn/FIDO2
  ]
}
```

### User Experience by Role

| User Type | Recommended Auth | Alternative Options |
|-----------|-----------------|-------------------|
| **Corporate Employees** | SSO (Microsoft/Google) | Email/Password, Biometric |
| **Contractors/External** | Email/Password | Biometric |
| **Operational Workers** | Username/PIN | Biometric |
| **Mobile Users** | Biometric | SSO, Email/Password |
| **IT Administrators** | SSO + MFA | Email/Password + MFA |

## 📊 Database Schema Extensions

### New Tables Required

#### **SSOProvider Table**
```sql
CREATE TABLE SSOProvider (
  id            TEXT PRIMARY KEY,
  companyId     TEXT NOT NULL,
  provider      TEXT NOT NULL,     -- 'azure-ad', 'google'
  providerName  TEXT NOT NULL,     -- 'Contoso Active Directory'
  
  -- Provider-specific configuration
  tenantId      TEXT,              -- Azure AD Tenant ID
  clientId      TEXT,              -- OAuth Client ID
  clientSecret  TEXT,              -- Encrypted client secret
  workspaceDomain TEXT,            -- Google Workspace domain
  
  -- User mapping configuration  
  mappingRules  JSON NOT NULL,     -- Role and attribute mapping
  
  enabled       BOOLEAN DEFAULT true,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(companyId, provider),
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE
);
```

#### **SSOUserMapping Table**
```sql
CREATE TABLE SSOUserMapping (
  id            TEXT PRIMARY KEY,
  userId        TEXT NOT NULL,
  ssoProviderId TEXT NOT NULL,
  
  externalId    TEXT NOT NULL,     -- User ID from SSO provider
  externalEmail TEXT NOT NULL,     -- Email from SSO provider
  lastSync      DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(ssoProviderId, externalId),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (ssoProviderId) REFERENCES SSOProvider(id) ON DELETE CASCADE
);
```

#### **Enhanced User Table**
```sql
-- Add to existing User table
ALTER TABLE User ADD COLUMN authMethod TEXT DEFAULT 'credentials';
-- Possible values: 'credentials', 'azure-ad', 'google', 'biometric'

ALTER TABLE User ADD COLUMN ssoSyncEnabled BOOLEAN DEFAULT false;
ALTER TABLE User ADD COLUMN lastSSOSync DATETIME;
```

### Migration Strategy
- **Zero Breaking Changes**: All existing data preserved
- **Additive Schema**: New tables and optional columns only  
- **Backward Compatible**: Existing authentication methods unchanged

## 🛠️ Technical Implementation

### NextAuth v5 Configuration

#### **Enhanced auth.ts**
```typescript
// src/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import AzureADProvider from 'next-auth/providers/azure-ad'
import GoogleProvider from 'next-auth/providers/google'
import { authenticateUser } from '@/lib/auth'
import { mapSSOUserToCompany } from '@/lib/sso-mapping'

export const config = {
  trustHost: true,
  providers: [
    // Existing Credentials provider (unchanged)
    Credentials({
      // ... current implementation preserved
    }),

    // Microsoft Azure AD / Entra ID
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email User.Read Directory.Read.All"
        }
      }
    }),

    // Google Workspace
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email",
          hd: process.env.GOOGLE_WORKSPACE_DOMAIN
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'azure-ad' || account?.provider === 'google') {
        return await handleSSOSignIn(user, account, profile)
      }
      return true // Existing flow unchanged
    },

    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'azure-ad' || account?.provider === 'google') {
        const mappedUser = await mapSSOUserToCompany(user, account, profile)
        token.user = mappedUser
      }
      return token
    },

    async session({ session, token }) {
      session.user = token.user as any
      return session
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
```

### SSO User Mapping Service

#### **Core Mapping Logic**
```typescript
// src/lib/sso-mapping.ts
export async function mapSSOUserToCompany(
  user: User,
  account: Account, 
  profile: Profile | undefined
): Promise<SSOUserData | null> {
  
  // 1. Determine company by email domain or SSO configuration
  const company = await findCompanyByDomain(user.email.split('@')[1], account.provider)
  
  // 2. Extract user attributes from SSO profile
  const userAttributes = extractUserAttributes(account.provider, profile)
  
  // 3. Create or update user in database
  const mappedUser = await upsertSSOUser(user, account, userAttributes, company)
  
  // 4. Create SSO identity mapping
  await createSSOMapping(mappedUser.id, account, company.id)
  
  return mappedUser
}

function extractUserAttributes(provider: string, profile: Profile) {
  const attributes = {}
  
  if (provider === 'azure-ad') {
    // Map Azure AD attributes
    attributes.department = profile.department
    attributes.employeeId = profile.employeeId
    attributes.role = mapAzureGroupsToRole(profile.groups)
  }
  
  if (provider === 'google') {
    // Map Google Workspace attributes  
    attributes.department = profile.department
    attributes.role = mapGoogleGroupsToRole(profile.groups)
  }
  
  return attributes
}
```

### Environment Configuration

#### **Required Environment Variables**
```bash
# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID="12345678-1234-1234-1234-123456789abc"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="87654321-4321-4321-4321-cba987654321"

# Google Workspace Configuration  
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_WORKSPACE_DOMAIN="yourcompany.com"

# Existing configuration (unchanged)
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="file:./dev.db"
```

## 📋 Configuration Process

### For IT Administrators

#### **Microsoft Azure AD Setup**

1. **Azure Portal Registration**
   - Navigate to Azure Active Directory → App registrations
   - Click "New registration"  
   - Name: "Performance Management System"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: `https://your-domain.com/api/auth/callback/azure-ad`

2. **Configure App Permissions**
   - API permissions → Add permission → Microsoft Graph
   - Add permissions:
     - `User.Read` (Sign in and read user profile)
     - `Directory.Read.All` (Read directory data)
     - `Group.Read.All` (Read all groups - for role mapping)

3. **Create Client Secret**
   - Certificates & secrets → New client secret
   - Description: "Performance Management System"
   - Expiry: 12 months (set calendar reminder)
   - **Save the secret value immediately**

4. **Configure Group Claims (Optional)**
   - Token configuration → Add groups claim
   - Select "All groups" or specific groups
   - Include in ID tokens and access tokens

#### **Google Workspace Setup**

1. **Google Cloud Console**
   - Navigate to Google Cloud Console → APIs & Services → Credentials
   - Click "Create Credentials" → OAuth 2.0 Client IDs
   - Application type: Web application
   - Name: "Performance Management System"

2. **Configure OAuth Settings**
   - Authorized JavaScript origins: `https://your-domain.com`
   - Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`
   - Save and note Client ID and Client Secret

3. **Configure Workspace Domain (Optional)**
   - In OAuth consent screen, add your workspace domain
   - This restricts login to your organization only

4. **Directory API Access (Optional)**
   - Enable Google Admin SDK API
   - Configure service account for directory synchronization
   - Grant domain-wide delegation for user/group reading

#### **Performance Management System Configuration**

1. **Admin Panel SSO Setup** (Future Enhancement)
   ```typescript
   // Admin interface for SSO configuration
   {
     companyId: "your-company-id",
     ssoProviders: [
       {
         provider: "azure-ad",
         enabled: true,
         displayName: "Sign in with Microsoft",
         tenantId: "your-tenant-id",
         roleMappings: {
           "HR-Administrators": "hr",
           "Department-Managers": "manager", 
           "All-Employees": "employee"
         }
       }
     ]
   }
   ```

2. **Test Configuration**
   - Create test accounts in Azure AD/Google Workspace
   - Verify SSO login flow
   - Confirm role mapping and company association
   - Test with different user types

## 🔄 Migration & Rollout Strategy

### Phase 1: Infrastructure Setup (No User Impact)
**Timeline: 1-2 weeks**

- [ ] Configure Azure AD/Google Workspace applications
- [ ] Update database schema with new SSO tables  
- [ ] Implement SSO mapping service
- [ ] Update NextAuth configuration
- [ ] Create admin interface for SSO management
- [ ] Test with pilot accounts

**Success Criteria:**
- SSO providers configured and responding
- Test users can authenticate via SSO
- User mapping working correctly
- No impact on existing authentication methods

### Phase 2: Gradual User Rollout (Opt-in)
**Timeline: 2-4 weeks**

- [ ] Deploy SSO login buttons to production
- [ ] Communicate new SSO options to users
- [ ] Existing users continue with current authentication
- [ ] Monitor SSO usage and error rates
- [ ] Gather user feedback and iterate

**Success Criteria:**  
- SSO login buttons visible and functional
- Corporate users adopting SSO authentication
- Zero disruption to existing user workflows
- Error rates below 1% for SSO logins

### Phase 3: Full Integration (Optional Migration)
**Timeline: 1-2 months**

- [ ] Link existing email accounts to SSO identities
- [ ] Provide migration tools for users
- [ ] Maintain full backward compatibility
- [ ] Users choose preferred authentication method
- [ ] IT can enforce SSO for security compliance

**Success Criteria:**
- Seamless migration for existing users
- Multiple authentication options available
- IT compliance requirements met
- User satisfaction maintained or improved

## 🛡️ Security & Compliance Benefits

### Enhanced Security Features

#### **Corporate Password Policies**
- Password complexity enforced by Active Directory/Google
- Password expiration and rotation policies applied
- Account lockout policies from corporate directory
- Password history and reuse prevention

#### **Multi-Factor Authentication**
- Corporate MFA policies automatically applied
- Support for hardware tokens, mobile apps, SMS
- Risk-based authentication based on location/device
- Step-up authentication for sensitive operations

#### **Centralized Access Management**
- Immediate access revocation when employees leave
- Automated user provisioning for new employees
- Role changes reflected immediately across all systems
- Centralized audit logging for compliance

#### **Session Management**
- Corporate session timeout policies applied
- Single sign-out across all corporate applications
- Device trust and conditional access policies
- Session monitoring and anomaly detection

### Compliance Advantages

#### **Regulatory Compliance**
- **GDPR**: Centralized data subject rights management
- **SOX**: Segregation of duties and access controls
- **HIPAA**: Enhanced audit trails and access logging
- **SOC 2**: Centralized identity and access management

#### **Audit & Reporting**
- Consolidated audit logs across all systems
- Automated access reviews and certifications  
- Risk-based access analytics and reporting
- Compliance dashboard for IT administrators

## 💼 Business Value Proposition

### For IT Departments

#### **Operational Efficiency**
- **Reduced Password Support**: 60-80% reduction in password reset tickets
- **Automated User Lifecycle**: New hire onboarding takes minutes, not hours
- **Centralized Management**: One place to manage all user access
- **Security Compliance**: Automated compliance with corporate policies

#### **Cost Savings**
- **Help Desk Reduction**: Fewer authentication-related support requests
- **Licensing Optimization**: Better visibility into application usage
- **Security Tooling**: Leverage existing security infrastructure
- **Administrative Time**: Reduced manual user management overhead

### For End Users

#### **Improved User Experience**
- **Single Sign-On**: One login for all corporate applications
- **Familiar Interface**: Same login experience as email, Office 365
- **Mobile Integration**: Corporate mobile policies and apps
- **Password-Free**: No additional passwords to remember or manage

#### **Enhanced Productivity**
- **Faster Access**: Immediate access to applications after login
- **Seamless Experience**: No context switching between authentication methods
- **Mobile Optimization**: Better mobile device integration
- **Reduced Friction**: Fewer authentication challenges and interruptions

### For Organizations

#### **Strategic Advantages**
- **Enterprise Readiness**: Meets large enterprise procurement requirements
- **Competitive Differentiation**: Advanced authentication capabilities
- **Scalability**: Supports organizations from 100 to 100,000+ users
- **Future-Proof**: Foundation for advanced identity features

#### **Risk Management**  
- **Reduced Security Risk**: Centralized identity management
- **Compliance Assurance**: Automated policy enforcement
- **Audit Readiness**: Comprehensive access logging
- **Business Continuity**: Faster employee onboarding/offboarding

## 📈 Implementation Roadmap

### Version Planning Integration

#### **v1.1.0 - SSO Foundation (Q4 2025)**
- Microsoft Azure AD integration
- Google Workspace integration  
- Basic SSO user mapping
- Admin configuration interface

#### **v1.2.0 - Advanced SSO Features (Q1 2026)**
- Role-based group mapping
- Automated user provisioning
- SSO-based CSV import enhancement
- Advanced audit logging

#### **v1.3.0 - Enterprise SSO (Q2 2026)**
- SAML 2.0 support (additional providers)
- OpenID Connect (OIDC) generic provider
- Just-in-time (JIT) user provisioning
- Advanced conditional access integration

#### **v2.0.0 - Identity Platform (Q3 2026)**
- Multi-domain SSO support
- Advanced role and attribute mapping
- Identity federation and trust relationships
- Enterprise SSO analytics and reporting

## 🔍 Technical Considerations

### Performance Impact

#### **Login Performance**
- SSO redirect adds ~500-1000ms to login flow
- Caching strategies reduce subsequent logins to <200ms
- Async user synchronization prevents blocking
- Progressive enhancement ensures graceful fallbacks

#### **Database Impact**
- Two additional tables with minimal storage overhead
- User table gains 3 optional columns
- Indexing strategy prevents performance degradation
- Query patterns optimized for SSO lookups

### Scalability Factors

#### **Multi-Company Support**
- Each company configures their own SSO providers
- Domain-based company mapping scales automatically  
- SSO provider configuration isolated per company
- Support for mixed authentication within companies

#### **High Availability**
- SSO provider failures fall back to traditional authentication
- Cached user mappings reduce external dependencies
- Graceful degradation when SSO providers are unavailable
- Health checks for SSO provider connectivity

## 🚨 Risk Assessment & Mitigation

### Potential Risks

#### **SSO Provider Dependency**
- **Risk**: SSO provider outage blocks user access
- **Mitigation**: Fallback to traditional authentication methods
- **Monitoring**: Health checks and automated failover

#### **Configuration Complexity** 
- **Risk**: Misconfiguration leads to authentication failures
- **Mitigation**: Comprehensive testing suite and validation
- **Documentation**: Step-by-step configuration guides

#### **User Migration Issues**
- **Risk**: Existing users cannot access accounts after SSO implementation
- **Mitigation**: Account linking tools and migration assistance
- **Support**: Dedicated migration support during rollout

### Security Considerations

#### **Token Security**
- OAuth tokens stored securely and encrypted
- Refresh token rotation and expiration policies
- Token scope minimization (principle of least privilege)
- Regular security audits of token handling

#### **Privacy Protection**
- Minimal data collection from SSO providers
- User consent for data sharing and processing
- Data retention policies for SSO user mappings
- GDPR compliance for cross-system data synchronization

## 📞 Support & Maintenance

### Ongoing Maintenance Requirements

#### **Certificate Management**
- OAuth client secrets expire annually
- Azure AD/Google Workspace certificate rotation
- Automated alerts for approaching expiration dates
- Documented renewal procedures

#### **User Support**  
- SSO troubleshooting documentation
- Training materials for IT administrators
- User guides for authentication options
- Escalation procedures for SSO issues

#### **Monitoring & Alerting**
- SSO provider connectivity monitoring
- Authentication success/failure rate tracking
- User migration progress tracking
- Security event alerting and response

---

## 📚 Additional Resources

### Documentation Links
- [NextAuth v5 Documentation](https://authjs.dev/)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Google Workspace Admin SDK](https://developers.google.com/admin-sdk)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/rfc6819)

### Sample Configurations
- [Azure AD App Registration Guide](./docs/azure-ad-setup.md) *(planned)*
- [Google Workspace OAuth Setup](./docs/google-workspace-setup.md) *(planned)*
- [SSO Testing Checklist](./docs/sso-testing.md) *(planned)*

### Support Resources
- **Technical Support**: Submit issues via GitHub Issues
- **Enterprise Support**: Contact sales team for dedicated support
- **Community**: Join discussions in project Discussions
- **Training**: SSO implementation workshops available

---

**Document Version**: 1.0  
**Last Updated**: August 10, 2025  
**Next Review**: September 15, 2025  
**Maintained By**: Development Team

For questions about SSO integration, please refer to this document first, then contact the development team through the established support channels.