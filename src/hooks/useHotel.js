import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';

export const useHotel = () => {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar hotel individual por ID
  const fetchHotel = useCallback(async (hotelId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getHotel(hotelId);
      
      // A API retorna { hotel: {...} }
      const hotelData = response.hotel || response;
      
      console.log('Hotel carregado:', hotelData);
      setHotel(hotelData);
      return hotelData;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar hotel';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Se não encontrado ou sem token, retornar dados vazios para permitir edição
      if (err.message.includes('404') || err.message.includes('401')) {
        const mockHotel = {
          id: hotelId,
          hotel_uuid: hotelId,
          hotel_nome: '',
          hora_checkin: '14:00:00',
          hora_checkout: '12:00:00',
          hotel_capa: ''
        };
        setHotel(mockHotel);
        return mockHotel;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar hotel
  const updateHotel = useCallback(async (hotelId, hotelData) => {
    console.log('Atualizando hotel:', hotelId, hotelData);
    setLoading(true);
    setError(null);

    try {
      // Formatar os horários para o formato esperado pela API (HH:MM:SS)
      const formattedData = {
        hotel_nome: hotelData.hotel_nome,
        hotel_capa: hotelData.hotel_capa || '',
        hora_checkin: hotelData.hora_checkin ? `${hotelData.hora_checkin}:00` : '14:00:00',
        hora_checkout: hotelData.hora_checkout ? `${hotelData.hora_checkout}:00` : '12:00:00'
      };

      console.log('Dados formatados:', formattedData);

      const response = await apiService.updateHotel(hotelId, formattedData);
      
      // A API retorna { message: '...', hotel: {...} }
      const updatedHotel = response.hotel || response;
      
      setHotel(updatedHotel);
      toast.success(response.message || 'Hotel atualizado com sucesso!');
      return true;
    } catch (err) {
      let errorMessage = err.message || 'Erro ao atualizar hotel';
      
      // Tratar erros específicos
      if (err.message.includes('401')) {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
      } else if (err.message.includes('403')) {
        errorMessage = 'Você não tem permissão para editar este hotel.';
      } else if (err.message.includes('409')) {
        errorMessage = 'Já existe um hotel com esse nome.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir hotel
  const deleteHotel = useCallback(async (hotelId) => {
    if (!confirm('Tem certeza que deseja excluir este hotel?')) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.deleteHotel(hotelId);
      toast.success(response.message || 'Hotel excluído com sucesso!');
      return true;
    } catch (err) {
      let errorMessage = err.message || 'Erro ao excluir hotel';
      
      if (err.message.includes('401')) {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
      } else if (err.message.includes('403')) {
        errorMessage = 'Você não tem permissão para excluir este hotel.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpar dados
  const clearHotel = useCallback(() => {
    setHotel(null);
    setError(null);
  }, []);

  return {
    hotel,
    loading,
    error,
    fetchHotel,
    updateHotel,
    deleteHotel,
    clearHotel
  };
};