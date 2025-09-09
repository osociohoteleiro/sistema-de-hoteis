import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001/api';

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, [showActiveOnly]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showActiveOnly) params.append('active', 'true');
      
      const response = await axios.get(`${API_BASE_URL}/workspaces?${params}`);
      
      if (response.data.success) {
        setWorkspaces(response.data.data);
      } else {
        toast.error('Erro ao carregar workspaces');
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
      toast.error('Erro ao conectar com a API');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workspace.hotel_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnterWorkspace = (workspace) => {
    if (!workspace.active) {
      toast.error('Este workspace está inativo');
      return;
    }

    // Validar se o workspace tem um ID válido
    if (!workspace.id) {
      toast.error('Workspace não possui ID válido');
      console.error('Workspace sem ID:', workspace);
      return;
    }

    // Armazenar workspace no localStorage para usar na próxima página
    try {
      localStorage.setItem('selectedWorkspace', JSON.stringify(workspace));
      console.log('Workspace salvo no localStorage:', workspace);
    } catch (error) {
      console.error('Erro ao salvar workspace no localStorage:', error);
      toast.error('Erro ao salvar dados do workspace');
      return;
    }
    
    toast.success(`Entrando no workspace: ${workspace.name}`);
    
    // Redirecionar para página de bots do workspace
    // Usar ID numérico que é garantido
    const workspaceId = workspace.id;
    console.log('Redirecionando para workspace ID:', workspaceId);
    window.location.href = `/workspace/${workspaceId}/bots`;
  };

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

  const getStatusColor = (active) => {
    return active 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusText = (active) => {
    return active ? 'Ativo' : 'Inativo';
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
            <h1 className="text-3xl font-bold text-midnight-950">Workspaces</h1>
            <p className="text-steel-700 mt-2">
              Gerencie os espaços de trabalho organizados por hotel
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-steel-700">
              {filteredWorkspaces.length} workspace{filteredWorkspaces.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Campo de busca */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, hotel ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/70 border border-sapphire-200/40 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-sapphire-400/50 focus:border-transparent
                text-midnight-950 placeholder-steel-500"
            />
          </div>
          
          {/* Toggle Ativos */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showActive"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded border-sapphire-200/40 text-sapphire-500 
                focus:ring-sapphire-400/50 focus:ring-offset-0"
            />
            <label htmlFor="showActive" className="text-sm font-medium text-steel-700">
              Apenas ativos
            </label>
          </div>
        </div>
      </div>

      {/* Lista de Workspaces */}
      <div className="space-y-4">
        {filteredWorkspaces.length === 0 ? (
          <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-12 shadow-blue-elegant text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-midnight-950 mb-2">
              Nenhum workspace encontrado
            </h3>
            <p className="text-steel-700">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca' 
                : 'Nenhum workspace disponível no momento'
              }
            </p>
          </div>
        ) : (
          filteredWorkspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant
                hover:shadow-lg transition-all duration-300 hover:border-sapphire-300/50"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Nome e Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-midnight-950 mb-1">
                        {workspace.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workspace.active)}`}>
                          {getStatusText(workspace.active)}
                        </span>
                        <span className="text-sm text-steel-600">
                          ID: {workspace.workspace_uuid}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  {workspace.description && (
                    <p className="text-steel-700 text-sm leading-relaxed">
                      {workspace.description}
                    </p>
                  )}

                  {/* Informações do Hotel */}
                  <div className="flex flex-wrap gap-4 text-sm text-steel-600">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Hotel:</span>
                      <span>{workspace.hotel_nome || 'N/A'}</span>
                    </div>
                    {workspace.hotel_city && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Cidade:</span>
                        <span>{workspace.hotel_city}</span>
                        {workspace.hotel_state && (
                          <span>/ {workspace.hotel_state}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações Laterais */}
                <div className="flex flex-col lg:items-end gap-3 lg:min-w-[200px]">
                  {/* Datas */}
                  <div className="text-right">
                    <div className="text-xs text-steel-500 mb-1">Criado em:</div>
                    <div className="text-sm text-steel-700">
                      {formatDate(workspace.created_at)}
                    </div>
                  </div>

                  {/* Settings Badge */}
                  {workspace.settings && Object.keys(workspace.settings).length > 0 && (
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        bg-sapphire-100/70 text-sapphire-800 border border-sapphire-200/40">
                        Configurado
                      </span>
                    </div>
                  )}

                  {/* Botão Entrar */}
                  <div className="text-right">
                    <button
                      onClick={() => handleEnterWorkspace(workspace)}
                      disabled={!workspace.active}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                        ${workspace.active
                          ? 'bg-gradient-sapphire hover:bg-sapphire-600 text-white shadow-sapphire-glow hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sapphire-400/50'
                          : 'bg-steel-200 text-steel-500 cursor-not-allowed opacity-60'
                        }`}
                    >
                      {workspace.active ? 'Entrar' : 'Inativo'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings Preview */}
              {workspace.settings && Object.keys(workspace.settings).length > 0 && (
                <div className="mt-4 pt-4 border-t border-sapphire-200/30">
                  <div className="text-xs text-steel-500 mb-2">Configurações:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(workspace.settings).slice(0, 3).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center px-2 py-1 rounded text-xs
                          bg-white/50 text-steel-600 border border-sapphire-200/30"
                      >
                        <span className="font-medium">{key}:</span>
                        <span className="ml-1">
                          {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
                        </span>
                      </span>
                    ))}
                    {Object.keys(workspace.settings).length > 3 && (
                      <span className="text-xs text-steel-500">
                        +{Object.keys(workspace.settings).length - 3} mais...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer com estatísticas */}
      {workspaces.length > 0 && (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-4 shadow-blue-elegant">
          <div className="flex flex-wrap gap-6 text-sm text-steel-600">
            <div>
              <span className="font-medium">Total:</span> {workspaces.length} workspaces
            </div>
            <div>
              <span className="font-medium">Ativos:</span> {workspaces.filter(w => w.active).length}
            </div>
            <div>
              <span className="font-medium">Inativos:</span> {workspaces.filter(w => !w.active).length}
            </div>
            <div>
              <span className="font-medium">Hotéis únicos:</span> {new Set(workspaces.map(w => w.hotel_id)).size}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspaces;