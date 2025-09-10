import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';

const Settings = () => {
  const { config, updateConfig, selectedHotelUuid } = useApp();
  const [activeTab, setActiveTab] = useState('apps');
  
  // Estados para configurações de aplicações
  const [appConfigurations, setAppConfigurations] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [appConfigsLoading, setAppConfigsLoading] = useState(false);

  // Estados para configurações de upload
  const [uploadSettings, setUploadSettings] = useState(config.uploadConfig || {});

  const tabs = [
    { id: 'apps', name: 'Aplicações', icon: '📱' },
    { id: 'upload', name: 'Upload de Imagens', icon: '📷' },
    { id: 'appearance', name: 'Aparência', icon: '🎨' }
  ];

  // Função para inicializar configurações padrão se não existirem
  const initializeDefaultConfigurations = () => {
    const defaultApps = ['hotel-app', 'pms', 'automacao', 'site-hoteleiro'];
    const defaultConfigs = {};
    
    defaultApps.forEach(appName => {
      defaultConfigs[appName] = {
        app_title: '',
        logo_url: '',
        favicon_url: '',
        description: '',
        shared_from_app: null
      };
    });
    
    return defaultConfigs;
  };

  // Funções para gerenciar configurações de aplicações
  const loadAppConfigurations = async () => {
    if (!config.apiBaseUrl) {
      if (!isInitialized) {
        console.log('🔧 API não configurada, inicializando com configurações padrão');
        setAppConfigurations(initializeDefaultConfigurations());
        setIsInitialized(true);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token não encontrado, não é possível carregar configurações de aplicações');
      if (!isInitialized) {
        setAppConfigurations(initializeDefaultConfigurations());
        setIsInitialized(true);
      }
      return;
    }
    
    setAppConfigsLoading(true);
    try {
      console.log('🔍 loadAppConfigurations - Carregando do banco de dados...');
      const response = await fetch(`${config.apiBaseUrl}/api/app-configurations?hotel_id=${selectedHotelUuid || ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 loadAppConfigurations - Dados recebidos da API:', data);
        
        if (data.configurations) {
          // Inicializar com configurações padrão e depois aplicar dados da API
          const newConfigurations = initializeDefaultConfigurations();
          
          // Aplicar dados da API sobre as configurações padrão
          Object.keys(data.configurations).forEach(appName => {
            const apiConfig = data.configurations[appName];
            if (apiConfig) {
              console.log(`🔍 App ${appName} config da API:`, apiConfig);
              newConfigurations[appName] = {
                app_title: apiConfig.app_title || '',
                logo_url: apiConfig.logo_url || '',
                favicon_url: apiConfig.favicon_url || '',
                description: apiConfig.description || '',
                shared_from_app: apiConfig.shared_from_app || null
              };
            }
          });
          
          console.log('🔍 Configurações processadas para o estado:', newConfigurations);
          setAppConfigurations(newConfigurations);
          setIsInitialized(true);
        } else {
          console.warn('⚠️ data.configurations não encontrado, inicializando com padrão');
          setAppConfigurations(initializeDefaultConfigurations());
          setIsInitialized(true);
        }
      } else {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText);
        if (!isInitialized) {
          setAppConfigurations(initializeDefaultConfigurations());
          setIsInitialized(true);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de aplicações:', error);
      if (!isInitialized) {
        setAppConfigurations(initializeDefaultConfigurations());
        setIsInitialized(true);
      }
    } finally {
      setAppConfigsLoading(false);
    }
  };

  const handleAppConfigChange = (appName, field, value) => {
    setAppConfigurations(prev => ({
      ...prev,
      [appName]: {
        ...prev[appName],
        [field]: value
      }
    }));
  };

  const handleAppLogoUpload = async (appName, logoUrl) => {
    console.log(`📷 Settings: Novo logo para ${appName}:`, logoUrl);
    
    // Atualizar estado local imediatamente para feedback visual
    handleAppConfigChange(appName, 'logo_url', logoUrl);
    
    try {
      // Salvar automaticamente na API (vai recarregar as configurações automaticamente)
      const saved = await saveAppConfiguration(appName, {
        ...appConfigurations[appName],
        logo_url: logoUrl
      });
      
      if (saved) {
        console.log('📷 Logo salvo com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar logo:', error);
    }
  };

  const handleAppFaviconUpload = async (appName, faviconUrl) => {
    console.log(`🔸 Settings: Novo favicon para ${appName}:`, faviconUrl);
    
    // Atualizar estado local imediatamente para feedback visual
    handleAppConfigChange(appName, 'favicon_url', faviconUrl);
    
    try {
      // Salvar automaticamente na API (vai recarregar as configurações automaticamente)
      const saved = await saveAppConfiguration(appName, {
        ...appConfigurations[appName],
        favicon_url: faviconUrl
      });
      
      if (saved) {
        console.log('🔸 Favicon salvo com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar favicon:', error);
    }
  };

  const saveAppConfiguration = async (appName, configData, skipReload = false) => {
    if (!config.apiBaseUrl) {
      toast.error('API não configurada');
      return false;
    }

    const token = localStorage.getItem('token');
    console.log('🔐 saveAppConfiguration - Token recuperado:', token ? 'Token existe' : 'Token não encontrado');
    console.log('🔐 saveAppConfiguration - Token length:', token?.length);
    if (!token) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      console.log('💾 saveAppConfiguration - Salvando:', { appName, configData, selectedHotelUuid });
      const response = await fetch(`${config.apiBaseUrl}/api/app-configurations/${appName}?hotel_id=${selectedHotelUuid || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configData)
      });

      if (response.ok) {
        toast.success(`Configuração de ${getAppLabel(appName)} salva com sucesso!`);
        
        // Recarregar configurações após salvar (exceto quando especificado para não recarregar)
        if (!skipReload) {
          console.log('💾 Recarregando configurações após salvamento...');
          setTimeout(() => loadAppConfigurations(), 300);
        }
        
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração de aplicação:', error);
      toast.error(`Erro ao salvar configuração: ${error.message}`);
      return false;
    }
  };

  const shareLogoFromApp = async (sourceApp, targetApps) => {
    if (!config.apiBaseUrl) {
      toast.error('API não configurada');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/app-configurations/share-logo?hotel_id=${selectedHotelUuid || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          source_app: sourceApp,
          target_apps: targetApps
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Logo compartilhado com sucesso!`);
        
        // Recarregar configurações para refletir as mudanças
        await loadAppConfigurations();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao compartilhar logo');
      }
    } catch (error) {
      console.error('Erro ao compartilhar logo:', error);
      toast.error(`Erro ao compartilhar logo: ${error.message}`);
    }
  };

  const getAppLabel = (appName) => {
    const labels = {
      'hotel-app': 'Sistema Principal',
      'pms': 'PMS',
      'automacao': 'Automação',
      'site-hoteleiro': 'Site Hoteleiro'
    };
    return labels[appName] || appName;
  };

  const getAppIcon = (appName) => {
    const icons = {
      'hotel-app': '🏨',
      'pms': '🏢',
      'automacao': '🤖',
      'site-hoteleiro': '🌐'
    };
    return icons[appName] || '📱';
  };

  const handleUploadSettingChange = (key, value) => {
    setUploadSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveUploadSettings = () => {
    updateConfig({ uploadConfig: uploadSettings });
    toast.success('Configurações de upload salvas com sucesso!');
  };

  // Carregar configurações quando a aba de aplicações for ativada
  useEffect(() => {
    if (activeTab === 'apps') {
      console.log('📱 Aba Aplicações ativada, carregando configurações...');
      loadAppConfigurations();
    }
  }, [activeTab]);

  // Carregar configurações automaticamente quando o componente inicializa ou quando o hotel muda
  useEffect(() => {
    console.log('⚡ Settings: Carregamento inicial ou mudança de hotel, carregando configurações...');
    loadAppConfigurations();
  }, [selectedHotelUuid, config.apiBaseUrl]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Configurações do Sistema</h2>
        <p className="text-sidebar-300">
          Configure as aplicações, uploads e aparência do sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="border-b border-white/10">
          <nav className="flex space-x-1 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-sidebar-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Applications Configuration Tab */}
          {activeTab === 'apps' && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-blue-300 font-medium">Configuração das Aplicações</h3>
                    <p className="text-blue-200 text-sm mt-1">
                      Configure o logotipo e nome de cada aplicação do sistema OSH. Você pode usar logos diferentes para cada aplicação ou compartilhá-los entre aplicações.
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {appConfigsLoading && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <div>
                      <h4 className="text-blue-300 font-medium">Carregando configurações das aplicações...</h4>
                      <p className="text-blue-400/70 text-sm mt-1">Buscando configurações mais recentes da base de dados</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Applications Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(appConfigurations).map(([appName, config]) => (
                  <div key={appName} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center text-xl">
                          {getAppIcon(appName)}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{getAppLabel(appName)}</h3>
                          <p className="text-sidebar-400 text-sm">Configure logo e nome da aplicação</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Application Title */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Nome da Aplicação
                        </label>
                        <input
                          type="text"
                          value={config.app_title}
                          onChange={(e) => handleAppConfigChange(appName, 'app_title', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder={`Nome para ${getAppLabel(appName)}`}
                        />
                      </div>

                      {/* Application Description */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Descrição da Aplicação
                        </label>
                        <textarea
                          value={config.description}
                          onChange={(e) => handleAppConfigChange(appName, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                          placeholder={`Descrição para ${getAppLabel(appName)}`}
                          rows="3"
                        />
                      </div>

                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <ImageUpload
                          value={config.logo_url}
                          onChange={(logoUrl) => handleAppLogoUpload(appName, logoUrl)}
                          label={`Logotipo de ${getAppLabel(appName)}`}
                          className="mb-4"
                          hotelName={null}
                          acceptFiles="image/*"
                        />
                      </div>

                      {/* Favicon Upload */}
                      <div className="space-y-2">
                        <ImageUpload
                          value={config.favicon_url}
                          onChange={(faviconUrl) => handleAppFaviconUpload(appName, faviconUrl)}
                          label={`Favicon de ${getAppLabel(appName)}`}
                          className="mb-4"
                          hotelName={null}
                          acceptFiles="image/*"
                        />
                        <p className="text-sidebar-400 text-xs">
                          Recomendado: 32x32px ou 16x16px, formato ICO, PNG ou SVG
                        </p>
                      </div>

                      {/* Logo Sharing Info */}
                      {config.shared_from_app && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            <span className="text-yellow-200 text-sm">
                              Logo compartilhado de {getAppLabel(config.shared_from_app)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveAppConfiguration(appName, config)}
                          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Salvar
                        </button>
                        
                        {config.logo_url && (
                          <div className="relative group">
                            <button className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                            </button>
                            
                            {/* Dropdown for sharing */}
                            <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-sidebar-900 border border-white/20 rounded-lg shadow-lg z-10">
                              <div className="p-2">
                                <p className="text-white text-sm font-medium mb-2">Compartilhar logo com:</p>
                                {Object.keys(appConfigurations)
                                  .filter(otherApp => otherApp !== appName)
                                  .map(otherApp => (
                                    <button
                                      key={otherApp}
                                      onClick={() => shareLogoFromApp(appName, [otherApp])}
                                      className="w-full text-left px-3 py-2 text-sm text-sidebar-300 hover:text-white hover:bg-white/10 rounded"
                                    >
                                      {getAppIcon(otherApp)} {getAppLabel(otherApp)}
                                    </button>
                                  ))
                                }
                                <hr className="border-white/10 my-2" />
                                <button
                                  onClick={() => shareLogoFromApp(appName, Object.keys(appConfigurations).filter(app => app !== appName))}
                                  className="w-full text-left px-3 py-2 text-sm text-primary-300 hover:text-primary-200 hover:bg-primary-500/10 rounded"
                                >
                                  📱 Todas as aplicações
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk Actions */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg mb-4">Ações em Lote</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      Object.entries(appConfigurations).forEach(([appName, config]) => {
                        saveAppConfiguration(appName, config);
                      });
                    }}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Salvar Todas as Configurações
                  </button>
                  
                  <button
                    onClick={loadAppConfigurations}
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Recarregar da API
                  </button>

                  <button
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      console.log('🔍 Debug Token:', { 
                        exists: !!token, 
                        length: token?.length, 
                        preview: token?.substring(0, 20) + '...' 
                      });
                      toast.success(`Token: ${token ? 'Existe' : 'Não encontrado'}`);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Debug Token
                  </button>

                  <button
                    onClick={async () => {
                      console.log('🔍 Testando carregamento direto da API...');
                      const token = localStorage.getItem('token');
                      const url = `${config.apiBaseUrl}/api/app-configurations?hotel_id=${selectedHotelUuid || ''}`;
                      console.log('🔍 URL:', url);
                      console.log('🔍 Token preview:', token?.substring(0, 30) + '...');
                      
                      try {
                        const response = await fetch(url, {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        });
                        
                        console.log('🔍 Response status:', response.status);
                        const data = await response.json();
                        console.log('🔍 Response data:', data);
                        
                        toast.success('Veja console para detalhes');
                      } catch (error) {
                        console.error('🔍 Erro:', error);
                        toast.error('Erro - veja console');
                      }
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Test API
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Settings Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a4 4 0 014 4z" />
                  </svg>
                  <div>
                    <h3 className="text-blue-300 font-medium">Configurações de Upload</h3>
                    <p className="text-blue-200 text-sm mt-1">
                      Configure as opções de upload de imagens e arquivos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Tamanho máximo do arquivo (MB)
                  </label>
                  <input
                    type="number"
                    value={uploadSettings.maxFileSize || 5}
                    onChange={(e) => handleUploadSettingChange('maxFileSize', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Tipos de arquivo permitidos
                  </label>
                  <input
                    type="text"
                    value={uploadSettings.allowedTypes || 'image/jpeg,image/png,image/webp,application/pdf'}
                    onChange={(e) => handleUploadSettingChange('allowedTypes', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="image/jpeg,image/png,application/pdf"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={uploadSettings.enableCompression || false}
                    onChange={(e) => handleUploadSettingChange('enableCompression', e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                  <label className="text-white text-sm">
                    Habilitar compressão automática de imagens
                  </label>
                </div>

                <button
                  onClick={handleSaveUploadSettings}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Salvar Configurações de Upload
                </button>
              </div>
            </div>
          )}

          {/* Appearance Settings Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                  <div>
                    <h3 className="text-blue-300 font-medium">Aparência do Sistema</h3>
                    <p className="text-blue-200 text-sm mt-1">
                      Configure a aparência e tema do sistema.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-white mb-2">Configurações de Aparência</h3>
                <p className="text-sidebar-400">
                  Em breve você poderá personalizar temas, cores e layout do sistema.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;