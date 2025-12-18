import React from 'react';
import { UserRole } from '../../types';
import { User, Shield, Car, Briefcase, UserCheck, Building2 } from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void;
}

const roleConfig = [
  {
    role: UserRole.GUEST,
    label: 'Guest',
    icon: User,
    description: 'Room Number + Last Name',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700'
  },
  {
    role: UserRole.ADMIN,
    label: 'Administrator',
    icon: Shield,
    description: 'Full System Access',
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  {
    role: UserRole.SUPERVISOR,
    label: 'Supervisor',
    icon: UserCheck,
    description: 'Management Access',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  {
    role: UserRole.STAFF,
    label: 'Staff',
    icon: Briefcase,
    description: 'Service Management',
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700'
  },
  {
    role: UserRole.RECEPTION,
    label: 'Reception',
    icon: Building2,
    description: 'Front Desk Access',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700'
  },
  {
    role: UserRole.DRIVER,
    label: 'Driver',
    icon: Car,
    description: 'Buggy Service',
    color: 'from-amber-500 to-yellow-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700'
  }
];

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
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
          {roleConfig.map((config) => {
            const Icon = config.icon;
            return (
              <button
                key={config.role}
                onClick={() => onSelectRole(config.role)}
                className={`${config.bgColor} p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 border-2 border-transparent hover:border-${config.textColor.split('-')[1]}-300`}
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

