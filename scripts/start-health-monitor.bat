@echo off
REM CAUA 24/7 Health Monitor Launcher
REM Runs in background and automatically restarts the dev server if it crashes

echo ============================================
echo   CAUA 24/7 Health Monitor
echo ============================================
echo.
echo Starting health monitor...
echo Monitor will check every 5 seconds
echo Logs will be written to: logs/health-monitor.log
echo.

REM Kill any existing monitor processes
taskkill /F /IM python.exe /T >nul 2>&1

REM Start the monitor in background
start "CAUA Health Monitor" /B python scripts/health-monitor.py

echo ✓ Health monitor started
echo.
echo To view logs:
echo   type logs/health-monitor.log
echo.
echo To stop the monitor:
echo   taskkill /F /IM python.exe
echo.
