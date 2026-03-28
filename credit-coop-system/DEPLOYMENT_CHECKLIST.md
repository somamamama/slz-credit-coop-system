# 🚀 Deployment Checklist

## Pre-Deployment

### Local Preparation
- [ ] All code changes committed to version control
- [ ] Environment variables documented and secured
- [ ] Database migrations prepared
- [ ] All three portals building successfully
  - [ ] Landing Page: `cd landing-page && npm run build`
  - [ ] Member Portal: `cd member-portal && npm run build`
  - [ ] Staff Portal: `cd staff-portal && npm run build`

### VPS Access
- [ ] SSH access configured
- [ ] Domain names configured and DNS propagated
  - [ ] Main domain: `yourdomain.com`
  - [ ] Member subdomain: `members.yourdomain.com`
  - [ ] Staff subdomain: `staff.yourdomain.com`

---

## VPS Setup

### System Configuration
- [ ] VPS updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Firewall configured (UFW)
  - [ ] SSH allowed
  - [ ] HTTP/HTTPS allowed
- [ ] Non-root user created (optional but recommended)

### Software Installation
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Nginx installed and running
- [ ] PM2 installed globally
- [ ] Certbot installed for SSL

---

## Database Setup

- [ ] PostgreSQL accessible
- [ ] Three databases created:
  - [ ] `slz_coop_landing`
  - [ ] `slz_coop_members`
  - [ ] `slz_coop_staff`
- [ ] Database user created with secure password
- [ ] Database schemas imported
- [ ] Connection tested from application

---

## File Upload

### Directory Structure
- [ ] Created `/var/www/credit-coop/` directory
- [ ] Created subdirectories for each portal
- [ ] Created logs directory

### Files Uploaded
- [ ] Landing Page build files → `/var/www/credit-coop/landing-page/build/`
- [ ] Landing Page server → `/var/www/credit-coop/landing-page/server/`
- [ ] Member Portal build files → `/var/www/credit-coop/member-portal/build/`
- [ ] Member Portal server → `/var/www/credit-coop/member-portal/server/`
- [ ] Staff Portal build files → `/var/www/credit-coop/staff-portal/build/`
- [ ] Staff Portal server → `/var/www/credit-coop/staff-portal/server/`
- [ ] PM2 ecosystem.config.js → `/var/www/credit-coop/`
- [ ] Nginx configurations → `/var/www/credit-coop/nginx/`

### Dependencies Installed
- [ ] Landing Page server: `cd server && npm install --production`
- [ ] Member Portal server: `cd server && npm install --production`
- [ ] Staff Portal server: `cd server && npm install --production`

---

## Environment Configuration

### Landing Page (.env.production)
- [ ] `PORT=5002`
- [ ] `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` configured
- [ ] `FRONTEND_URL` set to actual domain
- [ ] `CORS_ORIGIN` configured
- [ ] `SESSION_SECRET` generated (64+ characters)

### Member Portal (server/.env.production)
- [ ] `PORT=5001`
- [ ] `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` configured
- [ ] `JWT_SECRET` generated (64+ characters)
- [ ] `PAYMONGO_SECRET_KEY` set (live key)
- [ ] `CLIENT_ORIGIN` and `FRONTEND_URL` set
- [ ] `CORS_ORIGIN` configured
- [ ] `SESSION_SECRET` generated

### Staff Portal (server/.env.production)
- [ ] `PORT=5000`
- [ ] `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` configured
- [ ] `JWT_SECRET` generated (64+ characters)
- [ ] `CLIENT_ORIGIN` and `FRONTEND_URL` set
- [ ] `CORS_ORIGIN` configured
- [ ] `SESSION_SECRET` generated

---

## Nginx Configuration

- [ ] Landing Page config copied to `/etc/nginx/sites-available/`
- [ ] Member Portal config copied to `/etc/nginx/sites-available/`
- [ ] Staff Portal config copied to `/etc/nginx/sites-available/`
- [ ] Domain names updated in all configs
- [ ] Symbolic links created in `/etc/nginx/sites-enabled/`
- [ ] Default site disabled
- [ ] Nginx configuration tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

