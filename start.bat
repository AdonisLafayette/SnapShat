@echo off
title Snapstreak Restore
color 0B

echo ================================================
echo    Snapstreak Restore - Automated Tool
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Download the LTS version for Windows
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies for the first time...
    echo This may take 1-2 minutes...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo Please check your internet connection and try again
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

echo.
echo Starting Snapstreak Restore...
echo.
echo The app will open in your browser at http://localhost:5000
echo A Chrome window will open when you start processing friends.
echo.
echo To stop the app: Click "Stop Processing" or press Ctrl+C here
echo.

REM Wait 3 seconds then open browser in background
start /B cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000"

REM Run the dev server in foreground
npm run dev
