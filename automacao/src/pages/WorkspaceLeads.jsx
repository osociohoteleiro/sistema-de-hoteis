import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AddLeadModal from '../components/Modals/AddLeadModal';
import EditLeadModal from '../components/Modals/EditLeadModal';

const API_BASE_URL = 'http://localhost:3001/api';

const WorkspaceLeads = () => {
  const { workspaceUuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [leads, setLeads] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [leadContactNames, setLeadContactNames] = useState({});
  const [leadProfileImages, setLeadProfileImages] = useState({});
  const [loadingLeadImages, setLoadingLeadImages] = useState({});
  const [sortBy, setSortBy] = useState('last_interaction'); // 'created_at' ou 'last_interaction'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' ou 'desc'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  useEffect(() => {
    loadWorkspaceData();
    loadLeads();
    loadSummary();
  }, [workspaceUuid]);

  // Busca com debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== '') {
        handleSearch();
      } else {
        loadLeads();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadWorkspaceData = () => {
    const savedWorkspace = localStorage.getItem('selectedWorkspace');
    if (savedWorkspace) {
      setWorkspace(JSON.parse(savedWorkspace));
    }
  };

  const loadLeads = async (search = '') => {
    try {
      if (search) setSearchLoading(true);
      else setLoading(true);

      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await axios.get(`${API_BASE_URL}/leads/${workspaceUuid}?limit=100${searchParam}`);

      if (response.data.success) {
        const leadsData = response.data.data.leads || [];
        setLeads(leadsData);
        setSummary(prev => ({ ...prev, ...response.data.data.summary }));

        // 🚀 OTIMIZADO: Priorizar dados do banco, evitar requisições desnecessárias
        loadLeadContactNamesOptimized(leadsData);
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const loadLeadContactNames = async (leadsData) => {
    console.log('🚀 loadLeadContactNames iniciado com', leadsData.length, 'leads');

    const newContactNames = {};
    const newProfileImages = {};
    const newLoadingStates = {};

    for (const lead of leadsData) {
      const leadKey = `${lead.instance_name}-${lead.phone_number}`;

      // Se já está carregando ou já tem as informações, pular
      if (loadingLeadImages[leadKey] ||
          (leadProfileImages[leadKey] && leadContactNames[leadKey])) {
        continue;
      }

      try {
        const cleanInstanceName = lead.instance_name.trim();
        const cleanPhoneNumber = lead.phone_number.replace(/\D/g, '');

        if (!cleanInstanceName || !cleanPhoneNumber) continue;

        // Marcar como carregando
        newLoadingStates[leadKey] = true;
        setLoadingLeadImages(prev => ({ ...prev, [leadKey]: true }));

        // 🚀 CORRIGIDO: Usar cache inteligente ao invés de Evolution API direta
        const encodedInstanceName = encodeURIComponent(cleanInstanceName);
        const response = await axios.get(`${API_BASE_URL}/contacts-cache/${encodedInstanceName}/${cleanPhoneNumber}`);

        if (response.data.success && response.data.data) {
          const contactData = response.data.data;

          // Salvar nome do contato
          if (contactData.name) {
            newContactNames[leadKey] = contactData.name;
            console.log(`✅ Nome encontrado via cache para ${lead.phone_number}: ${contactData.name} (cached: ${response.data.cached})`);
          }

          // Salvar foto de perfil
          if (contactData.picture) {
            newProfileImages[leadKey] = contactData.picture;
            console.log(`✅ Foto encontrada via cache para ${lead.phone_number} (cached: ${response.data.cached})`);
          }
        }
      } catch (error) {
        // Ignorar erros de contatos não encontrados
        if (error.response?.status !== 400) {
          console.warn(`Erro ao buscar informações do contato ${lead.phone_number}:`, error.message);
        }
      } finally {
        // Remover loading
        setLoadingLeadImages(prev => {
          const newState = { ...prev };
          delete newState[leadKey];
          return newState;
        });
      }
    }

    // Atualizar estados de forma síncrona
    if (Object.keys(newContactNames).length > 0) {
      console.log('🔄 Atualizando nomes:', newContactNames);
      setLeadContactNames(prev => ({ ...prev, ...newContactNames }));
    }

    if (Object.keys(newProfileImages).length > 0) {
      console.log('🔄 Atualizando fotos:', newProfileImages);
      setLeadProfileImages(prev => ({ ...prev, ...newProfileImages }));
    }
  };

  // 🚀 VERSÃO OTIMIZADA: Prioriza dados do banco, evita requisições desnecessárias
  const loadLeadContactNamesOptimized = async (leadsData) => {
    console.log('🚀 loadLeadContactNamesOptimized iniciado com', leadsData.length, 'leads');

    const newContactNames = {};
    const newProfileImages = {};
    const leadsNeedingCache = [];

    // 1ª FASE: Usar dados já disponíveis do banco (prioridade máxima)
    for (const lead of leadsData) {
      const leadKey = `${lead.instance_name}-${lead.phone_number}`;

      // ✅ Se já tem contact_name no banco, usar ele
      if (lead.contact_name && lead.contact_name.trim()) {
        newContactNames[leadKey] = lead.contact_name;
        console.log(`✅ Nome do banco para ${lead.phone_number}: ${lead.contact_name}`);
      }

      // ✅ Se já tem profile_pic_url no banco, usar ela
      if (lead.profile_pic_url && lead.profile_pic_url.trim()) {
        newProfileImages[leadKey] = lead.profile_pic_url;
        console.log(`✅ Foto do banco para ${lead.phone_number}`);
      }

      // 📝 Se faltar algum dado, adicionar à lista para buscar no cache
      if (!lead.contact_name || !lead.profile_pic_url) {
        leadsNeedingCache.push({ lead, leadKey });
      }
    }

    // Atualizar estados com dados já disponíveis do banco
    if (Object.keys(newContactNames).length > 0) {
      console.log('🔄 Atualizando nomes do banco:', newContactNames);
      setLeadContactNames(prev => ({ ...prev, ...newContactNames }));
    }
    if (Object.keys(newProfileImages).length > 0) {
      console.log('🔄 Atualizando fotos do banco:', newProfileImages);
      setLeadProfileImages(prev => ({ ...prev, ...newProfileImages }));
    }

    // 2ª FASE: Buscar no cache apenas para leads que precisam (limitado a 10 por vez)
    if (leadsNeedingCache.length > 0) {
      console.log(`📋 ${leadsNeedingCache.length} leads precisam de dados do cache`);

      // Limitar a 10 requisições por vez para evitar sobrecarga
      const batchSize = 10;
      const batch = leadsNeedingCache.slice(0, batchSize);

      const cacheContactNames = {};
      const cacheProfileImages = {};

      for (const { lead, leadKey } of batch) {
        // Verificar se já está carregando
        if (loadingLeadImages[leadKey]) {
          continue;
        }

        try {
          const cleanInstanceName = lead.instance_name.trim();
          const cleanPhoneNumber = lead.phone_number.replace(/\D/g, '');

          if (!cleanInstanceName || !cleanPhoneNumber) continue;

          // Marcar como carregando
          setLoadingLeadImages(prev => ({ ...prev, [leadKey]: true }));

          // Buscar no cache inteligente
          const encodedInstanceName = encodeURIComponent(cleanInstanceName);
          const response = await axios.get(`${API_BASE_URL}/contacts-cache/${encodedInstanceName}/${cleanPhoneNumber}`);

          if (response.data.success && response.data.data) {
            const contactData = response.data.data;

            // Apenas atualizar se não temos no banco
            if (!lead.contact_name && contactData.name) {
              cacheContactNames[leadKey] = contactData.name;
              console.log(`✅ Nome encontrado via cache para ${lead.phone_number}: ${contactData.name} (cached: ${response.data.cached})`);
            }

            if (!lead.profile_pic_url && contactData.picture) {
              cacheProfileImages[leadKey] = contactData.picture;
              console.log(`✅ Foto encontrada via cache para ${lead.phone_number} (cached: ${response.data.cached})`);
            }
          }
        } catch (error) {
          // Ignorar erros de contatos não encontrados
          if (error.response?.status !== 400) {
            console.warn(`Erro ao buscar informações do contato ${lead.phone_number}:`, error.message);
          }
        } finally {
          // Remover loading
          setLoadingLeadImages(prev => {
            const newState = { ...prev };
            delete newState[leadKey];
            return newState;
          });
        }
      }

      // Atualizar estados com dados do cache
      if (Object.keys(cacheContactNames).length > 0) {
        console.log('🔄 Atualizando nomes do cache:', cacheContactNames);
        setLeadContactNames(prev => ({ ...prev, ...cacheContactNames }));
      }
      if (Object.keys(cacheProfileImages).length > 0) {
        console.log('🔄 Atualizando fotos do cache:', cacheProfileImages);
        setLeadProfileImages(prev => ({ ...prev, ...cacheProfileImages }));
      }

      // Se ainda há mais leads para processar, agendar para próximo ciclo
      if (leadsNeedingCache.length > batchSize) {
        console.log(`⏰ Restam ${leadsNeedingCache.length - batchSize} leads para processar no próximo ciclo`);
        setTimeout(() => {
          loadLeadContactNamesOptimized(leadsNeedingCache.slice(batchSize).map(item => item.lead));
        }, 2000); // Aguardar 2 segundos antes do próximo lote
      }
    }

    console.log('🎯 loadLeadContactNamesOptimized concluído');
  };

  const loadSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leads/${workspaceUuid}/summary`);
      if (response.data.success) {
        setSummary(response.data.data.summary || {});
      }
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  };

  const handleSearch = () => {
    loadLeads(searchTerm);
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);

    if (diffHours < 1) {
      return 'Agora há pouco';
    } else if (diffHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 24 * 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const sortLeads = (leadsToSort) => {
    return [...leadsToSort].sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'created_at') {
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
      } else if (sortBy === 'last_interaction') {
        aValue = new Date(a.last_message_at || 0);
        bValue = new Date(b.last_message_at || 0);
      } else if (sortBy === 'name') {
        const aName = getLeadDisplayName(a).toLowerCase();
        const bName = getLeadDisplayName(b).toLowerCase();
        return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      } else {
        return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-steel-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-sapphire-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-sapphire-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  const getContactInitials = (name, phone) => {
    if (name && name.trim()) {
      return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    }
    return phone ? phone.slice(-2) : '?';
  };

  const getLeadDisplayName = (lead) => {
    const leadKey = `${lead.instance_name}-${lead.phone_number}`;
    const cacheContactName = leadContactNames[leadKey];

    console.log(`🔍 getLeadDisplayName para ${lead.phone_number}:`, {
      leadKey,
      cacheContactName,
      leadContactName: lead.contact_name,
      allNames: leadContactNames
    });

    // 🚀 PRIORIDADE OTIMIZADA: 1. Nome do banco, 2. Nome do cache, 3. Número
    const finalName = lead.contact_name || cacheContactName || `+${lead.phone_number}`;
    console.log(`📝 Nome final para ${lead.phone_number}: ${finalName} (origem: ${lead.contact_name ? 'banco' : cacheContactName ? 'cache' : 'número'})`);

    return finalName;
  };

  const getInstanceDisplayName = (instanceName, customName) => {
    return customName || instanceName;
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  };

  const handleDeleteLead = async (lead) => {
    if (!confirm(`Tem certeza que deseja deletar o lead "${lead.contact_name || lead.phone_number}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/leads/${workspaceUuid}/${lead.id}`);

      if (response.data.success) {
        toast.success('Lead deletado com sucesso!');
        loadLeads(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao deletar lead';
      toast.error(errorMessage);
    }
  };

  const handleLeadAdded = () => {
    loadLeads(); // Recarregar lista quando lead é adicionado
  };

  const handleLeadUpdated = () => {
    loadLeads(); // Recarregar lista quando lead é atualizado
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sapphire-600 mx-auto mb-4"></div>
          <p className="text-steel-600">Carregando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-midnight-950">Leads</h1>
          <p className="text-steel-600 mt-1">
            Todos os contatos da workspace "{workspace?.name || 'Carregando...'}"
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-sapphire hover:bg-midnight-700 text-white rounded-lg transition-colors shadow-sapphire-glow hover:shadow-blue-soft"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Adicionar Lead</span>
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-sapphire rounded-lg flex items-center justify-center shadow-sapphire-glow">
              <span className="text-white text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-steel-600 text-sm">Total de Leads</p>
              <p className="text-2xl font-bold text-midnight-950">{summary.totalLeads || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-steel-600 text-sm">Não Lidas</p>
              <p className="text-2xl font-bold text-midnight-950">{summary.totalUnread || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-steel-600 text-sm">Ativos Hoje</p>
              <p className="text-2xl font-bold text-midnight-950">{summary.activeToday || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-steel-600 text-sm">Total Mensagens</p>
              <p className="text-2xl font-bold text-midnight-950">{summary.totalMessages || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-steel-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500 bg-white/80 backdrop-blur-sm"
                placeholder="Buscar por nome ou telefone..."
              />
              {searchLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-sapphire-600 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* Filtro de Ordenação */}
          <div className="flex items-center space-x-2">
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [newSortBy, newSortDirection] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortDirection(newSortDirection);
              }}
              className="px-3 py-3 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500 bg-white/80 backdrop-blur-sm text-sm"
            >
              <option value="last_interaction-desc">Última Interação (Mais recente)</option>
              <option value="last_interaction-asc">Última Interação (Mais antigo)</option>
              <option value="created_at-desc">Data de Criação (Mais recente)</option>
              <option value="created_at-asc">Data de Criação (Mais antigo)</option>
              <option value="name-asc">Nome (A-Z)</option>
              <option value="name-desc">Nome (Z-A)</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              loadLeads();
            }}
            className="px-4 py-3 bg-steel-100 hover:bg-steel-200 text-steel-700 rounded-lg transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Tabela de Leads */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant">
        <div className="p-6 border-b border-sapphire-200/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-midnight-950">
              {summary.hasSearch ? `Resultados da busca (${leads.length})` : `Todos os Leads (${leads.length})`}
            </h3>
            {leads.length > 0 && (
              <Link
                to={`/workspace/${workspaceUuid}/chat-ao-vivo`}
                className="text-sapphire-600 hover:text-sapphire-800 text-sm font-medium"
              >
                Ver Chat ao Vivo →
              </Link>
            )}
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-4 shadow-sapphire-glow">
              <span className="text-white text-2xl">👥</span>
            </div>
            <h4 className="text-lg font-medium text-midnight-950 mb-2">
              {summary.hasSearch ? 'Nenhum lead encontrado' : 'Nenhum lead ainda'}
            </h4>
            <p className="text-steel-600 max-w-md mx-auto">
              {summary.hasSearch
                ? 'Tente buscar por outro termo ou remova os filtros.'
                : 'Os leads aparecerão aqui quando alguém enviar uma mensagem para as instâncias vinculadas a esta workspace.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-sapphire-50/50 border-b border-sapphire-200/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel-600 uppercase tracking-wider">
                    Contato
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-steel-600 uppercase tracking-wider cursor-pointer hover:text-sapphire-600 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nome</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel-600 uppercase tracking-wider hidden md:table-cell">
                    Telefone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel-600 uppercase tracking-wider hidden lg:table-cell">
                    Instância
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel-600 uppercase tracking-wider hidden xl:table-cell">
                    Última Mensagem
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-steel-600 uppercase tracking-wider cursor-pointer hover:text-sapphire-600 transition-colors hidden lg:table-cell"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Criado</span>
                      {getSortIcon('created_at')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-steel-600 uppercase tracking-wider cursor-pointer hover:text-sapphire-600 transition-colors"
                    onClick={() => handleSort('last_interaction')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Última Int.</span>
                      {getSortIcon('last_interaction')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-steel-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sapphire-200/20">
                {sortLeads(leads).map((lead) => {
                  const leadKey = `${lead.instance_name}-${lead.phone_number}`;
                  // 🚀 PRIORIZAR FOTO DO BANCO: 1. Banco, 2. Cache, 3. Loading
                  const profilePictureUrl = lead.profile_pic_url || leadProfileImages[leadKey];
                  const isLoadingImage = loadingLeadImages[leadKey];

                  return (
                    <tr key={leadKey} className="hover:bg-sapphire-50/20 transition-colors">
                      {/* Avatar + Badge de não lidas */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-sapphire-200">
                              {isLoadingImage ? (
                                <div className="w-full h-full bg-gradient-sapphire flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                </div>
                              ) : profilePictureUrl ? (
                                <img
                                  src={profilePictureUrl}
                                  alt="Foto"
                                  className="w-full h-full object-cover"
                                  onError={() => {
                                    setLeadProfileImages(prev => {
                                      const newState = { ...prev };
                                      delete newState[leadKey];
                                      return newState;
                                    });
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-sapphire flex items-center justify-center">
                                  <span className="text-white text-xs font-semibold">
                                    {getContactInitials(getLeadDisplayName(lead), lead.phone_number)}
                                  </span>
                                </div>
                              )}
                            </div>
                            {lead.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-lg animate-pulse">
                                {lead.unread_count > 9 ? '9+' : lead.unread_count}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Nome */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-midnight-950 truncate max-w-32">
                          {getLeadDisplayName(lead)}
                        </div>
                        {/* Mostrar telefone em mobile quando a coluna está oculta */}
                        <div className="text-xs text-steel-500 md:hidden">
                          +{lead.phone_number}
                        </div>
                        {/* Mostrar tags se existirem */}
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {lead.tags.length > 2 && (
                              <span className="text-xs text-steel-400">
                                +{lead.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Telefone */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm text-steel-600">
                          +{lead.phone_number}
                        </div>
                      </td>

                      {/* Instância */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {getInstanceDisplayName(lead.instance_name, lead.instance_custom_name)}
                        </span>
                      </td>

                      {/* Última Mensagem */}
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="max-w-48">
                          {lead.last_message_content ? (
                            <div className="text-sm text-steel-600 truncate">
                              {lead.last_message_direction === 'outbound' && (
                                <span className="text-green-600 mr-1">✓</span>
                              )}
                              {lead.last_message_content}
                            </div>
                          ) : (
                            <span className="text-xs text-steel-400">Sem mensagens</span>
                          )}
                          <div className="text-xs text-steel-400 mt-1">
                            {lead.message_count} msg(s)
                          </div>
                        </div>
                      </td>

                      {/* Data de Criação */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-sm text-steel-600">
                          {formatDate(lead.created_at)}
                        </div>
                      </td>

                      {/* Última Interação */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-steel-600">
                          {formatTime(lead.last_message_at)}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/workspace/${workspaceUuid}/chat-ao-vivo/${encodeURIComponent(lead.instance_name)}/${encodeURIComponent(lead.phone_number)}`}
                            className="inline-flex items-center px-2 py-1 bg-gradient-sapphire hover:bg-midnight-700 text-white text-xs font-medium rounded transition-minimal shadow-sm hover:shadow-md"
                            title="Abrir Chat"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9.899 8-1.171 0-2.299-.235-3.297-.682a1 1 0 00-.713 0L4 20l.682-3.091a1 1 0 00-.125-.713C3.235 15.298 3 14.171 3 13c0-5.482 4.418-9.9 9.899-9.9C18.482 3.1 21 7.518 21 12z" />
                            </svg>
                          </Link>

                          <button
                            onClick={() => handleEditLead(lead)}
                            className="inline-flex items-center px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
                            title="Editar Lead"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="inline-flex items-center px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
                            title="Deletar Lead"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLeadAdded={handleLeadAdded}
      />

      <EditLeadModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        lead={editingLead}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
};

export default WorkspaceLeads;