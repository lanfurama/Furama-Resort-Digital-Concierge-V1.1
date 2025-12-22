import React from 'react';
import { User, Shield } from 'lucide-react';

interface LoginTypeSelectionProps {
  onSelectGuest: () => void;
  onSelectStaff: () => void;
}

export const LoginTypeSelection: React.FC<LoginTypeSelectionProps> = ({ onSelectGuest, onSelectStaff }) => {
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-900 rounded-b-[3rem] z-0"></div>
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 relative">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-emerald-900 mb-2">FURAMA</h1>
          <p className="text-xs tracking-widest text-emerald-600 uppercase">Resort & Villas Danang</p>
          <div className="w-16 h-1 bg-amber-400 mx-auto mt-4"></div>
          <p className="text-sm text-gray-600 mt-6 font-semibold">How would you like to login?</p>
        </div>

        <div className="space-y-4">
          {/* Guest Login Button */}
          <button
            onClick={onSelectGuest}
            className="w-full bg-emerald-50 hover:bg-emerald-100 p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 border-2 border-emerald-200 hover:border-emerald-300"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <User size={28} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg text-emerald-700">Guest Login</h3>
                <p className="text-xs text-gray-500 mt-1">Room Number + Last Name</p>
              </div>
            </div>
          </button>

          {/* Staff/Admin Login Button */}
          <button
            onClick={onSelectStaff}
            className="w-full bg-purple-50 hover:bg-purple-100 p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 border-2 border-purple-200 hover:border-purple-300"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                <Shield size={28} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg text-purple-700">Staff / Admin Login</h3>
                <p className="text-xs text-gray-500 mt-1">Username + Password</p>
              </div>
            </div>
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">© 2025 Furama Resort Danang. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

