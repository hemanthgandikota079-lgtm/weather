#!/usr/bin/env pwsh
# Weather App - PowerShell Startup Script
# Run both frontend and backend servers

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Weather App - Development Server" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend will run on: http://localhost:3002" -ForegroundColor Green
Write-Host "Backend will run on: http://localhost:5000" -ForegroundColor Green
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file from .env.example first" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Copy .env.example to .env" -ForegroundColor Yellow
    Write-Host "2. Add your API keys" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if node_modules exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start backend in new PowerShell window
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm start" -WindowTitle "Weather App - Backend Server"

Start-Sleep -Seconds 2

# Start frontend in current window
Write-Host ""
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Write-Host "This window will show the dev server output" -ForegroundColor Cyan
Write-Host ""

npm run dev

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Frontend server stopped" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
}
