import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'info' | 'warning';
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, type }) => {
  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl max-w-sm ${
        type === 'success' ? 'bg-emerald-500' : type === 'info' ? 'bg-blue-500' : 'bg-amber-500'
      } text-white`}
    >
      {type === 'warning' ? (
        <AlertCircle size={20} className="flex-shrink-0" />
      ) : (
        <CheckCircle size={20} className="flex-shrink-0" />
      )}
      <span className="font-semibold text-sm">{message}</span>
    </div>
  );
};
