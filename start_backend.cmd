@echo off
REM ListAcrossEU v2 - Correct Backend Startup Script
REM This script uses the project-local backend virtual environment.

echo Starting ListAcrossEU v2 Backend...
cd /d "C:\projects\listacrosseu_v2"

echo Changing to backend directory...
cd backend

echo Starting Django server on 127.0.0.1:8020...
.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8020

pause
