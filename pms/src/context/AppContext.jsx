import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const DEFAULT_CONFIG = {
  companyName: 'Sistema PMS',
  appDescription: 'Sistema completo de Property Management System para gestão hoteleira eficiente.'
};

export const AppProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [selectedHotelUuid, setSelectedHotelUuid] = useState('');

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
    }
  }, []);

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
    setLoading
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