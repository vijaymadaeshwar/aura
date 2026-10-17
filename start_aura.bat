@echo off
echo ===================================================
echo  AURA MINI - Autonomous Reliability Agent
echo  Observe - Detect - Diagnose - Remediate - Verify
echo ===================================================
echo.

echo Starting Backend Server on http://localhost:8000 ...
start "AURA Mini Backend" cmd /k "cd /d "%~dp0backend" && python main.py"

echo Waiting 2 seconds for backend initialization...
timeout /t 2 /nobreak >nul

echo Starting Frontend Dashboard on http://localhost:3000 ...
start "AURA Mini Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo All services launched!
echo Open your browser at: http://localhost:3000
echo.
