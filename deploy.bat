@echo off
echo ========================================================
echo   SAWYAN Website Auto-Deployer
echo ========================================================
echo.
echo Phase 1: Collecting all files...
git add .
echo.

echo Phase 2: Saving changes locally...
git commit -m "Auto-deploy: %date% %time%"
echo.

echo Phase 3: Uploading to Live Server (GitHub)...
git push origin main
echo.

echo ========================================================
echo   Done! Your changes are now live.
echo   Please wait 1-2 minutes for GitHub Pages to refresh.
echo ========================================================
pause
