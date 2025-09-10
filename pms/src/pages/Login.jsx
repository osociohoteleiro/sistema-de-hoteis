import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();
  const { config, selectedHotelUuid, updateFavicon, updatePageTitle } = useApp();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [appConfig, setAppConfig] = useState({
    app_title: 'PMS - Sistema de Gestão Hoteleira',
    logo_url: null
  });

  // Buscar configurações da aplicação PMS (rota pública)
  useEffect(() => {
    const fetchAppConfig = async () => {
      try {
        // Incluir hotel_id se disponível para buscar configuração específica do hotel
        const url = selectedHotelUuid 
          ? `${config.apiBaseUrl}/app-configurations/public/pms?hotel_id=${selectedHotelUuid}`
          : `${config.apiBaseUrl}/app-configurations/public/pms`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setAppConfig(data);
          
          // Atualizar favicon se disponível
          if (data.favicon_url) {
            updateFavicon(data.favicon_url);
          }
          
          // Atualizar título da página se disponível
          if (data.app_title) {
            updatePageTitle(data.app_title);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar configurações da aplicação:', error);
      }
    };

    if (config.apiBaseUrl) {
      fetchAppConfig();
    }
  }, [config.apiBaseUrl, selectedHotelUuid]);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validação básica
      if (!formData.email || !formData.password) {
        toast.error('Por favor, preencha todos os campos');
        return;
      }

      if (!formData.email.includes('@')) {
        toast.error('Por favor, insira um email válido');
        return;
      }

      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success(`Bem-vindo ao PMS, ${result.user.name}!`);
        
        // Delay para garantir que o Header carregue os hotéis
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }, 1000);
      } else {
        toast.error(result.error || 'Erro ao fazer login');
      }
    } catch (error) {
      toast.error('Erro inesperado ao fazer login');
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar loading se ainda está verificando autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Descrição das Funcionalidades */}
      <div className="flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-6"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/5 to-transparent transform skew-y-12"></div>
        </div>
        
        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Sistema PMS
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Gestão Hoteleira Completa e Inteligente
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Gestão de Reservas</h3>
                <p className="text-primary-100">Controle completo de reservas, check-ins e check-outs em tempo real</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Controle Financeiro</h3>
                <p className="text-primary-100">Relatórios detalhados, faturamento e controle de receitas</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Gestão de Hóspedes</h3>
                <p className="text-primary-100">Perfis completos, histórico de estadias e preferências</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Rate Shopper</h3>
                <p className="text-primary-100">Monitoramento de preços da concorrência e otimização de tarifas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo e Título */}
          <div className="text-center">
            {appConfig.logo_url ? (
              <div className="mb-6">
                <img 
                  src={appConfig.logo_url} 
                  alt="Logo do Hotel"
                  className="h-16 w-auto mx-auto object-contain"
                />
              </div>
            ) : (
              <div className="h-16 w-16 mx-auto mb-6 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {appConfig.app_title || 'Acesso ao PMS'}
            </h2>
            <p className="text-slate-600">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Formulário de Login */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-elegant border border-slate-200/60 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-300 rounded-lg text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Digite seu email"
                />
              </div>

              {/* Campo Senha */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-300 rounded-lg text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-12"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Botão de Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  'Entrar no PMS'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center text-slate-500 text-sm">
            {config.companyName} - PMS - {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;