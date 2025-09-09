import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

export const useHotel = () => {
  const { config } = useApp();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar hotel individual por UUID (passado como :id no endpoint)
  const fetchHotel = useCallback(async (hotelUuid) => {
    console.log('Config atual:', config.apiEndpoints);
    console.log('Endpoint getHotel:', config.apiEndpoints.getHotel);
    
    setLoading(true);
    setError(null);

    try {
      if (!config.apiEndpoints.getHotel) {
        console.log('Endpoint não configurado, criando dados de exemplo para edição');
        
        // Criar dados de exemplo para permitir edição mesmo sem endpoint de busca
        const mockHotel = {
          hotel_uuid: hotelUuid,
          hotel_nome: 'Hotel para Editar',
          hora_checkin: '14:00',
          hora_checkout: '12:00',
          hotel_capa: '',
          hotel_criado_em: new Date().toLocaleDateString('pt-BR'),
          id: hotelUuid.slice(0, 8)
        };

        toast('ℹ️ Endpoint de busca não configurado. Usando dados em branco para edição.', { 
          duration: 3000,
          icon: 'ℹ️'
        });
        
        setHotel(mockHotel);
        return mockHotel;
      }

      // Substituir :id no endpoint com o UUID do hotel
      const url = config.apiEndpoints.getHotel.replace(':id', hotelUuid);
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Hotel não encontrado');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      
      // N8N pode retornar array ou objeto, normalizar para objeto
      let hotelData;
      if (Array.isArray(data)) {
        console.log('N8N retornou array, pegando primeiro item');
        hotelData = data[0];
      } else {
        console.log('N8N retornou objeto único');
        hotelData = data;
      }
      
      console.log('Hotel normalizado:', hotelData);
      setHotel(hotelData);
      return hotelData;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar hotel';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [config.apiEndpoints.getHotel]);

  // Atualizar hotel
  const updateHotel = useCallback(async (hotelUuid, hotelData) => {
    console.log('=== UPDATE HOTEL DEBUG ===');
    console.log('hotelUuid:', hotelUuid);
    console.log('hotelData recebido:', hotelData);
    console.log('Endpoint configurado:', config.apiEndpoints.updateHotel);

    if (!config.apiEndpoints.updateHotel) {
      toast.error('Endpoint de atualização não configurado');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Mapear campos para o formato correto do N8N
      const payload = {
        hotel_uuid: hotelUuid, // Adicionar UUID no payload
        hotel_nome: hotelData.hotel_nome || hotelData.nome_hotel,
        hora_checkin: hotelData.hora_checkin,
        hora_checkout: hotelData.hora_checkout,
        hotel_capa: hotelData.hotel_capa || hotelData.img_capa
      };

      console.log('Payload enviado:', payload);

      const url = config.apiEndpoints.updateHotel.replace(':id', hotelUuid);
      console.log('URL original do endpoint:', config.apiEndpoints.updateHotel);
      console.log('UUID do hotel:', hotelUuid);
      console.log('URL final da requisição:', url);
      
      // Verificar se a URL está bem formada
      try {
        const urlObj = new URL(url);
        console.log('URL válida:', urlObj.href);
        console.log('Protocolo:', urlObj.protocol);
        console.log('Host:', urlObj.host);
        console.log('Pathname:', urlObj.pathname);
      } catch (urlError) {
        console.error('URL inválida:', urlError);
        throw new Error('URL do endpoint é inválida: ' + url);
      }

      console.log('Enviando requisição POST...');
      
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      
      console.log('IMPORTANTE: Mudando método de PUT para POST para compatibilidade com N8N');
      
      console.log('Opções da requisição:', requestOptions);
      
      // Primeiro, tentar um teste simples para verificar conectividade
      console.log('--- TESTE DE CONECTIVIDADE ---');
      try {
        const testResponse = await fetch(url, { method: 'GET' });
        console.log('Teste GET - Status:', testResponse.status);
        console.log('Teste GET - Headers:', Object.fromEntries(testResponse.headers.entries()));
      } catch (testError) {
        console.log('Teste GET falhou:', testError.message);
      }
      console.log('--- FIM TESTE DE CONECTIVIDADE ---');
      
      const response = await fetch(url, requestOptions);

      console.log('Resposta recebida - Status:', response.status);
      console.log('Resposta recebida - Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log('Erro na resposta:', response.status, response.statusText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      let updatedHotel;
      try {
        const responseText = await response.text();
        console.log('Resposta em texto:', responseText);
        
        if (responseText) {
          updatedHotel = JSON.parse(responseText);
          console.log('Dados do hotel atualizado:', updatedHotel);
        } else {
          console.log('Resposta vazia da API');
          updatedHotel = { ...hotelData, hotel_uuid: hotelUuid };
        }
      } catch (parseError) {
        console.log('Erro ao fazer parse da resposta:', parseError);
        updatedHotel = { ...hotelData, hotel_uuid: hotelUuid };
      }

      setHotel(updatedHotel);
      toast.success('✅ Hotel atualizado com sucesso! N8N respondeu corretamente.');
      console.log('✅ SUCESSO: N8N recebeu e processou a requisição');
      console.log('=== FIM UPDATE HOTEL DEBUG ===');
      return true;
    } catch (err) {
      console.log('Erro durante a atualização:', err);
      console.log('Tipo do erro:', err.constructor.name);
      console.log('Stack trace:', err.stack);
      
      let errorMessage;
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Erro de rede: Não foi possível conectar com a API. Verifique se o endpoint está correto e acessível.';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'Erro CORS: A API não está configurada para aceitar requisições desta origem.';
      } else {
        errorMessage = err.message || 'Erro ao atualizar hotel';
      }
      
      console.log('Mensagem de erro final:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      console.log('=== FIM UPDATE HOTEL DEBUG (COM ERRO) ===');
      return false;
    } finally {
      setLoading(false);
    }
  }, [config.apiEndpoints.updateHotel]);

  // Excluir hotel
  const deleteHotel = useCallback(async (hotelUuid) => {
    if (!config.apiEndpoints.deleteHotel) {
      toast.error('Endpoint de exclusão não configurado');
      return false;
    }

    if (!confirm('Tem certeza que deseja excluir este hotel?')) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const url = config.apiEndpoints.deleteHotel.replace(':id', hotelUuid);
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      toast.success('Hotel excluído com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao excluir hotel';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [config.apiEndpoints.deleteHotel]);

  // Limpar dados
  const clearHotel = useCallback(() => {
    setHotel(null);
    setError(null);
  }, []);

  // Função auxiliar para testar payload sem enviar
  const simulateUpdatePayload = useCallback((hotelUuid, hotelData) => {
    console.log('=== SIMULAÇÃO DE PAYLOAD ===');
    console.log('hotelUuid:', hotelUuid);
    console.log('hotelData:', hotelData);
    
    const payload = {
      hotel_nome: hotelData.hotel_nome || hotelData.nome_hotel,
      hora_checkin: hotelData.hora_checkin,
      hora_checkout: hotelData.hora_checkout,
      hotel_capa: hotelData.hotel_capa || hotelData.img_capa
    };

    const baseUrl = config.apiEndpoints.updateHotel || 'URL não configurada';
    const url = baseUrl.replace(':id', hotelUuid);
    
    console.log('URL base configurada:', baseUrl);
    console.log('URL que seria usada:', url);
    console.log('Payload que seria enviado:', JSON.stringify(payload, null, 2));
    console.log('Tamanho do payload:', JSON.stringify(payload).length, 'bytes');
    
    // Testar URLs alternativas que o N8N pode esperar
    console.log('--- URLs ALTERNATIVAS PARA TESTE ---');
    const alternatives = [
      baseUrl.replace('/:id', `/${hotelUuid}`),
      baseUrl.replace(':id', hotelUuid),
      `${baseUrl.replace('/:id', '')}/${hotelUuid}`,
      baseUrl + (baseUrl.endsWith('/') ? '' : '/') + hotelUuid
    ];
    
    alternatives.forEach((altUrl, index) => {
      console.log(`Alternativa ${index + 1}:`, altUrl);
    });
    console.log('--- FIM URLs ALTERNATIVAS ---');
    console.log('=== FIM SIMULAÇÃO ===');
    
    return { url, payload, alternatives };
  }, [config.apiEndpoints.updateHotel]);

  return {
    hotel,
    loading,
    error,
    fetchHotel,
    updateHotel,
    deleteHotel,
    clearHotel,
    simulateUpdatePayload
  };
};