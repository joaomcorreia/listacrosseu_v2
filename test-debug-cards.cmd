@echo off
cd /d "C:\projects\listacrosseu_v2\frontend"

echo =======================================
echo  DEBUG TEST: Forms Not Changing Fix
echo =======================================
echo.
echo 1. Looking for debug marker "CARD-DEBUG-A" in browser
echo 2. Click any business card button (green/blue/orange)
echo 3. Check console logs for debug messages:
echo    - 🟢 FREE TIER CLAIM BUTTON CLICKED
echo    - 🔵 CLAIMED TIER VIEW DETAILS CLICKED  
echo    - 🟠 PREMIUM TIER VIEW DETAILS CLICKED
echo 4. Modal should open correctly for all tiers
echo.
echo Starting Next.js development server...
echo.

npm run dev