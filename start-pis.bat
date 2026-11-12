@echo off
title Personal Intelligence System (PIS) Server
cd /d "%~dp0"

echo ==========================================================
echo        Personal Intelligence System (PIS)
echo ==========================================================
echo.
echo Starting PIS backend and mobile server on port 8000...
echo.

if not exist "venv\Scripts\python.exe" (
    echo Error: Python virtual environment not found in venv\
    pause
    exit /b 1
)

.\venv\Scripts\python.exe run.py
pause
