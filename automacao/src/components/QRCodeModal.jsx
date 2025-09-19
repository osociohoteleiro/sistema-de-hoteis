import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001/api';

const QRCodeModal = ({ isOpen, onClose, instanceName }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh do QR Code e status
  useEffect(() => {
    let interval;

    if (isOpen && instanceName && autoRefresh) {
      // Carregar QR Code imediatamente
      loadQRCode();

      // Auto-refresh a cada 5 segundos
      interval = setInterval(() => {
        checkConnectionStatus();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, instanceName, autoRefresh]);

  const loadQRCode = async () => {
    if (!instanceName) return;

    try {
      setLoading(true);

      console.log(`📱 Carregando QR Code para instância: ${instanceName}`);

      const response = await axios.get(`${API_BASE_URL}/evolution/qrcode/${instanceName}`);

      if (response.data.success && response.data.data) {
        setQrData(response.data.data);
        setConnectionStatus(response.data.data.status || 'CONNECTING');
        toast.success('QR Code carregado com sucesso');
      } else {
        throw new Error(response.data.error || 'QR Code não disponível');
      }

    } catch (error) {
      console.error('Erro ao carregar QR Code:', error);

      if (error.response?.status === 400) {
        toast.error('Instância pode já estar conectada ou QR Code não disponível');
      } else {
        toast.error('Erro ao carregar QR Code. Verifique se a instância está ativa.');
      }

      setQrData(null);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!instanceName) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/evolution/status/${instanceName}`);

      if (response.data.success) {
        const status = response.data.data.instance?.state || 'DISCONNECTED';
        setConnectionStatus(status);

        // Se conectou, pode parar o auto-refresh
        if (status === 'open') {
          setAutoRefresh(false);
          toast.success('🎉 WhatsApp conectado com sucesso!');
        }
      }
    } catch (error) {
      console.log('Status check error (normal):', error.message);
    }
  };

  const handleRetryQRCode = () => {
    setAutoRefresh(true);
    loadQRCode();
  };

  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'open':
        return { text: 'Conectado', color: 'text-green-600', icon: '✅' };
      case 'connecting':
        return { text: 'Conectando...', color: 'text-yellow-600', icon: '🔄' };
      case 'close':
      case 'closed':
        return { text: 'Desconectado', color: 'text-red-600', icon: '❌' };
      default:
        return { text: 'Aguardando...', color: 'text-gray-600', icon: '⏳' };
    }
  };

  if (!isOpen) return null;

  const statusDisplay = getStatusDisplay();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sapphire-600 to-sapphire-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Conectar WhatsApp</h2>
              <p className="text-sapphire-100 text-sm mt-1">
                Instância: {instanceName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-sapphire-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-lg">{statusDisplay.icon}</span>
            <span className={`font-medium ${statusDisplay.color.replace('text-', 'text-white ')}`}>
              {statusDisplay.text}
            </span>
            {autoRefresh && connectionStatus !== 'open' && (
              <div className="ml-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sapphire-600 mx-auto mb-4"></div>
              <p className="text-steel-600">Carregando QR Code...</p>
            </div>
          ) : connectionStatus === 'open' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-green-600 text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">Conectado!</h3>
              <p className="text-steel-600">
                WhatsApp conectado com sucesso. Você pode fechar esta janela.
              </p>
            </div>
          ) : qrData && qrData.qrcode ? (
            <div className="text-center">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border-2 border-sapphire-200 inline-block mb-6">
                <img
                  src={qrData.qrcode.base64}
                  alt="QR Code WhatsApp"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-4 text-left">
                <h3 className="font-semibold text-midnight-950 text-center mb-4">
                  Como conectar:
                </h3>
                <div className="space-y-3 text-sm text-steel-700">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-sapphire-100 text-sapphire-700 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                    <span>Abra o WhatsApp no seu celular</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-sapphire-100 text-sapphire-700 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                    <span>Toque em <strong>Mais opções (⋮)</strong> e depois em <strong>Dispositivos conectados</strong></span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-sapphire-100 text-sapphire-700 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                    <span>Toque em <strong>Conectar um dispositivo</strong></span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-sapphire-100 text-sapphire-700 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                    <span>Aponte a câmera do celular para este QR Code</span>
                  </div>
                </div>
              </div>

              {/* Pairing Code (se disponível) */}
              {qrData.qrcode.pairingCode && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Código de Pareamento:</h4>
                  <code className="text-lg font-mono font-bold text-blue-700">
                    {qrData.qrcode.pairingCode}
                  </code>
                  <p className="text-xs text-blue-600 mt-1">
                    Alternativa: Digite este código no WhatsApp
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-600 text-3xl">❌</span>
              </div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">QR Code não disponível</h3>
              <p className="text-steel-600 mb-4">
                Não foi possível carregar o QR Code. A instância pode já estar conectada ou inativa.
              </p>
              <button
                onClick={handleRetryQRCode}
                className="px-4 py-2 bg-sapphire-600 text-white rounded-lg hover:bg-sapphire-700 transition-colors"
              >
                🔄 Tentar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {qrData && qrData.qrcode && connectionStatus !== 'open' && (
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-steel-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Atualizando automaticamente...</span>
              </div>
              <button
                onClick={handleRetryQRCode}
                className="text-sapphire-600 hover:text-sapphire-700 font-medium"
              >
                🔄 Novo QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeModal;