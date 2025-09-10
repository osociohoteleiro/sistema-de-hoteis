# 🔧 Configuração CORS para Bucket S3

## ❌ Problema Atual

```
Access to fetch at 'https://hoteloshia.s3.us-east-2.amazonaws.com/...' 
from origin 'http://localhost:5182' has been blocked by CORS policy
```

**Causa**: O bucket S3 `hoteloshia` não tem configuração CORS para aceitar uploads do browser.

---

## ✅ Solução: Configurar CORS no Bucket

### 1. **Acessar AWS Console**
1. Entre no [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Clique no bucket `hoteloshia`
3. Vá para a aba **"Permissions"**
4. Scroll até **"Cross-origin resource sharing (CORS)"**
5. Clique em **"Edit"**

### 2. **Adicionar Configuração CORS**
Cole esta configuração JSON:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:*",
            "https://localhost:*",
            "http://127.0.0.1:*",
            "https://127.0.0.1:*",
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-request-id"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### 3. **Salvar Configuração**
- Clique em **"Save changes"**
- Aguarde alguns minutos para propagação

---

## 🔒 Configuração de Bucket Policy (Opcional)

Se ainda der erro, adicione esta política no bucket:

1. Na mesma seção **"Permissions"**
2. Clique em **"Bucket policy"** 
3. Adicione:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::hoteloshia/*"
        }
    ]
}
```

---

## 🚀 Alternativa: Upload via Presigned URL

Se não conseguir alterar o bucket, podemos implementar upload via URL presignada:

```javascript
// Gerar URL presignada no backend
const presignedUrl = await getSignedUrl(s3Client, new PutObjectCommand({
    Bucket: 'hoteloshia',
    Key: 'app/file.jpg',
    ContentType: 'image/jpeg'
}), { expiresIn: 3600 });

// Upload direto no frontend
const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
});
```

---

## ✅ Verificar se Funcionou

Após configurar CORS:

1. **Teste upload**: `http://localhost:5182/configuracoes`
2. **Esperado**: Upload funciona sem erro CORS
3. **Console logs**: 
   ```
   🔄 Convertendo arquivo para ArrayBuffer...
   ✅ Arquivo convertido para buffer de X bytes
   📤 Enviando arquivo para S3...
   🎉 Upload concluído com sucesso!
   ```

---

## 🎯 Status Após Configuração

- ✅ **CORS configurado** - browser pode fazer uploads
- ✅ **URLs públicas** - arquivos acessíveis via HTTPS
- ✅ **Organização por pastas** - app/, hotel_nome/, etc
- ✅ **Nomes únicos** - sem conflitos de arquivo

**🚀 Sistema S3 100% funcional após configuração CORS!**