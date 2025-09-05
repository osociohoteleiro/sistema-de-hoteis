import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onCancel,
  title, 
  message, 
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonColor = null // Se não especificado, usa a cor baseada no tipo
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    const configs = {
      warning: {
        icon: AlertTriangle,
        iconColor: 'text-yellow-500',
        iconBg: 'bg-yellow-100',
        confirmColor: confirmButtonColor || 'bg-yellow-600 hover:bg-yellow-700'
      },
      danger: {
        icon: XCircle,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-100',
        confirmColor: confirmButtonColor || 'bg-red-600 hover:bg-red-700'
      },
      info: {
        icon: Info,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-100',
        confirmColor: confirmButtonColor || 'bg-blue-600 hover:bg-blue-700'
      },
      success: {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        iconBg: 'bg-green-100',
        confirmColor: confirmButtonColor || 'bg-green-600 hover:bg-green-700'
      }
    };
    return configs[type] || configs.warning;
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel ? onCancel() : onClose();
    }
  };

  const handleClose = () => {
    onCancel ? onCancel() : onClose();
  };

  const handleCancel = () => {
    onCancel ? onCancel() : onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.iconBg}`}>
              <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${config.confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;