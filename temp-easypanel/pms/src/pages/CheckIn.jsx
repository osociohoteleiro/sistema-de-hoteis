import { Search, Clock, User, Calendar } from 'lucide-react';

const CheckIn = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="animate-fade-in">
          <h1 className="page-title">Check-in</h1>
          <p className="page-subtitle">
            Realize o check-in dos hóspedes com eficiência
          </p>
        </div>
      </div>
      
      <div className="card card-hover animate-fade-in">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🔑</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Funcionalidade em Desenvolvimento</h2>
          <p className="text-slate-600 mb-6">
            Esta página está sendo desenvolvida com as mais modernas tecnologias. Em breve você poderá realizar check-ins dos hóspedes de forma rápida e intuitiva.
          </p>
          <div className="status-badge status-warning">
            Em Desenvolvimento
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;