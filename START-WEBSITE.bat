@echo off
setlocal
cd /d "%~dp0"
if not exist "portfolio-website\node_modules" (
  echo Installing website dependencies...
  call npm --prefix portfolio-website install
  if errorlevel 1 exit /b 1
)
echo Starting PIR Visuals website on the shared MongoDB database...
call npm run website
endlocal
