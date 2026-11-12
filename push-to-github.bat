@echo off
title Push PIS to GitHub
cd /d "%~dp0"

echo ==========================================================
echo        Pushing PIS to GitHub (Arbin-Tandukar)
echo ==========================================================
echo.
echo Remote target: https://github.com/Arbin-Tandukar/pis.git
echo.
echo NOTE: If you haven't created the repository yet, create an
echo empty repository named 'pis' at:
echo    https://github.com/new
echo.
echo Press any key when ready to push...
pause >nul

echo Pushing main branch...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ==========================================================
    echo  SUCCESS: PIS has been pushed to GitHub successfully!
    echo ==========================================================
) else (
    echo.
    echo ==========================================================
    echo  Push failed. Please ensure:
    echo  1. The repo 'pis' exists under github.com/Arbin-Tandukar
    echo  2. You signed into the correct GitHub account in the prompt
    echo ==========================================================
)

echo.
pause
