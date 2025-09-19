@echo off
echo.
echo ==============================================
echo  OSH - Force Stop All Services
echo ==============================================
echo.

echo 🛑 Parando TODOS os processos Node.js...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Processos Node.js finalizados
) else (
    echo ℹ️  Nenhum processo Node.js encontrado
)

echo.
echo 🛑 Parando processos npm...
taskkill /F /IM npm.cmd 2>nul
taskkill /F /IM npm 2>nul

echo.
echo 🔍 Verificando portas OSH...
echo.

set "ports=3001 5173 5174 5175 3002"
for %%p in (%ports%) do (
    echo Verificando porta %%p...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p') do (
        if not "%%a"=="" (
            echo   🛑 Finalizando PID %%a na porta %%p
            taskkill /F /PID %%a 2>nul
        )
    )
)

echo.
echo 🧹 Limpando cache npm...
npm cache clean --force 2>nul

echo.
echo ✅ Todos os serviços foram parados!
echo.
echo Para iniciar novamente:
echo   npm run osh:start
echo.
pause
