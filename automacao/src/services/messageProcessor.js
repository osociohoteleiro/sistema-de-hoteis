import flowiseService from './flowiseService.js';
import axios from 'axios';

/**
 * Processador de mensagens que integra WhatsApp, Flowise e o sistema de automação
 */
class MessageProcessor {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.activeSessions = new Map(); // Gerenciar sessões ativas
  }

  /**
   * Processar mensagem recebida do WhatsApp
   */
  async processWhatsAppMessage(messageData) {
    try {
      const {
        instanceName,
        from,
        message,
        messageType = 'text',
        workspaceId,
        botId
      } = messageData;

      console.log(`📱 Processando mensagem de ${from} na instância ${instanceName}`);

      // 1. Buscar configuração do bot/workspace
      const botConfig = await this.getBotConfiguration(workspaceId, botId);
      if (!botConfig.success) {
        console.error('❌ Configuração do bot não encontrada');
        return this.createErrorResponse('Bot não configurado');
      }

      // 2. Processar mensagem através do Flowise
      const aiResponse = await this.processMessageWithFlowise(
        botConfig.data.chatflowId,
        message,
        from, // usar como sessionId
        botConfig.data.overrideConfig
      );

      if (!aiResponse.success) {
        console.error('❌ Erro no processamento Flowise:', aiResponse.error);
        return this.createFallbackResponse();
      }

      // 3. Formatar resposta para WhatsApp
      const formattedResponse = this.formatResponseForWhatsApp(aiResponse.data, messageType);

      // 4. Registrar conversa no histórico
      await this.saveConversationHistory({
        instanceName,
        from,
        userMessage: message,
        botResponse: formattedResponse.text,
        workspaceId,
        botId,
        timestamp: new Date()
      });

      return {
        success: true,
        data: formattedResponse,
        message: 'Mensagem processada com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro no processamento da mensagem:', error);
      return this.createErrorResponse('Erro interno do servidor');
    }
  }

  /**
   * Processar mensagem através do Flowise
   */
  async processMessageWithFlowise(chatflowId, message, sessionId, overrideConfig = {}) {
    try {
      // Verificar se existe sessão ativa
      const sessionKey = `${chatflowId}_${sessionId}`;
      let sessionData = this.activeSessions.get(sessionKey);

      if (!sessionData) {
        sessionData = {
          sessionId: sessionId,
          startTime: new Date(),
          messageCount: 0
        };
        this.activeSessions.set(sessionKey, sessionData);
      }

      sessionData.messageCount++;
      sessionData.lastMessage = new Date();

      // Processar mensagem no Flowise
      const response = await flowiseService.sendMessage(
        chatflowId,
        message,
        sessionId,
        overrideConfig
      );

      if (response.success) {
        console.log(`✅ Mensagem processada pelo Flowise - Sessão: ${sessionId}`);
      }

      return response;

    } catch (error) {
      console.error('❌ Erro no processamento Flowise:', error);
      return {
        success: false,
        error: error.message,
        message: 'Falha no processamento da IA'
      };
    }
  }

  /**
   * Buscar configuração do bot
   */
  async getBotConfiguration(workspaceId, botId) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/workspace/${workspaceId}/bot/${botId}/config`
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Fallback para configuração padrão se não encontrar
      console.warn('⚠️ Usando configuração padrão do bot');
      return {
        success: true,
        data: {
          chatflowId: botId, // Assumir que botId é o chatflowId
          overrideConfig: {}
        }
      };
    }
  }

  /**
   * Formatar resposta para envio via WhatsApp
   */
  formatResponseForWhatsApp(aiResponse, originalMessageType) {
    const response = {
      text: '',
      type: 'text',
      options: {}
    };

    // Extrair texto da resposta
    if (typeof aiResponse === 'string') {
      response.text = aiResponse;
    } else if (aiResponse.text) {
      response.text = aiResponse.text;
    } else if (aiResponse.content) {
      response.text = aiResponse.content;
    } else {
      response.text = 'Desculpe, não consegui processar sua mensagem.';
    }

    // Detectar se a resposta contém elementos especiais
    response.text = this.processSpecialElements(response.text);

    // Limitar tamanho da resposta (WhatsApp tem limite)
    if (response.text.length > 4096) {
      response.text = response.text.substring(0, 4090) + '...';
    }

    return response;
  }

  /**
   * Processar elementos especiais na resposta
   */
  processSpecialElements(text) {
    // Processar links, mentions, etc.
    let processedText = text;

    // Converter markdown para WhatsApp
    processedText = processedText
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold
      .replace(/\*(.*?)\*/g, '_$1_')     // Italic
      .replace(/`(.*?)`/g, '```$1```');  // Code

    return processedText;
  }

  /**
   * Salvar histórico da conversa
   */
  async saveConversationHistory(conversationData) {
    try {
      await axios.post(`${this.apiBaseUrl}/conversations/save`, conversationData);
      console.log('💾 Conversa salva no histórico');
    } catch (error) {
      console.warn('⚠️ Erro ao salvar conversa no histórico:', error.message);
      // Não falhar o processamento se o histórico falhar
    }
  }

  /**
   * Criar resposta de erro
   */
  createErrorResponse(message = 'Ocorreu um erro') {
    return {
      success: false,
      data: {
        text: `❌ ${message}. Tente novamente em alguns instantes.`,
        type: 'text'
      },
      error: message
    };
  }

  /**
   * Criar resposta de fallback
   */
  createFallbackResponse() {
    const fallbackMessages = [
      'Desculpe, não consegui processar sua mensagem no momento.',
      'Estou com dificuldades técnicas. Pode tentar novamente?',
      'Não entendi sua solicitação. Pode reformular?'
    ];

    const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

    return {
      success: true,
      data: {
        text: `🤖 ${randomMessage}`,
        type: 'text'
      }
    };
  }

  /**
   * Processar mensagens em lote
   */
  async processBatchMessages(messages) {
    const results = [];
    
    for (const messageData of messages) {
      try {
        const result = await this.processWhatsAppMessage(messageData);
        results.push({
          id: messageData.id,
          success: result.success,
          response: result.data,
          error: result.error
        });
      } catch (error) {
        results.push({
          id: messageData.id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      data: results,
      message: `Processadas ${results.length} mensagens`
    };
  }

  /**
   * Limpar sessões inativas
   */
  cleanupInactiveSessions(maxInactiveMinutes = 60) {
    const now = new Date();
    const inactiveThreshold = maxInactiveMinutes * 60 * 1000;

    for (const [sessionKey, sessionData] of this.activeSessions.entries()) {
      const inactiveTime = now.getTime() - sessionData.lastMessage.getTime();
      
      if (inactiveTime > inactiveThreshold) {
        this.activeSessions.delete(sessionKey);
        console.log(`🧹 Sessão inativa removida: ${sessionKey}`);
      }
    }

    console.log(`🧹 Limpeza concluída. Sessões ativas: ${this.activeSessions.size}`);
  }

  /**
   * Obter estatísticas das sessões
   */
  getSessionStats() {
    const now = new Date();
    let totalMessages = 0;
    const sessionStats = [];

    for (const [sessionKey, sessionData] of this.activeSessions.entries()) {
      totalMessages += sessionData.messageCount;
      
      sessionStats.push({
        sessionKey,
        sessionId: sessionData.sessionId,
        messageCount: sessionData.messageCount,
        startTime: sessionData.startTime,
        lastMessage: sessionData.lastMessage,
        duration: now.getTime() - sessionData.startTime.getTime()
      });
    }

    return {
      activeSessions: this.activeSessions.size,
      totalMessages,
      sessions: sessionStats
    };
  }

  /**
   * Testar processamento de mensagem
   */
  async testMessageProcessing(chatflowId, testMessage = 'Olá, como você pode me ajudar?') {
    try {
      console.log(`🧪 Testando processamento de mensagem para chatflow: ${chatflowId}`);
      
      const result = await this.processMessageWithFlowise(
        chatflowId,
        testMessage,
        'test-session-' + Date.now()
      );

      return {
        success: result.success,
        data: result.data,
        message: result.success ? 'Teste realizado com sucesso' : 'Teste falhou',
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Erro no teste de processamento'
      };
    }
  }
}

// Export singleton instance
const messageProcessor = new MessageProcessor();

// Configurar limpeza automática de sessões (a cada 30 minutos)
if (typeof window !== 'undefined') {
  setInterval(() => {
    messageProcessor.cleanupInactiveSessions();
  }, 30 * 60 * 1000);
}

export default messageProcessor;