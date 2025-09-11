#!/bin/bash
# Script para aplicar migrations em produção
# IMPORTANTE: Execute este script em produção para sincronizar o banco

echo "🚀 Iniciando sincronização de migrations para produção..."

# Aplicar migration principal
node sync-migrations-to-production.js production

echo "✅ Sincronização concluída!"
echo "🔍 Verificar logs acima para confirmar que todas as migrations foram aplicadas com sucesso"
