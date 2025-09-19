@echo off
echo.
echo ==============================================
echo  OSH - Iniciar Todos os Serviços
echo ==============================================
echo.

cd /d "D:\APPS-OSH"

echo 🚀 Iniciando todos os serviços OSH...
echo.

REM Iniciar API primeiro (dependência de outros serviços)
echo 1️⃣ Iniciando API Backend...
node scripts\services\pid-manager.js start api
if %errorlevel% neq 0 (
    echo ❌ Falha ao iniciar API - abortando
    goto :error
)
echo ✅ API iniciada
echo.

REM Aguardar um pouco para API estar pronta
echo ⏳ Aguardando API ficar pronta...
timeout /t 3 >nul

REM Iniciar frontends
echo 2️⃣ Iniciando Hotel-App...
node scripts\services\pid-manager.js start hotel-app
if %errorlevel% equ 0 (
    echo ✅ Hotel-App iniciada
) else (
    echo ⚠️ Falha ao iniciar Hotel-App
)
echo.

echo 3️⃣ Iniciando PMS...
node scripts\services\pid-manager.js start pms
if %errorlevel% equ 0 (
    echo ✅ PMS iniciada
) else (
    echo ⚠️ Falha ao iniciar PMS
)
echo.

echo 4️⃣ Iniciando Automação...
node scripts\services\pid-manager.js start automacao
if %errorlevel% equ 0 (
    echo ✅ Automação iniciada
) else (
    echo ⚠️ Falha ao iniciar Automação
)
echo.

echo 🎉 Processo de inicialização concluído!
echo.
echo 📊 Verificando status final...
node scripts\services\pid-manager.js status

echo.
echo 🌐 URLs dos serviços:
echo   API Backend:  http://localhost:3001/api/health
echo   Hotel-App:    http://localhost:5173
echo   PMS:          http://localhost:5175
echo   Automação:    http://localhost:5174
echo.
echo Para verificar status: npm run osh:status
echo Para parar todos:      npm run osh:stop
echo.
pause
exit /b 0

:error
echo.
echo ❌ Erro durante inicialização!
echo.
echo 🔧 Soluções recomendadas:
echo   1. Executar: npm run osh:kill-force
echo   2. Verificar se bancos estão rodando
echo   3. Tentar novamente: npm run osh:start
echo.
pause
exit /b 1
