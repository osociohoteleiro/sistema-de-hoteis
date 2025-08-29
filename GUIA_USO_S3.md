# 🚀 Guia de Uso - Upload AWS S3

## ✅ Sistema Implementado e Funcional

O sistema de upload AWS S3 foi implementado e está pronto para uso na aplicação de hotéis.

---

## 📁 Como Funciona a Organização de Pastas

### 🏨 **Arquivos de Hotéis Específicos**
Quando você faz upload de uma imagem para um hotel específico, ela é salva em:
```
Bucket: hoteloshia
Pasta: {nome_do_hotel}/
Exemplo: hotel_marriott/1724967234_abc123.jpg
```

### 🏢 **Arquivos Gerais da Aplicação** 
Para logos e imagens da aplicação (sem hotel específico), são salvos em:
```
Bucket: hoteloshia  
Pasta: app/
Exemplo: app/1724967890_logo.png
```

---

## 🎯 Exemplos Reais de Uso

### 1. **Upload do Logo da Empresa** ✅ IMPLEMENTADO
- **Local**: Configurações → Aba "Geral" → Logotipo da Empresa
- **Pasta no S3**: `app/`
- **URL**: `https://hoteloshia.s3.us-east-2.amazonaws.com/app/{arquivo}`

### 2. **Upload de Capa do Hotel** ✅ IMPLEMENTADO  
- **Local**: Hotéis → Editar Hotel → Imagem de Capa
- **Pasta no S3**: `{nome_do_hotel}/`
- **URL**: `https://hoteloshia.s3.us-east-2.amazonaws.com/{hotel_nome}/{arquivo}`

---

## 📋 Como Testar o Sistema

### Opção 1: **Teste com Logo da Empresa**
1. Acesse `http://localhost:5180/configuracoes`
2. Na aba "Geral", faça upload de uma imagem no "Logotipo da Empresa"
3. A imagem será salva em `app/` no bucket S3
4. Veja a URL gerada no console do browser (F12)

### Opção 2: **Teste com Hotel**
1. Acesse `http://localhost:5180/hoteis`
2. Edite um hotel existente
3. Faça upload de uma nova "Imagem de Capa do Hotel"
4. A imagem será salva na pasta do hotel específico
5. Exemplo: `hotel_exemplo/1724967234_capa.jpg`

### Opção 3: **Página de Teste**
1. Acesse `http://localhost:5180/teste-upload`
2. Digite o nome de um hotel
3. Faça upload de imagens ou PDFs
4. Veja onde foram salvos no S3

---

## 🔧 Configurações Técnicas

### **Credenciais AWS (já configuradas)**
```javascript
awsAccessKeyId: 'AKIA27ECEV5DUIEBSWMI'
awsSecretAccessKey: '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'  
awsRegion: 'us-east-2'
awsBucketName: 'hoteloshia'
```

### **Tipos de Arquivo Suportados**
- **Imagens**: JPG, PNG, WebP, AVIF
- **Documentos**: PDF  
- **Tamanho máximo**: 5MB por arquivo

### **URLs Públicas**
Todos os arquivos são acessíveis publicamente:
```
https://hoteloshia.s3.us-east-2.amazonaws.com/{pasta}/{arquivo}
```

---

## 📄 Arquivos Implementados

1. ✅ **`src/utils/imageUpload.js`** - Função `uploadToS3()`
2. ✅ **`src/context/AppContext.jsx`** - Configurações AWS S3  
3. ✅ **`src/hooks/useImageUpload.js`** - Hook com suporte a hotel
4. ✅ **`src/components/ImageUpload.jsx`** - UI com preview para PDF
5. ✅ **`src/pages/Settings.jsx`** - Logo da empresa
6. ✅ **`src/pages/EditHotel.jsx`** - Capa do hotel
7. ✅ **`src/components/TestUpload.jsx`** - Página de testes

---

## 🌟 Principais Funcionalidades

### ✅ **Organização Automática**
- Nome do hotel → pasta específica
- Sem hotel → pasta 'app' (geral)
- Normalização de nomes (minúsculo, sem caracteres especiais)

### ✅ **Nomes Únicos**
- Formato: `{timestamp}_{random}.{extensão}`
- Exemplo: `1724967234_abc123.jpg`
- Evita conflitos de nome

### ✅ **Metadados Completos**
- Nome original do arquivo
- Timestamp do upload  
- Hotel associado
- Tamanho do arquivo

### ✅ **Interface Moderna**
- Drag & drop
- Preview para imagens
- Ícone para PDFs
- Progress indicator
- Mensagens de sucesso/erro

---

## 🚀 **Status: SISTEMA TOTALMENTE FUNCIONAL**

O sistema de upload AWS S3 está **100% implementado** e pronto para uso em produção. Todas as funcionalidades solicitadas foram implementadas e testadas com sucesso!

### 🎯 **Próximos Passos Opcionais:**
1. **Compressão de imagens** (reduzir tamanho antes upload)
2. **Thumbnails automáticos** (versões menores)  
3. **Listagem de arquivos** (interface para ver/deletar)
4. **CDN CloudFront** (melhor performance global)