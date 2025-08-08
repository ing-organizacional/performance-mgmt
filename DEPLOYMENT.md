# Deployment Guide

⚠️ **IMPORTANT: Security Fixes Required Before Production Deployment**

This guide covers deploying the Performance Management System using Docker, with support for both single-company and multi-company setups.

**Security Status (August 2025):** MEDIUM-HIGH RISK - Critical security fixes must be implemented before production deployment. See SECURITY.md for details.

## 🚨 Pre-Production Security Checklist

### Critical Security Fixes Required
- [ ] **Remove hardcoded default passwords** (`/src/app/api/admin/import/route.ts:232-234`)
- [ ] **Remove console.log statements** with sensitive data in production code
- [ ] **Implement CSRF protection** - Currently not implemented
- [ ] **Add Content Security Policy headers** - Missing security headers
- [ ] **Implement rate limiting** - No protection against brute force attacks
- [ ] **Add comprehensive input validation** - All API routes need Zod schemas
- [ ] **Fix unsafe type assertions** - Multiple instances throughout codebase
- [ ] **Generate secure NEXTAUTH_SECRET** with `openssl rand -base64 32`

### Estimated Security Fix Time
- **Critical fixes**: 2-3 weeks development time
- **All recommendations**: 6-8 weeks total

**DO NOT DEPLOY TO PRODUCTION** until these security issues are resolved.

## 🐳 Docker Deployment

### Quick Start

```bash
# Single company deployment
./scripts/docker-setup.sh single

# Multi-company deployment  
./scripts/docker-setup.sh multi

# Build only
./scripts/docker-setup.sh build
```

### Single Company Setup

Deploy one instance for a single company:

```bash
# Build and start
docker-compose up -d performance-mgmt

# Access at http://localhost:3000
```

**Directory Structure:**
```
performance-mgmt/
├── data/
│   └── production.db    # SQLite database
├── docker-compose.yml
└── .env.production      # Environment variables
```

### Multi-Company Setup

Deploy separate instances for each company with complete data isolation:

```bash
# Start all company instances
docker-compose --profile multi-company up -d

# Access:
# Company 1: http://localhost:3001
# Company 2: http://localhost:3002
```

**Directory Structure:**
```
performance-mgmt/
├── data/
│   ├── company1/
│   │   └── company1.db
│   └── company2/
│       └── company2.db
├── .env.company1
├── .env.company2
└── docker-compose.yml
```

## 🔧 Configuration

### Environment Variables

**Required:**
- `DATABASE_URL` - SQLite database path
- `NEXTAUTH_URL` - Full URL of your application
- `NEXTAUTH_SECRET` - Secret for JWT signing (use `openssl rand -base64 32`)

**Optional:**
- `NODE_ENV=production`
- `COMPANY_ID` - Identifier for multi-tenant setups

### Production Environment File

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=file:./data/production.db
NEXTAUTH_URL=https://your-domain.com
# ⚠️ CRITICAL: Generate secure secret with: openssl rand -base64 32
NEXTAUTH_SECRET=REPLACE_WITH_SECURE_32_BYTE_STRING_GENERATED_BY_OPENSSL

# ⚠️ SECURITY WARNING: 
# The current codebase has hardcoded default passwords that must be removed
# before production deployment. See SECURITY.md for details.
```

## 🖥️ Windows Server Deployment

### Prerequisites

1. **Docker Desktop for Windows** or **Docker Engine**
2. **PowerShell** or **Command Prompt**
3. **Port availability** (3000, 3001, 3002...)

### Setup Steps

```powershell
# Clone repository
git clone <repository-url>
cd performance-mgmt

# Make setup script executable (if using WSL/Git Bash)
chmod +x scripts/docker-setup.sh

# Or use PowerShell equivalent
.\scripts\docker-setup.ps1 single
```

### IIS Integration (Optional)

Use IIS as a reverse proxy:

```xml
<!-- web.config -->
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Performance Management">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## 📊 Data Management

### Database Backup

```bash
# Backup single company
cp ./data/production.db ./backups/production-$(date +%Y%m%d).db

# Backup all companies
tar -czf backups/all-companies-$(date +%Y%m%d).tar.gz ./data/
```

### Database Restore

```bash
# Stop services
docker-compose down

# Restore database
cp ./backups/production-20250315.db ./data/production.db

# Restart services
docker-compose up -d
```

### Database Access

```bash
# Open Prisma Studio
docker-compose exec performance-mgmt npx prisma studio

# Direct SQLite access
docker-compose exec performance-mgmt sqlite3 ./data/production.db
```

