@echo off
REM Weather App - Windows Startup Script
REM Run both frontend and backend servers

title Weather App - Development

echo ============================================
echo Weather App - Development Server
echo ============================================
echo.
echo Starting both frontend and backend servers...
echo.
echo Frontend will run on: http://localhost:3002
echo Backend will run on: http://localhost:5000
echo.

cd /d "%~dp0"

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please create .env file from .env.example first
    echo.
    echo Steps:
    echo 1. Copy .env.example to .env
    echo 2. Add your API keys
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
)

echo.
echo Starting servers...
echo.

REM Start backend in background
start "Weather App - Backend" cmd /k "npm start"

timeout /t 2 /nobreak

REM Start frontend
echo.
echo Starting frontend (this window will show dev server output)...
echo.
npm run dev

pause
