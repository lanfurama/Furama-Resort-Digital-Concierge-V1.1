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

  // Chỉ hiển thị 5 role được yêu cầu - Hotline đặt ở cuối
  const allowedRoles = [
    {
      role: UserRole.STAFF,
      label: 'Staff',
      icon: Briefcase,
      description: 'Service Management',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-400'
    },
    {
      role: UserRole.DRIVER,
      label: 'Driver',
      icon: Car,
      description: 'Buggy Service',
      color: 'from-amber-500 to-yellow-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-400'
    },
    {
      role: UserRole.SUPERVISOR,
      label: 'Supervisor',
      icon: UserCheck,
      description: 'Management Access',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-400'
    },
    {
      role: UserRole.ADMIN,
      label: 'Admin',
      icon: Shield,
      description: 'System Administration',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-400'
    },
    {
      role: UserRole.RECEPTION,
      label: 'Hotline',
      icon: Building2,
      description: 'Front Desk Access',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
      textColor: 'text-pink-700',
      borderColor: 'border-pink-400'
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-emerald-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 rounded-b-[4rem] z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_50%)]"></div>
      </div>
      
      {/* Floating decorative circles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 right-20 w-24 h-24 bg-blue-200/20 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 z-10 relative border border-white/20">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-4">
            <h1 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-900 bg-clip-text text-transparent mb-2 tracking-tight">
              FURAMA
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          </div>
          <p className="text-xs md:text-sm tracking-[0.2em] text-emerald-600 uppercase font-medium mb-6">Resort & Villas Danang</p>
          <div className="relative">
            <p className="text-base md:text-lg text-gray-700 font-semibold relative inline-block">
              Select Your Role
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 to-amber-400"></span>
            </p>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {allowedRoles.map((config, index) => {
            const Icon = config.icon;
            return (
              <button
                key={config.role}
                onClick={() => navigate(roleToRouteMap[config.role])}
                className={`${config.bgColor} ${config.borderColor} p-6 md:p-7 rounded-2xl shadow-lg border-2 active:scale-[0.98]`}
              >
                <div className="flex items-center space-x-5">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${config.color} text-white shadow-xl`}>
                    <Icon size={28} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-bold text-xl md:text-2xl ${config.textColor} mb-1`}>
                      {config.label}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">{config.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 font-medium">© 2025 Furama Resort Danang. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default CollectionLoginPage;

