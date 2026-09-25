@echo off
echo ========================================================
echo  Netlify Release Tool - OMATA
echo ========================================================
echo.

echo [1/2] Baue Frontend fuer Production...
cd /d "%~dp0frontend"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [FEHLER] Frontend-Build fehlgeschlagen!
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Starte Netlify Deployment...
echo Hinweis: Beim ersten Mal wirst du im Browser nach deinem Netlify-Login gefragt.
echo.
call npx netlify-cli deploy --prod --dir=dist

echo.
echo ========================================================
echo  Deployment abgeschlossen!
echo ========================================================
pause
