import { useState, useEffect } from 'react';
import QRCodeViewer from '../components/QRCodeViewer';

const EvolutionManager = () => {
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInstance, setNewInstance] = useState({
    instanceName: '',
    hotel_uuid: '0cf84c30-82cb-11f0-bd40-02420a0b00b1', // Default hotel UUID
    webhook_url: '',
    integration: 'WHATSAPP-BAILEYS'
  });
  
  const API_BASE_URL = 'http://localhost:3001';

  // Carregar instâncias do banco de dados
  const loadInstances = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/evolution/database`);
      const data = await response.json();
      
      if (data.success) {
        setInstances(data.data);
      } else {
        console.error('Erro ao carregar instâncias:', data.error);
      }
    } catch (error) {
      console.error('Erro na API:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova instância
  const createInstance = async (e) => {
    e.preventDefault();
    
    if (!newInstance.instanceName.trim()) {
      alert('Nome da instância é obrigatório');
      return;
    }
    
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/evolution/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInstance)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Instância criada com sucesso!');
        setNewInstance({
          instanceName: '',
          hotel_uuid: '0cf84c30-82cb-11f0-bd40-02420a0b00b1',
          webhook_url: '',
          integration: 'WHATSAPP-BAILEYS'
        });
        loadInstances(); // Recarregar lista
      } else {
        alert('Erro ao criar instância: ' + (data.error?.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      alert('Erro ao criar instância');
    } finally {
      setCreating(false);
    }
  };

  // Deletar instância
  const deleteInstance = async (instanceName) => {
    if (!confirm(`Tem certeza que deseja deletar a instância "${instanceName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/evolution/delete/${instanceName}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Instância deletada com sucesso!');
        if (selectedInstance === instanceName) {
          setSelectedInstance(null);
        }
        loadInstances();
      } else {
        alert('Erro ao deletar instância: ' + (data.error?.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      alert('Erro ao deletar instância');
    }
  };

  // Carregar instâncias ao montar o componente
  useEffect(() => {
    loadInstances();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Gerenciador de Instâncias Evolution API
          </h1>
          <p className="mt-2 text-gray-600">
            Gerencie suas instâncias do WhatsApp através da Evolution API
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel esquerdo - Lista de instâncias e criação */}
        <div className="space-y-6">
          {/* Criar nova instância */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">
                Nova Instância
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={createInstance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome da Instância
                  </label>
                  <input
                    type="text"
                    value={newInstance.instanceName}
                    onChange={(e) => setNewInstance({...newInstance, instanceName: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="ex: hotel_principal"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Webhook URL (opcional)
                  </label>
                  <input
                    type="url"
                    value={newInstance.webhook_url}
                    onChange={(e) => setNewInstance({...newInstance, webhook_url: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="https://seu-webhook.com/evolution"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Integração
                  </label>
                  <select
                    value={newInstance.integration}
                    onChange={(e) => setNewInstance({...newInstance, integration: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="WHATSAPP-BAILEYS">WhatsApp Baileys</option>
                    <option value="WHATSAPP-BUSINESS">WhatsApp Business</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Criando...' : 'Criar Instância'}
                </button>
              </form>
            </div>
          </div>

          {/* Lista de instâncias */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Instâncias ({instances.length})
              </h2>
              <button
                onClick={loadInstances}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Atualizar
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando...</p>
                </div>
              ) : instances.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nenhuma instância encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {instances.map((instance) => (
                    <div
                      key={instance.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedInstance === instance.instance_name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedInstance(instance.instance_name)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {instance.instance_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ID: {instance.evolution_instance_id || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Criado em: {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          <div className="flex items-center mt-2">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              instance.active ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-gray-600">
                              {instance.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteInstance(instance.instance_name);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Deletar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Painel direito - QR Code Viewer */}
        <div>
          <QRCodeViewer 
            instanceName={selectedInstance}
            onStatusChange={(status) => {
              console.log(`Status da instância ${selectedInstance}:`, status);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EvolutionManager;