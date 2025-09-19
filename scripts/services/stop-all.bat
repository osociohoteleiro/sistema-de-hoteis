@echo off
echo.
echo ==============================================
echo  OSH - Parar Todos os Serviços
echo ==============================================
echo.

cd /d "D:\APPS-OSH"

echo 🛑 Parando todos os serviços OSH (graceful shutdown)...
echo.

REM Parar frontends primeiro
echo 1️⃣ Parando Automação...
node scripts\services\pid-manager.js stop automacao
echo.

echo 2️⃣ Parando PMS...
node scripts\services\pid-manager.js stop pms
echo.

echo 3️⃣ Parando Hotel-App...
node scripts\services\pid-manager.js stop hotel-app
echo.

REM Parar API por último (para não quebrar dependências)
echo 4️⃣ Parando API Backend...
node scripts\services\pid-manager.js stop api
echo.

echo 📊 Verificando status final...
node scripts\services\pid-manager.js status

echo.
echo ✅ Todos os serviços foram parados!
echo.
echo Para iniciar novamente: npm run osh:start
echo Para verificar status:  npm run osh:status
echo.
pause
