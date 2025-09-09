import { LogOut } from 'lucide-react';

const CheckOut = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="animate-fade-in">
          <h1 className="page-title">Check-out</h1>
          <p className="page-subtitle">
            Processe o check-out dos hóspedes com agilidade
          </p>
        </div>
      </div>
      
      <div className="card card-hover animate-fade-in">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🚺</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Funcionalidade em Desenvolvimento</h2>
          <p className="text-slate-600 mb-6">
            Módulo de check-out está sendo criado para proporcionar uma experiência completa de saída dos hóspedes.
          </p>
          <div className="status-badge status-warning">
            Em Desenvolvimento
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckOut;