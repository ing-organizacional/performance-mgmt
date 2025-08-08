# Security Configuration for Internet Deployment

## 🌐 Overview

This document provides security configuration for deploying the Performance Management System to the internet using Nginx Proxy Manager as a reverse proxy with a Google-indexed domain.

**⚠️ CRITICAL**: This application contains sensitive employee data and must be properly secured before internet exposure.

## 🛡️ Nginx Proxy Manager Configuration

### SSL/TLS Settings
Configure these settings in NPM GUI:

```
✅ Force SSL: ON
✅ HTTP/2 Support: ON  
✅ HSTS Enabled: ON
✅ HSTS Subdomains: ON
✅ Block Common Exploits: ON
✅ Websockets Support: ON (if needed)
```

### Security Headers Configuration

Add this to the **"Advanced"** tab in Nginx Proxy Manager:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';" always;

# Hide server information
server_tokens off;
proxy_hide_header X-Powered-By;
add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet" always;

# Rate limiting for login endpoints
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

location /login {
    limit_req zone=login burst=3 nodelay;
    proxy_pass http://your-container-ip:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /api/ {
    limit_req zone=api burst=10 nodelay;
    proxy_pass http://your-container-ip:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Block common attack paths
location ~ /\.(env|git|svn|htaccess) {
    deny all;
    return 404;
}

location ~ \.(sql|db|bak|backup|log)$ {
    deny all;
    return 404;
}

location ~ /(config|tmp|cache)/ {
    deny all;
    return 404;
}
```

### Admin Endpoint Protection

Add IP restrictions for admin functions:

```nginx
# Restrict admin access to trusted IPs only
location /api/admin/ {
    allow YOUR_OFFICE_IP;
    allow YOUR_HOME_IP;
    deny all;
    
    limit_req zone=api burst=5 nodelay;
    proxy_pass http://your-container-ip:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /users/advanced {
    allow YOUR_OFFICE_IP;
    allow YOUR_HOME_IP;
    deny all;
    
    proxy_pass http://your-container-ip:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🔐 Application Security Configuration

### Environment Variables

**CRITICAL**: Generate secure secrets before deployment:

```bash
# Generate secure NextAuth secret (32+ characters)
openssl rand -base64 32

# Example output: Kj9mVn2Rd8Bx4Fy7Pw3Qt6Zx8Cv1Mn5L
```

### Docker Environment Configuration

```bash
docker run -d \
  --name performance-mgmt \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -v /mnt/user/appdata/performance-mgmt:/app/data \
  -e NEXTAUTH_URL=https://yourdomain.com \
  -e NEXTAUTH_SECRET=your-generated-secure-secret \
  -e NODE_ENV=production \
  -e DATABASE_URL=file:./data/production.db \
  performance-mgmt
```

**Important Notes:**
- Bind to `127.0.0.1:3000` (localhost only) - let NPM handle external access
- Use strong, unique `NEXTAUTH_SECRET`
- Set correct domain in `NEXTAUTH_URL`

## 🚨 Critical Security Actions

### 1. Remove Demo Data

**BEFORE** going live, remove all demo credentials:

```bash
# Connect to running container
docker exec -it performance-mgmt sqlite3 /app/data/production.db

# Remove demo users
DELETE FROM User WHERE email LIKE '%@demo.com';
DELETE FROM User WHERE username IN ('worker1', 'worker2', 'worker3');

# Verify no demo users remain
SELECT name, email, username, role FROM User;

# Exit database
.quit
```

### 2. Create Production Admin User

```bash
# Use the web interface or create via SQL
# Recommended: Use /users/advanced page before removing demo accounts
```

### 3. File System Security

```bash
# Set proper permissions on database
sudo chown root:docker /mnt/user/appdata/performance-mgmt/production.db
sudo chmod 660 /mnt/user/appdata/performance-mgmt/production.db

# Secure data directory
sudo chmod 750 /mnt/user/appdata/performance-mgmt/
```

## 🕷️ SEO and Crawling Protection

### robots.txt Configuration

The app includes `/public/robots.txt`. Verify it contains:

```
User-agent: *
Disallow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /evaluations/
Disallow: /login
Disallow: /users/
Disallow: /my-evaluations
Disallow: /evaluate/
Disallow: /evaluation/
Disallow: /evaluation-summary/

# Block sensitive file types
Disallow: /*.db$
Disallow: /*.sql$
Disallow: /.env
Disallow: /*.log$
Disallow: /*.bak$

# SEO directives
Noindex: /
```

### Meta Tags

The application already includes these meta tags:
```html
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
```

## 🔍 Monitoring and Logging

### Nginx Logging

Enable comprehensive logging in NPM:

```nginx
# Add to Advanced tab
access_log /data/logs/performance-mgmt-access.log combined;
error_log /data/logs/performance-mgmt-error.log warn;

# Log failed attempts
log_format security '$remote_addr - $remote_user [$time_local] '
                   '"$request" $status $body_bytes_sent '
                   '"$http_referer" "$http_user_agent" '
                   '$request_time $upstream_response_time';

access_log /data/logs/performance-mgmt-security.log security;
```

### Application Monitoring

Monitor these log patterns for suspicious activity:

```bash
# Failed login attempts
grep "Authentication failed" /path/to/docker/logs

# Admin endpoint access
grep "POST /api/admin/" /data/logs/performance-mgmt-access.log

# Unusual API patterns
grep -E "(sql|script|alert|javascript)" /data/logs/performance-mgmt-access.log
```

### Automated Monitoring Script

```bash
#!/bin/bash
# /opt/monitor-performance-mgmt.sh

LOG_FILE="/data/logs/performance-mgmt-access.log"
ALERT_EMAIL="admin@yourcompany.com"

# Monitor failed login attempts (adjust threshold)
FAILED_LOGINS=$(grep -c "POST /login" $LOG_FILE | grep "401\|403")
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "Alert: $FAILED_LOGINS failed login attempts detected" | mail -s "Security Alert" $ALERT_EMAIL
fi

# Monitor admin access
ADMIN_ACCESS=$(grep -c "/api/admin/" $LOG_FILE)
if [ $ADMIN_ACCESS -gt 5 ]; then
    echo "Alert: $ADMIN_ACCESS admin endpoint accesses detected" | mail -s "Admin Access Alert" $ALERT_EMAIL
fi
```

## 🚀 Additional Hardening

### 1. Network Security

```bash
# Create isolated Docker network
docker network create performance-mgmt-net --internal

# Run container in isolated network
docker run -d \
  --name performance-mgmt \
  --network performance-mgmt-net \
  --restart unless-stopped \
  performance-mgmt
```

### 2. Backup Strategy

```bash
#!/bin/bash
# /opt/backup-performance-mgmt.sh

BACKUP_DIR="/backups/performance-mgmt"
DATA_DIR="/mnt/user/appdata/performance-mgmt"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $DATA_DIR/production.db $BACKUP_DIR/production_$DATE.db

# Compress old backups (keep 30 days)
find $BACKUP_DIR -name "*.db" -mtime +30 -delete

# Log backup
echo "$(date): Database backup completed - production_$DATE.db" >> $BACKUP_DIR/backup.log
```

### 3. Fail2Ban Configuration

Create `/etc/fail2ban/jail.local`:

```ini
[nginx-performance-mgmt]
enabled = true
port = http,https
filter = nginx-performance-mgmt
logpath = /data/logs/performance-mgmt-access.log
maxretry = 5
bantime = 3600
findtime = 600
action = iptables[name=nginx-performance-mgmt, port=http, protocol=tcp]
         iptables[name=nginx-performance-mgmt, port=https, protocol=tcp]
```

Create `/etc/fail2ban/filter.d/nginx-performance-mgmt.conf`:

```ini
[Definition]
failregex = ^<HOST> -.*POST /login.*401
            ^<HOST> -.*POST /api/admin/.*403
            ^<HOST> -.*GET /api/admin/.*403
ignoreregex =
```

## ⚠️ Pre-Launch Security Checklist

### Application Security
- [ ] Generate secure `NEXTAUTH_SECRET` (32+ characters)
- [ ] Set correct `NEXTAUTH_URL` with HTTPS domain
- [ ] Remove ALL demo credentials from database
- [ ] Create production admin user with strong password
- [ ] Verify `/robots.txt` is properly configured
- [ ] Test login rate limiting

### Nginx Proxy Manager
- [ ] Force SSL enabled
- [ ] HSTS enabled with subdomains
- [ ] Security headers configured
- [ ] IP restrictions on admin endpoints
- [ ] Rate limiting configured
- [ ] Attack path blocking enabled

### Infrastructure
- [ ] Database file permissions set (660)
- [ ] Data directory permissions set (750)
- [ ] Docker container runs as non-root
- [ ] Container bound to localhost only
- [ ] Backup automation configured
- [ ] Log monitoring enabled

### Monitoring
- [ ] Access logs configured
- [ ] Error logs configured
- [ ] Failed login monitoring active
- [ ] Admin access alerting configured
- [ ] Backup verification scheduled

### Network Security
- [ ] Firewall rules configured
- [ ] Fail2Ban rules active (optional but recommended)
- [ ] Network isolation configured (if applicable)

## 📞 Emergency Procedures

### Security Incident Response

1. **Immediate Actions:**
   ```bash
   # Block all access via NPM (disable proxy host)
   # Check logs for extent of breach
   grep -E "POST|admin|login" /data/logs/performance-mgmt-access.log
   
   # Backup current database for forensics
   cp /mnt/user/appdata/performance-mgmt/production.db /secure/forensics/
   ```

2. **Investigation:**
   - Review access logs for suspicious activity
   - Check for unauthorized user accounts
   - Verify data integrity
   - Document timeline of events

3. **Recovery:**
   - Restore from known good backup if necessary
   - Force password resets for all users
   - Update all secrets and credentials
   - Implement additional security measures

### Contact Information

- **System Administrator**: [Your Contact]
- **Security Team**: [Security Contact]  
- **Hosting Provider**: [Provider Support]

---

## 🛠️ Maintenance Schedule

### Daily
- Monitor access logs for anomalies
- Verify backup completion
- Check application health

### Weekly  
- Review security logs
- Update fail2ban rules if needed
- Test backup restoration

### Monthly
- Update Docker image
- Review user accounts
- Security configuration audit
- Performance optimization

### Quarterly
- Full security assessment
- Penetration testing
- Disaster recovery testing
- Documentation updates

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Next Review**: [3 months from now]