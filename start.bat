@echo off
title Snapstreak Restore

echo ================================================
echo    Snapstreak Restore - Automated Tool
echo ================================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo Please ensure Node.js is installed
        pause
        exit /b 1
    )
)

echo.
echo Starting Snapstreak Restore...
echo.
echo The app will open in your browser automatically.
echo A Chrome window will also open when you start processing.
echo.
echo To stop the app, close this window or press Ctrl+C
echo.

REM Start the server
call npm run dev

pause
