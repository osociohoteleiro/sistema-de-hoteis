import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

export const useHotelList = () => {
  const { config } = useApp();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHotels = useCallback(async () => {
    if (!config.apiEndpoints.listHotels) {
      setError('Endpoint de listagem de hotéis não configurado');
      setHotels([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(config.apiEndpoints.listHotels);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const hotelList = Array.isArray(data) ? data : [];
      
      // Mapear para formato necessário para o select
      const formattedHotels = hotelList.map(hotel => ({
        value: hotel.hotel_uuid,
        label: hotel.hotel_nome || `Hotel ${hotel.hotel_uuid}`,
        hotel_uuid: hotel.hotel_uuid,
        hotel_nome: hotel.hotel_nome
      }));

      setHotels(formattedHotels);
      return formattedHotels;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar lista de hotéis';
      setError(errorMessage);
      console.error('Error fetching hotel list:', err);
      setHotels([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [config.apiEndpoints.listHotels]);

  useEffect(() => {
    fetchHotels();
  }, [config.apiEndpoints.listHotels, fetchHotels]);

  return {
    hotels,
    loading,
    error,
    refetch: fetchHotels
  };
};