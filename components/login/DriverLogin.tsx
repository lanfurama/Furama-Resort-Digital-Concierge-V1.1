import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateStaff } from '../../services/authService';
import { UserRole } from '../../types';
import { Eye, EyeOff, ArrowLeft, Car, MapPin, Shield } from 'lucide-react';

interface DriverLoginProps {
  onLoginSuccess: (user: any) => void;
  setLanguage: (lang: string) => void;
}

export const DriverLogin: React.FC<DriverLoginProps> = ({ onLoginSuccess, setLanguage }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      if (foundUser.role !== UserRole.DRIVER) {
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 sm:p-5 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/fu25ad/login')}
        className="absolute top-4 left-4 z-20 text-gray-600 hover:text-gray-900 transition flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow border border-gray-200 hover:border-gray-300 text-sm font-medium"
      >
        <ArrowLeft size={16} />
        <span>Back to Role Selection</span>
      </button>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow border border-gray-200 p-5 sm:p-6 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="bg-emerald-600 p-2.5 rounded-lg">
            <Car size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Driver Portal</h1>
            <p className="text-xs text-gray-500">Furama Resort & Villas</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Staff ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 pl-10 rounded-lg border border-gray-300 bg-gray-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-gray-900 text-sm placeholder:text-gray-400"
                placeholder="Enter your Staff ID"
                required
                disabled={isAuthLoading}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <MapPin size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pl-10 pr-10 rounded-lg border border-gray-300 bg-gray-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-gray-900 text-sm placeholder:text-gray-400"
                placeholder="Enter your password"
                required
                disabled={isAuthLoading}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Shield size={16} />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isAuthLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm flex items-start gap-2 animate-shake">
              <span className="font-medium">{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg shadow-sm transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isAuthLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <Car size={18} />
                <span>Start Driving</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs text-center text-gray-400">
            © 2025 Furama Resort Danang
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
