import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const WorkspaceSidebar = () => {
  const location = useLocation();
  const params = useParams();
  const workspaceUuid = params.workspaceUuid || params.workspaceId;
  const botUuid = params.botUuid;
  const [workspace, setWorkspace] = useState(null);
  const [bots, setBots] = useState([]);
  const [expandedMenus, setExpandedMenus] = useState({
    bots: location.pathname.includes('/bot/'), // Abrir automaticamente se estamos numa rota de bot
    whatsapp: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se temos workspaceUuid, carregar por workspace
    if (workspaceUuid) {
      loadWorkspaceData();
    } 
    // Se temos botUuid mas não workspaceUuid, carregar por bot
    else if (botUuid) {
      loadDataFromBot();
    }
  }, [workspaceUuid, botUuid]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Carregar workspace do localStorage
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        setWorkspace(JSON.parse(savedWorkspace));
      }

      // Carregar bots da workspace usando UUID
      const endpoint = `${API_BASE_URL}/bots/workspace/${workspaceUuid}?active=true`;
      
      console.log('Carregando bots do workspace:', workspaceUuid, 'endpoint:', endpoint);
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setBots(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDataFromBot = async () => {
    try {
      setLoading(true);
      
      // Carregar bot selecionado do localStorage
      const savedBot = localStorage.getItem('selectedBot');
      if (savedBot) {
        const bot = JSON.parse(savedBot);
        
        // Se o bot tem workspace_id, usar para carregar todos os bots
        if (bot.workspace_id) {
          console.log('Carregando workspace a partir do bot:', bot.workspace_id);
          const response = await axios.get(`${API_BASE_URL}/bots/workspace/${bot.workspace_id}?active=true`);
          
          if (response.data.success) {
            setBots(response.data.data || []);
            
            // Construir objeto workspace a partir dos dados do bot
            setWorkspace({
              id: bot.workspace_id,
              workspace_uuid: bot.workspace_uuid,
              name: bot.workspace_name,
              hotel_nome: bot.hotel_nome,
              hotel_id: bot.hotel_id
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados a partir do bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getBotIcon = (botType) => {
    switch(botType) {
      case 'CHATBOT':
        return '🤖';
      case 'AUTOMATION':
        return '⚙️';
      case 'WEBHOOK':
        return '🔗';
      case 'SCHEDULER':
        return '📅';
      case 'INTEGRATION':
        return '🔄';
      default:
        return '📦';
    }
  };

  if (!workspaceUuid && !botUuid) return null;

  return (
    <div className="w-64 bg-gradient-card-blue backdrop-blur-sm min-h-screen fixed left-64 top-0 z-30 border-r border-sapphire-200/30 shadow-blue-elegant">
      {/* Workspace Header */}
      <div className="p-6 border-b border-sapphire-200/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sapphire-600 text-xs font-medium uppercase tracking-wider">Workspace</p>
            <h2 className="text-midnight-950 font-semibold text-base mt-1">
              {workspace?.name || workspace?.workspace_name || 'Carregando...'}
            </h2>
          </div>
          <div className="w-8 h-8 bg-gradient-sapphire rounded-lg flex items-center justify-center shadow-sapphire-glow">
            <span className="text-white text-xs font-bold">W</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-4">
        <div className="px-4 space-y-2">

          {/* Chat ao Vivo - Página principal */}
          {workspace?.workspace_uuid && (
            <Link
              to={`/workspace/${workspace.workspace_uuid}/chat-ao-vivo`}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-minimal ${
                isActive(`/workspace/${workspace.workspace_uuid}/chat-ao-vivo`)
                  ? 'bg-gradient-sapphire text-white shadow-blue-soft'
                  : 'text-steel-700 hover:bg-sapphire-50/50 hover:text-sapphire-800'
              }`}
            >
              <span className="text-lg">💬</span>
              <span className="text-sm font-medium">Chat ao Vivo</span>
              <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold">Principal</span>
            </Link>
          )}

          {/* Divisor */}
          <div className="my-3 border-t border-sapphire-200/20"></div>

          {/* Gerenciar Bots */}
          {workspace?.workspace_uuid && (
            <Link
              to={`/workspace/${workspace.workspace_uuid}/bots`}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-minimal ${
                isActive(`/workspace/${workspace.workspace_uuid}/bots`)
                  ? 'bg-gradient-sapphire text-white shadow-blue-soft'
                  : 'text-steel-700 hover:bg-sapphire-50/50 hover:text-sapphire-800'
              }`}
            >
              <span className="text-lg">🤖</span>
              <span className="text-sm font-medium">Gerenciar Bots</span>
            </Link>
          )}

          {/* Bots Individuais */}
          <div>
            <button
              onClick={() => toggleMenu('bots')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-steel-700 hover:bg-sapphire-50/50 hover:text-sapphire-800 transition-minimal"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">🔧</span>
                <span className="text-sm font-medium">Configurar Bots</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${expandedMenus.bots ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Submenu de Bots */}
            {expandedMenus.bots && (
              <div className="mt-1 ml-4 space-y-1">
                {loading ? (
                  <div className="px-4 py-2">
                    <span className="text-xs text-steel-600">Carregando bots...</span>
                  </div>
                ) : bots.length === 0 ? (
                  <div className="px-4 py-2">
                    <span className="text-xs text-steel-600">Nenhum bot encontrado</span>
                  </div>
                ) : (
                  bots.map((bot) => (
                    <Link
                      key={bot.bot_uuid || bot.uuid}
                      to={`/bot/${bot.bot_uuid || bot.uuid}/flows`}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs transition-minimal ${
                        isActive(`/bot/${bot.bot_uuid || bot.uuid}/flows`)
                          ? 'bg-gradient-sapphire text-white shadow-blue-soft'
                          : 'text-steel-600 hover:bg-sapphire-50/30 hover:text-sapphire-700'
                      }`}
                    >
                      <span>{getBotIcon(bot.bot_type)}</span>
                      <span className="truncate">{bot.name}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>


          {/* Divisor */}
          <div className="my-3 border-t border-sapphire-200/20"></div>

          {/* Configurações da Workspace */}
          {workspace?.workspace_uuid && (
            <Link
              to={`/workspace/${workspace.workspace_uuid}/settings`}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-minimal ${
                isActive(`/workspace/${workspace.workspace_uuid}/settings`)
                  ? 'bg-gradient-sapphire text-white shadow-blue-soft'
                  : 'text-steel-700 hover:bg-sapphire-50/50 hover:text-sapphire-800'
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span className="text-sm font-medium">Configurações</span>
            </Link>
          )}

          {/* Analytics */}
          {workspace?.workspace_uuid && (
            <Link
              to={`/workspace/${workspace.workspace_uuid}/analytics`}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-minimal ${
                isActive(`/workspace/${workspace.workspace_uuid}/analytics`)
                  ? 'bg-gradient-sapphire text-white shadow-blue-soft'
                  : 'text-steel-700 hover:bg-sapphire-50/50 hover:text-sapphire-800'
              }`}
            >
              <span className="text-lg">📊</span>
              <span className="text-sm font-medium">Analytics</span>
            </Link>
          )}

        </div>
      </nav>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-sapphire-200/20">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-steel-600">Bots Ativos</span>
            <span className="text-sapphire-600 font-semibold">{bots.filter(b => b.status === 'ACTIVE').length}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-steel-600">Total de Bots</span>
            <span className="text-sapphire-600 font-semibold">{bots.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSidebar;