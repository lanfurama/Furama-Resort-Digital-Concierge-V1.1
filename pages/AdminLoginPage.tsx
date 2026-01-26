import React from 'react';
import { AdminLogin } from '../components/login/AdminLogin';
import { useTranslation } from '../contexts/LanguageContext';

const AdminLoginPage: React.FC = () => {
  const { setLanguage } = useTranslation();

  const handleLoginSuccess = (user: any) => {
    localStorage.setItem('furama_user', JSON.stringify(user));
    if (user.language) {
      setLanguage(user.language as any);
    }
    window.location.href = '/admin';
  };

  return (
    <AdminLogin
      onLoginSuccess={handleLoginSuccess}
      setLanguage={setLanguage}
    />
  );
};

export default AdminLoginPage;

