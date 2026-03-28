# Credit Cooperative System - VPS Deployment Guide

## 🚀 Complete Deployment Guide for Hostinger VPS

This guide will walk you through deploying the Landing Page, Member Portal, and Staff Portal on your Hostinger VPS.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Initial Setup](#vps-initial-setup)
3. [Install Required Software](#install-required-software)
4. [Database Setup](#database-setup)
5. [Build Applications Locally](#build-applications-locally)
6. [Upload Files to VPS](#upload-files-to-vps)
7. [Configure Environment Variables](#configure-environment-variables)
8. [Setup Nginx](#setup-nginx)
9. [Configure SSL Certificates](#configure-ssl-certificates)
10. [Start Applications with PM2](#start-applications-with-pm2)
11. [Verify Deployment](#verify-deployment)
12. [Troubleshooting](#troubleshooting)
13. [Maintenance](#maintenance)

---

## 📦 Prerequisites

Before you begin, ensure you have:

- ✅ A Hostinger VPS with Ubuntu 20.04 or later
- ✅ Root or sudo access to your VPS
- ✅ A domain name pointed to your VPS IP
- ✅ Subdomains configured:
  - `yourdomain.com` - Landing Page
  - `members.yourdomain.com` - Member Portal
  - `staff.yourdomain.com` - Staff Portal
- ✅ SSH access to your VPS
- ✅ Basic knowledge of terminal commands

---

## 🖥️ VPS Initial Setup

### 1. Connect to Your VPS

```bash
ssh root@your-vps-ip-address
```

### 2. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Create a New User (Optional but Recommended)

```bash
adduser deployuser
usermod -aG sudo deployuser
su - deployuser
```

### 4. Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 💿 Install Required Software

### 1. Install Node.js (v18 LTS)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### 3. Install Nginx

```bash
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
sudo systemctl status nginx
```

### 4. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 5. Install Certbot for SSL

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 🗄️ Database Setup

### 1. Access PostgreSQL

```bash
sudo -u postgres psql
```

### 2. Create Databases and User

```sql
-- Create databases
CREATE DATABASE slz_coop_landing;
CREATE DATABASE slz_coop_members;
CREATE DATABASE slz_coop_staff;

-- Create user with strong password
CREATE USER coopuser WITH ENCRYPTED PASSWORD 'YourStrongPasswordHere';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE slz_coop_landing TO coopuser;
GRANT ALL PRIVILEGES ON DATABASE slz_coop_members TO coopuser;
GRANT ALL PRIVILEGES ON DATABASE slz_coop_staff TO coopuser;

-- Exit
\q
```

### 3. Configure PostgreSQL for Local Connections

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Add this line before other rules:
```
local   all             coopuser                                md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 4. Import Your Database Schemas

```bash
# For each database, import your schema files
psql -U coopuser -d slz_coop_landing -f /path/to/landing-schema.sql
psql -U coopuser -d slz_coop_members -f /path/to/members-schema.sql
psql -U coopuser -d slz_coop_staff -f /path/to/staff-schema.sql
```

---

## 🔨 Build Applications Locally

On your **local Windows machine**, build all three portals:

### Windows (using Command Prompt or PowerShell)

```batch
cd C:\Users\User\Desktop\credit-coop-system\credit-coop-system

# Build Landing Page
cd landing-page
call build.bat

# Build Member Portal
cd ..\member-portal
call build.bat

# Build Staff Portal
cd ..\staff-portal
call build.bat
```

### Linux/Mac (if building on VPS)

```bash
# Build Landing Page
cd landing-page
chmod +x build.sh
./build.sh

# Build Member Portal
cd ../member-portal
chmod +x build.sh
./build.sh

# Build Staff Portal
cd ../staff-portal
chmod +x build.sh
./build.sh
```

---

## 📤 Upload Files to VPS

### 1. Create Directory Structure on VPS

```bash
sudo mkdir -p /var/www/credit-coop/{landing-page,member-portal,staff-portal,logs}
sudo chown -R $USER:$USER /var/www/credit-coop
```

### 2. Upload Files Using SCP or SFTP

From your **local machine**, upload the built files:

```bash
# Upload Landing Page
scp -r landing-page/build/* user@your-vps-ip:/var/www/credit-coop/landing-page/build/
scp -r landing-page/server user@your-vps-ip:/var/www/credit-coop/landing-page/

# Upload Member Portal
scp -r member-portal/build/* user@your-vps-ip:/var/www/credit-coop/member-portal/build/
scp -r member-portal/server user@your-vps-ip:/var/www/credit-coop/member-portal/

# Upload Staff Portal
scp -r staff-portal/build/* user@your-vps-ip:/var/www/credit-coop/staff-portal/build/
scp -r staff-portal/server user@your-vps-ip:/var/www/credit-coop/staff-portal/

# Upload PM2 ecosystem config
scp ecosystem.config.js user@your-vps-ip:/var/www/credit-coop/
```

**Alternative**: Use FileZilla or WinSCP for GUI-based file transfer.

### 3. Install Server Dependencies on VPS

```bash
# Landing Page Server
cd /var/www/credit-coop/landing-page/server
npm install --production

# Member Portal Server
cd /var/www/credit-coop/member-portal/server
npm install --production

# Staff Portal Server
cd /var/www/credit-coop/staff-portal/server
npm install --production
```

---

## 🔐 Configure Environment Variables

### 1. Landing Page Environment

```bash
cd /var/www/credit-coop/landing-page
nano .env.production
```

Update these critical values:
```env
DB_PASSWORD=YourActualDatabasePassword
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
SESSION_SECRET=generate-a-long-random-string-here
```

### 2. Member Portal Environment

```bash
cd /var/www/credit-coop/member-portal/server
nano .env.production
```

Update these critical values:
```env
DB_PASSWORD=YourActualDatabasePassword
JWT_SECRET=generate-a-very-long-random-jwt-secret-at-least-64-characters
PAYMONGO_SECRET_KEY=your-live-paymongo-secret-key
CLIENT_ORIGIN=https://members.yourdomain.com
FRONTEND_URL=https://members.yourdomain.com
CORS_ORIGIN=https://members.yourdomain.com
SESSION_SECRET=generate-a-long-random-string-here
```

### 3. Staff Portal Environment

```bash
cd /var/www/credit-coop/staff-portal/server
nano .env.production
```

Update these critical values:
```env
DB_PASSWORD=YourActualDatabasePassword
JWT_SECRET=generate-a-very-long-random-jwt-secret-at-least-64-characters
CLIENT_ORIGIN=https://staff.yourdomain.com
FRONTEND_URL=https://staff.yourdomain.com
CORS_ORIGIN=https://staff.yourdomain.com
SESSION_SECRET=generate-a-long-random-string-here
```

### 4. Generate Secure Secrets

Use this command to generate secure random strings:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🌐 Setup Nginx

### 1. Copy Nginx Configuration Files

```bash
# Copy configurations
sudo cp /var/www/credit-coop/nginx/landing-page.conf /etc/nginx/sites-available/landing-page
sudo cp /var/www/credit-coop/nginx/member-portal.conf /etc/nginx/sites-available/member-portal
sudo cp /var/www/credit-coop/nginx/staff-portal.conf /etc/nginx/sites-available/staff-portal
```

### 2. Update Domain Names in Config Files

```bash
# Edit each config file and replace placeholders with your actual domains
sudo nano /etc/nginx/sites-available/landing-page
sudo nano /etc/nginx/sites-available/member-portal
sudo nano /etc/nginx/sites-available/staff-portal
```

Replace:
- `yourdomain.com` with your actual domain
- `members.yourdomain.com` with your member subdomain
- `staff.yourdomain.com` with your staff subdomain

### 3. Enable Sites

```bash
# Create symbolic links
sudo ln -s /etc/nginx/sites-available/landing-page /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/member-portal /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/staff-portal /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

### 4. Test Nginx Configuration

```bash
sudo nginx -t
```

If successful, reload Nginx:
```bash
sudo systemctl reload nginx
```

---

## 🔒 Configure SSL Certificates

### 1. Obtain SSL Certificates with Certbot

```bash
# For Landing Page
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For Member Portal
sudo certbot --nginx -d members.yourdomain.com

# For Staff Portal
sudo certbot --nginx -d staff.yourdomain.com
```

Follow the prompts and choose to redirect HTTP to HTTPS.

### 2. Test SSL Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

## ▶️ Start Applications with PM2

### 1. Create Logs Directory

```bash
mkdir -p /var/www/credit-coop/logs
```

### 2. Start All Applications

```bash
cd /var/www/credit-coop
pm2 start ecosystem.config.js
```

### 3. Save PM2 Configuration

```bash
pm2 save
```

### 4. Enable PM2 Startup on Boot

```bash
pm2 startup
# Follow the command it outputs (usually requires sudo)
```

### 5. Monitor Applications

```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor in real-time
pm2 monit
```

---

## ✅ Verify Deployment

### 1. Check if Servers are Running

```bash
pm2 status
```

All three servers (landing-server, member-server, staff-server) should show as "online".

### 2. Test Endpoints

```bash
# Test Landing Page API
curl http://localhost:5002/api/health

# Test Member Portal API
curl http://localhost:5001/api/health

# Test Staff Portal API
curl http://localhost:5000/api/health
```

### 3. Access in Browser

Open your browser and visit:
- `https://yourdomain.com` - Landing Page
- `https://members.yourdomain.com` - Member Portal
- `https://staff.yourdomain.com` - Staff Portal

---

## 🔧 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs [app-name]

# Check for port conflicts
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :5001
sudo netstat -tulpn | grep :5002
```

### Database Connection Issues

```bash
# Test database connection
psql -U coopuser -d slz_coop_staff -h localhost

# Check PostgreSQL is running
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Check SSL configuration
sudo nginx -t
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/credit-coop

# Fix uploads directory permissions
chmod -R 755 /var/www/credit-coop/*/server/uploads
```

---

## 🔄 Maintenance

### Updating Applications

```bash
# 1. Build new version locally
# 2. Stop PM2 apps
pm2 stop all

# 3. Upload new build files
# 4. Restart applications
pm2 restart all

# 5. Check status
pm2 status
```

### Backup Database

```bash
# Create backup directory
mkdir -p /var/backups/credit-coop

# Backup all databases
pg_dump -U coopuser slz_coop_landing > /var/backups/credit-coop/landing-$(date +%Y%m%d).sql
pg_dump -U coopuser slz_coop_members > /var/backups/credit-coop/members-$(date +%Y%m%d).sql
pg_dump -U coopuser slz_coop_staff > /var/backups/credit-coop/staff-$(date +%Y%m%d).sql
```

### View Application Logs

```bash
# PM2 logs
pm2 logs

# Nginx access logs
sudo tail -f /var/log/nginx/landing-access.log
sudo tail -f /var/log/nginx/member-access.log
sudo tail -f /var/log/nginx/staff-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/landing-error.log
sudo tail -f /var/log/nginx/member-error.log
sudo tail -f /var/log/nginx/staff-error.log
```

### Monitor Server Resources

```bash
# CPU and Memory usage
htop

# Disk usage
df -h

# PM2 monitoring
pm2 monit
```

---

## 📊 Performance Optimization

### Enable Nginx Caching

Add to nginx configuration:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### Enable PostgreSQL Connection Pooling

Consider using `pg-pool` in your Node.js applications for better database performance.

### Monitor and Scale

- Monitor application performance with PM2
- Use PM2 cluster mode if needed: `pm2 start app.js -i max`
- Consider upgrading VPS resources if needed

---

## 🆘 Support

If you encounter issues:

1. Check the logs first (PM2, Nginx, PostgreSQL)
2. Verify environment variables are correctly set
3. Ensure all services are running
4. Check firewall rules
5. Verify DNS settings

---

## 📝 Security Checklist

- ✅ Use strong passwords for database
- ✅ Generate unique JWT secrets
- ✅ Enable SSL/HTTPS on all domains
- ✅ Configure firewall (UFW)
- ✅ Keep system packages updated
- ✅ Regular database backups
- ✅ Monitor application logs
- ✅ Use environment variables for secrets
- ✅ Limit file upload sizes
- ✅ Configure CORS properly

---

## 🎉 Congratulations!

Your Credit Cooperative System is now deployed on your Hostinger VPS! All three portals should be accessible via their respective domains with SSL encryption.

For any deployment issues or questions, refer to the troubleshooting section above.
