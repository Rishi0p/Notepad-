@echo off
title NoteForge
cd /d "%~dp0"

echo.
echo   ============================================
echo     NoteForge - Starting...
echo   ============================================
echo.

:: Ensure npm is available
where npm >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] npm not found on PATH.
  echo   Install Node.js from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

:: Install dependencies if missing
if not exist "node_modules\" (
  echo   Installing dependencies (first time only)...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   [ERROR] npm install failed.
    pause
    exit /b 1
  )
  echo.
)

echo   Starting dev server on http://localhost:1111 ...
echo   Close this window to stop NoteForge.
echo.
call npm run dev

if errorlevel 1 (
  echo.
  echo   [ERROR] NoteForge exited with an error.
  pause
)
