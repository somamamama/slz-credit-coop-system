# API Configuration Guide for Deployment

## Overview

The Credit Cooperative System uses hardcoded localhost URLs in the frontend applications. Before deploying to production, you need to either:

1. **Update API URLs manually** in the source files, OR
2. **Use environment variables** (recommended)

## Option 1: Using Environment Variables (Recommended)

### Setup Steps

1. **Copy the example environment files:**

```bash
# Landing Page
cp landing-page/.env.production.example landing-page/.env.production

# Member Portal
cp member-portal/.env.production.example member-portal/.env.production

# Staff Portal
cp staff-portal/.env.production.example staff-portal/.env.production
```

2. **Update the URLs in each `.env.production` file:**

**landing-page/.env.production:**
```env
REACT_APP_API_URL=https://yourdomain.com
REACT_APP_SOCKET_URL=https://yourdomain.com
NODE_ENV=production
```

**member-portal/.env.production:**
```env
REACT_APP_API_URL=https://members.yourdomain.com
REACT_APP_SOCKET_URL=https://members.yourdomain.com
REACT_APP_PAYMONGO_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY
NODE_ENV=production
```

**staff-portal/.env.production:**
```env
REACT_APP_API_URL=https://staff.yourdomain.com
REACT_APP_SOCKET_URL=https://staff.yourdomain.com
NODE_ENV=production
```

3. **Update your code to use environment variables:**

You'll need to replace hardcoded URLs in your fetch/axios calls. For example:

**Before:**
```javascript
const response = await fetch('http://localhost:5000/api/members', {
    // ...
});
```

**After:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await fetch(`${API_URL}/api/members`, {
    // ...
});
```

### Create API Configuration Files

To make this easier, create a config file in each portal:

**staff-portal/src/config/api.js:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export { API_URL, SOCKET_URL };
```

Then in your components:
```javascript
import { API_URL } from '../config/api';

const response = await fetch(`${API_URL}/api/members`, {
    // ...
});
```

## Option 2: Manual URL Replacement

If you prefer not to use environment variables, you can use find-and-replace to update URLs before building:

### Staff Portal

Find and replace in all `src/**/*.js` files:
- `http://localhost:5000` → `https://staff.yourdomain.com`
- `http://localhost:3002` → `https://yourdomain.com` (if connecting to landing API)

### Member Portal

Find and replace in all `src/**/*.js` files:
- `http://localhost:5001` → `https://members.yourdomain.com`
- Any other localhost URLs → corresponding production URLs

### Landing Page

Find and replace in all `src/**/*.js` files:
- `http://localhost:5002` → `https://yourdomain.com`

## Important Files to Check

### Staff Portal
These files contain hardcoded localhost URLs:
- `src/pages/StaffDashboard.js`
- `src/pages/SavingsSetup.js`
- `src/pages/ManagerDashboard.js`
- `src/pages/LoanReview.js`
- `src/pages/LoanApproval.js`
- `src/pages/LoanAmounts.js`
- `src/pages/ImportDashboard.js`
- `src/pages/Dashboard.js`
- `src/pages/CreditInvestigatorDashboard.js`
- `src/pages/Reports.js`
- `src/pages/UserManagement.js`
- `src/pages/MemberAccounts.js`
- Any other files making API calls

### Member Portal
Check for API calls in:
- `src/pages/**/*.js`
- `src/components/**/*.js`
- Look for `fetch(` and `axios.` calls

### Landing Page
Check for API calls in:
- `src/pages/**/*.js`
- `src/components/**/*.js`

## Verification

After updating URLs and building:

1. **Check the build output** - The URLs should be embedded in the built JavaScript files
2. **Test in production** - All API calls should work properly
3. **Check browser console** - Look for any 404 or CORS errors

## Pro Tips

1. **Use environment variables** - Much easier to maintain
2. **Create a config file** - Centralize all API configuration
3. **Test locally first** - Build with production config and test with a local server
4. **Check CORS settings** - Make sure your backend allows requests from your production domain

## Troubleshooting

### API calls return 404
- Check that the API URLs in .env.production match your actual domain
- Verify the Nginx configuration is correctly proxying /api requests to the backend

### CORS errors
- Update CORS_ORIGIN in server .env.production files
- Restart the backend servers after updating environment variables

### Socket.IO not connecting
- Check SOCKET_URL environment variable
- Verify Nginx configuration includes Socket.IO proxy settings
- Check Socket.IO CORS settings in backend server

## Build Command

After configuring environment variables, build with:

```bash
# This will use .env.production automatically
npm run build
```

React will automatically load `.env.production` when `NODE_ENV=production`.

## Next Steps

1. Configure environment variables
2. Create API config utility files (optional but recommended)
3. Update source code to use environment variables
4. Test the build locally
5. Deploy to VPS
6. Verify all API calls work in production
