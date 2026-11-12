@echo off
title Stop Personal Intelligence System
echo Stopping PIS Python server processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo PIS server stopped.
timeout /t 2 >nul
