# 🔧 Guia de Instalação - OSH Booking Sync

## Passo a Passo Completo

### 1️⃣ Preparar o PMS OSH

**Antes de instalar a extensão, configure o backend:**

```bash
# 1. Vá para a pasta da API
cd D:\APPS-OSH\api

# 2. Certifique-se que está rodando
npm run dev
# ✅ Deve mostrar: "Server running on port 3001"
```

### 2️⃣ Instalar a Extensão no Chrome

1. **Abra o Google Chrome**

2. **Vá para a página de extensões:**
   - Digite na barra de endereços: `chrome://extensions/`
   - OU Clique nos 3 pontinhos > Mais ferramentas > Extensões

3. **Ative o Modo Desenvolvedor:**
   - No canto superior direito, ative a chave "Modo do desenvolvedor"

4. **Carregar a extensão:**
   - Clique em "Carregar extensão sem compactação"
   - Navegue até `D:\APPS-OSH\extensao-booking\src`
   - Selecione esta pasta e clique "Selecionar pasta"

5. **Verifique a instalação:**
   - A extensão deve aparecer na lista
   - Ícone deve aparecer na barra de ferramentas do Chrome

### 3️⃣ Configurar a Extensão

1. **Clique no ícone da extensão** na barra de ferramentas

2. **Na aba "Status", preencha:**
   - **ID do Hotel**: `1472070` (ou o ID do seu hotel)
   - **Token de Autenticação**: (será gerado no próximo passo)

3. **Gerar Token de Autenticação:**
   - Abra o PMS: `http://localhost:5175`
   - Faça login normalmente
   - Vá em Configurações > API (se existir)
   - OU use um token JWT válido do sistema

4. **Salvar configuração** e aguardar confirmação

### 4️⃣ Testar a Extensão

1. **Abra a extranet da Booking:**
   ```
   https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/home.html?hotel_id=1472070
   ```

2. **Faça login** com suas credenciais da Booking

3. **Aguarde a página carregar** completamente

4. **Verifique indicadores:**
   - Badge da extensão deve mostrar ✓
   - Pode aparecer uma notificação "Sincronizado com PMS OSH"

5. **Verificar no PMS:**
   - Vá para Rate Shopper no PMS
   - Os dados devem aparecer na nova aba "Extranet"

## ⚠️ Problemas Comuns

### "Extensão não carregou"
```bash
# Verificar se arquivos estão corretos:
dir D:\APPS-OSH\extensao-booking\src
# Deve mostrar: manifest.json, background/, content/, popup/, etc.
```

### "API não conecta"
```bash
# Verificar se API está rodando:
curl http://localhost:3001/health
# OU abra no navegador: http://localhost:3001
```

### "Token inválido"
- Verifique se o token é válido
- Tente fazer login novo no PMS
- Regenere o token se possível

### "Dados não aparecem"
- Aguarde 2-3 segundos após carregar página
- Verifique console do Chrome (F12)
- Ative modo debug na extensão

## 🔄 Atualizações da Extensão

Quando alterar o código da extensão:

1. **Vá para `chrome://extensions/`**
2. **Encontre "OSH Booking Sync"**
3. **Clique no botão de atualização (↻)**
4. **Ou descarregue e recarregue**

## 🧪 Modo Debug

Para desenvolvimento e troubleshooting:

1. **Na extensão, vá em Configurações**
2. **Ative "Modo Debug"**
3. **Abra console do Chrome (F12)**
4. **Navegue na extranet**
5. **Observe logs começando com 🔍, ✅, ❌**

## 📱 URLs de Teste

Use estas URLs para testar a extração:

```
Dashboard:
https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/home.html?hotel_id=1472070&ses=SEU_SESSION

Estatísticas:
https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/statistics/demand_data.html?hotel_id=1472070&ses=SEU_SESSION
```

## ✅ Checklist Final

- [ ] API OSH rodando na porta 3001
- [ ] Extensão instalada no Chrome
- [ ] Configuração salva com token válido
- [ ] Teste na extranet Booking funcionando
- [ ] Dados aparecem no PMS
- [ ] Badge da extensão mostra status ✓

## 🆘 Suporte

Se algo não funcionar:

1. **Verificar logs** no console (F12)
2. **Testar conexão** no popup da extensão
3. **Recarregar extensão** em chrome://extensions/
4. **Reiniciar API** se necessário
5. **Contatar suporte técnico** com screenshots dos erros

---

**Instalação concluída!** 🎉

A extensão agora sincroniza automaticamente dados da extranet Booking.com com o PMS OSH.