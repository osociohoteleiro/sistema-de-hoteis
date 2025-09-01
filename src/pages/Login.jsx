import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiService from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.login(formData.email, formData.password);
      
      toast.success('Login realizado com sucesso!');
      
      // Redirecionar para o dashboard
      navigate('/');
    } catch (error) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (error.message.includes('401')) {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message.includes('404')) {
        errorMessage = 'Usuário não encontrado';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Criar usuário de teste
  const handleTestLogin = async () => {
    setIsLoading(true);
    try {
      // Tentar fazer login com credenciais de teste
      const response = await apiService.login('admin@hotel.com', 'admin123');
      toast.success('Login de teste realizado com sucesso!');
      navigate('/');
    } catch (error) {
      // Se falhar, mostrar instruções
      toast.error('Configure um usuário admin no banco de dados primeiro');
      console.log('Para criar um usuário de teste, execute no banco de dados:');
      console.log(`
        INSERT INTO users (name, email, password, user_type, active) 
        VALUES ('Admin', 'admin@hotel.com', '$2b$10$YourHashedPasswordHere', 'SUPER_ADMIN', true);
      `);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar-800 via-sidebar-900 to-black">
      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sistema de Hotéis</h1>
          <p className="text-sidebar-300">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/20">
          <button
            onClick={handleTestLogin}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Entrar com Usuário de Teste
          </button>
          <p className="text-xs text-sidebar-400 text-center mt-2">
            Use este botão para testar o sistema
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Continuar sem login (modo demonstração)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;