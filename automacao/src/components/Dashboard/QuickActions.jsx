import React from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  Settings,
  Play,
  Pause,
  BarChart3,
  FileText,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'create-flow',
      title: 'Criar Novo Fluxo',
      description: 'Crie um novo fluxo de automação',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => navigate('/flow-builder')
    },
    {
      id: 'import-flow',
      title: 'Importar Fluxo',
      description: 'Importe um fluxo existente',
      icon: Upload,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => console.log('Import flow')
    },
    {
      id: 'export-flows',
      title: 'Exportar Fluxos',
      description: 'Exporte seus fluxos',
      icon: Download,
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => console.log('Export flows')
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Configurar sistema',
      icon: Settings,
      color: 'bg-gray-600 hover:bg-gray-700',
      onClick: () => console.log('Settings')
    }
  ];

  const quickStats = [
    { label: 'Fluxos em Execução', value: '3', icon: Play, color: 'text-green-600' },
    { label: 'Fluxos Pausados', value: '2', icon: Pause, color: 'text-yellow-600' },
    { label: 'Total de Triggers', value: '24', icon: Zap, color: 'text-blue-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
          <p className="text-sm text-gray-600 mt-1">Acesso rápido às funcionalidades principais</p>
        </div>
        
        <div className="p-6">
          <div className="grid gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className={`flex items-center gap-3 w-full p-4 text-white rounded-lg transition-colors ${action.color}`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Status Rápido</h3>
          <p className="text-sm text-gray-600 mt-1">Visão geral do estado atual</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-sm text-gray-700">{stat.label}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stat.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Novidades</h4>
            <p className="text-sm text-gray-600">Atualizações recentes do sistema</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Nova funcionalidade: Templates de fluxo</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Melhoria: Performance 30% mais rápida</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Integração: Novo conector WhatsApp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;