import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.js';

const QRCodeViewer = ({ instanceName, onStatusChange }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('disconnected');
  
  const API_BASE_URL = API_CONFIG.baseURL;

  // Buscar QR Code
  const fetchQRCode = async () => {
    if (!instanceName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/evolution/qrcode/${instanceName}`);
      const data = await response.json();
      
      if (data.success) {
        setQrData(data.data);
        setStatus(data.data.status || 'connecting');
        if (onStatusChange) {
          onStatusChange(data.data.status || 'connecting');
        }
      } else {
        setError(data.error || 'Erro ao obter QR Code');
      }
    } catch (err) {
      setError('Erro na conexão com a API');
      console.error('Erro ao buscar QR Code:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verificar status da conexão
  const checkStatus = async () => {
    if (!instanceName) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/evolution/status/${instanceName}`);
      const data = await response.json();
      
      if (data.success) {
        const newStatus = data.data.instance?.state || 'disconnected';
        setStatus(newStatus);
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
        
        // Se conectado, limpar QR Code
        if (newStatus === 'open') {
          setQrData(null);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    }
  };

  // Auto-refresh do status a cada 5 segundos
  useEffect(() => {
    if (!instanceName) return;
    
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [instanceName]);

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'close': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Conectado';
      case 'connecting': return 'Aguardando conexão';
      case 'close': return 'Desconectado';
      default: return 'Status desconhecido';
    }
  };

  if (!instanceName) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-gray-600">Selecione uma instância para visualizar o QR Code</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            WhatsApp - {instanceName}
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'open' ? 'bg-green-500' : 
              status === 'connecting' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {status === 'open' ? (
          /* Conectado */
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-green-600 mb-2">
              WhatsApp Conectado!
            </h4>
            <p className="text-gray-600">
              Sua instância está conectada e funcionando normalmente.
            </p>
          </div>
        ) : (
          /* Aguardando conexão */
          <div className="text-center">
            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Carregando QR Code...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-red-600 mb-2">
                  Erro ao carregar QR Code
                </h4>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchQRCode}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : qrData && qrData.qrcode ? (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Escaneie o QR Code
                </h4>
                <p className="text-gray-600 text-sm">
                  Abra o WhatsApp no seu celular e escaneie o código abaixo
                </p>
                
                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <img
                    src={qrData.qrcode.base64}
                    alt="QR Code para conectar WhatsApp"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                
                {/* Pairing Code (se disponível) */}
                {qrData.qrcode.pairingCode && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      Ou use o código de pareamento:
                    </p>
                    <code className="bg-white px-3 py-2 rounded border text-lg font-mono">
                      {qrData.qrcode.pairingCode}
                    </code>
                  </div>
                )}
                
                <button
                  onClick={fetchQRCode}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Atualizar QR Code
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900">
                  Conectar WhatsApp
                </h4>
                <p className="text-gray-600">
                  Clique no botão abaixo para gerar o QR Code e conectar sua instância do WhatsApp.
                </p>
                <button
                  onClick={fetchQRCode}
                  className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Gerar QR Code
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeViewer;