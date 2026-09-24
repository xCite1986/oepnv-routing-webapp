@echo off
echo ========================================================
echo  Starte Wien ÖPNV Routing Gesamtsystem lokal
echo ========================================================
echo.
echo [1/2] Starte Backend in neuem Fenster (Port 8000)...
start "Wien ÖPNV Backend" cmd /k "%~dp0start-backend.bat"

timeout /t 2 /nobreak >nul

echo [2/2] Starte Frontend in neuem Fenster (Port 5173)...
start "Wien ÖPNV Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo Beide Dienste gestartet!
echo - Webapp: http://localhost:5173
echo - API Docs (Swagger): http://localhost:8000/docs
echo.
