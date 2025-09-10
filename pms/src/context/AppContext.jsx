import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const DEFAULT_CONFIG = {
  companyName: 'Sistema PMS',
  appDescription: 'Sistema completo de Property Management System para gestão hoteleira eficiente.',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
};

export const AppProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [selectedHotelUuid, setSelectedHotelUuid] = useState('');

  // Função para atualizar o favicon dinamicamente
  const updateFavicon = (faviconUrl) => {
    try {
      // Remover favicon existente
      const existingFavicon = document.querySelector('link[rel="icon"]') || 
                             document.querySelector('link[rel="shortcut icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }
      
      // Criar novo favicon
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/x-icon';
      favicon.href = faviconUrl;
      
      document.head.appendChild(favicon);
      console.log('🔸 PMS Favicon atualizado para:', faviconUrl);
    } catch (error) {
      console.error('❌ Erro ao atualizar favicon do PMS:', error);
    }
  };

  // Função para atualizar o título da página (aba do navegador)
  const updatePageTitle = (title) => {
    try {
      document.title = title;
      console.log('📋 PMS Título atualizado para:', title);
    } catch (error) {
      console.error('❌ Erro ao atualizar título da página do PMS:', error);
    }
  };

  // Função para carregar configurações da aplicação
  const loadAppConfigurations = async (hotelUuid = null) => {
    try {
      const url = hotelUuid 
        ? `${DEFAULT_CONFIG.apiBaseUrl}/api/app-configurations/public/pms?hotel_id=${hotelUuid}`
        : `${DEFAULT_CONFIG.apiBaseUrl}/api/app-configurations/public/pms`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Atualizar favicon automaticamente
        if (data.favicon_url) {
          updateFavicon(data.favicon_url);
        }
        
        // Atualizar título da página automaticamente
        if (data.app_title) {
          updatePageTitle(data.app_title);
        }
        
        return data;
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da aplicação PMS:', error);
    }
    return null;
  };

  useEffect(() => {
    // Carregar configurações do localStorage
    const savedConfig = localStorage.getItem('pmsConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configurações do PMS:', error);
      }
    }

    // Carregar hotel selecionado do localStorage (compartilhado com hotel-app)
    const savedSelectedHotel = localStorage.getItem('selectedHotelUuid');
    if (savedSelectedHotel) {
      setSelectedHotelUuid(savedSelectedHotel);
      // Carregar configurações para o hotel selecionado
      loadAppConfigurations(savedSelectedHotel);
    } else {
      // Carregar configurações globais
      loadAppConfigurations();
    }
  }, []);

  // Recarregar configurações quando o hotel selecionado mudar
  useEffect(() => {
    if (selectedHotelUuid) {
      loadAppConfigurations(selectedHotelUuid);
    }
  }, [selectedHotelUuid]);

  // Função para selecionar um hotel
  const selectHotel = (hotelUuid) => {
    console.log('Hotel selecionado no PMS:', hotelUuid);
    setSelectedHotelUuid(hotelUuid);
    
    // Persistir no localStorage (compartilhado com hotel-app)
    if (hotelUuid) {
      localStorage.setItem('selectedHotelUuid', hotelUuid);
    } else {
      localStorage.removeItem('selectedHotelUuid');
    }
  };

  // Função para atualizar configurações
  const updateConfig = (newConfig) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('pmsConfig', JSON.stringify(updatedConfig));
  };

  // Função para limpar hotel selecionado
  const clearSelectedHotel = () => {
    setSelectedHotelUuid('');
    localStorage.removeItem('selectedHotelUuid');
  };

  const value = {
    // Estado
    config,
    loading,
    selectedHotelUuid,
    
    // Funções
    selectHotel,
    updateConfig,
    clearSelectedHotel,
    setLoading,
    updateFavicon,
    updatePageTitle
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
};

export default AppContext;