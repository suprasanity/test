@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Installe Node.js 22 ou plus depuis https://nodejs.org & pause & exit /b 1)
if not exist node_modules (call npm install & if errorlevel 1 exit /b 1)
start "" http://127.0.0.1:3000
call npm start
pause
