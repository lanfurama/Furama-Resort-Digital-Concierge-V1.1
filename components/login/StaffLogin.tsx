import React, { useState } from 'react';
import { UserRole } from '../../types';
import { authenticateStaff } from '../../services/authService';
import { Eye, EyeOff } from 'lucide-react';

interface StaffLoginProps {
  role: UserRole;
  onLoginSuccess: (user: any) => void;
  setLanguage: (lang: string) => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ role, onLoginSuccess, setLanguage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getRoleLabel = () => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.DRIVER:
        return 'Driver';
      case UserRole.STAFF:
        return 'Staff';
      case UserRole.SUPERVISOR:
        return 'Supervisor';
      case UserRole.RECEPTION:
        return 'Reception';
      default:
        return 'Staff';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    try {
      const foundUser = await authenticateStaff(username, password);

      if (!foundUser) {
        setAuthError('Invalid credentials. Please check Username and Password.');
        setIsAuthLoading(false);
        return;
      }

      // Verify the user's role matches the login page
      if (foundUser.role !== role) {
        setAuthError(`This account is for ${foundUser.role} role. Please use the correct login page.`);
        setIsAuthLoading(false);
        return;
      }

      if (foundUser) {
        onLoginSuccess(foundUser);
        if (foundUser.language) {
          setLanguage(foundUser.language);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-900 rounded-b-[3rem] z-0"></div>
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 relative">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-emerald-900 mb-2">FURAMA</h1>
          <p className="text-xs tracking-widest text-emerald-600 uppercase">Resort & Villas Danang</p>
          <div className="w-16 h-1 bg-amber-400 mx-auto mt-4"></div>
          <p className="text-sm text-gray-600 mt-4 font-semibold">{getRoleLabel()} Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-black"
              placeholder="Staff ID"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Password</label>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-black"
                placeholder="Enter password"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
              <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
              {authError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isAuthLoading}
            className="w-full bg-emerald-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-900 transition transform active:scale-95 disabled:opacity-70 flex justify-center items-center"
          >
            {isAuthLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">© 2025 Furama Resort Danang. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};





