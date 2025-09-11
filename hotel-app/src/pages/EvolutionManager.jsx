import { useState, useEffect } from 'react';
import QRCodeViewer from '../components/QRCodeViewer';
import apiService from '../services/api';
import toast from 'react-hot-toast';

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
  
  // Carregar instâncias do banco de dados
  const loadInstances = async () => {
    setLoading(true);
    try {
      const data = await apiService.getEvolutionInstances();
      setInstances(data.instances || data.data || []);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast.error('Erro ao carregar instâncias: ' + (error.message || 'Erro desconhecido'));
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova instância
  const createInstance = async (e) => {
    e.preventDefault();
    
    if (!newInstance.instanceName.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }
    
    setCreating(true);
    try {
      const data = await apiService.createEvolutionInstance(newInstance);
      
      toast.success('Instância criada com sucesso!');
      setNewInstance({
        instanceName: '',
        hotel_uuid: '0cf84c30-82cb-11f0-bd40-02420a0b00b1',
        webhook_url: '',
        integration: 'WHATSAPP-BAILEYS'
      });
      loadInstances(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast.error('Erro ao criar instância: ' + (error.message || 'Erro desconhecido'));
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
      await apiService.deleteEvolutionInstance(instanceName);
      
      toast.success('Instância deletada com sucesso!');
      if (selectedInstance === instanceName) {
        setSelectedInstance(null);
      }
      loadInstances();
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      toast.error('Erro ao deletar instância: ' + (error.message || 'Erro desconhecido'));
    }
  };

  // Carregar instâncias ao montar o componente
  useEffect(() => {
    loadInstances();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h1 className="text-2xl font-bold text-white">
          Gerenciador de Instâncias Evolution API
        </h1>
        <p className="mt-2 text-sidebar-300">
          Gerencie suas instâncias do WhatsApp através da Evolution API
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel esquerdo - Lista de instâncias e criação */}
        <div className="space-y-6">
          {/* Criar nova instância */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-medium text-white">
                Nova Instância
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={createInstance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nome da Instância
                  </label>
                  <input
                    type="text"
                    value={newInstance.instanceName}
                    onChange={(e) => setNewInstance({...newInstance, instanceName: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ex: hotel_principal"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Webhook URL (opcional)
                  </label>
                  <input
                    type="url"
                    value={newInstance.webhook_url}
                    onChange={(e) => setNewInstance({...newInstance, webhook_url: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://seu-webhook.com/evolution"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Integração
                  </label>
                  <select
                    value={newInstance.integration}
                    onChange={(e) => setNewInstance({...newInstance, integration: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="WHATSAPP-BAILEYS" className="bg-sidebar-800 text-white">WhatsApp Baileys</option>
                    <option value="WHATSAPP-BUSINESS" className="bg-sidebar-800 text-white">WhatsApp Business</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Criando...' : 'Criar Instância'}
                </button>
              </form>
            </div>
          </div>

          {/* Lista de instâncias */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">
                Instâncias ({instances.length})
              </h2>
              <button
                onClick={loadInstances}
                className="bg-primary-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-primary-500 transition-colors"
              >
                Atualizar
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-2 text-sidebar-400">Carregando...</p>
                </div>
              ) : instances.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sidebar-400">Nenhuma instância encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {instances.map((instance) => (
                    <div
                      key={instance.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedInstance === instance.instance_name
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-white/20 hover:border-white/30 hover:bg-white/5'
                      }`}
                      onClick={() => setSelectedInstance(instance.instance_name)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-white">
                            {instance.instance_name}
                          </h3>
                          <p className="text-sm text-sidebar-400">
                            ID: {instance.evolution_instance_id || 'N/A'}
                          </p>
                          <p className="text-sm text-sidebar-400">
                            Criado em: {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          <div className="flex items-center mt-2">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              instance.active ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-sidebar-300">
                              {instance.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteInstance(instance.instance_name);
                          }}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
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