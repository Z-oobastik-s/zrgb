@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

REM В индекс только исходники сайта и конфиги (без node_modules, .next, out, локальных bat).
git add -- ^
  app ^
  components ^
  lib ^
  messages ^
  public ^
  .cursor ^
  .github ^
  package.json ^
  package-lock.json ^
  next.config.js ^
  tailwind.config.ts ^
  tsconfig.json ^
  postcss.config.js ^
  .eslintrc.json ^
  next-env.d.ts ^
  push.bat ^
  build-github.cmd ^
  .gitignore

if exist README.md git add README.md
if exist .env.example git add .env.example

git status
echo.
echo Дальше: git commit -m "ваше сообщение" и git push
echo Если первый раз, настройте: git remote add origin https://github.com/USER/REPO.git
endlocal
