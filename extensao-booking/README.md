# 🏨 OSH Booking Extranet Sync

Extensão Chrome para sincronizar dados da extranet Booking.com com o sistema PMS OSH em tempo real.

## 📋 Descrição

Esta extensão captura automaticamente dados da extranet da Booking.com (dashboard, estatísticas, relatórios) e sincroniza com o PMS OSH, permitindo visualizar todos os dados em um local centralizado.

## ✨ Funcionalidades

- ✅ **Captura Automática**: Extrai dados automaticamente ao navegar na extranet
- ✅ **Sincronização em Tempo Real**: Dados aparecem no PMS instantaneamente
- ✅ **Múltiplas Páginas**: Dashboard, estatísticas de demanda, relatórios
- ✅ **Indicadores Visuais**: Mostra status de sincronização na página
- ✅ **Configuração Simples**: Interface amigável para configuração
- ✅ **Seguro**: Não armazena credenciais, usa sessão do usuário

## 🚀 Como Instalar

### 1. Preparar Extensão
```bash
cd extensao-booking
# Não é necessário npm install - extensão usa apenas APIs nativas
```

### 2. Carregar no Chrome
1. Abra Chrome e vá em `chrome://extensions/`
2. Ative **Modo do desenvolvedor** (canto superior direito)
3. Clique em **Carregar extensão sem compactação**
4. Selecione a pasta `extensao-booking/src`
5. A extensão aparecerá na barra de ferramentas

### 3. Configurar Extensão
1. Clique no ícone da extensão
2. Digite o **ID do Hotel** (encontre no PMS)
3. Digite o **Token de Autenticação** (gere no PMS)
4. Clique em **Salvar Configuração**

## 🖥️ Como Usar

### Uso Básico
1. **Configure uma vez** a extensão com suas credenciais
2. **Navegue normalmente** na extranet Booking.com
3. **Dados são sincronizados automaticamente** em background
4. **Visualize no PMS** na seção Rate Shopper > Extranet

### Páginas Suportadas
- **Dashboard Principal**: `/manage/home.html` 
- **Estatísticas de Demanda**: `/manage/statistics/demand_data.html`
- Mais páginas podem ser adicionadas no futuro

### Indicadores Visuais
- 🟢 **Ponto Verde**: Sincronização ativa
- 🟡 **Ponto Amarelo**: API offline
- 🔴 **Ponto Vermelho**: Erro ou não configurado
- **Notificação Flutuante**: Confirmação de sincronização

## ⚙️ Configurações

### No Popup da Extensão
- **Sincronização Automática**: Ligar/desligar captura automática
- **Notificações**: Mostrar/ocultar notificações de sucesso
- **Modo Debug**: Logs detalhados no console

### No PMS OSH
- **Rate Shopper > Extranet**: Visualizar dados sincronizados
- **Configurações > API**: Gerar tokens de autenticação
- **Configurações > Hotel**: Encontrar ID do hotel

## 🔧 Estrutura do Projeto

```
extensao-booking/
├── manifest.json           # Configuração da extensão Chrome
├── package.json           # Metadados e scripts
├── README.md             # Este arquivo
├── .gitignore           # Arquivos ignorados
└── src/
    ├── background/
    │   └── service-worker.js    # Comunicação em background
    ├── content/
    │   └── extranet-detector.js # Detector de páginas e extrator
    ├── popup/
    │   ├── popup.html          # Interface do popup
    │   ├── popup.css           # Estilos do popup
    │   └── popup.js            # Lógica do popup
    ├── utils/
    │   ├── constants.js        # Constantes e configurações
    │   ├── storage.js          # Gerenciador de storage
    │   └── api-client.js       # Cliente para API OSH
    ├── styles/
    │   └── content.css         # Estilos injetados
    └── icons/
        └── icon.txt            # Placeholder para ícones
```

## 🔌 Integração com API

### Endpoints Utilizados
- `POST /api/booking-extranet/auth` - Autenticação
- `POST /api/booking-extranet/sync` - Sincronização de dados
- `GET /api/booking-extranet/status` - Status da conexão

### Formato dos Dados
```javascript
{
  type: 'dashboard_metrics',
  timestamp: '2024-01-15T10:30:00Z',
  url: 'https://admin.booking.com/...',
  metrics: {
    reservations: '45',
    revenue: '€ 12,450',
    occupancy: '78%'
  }
}
```

## 🐛 Troubleshooting

### Problemas Comuns

**❌ "Extensão não configurada"**
- Configure ID do hotel e token no popup da extensão

**❌ "API offline"**
- Verifique se o servidor PMS está rodando na porta 3001
- Teste conexão no popup da extensão

**❌ "Nenhum dado extraído"**
- A Booking pode ter mudado o layout da página
- Ative modo debug e verifique console

**❌ "Erro de permissão"**
- Verifique se token de autenticação está válido
- Regenere token no PMS se necessário

### Logs de Debug
1. Abra console do navegador (F12)
2. Ative **Modo Debug** na extensão
3. Navegue na extranet e observe logs
4. Procure por mensagens começando com `🔍`, `✅`, `❌`

## 📊 Monitoramento

### No Chrome
- Badge da extensão mostra status (✓, !, ❌)
- Popup mostra estatísticas de sincronização
- Console mostra logs detalhados

### No PMS
- Rate Shopper mostra dados em tempo real
- Logs de API no backend
- Métricas de sincronização

## 🔐 Segurança

- **Sem armazenamento de senhas**: Usa token temporário
- **Criptografia**: Comunicação HTTPS com API
- **Permissões mínimas**: Acesso apenas a admin.booking.com
- **Isolamento**: Extensão roda em contexto isolado

## 🚨 Limitações

- **Requer login ativo**: Usuário deve estar logado na extranet
- **Dependente de layout**: Mudanças na Booking podem quebrar extração
- **Chrome apenas**: Compatível apenas com navegadores Chromium
- **Rede local**: API deve estar acessível na rede

## 🔄 Updates Futuros

- [ ] Suporte para mais páginas da extranet
- [ ] Extração de dados históricos
- [ ] Notificações por email
- [ ] Sincronização offline (fila)
- [ ] Dashboard específico da extensão
- [ ] Suporte para múltiplos hotéis

## 📞 Suporte

- **Documentação**: Este README
- **Logs**: Console do navegador (F12)
- **Suporte técnico**: Equipe OSH
- **Issues**: Reporte problemas para equipe de desenvolvimento

---

**Versão**: 1.0.0  
**Compatibilidade**: Chrome 88+, Edge 88+  
**Autor**: OSH - Onscreen Hotels  
**Licença**: MIT  