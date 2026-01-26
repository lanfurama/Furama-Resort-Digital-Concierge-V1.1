import React, { useCallback, memo } from 'react';
import { GuestLogin } from '../components/login/GuestLogin';
import { useTranslation } from '../contexts/LanguageContext';

const GuestLoginPage: React.FC = memo(() => {
  const { setLanguage } = useTranslation();

  // Memoize handler to prevent re-renders
  const handleLoginSuccess = useCallback((user: any) => {
    // Save user to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('furama_user', JSON.stringify(user));
    }
    
    // Set language if available
    if (user.language) {
      setLanguage(user.language as any);
    }
    
    // Redirect to home (guest dashboard)
    window.location.href = '/';
  }, [setLanguage]);

  return (
    <GuestLogin
      onLoginSuccess={handleLoginSuccess}
      setLanguage={setLanguage}
    />
  );
});

GuestLoginPage.displayName = 'GuestLoginPage';

export default GuestLoginPage;

