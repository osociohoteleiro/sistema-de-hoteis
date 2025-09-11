import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.js';
import toast from 'react-hot-toast';
import { useHotelList } from '../hooks/useHotelList';

const QdrantCreateCollectionModal = ({ isOpen, onClose, selectedHotelUuid, onCollectionCreated }) => {
  const { hotels } = useHotelList();
  const [collectionType, setCollectionType] = useState('texto');
  const [collectionName, setCollectionName] = useState('');
  const [vectorSize, setVectorSize] = useState(1536);
  const [submitting, setSubmitting] = useState(false);

  // Function to generate collection name based on hotel name and type
  const generateCollectionName = (hotelUuid, type) => {
    const hotel = hotels.find(h => h.hotel_uuid === hotelUuid);
    if (!hotel || !hotel.hotel_nome) return '';

    // Clean hotel name: lowercase, remove special characters, replace spaces with underscores
    const cleanName = hotel.hotel_nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Remove multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    const suffix = type === 'texto' ? '_unidades' : '_midias';
    return `${cleanName}${suffix}`;
  };

  // Update collection name when hotel or type changes
  useEffect(() => {
    if (selectedHotelUuid && hotels.length > 0) {
      const generatedName = generateCollectionName(selectedHotelUuid, collectionType);
      setCollectionName(generatedName);
    }
  }, [selectedHotelUuid, collectionType, hotels]);

  const handleCreateCollection = async () => {
    if (!collectionName.trim()) {
      toast.error('Nome da collection é obrigatório');
      return;
    }

    if (!selectedHotelUuid) {
      toast.error('Nenhum hotel selecionado');
      return;
    }

    if (vectorSize < 1 || vectorSize > 4096) {
      toast.error('Tamanho do vetor deve estar entre 1 e 4096');
      return;
    }

    setSubmitting(true);
    try {
      console.log('🚀 Criando collection:', { collectionName, vectorSize, selectedHotelUuid });
      
      const response = await fetch('${API_CONFIG.baseURLWithPath}/qdrant/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection_name: collectionName.trim(),
          vector_size: vectorSize,
          hotel_uuid: selectedHotelUuid
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Collection criada:', result);

      if (result.success) {
        toast.success(result.message || 'Collection criada com sucesso!');
        
        // Fechar modal e notificar o componente pai
        handleClose();
        if (onCollectionCreated) {
          onCollectionCreated(result);
        }
      } else {
        throw new Error(result.message || 'Erro ao criar collection');
      }
    } catch (error) {
      console.error('❌ Erro ao criar collection:', error);
      toast.error(`Erro ao criar collection: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCollectionType('texto');
    setCollectionName('');
    setVectorSize(1536);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-sidebar-800 rounded-xl border border-white/20 p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Criar Collection no Qdrant</h3>
            <p className="text-sidebar-300 text-sm mt-1">
              Crie uma nova collection vetorial para o hotel atual
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-sidebar-400 hover:text-white transition-colors"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Collection Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tipo de Collection *
            </label>
            <select
              value={collectionType}
              onChange={(e) => setCollectionType(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={submitting}
            >
              <option value="texto" className="bg-sidebar-800">Collection de texto</option>
              <option value="arquivos" className="bg-sidebar-800">Collection de arquivos</option>
            </select>
            <p className="text-sidebar-400 text-xs mt-1">
              Selecione o tipo de dados que serão armazenados na collection
            </p>
          </div>

          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nome da Collection *
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Digite o nome da collection..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={submitting}
            />
            <p className="text-sidebar-400 text-xs mt-1">
              Nome deve ser único e conter apenas letras, números, hífens e underscores
            </p>
          </div>

          {/* Vector Size */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tamanho do Vetor
            </label>
            <input
              type="number"
              value={vectorSize}
              onChange={(e) => setVectorSize(parseInt(e.target.value) || 1536)}
              min="1"
              max="4096"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent opacity-60 cursor-not-allowed"
              disabled={true}
            />
            <p className="text-sidebar-400 text-xs mt-1">
              Dimensão dos vetores (padrão: 1536 para OpenAI embeddings)
            </p>
          </div>

          {/* Hotel Info */}
          {selectedHotelUuid && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <p className="text-white text-sm">Hotel Selecionado</p>
                  <p className="text-sidebar-400 text-xs">{selectedHotelUuid}</p>
                  {(() => {
                    const hotel = hotels.find(h => h.hotel_uuid === selectedHotelUuid);
                    return hotel && hotel.hotel_nome ? (
                      <p className="text-white text-xs mt-1">{hotel.hotel_nome}</p>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sidebar-300 hover:text-white transition-colors"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateCollection}
            disabled={!collectionName.trim() || submitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Criando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Criar Collection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QdrantCreateCollectionModal;