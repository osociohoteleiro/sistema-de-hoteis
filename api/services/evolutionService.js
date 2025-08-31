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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
        'DELETE FROM evolution_instances WHERE instance_name = ?',
        [instanceName]
      );

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