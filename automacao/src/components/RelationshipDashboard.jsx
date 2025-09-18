import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const RelationshipDashboard = ({ showWorkspaces = true, compactMode = false }) => {
  const [data, setData] = useState({
    user: null,
    hotels: [],
    workspaces: [],
    stats: {
      totalHotels: 0,
      totalWorkspaces: 0,
      activeWorkspaces: 0,
      totalBots: 0,
      totalInstances: 0
    },
    loading: true
  });

  useEffect(() => {
    loadRelationshipData();
  }, []);

  const loadRelationshipData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));

      // Mock user data (em produção, vem da autenticação)
      const user = {
        id: 1,
        name: 'Administrador',
        email: 'admin@automacao.com',
        role: 'ADMIN'
      };

      // Carregar workspaces com informações dos hotéis
      const workspacesResponse = await axios.get(`${API_BASE_URL}/workspaces?active=true`);
      const workspaces = workspacesResponse.data.success ? workspacesResponse.data.data : [];

      // Agrupar workspaces por hotel
      const hotelMap = new Map();
      let totalBots = 0;
      let totalInstances = 0;

      workspaces.forEach(workspace => {
        totalBots += workspace.bots_count || 0;
        totalInstances += workspace.instances_count || 0;

        const hotelId = workspace.hotel_id;
        if (!hotelMap.has(hotelId)) {
          hotelMap.set(hotelId, {
            id: hotelId,
            name: workspace.hotel_nome,
            hotel_uuid: workspace.hotel_uuid,
            workspaces: [],
            stats: {
              totalWorkspaces: 0,
              activeBots: 0,
              totalInstances: 0
            }
          });
        }

        const hotel = hotelMap.get(hotelId);
        hotel.workspaces.push(workspace);
        hotel.stats.totalWorkspaces++;
        hotel.stats.activeBots += workspace.bots_count || 0;
        hotel.stats.totalInstances += workspace.instances_count || 0;
      });

      const hotels = Array.from(hotelMap.values());

      setData({
        user,
        hotels,
        workspaces,
        stats: {
          totalHotels: hotels.length,
          totalWorkspaces: workspaces.length,
          activeWorkspaces: workspaces.filter(w => w.active).length,
          totalBots,
          totalInstances
        },
        loading: false
      });

    } catch (error) {
      console.error('Erro ao carregar dados de relacionamento:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  if (data.loading) {
    return (
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-sapphire-200/40 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-sapphire-200/40 rounded"></div>
            <div className="h-4 bg-sapphire-200/40 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (compactMode) {
    return (
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-midnight-950">Resumo do Sistema</h3>
          <Link
            to="/workspaces"
            className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
          >
            Ver Todos →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="text-2xl font-bold text-sapphire-700">{data.stats.totalHotels}</div>
            <div className="text-xs text-steel-600">Hotéis</div>
          </div>
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-700">{data.stats.activeWorkspaces}</div>
            <div className="text-xs text-steel-600">Workspaces</div>
          </div>
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="text-2xl font-bold text-violet-700">{data.stats.totalBots}</div>
            <div className="text-xs text-steel-600">Bots</div>
          </div>
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">{data.stats.totalInstances}</div>
            <div className="text-xs text-steel-600">Instâncias</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com informações do usuário */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-sapphire rounded-full flex items-center justify-center shadow-blue-subtle">
              <span className="text-white text-lg font-bold">
                {data.user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-midnight-950">
                {data.user?.name || 'Usuário'}
              </h2>
              <p className="text-steel-600 text-sm">
                Gerenciando {data.stats.totalHotels} hotéis • {data.stats.totalWorkspaces} workspaces
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-steel-600">Status do Sistema</div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">Operacional</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sapphire-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏨</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-sapphire-700">{data.stats.totalHotels}</div>
              <div className="text-sm text-steel-600">Hotéis Ativos</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💼</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">{data.stats.activeWorkspaces}</div>
              <div className="text-sm text-steel-600">Workspaces Ativos</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-violet-700">{data.stats.totalBots}</div>
              <div className="text-sm text-steel-600">Bots Configurados</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-700">{data.stats.totalInstances}</div>
              <div className="text-sm text-steel-600">Instâncias Evolution</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarquia Hotel → Workspaces */}
      {showWorkspaces && (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant">
          <div className="border-b border-sapphire-200/30 p-6">
            <h3 className="text-xl font-semibold text-midnight-950">
              Hierarquia de Relacionamentos
            </h3>
            <p className="text-steel-600 text-sm mt-1">
              Estrutura organizada: Usuário → Hotéis → Workspaces → Bots/Instâncias
            </p>
          </div>

          <div className="p-6">
            {data.hotels.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏢</div>
                <h4 className="text-xl font-semibold text-midnight-950 mb-2">
                  Nenhum hotel encontrado
                </h4>
                <p className="text-steel-600">
                  Você ainda não tem acesso a nenhum hotel ou workspace.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {data.hotels.map((hotel) => (
                  <div key={hotel.id} className="border border-sapphire-200/30 rounded-lg p-4 bg-white/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-sapphire-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🏨</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-midnight-950">{hotel.name}</h4>
                          <p className="text-sm text-steel-600">
                            {hotel.stats.totalWorkspaces} workspaces • {hotel.stats.activeBots} bots • {hotel.stats.totalInstances} instâncias
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {hotel.workspaces.map((workspace) => (
                        <Link
                          key={workspace.id}
                          to={`/workspace/${workspace.workspace_uuid}/chat-ao-vivo`}
                          className="block p-3 bg-white/50 border border-sapphire-200/30 rounded-lg hover:bg-sapphire-50/50 hover:border-sapphire-300/50 transition-all duration-200 group"
                          onClick={() => localStorage.setItem('selectedWorkspace', JSON.stringify(workspace))}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                              <span className="text-sm">💼</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-midnight-950 truncate">
                                {workspace.name}
                              </div>
                              <div className="text-xs text-steel-600 mt-1">
                                {workspace.bots_count || 0} bots • {workspace.instances_count || 0} instâncias
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <div className={`w-2 h-2 rounded-full ${workspace.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipDashboard;