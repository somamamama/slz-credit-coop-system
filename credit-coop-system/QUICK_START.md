# Quick Start - Deployment Instructions

## 🚀 Fast Track VPS Deployment

### Step 1: Build All Portals (On Your Windows Machine)

```batch
# Open Command Prompt in the project root
cd C:\Users\User\Desktop\credit-coop-system\credit-coop-system

# Run the build script
build-all.bat
```

This will build all three portals. Wait for it to complete.

---

### Step 2: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

---

### Step 3: Run VPS Setup Script

Copy and paste this entire script into your VPS terminal:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create project directory
sudo mkdir -p /var/www/credit-coop/{landing-page/{build,server},member-portal/{build,server},staff-portal/{build,server},logs,nginx}
sudo chown -R $USER:$USER /var/www/credit-coop

echo "✅ VPS setup complete!"
```

---

### Step 4: Setup PostgreSQL

```bash
# Access PostgreSQL
sudo -u postgres psql

# Run these commands (replace 'YourSecurePassword123!' with your own password):
CREATE DATABASE slz_coop_landing;
CREATE DATABASE slz_coop_members;
CREATE DATABASE slz_coop_staff;
CREATE USER coopuser WITH ENCRYPTED PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE slz_coop_landing TO coopuser;
GRANT ALL PRIVILEGES ON DATABASE slz_coop_members TO coopuser;
GRANT ALL PRIVILEGES ON DATABASE slz_coop_staff TO coopuser;
\q
```

---

### Step 5: Upload Files to VPS

**Option A: Using FileZilla or WinSCP (Recommended for Windows)**

1. Open FileZilla or WinSCP
2. Connect to your VPS (IP, username, password)
3. Upload these folders:
   - `landing-page/build/*` → `/var/www/credit-coop/landing-page/build/`
   - `landing-page/server/` → `/var/www/credit-coop/landing-page/server/`
   - `member-portal/build/*` → `/var/www/credit-coop/member-portal/build/`
   - `member-portal/server/` → `/var/www/credit-coop/member-portal/server/`
   - `staff-portal/build/*` → `/var/www/credit-coop/staff-portal/build/`
   - `staff-portal/server/` → `/var/www/credit-coop/staff-portal/server/`
   - `ecosystem.config.js` → `/var/www/credit-coop/`
   - `nginx/` → `/var/www/credit-coop/nginx/`

**Option B: Using SCP (From Git Bash or WSL on Windows)**

```bash
# Set your VPS details
VPS_USER="your-username"
VPS_IP="your-vps-ip"

# Upload Landing Page
scp -r landing-page/build/* $VPS_USER@$VPS_IP:/var/www/credit-coop/landing-page/build/
scp -r landing-page/server $VPS_USER@$VPS_IP:/var/www/credit-coop/landing-page/

# Upload Member Portal
scp -r member-portal/build/* $VPS_USER@$VPS_IP:/var/www/credit-coop/member-portal/build/
scp -r member-portal/server $VPS_USER@$VPS_IP:/var/www/credit-coop/member-portal/

# Upload Staff Portal
scp -r staff-portal/build/* $VPS_USER@$VPS_IP:/var/www/credit-coop/staff-portal/build/
scp -r staff-portal/server $VPS_USER@$VPS_IP:/var/www/credit-coop/staff-portal/

# Upload configs
scp ecosystem.config.js $VPS_USER@$VPS_IP:/var/www/credit-coop/
scp -r nginx $VPS_USER@$VPS_IP:/var/www/credit-coop/
```

---

### Step 6: Configure Environment Variables (On VPS)

```bash
# Landing Page
cat > /var/www/credit-coop/landing-page/.env << 'EOF'
PORT=5002
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=slz_coop_landing
DB_USER=coopuser
DB_PASSWORD=YourSecurePassword123!
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
EOF

# Member Portal Server
cat > /var/www/credit-coop/member-portal/server/.env << 'EOF'
PORT=5001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=slz_coop_members
DB_USER=coopuser
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=CHANGE_THIS_TO_A_VERY_LONG_RANDOM_STRING_AT_LEAST_64_CHARS
CLIENT_ORIGIN=https://members.yourdomain.com
FRONTEND_URL=https://members.yourdomain.com
CORS_ORIGIN=https://members.yourdomain.com
SESSION_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
PAYMONGO_SECRET_KEY=your_live_paymongo_key
EOF

# Staff Portal Server
cat > /var/www/credit-coop/staff-portal/server/.env << 'EOF'
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=slz_coop_staff
DB_USER=coopuser
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=CHANGE_THIS_TO_A_VERY_LONG_RANDOM_STRING_AT_LEAST_64_CHARS
CLIENT_ORIGIN=https://staff.yourdomain.com
FRONTEND_URL=https://staff.yourdomain.com
CORS_ORIGIN=https://staff.yourdomain.com
SESSION_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
SMS_PROVIDER=console
EOF

# Generate secure secrets
echo "Use this command to generate secure secrets:"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**⚠️ IMPORTANT:** Edit each `.env` file and replace placeholder values with actual secure values!

---

### Step 7: Install Dependencies (On VPS)

```bash
cd /var/www/credit-coop/landing-page/server && npm install --production
cd /var/www/credit-coop/member-portal/server && npm install --production
cd /var/www/credit-coop/staff-portal/server && npm install --production
```

---

### Step 8: Setup Nginx (On VPS)

```bash
# Copy nginx configs
sudo cp /var/www/credit-coop/nginx/landing-page.conf /etc/nginx/sites-available/landing-page
sudo cp /var/www/credit-coop/nginx/member-portal.conf /etc/nginx/sites-available/member-portal
sudo cp /var/www/credit-coop/nginx/staff-portal.conf /etc/nginx/sites-available/staff-portal

# IMPORTANT: Edit each config file and replace 'yourdomain.com' with your actual domain
sudo nano /etc/nginx/sites-available/landing-page
sudo nano /etc/nginx/sites-available/member-portal
sudo nano /etc/nginx/sites-available/staff-portal

# Enable sites
sudo ln -s /etc/nginx/sites-available/landing-page /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/member-portal /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/staff-portal /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 9: Setup SSL Certificates (On VPS)

```bash
# Replace with your actual domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d members.yourdomain.com
sudo certbot --nginx -d staff.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

### Step 10: Start Applications with PM2 (On VPS)

```bash
cd /var/www/credit-coop

# Start all apps
pm2 start ecosystem.config.js

# Check status
pm2 status

# Enable auto-start on boot
pm2 save
pm2 startup
# Run the command it outputs
```

---

### Step 11: Verify Deployment

**Check PM2 Status:**
```bash
pm2 status
# All three servers should show "online"

pm2 logs
# Check for any errors
```

**Test in Browser:**
- https://yourdomain.com (Landing Page)
- https://members.yourdomain.com (Member Portal)
- https://staff.yourdomain.com (Staff Portal)

---

## 🎉 Done!

Your Credit Cooperative System is now deployed!

### Common Commands

```bash
# View logs
pm2 logs

# Restart all apps
pm2 restart all

# Stop all apps
pm2 stop all

# Monitor resources
pm2 monit

# Reload nginx
sudo systemctl reload nginx

# View nginx errors
sudo tail -f /var/log/nginx/error.log
```

---

## 🆘 Having Issues?

1. Check PM2 logs: `pm2 logs`
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all services are running:
   - `pm2 status`
   - `sudo systemctl status nginx`
   - `sudo systemctl status postgresql`
4. See the full **DEPLOYMENT_GUIDE.md** for detailed troubleshooting

---

## 📝 Important Notes

- **Database password**: Must be the same in PostgreSQL and all .env files
- **JWT secrets**: Must be at least 64 characters long
- **Domain names**: Must be updated in Nginx configs and .env files
- **Firewall**: Make sure ports 80 and 443 are open
- **DNS**: Make sure your domain and subdomains point to your VPS IP

---

For detailed instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
For a complete checklist, see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
