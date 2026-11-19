@echo off
cd /d "%~dp0"
echo Memasang dependency bot...
npm install
if errorlevel 1 pause & exit /b 1
echo Memeriksa sintaks...
npm run check
if errorlevel 1 pause & exit /b 1
echo Menjalankan bot...
npm start
pause
