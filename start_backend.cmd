@echo off
REM ListAcrossEU v2 - Correct Backend Startup Script
REM This script uses the correct venv path and activation

echo Starting ListAcrossEU v2 Backend...
cd /d "C:\projects\listacrosseu_v2"

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Changing to backend directory...
cd backend

echo Starting Django server on 127.0.0.1:8000...
python manage.py runserver 127.0.0.1:8000

pause