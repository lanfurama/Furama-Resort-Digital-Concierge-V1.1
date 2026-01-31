import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateStaff } from '../../services/authService';
import { UserRole } from '../../types';
import { Eye, EyeOff, ArrowLeft, Car, Navigation, MapPin, Zap, Shield } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Road lines animation */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-amber-400/30 transform -translate-y-1/2">
          <div className="absolute w-full h-full bg-gradient-to-r from-transparent via-amber-400/50 to-transparent animate-pulse"></div>
        </div>
        
        {/* Floating car icons */}
        <div className="absolute top-1/4 left-1/4 text-amber-400/20 animate-bounce" style={{ animationDuration: '3s' }}>
          <Car size={80} />
        </div>
        <div className="absolute bottom-1/4 right-1/4 text-amber-500/20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Car size={60} />
        </div>
        
        {/* Navigation compass */}
        <div className="absolute top-1/3 right-1/3 text-amber-400/20 animate-spin" style={{ animationDuration: '20s' }}>
          <Navigation size={100} />
        </div>
        
        {/* Map pin elements */}
        <div className="absolute bottom-1/3 left-1/3 text-amber-500/20 animate-pulse">
          <MapPin size={50} />
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/fu25ad/login')}
        className="absolute top-6 left-6 z-20 text-amber-800 hover:text-amber-900 transition flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg hover:shadow-xl border-2 border-amber-400"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-semibold">Back to Role Selection</span>
      </button>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 z-10 relative border-2 border-amber-400/50">
        {/* Driver Badge Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-br from-amber-500 to-yellow-600 p-4 rounded-full shadow-xl">
              <Car size={32} className="text-white" />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 bg-clip-text text-transparent mb-2">
            FURAMA
          </h1>
          <p className="text-xs tracking-[0.2em] text-amber-700 uppercase font-semibold mb-3">
            Resort & Villas Danang
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            <Zap size={16} className="text-amber-500" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          </div>
          <div className="flex items-center justify-center gap-2 text-amber-700 font-bold">
            <Shield size={18} />
            <span className="text-lg">Driver Portal</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
              <Navigation size={14} className="text-amber-600" />
              Staff ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 pl-12 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                placeholder="Enter your Staff ID"
                required
                disabled={isAuthLoading}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <MapPin size={18} />
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} className="text-amber-600" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pl-12 pr-12 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                placeholder="Enter your password"
                required
                disabled={isAuthLoading}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Shield size={18} />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors"
                disabled={isAuthLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 animate-shake">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="font-medium">{authError}</span>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isAuthLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 relative overflow-hidden group"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {isAuthLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <Car size={20} />
                <span>Start Driving</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            © 2025 Furama Resort Danang. All rights reserved.
          </p>
        </div>
      </div>

      {/* Additional decorative elements */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-0">
        <div className="flex items-center gap-2 text-amber-700/60 text-xs font-medium">
          <div className="w-8 h-px bg-amber-400/50"></div>
          <span className="uppercase tracking-wider">Secure Driver Access</span>
          <div className="w-8 h-px bg-amber-400/50"></div>
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
