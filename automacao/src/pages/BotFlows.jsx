import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import FlowEditor from '../components/FlowEditor/FlowEditor';
import BotFieldsModal from '../components/Modals/BotFieldsModal';

const API_BASE_URL = 'http://localhost:3001/api';

const BotFlows = () => {
  const { botUuid } = useParams();
  const [bot, setBot] = useState(null);
  const [folders, setFolders] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null); // null = mostrar todos
  const [viewMode, setViewMode] = useState('folders'); // folders ou list
  const [selectedFlow, setSelectedFlow] = useState(null); // Flow selecionado para editar
  const [showNewFlowModal, setShowNewFlowModal] = useState(false);
  const [showBotFieldsModal, setShowBotFieldsModal] = useState(false);

  useEffect(() => {
    loadBotData();
  }, [botUuid, filterType, filterStatus]);

  const loadBotData = async () => {
    try {
      setLoading(true);
      
      // Carregar bot do localStorage primeiro
      const savedBot = localStorage.getItem('selectedBot');
      if (savedBot) {
        setBot(JSON.parse(savedBot));
      }

      // Carregar pastas do bot
      const foldersResponse = await axios.get(`${API_BASE_URL}/folders/bot/uuid/${botUuid}?active=true`);
      if (foldersResponse.data.success) {
        setFolders(foldersResponse.data.data);
      }

      // Carregar fluxos do bot
      const params = new URLSearchParams();
      params.append('active', 'true');
      if (filterType) params.append('flow_type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (selectedFolder) params.append('folder_id', selectedFolder);
      
      const flowsResponse = await axios.get(`${API_BASE_URL}/flows/bot/uuid/${botUuid}?${params}`);
      if (flowsResponse.data.success) {
        setFlows(flowsResponse.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do bot:', error);
      toast.error('Erro ao conectar com a API');
    } finally {
      setLoading(false);
    }
  };

  const filteredFlows = flows.filter(flow =>
    flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flow.flow_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar fluxos por pasta
  const flowsByFolder = filteredFlows.reduce((acc, flow) => {
    const folderId = flow.folder_id || 'root';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(flow);
    return acc;
  }, {});

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
      case 'TESTING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'CONVERSATION':
        return '💬';
      case 'AUTOMATION':
        return '⚡';
      case 'WEBHOOK':
        return '🔗';
      case 'TRIGGER':
        return '🎯';
      case 'ACTION':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getFolderIcon = (icon) => {
    const icons = {
      'message-circle': '💬',
      'calendar': '📅',
      'folder': '📁',
      'settings': '⚙️',
      'users': '👥',
      'phone': '📞',
      'mail': '📧',
      'bell': '🔔',
      'clock': '⏰',
      'star': '⭐'
    };
    return icons[icon] || '📁';
  };

  const handleFlowAction = (flow, action) => {
    if (action === 'Editar') {
      setSelectedFlow(flow);
      return;
    }
    toast.success(`${action}: ${flow.name}`);
    console.log(`${action} flow:`, flow);
  };

  const handleSaveFlow = async (flowData) => {
    try {
      if (!selectedFlow) return;
      
      const response = await axios.put(`${API_BASE_URL}/flows/${selectedFlow.id}`, {
        data: JSON.stringify(flowData)
      });
      
      if (response.data.success) {
        toast.success('Fluxo salvo com sucesso!');
        loadBotData(); // Recarregar dados
      } else {
        toast.error('Erro ao salvar fluxo');
      }
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
      toast.error('Erro ao conectar com a API');
    }
  };

  const handleCreateNewFlow = async (flowName, flowDescription, folderId = null) => {
    try {
      if (!bot) {
        toast.error('Dados do bot não carregados');
        return;
      }

      const defaultFlowData = {
        nodes: [
          {
            id: 'start_node_1',
            type: 'startNode',
            position: { x: 100, y: 250 },
            data: { 
              label: 'Início',
              config: { message: `Bem-vindo ao ${bot.name}!` }
            }
          }
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      const response = await axios.post(`${API_BASE_URL}/flows`, {
        bot_id: bot.id,
        bot_uuid: bot.bot_uuid || bot.uuid,
        workspace_id: bot.workspace_id,
        workspace_uuid: bot.workspace_uuid,
        hotel_id: bot.hotel_id,
        hotel_uuid: bot.hotel_uuid,
        folder_id: folderId,
        name: flowName,
        description: flowDescription,
        flow_type: 'CONVERSATION',
        status: 'DRAFT',
        flow_data: defaultFlowData,
        variables: {},
        settings: {
          timeout: 30000,
          fallback_enabled: true,
          typing_delay: 1500
        },
        triggers: [
          { type: 'keyword', keywords: [flowName.toLowerCase()] }
        ],
        is_default: false
      });

      if (response.data.success) {
        toast.success('Novo fluxo criado com sucesso!');
        setShowNewFlowModal(false);
        loadBotData(); // Recarregar dados
      } else {
        toast.error('Erro ao criar fluxo');
      }
    } catch (error) {
      console.error('Erro ao criar novo fluxo:', error);
      toast.error('Erro ao conectar com a API');
    }
  };

  const renderFolderView = () => (
    <div className="space-y-6">
      {/* Fluxos sem pasta (root) */}
      {flowsByFolder.root && flowsByFolder.root.length > 0 && (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <h3 className="text-lg font-semibold text-midnight-950 mb-4 flex items-center gap-2">
            📋 Fluxos Gerais ({flowsByFolder.root.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flowsByFolder.root.map(flow => renderFlowCard(flow))}
          </div>
        </div>
      )}

      {/* Pastas com fluxos */}
      {folders.map(folder => {
        const folderFlows = flowsByFolder[folder.id] || [];
        if (folderFlows.length === 0) return null;

        return (
          <div key={folder.id} className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-midnight-950 flex items-center gap-2">
                <span style={{ color: folder.color }}>{getFolderIcon(folder.icon)}</span>
                {folder.name} ({folderFlows.length})
              </h3>
            </div>
            {folder.description && (
              <p className="text-steel-600 text-sm mb-4">{folder.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folderFlows.map(flow => renderFlowCard(flow))}
            </div>
          </div>
        );
      })}

      {/* Pastas vazias */}
      {folders.filter(folder => !flowsByFolder[folder.id] || flowsByFolder[folder.id].length === 0).map(folder => (
        <div key={folder.id} className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant opacity-60">
          <h3 className="text-lg font-semibold text-midnight-950 flex items-center gap-2 mb-2">
            <span style={{ color: folder.color }}>{getFolderIcon(folder.icon)}</span>
            {folder.name} (0)
          </h3>
          {folder.description && (
            <p className="text-steel-600 text-sm mb-4">{folder.description}</p>
          )}
          <p className="text-steel-500 text-sm italic">Nenhum fluxo nesta pasta</p>
        </div>
      ))}
    </div>
  );

  const renderFlowCard = (flow) => (
    <div key={flow.id} className="bg-white/50 rounded-lg border border-sapphire-200/30 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(flow.flow_type)}</span>
          <h4 className="font-semibold text-midnight-950 text-sm">{flow.name}</h4>
        </div>
        <div className="flex gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(flow.status)}`}>
            {flow.status}
          </span>
          {flow.is_default && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              Padrão
            </span>
          )}
        </div>
      </div>
      
      {flow.description && (
        <p className="text-steel-600 text-xs mb-3 line-clamp-2">{flow.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-steel-500 mb-3">
        <span>v{flow.version}</span>
        <span>{formatDate(flow.updated_at)}</span>
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => handleFlowAction(flow, 'Editar')}
          className="flex-1 px-2 py-1 bg-gradient-sapphire hover:bg-sapphire-600 text-white text-xs font-medium rounded
            transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-sapphire-400/50"
        >
          Editar
        </button>
        {flow.status === 'ACTIVE' ? (
          <button
            onClick={() => handleFlowAction(flow, 'Pausar')}
            className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded
              transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
          >
            Pausar
          </button>
        ) : (
          <button
            onClick={() => handleFlowAction(flow, 'Ativar')}
            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded
              transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-green-400/50"
          >
            Ativar
          </button>
        )}
      </div>
    </div>
  );

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

  // Se há um fluxo selecionado, mostrar o editor
  if (selectedFlow) {
    return (
      <div className="space-y-2">
        {/* Header compacto do Editor */}
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-lg border border-sapphire-200/40 px-4 py-2 shadow-blue-elegant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedFlow(null)}
                className="text-sapphire-600 hover:text-sapphire-700 text-xs font-medium"
              >
                ← Voltar
              </button>
              <h1 className="text-sm font-semibold text-midnight-950">
                {selectedFlow.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 bg-gradient-to-r from-sapphire-500 to-sapphire-600 text-white text-xs font-medium rounded-md hover:from-sapphire-600 hover:to-sapphire-700 transition-all duration-200"
                onClick={() => {
                  // TODO: Implementar salvamento
                  console.log('💾 Salvando fluxo...');
                }}
              >
                💾 Salvar Fluxo
              </button>
            </div>
          </div>
        </div>

        {/* Editor de Fluxo - Altura expandida */}
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant" style={{ height: 'calc(100vh - 180px)' }}>
          <div style={{ height: '100%', width: '100%' }}>
            <FlowEditor 
              flowData={selectedFlow} 
              onSave={handleSaveFlow}
              readOnly={false}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        .shadow-emerald-glow {
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.15);
        }
        .shadow-purple-glow {
          box-shadow: 0 4px 14px rgba(147, 51, 234, 0.15);
        }
      `}</style>
      {/* Header */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                to={`/workspace/${bot?.workspace_uuid}/bots`} 
                className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
              >
                ← Voltar aos Bots
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-midnight-950">
              {bot ? `Fluxos - ${bot.name}` : 'Fluxos do Bot'}
            </h1>
            <p className="text-steel-700 mt-2">
              {bot && `${bot.bot_type} • ${bot.hotel_nome}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/50 rounded-lg border border-sapphire-200/40 overflow-hidden">
              <button
                onClick={() => setViewMode('folders')}
                className={`px-3 py-2 text-sm font-medium transition-all ${
                  viewMode === 'folders' 
                    ? 'bg-gradient-sapphire text-white' 
                    : 'text-steel-700 hover:bg-sapphire-100/50'
                }`}
              >
                📁 Por Pastas
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-gradient-sapphire text-white' 
                    : 'text-steel-700 hover:bg-sapphire-100/50'
                }`}
              >
                📋 Lista
              </button>
            </div>
            <span className="text-sm font-medium text-steel-700">
              {filteredFlows.length} fluxo{filteredFlows.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Configurações do Bot */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-midnight-950 mb-2">
              ⚙️ Configurações do Bot
            </h2>
            <p className="text-steel-600 text-sm">
              Gerencie fluxos, campos personalizados e configurações avançadas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNewFlowModal(true)}
              className="bg-gradient-sapphire hover:bg-sapphire-600 text-white px-4 py-2 rounded-lg font-medium text-sm 
                transition-all duration-200 shadow-sapphire-glow hover:shadow-lg hover:scale-105 
                focus:outline-none focus:ring-2 focus:ring-sapphire-400/50 flex items-center gap-2"
            >
              ✨ Novo Fluxo
            </button>
            <button
              onClick={() => {
                // TODO: Implementar modal de campos do usuário
                console.log('Abrir modal de Campos do Usuário');
              }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 
                text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 
                shadow-emerald-glow hover:shadow-lg hover:scale-105 focus:outline-none 
                focus:ring-2 focus:ring-emerald-400/50 flex items-center gap-2"
            >
              👤 Campos do Usuário
            </button>
            <button
              onClick={() => setShowBotFieldsModal(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 
                text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 
                shadow-purple-glow hover:shadow-lg hover:scale-105 focus:outline-none 
                focus:ring-2 focus:ring-purple-400/50 flex items-center gap-2"
            >
              🤖 Campos do Bot
            </button>
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
              placeholder="Buscar fluxos..."
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
              <option value="CONVERSATION">Conversação</option>
              <option value="AUTOMATION">Automação</option>
              <option value="WEBHOOK">Webhook</option>
              <option value="TRIGGER">Gatilho</option>
              <option value="ACTION">Ação</option>
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
              <option value="TESTING">Teste</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {filteredFlows.length === 0 ? (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-12 shadow-blue-elegant text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-midnight-950 mb-2">
            Nenhum fluxo encontrado
          </h3>
          <p className="text-steel-700">
            {searchTerm 
              ? 'Tente ajustar os filtros de busca' 
              : 'Este bot não possui fluxos configurados'
            }
          </p>
        </div>
      ) : (
        viewMode === 'folders' ? renderFolderView() : (
          <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFlows.map(flow => renderFlowCard(flow))}
            </div>
          </div>
        )
      )}

      {/* Footer com estatísticas */}
      {flows.length > 0 && (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-4 shadow-blue-elegant">
          <div className="flex flex-wrap gap-6 text-sm text-steel-600">
            <div>
              <span className="font-medium">Total:</span> {flows.length} fluxos
            </div>
            <div>
              <span className="font-medium">Pastas:</span> {folders.length}
            </div>
            <div>
              <span className="font-medium">Ativos:</span> {flows.filter(f => f.status === 'ACTIVE').length}
            </div>
            <div>
              <span className="font-medium">Rascunhos:</span> {flows.filter(f => f.status === 'DRAFT').length}
            </div>
            <div>
              <span className="font-medium">Conversação:</span> {flows.filter(f => f.flow_type === 'CONVERSATION').length}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Fluxo */}
      {showNewFlowModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-midnight-950">✨ Criar Novo Fluxo</h3>
              <button
                onClick={() => setShowNewFlowModal(false)}
                className="text-steel-500 hover:text-steel-700 p-1 rounded-lg hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const flowName = formData.get('flowName');
              const flowDescription = formData.get('flowDescription');
              const folderId = formData.get('folderId') || null;
              
              if (!flowName.trim()) {
                toast.error('Nome do fluxo é obrigatório');
                return;
              }
              
              handleCreateNewFlow(flowName.trim(), flowDescription.trim(), folderId === 'null' ? null : parseInt(folderId));
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-steel-700 mb-2">
                  Nome do Fluxo *
                </label>
                <input
                  type="text"
                  name="flowName"
                  placeholder="Ex: Atendimento Inicial"
                  className="w-full px-3 py-2 bg-white/70 border border-sapphire-200/40 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-sapphire-400/50 focus:border-transparent
                    text-midnight-950 placeholder-steel-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-steel-700 mb-2">
                  Descrição
                </label>
                <textarea
                  name="flowDescription"
                  rows="2"
                  placeholder="Descreva brevemente o propósito deste fluxo..."
                  className="w-full px-3 py-2 bg-white/70 border border-sapphire-200/40 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-sapphire-400/50 focus:border-transparent
                    text-midnight-950 placeholder-steel-500 resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-steel-700 mb-2">
                  Pasta
                </label>
                <select
                  name="folderId"
                  className="w-full px-3 py-2 bg-white/70 border border-sapphire-200/40 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-sapphire-400/50 focus:border-transparent
                    text-midnight-950"
                >
                  <option value="null">📋 Sem pasta (Geral)</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.icon || '📁'} {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFlowModal(false)}
                  className="flex-1 px-4 py-2 border border-sapphire-200/40 text-steel-700 rounded-lg 
                    hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-sapphire text-white rounded-lg 
                    hover:bg-sapphire-600 transition-colors font-medium"
                >
                  Criar Fluxo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Campos do Bot */}
      <BotFieldsModal
        isVisible={showBotFieldsModal}
        onClose={() => setShowBotFieldsModal(false)}
        bot={bot}
      />
    </div>
  );
};

export default BotFlows;