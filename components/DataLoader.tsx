import React, { ReactNode } from 'react';
import Loading from './Loading';

interface DataLoaderProps {
  isLoading: boolean;
  message?: string;
  children: ReactNode;
  /** Full-screen overlay when loading (e.g. initial page load). Default false = inline block. */
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Shared wrapper for API data loading. Shows Loading while isLoading, otherwise renders children.
 */
export const DataLoader: React.FC<DataLoaderProps> = ({
  isLoading,
  message = 'Loading...',
  children,
  fullScreen = false,
  size = 'md',
  className = '',
}) => {
  if (isLoading) {
    return (
      <Loading
        message={message}
        size={size}
        fullScreen={fullScreen}
        className={className}
      />
    );
  }
  return <>{children}</>;
};

export default DataLoader;
