const db = require('../config/database');
const evolutionService = require('./evolutionService');

class ContactsCacheService {
  constructor() {
    // Cache TTL: 24 horas para contatos existentes, 6 horas para não existentes
    this.CACHE_TTL_HOURS_EXISTS = 24;
    this.CACHE_TTL_HOURS_NOT_EXISTS = 6;

    // Rate limiting: no máximo 1 requisição por contato a cada 5 minutos
    this.RATE_LIMIT_MINUTES = 5;

    // Map para controlar requisições em andamento (evitar race conditions)
    this.ongoingRequests = new Map();
  }

  /**
   * Buscar dados do contato com cache inteligente
   */
  async getContactInfo(instanceName, phoneNumber) {
    try {
      // Validar parâmetros
      if (!instanceName || !phoneNumber) {
        throw new Error('instanceName e phoneNumber são obrigatórios');
      }

      // Sanitizar número de telefone
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const cleanInstanceName = instanceName.trim();

      if (!cleanPhoneNumber || !cleanInstanceName) {
        throw new Error('Parâmetros inválidos após sanitização');
      }

      // Validar formato do número
      if (cleanPhoneNumber.length < 8 || cleanPhoneNumber.length > 15) {
        console.warn(`⚠️ Número fora do padrão: ${cleanPhoneNumber}`);
        return {
          success: false,
          cached: false,
          error: 'Número de telefone inválido'
        };
      }

      // Detectar números problemáticos
      if (this.isProblematicNumber(cleanPhoneNumber)) {
        console.warn(`⚠️ Número problemático detectado: ${cleanPhoneNumber}`);
        return {
          success: false,
          cached: true,
          data: {
            name: null,
            picture: null,
            exists: false
          }
        };
      }

      const cacheKey = `${cleanInstanceName}-${cleanPhoneNumber}`;

      // Verificar se já existe uma requisição em andamento para evitar duplicatas
      if (this.ongoingRequests.has(cacheKey)) {
        console.log(`⏳ Aguardando requisição em andamento: ${cacheKey}`);
        return await this.ongoingRequests.get(cacheKey);
      }

      // 1. Verificar cache primeiro
      const cachedData = await this.getCachedContact(cleanInstanceName, cleanPhoneNumber);

      if (cachedData.success && cachedData.data && !cachedData.expired) {
        console.log(`✅ Cache hit: ${cleanPhoneNumber} (${Math.round(cachedData.ageHours)}h atrás)`);
        return {
          success: true,
          cached: true,
          data: {
            name: cachedData.data.contact_name,
            picture: cachedData.data.profile_picture_url,
            exists: cachedData.data.contact_exists
          },
          cacheAge: cachedData.ageHours
        };
      }

      // 2. Verificar rate limiting
      if (cachedData.success && cachedData.data && cachedData.withinRateLimit) {
        console.log(`🚫 Rate limit: ${cleanPhoneNumber} (última tentativa ${Math.round(cachedData.ageHours)}h atrás, min: ${this.RATE_LIMIT_MINUTES/60}h)`);
        return {
          success: true,
          cached: true,
          data: {
            name: cachedData.data.contact_name,
            picture: cachedData.data.profile_picture_url,
            exists: cachedData.data.contact_exists
          },
          rateLimited: true
        };
      }

      // 3. Fazer nova requisição para Evolution API
      console.log(`🔍 Cache miss/expired: ${cleanPhoneNumber}, buscando na Evolution API...`);

      // Marcar requisição em andamento
      const requestPromise = this.fetchAndCacheContact(cleanInstanceName, cleanPhoneNumber);
      this.ongoingRequests.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;
        return result;
      } finally {
        // Remover da lista de requisições em andamento
        this.ongoingRequests.delete(cacheKey);
      }

    } catch (error) {
      console.error('❌ Erro ao buscar informações do contato:', error);
      return {
        success: false,
        cached: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar se é um número problemático conhecido
   */
  isProblematicNumber(phoneNumber) {
    // Padrões problemáticos conhecidos
    const problematicPatterns = [
      /555552772/,           // Padrão específico problemático
      /(\d)\1{8,}/,          // Muitos dígitos iguais seguidos (9+ repetições)
      /^(\d)\1+$/,           // Número composto apenas por dígitos iguais
      /1{10,}/,              // Muitos 1s seguidos
      /0{8,}/,               // Muitos 0s seguidos
    ];

    // Números de 15 dígitos são suspeitos (geralmente IDs de grupo)
    if (phoneNumber.length === 15) {
      return true;
    }

    return problematicPatterns.some(pattern => pattern.test(phoneNumber));
  }

  /**
   * Buscar contato no cache
   */
  async getCachedContact(instanceName, phoneNumber) {
    try {
      const result = await db.query(`
        SELECT
          contact_name,
          profile_picture_url,
          contact_exists,
          last_updated,
          EXTRACT(EPOCH FROM (NOW() - last_updated)) / 3600 as age_hours
        FROM contacts_cache
        WHERE instance_name = $1 AND phone_number = $2
      `, [instanceName, phoneNumber]);

      if (result.length === 0) {
        return { success: false, data: null };
      }

      const contact = result[0];
      const ageHours = parseFloat(contact.age_hours);

      // Determinar TTL baseado na existência do contato
      const ttlHours = contact.contact_exists ? this.CACHE_TTL_HOURS_EXISTS : this.CACHE_TTL_HOURS_NOT_EXISTS;
      const rateLimitHours = this.RATE_LIMIT_MINUTES / 60;

      return {
        success: true,
        data: contact,
        ageHours: ageHours,
        expired: ageHours > ttlHours,
        withinRateLimit: ageHours < rateLimitHours
      };

    } catch (error) {
      console.error('❌ Erro ao buscar cache:', error);
      return { success: false, data: null };
    }
  }

  /**
   * Buscar na Evolution API e salvar no cache
   */
  async fetchAndCacheContact(instanceName, phoneNumber) {
    try {
      console.log(`🌐 Fazendo requisição para Evolution API: ${phoneNumber}`);

      // Buscar dados do contato na Evolution API
      const result = await evolutionService.fetchContact(instanceName, phoneNumber);

      let contactData = {
        name: null,
        picture: null,
        exists: false
      };

      if (result.success && result.data) {
        contactData = {
          name: result.data.name || result.data.verifiedName || null,
          picture: result.data.picture || result.data.profilePictureUrl || null,
          exists: true
        };
        console.log(`✅ Contato encontrado: ${phoneNumber} - ${contactData.name}`);
      } else {
        // Verificar se é erro 400 (contato não existe)
        if (result.error?.response?.message?.[0]?.exists === false) {
          console.log(`📞 Contato não existe: ${phoneNumber}`);
          contactData.exists = false;
        } else {
          console.log(`⚠️ Erro ao buscar contato: ${phoneNumber} - ${result.error?.message}`);
          // Para outros erros, não cachear como "não existe"
          return {
            success: false,
            cached: false,
            error: result.error?.message || 'Erro ao buscar contato'
          };
        }
      }

      // Salvar no cache
      await this.saveCachedContact(instanceName, phoneNumber, contactData);

      return {
        success: true,
        cached: false,
        data: contactData,
        freshData: true
      };

    } catch (error) {
      console.error(`❌ Erro ao buscar na Evolution API: ${phoneNumber}`, error);
      return {
        success: false,
        cached: false,
        error: error.message
      };
    }
  }

  /**
   * Salvar contato no cache
   */
  async saveCachedContact(instanceName, phoneNumber, contactData) {
    try {
      // 1. Salvar no cache primário
      await db.query(`
        INSERT INTO contacts_cache (
          instance_name,
          phone_number,
          contact_name,
          profile_picture_url,
          contact_exists,
          last_updated
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (instance_name, phone_number)
        DO UPDATE SET
          contact_name = EXCLUDED.contact_name,
          profile_picture_url = EXCLUDED.profile_picture_url,
          contact_exists = EXCLUDED.contact_exists,
          last_updated = NOW()
      `, [
        instanceName,
        phoneNumber,
        contactData.name,
        contactData.picture,
        contactData.exists
      ]);

      // 2. 🚀 SINCRONIZAR com whatsapp_contacts se o contato existir lá
      if (contactData.exists && (contactData.name || contactData.picture)) {
        await this.syncWithWhatsAppContacts(instanceName, phoneNumber, contactData);
      }

      console.log(`💾 Contato salvo no cache: ${phoneNumber}`);

    } catch (error) {
      console.error('❌ Erro ao salvar no cache:', error);
      // Não falhar a operação principal se o cache falhar
    }
  }

  /**
   * 🚀 NOVA FUNÇÃO: Sincronizar dados com tabela whatsapp_contacts
   */
  async syncWithWhatsAppContacts(instanceName, phoneNumber, contactData) {
    try {
      // Verificar se o contato existe na tabela whatsapp_contacts
      const existingContact = await db.query(`
        SELECT id, profile_picture_url, contact_name, last_sync_at
        FROM whatsapp_contacts
        WHERE instance_name = $1 AND phone_number = $2
      `, [instanceName, phoneNumber]);

      if (existingContact.length > 0) {
        const contact = existingContact[0];
        let needsUpdate = false;
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        // Verificar se nome precisa ser atualizado
        if (contactData.name && contactData.name !== contact.contact_name) {
          updateFields.push(`contact_name = $${paramCount++}`);
          updateValues.push(contactData.name);
          needsUpdate = true;
        }

        // Verificar se foto precisa ser atualizada
        if (contactData.picture && contactData.picture !== contact.profile_picture_url) {
          updateFields.push(`profile_picture_url = $${paramCount++}`);
          updateValues.push(contactData.picture);
          needsUpdate = true;
        }

        if (needsUpdate) {
          updateFields.push(`last_sync_at = NOW()`);
          updateValues.push(instanceName, phoneNumber);

          const query = `
            UPDATE whatsapp_contacts
            SET ${updateFields.join(', ')}
            WHERE instance_name = $${paramCount++} AND phone_number = $${paramCount++}
          `;

          await db.query(query, updateValues);
          console.log(`🔄 whatsapp_contacts sincronizado: ${phoneNumber}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar com whatsapp_contacts:', error);
      // Não falhar a operação principal se a sincronização falhar
    }
  }

  /**
   * Limpar cache expirado (função utilitária)
   */
  async cleanExpiredCache() {
    try {
      const result = await db.query(`
        DELETE FROM contacts_cache
        WHERE
          (contact_exists = true AND last_updated < NOW() - INTERVAL '${this.CACHE_TTL_HOURS_EXISTS} hours')
          OR
          (contact_exists = false AND last_updated < NOW() - INTERVAL '${this.CACHE_TTL_HOURS_NOT_EXISTS} hours')
      `);

      console.log(`🧹 Cache limpo: ${result.rowCount} registros removidos`);
      return result.rowCount;

    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      return 0;
    }
  }

  /**
   * Obter estatísticas do cache
   */
  async getCacheStats() {
    try {
      const stats = await db.query(`
        SELECT
          COUNT(*) as total_contacts,
          COUNT(CASE WHEN contact_exists = true THEN 1 END) as existing_contacts,
          COUNT(CASE WHEN contact_exists = false THEN 1 END) as non_existing_contacts,
          COUNT(CASE WHEN last_updated > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_contacts,
          AVG(EXTRACT(EPOCH FROM (NOW() - last_updated)) / 3600) as avg_age_hours
        FROM contacts_cache
      `);

      return stats[0];

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

module.exports = new ContactsCacheService();