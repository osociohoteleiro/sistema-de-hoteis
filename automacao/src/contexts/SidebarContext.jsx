import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar deve ser usado dentro de um SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const location = useLocation();

  // Estados das sidebars
  const [isMainCollapsed, setIsMainCollapsed] = useState(false);
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(false);
  const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(false);

  // Effect para recolher sidebar principal quando workspace for expandida
  useEffect(() => {
    if (isWorkspaceVisible && !isWorkspaceCollapsed) {
      setIsMainCollapsed(true);
      localStorage.setItem('mainSidebarManuallyCollapsed', 'true');
      localStorage.removeItem('mainSidebarManuallyExpanded');
    }
  }, [isWorkspaceCollapsed, isWorkspaceVisible]);

  // Verificar se estamos numa rota de workspace
  const checkWorkspaceRoute = () => {
    const workspaceRoutes = ['/workspace/', '/bot/'];
    return workspaceRoutes.some(route => location.pathname.includes(route));
  };

  // Atualizar visibilidade da workspace sidebar baseado na rota
  useEffect(() => {
    const shouldShow = checkWorkspaceRoute();
    const wasVisible = isWorkspaceVisible;
    setIsWorkspaceVisible(shouldShow);

    // Comportamento automático: recolher sidebar principal quando workspace aparece
    if (shouldShow && !wasVisible) {
      // Workspace sidebar está aparecendo - recolher sidebar principal automaticamente
      const wasManuallyExpanded = localStorage.getItem('mainSidebarManuallyExpanded');
      if (wasManuallyExpanded !== 'true') {
        setIsMainCollapsed(true);
        // Remover flag de controle manual para permitir comportamento automático
        localStorage.removeItem('mainSidebarManuallyCollapsed');
      }
    } else if (!shouldShow && wasVisible) {
      // Workspace sidebar está desaparecendo - expandir sidebar principal se não foi colapsada manualmente
      const wasManuallyCollapsed = localStorage.getItem('mainSidebarManuallyCollapsed');
      if (wasManuallyCollapsed !== 'true') {
        setIsMainCollapsed(false);
        // Remover flag de expansão manual
        localStorage.removeItem('mainSidebarManuallyExpanded');
      }
    }
  }, [location.pathname, isWorkspaceVisible]);

  // Carregar estado salvo do localStorage
  useEffect(() => {
    const savedWorkspaceCollapsed = localStorage.getItem('workspaceSidebarCollapsed');
    if (savedWorkspaceCollapsed) {
      setIsWorkspaceCollapsed(savedWorkspaceCollapsed === 'true');
    }
  }, []);

  // Salvar estado no localStorage
  useEffect(() => {
    localStorage.setItem('mainSidebarCollapsed', isMainCollapsed.toString());
  }, [isMainCollapsed]);

  useEffect(() => {
    localStorage.setItem('workspaceSidebarCollapsed', isWorkspaceCollapsed.toString());
  }, [isWorkspaceCollapsed]);

  // Funções para controle das sidebars
  const toggleMainSidebar = () => {
    setIsMainCollapsed(prev => {
      const newState = !prev;

      // Se estamos numa workspace e o usuário está expandindo manualmente
      if (isWorkspaceVisible && !newState) {
        localStorage.setItem('mainSidebarManuallyExpanded', 'true');
        localStorage.removeItem('mainSidebarManuallyCollapsed');
      }
      // Se estamos numa workspace e o usuário está colapsando manualmente
      else if (isWorkspaceVisible && newState) {
        localStorage.setItem('mainSidebarManuallyCollapsed', 'true');
        localStorage.removeItem('mainSidebarManuallyExpanded');
      }
      // Se não estamos numa workspace
      else {
        localStorage.setItem('mainSidebarManuallyCollapsed', newState.toString());
        localStorage.removeItem('mainSidebarManuallyExpanded');
      }

      return newState;
    });
  };

  const toggleWorkspaceSidebar = () => {
    setIsWorkspaceCollapsed(prev => {
      const newState = !prev;

      // Se a WorkspaceSidebar está sendo expandida (newState = false), recolher a sidebar principal
      if (!newState && isWorkspaceVisible) {
        setIsMainCollapsed(true);
        localStorage.setItem('mainSidebarManuallyCollapsed', 'true');
        localStorage.removeItem('mainSidebarManuallyExpanded');
      }

      return newState;
    });
  };

  // Calcular larguras dinâmicas
  const getMainSidebarWidth = () => isMainCollapsed ? 16 : 64; // 4rem ou 16rem (64px ou 256px)
  const getWorkspaceSidebarWidth = () => {
    if (!isWorkspaceVisible) return 0;
    return isWorkspaceCollapsed ? 16 : 64; // 4rem ou 16rem
  };

  // Calcular margem total do conteúdo principal
  const getMainContentMargin = () => {
    const mainWidth = getMainSidebarWidth();
    const workspaceWidth = getWorkspaceSidebarWidth();
    return mainWidth + workspaceWidth; // Em unidades de 0.25rem (Tailwind)
  };

  // Calcular posição da workspace sidebar
  const getWorkspaceSidebarPosition = () => {
    return getMainSidebarWidth(); // Posicionar após a sidebar principal
  };

  const value = {
    // Estados
    isMainCollapsed,
    isWorkspaceCollapsed,
    isWorkspaceVisible,

    // Ações
    toggleMainSidebar,
    toggleWorkspaceSidebar,

    // Calculados
    getMainSidebarWidth,
    getWorkspaceSidebarWidth,
    getMainContentMargin,
    getWorkspaceSidebarPosition,

    // Utilitários
    checkWorkspaceRoute
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarProvider;