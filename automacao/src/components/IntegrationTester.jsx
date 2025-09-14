import { useState } from 'react';
import flowiseService from '../services/flowiseService';
import messageProcessor from '../services/messageProcessor';
import syncManager from '../services/syncManager';
import FlowConverter from '../services/flowConverter';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const IntegrationTester = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState('all');

  const addResult = (test, status, message, data = null) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      status,
      message,
      data,
      timestamp: new Date()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testFlowiseConnection = async () => {
    addResult('Flowise Connection', 'running', 'Testando conexão...');
    
    try {
      const result = await flowiseService.testConnection();
      
      if (result.success) {
        addResult('Flowise Connection', 'success', 'Conexão estabelecida com sucesso!');
        
        // Testar buscar chatflows
        const chatflowsResult = await flowiseService.getChatflows();
        addResult('Flowise Chatflows', 
          chatflowsResult.success ? 'success' : 'error', 
          `${chatflowsResult.data?.length || 0} chatflows encontrados`,
          chatflowsResult.data?.slice(0, 3) // Primeiros 3 para mostrar
        );
      } else {
        addResult('Flowise Connection', 'error', `Erro: ${result.error}`);
      }
    } catch (error) {
      addResult('Flowise Connection', 'error', `Exceção: ${error.message}`);
    }
  };

  const testFlowConverter = async () => {
    addResult('Flow Converter', 'running', 'Testando conversão de fluxos...');
    
    try {
      // Fluxo de teste simples
      const testFlow = {
        nodes: [
          {
            id: 'start-1',
            type: 'startNode',
            position: { x: 100, y: 100 },
            data: { label: 'Início' }
          },
          {
            id: 'message-1',
            type: 'messageNode',
            position: { x: 300, y: 100 },
            data: { 
              label: 'Mensagem',
              message: 'Olá! Como posso ajudá-lo?'
            }
          }
        ],
        edges: [
          {
            id: 'e1-2',
            source: 'start-1',
            target: 'message-1'
          }
        ]
      };

      // Testar conversão ReactFlow -> Flowise
      const toFlowiseResult = FlowConverter.reactFlowToFlowise(testFlow, {
        name: 'Teste de Conversão',
        category: 'Test'
      });

      if (toFlowiseResult.success) {
        addResult('Flow Converter (To Flowise)', 'success', 
          'Conversão ReactFlow → Flowise bem-sucedida',
          { nodeCount: testFlow.nodes.length }
        );

        // Testar conversão reversa (simular)
        const mockChatflow = {
          name: 'Test Flow',
          flowData: JSON.stringify({
            nodes: [
              {
                id: 'test-1',
                position: { x: 100, y: 100 },
                data: {
                  name: 'Chat Trigger',
                  label: 'Start'
                }
              }
            ],
            edges: []
          })
        };

        const fromFlowiseResult = FlowConverter.flowiseToReactFlow(mockChatflow);
        addResult('Flow Converter (From Flowise)', 
          fromFlowiseResult.success ? 'success' : 'error',
          fromFlowiseResult.message
        );
      } else {
        addResult('Flow Converter', 'error', toFlowiseResult.message);
      }
    } catch (error) {
      addResult('Flow Converter', 'error', `Erro: ${error.message}`);
    }
  };

  const testWebhookIntegration = async () => {
    addResult('Webhook Integration', 'running', 'Testando integração de webhooks...');
    
    try {
      // Testar endpoint de fila
      const queueResponse = await axios.get(`${API_BASE_URL}/webhooks/queue/pending`);
      
      addResult('Webhook Queue', 
        queueResponse.data.success ? 'success' : 'error',
        `${queueResponse.data.count || 0} mensagens pendentes na fila`
      );

      // Testar estatísticas
      const statsResponse = await axios.get(`${API_BASE_URL}/webhooks/queue/stats`);
      
      addResult('Webhook Stats', 
        statsResponse.data.success ? 'success' : 'error',
        `Estatísticas carregadas: ${statsResponse.data.data?.length || 0} status`
      );

    } catch (error) {
      addResult('Webhook Integration', 'error', `Erro: ${error.message}`);
    }
  };

  const testMessageProcessor = async () => {
    addResult('Message Processor', 'running', 'Testando processamento de mensagens...');
    
    try {
      // Obter primeiro chatflow disponível para teste
      const chatflowsResult = await flowiseService.getChatflows();
      
      if (chatflowsResult.success && chatflowsResult.data.length > 0) {
        const testChatflowId = chatflowsResult.data[0].id;
        
        const result = await messageProcessor.testMessageProcessing(
          testChatflowId,
          'Esta é uma mensagem de teste para verificar a integração'
        );

        addResult('Message Processor', 
          result.success ? 'success' : 'error',
          result.message,
          result.success ? { response: result.data } : null
        );
      } else {
        addResult('Message Processor', 'warning', 
          'Nenhum chatflow disponível para teste'
        );
      }
    } catch (error) {
      addResult('Message Processor', 'error', `Erro: ${error.message}`);
    }
  };

  const testSyncManager = async () => {
    addResult('Sync Manager', 'running', 'Testando gerenciador de sincronização...');
    
    try {
      const status = syncManager.getSyncStatus();
      
      addResult('Sync Status', 'success', 
        `Status: AutoSync ${status.isAutoSyncActive ? 'ativo' : 'inativo'}, ${status.callbacksCount} callbacks`
      );

      // Testar busca de mapeamentos
      const mappings = await syncManager.getFlowMappings();
      
      addResult('Flow Mappings', 'success', 
        `${mappings.length} mapeamentos de fluxo encontrados`
      );

    } catch (error) {
      addResult('Sync Manager', 'error', `Erro: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    addResult('Integration Test', 'running', 'Iniciando bateria completa de testes...');

    try {
      await testFlowiseConnection();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa entre testes

      await testFlowConverter();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await testWebhookIntegration();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await testMessageProcessor();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await testSyncManager();

      addResult('Integration Test', 'success', 'Todos os testes concluídos!');
      
      // Resumo dos resultados
      const results = testResults;
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      toast.success(`Testes finalizados: ${successCount} sucessos, ${errorCount} erros`);
      
    } catch (error) {
      addResult('Integration Test', 'error', `Erro geral: ${error.message}`);
      toast.error('Erro durante os testes');
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTest = async (testType) => {
    setIsRunning(true);
    
    switch (testType) {
      case 'flowise': await testFlowiseConnection(); break;
      case 'converter': await testFlowConverter(); break;
      case 'webhook': await testWebhookIntegration(); break;
      case 'processor': await testMessageProcessor(); break;
      case 'sync': await testSyncManager(); break;
      default: await runAllTests(); return;
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'running': return '🔄';
      default: return '⚪';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50';
      case 'error': return 'text-red-700 bg-red-50';
      case 'warning': return 'text-yellow-700 bg-yellow-50';
      case 'running': return 'text-blue-700 bg-blue-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-midnight-950 mb-2">
            Testador de Integração
          </h3>
          <p className="text-steel-700">
            Teste a integração entre Automação, Flowise e WhatsApp
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            disabled={isRunning}
            className="px-3 py-2 border border-sapphire-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sapphire-500"
          >
            <option value="all">Todos os Testes</option>
            <option value="flowise">Conexão Flowise</option>
            <option value="converter">Conversor de Fluxos</option>
            <option value="webhook">Webhooks</option>
            <option value="processor">Processador de Mensagens</option>
            <option value="sync">Gerenciador de Sync</option>
          </select>

          <button
            onClick={() => runSingleTest(selectedTest)}
            disabled={isRunning}
            className="bg-gradient-sapphire text-white px-4 py-2 rounded-lg hover:bg-midnight-700 transition-minimal shadow-sapphire-glow disabled:opacity-50"
          >
            {isRunning ? '🔄 Testando...' : '🧪 Executar Teste'}
          </button>

          <button
            onClick={clearResults}
            disabled={isRunning}
            className="bg-steel-100 text-steel-700 px-4 py-2 rounded-lg hover:bg-steel-200 transition-colors disabled:opacity-50"
          >
            🧹 Limpar
          </button>
        </div>
      </div>

      {/* Resultados dos Testes */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {testResults.length === 0 ? (
          <div className="text-center py-8 text-steel-600">
            <div className="text-4xl mb-4">🧪</div>
            <p>Nenhum teste executado ainda</p>
            <p className="text-sm mt-2">Clique em "Executar Teste" para começar</p>
          </div>
        ) : (
          testResults.map((result) => (
            <div key={result.id} className="bg-white/50 rounded-lg p-4 border border-sapphire-100">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getStatusIcon(result.status)}</span>
                  <div>
                    <h4 className="font-medium text-midnight-950">{result.test}</h4>
                    <p className="text-sm text-steel-700">{result.message}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                  <span className="text-xs text-steel-600">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {result.data && (
                <div className="mt-3 bg-gray-50 rounded p-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-steel-700 font-medium">
                      Dados do Teste
                    </summary>
                    <pre className="mt-2 text-xs text-steel-600 overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {testResults.length > 0 && (
        <div className="mt-6 pt-4 border-t border-sapphire-200/30">
          <div className="flex justify-between items-center text-sm text-steel-700">
            <span>Total de testes: {testResults.length}</span>
            <div className="flex space-x-4">
              <span className="text-green-700">
                ✅ {testResults.filter(r => r.status === 'success').length}
              </span>
              <span className="text-yellow-700">
                ⚠️ {testResults.filter(r => r.status === 'warning').length}
              </span>
              <span className="text-red-700">
                ❌ {testResults.filter(r => r.status === 'error').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationTester;