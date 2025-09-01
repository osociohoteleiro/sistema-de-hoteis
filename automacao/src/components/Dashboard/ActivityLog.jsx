import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Play, 
  Plus, 
  Settings,
  Clock
} from 'lucide-react';

const ActivityLog = ({ activities }) => {
  const getActivityIcon = (type, status) => {
    switch (type) {
      case 'execution':
        return status === 'success' ? CheckCircle : Play;
      case 'error':
        return AlertCircle;
      case 'created':
        return Plus;
      case 'updated':
        return Settings;
      default:
        return Info;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-green-200';
      case 'error':
        return 'border-red-200';
      case 'info':
        return 'border-blue-200';
      case 'warning':
        return 'border-yellow-200';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          Log de Atividades
        </h3>
        <p className="text-sm text-gray-600 mt-1">Atividades recentes do sistema</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type, activity.status);
            const colorClasses = getActivityColor(activity.status);
            const borderColor = getBorderColor(activity.status);
            
            return (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-4 rounded-lg border ${borderColor} bg-gray-50 hover:bg-gray-100 transition-colors`}
              >
                <div className={`p-2 rounded-full ${colorClasses}`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </p>
                </div>
                
                {/* Status badge */}
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'success' ? 'bg-green-100 text-green-800' :
                    activity.status === 'error' ? 'bg-red-100 text-red-800' :
                    activity.status === 'info' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status === 'success' ? 'Sucesso' :
                     activity.status === 'error' ? 'Erro' :
                     activity.status === 'info' ? 'Info' :
                     'Neutro'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* View all button */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Ver todas as atividades
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;