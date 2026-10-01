@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Run npm install first.
  pause
  exit /b 1
)
start "SME APP - API" cmd /k "npm run dev:api"
start "SME APP - ADMIN" cmd /k "npm run dev:admin"
start "SME APP - USER" cmd /k "npm run dev:user"
