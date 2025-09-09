@echo off
echo 📦 Criando arquivo para upload no Easypanel...

:: Criar diretório temporário para o zip
mkdir temp-easypanel 2>nul

:: Copiar arquivos necessários
echo ✅ Copiando API...
xcopy /E /I api temp-easypanel\api

echo ✅ Copiando PMS...
xcopy /E /I pms temp-easypanel\pms

echo ✅ Copiando Hotel-App...
xcopy /E /I hotel-app temp-easypanel\hotel-app

echo ✅ Copiando Automação...
xcopy /E /I automacao temp-easypanel\automacao

echo ✅ Copiando Extrator Rate Shopper...
xcopy /E /I extrator-rate-shopper temp-easypanel\extrator-rate-shopper

echo ✅ Copiando configurações Nginx...
xcopy /E /I nginx temp-easypanel\nginx

echo ✅ Copiando pasta backups...
mkdir temp-easypanel\backups 2>nul

echo ✅ Copiando arquivos de configuração...
copy docker-compose.production.yml temp-easypanel\
copy .env.production temp-easypanel\
copy build.sh temp-easypanel\
copy deploy.sh temp-easypanel\
copy DEPLOY.md temp-easypanel\
copy .gitignore temp-easypanel\ 2>nul

echo 🗜️ Compactando arquivo...
:: Usando PowerShell para criar ZIP
powershell "Compress-Archive -Path 'temp-easypanel\*' -DestinationPath 'OSH-System-Easypanel.zip' -Force"

:: Limpar diretório temporário
rmdir /S /Q temp-easypanel

echo ✅ Arquivo criado: OSH-System-Easypanel.zip
echo 📤 Pronto para upload no Easypanel!
pause