import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useApp } from '../context/AppContext';

const LogoHistorySelector = ({ onLogoSelect, className = '' }) => {
  const { selectedHotelUuid } = useApp();
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activatingId, setActivatingId] = useState(null);

  // Carregar histórico de logotipos
  const loadLogos = async () => {
    if (!selectedHotelUuid) {
      console.log('📸 LogoHistorySelector: Hotel UUID não disponível');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('📸 Token não encontrado no localStorage');
        toast.error('Erro de autenticação. Faça login novamente.');
        setLoading(false);
        return;
      }

      console.log('📸 Carregando logotipos para hotel:', selectedHotelUuid);
      console.log('📸 Token disponível:', token ? 'sim' : 'não');
      
      const response = await fetch(`http://localhost:3001/api/logos?hotel_id=${selectedHotelUuid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📸 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📸 Histórico de logotipos carregado:', data);
        setLogos(data.data.logos || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('📸 Erro ao carregar histórico de logotipos:', response.status, errorData);
        
        if (response.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else {
          toast.error(`Erro ao carregar histórico de logotipos: ${errorData.error || 'Erro desconhecido'}`);
        }
      }
    } catch (error) {
      console.error('📸 Erro ao carregar histórico de logotipos:', error);
      toast.error('Erro de conexão ao carregar histórico de logotipos');
    } finally {
      setLoading(false);
    }
  };

  // Ativar um logotipo específico
  const activateLogo = async (logoId) => {
    setActivatingId(logoId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/logos/${logoId}/activate?hotel_id=${selectedHotelUuid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Logotipo ativado com sucesso!');
        
        // Atualizar estado local
        setLogos(prev => prev.map(logo => ({
          ...logo,
          is_active: logo.id === logoId
        })));

        // Encontrar o logo ativado e notificar componente pai
        const activatedLogo = logos.find(logo => logo.id === logoId);
        if (activatedLogo && onLogoSelect) {
          onLogoSelect(activatedLogo.logo_url);
        }
      } else {
        toast.error('Erro ao ativar logotipo');
      }
    } catch (error) {
      console.error('Erro ao ativar logotipo:', error);
      toast.error('Erro ao ativar logotipo');
    } finally {
      setActivatingId(null);
    }
  };

  // Deletar logotipo (apenas se não estiver ativo)
  const deleteLogo = async (logoId) => {
    if (!confirm('Tem certeza que deseja deletar este logotipo?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/logos/${logoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Logotipo removido com sucesso!');
        setLogos(prev => prev.filter(logo => logo.id !== logoId));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar logotipo');
      }
    } catch (error) {
      console.error('Erro ao deletar logotipo:', error);
      toast.error('Erro ao deletar logotipo');
    }
  };

  // Formatar data de upload
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    // Aguardar um pouco para garantir que o token foi carregado após o login
    const timer = setTimeout(() => {
      loadLogos();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedHotelUuid]);

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico de Logotipos</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (logos.length === 0 && !loading) {
    const token = localStorage.getItem('token');
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico de Logotipos</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">
            Nenhum logotipo encontrado no histórico.
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Hotel UUID: {selectedHotelUuid || 'Não selecionado'}</p>
            <p>Token: {token ? 'Presente' : 'Ausente'}</p>
            {!token && (
              <p className="text-red-500">⚠️ Faça login para ver o histórico</p>
            )}
          </div>
          <button
            onClick={loadLogos}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Histórico de Logotipos</h3>
        <button
          onClick={loadLogos}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Atualizar
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Total: {logos.length} logotipo{logos.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {logos.map((logo) => (
          <div
            key={logo.id}
            className={`relative border-2 rounded-lg p-3 transition-all duration-200 ${
              logo.is_active
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {/* Status indicator */}
            {logo.is_active && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            {/* Logo preview */}
            <div className="aspect-w-16 aspect-h-9 mb-3 bg-gray-50 rounded overflow-hidden">
              <img
                src={logo.logo_url}
                alt="Logotipo"
                className="w-full h-24 object-contain"
                onError={(e) => {
                  e.target.src = '/placeholder-logo.svg';
                }}
              />
            </div>

            {/* Logo info */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                {formatDate(logo.upload_date)}
              </p>
              
              {logo.is_active ? (
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  ✓ Ativo
                </div>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={() => activateLogo(logo.id)}
                    disabled={activatingId === logo.id}
                    className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {activatingId === logo.id ? 'Ativando...' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => deleteLogo(logo.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 <strong>Dica:</strong> Clique em "Ativar" para usar um logotipo anterior. 
          O logotipo ativo aparece com borda verde e é usado em toda a aplicação.
        </p>
      </div>
    </div>
  );
};

export default LogoHistorySelector;