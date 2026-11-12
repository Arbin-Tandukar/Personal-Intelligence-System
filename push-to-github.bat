@echo off
title Push PIS to GitHub
cd /d "%~dp0"

echo ==========================================================
echo        Pushing PIS to GitHub (Arbin-Tandukar)
echo ==========================================================
echo.
echo Remote target: https://github.com/Arbin-Tandukar/Personal-Intelligence-System.git
echo.
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
    echo  1. The repo exists at https://github.com/Arbin-Tandukar/Personal-Intelligence-System
    echo  2. You signed into the correct GitHub account in the prompt
    echo ==========================================================
)

echo.
pause
