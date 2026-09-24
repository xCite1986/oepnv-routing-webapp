@echo off
echo ========================================================
echo  WienMobil ÖPNV Routing - Automatische Test-Ausfuehrung
echo ========================================================
echo.

echo [1/3] Backend Tests (pytest)...
cd /d "%~dp0backend"
call .\.venv\Scripts\pytest.exe -v
if %ERRORLEVEL% NEQ 0 (
    echo [FEHLER] Backend-Tests sind fehlgeschlagen!
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Frontend Tests (vitest)...
cd /d "%~dp0frontend"
call npm test
if %ERRORLEVEL% NEQ 0 (
    echo [FEHLER] Frontend-Tests sind fehlgeschlagen!
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Frontend Build Check (tsc && vite build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [FEHLER] Frontend-Build ist fehlgeschlagen!
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo  [ERFOLG] Alle lokalen Backend- und Frontend-Tests bestanden!
echo ========================================================
exit /b 0
