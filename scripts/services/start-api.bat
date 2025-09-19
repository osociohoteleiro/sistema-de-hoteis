@echo off
echo.
echo ==============================================
echo  OSH - Iniciar API Backend
echo ==============================================
echo.

echo 🚀 Iniciando API Backend na porta 3001...

cd /d "D:\APPS-OSH"
node scripts\services\pid-manager.js start api

if %errorlevel% equ 0 (
    echo.
    echo ✅ API Backend iniciada com sucesso!
    echo 📋 Health check: http://localhost:3001/api/health
    echo 📊 Status: npm run osh:status
    echo.
    pause
) else (
    echo.
    echo ❌ Falha ao iniciar API Backend
    echo.
    echo 🔧 Solução de problemas:
    echo   1. Verificar se PostgreSQL está rodando
    echo   2. Verificar se Redis está rodando
    echo   3. Verificar configurações .env
    echo   4. Executar: npm run osh:kill-force
    echo.
    pause
)
