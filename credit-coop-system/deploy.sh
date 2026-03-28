#!/bin/bash
# Deployment Script for Credit Cooperative System
# This script helps deploy all portals to your VPS

# Configuration - UPDATE THESE VALUES
VPS_USER="your-username"
VPS_IP="your-vps-ip"
VPS_PATH="/var/www/credit-coop"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Credit Cooperative System - Deployment       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if configuration is set
if [ "$VPS_USER" == "your-username" ] || [ "$VPS_IP" == "your-vps-ip" ]; then
    echo -e "${RED}❌ Error: Please configure VPS_USER and VPS_IP in this script${NC}"
    exit 1
fi

# Function to check if build directory exists
check_build() {
    local portal=$1
    if [ ! -d "$portal/build" ]; then
        echo -e "${RED}❌ Build directory not found for $portal${NC}"
        echo -e "${YELLOW}Run: cd $portal && npm run build${NC}"
        return 1
    fi
    return 0
}

# Check all builds
echo -e "${BLUE}🔍 Checking builds...${NC}"
check_build "landing-page" || exit 1
check_build "member-portal" || exit 1
check_build "staff-portal" || exit 1
echo -e "${GREEN}✅ All builds found${NC}\n"

# Create directories on VPS
echo -e "${BLUE}📁 Creating directories on VPS...${NC}"
ssh $VPS_USER@$VPS_IP "mkdir -p $VPS_PATH/{landing-page/{build,server},member-portal/{build,server},staff-portal/{build,server},logs}"

# Upload Landing Page
echo -e "${BLUE}📤 Uploading Landing Page...${NC}"
scp -r landing-page/build/* $VPS_USER@$VPS_IP:$VPS_PATH/landing-page/build/
scp -r landing-page/server $VPS_USER@$VPS_IP:$VPS_PATH/landing-page/
scp landing-page/.env.production $VPS_USER@$VPS_IP:$VPS_PATH/landing-page/
echo -e "${GREEN}✅ Landing Page uploaded${NC}\n"

# Upload Member Portal
echo -e "${BLUE}📤 Uploading Member Portal...${NC}"
scp -r member-portal/build/* $VPS_USER@$VPS_IP:$VPS_PATH/member-portal/build/
scp -r member-portal/server $VPS_USER@$VPS_IP:$VPS_PATH/member-portal/
echo -e "${GREEN}✅ Member Portal uploaded${NC}\n"

# Upload Staff Portal
echo -e "${BLUE}📤 Uploading Staff Portal...${NC}"
scp -r staff-portal/build/* $VPS_USER@$VPS_IP:$VPS_PATH/staff-portal/build/
scp -r staff-portal/server $VPS_USER@$VPS_IP:$VPS_PATH/staff-portal/
echo -e "${GREEN}✅ Staff Portal uploaded${NC}\n"

# Upload PM2 ecosystem config
echo -e "${BLUE}📤 Uploading PM2 configuration...${NC}"
scp ecosystem.config.js $VPS_USER@$VPS_IP:$VPS_PATH/
echo -e "${GREEN}✅ PM2 config uploaded${NC}\n"

# Upload Nginx configs
echo -e "${BLUE}📤 Uploading Nginx configurations...${NC}"
scp -r nginx $VPS_USER@$VPS_IP:$VPS_PATH/
echo -e "${GREEN}✅ Nginx configs uploaded${NC}\n"

# Install dependencies on VPS
echo -e "${BLUE}📦 Installing dependencies on VPS...${NC}"
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
cd /var/www/credit-coop/landing-page/server && npm install --production
cd /var/www/credit-coop/member-portal/server && npm install --production
cd /var/www/credit-coop/staff-portal/server && npm install --production
ENDSSH
echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# Restart PM2 applications
echo -e "${BLUE}🔄 Restarting applications...${NC}"
ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js"
echo -e "${GREEN}✅ Applications restarted${NC}\n"

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Deployment completed successfully!        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. SSH into your VPS: ssh $VPS_USER@$VPS_IP"
echo -e "2. Check PM2 status: pm2 status"
echo -e "3. View logs: pm2 logs"
echo -e "4. Configure environment variables if needed"
echo -e "5. Setup Nginx and SSL certificates (see DEPLOYMENT_GUIDE.md)"
