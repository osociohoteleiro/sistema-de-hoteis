import { useState, useCallback } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

export const useHotel = () => {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar hotel individual por UUID
  const fetchHotel = useCallback(async (hotelUuid) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando hotel com UUID:', hotelUuid);
      const data = await apiService.getHotel(hotelUuid);
      console.log('✅ Hotel encontrado:', data);
      
      // A API retorna {hotel: {...}}, precisamos extrair o objeto hotel
      const hotelData = data.hotel || data;
      console.log('✅ Hotel data extracted:', hotelData);
      console.log('✅ Hotel name from API:', hotelData?.name);
      console.log('✅ Hotel checkin_time from API:', hotelData?.checkin_time);
      
      setHotel(hotelData);
      return hotelData;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar hotel';
      console.error('❌ Erro ao buscar hotel:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar hotel
  const updateHotel = useCallback(async (hotelUuid, hotelData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Atualizando hotel UUID:', hotelUuid, 'com dados:', hotelData);
      
      // Garantir formato correto dos horários
      const formattedData = {
        ...hotelData,
        checkin_time: hotelData.checkin_time + (hotelData.checkin_time.length === 5 ? ':00' : ''),
        checkout_time: hotelData.checkout_time + (hotelData.checkout_time.length === 5 ? ':00' : '')
      };

      const updatedHotel = await apiService.updateHotel(hotelUuid, formattedData);
      console.log('✅ Hotel atualizado:', updatedHotel);
      
      setHotel(updatedHotel);
      toast.success('Hotel atualizado com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao atualizar hotel';
      console.error('❌ Erro ao atualizar hotel:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Alternar status do hotel (ativar/inativar)
  const toggleHotelStatus = useCallback(async (hotelUuid, newStatus) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Alterando status do hotel UUID:', hotelUuid, 'para:', newStatus);
      const result = await apiService.toggleHotelStatus(hotelUuid, newStatus);
      console.log('✅ Status do hotel alterado com sucesso:', result);
      
      // Atualizar o hotel local com os novos dados
      if (result.hotel) {
        setHotel(result.hotel);
      }
      
      const statusText = newStatus === 'ACTIVE' ? 'ativado' : 'inativado';
      toast.success(`Hotel ${statusText} com sucesso!`);
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao alterar status do hotel';
      console.error('❌ Erro ao alterar status do hotel:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir hotel (mantido para compatibilidade, mas não recomendado)
  const deleteHotel = useCallback(async (hotelUuid) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Excluindo hotel UUID:', hotelUuid);
      await apiService.deleteHotel(hotelUuid);
      console.log('✅ Hotel excluído com sucesso');
      
      toast.success('Hotel excluído com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao excluir hotel';
      console.error('❌ Erro ao excluir hotel:', err);
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
    toggleHotelStatus,
    clearHotel
  };
};