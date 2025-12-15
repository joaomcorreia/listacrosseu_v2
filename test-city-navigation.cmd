@echo off
echo 🧱 ListAcrossEU v2 - Testing City Navigation Fix
echo.

echo 1. Checking if backend is running on port 8003...
netstat -ano | findstr :8003 >nul
if %errorlevel% equ 0 (
    echo ✅ Backend running on port 8003
) else (
    echo ❌ Backend not running. Start with: cd backend ^& python manage.py runserver 8003
    goto end
)

echo.
echo 2. Checking if frontend is running on port 3000...
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend running on port 3000
) else (
    echo ❌ Frontend not running. Start with: cd frontend ^& npm run dev
    goto end
)

echo.
echo 3. Testing new Next.js API route...
curl -s "http://localhost:3000/api/listings/search?city=braga&limit=3" | findstr "results" >nul
if %errorlevel% equ 0 (
    echo ✅ Next.js API route working
) else (
    echo ⚠️ Next.js API route may have issues
)

echo.
echo 4. Testing city-specific API route...
curl -s "http://localhost:3000/api/cities/braga?limit=3" | findstr "results" >nul
if %errorlevel% equ 0 (
    echo ✅ City-specific API route working
) else (
    echo ⚠️ City-specific API route may have issues
)

echo.
echo 📝 Manual Tests:
echo 1. Visit: http://localhost:3000/en/cities
echo 2. Click on a city (should go to /en/cities/cityslug)
echo 3. Verify businesses load on city pages
echo 4. Test /en/search?city=braga still works

:end
echo.
pause