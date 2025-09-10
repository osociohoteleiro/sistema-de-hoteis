const axios = require('axios');
const db = require('../config/database');

class EvolutionService {
  constructor() {
    this.baseURL = process.env.EVOLUTION_HOST || 'https://osh-ia-evolution-api.d32pnk.easypanel.host';
    this.apiKey = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
  }

  /**
   * Criar instância na Evolution API e salvar no banco
   */
  async createInstance(instanceData) {
    try {
      console.log('🔄 Criando instância na Evolution API...');

      const {
        instanceName,
        hotel_uuid,
        webhook_url = null,
        integration = 'WHATSAPP-BAILEYS',
        qrcode = true,
        rejectCall = false,
        msgCall = 'Desculpe, não atendemos chamadas neste número.',
        groupsIgnore = false,
        alwaysOnline = true,
        readMessages = false,
        readStatus = false,
        syncFullHistory = false
      } = instanceData;

      // 1. Criar instância na Evolution API
      const evolutionPayload = {
        instanceName,
        integration,
        qrcode,
        rejectCall,
        msgCall,
        groupsIgnore,
        alwaysOnline,
        readMessages,
        readStatus,
        syncFullHistory
      };

      // Adicionar webhook se fornecido
      if (webhook_url) {
        evolutionPayload.webhook = {
          url: webhook_url,
          byEvents: true,
          base64: true,
          events: [
            'APPLICATION_STARTUP',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'MESSAGES_DELETE',
            'SEND_MESSAGE',
            'CONTACTS_UPSERT',
            'CONTACTS_UPDATE',
            'PRESENCE_UPDATE',
            'CHATS_UPSERT',
            'CHATS_UPDATE',
            'CHATS_DELETE',
            'GROUPS_UPSERT',
            'GROUP_UPDATE',
            'GROUP_PARTICIPANTS_UPDATE',
            'CONNECTION_UPDATE'
          ]
        };
      }

      const response = await axios.post(
        `${this.baseURL}/instance/create`,
        evolutionPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
          },
          timeout: 30000
        }
      );

      console.log('✅ Instância criada na Evolution:', response.data);

      // Extrair a API key individual da instância criada
      const instanceApiKey = response.data.hash || this.apiKey;
      
      // 2. Salvar no banco de dados
      const dbData = {
        instance_name: instanceName,
        api_key: instanceApiKey, // API key individual da instância
        hotel_uuid,
        host_url: this.baseURL,
        evolution_instance_id: response.data.instance?.instanceId || null,
        webhook_url,
        settings: JSON.stringify({
          integration,
          qrcode,
          rejectCall,
          msgCall,
          groupsIgnore,
          alwaysOnline,
          readMessages,
          readStatus,
          syncFullHistory,
          qrcode_data: response.data.qrcode || null // Salvar dados do QR Code
        }),
        active: true
      };

