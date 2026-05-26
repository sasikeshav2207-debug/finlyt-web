@echo off
REM ===========================================================
REM   Finlyt - one-click deploy of the landing page to GitHub
REM   Just double-click this file. It will:
REM     1. stage your changes  2. commit them  3. push to GitHub
REM   Your live site updates ~1 minute after a successful push.
REM ===========================================================

cd /d "C:\Users\sasik\OneDrive\Trading\FinLyt\Web"

echo ============================================
echo    Finlyt - Deploy landing page to GitHub
echo ============================================
echo.

REM Ask for a short description of the change (optional)
set "msg="
set /p "msg=Describe what you changed (or just press Enter): "
if "%msg%"=="" set "msg=Update landing page"

echo.
echo Staging changes...
git add -A

echo Committing: "%msg%"
git commit -m "%msg%"
if errorlevel 1 (
  echo.
  echo Nothing new to commit - your site is already up to date.
  echo.
  pause
  exit /b 0
)

echo.
echo Pushing to GitHub...
git push
if errorlevel 1 (
  echo.
  echo *** PUSH FAILED - read the message above. ***
  echo You may need to sign in again or renew your access token.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo    DONE! Your live site updates in ~1 minute:
echo    https://sasikeshav2207-debug.github.io/finlyt-web/
echo ============================================
echo.
pause
