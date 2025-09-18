import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001/api';

const WorkspaceBots = () => {
  const { workspaceUuid } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    // Verificar se workspaceUuid é válido
    if (!workspaceUuid || workspaceUuid === 'undefined' || workspaceUuid === 'null') {
      console.error('WorkspaceUuid inválido:', workspaceUuid);
      toast.error('UUID do workspace inválido. Redirecionando para lista de workspaces...');
      setTimeout(() => {
        navigate('/workspaces');
      }, 2000);
      return;
    }

    loadWorkspaceData();
  }, [workspaceUuid, showActiveOnly, filterType, filterStatus, navigate]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Verificar novamente se o workspaceUuid é válido antes de fazer requisições
      if (!workspaceUuid || workspaceUuid === 'undefined' || workspaceUuid === 'null') {
        setLoading(false);
        return;
      }
      
      // Carregar workspace do localStorage primeiro
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        try {
          const parsedWorkspace = JSON.parse(savedWorkspace);
          setWorkspace(parsedWorkspace);
        } catch (parseError) {
          console.error('Erro ao parsear workspace do localStorage:', parseError);
          localStorage.removeItem('selectedWorkspace');
        }
      }

      // Carregar bots do workspace
      const params = new URLSearchParams();
      if (showActiveOnly) params.append('active', 'true');
      if (filterType) params.append('bot_type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      
      console.log('Fazendo requisição para workspace UUID:', workspaceUuid);
      const response = await axios.get(`${API_BASE_URL}/bots/workspace/${workspaceUuid}?${params}`);
      
      if (response.data.success) {
        setBots(response.data.data || []);
        console.log('Bots carregados:', response.data.data?.length || 0);
      } else {
        console.error('API retornou sucesso=false:', response.data);
        toast.error(response.data.message || 'Erro ao carregar bots');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do workspace:', error);
      
      if (error.response) {
        // Erro da API
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || 'Erro desconhecido da API';
        
        if (statusCode === 404) {
          toast.error(`Workspace não encontrado (UUID: ${workspaceUuid})`);
        } else if (statusCode === 400) {
          toast.error('Dados inválidos enviados para a API');
        } else {
          toast.error(`Erro da API (${statusCode}): ${errorMessage}`);
        }
      } else if (error.request) {
        // Erro de conexão
        toast.error('Erro ao conectar com a API. Verifique se o servidor está rodando na porta 3001.');
      } else {
        // Outros erros
        toast.error('Erro inesperado: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.bot_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'CHATBOT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AUTOMATION':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'WEBHOOK':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SCHEDULER':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'INTEGRATION':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'CHATBOT':
        return '💬';
      case 'AUTOMATION':
        return '⚡';
      case 'WEBHOOK':
        return '🔗';
      case 'SCHEDULER':
        return '⏰';
      case 'INTEGRATION':
        return '🔄';
      default:
        return '🤖';
    }
  };

  const handleBotAction = (bot, action) => {
    if (action === 'Configurar') {
      // Armazenar bot selecionado no localStorage
      localStorage.setItem('selectedBot', JSON.stringify(bot));
      
      // Redirecionar para página de fluxos do bot
      window.location.href = `/bot/${bot.bot_uuid}/flows`;
      return;
    }
    
    toast.success(`${action} do bot: ${bot.name}`);
    console.log(`${action} bot:`, bot);
  };

  if (loading) {
    return (
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
        <div className="animate-pulse">
          <div className="h-8 bg-sapphire-200/40 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-sapphire-200/40 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/workspaces"
                className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
              >
                ← Voltar aos Workspaces
              </Link>
              <span className="text-steel-400">|</span>
              <Link
                to={`/workspace/${workspaceUuid}/chat-ao-vivo`}
                className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
              >
                Chat ao Vivo
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-midnight-950">
              {workspace ? `Bots - ${workspace.name}` : 'Bots do Workspace'}
            </h1>
            <p className="text-steel-700 mt-2">
              {workspace ? `Hotel: ${workspace.hotel_nome}` : 'Gerencie os bots deste workspace'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-steel-700">
              {filteredBots.length} bot{filteredBots.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Campo de busca */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, descrição ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/70 border border-sapphire-200/40 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-sapphire-400/50 focus:border-transparent
                text-midnight-950 placeholder-steel-500"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white/70 border border-sapphire-200/40 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-sapphire-400/50"
            >
              <option value="">Todos os tipos</option>
              <option value="CHATBOT">Chatbot</option>
              <option value="AUTOMATION">Automação</option>
              <option value="WEBHOOK">Webhook</option>
              <option value="SCHEDULER">Agendador</option>
              <option value="INTEGRATION">Integração</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white/70 border border-sapphire-200/40 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-sapphire-400/50"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="DRAFT">Rascunho</option>
              <option value="ERROR">Erro</option>
            </select>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showActive"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-sapphire-200/40 text-sapphire-500"
              />
              <label htmlFor="showActive" className="text-sm font-medium text-steel-700">
                Apenas ativos
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Bots */}
      <div className="space-y-4">
        {filteredBots.length === 0 ? (
          <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-12 shadow-blue-elegant text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-midnight-950 mb-2">
              Nenhum bot encontrado
            </h3>
            <p className="text-steel-700">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca' 
                : 'Este workspace não possui bots configurados'
              }
            </p>
          </div>
        ) : (
          filteredBots.map((bot) => (
            <div
              key={bot.id}
              className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant
                hover:shadow-lg transition-all duration-300 hover:border-sapphire-300/50"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Nome e Badges */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(bot.bot_type)}</span>
                        <h3 className="text-xl font-semibold text-midnight-950">
                          {bot.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bot.status)}`}>
                          {bot.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(bot.bot_type)}`}>
                          {bot.bot_type}
                        </span>
                        <span className="text-sm text-steel-600">
                          ID: {bot.bot_uuid}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  {bot.description && (
                    <p className="text-steel-700 text-sm leading-relaxed">
                      {bot.description}
                    </p>
                  )}

                  {/* Configurações principais */}
                  {bot.configuration && Object.keys(bot.configuration).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(bot.configuration).slice(0, 3).map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 rounded text-xs
                            bg-white/50 text-steel-600 border border-sapphire-200/30"
                        >
                          <span className="font-medium">{key}:</span>
                          <span className="ml-1">
                            {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : 
                             typeof value === 'object' ? 'Configurado' : String(value).substring(0, 20)}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Informações Laterais e Ações */}
                <div className="flex flex-col lg:items-end gap-3 lg:min-w-[200px]">
                  {/* Data */}
                  <div className="text-right">
                    <div className="text-xs text-steel-500 mb-1">Criado em:</div>
                    <div className="text-sm text-steel-700">
                      {formatDate(bot.created_at)}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    {bot.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleBotAction(bot, 'Pausar')}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg
                          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      >
                        Pausar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBotAction(bot, 'Ativar')}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg
                          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                      >
                        Ativar
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleBotAction(bot, 'Configurar')}
                      className="px-3 py-1 bg-gradient-sapphire hover:bg-sapphire-600 text-white text-sm font-medium rounded-lg
                        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sapphire-400/50"
                    >
                      Configurar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer com estatísticas */}
      {bots.length > 0 && (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-4 shadow-blue-elegant">
          <div className="flex flex-wrap gap-6 text-sm text-steel-600">
            <div>
              <span className="font-medium">Total:</span> {bots.length} bots
            </div>
            <div>
              <span className="font-medium">Ativos:</span> {bots.filter(b => b.status === 'ACTIVE').length}
            </div>
            <div>
              <span className="font-medium">Rascunho:</span> {bots.filter(b => b.status === 'DRAFT').length}
            </div>
            <div>
              <span className="font-medium">Chatbots:</span> {bots.filter(b => b.bot_type === 'CHATBOT').length}
            </div>
            <div>
              <span className="font-medium">Automações:</span> {bots.filter(b => b.bot_type === 'AUTOMATION').length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceBots;