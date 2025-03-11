@echo off
echo ===== Legal Time Tracker Setup =====
echo.

cd %~dp0\..\ || (
  echo Failed to change directory to legal-time-tracker
  goto error
)

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
  echo Error: Failed to install dependencies
  goto error
)

echo Installing cross-env (required for development mode)...
call npm install --save-dev cross-env
if %errorlevel% neq 0 (
  echo Error: Failed to install cross-env
  goto error
)

echo.
echo Setup completed successfully!
echo You can now run the Legal Time Tracker application using the shortcut.
goto end

:error
echo.
echo An error occurred during setup. Please check the messages above.
exit /b 1

:end
pause