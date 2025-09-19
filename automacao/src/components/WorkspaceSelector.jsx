import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const WorkspaceSelector = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadWorkspaces();
    loadSelectedWorkspace();
  }, [params.workspaceUuid]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/workspaces?active=true`);
      if (response.data.success) {
        setWorkspaces(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedWorkspace = () => {
    if (params.workspaceUuid) {
      // Tentar carregar do localStorage primeiro
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        try {
          const workspace = JSON.parse(savedWorkspace);
          if (workspace.workspace_uuid === params.workspaceUuid) {
            setSelectedWorkspace(workspace);
            return;
          }
        } catch (error) {
          console.error('Erro ao carregar workspace do localStorage:', error);
        }
      }

      // Se não encontrou no localStorage, buscar na lista
      const workspace = workspaces.find(w => w.workspace_uuid === params.workspaceUuid);
      if (workspace) {
        setSelectedWorkspace(workspace);
        localStorage.setItem('selectedWorkspace', JSON.stringify(workspace));
      }
    }
  };

  const handleWorkspaceSelect = (workspace) => {
    setSelectedWorkspace(workspace);
    localStorage.setItem('selectedWorkspace', JSON.stringify(workspace));
    setIsOpen(false);

    // Navegar para o chat ao vivo da workspace selecionada
    navigate(`/workspace/${workspace.workspace_uuid}/chat-ao-vivo`);
  };

  const getCurrentWorkspaceName = () => {
    if (selectedWorkspace) {
      return selectedWorkspace.name;
    }
    return 'Selecione uma Workspace';
  };

  const getCurrentHotelName = () => {
    if (selectedWorkspace) {
      return selectedWorkspace.hotel_nome;
    }
    return '';
  };

  // Agrupar workspaces por hotel
  const groupedWorkspaces = workspaces.reduce((acc, workspace) => {
    const hotelName = workspace.hotel_nome || 'Sem Hotel';
    if (!acc[hotelName]) {
      acc[hotelName] = [];
    }
    acc[hotelName].push(workspace);
    return acc;
  }, {});

  if (!params.workspaceUuid) {
    return null; // Não mostrar seletor fora de workspace
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-3 bg-white/30 border border-sapphire-200/40 rounded-lg hover:bg-white/50 hover:border-sapphire-300/60 transition-all duration-200 group min-w-[280px]"
      >
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
          <span className="text-lg">💼</span>
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-midnight-950 text-sm">
            {getCurrentWorkspaceName()}
          </div>
          {getCurrentHotelName() && (
            <div className="text-xs text-steel-600">
              {getCurrentHotelName()}
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-steel-500 group-hover:text-sapphire-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-sapphire-200/40 shadow-blue-elegant backdrop-blur-md z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sapphire-600 mx-auto"></div>
              <p className="text-steel-600 text-sm mt-2">Carregando workspaces...</p>
            </div>
          ) : (
            <div className="py-2">
              {Object.keys(groupedWorkspaces).length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-4xl mb-2">🏢</div>
                  <p className="text-steel-600 text-sm">Nenhuma workspace encontrada</p>
                </div>
              ) : (
                Object.entries(groupedWorkspaces).map(([hotelName, hotelWorkspaces]) => (
                  <div key={hotelName} className="border-b border-sapphire-200/30 last:border-b-0">
                    <div className="px-4 py-2 bg-sapphire-50/30">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">🏨</span>
                        <span className="text-xs font-medium text-steel-700">{hotelName}</span>
                      </div>
                    </div>
                    <div>
                      {hotelWorkspaces.map((workspace) => (
                        <button
                          key={workspace.id}
                          onClick={() => handleWorkspaceSelect(workspace)}
                          className={`w-full text-left px-6 py-3 hover:bg-sapphire-50/50 transition-colors flex items-center space-x-3 ${
                            selectedWorkspace?.id === workspace.id ? 'bg-sapphire-100/50 border-r-2 border-sapphire-500' : ''
                          }`}
                        >
                          <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                            <span className="text-sm">💼</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-midnight-950 text-sm">
                              {workspace.name}
                            </div>
                            <div className="text-xs text-steel-600">
                              {workspace.bots_count || 0} bots • {workspace.instances_count || 0} instâncias
                            </div>
                          </div>
                          {selectedWorkspace?.id === workspace.id && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelector;