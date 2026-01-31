import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';
import { authenticateStaff } from '../../services/authService';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface StaffLoginProps {
  role: UserRole;
  onLoginSuccess: (user: any) => void;
  setLanguage: (lang: string) => void;
}

type RoleTheme = {
  bg: string;
  accentTop: string;
  backBtn: string;
  cardBorder: string;
  title: string;
  subtitle: string;
  divider: string;
  inputFocus: string;
  inputRing: string;
  submitBtn: string;
  submitHover: string;
};

export const StaffLogin: React.FC<StaffLoginProps> = ({ role, onLoginSuccess, setLanguage }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getTheme = (): RoleTheme => {
    switch (role) {
      case UserRole.STAFF:
        return {
          bg: 'bg-gradient-to-br from-orange-50 via-red-50 to-orange-100',
          accentTop: 'bg-gradient-to-r from-orange-500 to-red-600',
          backBtn: 'text-orange-800 hover:text-orange-900 bg-white/95 border-2 border-orange-400 shadow-lg hover:shadow-xl',
          cardBorder: 'border-2 border-orange-400/50',
          title: 'text-orange-900',
          subtitle: 'text-orange-600',
          divider: 'bg-orange-400',
          inputFocus: 'focus:border-orange-500',
          inputRing: 'focus:ring-orange-200',
          submitBtn: 'bg-gradient-to-r from-orange-500 to-red-600',
          submitHover: 'hover:from-orange-600 hover:to-red-700'
        };
      case UserRole.SUPERVISOR:
        return {
          bg: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100',
          accentTop: 'bg-gradient-to-r from-blue-500 to-cyan-600',
          backBtn: 'text-blue-800 hover:text-blue-900 bg-white/95 border-2 border-blue-400 shadow-lg hover:shadow-xl',
          cardBorder: 'border-2 border-blue-400/50',
          title: 'text-blue-900',
          subtitle: 'text-blue-600',
          divider: 'bg-blue-400',
          inputFocus: 'focus:border-blue-500',
          inputRing: 'focus:ring-blue-200',
          submitBtn: 'bg-gradient-to-r from-blue-500 to-cyan-600',
          submitHover: 'hover:from-blue-600 hover:to-cyan-700'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-emerald-50 via-stone-50 to-emerald-100',
          accentTop: 'bg-emerald-900',
          backBtn: 'text-gray-600 hover:text-gray-900 bg-white/90 border border-gray-200 shadow-md hover:shadow-lg',
          cardBorder: 'border border-gray-200',
          title: 'text-emerald-900',
          subtitle: 'text-emerald-600',
          divider: 'bg-amber-400',
          inputFocus: 'focus:border-emerald-500',
          inputRing: 'focus:ring-emerald-200',
          submitBtn: 'bg-emerald-800',
          submitHover: 'hover:bg-emerald-900'
        };
    }
  };

  const theme = getTheme();

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
        return 'Hotline';
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
    <div className={`min-h-screen ${theme.bg} flex flex-col justify-center items-center p-6 relative overflow-hidden`}>
      {/* Background Accent */}
      <div className={`absolute top-0 left-0 w-full h-1/2 ${theme.accentTop} rounded-b-[3rem] z-0 opacity-90`}></div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/fu25ad/login')}
        className={`absolute top-6 left-6 z-20 transition flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-xl ${theme.backBtn}`}
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-semibold">Back to Role Selection</span>
      </button>

      <div className={`w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 z-10 relative ${theme.cardBorder}`}>
        <div className="text-center mb-8">
          <h1 className={`font-serif text-3xl font-bold ${theme.title} mb-2`}>FURAMA</h1>
          <p className={`text-xs tracking-widest ${theme.subtitle} uppercase`}>Resort & Villas Danang</p>
          <div className={`w-16 h-1 ${theme.divider} mx-auto mt-4 rounded-full`}></div>
          <p className="text-sm text-gray-600 mt-4 font-semibold">{getRoleLabel()} Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 ${theme.inputFocus} focus:ring-2 ${theme.inputRing} outline-none transition text-black`}
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
                className={`w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 ${theme.inputFocus} focus:ring-2 ${theme.inputRing} outline-none transition text-black`}
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
            className={`w-full ${theme.submitBtn} ${theme.submitHover} text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-70 flex justify-center items-center`}
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






