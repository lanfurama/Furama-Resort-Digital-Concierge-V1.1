import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return {
                    bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
                    border: 'border-emerald-400',
                    icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
                    text: 'text-emerald-900'
                };
            case 'error':
                return {
                    bg: 'bg-gradient-to-r from-red-50 to-rose-50',
                    border: 'border-red-400',
                    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
                    text: 'text-red-900'
                };
            case 'warning':
                return {
                    bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
                    border: 'border-amber-400',
                    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
                    text: 'text-amber-900'
                };
            case 'info':
                return {
                    bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
                    border: 'border-blue-400',
                    icon: <Info className="w-5 h-5 text-blue-600" />,
                    text: 'text-blue-900'
                };
            default:
                return {
                    bg: 'bg-white',
                    border: 'border-gray-300',
                    icon: <Info className="w-5 h-5 text-gray-600" />,
                    text: 'text-gray-900'
                };
        }
    };

    const styles = getToastStyles();

    return (
        <div
            className={`
        ${styles.bg} ${styles.border} 
        border-2 rounded-xl shadow-lg 
        p-4 mb-3 
        flex items-start gap-3
        animate-slideIn
        backdrop-blur-sm
        transform transition-all duration-300 ease-out
      `}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">
                {styles.icon}
            </div>
            <div className={`flex-1 ${styles.text} text-sm font-medium leading-relaxed`}>
                {toast.message}
            </div>
            <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close notification"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Toast;
