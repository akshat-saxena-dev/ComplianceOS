@echo off
title ComplianceOS - Startup
color 0A

echo.
echo  ============================================
echo   ComplianceOS - Network Compliance Engine
echo   CIS Benchmark Audit Tool - Hackathon Build
echo  ============================================
echo.

:: Kill any old processes on ports 8000 / 3000 / 3001
echo [1/3] Clearing ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " 2^>nul') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

:: Start FastAPI backend in a new window
echo [2/3] Starting Python backend on http://localhost:8000 ...
start "ComplianceOS Backend (port 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

:: Wait for backend to be ready
timeout /t 3 /nobreak >nul

:: Start Next.js frontend in a new window
echo [3/3] Starting Next.js frontend on http://localhost:3000 ...
start "ComplianceOS Frontend (port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  Both servers are starting in separate windows.
echo.
echo  >> Backend API:   http://localhost:8000
echo  >> Frontend App:  http://localhost:3000
echo  >> Swagger Docs:  http://localhost:8000/docs
echo.
echo  Press any key to open the app in your browser...
pause >nul
start http://localhost:3000
