#!/bin/bash
# Build script for Member Portal
# This script builds the React frontend for production

echo "🚀 Building Member Portal..."

# Navigate to member-portal directory
cd "$(dirname "$0")"

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install --production=false

# Build the React application
echo "🔨 Building React application..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Member Portal build completed successfully!"
    echo "📁 Build output is in: $(pwd)/build"
else
    echo "❌ Build failed! Please check for errors above."
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Copy the 'build' folder to your VPS at /var/www/credit-coop/member-portal/build"
echo "2. Ensure the server files are also copied to /var/www/credit-coop/member-portal/server"
echo "3. Install server dependencies with: cd server && npm install --production"
echo "4. Start the server with PM2 (see ecosystem.config.js)"
