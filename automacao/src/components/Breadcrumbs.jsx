import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const [contextData, setContextData] = useState({
    user: null,
    hotel: null,
    workspace: null,
    loading: false
  });

  useEffect(() => {
    loadContextData();
  }, [location.pathname, params]);

  const loadContextData = async () => {
    try {
      setContextData(prev => ({ ...prev, loading: true }));

      // Se estamos numa rota de workspace, carregar contexto completo
      if (params.workspaceUuid) {
        await loadWorkspaceContext();
      }
    } catch (error) {
      console.error('Erro ao carregar contexto:', error);
    } finally {
      setContextData(prev => ({ ...prev, loading: false }));
    }
  };

  const loadWorkspaceContext = async () => {
    try {
      // Carregar workspace do localStorage primeiro (mais rápido)
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        const workspace = JSON.parse(savedWorkspace);
        setContextData(prev => ({
          ...prev,
          workspace: workspace,
          hotel: {
            id: workspace.hotel_id,
            name: workspace.hotel_nome,
            hotel_uuid: workspace.hotel_uuid
          }
        }));
      }

      // Carregar dados atualizados da API em background
      const workspaceResponse = await axios.get(`${API_BASE_URL}/workspaces/uuid/${params.workspaceUuid}`);
      if (workspaceResponse.data.success) {
        const workspace = workspaceResponse.data.data;
        setContextData(prev => ({
          ...prev,
          workspace: workspace,
          hotel: workspace.hotel || prev.hotel
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar contexto do workspace:', error);
    }
  };

  const getBreadcrumbItems = () => {
    const items = [];

    // Home sempre presente
    items.push({
      label: 'Dashboard',
      href: '/dashboard',
      icon: '🏠',
      current: location.pathname === '/dashboard'
    });

    // Se estamos na lista de workspaces
    if (location.pathname === '/workspaces') {
      items.push({
        label: 'Workspaces',
        href: '/workspaces',
        icon: '🏢',
        current: true
      });
      return items;
    }

    // Se temos contexto de workspace
    if (contextData.workspace) {
      // Adicionar hotel
      if (contextData.hotel) {
        items.push({
          label: contextData.hotel.name,
          href: '#', // Pode linkar para página do hotel no futuro
          icon: '🏨',
          subtitle: 'Hotel',
          current: false
        });
      }

      // Adicionar workspace
      items.push({
        label: contextData.workspace.name,
        href: `/workspace/${params.workspaceUuid}/chat-ao-vivo`,
        icon: '💼',
        subtitle: 'Workspace',
        current: false,
        metadata: {
          bots_count: contextData.workspace.bots_count,
          instances_count: contextData.workspace.instances_count
        }
      });

      // Adicionar página atual dentro do workspace
      if (location.pathname.includes('/chat-ao-vivo')) {
        items.push({
          label: 'Chat ao Vivo',
          href: `/workspace/${params.workspaceUuid}/chat-ao-vivo`,
          icon: '💬',
          current: true
        });
      } else if (location.pathname.includes('/bots')) {
        items.push({
          label: 'Bots',
          href: `/workspace/${params.workspaceUuid}/bots`,
          icon: '🤖',
          current: true
        });
      } else if (location.pathname.includes('/settings')) {
        items.push({
          label: 'Configurações',
          href: `/workspace/${params.workspaceUuid}/settings`,
          icon: '⚙️',
          current: true
        });
      }
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  // Não mostrar breadcrumbs na página de chat ao vivo
  if (location.pathname.includes('/chat-ao-vivo')) {
    return null;
  }

  if (breadcrumbItems.length <= 1) {
    return null; // Não mostrar breadcrumbs para páginas simples
  }

  return (
    <nav className="bg-white/50 backdrop-blur-sm border-b border-sapphire-200/30 px-8 py-4" aria-label="Breadcrumb">
      <div className="flex items-center space-x-2 text-sm">
        {breadcrumbItems.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <svg className="flex-shrink-0 h-4 w-4 text-steel-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}

            <div className="flex items-center">
              {item.current ? (
                <div className="flex items-center space-x-2 px-3 py-2 bg-sapphire-100/70 border border-sapphire-200/50 rounded-lg">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <span className="text-sapphire-900 font-semibold">{item.label}</span>
                    {item.subtitle && (
                      <div className="text-xs text-sapphire-600">{item.subtitle}</div>
                    )}
                    {item.metadata && (
                      <div className="text-xs text-sapphire-600 mt-1">
                        {item.metadata.bots_count} bots • {item.metadata.instances_count} instâncias
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  to={item.href}
                  className="flex items-center space-x-2 px-3 py-2 text-steel-600 hover:text-sapphire-700 hover:bg-sapphire-50/50 rounded-lg transition-all duration-200 group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                  <div>
                    <span className="font-medium">{item.label}</span>
                    {item.subtitle && (
                      <div className="text-xs text-steel-500">{item.subtitle}</div>
                    )}
                    {item.metadata && (
                      <div className="text-xs text-steel-500">
                        {item.metadata.bots_count} bots • {item.metadata.instances_count} instâncias
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {contextData.loading && (
          <div className="flex items-center ml-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sapphire-600"></div>
          </div>
        )}

      </div>
    </nav>
  );
};

export default Breadcrumbs;