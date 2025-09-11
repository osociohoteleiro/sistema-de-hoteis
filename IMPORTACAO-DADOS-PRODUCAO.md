# 📋 Guia de Importação de Dados para Produção

## 🎯 Problema Identificado

Você configurou o sistema no EasyPanel, mas ao acessar `https://pms.osociohoteleiro.com.br/rate-shopper/properties` não vê nenhuma propriedade cadastrada, embora existam no banco local.

## 🔍 Causa do Problema

- O banco de produção no EasyPanel está vazio ou não tem as propriedades do Rate Shopper
- Os dados estão apenas no seu banco local e não foram migrados para produção

## 🛠️ Solução: Script de Importação

Criamos um script especializado `import-production-data.js` que importa dados do seu banco local para o banco de produção.

### 📁 Arquivos Criados:

1. **`import-production-data.js`** - Script principal de importação
2. **`api/.env.production-import.example`** - Template de configuração

## 🚀 Como Usar

### 1. Configurar Credenciais de Produção

```bash
# Copie o arquivo de exemplo
cp api/.env.production-import.example api/.env.production-import

# Edite o arquivo com suas credenciais de produção
nano api/.env.production-import
```

Configure as variáveis para o banco de produção no EasyPanel:

```env
# Banco de produção (EasyPanel)
PROD_POSTGRES_HOST=postgres
PROD_POSTGRES_PORT=5432
PROD_POSTGRES_USER=hotel_user
PROD_POSTGRES_PASSWORD=SUA_SENHA_DE_PRODUCAO
PROD_POSTGRES_DB=hotel_osh_db
PROD_POSTGRES_SSL=false
```

### 2. Executar a Importação

```bash
# Executar o script de importação
node import-production-data.js
```

## 📊 O Que o Script Faz

### ✅ Dados Importados:

1. **Propriedades do Rate Shopper** (`rate_shopper_properties`)
   - Eco Encanto Pousada
   - Outras propriedades cadastradas localmente
   - Mantém configurações como `is_main_property`, `platform`, etc.

2. **Histórico de Buscas** (opcional)
   - Buscas recentes e bem-sucedidas
   - Apenas como histórico, não executa novas buscas

### 🔍 Validações:

- Verifica se os hotéis existem na produção
- Evita duplicatas usando `ON CONFLICT`
- Mapeia IDs locais para IDs de produção
- Gera log detalhado da importação

## 🎯 Resultado Esperado

Após executar o script, você deve ver:

- ✅ Propriedades listadas em `https://pms.osociohoteleiro.com.br/rate-shopper/properties`
- ✅ Dashboard funcionando com dados
- ✅ Possibilidade de executar novas buscas

## 🔧 Troubleshooting

### ❌ Erro: "Não foi possível conectar ao banco de produção"

**Solução**: Verifique as credenciais no arquivo `.env.production-import`:
- Host correto (geralmente `postgres` no EasyPanel)
- Usuário e senha configurados no EasyPanel
- Nome do banco correto

### ❌ Erro: "Hotel não encontrado na produção"

**Solução**: Execute primeiro a inicialização do banco de produção:
```bash
# No EasyPanel, acesse: https://api.seu-dominio.com/api/init-db-get
```

### ❌ Propriedades não aparecem após importação

**Solução**: 
1. Verifique se o usuário está associado ao hotel correto
2. Limpe o cache do navegador
3. Verifique os logs da API para erros de CORS

## 📋 Checklist Pós-Importação

- [ ] Propriedades aparecem na tela
- [ ] Dashboard carrega dados
- [ ] Possível executar novas buscas
- [ ] Gráficos funcionam
- [ ] Sem erros no console do navegador

## 🔄 Executar Novas Buscas

Após a importação, você pode:

1. Acessar `https://pms.osociohoteleiro.com.br/rate-shopper`
2. Ver suas propriedades listadas
3. Executar novas buscas de preços
4. Ver gráficos e análises

## 📞 Suporte

Se encontrar problemas:
1. Verifique o arquivo de log gerado: `import-production-log-YYYY-MM-DD.json`
2. Confirme as credenciais do banco de produção
3. Teste a conexão manualmente com ferramentas como `psql`

---

## 🎉 Resultado Final

Com este processo, seu Rate Shopper em produção terá:
- ✅ Todas as propriedades do banco local
- ✅ Configurações preservadas (propriedade principal, plataforma, etc.)
- ✅ Sistema funcional para novas análises de preços