@echo off
echo ========================================================
echo  Starte Wien ÖPNV Routing Backend (FastAPI auf Port 8000)
echo ========================================================
cd /d "%~dp0backend"
.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
