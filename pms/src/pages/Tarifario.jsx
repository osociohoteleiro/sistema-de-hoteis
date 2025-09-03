import { DollarSign } from 'lucide-react';

const Tarifario = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="animate-fade-in">
          <h1 className="page-title">Tarifário</h1>
          <p className="page-subtitle">
            Configure tarifas inteligentes e preços dos quartos
          </p>
        </div>
      </div>
      
      <div className="card card-hover animate-fade-in">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">💲</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Funcionalidade em Desenvolvimento</h2>
          <p className="text-slate-600 mb-6">
            Sistema avançado de gerenciamento de tarifas com preços dinâmicos e estratégias de revenue.
          </p>
          <div className="status-badge status-warning">
            Em Desenvolvimento
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tarifario;