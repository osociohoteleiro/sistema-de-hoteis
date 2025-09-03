import { useState } from 'react';
import { Plus, Search, Filter, Calendar, Users, MapPin } from 'lucide-react';

const Reservas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const reservas = [
    {
      id: 'R001',
      guest: 'João Silva',
      room: '205',
      checkIn: '2025-09-02',
      checkOut: '2025-09-05',
      guests: 2,
      status: 'confirmed',
      total: 'R$ 1.200,00'
    },
    {
      id: 'R002',
      guest: 'Maria Santos',
      room: '301',
      checkIn: '2025-09-03',
      checkOut: '2025-09-06',
      guests: 1,
      status: 'pending',
      total: 'R$ 900,00'
    },
    {
      id: 'R003',
      guest: 'Pedro Costa',
      room: '102',
      checkIn: '2025-09-01',
      checkOut: '2025-09-02',
      guests: 3,
      status: 'checked-in',
      total: 'R$ 600,00'
    },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'status-success',
      pending: 'status-warning',
      'checked-in': 'status-info',
      'checked-out': 'bg-slate-100 text-slate-700 border border-slate-200',
      cancelled: 'status-error'
    };

    const labels = {
      confirmed: 'Confirmada',
      pending: 'Pendente',
      'checked-in': 'Check-in',
      'checked-out': 'Check-out',
      cancelled: 'Cancelada'
    };

    return (
      <span className={`status-badge ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="animate-fade-in">
          <h1 className="page-title">Reservas</h1>
          <p className="page-subtitle">
            Gerenciamento completo de reservas do hotel
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="glass-card px-4 py-2">
            <span className="text-sm font-semibold text-slate-800">{reservas.length}</span>
            <span className="text-xs text-slate-500 ml-1">reservas ativas</span>
          </div>
          <button className="btn-primary">
            <Plus size={18} className="mr-2" />
            Nova Reserva
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Buscar por hóspede ou ID da reserva..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendente</option>
              <option value="checked-in">Check-in</option>
              <option value="checked-out">Check-out</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <button className="btn-secondary">
              <Filter size={18} className="mr-2" />
              Filtros Avançados
            </button>
          </div>
        </div>
      </div>

      {/* Reservas Table */}
      <div className="table-container animate-fade-in">
        <div className="table-header">
          <div className="px-6 py-4">
            <h3 className="text-lg font-bold text-slate-800">Lista de Reservas</h3>
            <p className="text-sm text-slate-500 mt-1">Gerencie todas as reservas do hotel</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">
                  ID / Hóspede
                </th>
                <th className="table-header-cell">
                  Quarto
                </th>
                <th className="table-header-cell">
                  Datas da Estadia
                </th>
                <th className="table-header-cell">
                  Hóspedes
                </th>
                <th className="table-header-cell">
                  Status
                </th>
                <th className="table-header-cell">
                  Total
                </th>
                <th className="table-header-cell text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/60 backdrop-blur-sm">
              {reservas.map((reserva, index) => (
                <tr key={reserva.id} className="table-row group" style={{ animationDelay: `${index * 100}ms` }}>
                  <td className="table-cell">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-800 group-hover:text-primary-700 transition-colors duration-200">
                        {reserva.id}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">{reserva.guest}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{reserva.room}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-800">
                          {new Date(reserva.checkIn).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          até {new Date(reserva.checkOut).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Users className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{reserva.guests}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {getStatusBadge(reserva.status)}
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-bold text-slate-800">{reserva.total}</span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="btn-ghost text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                        Ver
                      </button>
                      <button className="btn-ghost text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reservas;