@echo off
echo 🚀 Iniciando PostgreSQL + Redis para OSH Hotel System
echo.

echo 🔄 Parando containers existentes...
docker-compose -f docker-compose.dev.yml down

echo.
echo 🔄 Construindo e iniciando containers...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo ⏳ Aguardando inicialização dos bancos...
timeout /t 10

echo.
echo 📋 Status dos containers:
docker-compose -f docker-compose.dev.yml ps

echo.
echo ✅ Serviços disponíveis:
echo 🐘 PostgreSQL: localhost:5432
echo 🔴 Redis: localhost:6379  
echo 🌐 pgAdmin: http://localhost:8080 (admin@osh.com / osh_admin_2024)
echo 🌐 Redis Commander: http://localhost:8081
echo.
echo 💡 Para parar os serviços: docker-compose -f docker-compose.dev.yml down
pause