---

## SSL Certificates

- [ ] Certbot installed
- [ ] SSL certificate obtained for main domain
- [ ] SSL certificate obtained for members subdomain
- [ ] SSL certificate obtained for staff subdomain
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`
- [ ] All HTTP traffic redirects to HTTPS

---

## PM2 Process Manager

- [ ] PM2 ecosystem config uploaded
- [ ] Applications started: `pm2 start ecosystem.config.js`
- [ ] All apps showing "online" status: `pm2 status`
- [ ] PM2 configuration saved: `pm2 save`
- [ ] PM2 startup enabled: `pm2 startup`
- [ ] Server rebooted to test auto-start

---

## Testing & Verification

### API Endpoints
- [ ] Landing Page API responding: `curl http://localhost:5002/api/`
- [ ] Member Portal API responding: `curl http://localhost:5001/api/`
- [ ] Staff Portal API responding: `curl http://localhost:5000/api/`

### Frontend Access
- [ ] Landing Page accessible: `https://yourdomain.com`
- [ ] Member Portal accessible: `https://members.yourdomain.com`
- [ ] Staff Portal accessible: `https://staff.yourdomain.com`
- [ ] All pages loading without errors
- [ ] SSL certificates valid (green padlock)

### Functionality Testing
- [ ] Landing Page: Forms submitting correctly
- [ ] Member Portal: Login working
- [ ] Member Portal: Payment integration working
- [ ] Staff Portal: Login working
- [ ] Staff Portal: Dashboard loading
- [ ] Database connections working
- [ ] File uploads working
- [ ] Real-time features working (Socket.IO)

---

## Security Checklist

- [ ] Firewall configured and enabled
- [ ] Strong database passwords used
- [ ] JWT secrets are unique and strong (64+ chars)
- [ ] Session secrets are unique and strong
- [ ] SSL/HTTPS enabled on all domains
- [ ] CORS configured properly
- [ ] API keys secured in environment variables
- [ ] No sensitive data in code or version control
- [ ] PostgreSQL only accessible locally
- [ ] Regular backups scheduled

---

## Monitoring & Maintenance

- [ ] PM2 monitoring configured: `pm2 monit`
- [ ] Log rotation configured
- [ ] Database backup script created
- [ ] Backup restoration tested
- [ ] Server resource monitoring setup
- [ ] Alert system configured (optional)

---

## Post-Deployment

- [ ] All team members notified
- [ ] Documentation updated with production URLs
- [ ] Admin accounts created for staff portal
- [ ] Test accounts created (if needed)
- [ ] Production data imported (if applicable)
- [ ] Monitoring systems verified
- [ ] Backup strategy confirmed

---

## Troubleshooting Resources

- [ ] Log locations documented:
  - PM2 logs: `pm2 logs`
  - Nginx logs: `/var/log/nginx/`
  - PostgreSQL logs: `/var/log/postgresql/`
- [ ] Support contacts documented
- [ ] Rollback plan prepared
- [ ] Common issues documented

---

## Success Criteria

✅ **Deployment is successful when:**
1. All three portals are accessible via HTTPS
2. All PM2 processes show "online" status
3. Database connections are working
4. Users can login to member and staff portals
5. File uploads are functioning
6. Real-time features are working
7. No critical errors in logs
8. SSL certificates are valid
9. All security measures are in place
10. Backups are configured and tested

---

## Emergency Contacts

- **VPS Provider Support:** Hostinger Support
- **DNS Provider:** [Your DNS provider]
- **Team Lead:** [Contact info]
- **Database Admin:** [Contact info]

---

## Notes

```
Date Deployed: _______________
Deployed By: _________________
Production URLs:
  - Landing: https://yourdomain.com
  - Members: https://members.yourdomain.com
  - Staff: https://staff.yourdomain.com

VPS IP: _______________
Database Version: PostgreSQL 14
Node Version: 18.x
```

---

**Last Updated:** March 3, 2026
