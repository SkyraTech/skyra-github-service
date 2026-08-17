@echo off
:: ============================================================
:: Skyra GitHub Service — One-Click Installer for Windows
:: ============================================================

title Installer — Skyra GitHub Service
color 0E
echo.
echo  ================================================
echo   Skyra-Tech GitHub Service Installer
echo  ================================================
echo.

:: Check Node.js
echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Node.js not found!
    echo  Please install Node.js (v18+) from https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo  Node.js found!

:: Install npm dependencies
echo.
echo [2/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo  ERROR: npm install failed!
    pause
    exit /b 1
)
echo  Dependencies installed successfully!

:: Configure Env
echo.
echo [3/3] Setting up configuration...
if not exist ".env" (
    copy .env.example .env
    echo  Created .env file.
    echo.
    echo  ================================================
    echo   IMPORTANT: Open .env and add GITHUB_TOKEN!
    echo  ================================================
    echo.
    notepad .env
) else (
    echo  .env already exists.
)

echo.
echo  ================================================
echo   Installation Complete!
echo  ================================================
echo  Next steps:
echo  1. Ensure .env has GITHUB_TOKEN & GITHUB_USERNAME
echo  2. Double-click run.bat to start the server
echo.
pause
