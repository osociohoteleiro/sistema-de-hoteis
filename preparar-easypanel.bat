@echo off
echo 📦 Preparando pastas individuais para Easypanel...

:: Criar diretório principal
mkdir easypanel-uploads 2>nul
cd easypanel-uploads

:: Limpar se existir
rmdir /S /Q api 2>nul
rmdir /S /Q pms 2>nul
rmdir /S /Q hotel-app 2>nul
rmdir /S /Q automacao 2>nul
rmdir /S /Q extrator-rate-shopper 2>nul

echo ✅ Copiando API...
xcopy /E /I ..\api api
echo   Arquivos API: Dockerfile, package.json, server.js, etc.

echo ✅ Copiando PMS...
xcopy /E /I ..\pms pms
echo   Arquivos PMS: Dockerfile, nginx.conf, package.json, src/, etc.

echo ✅ Copiando Hotel-App...
xcopy /E /I ..\hotel-app hotel-app
echo   Arquivos Hotel-App: Dockerfile, nginx.conf, package.json, src/, etc.

echo ✅ Copiando Automação...
xcopy /E /I ..\automacao automacao
echo   Arquivos Automação: Dockerfile, nginx.conf, package.json, src/, etc.

echo ✅ Copiando Extrator Rate Shopper...
xcopy /E /I ..\extrator-rate-shopper extrator-rate-shopper
echo   Arquivos Rate Shopper: Dockerfile, package.json, src/, etc.

cd..

echo.
echo 🎉 PASTAS CRIADAS COM SUCESSO!
echo.
echo 📁 Estrutura criada:
echo   📂 easypanel-uploads/
echo   ├── 📁 api/              ← Upload esta pasta para App "osh-api"
echo   ├── 📁 pms/              ← Upload esta pasta para App "osh-pms"  
echo   ├── 📁 hotel-app/        ← Upload esta pasta para App "osh-hotel-app"
echo   ├── 📁 automacao/        ← Upload esta pasta para App "osh-automacao"
echo   └── 📁 extrator-rate-shopper/ ← Upload esta pasta para App "osh-rate-shopper"
echo.
echo 📋 PRÓXIMOS PASSOS:
echo   1. Abra o Easypanel
echo   2. Crie PostgreSQL primeiro (Templates → Database → PostgreSQL)
echo   3. Crie Redis segundo (Templates → Database → Redis)
echo   4. Crie cada app individualmente uploadando as pastas
echo   5. Configure as variáveis de ambiente conforme EASYPANEL-SETUP.md
echo.
echo 📖 LEIA: EASYPANEL-SETUP.md para o passo-a-passo completo!
pause