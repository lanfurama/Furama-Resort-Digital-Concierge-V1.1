import React from 'react';
import { StaffLogin } from '../components/login/StaffLogin';
import { UserRole } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

const StaffLoginPage: React.FC = () => {
  const { setLanguage } = useTranslation();

  const handleLoginSuccess = (user: any) => {
    localStorage.setItem('furama_user', JSON.stringify(user));
    if (user.language) {
      setLanguage(user.language as any);
    }
    window.location.href = '/staff';
  };

  return (
    <StaffLogin
      role={UserRole.STAFF}
      onLoginSuccess={handleLoginSuccess}
      setLanguage={setLanguage}
    />
  );
};

export default StaffLoginPage;