      await db.query(
        `INSERT INTO evolution_instances (
          instance_name, api_key, hotel_uuid, host_url, 
          evolution_instance_id, webhook_url, settings, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          dbData.instance_name,
          dbData.api_key,
          dbData.hotel_uuid,
          dbData.host_url,
          dbData.evolution_instance_id,
          dbData.webhook_url,
          dbData.settings,
          dbData.active
        ]
      );

      console.log('✅ Instância salva no banco de dados');

      // 3. Inserir/atualizar na tabela Integracoes
      try {
        // Verificar se já existe uma integração Evolution para este hotel
        const existingIntegrations = await db.query(`
          SELECT id, instancia_name FROM Integracoes 
          WHERE hotel_uuid = $1 AND integration_name = 'Evolution'
        `, [dbData.hotel_uuid]);
        
        if (existingIntegrations.length > 0) {
          // Atualizar integração existente
          await db.query(`
            UPDATE Integracoes SET
              apikey = $1,
              instancia_name = $2,
              url_api = $3
            WHERE hotel_uuid = $4 AND integration_name = 'Evolution'
          `, [
            dbData.api_key,
            dbData.instance_name,
            dbData.host_url,
            dbData.hotel_uuid
          ]);
          
          console.log(`✅ Integração Evolution atualizada para ${dbData.instance_name} (substituindo ${existingIntegrations[0].instancia_name})`);
        } else {
          // Criar nova integração
          await db.query(
            `INSERT INTO Integracoes (
              integration_name,
              hotel_uuid,
              apikey,
              instancia_name,
              url_api
            ) VALUES ($1, $2, $3, $4, $5)`,
            [
              'Evolution',
              dbData.hotel_uuid,
              dbData.api_key,
              dbData.instance_name,
              dbData.host_url
            ]
          );

          console.log('✅ Nova integração Evolution criada na tabela Integracoes');
        }
      } catch (integrationError) {
        console.warn('⚠️ Aviso: Erro ao processar integração na tabela Integracoes:', integrationError.message);
        // Não interrompe o processo, apenas registra o aviso
      }

      return {
        success: true,
        data: {
          ...response.data,
          database_saved: true
        }
      };

    } catch (error) {
      console.error('❌ Erro ao criar instância:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null
        }
      };
    }
  }

  /**
   * Conectar instância (obter QR Code)
   */
  async connectInstance(instanceName) {
    try {
      console.log(`🔄 Conectando instância: ${instanceName}`);

      const response = await axios.get(
        `${this.baseURL}/instance/connect/${instanceName}`,
        {
          headers: {
            'apikey': this.apiKey
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao conectar instância:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null
        }
      };
    }
  }

  /**
   * Verificar status da conexão
   */
  async getConnectionState(instanceName) {
    try {
      const response = await axios.get(
        `${this.baseURL}/instance/connectionState/${instanceName}`,
        {
          headers: {
            'apikey': this.apiKey
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null
        }
      };
    }
  }

  /**
   * Listar todas as instâncias do Evolution
   */
  async fetchInstances() {
    try {
      const response = await axios.get(
        `${this.baseURL}/instance/fetchInstances`,
        {
          headers: {
            'apikey': this.apiKey
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao listar instâncias:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null
        }
      };
    }
  }

  /**
   * Deletar instância
   */
  async deleteInstance(instanceName) {
    try {
      console.log(`🗑️ Deletando instância: ${instanceName}`);

      // 1. Deletar da Evolution API
      const response = await axios.delete(
        `${this.baseURL}/instance/delete/${instanceName}`,
        {
          headers: {
            'apikey': this.apiKey
          },
          timeout: 30000
        }
      );

      // 2. Remover do banco de dados
      await db.query(
        'DELETE FROM evolution_instances WHERE instance_name = $1',
        [instanceName]
      );

      // 3. Remover da tabela Integracoes
      try {
        await db.query(
          'DELETE FROM Integracoes WHERE integration_name = $1 AND instancia_name = $2',
          ['Evolution', instanceName]
        );

        console.log('✅ Integração Evolution removida da tabela Integracoes');
      } catch (integrationError) {
        console.warn('⚠️ Aviso: Erro ao remover da tabela Integracoes:', integrationError.message);
      }

      console.log('✅ Instância deletada com sucesso');

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao deletar instância:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null
        }
      };
    }
  }

  /**
   * Desconectar instância (logout)
   */
  async logoutInstance(instanceName) {
    try {
      console.log(`🔌 Desconectando instância: ${instanceName}`);

      const response = await axios.delete(
        `${this.baseURL}/instance/logout/${instanceName}`,
        {
          headers: {
            'apikey': this.apiKey
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao desconectar instância:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null
        }
      };
    }
  }

  /**
   * Importar instâncias existentes da Evolution API para o banco de dados
   */
  async importExistingInstances() {
    try {
      console.log('📥 Importando instâncias existentes da Evolution API...');

      // 1. Buscar todas as instâncias da Evolution API
      const result = await this.fetchInstances();
      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao buscar instâncias da Evolution API');
      }

      const evolutionInstances = result.data;
      console.log(`📊 Encontradas ${evolutionInstances.length} instâncias na Evolution API`);

      if (evolutionInstances.length === 0) {
        return {
          success: true,
          message: 'Nenhuma instância encontrada na Evolution API',
          data: { imported: 0, skipped: 0, errors: 0 }
        };
      }

      // 2. Buscar instâncias já existentes no banco
      const dbInstances = await db.query('SELECT instance_name, api_key FROM evolution_instances');
      const existingInstances = new Set();
      const existingApiKeys = new Set();
      
      dbInstances.forEach(instance => {
        existingInstances.add(instance.instance_name);
        existingApiKeys.add(instance.api_key);
      });

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      // 3. Para cada instância da Evolution, tentar importar
      for (const instance of evolutionInstances) {
        try {
          const instanceName = instance.name || instance.instance?.instanceName || instance.instanceName;
          const instanceId = instance.id || instance.instance?.instanceId || instance.instanceId;
          const apiKey = instance.token || instance.instance?.hash || instance.hash || instance.apikey;

          if (!instanceName) {
            console.warn(`⚠️ Instância sem nome encontrada:`, instance);
            errors++;
            continue;
          }

          // Verificar se já existe no banco (por nome ou API key)
          if (existingInstances.has(instanceName) || existingApiKeys.has(apiKey)) {
            console.log(`⏭️ Instância '${instanceName}' já existe no banco, pulando...`);
            skipped++;
            continue;
          }

          // Como não temos hotel_uuid da API, vamos deixar NULL para serem relacionadas depois
          const dbData = {
            instance_name: instanceName,
            api_key: apiKey || this.apiKey, // Usar API key da instância ou a global
            hotel_uuid: null, // Será relacionado manualmente depois
            host_url: this.baseURL,
            evolution_instance_id: instanceId || null,
            webhook_url: null,
            settings: JSON.stringify({
              integration: 'WHATSAPP-BAILEYS',
              qrcode: true,
              imported: true,
              imported_at: new Date().toISOString()
            }),
            active: true
          };

          await db.query(
            `INSERT INTO evolution_instances (
              instance_name, api_key, hotel_uuid, host_url, 
              evolution_instance_id, webhook_url, settings, active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              dbData.instance_name,
              dbData.api_key,
              dbData.hotel_uuid,
              dbData.host_url,
              dbData.evolution_instance_id,
              dbData.webhook_url,
              dbData.settings,
              dbData.active
            ]
          );

