import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, color = 'blue', change, changeLabel }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-200'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      border: 'border-emerald-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      border: 'border-red-200'
    }
  };

  const isPositiveChange = change && change.startsWith('+');
  const isNegativeChange = change && change.startsWith('-');

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${colorClasses[color].border} p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color].bg}`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].icon}`} />
        </div>
      </div>
      
      {change && changeLabel && (
        <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center">
            {isPositiveChange && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
            {isNegativeChange && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
            <span className={`text-sm font-medium ${
              isPositiveChange ? 'text-green-600' : 
              isNegativeChange ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {change}
            </span>
          </div>
          <span className="text-sm text-gray-500 ml-2">{changeLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;