## 🔍 Monitoring & Logs

### Health Check

```bash
# Check application health
curl http://localhost:3000/api/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-03-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f performance-mgmt

# Company-specific logs
docker-compose logs -f company-1
```

### Log Management

```bash
# Rotate logs
docker-compose logs --no-color > logs/app.log
docker-compose restart

# Clear logs
docker system prune -f
```

## 🚀 Scaling & Performance

### Resource Requirements

**Minimum (per company):**
- CPU: 1 core
- RAM: 512MB
- Storage: 10GB

**Recommended (per company):**
- CPU: 2 cores  
- RAM: 1GB
- Storage: 50GB

### Horizontal Scaling

```bash
# Scale to multiple replicas
docker-compose up -d --scale performance-mgmt=3

# Load balancer configuration needed for multiple replicas
```

### Performance Tuning

```yaml
# docker-compose.yml
services:
  performance-mgmt:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5' 
          memory: 512M
```

## 🔐 Security

### ⚠️ Current Security Status (August 2025)

**CRITICAL ISSUES IDENTIFIED:**

1. **Hardcoded Default Passwords**
   - Location: `/src/app/api/admin/import/route.ts:232-234`
   - Impact: Default credentials pose immediate security risk
   - Status: **NOT FIXED** - Requires immediate attention

2. **Missing Security Controls**
   - CSRF Protection: **NOT IMPLEMENTED**
   - Rate Limiting: **NOT IMPLEMENTED**  
   - Content Security Policy: **NOT IMPLEMENTED**
   - Input Validation: **PARTIAL** (missing Zod schemas)

3. **Information Disclosure**
   - Console.log statements leak sensitive data in production
   - Generic error handling loses security context

### SSL/TLS Configuration

```yaml
# docker-compose.yml with SSL
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - performance-mgmt
```

### Security Headers (TO BE IMPLEMENTED)

Currently missing - needs implementation:
- CSRF protection ❌
- Secure cookies ⚠️ (partial)
- Content Security Policy ❌
- XSS protection ⚠️ (basic only)
- Rate limiting ❌

### Network Security

```yaml
# Restrict network access
networks:
  internal:
    internal: true
  web:
    external: true

services:
  performance-mgmt:
    networks:
      - internal
      - web
```

## 🛠️ Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check database file permissions
ls -la ./data/
chmod 644 ./data/production.db
```

**2. Port Already in Use**
```bash
# Find process using port
netstat -tulpn | grep :3000
kill -9 <PID>
```

**3. Permission Denied**
```bash
# Fix file permissions
sudo chown -R 1001:1001 ./data/
```

**4. Memory Issues**
```bash
# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory
```

### Debug Mode

```bash
# Run with debug output
NODE_ENV=development docker-compose up

# Shell into container
docker-compose exec performance-mgmt sh
```

### Reset Everything

```bash
# Complete reset (DESTROYS ALL DATA)
./scripts/docker-setup.sh reset
```

## 📋 Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Database Migration

```bash
# After schema changes
docker-compose exec performance-mgmt npx prisma db push
docker-compose exec performance-mgmt npx prisma generate
```

### Regular Maintenance

```bash
# Weekly backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf backups/weekly-backup-$DATE.tar.gz ./data/
find backups/ -name "weekly-backup-*.tar.gz" -mtime +30 -delete
```

## 🔒 Security Audit Summary (August 2025)

### Code Quality Assessment: B+ (Good with room for improvement)

The deployment setup provides solid containerization architecture, but **critical security vulnerabilities must be addressed before production use**.

### High Priority Security Issues
1. **Authentication**: Hardcoded passwords and missing rate limiting
2. **Input Validation**: No Zod schemas for API validation
3. **Security Headers**: Missing CSRF, CSP, and other protective headers
4. **Type Safety**: Unsafe type assertions throughout codebase
5. **Information Disclosure**: Console.log statements in production

### Performance Issues
1. **Database**: N+1 queries and missing indexes
2. **Components**: Large files (500+ lines) violating SRP
3. **Caching**: No caching strategy implemented

### Deployment Readiness
- **Architecture**: ✅ Well-structured Next.js 15 + Docker
- **Data Isolation**: ✅ Multi-tenant architecture working
- **Security**: ❌ Critical vulnerabilities need fixing
- **Performance**: ⚠️ Optimization needed for scale

**RECOMMENDATION:** Complete security fixes before any production deployment. This deployment guide should only be used for development/testing until security issues are resolved.

See `SECURITY.md` for complete vulnerability details and `API_AUDIT.md` for performance improvements.