          console.log(`✅ Instância '${instanceName}' importada com sucesso`);
          imported++;

        } catch (instanceError) {
          console.error(`❌ Erro ao importar instância:`, instanceError);
          errors++;
        }
      }

      const summary = {
        success: true,
        message: `Importação concluída: ${imported} importadas, ${skipped} existentes, ${errors} erros`,
        data: {
          total: evolutionInstances.length,
          imported,
          skipped,
          errors,
          summary: `${imported} instâncias foram importadas com sucesso. ${skipped} já existiam no banco de dados.`
        }
      };

      console.log('✅ Importação concluída:', summary.data);
      return summary;

    } catch (error) {
      console.error('❌ Erro ao importar instâncias:', error);
      return {
        success: false,
        error: {
          message: error.message,
          details: 'Erro ao importar instâncias existentes da Evolution API'
        }
      };
    }
  }

  /**
   * Listar instâncias disponíveis para relacionamento
   */
  async getAvailableInstances() {
    try {
      console.log('📋 Buscando instâncias disponíveis...');
      
      // Buscar todas as instâncias do banco de dados
      const instances = await db.query(`
        SELECT 
          id,
          instance_name,
          api_key,
          hotel_uuid,
          evolution_instance_id,
          active,
          settings,
          created_at
        FROM evolution_instances 
        WHERE active = 1
        ORDER BY instance_name
      `);
      
      // Buscar informações dos hotéis relacionados
      const hotelUuids = instances
        .filter(instance => instance.hotel_uuid)
        .map(instance => instance.hotel_uuid);
      
      let hotels = [];
      if (hotelUuids.length > 0) {
        const placeholders = hotelUuids.map(() => '?').join(',');
        hotels = await db.query(`
          SELECT hotel_uuid as uuid, hotel_nome as name FROM hotels WHERE hotel_uuid IN (${placeholders})
        `, hotelUuids);
      }
      
      // Criar mapa de hotéis
      const hotelMap = new Map();
      hotels.forEach(hotel => {
        hotelMap.set(hotel.hotel_uuid, hotel.name);
      });
      
      // Processar instâncias
      const processedInstances = instances.map(instance => {
        let settings = {};
        try {
          settings = JSON.parse(instance.settings || '{}');
        } catch (e) {
          settings = {};
        }
        
        return {
          id: instance.id,
          instance_name: instance.instance_name,
          api_key: instance.api_key,
          hotel_uuid: instance.hotel_uuid,
          hotel_name: instance.hotel_uuid ? hotelMap.get(instance.hotel_uuid) : null,
          evolution_instance_id: instance.evolution_instance_id,
          is_related: !!instance.hotel_uuid,
          is_imported: !!settings.imported,
          created_at: instance.created_at,
          settings: settings
        };
      });
      
      console.log(`✅ Encontradas ${processedInstances.length} instâncias`);
      return {
        success: true,
        total: processedInstances.length,
        instances: processedInstances,
        message: 'Instâncias listadas com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao buscar instâncias disponíveis:', error);
      return {
        success: false,
        error: {
          message: error.message
        }
      };
    }
  }

  /**
   * Relacionar uma instância a um hotel
   */
  async relateInstanceToHotel(instanceName, hotelUuid) {
    try {
      console.log(`🔗 Relacionando instância ${instanceName} ao hotel ${hotelUuid}...`);
      
      // Verificar se o hotel existe
      const hotelRows = await db.query(`
        SELECT id, hotel_nome as name FROM hotels WHERE hotel_uuid = $1
      `, [hotelUuid]);
      
      if (hotelRows.length === 0) {
        throw new Error('Hotel não encontrado');
      }
      
      const hotel = hotelRows[0];
      
      // Verificar se a instância existe
      const instanceRows = await db.query(`
        SELECT id, instance_name, hotel_uuid FROM evolution_instances 
        WHERE instance_name = $1
      `, [instanceName]);
      
      if (instanceRows.length === 0) {
        throw new Error(`Instância '${instanceName}' não encontrada`);
      }
      
      const instance = instanceRows[0];
      
      // Verificar se a instância já está relacionada a outro hotel
      if (instance.hotel_uuid && instance.hotel_uuid !== hotelUuid) {
        throw new Error(`Instância '${instanceName}' já está relacionada a outro hotel`);
      }
      
      // Verificar se a instância já está relacionada a este hotel
      if (instance.hotel_uuid === hotelUuid) {
        throw new Error(`Instância '${instanceName}' já está relacionada a este hotel`);
      }
      
      // NOVA VALIDAÇÃO: Verificar se o hotel já possui uma instância relacionada
      const existingHotelInstances = await db.query(`
        SELECT instance_name FROM evolution_instances 
        WHERE hotel_uuid = $1 AND instance_name != $2
      `, [hotelUuid, instanceName]);
      
      if (existingHotelInstances.length > 0) {
        throw new Error(`Este hotel já possui uma instância Evolution relacionada: ${existingHotelInstances[0].instance_name}. Um hotel só pode ter uma instância por vez. Desrelacione a instância atual primeiro.`);
      }
      
      // Atualizar o relacionamento
      await db.query(`
        UPDATE evolution_instances SET
          hotel_uuid = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE instance_name = $2
      `, [hotelUuid, instanceName]);
      
      console.log(`✅ Instância ${instanceName} relacionada ao hotel ${hotel.name}`);
      
      // Criar/atualizar integração automaticamente
      try {
        const instanceData = await db.query(`
          SELECT api_key FROM evolution_instances WHERE instance_name = $1
        `, [instanceName]);
        
        if (instanceData.length > 0) {
          // Verificar se já existe uma integração Evolution para este hotel
          const existingIntegrations = await db.query(`
            SELECT id, instancia_name FROM Integracoes 
            WHERE hotel_uuid = $1 AND integration_name = 'Evolution'
          `, [hotelUuid]);
          
          if (existingIntegrations.length > 0) {
            // Atualizar integração existente
            await db.query(`
              UPDATE Integracoes SET
                apikey = $1,
                instancia_name = $2,
                url_api = $3
              WHERE hotel_uuid = $4 AND integration_name = 'Evolution'
            `, [
              instanceData[0].api_key,
              instanceName,
              this.baseURL,
              hotelUuid
            ]);
            
            console.log(`✅ Integração Evolution atualizada para ${instanceName} (substituindo ${existingIntegrations[0].instancia_name})`);
          } else {
            // Criar nova integração
            await db.query(`
              INSERT INTO Integracoes (
                integration_name,
                hotel_uuid,
                apikey,
                instancia_name,
                url_api
              ) VALUES ($1, $2, $3, $4, $5)
            `, [
              'Evolution',
              hotelUuid,
              instanceData[0].api_key,
              instanceName,
              this.baseURL
            ]);
            
            console.log(`✅ Nova integração Evolution criada para ${instanceName}`);
          }
        }
      } catch (integrationError) {
        console.warn('⚠️ Aviso: Erro ao criar integração:', integrationError.message);
      }
      
      return {
        success: true,
        instance_name: instanceName,
        hotel_uuid: hotelUuid,
        hotel_name: hotel.name,
        message: `Instância '${instanceName}' relacionada ao hotel '${hotel.name}' com sucesso`
      };
      
    } catch (error) {
      console.error(`❌ Erro ao relacionar instância ${instanceName}:`, error);
      return {
        success: false,
        error: {
          message: error.message
        }
      };
    }
  }

  /**
   * Desrelacionar uma instância de um hotel
   */
  async unrelateInstanceFromHotel(instanceName, hotelUuid) {
    try {
      console.log(`🔓 Desrelacionando instância ${instanceName} do hotel ${hotelUuid}...`);
      
      // Verificar se a instância está relacionada ao hotel especificado
      const instanceRows = await db.query(`
        SELECT id, instance_name, hotel_uuid FROM evolution_instances 
        WHERE instance_name = $1 AND hotel_uuid = $2
      `, [instanceName, hotelUuid]);
      
      if (instanceRows.length === 0) {
        throw new Error(`Instância '${instanceName}' não está relacionada a este hotel`);
      }
      
      // Remover o relacionamento
      await db.query(`
        UPDATE evolution_instances SET
          hotel_uuid = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE instance_name = $1 AND hotel_uuid = $2
      `, [instanceName, hotelUuid]);
      
      console.log(`✅ Instância ${instanceName} desrelacionada do hotel`);
      
      // Remover integração
      try {
        await db.query(`
          DELETE FROM Integracoes 
          WHERE integration_name = 'Evolution' 
          AND hotel_uuid = $1 
          AND instancia_name = $2
        `, [hotelUuid, instanceName]);
        
        console.log(`✅ Integração Evolution removida para ${instanceName}`);
      } catch (integrationError) {
        console.warn('⚠️ Aviso: Erro ao remover integração:', integrationError.message);
      }
      
      return {
        success: true,
        instance_name: instanceName,
        hotel_uuid: hotelUuid,
        message: `Instância '${instanceName}' desrelacionada com sucesso`
      };
      
    } catch (error) {
      console.error(`❌ Erro ao desrelacionar instância ${instanceName}:`, error);
      return {
        success: false,
        error: {
          message: error.message
        }
      };
    }
  }

  /**
   * Listar instâncias do banco de dados
   */
  async getInstancesFromDatabase(hotel_uuid = null) {
    try {
      let query = 'SELECT * FROM evolution_instances';
      let params = [];

      if (hotel_uuid) {
        query += ' WHERE hotel_uuid = ?';
        params.push(hotel_uuid);
      }

      query += ' ORDER BY created_at DESC';

      const instances = await db.query(query, params);

      return {
        success: true,
        data: instances
      };

    } catch (error) {
      console.error('❌ Erro ao buscar instâncias no banco:', error);
      
      return {
        success: false,
        error: {
          message: error.message
        }
      };
    }
  }
}

module.exports = new EvolutionService();