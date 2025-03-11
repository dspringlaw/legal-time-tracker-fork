@echo off
echo ===== Legal Time Tracker Launcher =====
echo.

cd %~dp0\..\ || (
  echo Failed to change directory to legal-time-tracker
  goto error
)

echo Starting application in development mode...
set ELECTRON_START_URL=http://localhost:3000
set NODE_ENV=development

:: First, check if something is already running on port 3000
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
  echo Port 3000 is already in use. Trying to use the existing server...
  call electron .
) else (
  call npm run electron:dev
)

if %errorlevel% neq 0 (
  echo.
  echo Error: Failed to start the application.
  echo.
  echo This might be because the application needs to be set up first.
  echo Please run Setup-Legal-Time-Tracker.bat to install dependencies.
  goto error
)

goto end

:error
echo.
pause
exit /b 1

:end
echo Application closed successfully.
pause