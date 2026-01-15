import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'md',
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center ${className}`}>
        <div className="flex flex-col items-center space-y-6 animate-fade-in">
          {/* Brand Identity */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/20">
              <span className="text-white font-serif text-3xl font-bold">F</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-800 tracking-wider">FURAMA</h1>
            <p className="text-xs text-emerald-600 font-medium tracking-[0.3em] mt-1 uppercase">Resort Danang</p>
          </div>

          {/* Loading Indicator */}
          <div className="flex flex-col items-center space-y-3 mt-8">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" strokeWidth={2.5} />
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest animate-pulse">
              {message || 'Loading Application'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-3">
        <Loader2 className={`${sizeClasses[size]} text-emerald-600 animate-spin`} />
        {message && (
          <p className="text-sm text-gray-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

export default Loading;

