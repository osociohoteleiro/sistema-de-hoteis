@echo off
echo.
echo ==============================================
echo  OSH - Health Check All Services
echo ==============================================
echo.

set "ports=3001 5173 5174 5175 3002"
set "services=API Hotel-App Automacao PMS Extrator"

echo 🔍 Verificando portas dos serviços...
echo.

for %%p in (%ports%) do (
    set "service_name="
    if "%%p"=="3001" set "service_name=API Backend"
    if "%%p"=="5173" set "service_name=Hotel-App"
    if "%%p"=="5174" set "service_name=Automacao"
    if "%%p"=="5175" set "service_name=PMS"
    if "%%p"=="3002" set "service_name=Extrator"

    echo Verificando !service_name! (porta %%p)...

    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p') do (
        if not "%%a"=="" (
            echo   ✅ !service_name! está rodando (PID: %%a)
            goto :next_port
        )
    )
    echo   ❌ !service_name! não está rodando
    :next_port
)

echo.
echo 🌐 Testando endpoints de saúde...
echo.

curl -s "http://localhost:3001/api/health" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API Health Check: OK
) else (
    echo ❌ API Health Check: FALHOU
)

curl -s "http://localhost:5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Hotel-App: OK
) else (
    echo ❌ Hotel-App: FALHOU
)

curl -s "http://localhost:5174" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Automacao: OK
) else (
    echo ❌ Automacao: FALHOU
)

curl -s "http://localhost:5175" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PMS: OK
) else (
    echo ❌ PMS: FALHOU
)

echo.
echo 📊 Resumo do sistema:
echo.
echo Para gerenciar serviços:
echo   npm run osh:start    - Iniciar todos
echo   npm run osh:stop     - Parar todos
echo   npm run osh:restart  - Reiniciar todos
echo.
pause
