import axios from 'axios';

class FlowiseService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_FLOWISE_URL || 'http://localhost:3000';
    this.apiKey = import.meta.env.VITE_FLOWISE_API_KEY;
    this.headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
    };
  }

  /**
   * Listar todos os chatflows do Flowise
   */
  async getChatflows() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/chatflows`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao buscar chatflows:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Buscar um chatflow específico
   */
  async getChatflow(chatflowId) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/chatflows/${chatflowId}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Erro ao buscar chatflow ${chatflowId}:`, error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Criar um novo chatflow
   */
  async createChatflow(chatflowData) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/chatflows`, chatflowData, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data,
        message: 'Chatflow criado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao criar chatflow:', error);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao criar chatflow'
      };
    }
  }

  /**
   * Atualizar um chatflow existente
   */
  async updateChatflow(chatflowId, chatflowData) {
    try {
      const response = await axios.put(`${this.baseUrl}/api/v1/chatflows/${chatflowId}`, chatflowData, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data,
        message: 'Chatflow atualizado com sucesso'
      };
    } catch (error) {
      console.error(`Erro ao atualizar chatflow ${chatflowId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao atualizar chatflow'
      };
    }
  }

  /**
   * Deletar um chatflow
   */
  async deleteChatflow(chatflowId) {
    try {
      await axios.delete(`${this.baseUrl}/api/v1/chatflows/${chatflowId}`, {
        headers: this.headers
      });
      return {
        success: true,
        message: 'Chatflow deletado com sucesso'
      };
    } catch (error) {
      console.error(`Erro ao deletar chatflow ${chatflowId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao deletar chatflow'
      };
    }
  }

  /**
   * Enviar mensagem para um chatflow (prediction)
   */
  async sendMessage(chatflowId, message, sessionId = null, overrideConfig = {}) {
    try {
      const payload = {
        question: message,
        ...(sessionId && { sessionId }),
        ...(Object.keys(overrideConfig).length > 0 && { overrideConfig })
      };

      const response = await axios.post(`${this.baseUrl}/api/v1/prediction/${chatflowId}`, payload, {
        headers: this.headers
      });

      return {
        success: true,
        data: response.data,
        message: 'Mensagem processada com sucesso'
      };
    } catch (error) {
      console.error(`Erro ao enviar mensagem para chatflow ${chatflowId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao processar mensagem'
      };
    }
  }

  /**
   * Fazer upload de documento para vector store
   */
  async uploadDocument(chatflowId, formData) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/vector/upsert/${chatflowId}`, formData, {
        headers: {
          ...this.headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        data: response.data,
        message: 'Documento enviado com sucesso'
      };
    } catch (error) {
      console.error(`Erro ao fazer upload para chatflow ${chatflowId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao enviar documento'
      };
    }
  }

  /**
   * Buscar histórico de conversas
   */
  async getChatHistory(chatflowId, sessionId = null, sort = 'DESC', startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams({
        sort,
        ...(sessionId && { sessionId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await axios.get(`${this.baseUrl}/api/v1/chatmessage/${chatflowId}?${params}`, {
        headers: this.headers
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Erro ao buscar histórico do chatflow ${chatflowId}:`, error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Testar conexão com Flowise
   */
  async testConnection() {
    try {
      // Tenta buscar a lista de chatflows como teste de conexão
      const response = await this.getChatflows();
      return {
        success: response.success,
        message: response.success ? 'Conexão com Flowise estabelecida' : 'Falha na conexão com Flowise',
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        message: 'Não foi possível conectar com Flowise',
        error: error.message
      };
    }
  }

  /**
   * Obter informações do sistema Flowise
   */
  async getSystemInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/version`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao buscar informações do sistema:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

// Export singleton instance
const flowiseService = new FlowiseService();
export default flowiseService;