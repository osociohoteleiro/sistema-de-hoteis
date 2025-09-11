# Relatório de Sincronização das Migrations

## 📋 Resumo da Análise

Após análise completa do banco PostgreSQL atual vs migrations existentes, foram identificadas **discrepâncias críticas** que podem causar problemas em produção.

### 🔍 Problemas Identificados

#### Tabelas no Banco SEM Migration Correspondente:
- `app_config` - Configurações da aplicação
- `bot_fields` - Campos personalizados de bots  
- `hotels` - **TABELA PRINCIPAL** - Estrutura de hotéis
- `meta_connected_accounts` - Contas Meta conectadas
- `onenode_bot_fields` - Campos OneNode
- `rate_shopper_dashboard_summary` - Summary dashboard (VIEW)
- `rate_shopper_latest_prices` - Últimos preços (VIEW)
- `user_hotels` - Relacionamento usuário-hotel
- `users` - **TABELA PRINCIPAL** - Usuários do sistema

#### Migrations Existentes mas Tabelas NÃO no Banco:
- `evolution_instances` - Sistema Evolution (não usado)
- `flowise_bots` - Bots Flowise (não usado)
- `onenode_workspaces` - Workspaces OneNode (não usado)
- `pms_motor_channel` - Canal PMS Motor (não usado)
- `systems_catalog` - Catálogo de sistemas (não usado)
- `manual_reports` - Relatórios manuais (não usado)
- `meta_credentials` - Credenciais Meta (alterado)
- E outras tabelas WhatsApp/Evolution não utilizadas

## 🛠️ Correções Implementadas

### Migrations Criadas:

1. **`000_init_postgresql_complete.sql`**
   - Migration base com extensões e tipos ENUM
   - Funções auxiliares
   - Estrutura fundamental

2. **`025_create_hotels_table.sql`**
   - Tabela principal de hotéis
   - Todos os campos e índices necessários

3. **`026_create_users_table.sql`**
   - Tabela principal de usuários
   - Sistema de autenticação completo

4. **`027_create_user_hotels_table.sql`**
   - Relacionamento usuário-hotel
   - Permissões e roles

5. **`028_create_app_config_table.sql`**
   - Configurações da aplicação
   - Configurações por hotel

6. **`029_create_bot_fields_table.sql`**
   - Campos personalizados para bots
   - Categorização e tipos

7. **`030_create_meta_connected_accounts_table.sql`**
   - Contas Meta/Facebook conectadas
   - Integração com sistema Meta

8. **`031_create_onenode_bot_fields_table.sql`**
   - Campos OneNode customizados
   - Configurações específicas

9. **`032_create_rate_shopper_views.sql`**
   - Views do Rate Shopper
   - Dashboard summary e latest prices

10. **`023_fix_rate_shopper_schema_production.sql`**
    - Correções para produção
    - Garantia de tipos ENUM
    - Colunas missing

## 🚀 Como Usar para Produção

### 1. Script de Sincronização
```bash
cd api
node sync-migrations-to-production.js production
```

### 2. Verificação Local
```bash
cd api
node sync-migrations-to-production.js local
```

### 3. Verificação da Estrutura
```bash
cd api
node compare-migrations-with-database.js
```

## ⚠️ Cuidados Importantes

### Para Produção:
1. **BACKUP** do banco antes de executar
2. Executar em horário de baixo tráfego
3. Verificar configurações de conexão
4. Testar em ambiente de staging primeiro

### Ordem de Execução:
1. `000_init_postgresql_complete.sql` (primeiro)
2. `025_create_hotels_table.sql` (tabela base)
3. `026_create_users_table.sql` (usuários)
4. `027_create_user_hotels_table.sql` (relacionamento)
5. Demais migrations em ordem numérica

## 📊 Status dos Módulos

### ✅ Módulos Ativos (com migrations completas):
- **API Principal** - ✅ Completo
- **Rate Shopper** - ✅ Completo  
- **Site Builder** - ✅ Completo
- **Meta Integration** - ✅ Completo
- **Bot System** - ✅ Completo

### ❌ Módulos Inativos (migrations não necessárias):
- Evolution API - Sistema não usado
- Flowise - Sistema não usado  
- OneNode Workspaces - Alterado para bot_fields
- PMS Motor - Sistema não usado
- WhatsApp Cloud - Implementação diferente

## 🎯 Resultado Esperado

Após executar todas as correções:
- ✅ Banco em produção ficará idêntico ao desenvolvimento
- ✅ Migrations refletirão exatamente o estado atual
- ✅ Novos deploys funcionarão corretamente
- ✅ Rollbacks serão possíveis com segurança

## 📝 Próximos Passos

1. Testar script em ambiente de desenvolvimento
2. Executar em staging
3. Aplicar em produção com backup
4. Validar funcionamento completo
5. Documentar processo para futuras versões