import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';
import { authenticateStaff } from '../../services/authService';
import { Eye, EyeOff, Lock, User, Shield, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (user: any) => void;
  setLanguage: (lang: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, setLanguage }) => {
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

      // Verify the user's role matches admin
      if (foundUser.role !== UserRole.ADMIN) {
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/fu25ad/login')}
        className="absolute top-6 left-6 z-20 text-emerald-800 hover:text-emerald-900 transition-all flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl border-2 border-emerald-400 hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-semibold">Back to Role Selection</span>
      </button>

      {/* Main Login Card */}
      <div className="w-full max-w-md z-10 relative">
        {/* Glassmorphism Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-emerald-400/50 p-8 md:p-10 relative overflow-hidden">
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>
          
          {/* Sparkle Icons */}
          <div className="absolute top-6 right-6 text-emerald-400/30">
            <Sparkles size={24} />
          </div>
          <div className="absolute bottom-6 left-6 text-teal-400/30">
            <Sparkles size={20} />
          </div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-serif text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent mb-2">
              FURAMA
            </h1>
            <p className="text-xs tracking-[0.2em] text-emerald-600 uppercase font-medium mb-3">
              Resort & Villas Danang
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400"></div>
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Administrator Portal</h2>
            <p className="text-sm text-gray-500 mt-2">Secure access to management system</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <User size={14} />
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="relative w-full px-4 py-3.5 pl-12 rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 font-medium"
                  placeholder="Enter your Staff ID"
                  required
                />
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Lock size={14} />
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative w-full px-4 py-3.5 pl-12 pr-12 rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 font-medium"
                  placeholder="Enter your password"
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100/50"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 animate-shake">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <span className="font-medium">{authError}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isAuthLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    <span>Sign In to Admin Portal</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center relative z-10">
            <p className="text-xs text-gray-500 font-medium">
              © 2025 Furama Resort Danang. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">Secure • Professional • Reliable</p>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
};
