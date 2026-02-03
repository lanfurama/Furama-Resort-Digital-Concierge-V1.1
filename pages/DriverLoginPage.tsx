import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DriverLogin } from '../components/login/DriverLogin';
import { UserRole } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { setDriverOnlineFor10Hours } from '../services/dataService';

const DriverLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLanguage } = useTranslation();

  const handleLoginSuccess = async (user: any) => {
    localStorage.setItem('furama_user', JSON.stringify(user));
    if (user.language) {
      setLanguage(user.language as any);
    }
    
    // Set driver online for 10 hours on first login
    if (user.id && user.role === UserRole.DRIVER) {
      try {
        await setDriverOnlineFor10Hours(user.id);
      } catch (error) {
        console.error('Failed to set driver online for 10 hours:', error);
        // Continue with login even if this fails
      }
    }
    
    navigate('/driver', { replace: true });
  };

  return (
    <DriverLogin
      onLoginSuccess={handleLoginSuccess}
      setLanguage={setLanguage}
    />
  );
};

export default DriverLoginPage;

