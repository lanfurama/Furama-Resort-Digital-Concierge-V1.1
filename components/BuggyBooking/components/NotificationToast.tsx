import React from 'react';
import { CheckCircle } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'info' | 'warning';
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, type }) => {
  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-5 ${
      type === 'success' ? 'bg-emerald-500' :
      type === 'info' ? 'bg-blue-500' :
      'bg-amber-500'
    } text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 max-w-sm`}>
      <CheckCircle size={20} />
      <span className="font-semibold">{message}</span>
    </div>
  );
};

