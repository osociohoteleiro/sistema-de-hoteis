import { useState } from 'react';

const Reservations = () => {
  const [activeTab, setActiveTab] = useState('all');

  const mockReservations = [
    {
      id: 1,
      guest: 'João Silva',
      email: 'joao@email.com',
      checkIn: '2024-02-15',
      checkOut: '2024-02-18',
      room: '101',
      status: 'confirmed',
      total: 450.00
    },
    {
      id: 2,
      guest: 'Maria Santos',
      email: 'maria@email.com',
      checkIn: '2024-02-20',
      checkOut: '2024-02-22',
      room: '205',
      status: 'pending',
      total: 320.00
    },
    {
      id: 3,
      guest: 'Carlos Oliveira',
      email: 'carlos@email.com',
      checkIn: '2024-02-10',
      checkOut: '2024-02-12',
      room: '303',
      status: 'completed',
      total: 280.00
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Confirmada' },
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Pendente' },
      completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Concluída' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelada' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredReservations = mockReservations.filter(reservation => {
    if (activeTab === 'all') return true;
    return reservation.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciamento de Reservas</h1>
          <p className="text-sidebar-400">Gerencie todas as reservas do seu hotel</p>
        </div>
        
        <button className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Reserva
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'all', label: 'Todas', count: mockReservations.length },
            { key: 'confirmed', label: 'Confirmadas', count: mockReservations.filter(r => r.status === 'confirmed').length },
            { key: 'pending', label: 'Pendentes', count: mockReservations.filter(r => r.status === 'pending').length },
            { key: 'completed', label: 'Concluídas', count: mockReservations.filter(r => r.status === 'completed').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'text-sidebar-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Reservations Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sidebar-400 font-medium py-3 px-4">Hóspede</th>
                <th className="text-left text-sidebar-400 font-medium py-3 px-4">Check-in</th>
                <th className="text-left text-sidebar-400 font-medium py-3 px-4">Check-out</th>
                <th className="text-left text-sidebar-400 font-medium py-3 px-4">Quarto</th>
                <th className="text-left text-sidebar-400 font-medium py-3 px-4">Status</th>
                <th className="text-left text-sidebar-400 font-medium py-3 px-4">Total</th>
                <th className="text-left text-sidebar-400 font-medium py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-white font-medium">{reservation.guest}</p>
                      <p className="text-sidebar-400 text-sm">{reservation.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sidebar-300">
                    {new Date(reservation.checkIn).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-4 px-4 text-sidebar-300">
                    {new Date(reservation.checkOut).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-4 px-4 text-white font-medium">
                    {reservation.room}
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(reservation.status)}
                  </td>
                  <td className="py-4 px-4 text-white font-medium">
                    R$ {reservation.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReservations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-sidebar-400">
                {activeTab === 'all' 
                  ? 'Não há reservas cadastradas ainda.' 
                  : `Não há reservas ${activeTab === 'confirmed' ? 'confirmadas' : activeTab === 'pending' ? 'pendentes' : 'concluídas'}.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-blue-400 font-semibold">Funcionalidade em Desenvolvimento</h4>
            <p className="text-blue-300 text-sm mt-1">
              As funcionalidades de criar, editar e gerenciar reservas estão em desenvolvimento. Os dados mostrados são exemplos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reservations;