@echo off
REM Build script for Member Portal (Windows)
REM This script builds the React frontend for production

echo Building Member Portal...

cd /d "%~dp0"

echo Installing dependencies...
call npm install --production=false

echo Building React application...
call npm run build

if exist "build\" (
    echo Member Portal build completed successfully!
    echo Build output is in: %cd%\build
) else (
    echo Build failed! Please check for errors above.
    exit /b 1
)

echo.
echo Next steps:
echo 1. Copy the 'build' folder to your VPS at /var/www/credit-coop/member-portal/build
echo 2. Ensure the server files are also copied to /var/www/credit-coop/member-portal/server
echo 3. Install server dependencies with: cd server ^&^& npm install --production
echo 4. Start the server with PM2 (see ecosystem.config.js)

pause
