import React from 'react';
import { GuestLogin } from '../components/login/GuestLogin';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

const GuestLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLanguage } = useTranslation();

  const handleLoginSuccess = (user: any) => {
    // Save user to localStorage
    localStorage.setItem('furama_user', JSON.stringify(user));
    
    // Set language if available
    if (user.language) {
      setLanguage(user.language as any);
    }
    
    // Redirect to home (guest dashboard)
    window.location.href = '/';
  };

  return (
    <GuestLogin
      onLoginSuccess={handleLoginSuccess}
      setLanguage={setLanguage}
    />
  );
};

export default GuestLoginPage;

