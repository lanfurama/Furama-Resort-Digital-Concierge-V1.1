import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLogin } from '../components/login/StaffLogin';
import { UserRole } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { setDriverOnlineFor10Hours } from '../services/dataService';
import { Briefcase, Building2, Car, UserCheck, ArrowLeft, Shield } from 'lucide-react';

const CollectionLoginPage: React.FC = () => {
  const { setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Mapping từ role sang route path
  const roleToRouteMap: Record<UserRole, string> = {
    [UserRole.RECEPTION]: '/reception/login',
    [UserRole.STAFF]: '/staff/login',
    [UserRole.DRIVER]: '/driver/login',
    [UserRole.SUPERVISOR]: '/supervisor/login',
    [UserRole.ADMIN]: '/admin/login',
    [UserRole.GUEST]: '/login'
  };

  // Chỉ hiển thị 5 role được yêu cầu
  const allowedRoles = [
    {
      role: UserRole.RECEPTION,
      label: 'Hotline',
      icon: Building2,
      description: 'Front Desk Access',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      borderColor: 'border-pink-500'
    },
    {
      role: UserRole.STAFF,
      label: 'Staff',
      icon: Briefcase,
      description: 'Service Management',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-500'
    },
    {
      role: UserRole.DRIVER,
      label: 'Driver',
      icon: Car,
      description: 'Buggy Service',
      color: 'from-amber-500 to-yellow-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-500'
    },
    {
      role: UserRole.SUPERVISOR,
      label: 'Supervisor',
      icon: UserCheck,
      description: 'Management Access',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-500'
    },
    {
      role: UserRole.ADMIN,
      label: 'Admin',
      icon: Shield,
      description: 'System Administration',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-500'
    }
  ];

  const handleLoginSuccess = async (user: any) => {
    localStorage.setItem('furama_user', JSON.stringify(user));
    if (user.language) {
      setLanguage(user.language as any);
    }

    // Set driver online for 10 hours on first login (chỉ cho DRIVER)
    if (user.id && user.role === UserRole.DRIVER) {
      try {
        await setDriverOnlineFor10Hours(user.id);
      } catch (error) {
        console.error('Failed to set driver online for 10 hours:', error);
        // Continue with login even if this fails
      }
    }

    // Redirect based on role
    switch (user.role) {
      case UserRole.SUPERVISOR:
        window.location.href = '/admin';
        break;
      case UserRole.ADMIN:
        window.location.href = '/admin';
        break;
      case UserRole.DRIVER:
        window.location.href = '/driver';
        break;
      case UserRole.STAFF:
        window.location.href = '/staff';
        break;
      case UserRole.RECEPTION:
        window.location.href = '/reception';
        break;
      default:
        window.location.href = '/';
    }
  };

  // Nếu đã chọn role, hiển thị form login với nút back
  if (selectedRole) {
    return (
      <div className="relative">
        <button
          onClick={() => setSelectedRole(null)}
          className="absolute top-6 left-6 z-20 text-gray-400 hover:text-gray-600 transition flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-semibold">Back to Role Selection</span>
        </button>
        <StaffLogin
          role={selectedRole}
          onLoginSuccess={handleLoginSuccess}
          setLanguage={setLanguage}
        />
      </div>
    );
  }

  // Hiển thị màn hình chọn role
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-900 rounded-b-[3rem] z-0"></div>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 z-10 relative">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-emerald-900 mb-2">FURAMA</h1>
          <p className="text-xs tracking-widest text-emerald-600 uppercase">Resort & Villas Danang</p>
          <div className="w-16 h-1 bg-amber-400 mx-auto mt-4"></div>
          <p className="text-sm text-gray-600 mt-6 font-semibold">Select Your Role</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allowedRoles.map((config) => {
            const Icon = config.icon;
            return (
              <button
                key={config.role}
                onClick={() => navigate(roleToRouteMap[config.role])}
                className={`${config.bgColor} ${config.borderColor} p-6 rounded-xl shadow-md border-4 hover:shadow-lg transition-all transform hover:scale-105 active:scale-95`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${config.color} text-white shadow-lg`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-bold text-lg ${config.textColor}`}>{config.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">© 2025 Furama Resort Danang. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default CollectionLoginPage;

