@echo off
:: ============================================================
:: Skyra GitHub Service — Start Script
:: ============================================================

title Start — Skyra GitHub Service
color 0E

echo.
echo  ================================================
echo   Starting Skyra-Tech GitHub Service
echo  ================================================
echo.

:: Check .env
if not exist ".env" (
    echo  ERROR: .env file not found!
    echo  Please run install.bat first.
    echo.
    pause
    exit /b 1
)

:: Run Express Development Server
echo  Launching server...
echo  Press Ctrl+C to stop.
echo.
call npm run dev

echo.
echo  Server stopped.
pause
