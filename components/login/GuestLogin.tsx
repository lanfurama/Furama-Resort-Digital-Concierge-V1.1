import React, { useState } from 'react';
import Loading from '../Loading';
import { UserRole } from '../../types';
import { authenticateUserByCode, authenticateUser } from '../../services/authService';
import { useTranslation } from '../../contexts/LanguageContext';

interface GuestLoginProps {
  onLoginSuccess: (user: any) => void;
  setLanguage: (lang: string) => void;
}

export const GuestLogin: React.FC<GuestLoginProps> = ({ onLoginSuccess, setLanguage }) => {
  // Login method: 'code' or 'room'
  const [loginMethod, setLoginMethod] = useState<'code' | 'room'>('code');

  // Check-in code method
  const [checkInCode, setCheckInCode] = useState(() => {
    const saved = localStorage.getItem('guest_check_in_code');
    return saved || '';
  });
  const [rememberCode, setRememberCode] = useState(true);

  // Room number + last name method
  const [roomNumber, setRoomNumber] = useState(() => {
    const saved = localStorage.getItem('guest_room_number');
    return saved || '';
  });
  const [lastName, setLastName] = useState('');

  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    try {
      let foundUser: any = null;

      if (loginMethod === 'code') {
        // Login with check-in code
        foundUser = await authenticateUserByCode(checkInCode.trim().toUpperCase());

        if (!foundUser) {
          setAuthError('Invalid check-in code. Please check your code and try again.');
          setIsAuthLoading(false);
          return;
        }

        // Save check-in code to localStorage if remember is checked
        if (rememberCode) {
          localStorage.setItem('guest_check_in_code', checkInCode.trim().toUpperCase());
          localStorage.setItem('guest_room_number', foundUser.roomNumber || '');
        } else {
          // Clear saved code if user unchecks remember
          localStorage.removeItem('guest_check_in_code');
          localStorage.removeItem('guest_room_number');
        }
      } else {
        // Login with room number and last name
        foundUser = await authenticateUser(lastName.trim(), roomNumber.trim());

        if (!foundUser) {
          setAuthError('Invalid room number or last name. Please check and try again.');
          setIsAuthLoading(false);
          return;
        }

        // Save room number to localStorage
        localStorage.setItem('guest_room_number', roomNumber.trim());
      }


      if (foundUser) {
        // Show loading screen immediately
        setShowLoading(true);

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

  if (showLoading) {
    return <Loading fullScreen={true} message="Loading Home..." />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Enhanced Animated Background with Gradient */}
      {/* Emerald Green Section with gradient */}
      <div 
        className={`absolute left-0 w-full h-1/2 z-0 transition-all duration-700 ease-in-out ${
          loginMethod === 'code' 
            ? 'top-0 rounded-b-[3rem]' 
            : 'top-1/2 rounded-t-[3rem]'
        }`}
        style={{
          background: loginMethod === 'code' 
            ? 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)'
            : 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 rounded-b-[3rem]"></div>
      </div>
      
      {/* White Section with subtle texture */}
      <div 
        className={`absolute left-0 w-full h-1/2 z-0 transition-all duration-700 ease-in-out ${
          loginMethod === 'code' 
            ? 'top-1/2 rounded-t-[3rem]' 
            : 'top-0 rounded-b-[3rem]'
        }`}
        style={{
          background: 'linear-gradient(180deg, #f5f5f4 0%, #e7e5e4 100%)',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      {/* Main Login Card with enhanced animations */}
      <div 
        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 z-10 relative border border-emerald-100/50 animate-card-entrance"
        style={{
          boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          willChange: 'transform, opacity'
        }}
      >
        {/* Logo Section with entrance animation */}
        <div className="text-center mb-8 animate-logo-entrance">
          <div 
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 rounded-xl mb-4 shadow-lg relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
              transform: 'translateZ(0)'
            }}
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <h1 className="font-serif text-3xl font-bold text-white relative z-10">FURAMA</h1>
          </div>
          <p className="text-xs tracking-widest text-emerald-800 uppercase font-semibold animate-fade-in-delay">Resort & Villas Danang</p>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-4 animate-line-expand"></div>
          <p className="text-sm text-gray-700 mt-4 font-semibold animate-fade-in-delay-2">Guest Login</p>
        </div>

        {/* Login Method Selection with enhanced sliding animation */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1 relative overflow-hidden">
            {/* Enhanced animated sliding indicator with gradient */}
            <div 
              className={`absolute top-1 bottom-1 rounded-md shadow-lg transition-all duration-500 ease-out ${
                loginMethod === 'code' 
                  ? 'left-1 right-1/2' 
                  : 'left-1/2 right-1'
              }`}
              style={{
                background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                willChange: 'left, right',
                transform: 'translateZ(0)'
              }}
            >
              {/* Inner glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-md"></div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('code');
                setAuthError('');
              }}
              className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${
                loginMethod === 'code'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              Check-in Code
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('room');
                setAuthError('');
              }}
              className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${
                loginMethod === 'room'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              Room & Name
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative min-h-[200px] overflow-hidden">
            {loginMethod === 'code' ? (
              <div className="space-y-5 animate-form-slide-in" key="code-form">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide animate-fade-in">Check-in Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={checkInCode}
                      onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                      className="w-full px-5 py-4 rounded-lg border-2 border-gray-200 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-all duration-300 text-black text-center text-2xl font-bold tracking-widest hover:border-emerald-300 focus:shadow-lg focus:shadow-emerald-700/20"
                      placeholder="Enter code"
                      maxLength={8}
                      required
                      autoFocus
                      style={{ transform: 'translateZ(0)' }}
                    />
                    {/* Focus glow effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center animate-fade-in-delay">
                    Enter the 8-character code provided at check-in
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-fade-in-delay-2 hover:bg-gray-100 transition-colors duration-200">
                  <input
                    type="checkbox"
                    id="rememberCode"
                    checked={rememberCode}
                    onChange={(e) => setRememberCode(e.target.checked)}
                    className="w-4 h-4 text-emerald-800 border-gray-300 rounded focus:ring-emerald-800 focus:ring-2 cursor-pointer transition-all duration-200"
                  />
                  <label htmlFor="rememberCode" className="text-sm text-gray-700 cursor-pointer font-medium">
                    Remember this code on this device
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-form-slide-in" key="room-form">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide animate-fade-in">Last Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-5 py-4 rounded-lg border-2 border-gray-200 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-all duration-300 text-black hover:border-emerald-300 focus:shadow-lg focus:shadow-emerald-700/20"
                      placeholder="Enter your last name"
                      required
                      autoFocus
                      style={{ transform: 'translateZ(0)' }}
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide animate-fade-in-delay">Room Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full px-5 py-4 rounded-lg border-2 border-gray-200 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-all duration-300 text-black hover:border-emerald-300 focus:shadow-lg focus:shadow-emerald-700/20"
                      placeholder="Enter your room number"
                      required
                      style={{ transform: 'translateZ(0)' }}
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {authError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm flex items-center gap-3 animate-error-shake shadow-md">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 animate-icon-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthLoading}
            className="relative w-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
            onMouseEnter={(e) => {
              if (!isAuthLoading) {
                e.currentTarget.style.transform = 'translateY(-2px) translateZ(0)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) translateZ(0)';
            }}
            onMouseDown={(e) => {
              if (!isAuthLoading) {
                e.currentTarget.style.transform = 'translateY(0) scale(0.98) translateZ(0)';
              }
            }}
            onMouseUp={(e) => {
              if (!isAuthLoading) {
                e.currentTarget.style.transform = 'translateY(-2px) translateZ(0)';
              }
            }}
          >
            {/* Ripple effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            
            {isAuthLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10"></div>
                <span className="relative z-10">Logging in...</span>
              </>
            ) : (
              <>
                <span className="relative z-10">Login</span>
                <svg className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">© 2025 Furama Resort Danang. All rights reserved.</p>
        </div>
      </div>

      {/* Enhanced Custom Animations - Optimized for Performance */}
      <style>{`
        /* Card entrance animation */
        @keyframes card-entrance {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) translateZ(0);
          }
        }
        .animate-card-entrance {
          animation: card-entrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Logo entrance animation */
        @keyframes logo-entrance {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) translateZ(0);
          }
        }
        .animate-logo-entrance {
          animation: logo-entrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Fade in animations with delays */
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.5s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-fade-in-delay-2 {
          animation: fade-in 0.5s ease-out 0.4s forwards;
          opacity: 0;
        }

        /* Line expand animation */
        @keyframes line-expand {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: 4rem;
            opacity: 1;
          }
        }
        .animate-line-expand {
          animation: line-expand 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
          width: 0;
          opacity: 0;
        }

        /* Form slide in animation */
        @keyframes form-slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateZ(0);
          }
        }
        .animate-form-slide-in {
          animation: form-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Error shake animation */
        @keyframes error-shake {
          0%, 100% {
            transform: translateX(0) translateZ(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-8px) translateZ(0);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(8px) translateZ(0);
          }
        }
        .animate-error-shake {
          animation: error-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
        }

        /* Icon bounce animation */
        @keyframes icon-bounce {
          0%, 100% {
            transform: translateY(0) translateZ(0);
          }
          50% {
            transform: translateY(-4px) translateZ(0);
          }
        }
        .animate-icon-bounce {
          animation: icon-bounce 0.6s ease-in-out 0.2s;
        }

        /* Performance optimizations */
        .animate-card-entrance,
        .animate-logo-entrance,
        .animate-form-slide-in {
          will-change: transform, opacity;
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .animate-card-entrance,
          .animate-logo-entrance,
          .animate-fade-in,
          .animate-fade-in-delay,
          .animate-fade-in-delay-2,
          .animate-line-expand,
          .animate-form-slide-in,
          .animate-error-shake,
          .animate-icon-bounce {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

