@echo off
REM Deployment Script for Credit Cooperative System (Windows)
REM This script helps build all portals before deployment

echo ====================================================
echo   Credit Cooperative System - Build All
echo ====================================================
echo.

REM Build Landing Page
echo [1/3] Building Landing Page...
cd landing-page
call npm install --production=false
call npm run build
if errorlevel 1 (
    echo ERROR: Landing Page build failed!
    pause
    exit /b 1
)
cd ..
echo Landing Page build completed!
echo.

REM Build Member Portal
echo [2/3] Building Member Portal...
cd member-portal
call npm install --production=false
call npm run build
if errorlevel 1 (
    echo ERROR: Member Portal build failed!
    pause
    exit /b 1
)
cd ..
echo Member Portal build completed!
echo.

REM Build Staff Portal
echo [3/3] Building Staff Portal...
cd staff-portal
call npm install --production=false
call npm run build
if errorlevel 1 (
    echo ERROR: Staff Portal build failed!
    pause
    exit /b 1
)
cd ..
echo Staff Portal build completed!
echo.

echo ====================================================
echo   All builds completed successfully!
echo ====================================================
echo.
echo Next steps:
echo 1. Upload the build folders to your VPS
echo 2. Upload the server folders to your VPS
echo 3. Upload ecosystem.config.js to your VPS
echo 4. Follow the DEPLOYMENT_GUIDE.md for complete instructions
echo.
echo Use an SFTP client like FileZilla or WinSCP to upload files.
echo.
pause
