import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  Building,
  MapPin,
  Globe,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Eye,
  BarChart3,
  ArrowLeft
} from 'lucide-react';

const PropertyManager = () => {
  const { selectedHotelUuid } = useApp();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    property_name: '',
    booking_url: '',
    location: '',
    category: '',
    max_bundle_size: 7
  });
  const [errors, setErrors] = useState({});

  const loadProperties = async () => {
    if (!selectedHotelUuid) {
      toast.error('Nenhum hotel selecionado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.getRateShopperProperties(selectedHotelUuid);
      setProperties(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar propriedades:', error);
      toast.error('Erro ao carregar propriedades do Rate Shopper');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [selectedHotelUuid]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.property_name.trim()) {
      newErrors.property_name = 'Nome da propriedade é obrigatório';
    }

    if (!formData.booking_url.trim()) {
      newErrors.booking_url = 'URL do Booking é obrigatória';
    } else if (!formData.booking_url.includes('booking.com')) {
      newErrors.booking_url = 'URL deve ser do Booking.com';
    }

    if (formData.max_bundle_size < 1 || formData.max_bundle_size > 30) {
      newErrors.max_bundle_size = 'Tamanho do bundle deve estar entre 1 e 30';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!selectedHotelUuid) {
      toast.error('Nenhum hotel selecionado');
      return;
    }

    try {
      if (editingProperty) {
        // Update existing property
        await apiService.updateRateShopperProperty(editingProperty.id, formData);
        toast.success('Propriedade atualizada com sucesso!');
      } else {
        // Add new property
        await apiService.createRateShopperProperty(selectedHotelUuid, formData);
        toast.success('Propriedade criada com sucesso!');
      }

      // Reload properties
      await loadProperties();
      
      setShowModal(false);
      setEditingProperty(null);
      setFormData({
        property_name: '',
        booking_url: '',
        location: '',
        category: '',
        max_bundle_size: 7
      });
      setErrors({});
    } catch (error) {
      console.error('Erro ao salvar propriedade:', error);
      toast.error('Erro ao salvar propriedade');
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      property_name: property.property_name,
      booking_url: property.booking_url,
      location: property.location || '',
      category: property.category || '',
      max_bundle_size: property.max_bundle_size
    });
    setShowModal(true);
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Tem certeza que deseja excluir esta propriedade? Esta ação não pode ser desfeita.')) {
      try {
        await apiService.deleteRateShopperProperty(propertyId);
        toast.success('Propriedade excluída com sucesso!');
        await loadProperties();
      } catch (error) {
        console.error('Erro ao excluir propriedade:', error);
        toast.error('Erro ao excluir propriedade');
      }
    }
  };

  const handleToggleActive = (propertyId) => {
    setProperties(properties.map(prop =>
      prop.id === propertyId
        ? { ...prop, active: !prop.active }
        : prop
    ));
  };

  const extractPropertyInfo = (url) => {
    try {
      const urlParts = url.split('/');
      const hotelPart = urlParts.find(part => part.includes('hotel')) || '';
      const propertyName = hotelPart.replace(/^hotel-/, '').replace(/\..*$/, '').replace(/-/g, ' ');
      return propertyName.toUpperCase();
    } catch {
      return '';
    }
  };

  const handleUrlChange = (url) => {
    setFormData({ ...formData, booking_url: url });
    
    if (url && !formData.property_name) {
      const extractedName = extractPropertyInfo(url);
      if (extractedName) {
        setFormData(prev => ({ ...prev, property_name: extractedName }));
      }
    }
  };

  if (!selectedHotelUuid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-6 bg-yellow-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nenhum Hotel Selecionado</h2>
          <p className="text-gray-600 mb-6">
            Para gerenciar propriedades do Rate Shopper, você precisa selecionar um hotel no cabeçalho da aplicação.
          </p>
          <Link
            to="/rate-shopper"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando propriedades...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/rate-shopper"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar ao Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Propriedades</h1>
            <p className="text-gray-600">Configure os concorrentes que deseja monitorar</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Propriedade
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Propriedades</p>
              <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{properties.filter(p => p.active).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Globe className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Booking.com</p>
              <p className="text-2xl font-bold text-gray-900">{properties.filter(p => p.ota_name === 'Booking.com').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Propriedades Cadastradas</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriedade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bundle Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((property) => (
                <tr key={property.id} className={`hover:bg-gray-50 ${!property.active ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {property.property_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {property.category} • {property.ota_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      {property.location || 'Não informado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.max_bundle_size} dias
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(property.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                        property.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {property.active ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.created_at ? new Date(property.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => window.open(property.booking_url, '_blank')}
                        className="text-gray-400 hover:text-gray-600"
                        title="Abrir URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900"
                        title="Nova busca"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(property)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(property.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProperty ? 'Editar Propriedade' : 'Nova Propriedade'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProperty(null);
                    setFormData({
                      property_name: '',
                      booking_url: '',
                      location: '',
                      category: '',
                      max_bundle_size: 7
                    });
                    setErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do Booking.com *
                  </label>
                  <input
                    type="url"
                    value={formData.booking_url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.booking_url ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="https://www.booking.com/hotel/..."
                  />
                  {errors.booking_url && (
                    <p className="mt-1 text-sm text-red-600">{errors.booking_url}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Propriedade *
                  </label>
                  <input
                    type="text"
                    value={formData.property_name}
                    onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.property_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nome do hotel/pousada"
                  />
                  {errors.property_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.property_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cidade, Estado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Pousada">Pousada</option>
                    <option value="Resort">Resort</option>
                    <option value="Apart Hotel">Apart Hotel</option>
                    <option value="Hostel">Hostel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamanho Máximo do Bundle
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.max_bundle_size}
                    onChange={(e) => setFormData({ ...formData, max_bundle_size: parseInt(e.target.value) || 1 })}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.max_bundle_size ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Máximo de dias consecutivos para agrupar em uma busca (1-30)
                  </p>
                  {errors.max_bundle_size && (
                    <p className="mt-1 text-sm text-red-600">{errors.max_bundle_size}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProperty(null);
                    setFormData({
                      property_name: '',
                      booking_url: '',
                      location: '',
                      category: '',
                      max_bundle_size: 7
                    });
                    setErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingProperty ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyManager;