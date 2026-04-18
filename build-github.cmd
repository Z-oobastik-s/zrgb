@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM Как на GitHub Pages: замените my-repo на точное имя репозитория (как в URL github.io/USER/my-repo/)
set "BASE_PATH=/my-repo"
set "NODE_ENV=production"

if not exist "node_modules\next\package.json" (
  echo Сначала выполните: npm install
  exit /b 1
)

call npm run build
exit /b %errorlevel%
