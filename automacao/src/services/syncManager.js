import flowiseService from './flowiseService.js';
import FlowConverter from './flowConverter.js';
import axios from 'axios';

/**
 * Gerenciador de sincronização entre ReactFlow Editor e Flowise
 */
class SyncManager {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.syncIntervalId = null;
    this.isSyncing = false;
    this.syncCallbacks = [];
  }

  /**
   * Iniciar sincronização automática
   */
  startAutoSync(intervalMinutes = 5) {
    if (this.syncIntervalId) {
      this.stopAutoSync();
    }

    console.log(`🔄 Iniciando sync automático (${intervalMinutes}min)`);
    
    this.syncIntervalId = setInterval(async () => {
      await this.performFullSync();
    }, intervalMinutes * 60 * 1000);

    return true;
  }

  /**
   * Parar sincronização automática
   */
  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('⏹️ Sync automático interrompido');
    }
  }

  /**
   * Sincronizar fluxo do editor para Flowise
   */
  async syncFlowToFlowise(flowData, metadata = {}) {
    try {
      console.log(`🔄 Sincronizando fluxo para Flowise: ${metadata.name}`);

      // 1. Validar fluxo
      const validation = FlowConverter.validateFlow(flowData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          message: 'Fluxo inválido'
        };
      }

      // 2. Converter para formato Flowise
      const conversion = FlowConverter.reactFlowToFlowise(flowData, metadata);
      if (!conversion.success) {
        return conversion;
      }

      // 3. Criar ou atualizar chatflow no Flowise
      let result;
      if (metadata.chatflowId) {
        // Atualizar existente
        result = await flowiseService.updateChatflow(metadata.chatflowId, conversion.data);
      } else {
        // Criar novo
        result = await flowiseService.createChatflow(conversion.data);
        if (result.success) {
          metadata.chatflowId = result.data.id;
        }
      }

      // 4. Salvar mapeamento local
      if (result.success) {
        await this.saveFlowMapping({
          localFlowId: metadata.localFlowId,
          chatflowId: result.data.id || metadata.chatflowId,
          workspaceId: metadata.workspaceId,
          name: metadata.name,
          lastSync: new Date(),
          syncDirection: 'to_flowise'
        });

        this.notifySync('flow_synced', {
          flowId: metadata.localFlowId,
          chatflowId: result.data.id || metadata.chatflowId,
          direction: 'to_flowise'
        });
      }

      return {
        success: result.success,
        data: result.data,
        chatflowId: result.data?.id || metadata.chatflowId,
        message: result.message,
        warnings: validation.warnings
      };

    } catch (error) {
      console.error('❌ Erro na sincronização para Flowise:', error);
      return {
        success: false,
        error: error.message,
        message: 'Falha na sincronização'
      };
    }
  }

  /**
   * Importar chatflow do Flowise para o editor
   */
  async importFlowFromFlowise(chatflowId, workspaceId = null) {
    try {
      console.log(`📥 Importando chatflow ${chatflowId} do Flowise`);

      // 1. Buscar chatflow no Flowise
      const chatflowResponse = await flowiseService.getChatflow(chatflowId);
      if (!chatflowResponse.success) {
        return chatflowResponse;
      }

      // 2. Converter para formato ReactFlow
      const conversion = FlowConverter.flowiseToReactFlow(chatflowResponse.data);
      if (!conversion.success) {
        return conversion;
      }

      // 3. Salvar localmente
      const localFlowId = `flow_${Date.now()}`;
      await this.saveLocalFlow({
        localFlowId,
        chatflowId,
        workspaceId,
        name: conversion.metadata.name,
        flowData: conversion.data,
        metadata: conversion.metadata
      });

      // 4. Salvar mapeamento
      await this.saveFlowMapping({
        localFlowId,
        chatflowId,
        workspaceId,
        name: conversion.metadata.name,
        lastSync: new Date(),
        syncDirection: 'from_flowise'
      });

      this.notifySync('flow_imported', {
        flowId: localFlowId,
        chatflowId,
        direction: 'from_flowise'
      });

      return {
        success: true,
        data: conversion.data,
        metadata: conversion.metadata,
        localFlowId,
        message: 'Chatflow importado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro na importação do Flowise:', error);
      return {
        success: false,
        error: error.message,
        message: 'Falha na importação'
      };
    }
  }

  /**
   * Sincronização completa bidirecional
   */
  async performFullSync(workspaceId = null) {
    if (this.isSyncing) {
      console.log('⚠️ Sync já em andamento, aguardando...');
      return { success: false, message: 'Sincronização já em andamento' };
    }

    try {
      this.isSyncing = true;
      console.log('🔄 Iniciando sincronização completa');

      const results = {
        imported: 0,
        updated: 0,
        errors: 0,
        details: []
      };

      // 1. Buscar chatflows do Flowise
      const flowiseResponse = await flowiseService.getChatflows();
      if (!flowiseResponse.success) {
        throw new Error(`Erro ao buscar chatflows: ${flowiseResponse.error}`);
      }

      // 2. Buscar mapeamentos locais
      const localMappings = await this.getFlowMappings(workspaceId);

      // 3. Identificar novos chatflows para importar
      for (const chatflow of flowiseResponse.data) {
        const existingMapping = localMappings.find(m => m.chatflow_id === chatflow.id);
        
        if (!existingMapping) {
          // Importar novo chatflow
          try {
            const importResult = await this.importFlowFromFlowise(chatflow.id, workspaceId);
            if (importResult.success) {
              results.imported++;
              results.details.push({
                type: 'import',
                name: chatflow.name,
                success: true
              });
            } else {
              results.errors++;
              results.details.push({
                type: 'import',
                name: chatflow.name,
                success: false,
                error: importResult.error
              });
            }
          } catch (error) {
            results.errors++;
            results.details.push({
              type: 'import',
              name: chatflow.name,
              success: false,
              error: error.message
            });
          }
        } else {
          // Verificar se precisa atualizar
          const flowiseDate = new Date(chatflow.updatedDate);
          const localDate = new Date(existingMapping.last_sync);
          
          if (flowiseDate > localDate) {
            try {
              const updateResult = await this.updateLocalFromFlowise(
                existingMapping.local_flow_id,
                chatflow.id
              );
              
              if (updateResult.success) {
                results.updated++;
                results.details.push({
                  type: 'update',
                  name: chatflow.name,
                  success: true
                });
              } else {
                results.errors++;
                results.details.push({
                  type: 'update',
                  name: chatflow.name,
                  success: false,
                  error: updateResult.error
                });
              }
            } catch (error) {
              results.errors++;
              results.details.push({
                type: 'update',
                name: chatflow.name,
                success: false,
                error: error.message
              });
            }
          }
        }
      }

      this.notifySync('full_sync_completed', results);

      return {
        success: true,
        data: results,
        message: `Sync completo: ${results.imported} importados, ${results.updated} atualizados, ${results.errors} erros`
      };

    } catch (error) {
      console.error('❌ Erro na sincronização completa:', error);
      return {
        success: false,
        error: error.message,
        message: 'Falha na sincronização completa'
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Atualizar fluxo local com dados do Flowise
   */
  async updateLocalFromFlowise(localFlowId, chatflowId) {
    try {
      const importResult = await this.importFlowFromFlowise(chatflowId);
      if (importResult.success) {
        // Atualizar fluxo local existente
        await this.updateLocalFlow(localFlowId, {
          flowData: importResult.data,
          metadata: importResult.metadata,
          lastSync: new Date()
        });

        return {
          success: true,
          message: 'Fluxo local atualizado com sucesso'
        };
      }
      
      return importResult;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Falha ao atualizar fluxo local'
      };
    }
  }

  /**
   * Salvar mapeamento de fluxo
   */
  async saveFlowMapping(mappingData) {
    try {
      await axios.post(`${this.apiBaseUrl}/flows/mapping`, mappingData);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar mapeamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar mapeamentos de fluxos
   */
  async getFlowMappings(workspaceId = null) {
    try {
      const params = workspaceId ? `?workspace_id=${workspaceId}` : '';
      const response = await axios.get(`${this.apiBaseUrl}/flows/mappings${params}`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar mapeamentos:', error);
      return [];
    }
  }

  /**
   * Salvar fluxo local
   */
  async saveLocalFlow(flowData) {
    try {
      await axios.post(`${this.apiBaseUrl}/flows/local`, flowData);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar fluxo local:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Atualizar fluxo local
   */
  async updateLocalFlow(localFlowId, updateData) {
    try {
      await axios.put(`${this.apiBaseUrl}/flows/local/${localFlowId}`, updateData);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar fluxo local:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Adicionar callback de sincronização
   */
  onSync(callback) {
    this.syncCallbacks.push(callback);
  }

  /**
   * Remover callback de sincronização
   */
  offSync(callback) {
    this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Notificar callbacks sobre eventos de sync
   */
  notifySync(event, data) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ Erro no callback de sync:', error);
      }
    });
  }

  /**
   * Obter status da sincronização
   */
  getSyncStatus() {
    return {
      isAutoSyncActive: !!this.syncIntervalId,
      isSyncing: this.isSyncing,
      callbacksCount: this.syncCallbacks.length
    };
  }

  /**
   * Comparar fluxos para detectar diferenças
   */
  async compareFlows(localFlowData, chatflowId) {
    try {
      const chatflowResponse = await flowiseService.getChatflow(chatflowId);
      if (!chatflowResponse.success) {
        return { success: false, error: chatflowResponse.error };
      }

      const conversion = FlowConverter.flowiseToReactFlow(chatflowResponse.data);
      if (!conversion.success) {
        return conversion;
      }

      // Comparar estruturas (simplificado)
      const differences = {
        nodesAdded: [],
        nodesRemoved: [],
        nodesModified: [],
        edgesAdded: [],
        edgesRemoved: []
      };

      const localNodes = localFlowData.nodes || [];
      const remoteNodes = conversion.data.nodes || [];

      // Detectar nodes adicionados/removidos
      const localNodeIds = new Set(localNodes.map(n => n.id));
      const remoteNodeIds = new Set(remoteNodes.map(n => n.id));

      remoteNodes.forEach(node => {
        if (!localNodeIds.has(node.id)) {
          differences.nodesAdded.push(node);
        }
      });

      localNodes.forEach(node => {
        if (!remoteNodeIds.has(node.id)) {
          differences.nodesRemoved.push(node);
        }
      });

      return {
        success: true,
        data: differences,
        hasChanges: Object.values(differences).some(arr => arr.length > 0)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Falha na comparação'
      };
    }
  }
}

// Export singleton instance
const syncManager = new SyncManager();
export default syncManager;