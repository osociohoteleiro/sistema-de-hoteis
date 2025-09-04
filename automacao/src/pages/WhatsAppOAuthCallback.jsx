import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const WhatsAppOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    processOAuthCallback();
  }, []);

  const processOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // workspaceUuid
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Erro na autenticação: ' + (searchParams.get('error_description') || error));
        notifyParent('error', error);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Parâmetros de autorização inválidos');
        notifyParent('error', 'Parâmetros inválidos');
        return;
      }

      setMessage('Trocando código por token...');

      // Enviar código para o backend processar
      const response = await axios.post(`${API_BASE_URL}/whatsapp-cloud/oauth/callback`, {
        code,
        workspaceUuid: state,
        redirectUri: `${window.location.origin}/whatsapp-oauth-callback`
      });

      if (response.data.success) {
        setStatus('success');
        setMessage('WhatsApp Cloud API conectado com sucesso!');
        notifyParent('success');
        
        // Fechar popup após 2 segundos
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Erro ao processar autenticação: ' + response.data.error);
        notifyParent('error', response.data.error);
      }

    } catch (error) {
      console.error('Erro no callback OAuth:', error);
      setStatus('error');
      setMessage('Erro interno: ' + (error.response?.data?.error || error.message));
      notifyParent('error', error.response?.data?.error || error.message);
    }
  };

  const notifyParent = (type, error = null) => {
    // Notificar a janela pai sobre o resultado
    if (window.opener) {
      window.opener.postMessage({
        type: type === 'success' ? 'WHATSAPP_OAUTH_SUCCESS' : 'WHATSAPP_OAUTH_ERROR',
        error: error
      }, window.location.origin);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-blue-depth flex items-center justify-center p-8">
      <div className="text-center bg-gradient-card-blue backdrop-blur-md p-10 rounded-2xl border border-sapphire-200/40 shadow-blue-elegant max-w-md">
        
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sapphire-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-midnight-950 mb-4">Conectando...</h2>
            <p className="text-steel-700 text-base">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-midnight-950 mb-4">Sucesso!</h2>
            <p className="text-steel-700 text-base">{message}</p>
            <p className="text-steel-600 text-sm mt-2">Esta janela será fechada automaticamente...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">✗</span>
            </div>
            <h2 className="text-2xl font-bold text-midnight-950 mb-4">Erro na Conexão</h2>
            <p className="text-steel-700 text-base">{message}</p>
            <button 
              onClick={() => window.close()}
              className="mt-4 bg-gradient-sapphire hover:bg-midnight-700 text-white text-sm font-medium px-6 py-3 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
            >
              Fechar
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default WhatsAppOAuthCallback;