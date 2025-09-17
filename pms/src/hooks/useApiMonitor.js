import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import toast from 'react-hot-toast';

export const useApiMonitor = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { logout, isAuthenticated } = useAuth();

  const checkConnection = useCallback(async () => {
    try {
      await apiService.healthCheck();

      // Se estava desconectado e agora conectou
      if (!isConnected && !isChecking) {
        toast.success('Conexão com a API reestabelecida');
      }

      setIsConnected(true);
      return true;
    } catch (error) {
      // Se estava conectado e agora desconectou
      if (isConnected && !isChecking) {
        toast.error('Conexão com a API perdida');

        // Se o usuário está logado, fazer logout automático
        if (isAuthenticated) {
          toast.error('Sessão encerrada: API desconectada');
          logout();
        }
      }

      setIsConnected(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [isConnected, isChecking, isAuthenticated, logout]);

  // Monitorar conexão
  useEffect(() => {
    // Verificação inicial
    checkConnection();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    isConnected,
    isChecking,
    checkConnection
  };
};