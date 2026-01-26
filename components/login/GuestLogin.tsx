import React, { useState, useCallback, useMemo, memo } from 'react';
import Loading from '../Loading';
import { UserRole } from '../../types';
import { authenticateUserByCode, authenticateUser } from '../../services/authService';
import { useTranslation } from '../../contexts/LanguageContext';

interface GuestLoginProps {
  onLoginSuccess: (user: any) => void;
  setLanguage: (lang: string) => void;
}

// Memoized component to prevent unnecessary re-renders
export const GuestLogin: React.FC<GuestLoginProps> = memo(({ onLoginSuccess, setLanguage }) => {
  // Login method: 'code' or 'room'
  const [loginMethod, setLoginMethod] = useState<'code' | 'room'>('code');

  // Check-in code method - optimize localStorage reads
  const [checkInCode, setCheckInCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('guest_check_in_code');
      return saved || '';
    }
    return '';
  });
  const [rememberCode, setRememberCode] = useState(true);

  // Room number + last name method
  const [roomNumber, setRoomNumber] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('guest_room_number');
      return saved || '';
    }
    return '';
  });
  const [lastName, setLastName] = useState('');

  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const { t } = useTranslation();

  // Memoize handlers to prevent re-renders
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
        if (rememberCode && typeof window !== 'undefined') {
          localStorage.setItem('guest_check_in_code', checkInCode.trim().toUpperCase());
          localStorage.setItem('guest_room_number', foundUser.roomNumber || '');
        } else if (typeof window !== 'undefined') {
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('guest_room_number', roomNumber.trim());
        }
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
      // Silent error handling for production - only show user-friendly message
      setAuthError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  }, [loginMethod, checkInCode, rememberCode, lastName, roomNumber, onLoginSuccess, setLanguage]);

  const handleMethodChange = useCallback((method: 'code' | 'room') => {
    setLoginMethod(method);
    setAuthError('');
  }, []);

  const handleCheckInCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckInCode(e.target.value.toUpperCase());
  }, []);

  const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
  }, []);

  const handleRoomNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomNumber(e.target.value);
  }, []);

  const handleRememberCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberCode(e.target.checked);
  }, []);

  // Memoize background styles to prevent recalculation
  const backgroundStyles = useMemo(() => ({
    emerald: {
      background: loginMethod === 'code' 
        ? 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)'
        : 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
      willChange: 'transform' as const,
      transform: 'translateZ(0)'
    },
    white: {
      background: 'linear-gradient(180deg, #f5f5f4 0%, #e7e5e4 100%)',
      willChange: 'transform' as const,
      transform: 'translateZ(0)'
    }
  }), [loginMethod]);

  if (showLoading) {
    return <Loading fullScreen={true} message="Loading Home..." />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Optimized Background - Simplified for WebView performance */}
      {/* Emerald Green Section - Reduced animation complexity */}
      <div 
        className={`absolute left-0 w-full h-1/2 z-0 transition-transform duration-500 ease-out ${
          loginMethod === 'code' 
            ? 'top-0 rounded-b-[3rem]' 
            : 'top-1/2 rounded-t-[3rem]'
        }`}
        style={backgroundStyles.emerald}
      />
      
      {/* White Section - Simplified */}
      <div 
        className={`absolute left-0 w-full h-1/2 z-0 transition-transform duration-500 ease-out ${
          loginMethod === 'code' 
            ? 'top-1/2 rounded-t-[3rem]' 
            : 'top-0 rounded-b-[3rem]'
        }`}
        style={backgroundStyles.white}
      />

      {/* Main Login Card with enhanced animations */}
      <div 
        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 z-10 relative border border-emerald-100/50 animate-card-entrance"
        style={{
          boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          willChange: 'transform, opacity'
        }}
      >
        {/* Logo Section - Simplified */}
        <div className="text-center mb-8 animate-logo-entrance">
          <div 
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 rounded-xl mb-4 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
              transform: 'translateZ(0)'
            }}
          >
            <h1 className="font-serif text-3xl font-bold text-white">FURAMA</h1>
          </div>
          <p className="text-xs tracking-widest text-emerald-800 uppercase font-semibold animate-fade-in-delay">Resort & Villas Danang</p>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-4"></div>
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
              onClick={() => handleMethodChange('code')}
              className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-colors duration-200 ${
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
              onClick={() => handleMethodChange('room')}
              className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-colors duration-200 ${
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
                      onChange={handleCheckInCodeChange}
                      className="w-full px-5 py-4 rounded-lg border-2 border-gray-200 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-colors duration-200 text-black text-center text-2xl font-bold tracking-widest hover:border-emerald-300 focus:shadow-lg focus:shadow-emerald-700/20"
                      placeholder="Enter code"
                      maxLength={8}
                      required
                      autoFocus
                      style={{ transform: 'translateZ(0)' }}
                    />
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
                      onChange={handleRememberCodeChange}
                      className="w-4 h-4 text-emerald-800 border-gray-300 rounded focus:ring-emerald-800 focus:ring-2 cursor-pointer transition-colors duration-200"
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
                      onChange={handleLastNameChange}
                      className="w-full px-5 py-4 rounded-lg border-2 border-gray-200 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-colors duration-200 text-black hover:border-emerald-300 focus:shadow-lg focus:shadow-emerald-700/20"
                      placeholder="Enter your last name"
                      required
                      autoFocus
                      style={{ transform: 'translateZ(0)' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide animate-fade-in-delay">Room Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={handleRoomNumberChange}
                      className="w-full px-5 py-4 rounded-lg border-2 border-gray-200 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-colors duration-200 text-black hover:border-emerald-300 focus:shadow-lg focus:shadow-emerald-700/20"
                      placeholder="Enter your room number"
                      required
                      style={{ transform: 'translateZ(0)' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {authError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm flex items-center gap-3 animate-error-shake shadow-md">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthLoading}
            className="relative w-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
              transform: 'translateZ(0)'
            }}
          >
            {isAuthLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Optimized CSS Animations - Simplified for WebView Performance */}
      <style>{`
        /* Simplified animations - GPU accelerated */
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.4s ease-out 0.15s forwards;
          opacity: 0;
        }
        .animate-fade-in-delay-2 {
          animation: fade-in 0.4s ease-out 0.3s forwards;
          opacity: 0;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateZ(0);
          }
        }
        .animate-card-entrance {
          animation: slide-up 0.5s ease-out forwards;
        }
        .animate-logo-entrance {
          animation: slide-up 0.5s ease-out 0.1s forwards;
          opacity: 0;
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-10px) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateZ(0);
          }
        }
        .animate-form-slide-in {
          animation: slide-in 0.4s ease-out forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0) translateZ(0); }
          25% { transform: translateX(-6px) translateZ(0); }
          75% { transform: translateX(6px) translateZ(0); }
        }
        .animate-error-shake {
          animation: shake 0.4s ease-in-out forwards;
        }

        /* GPU acceleration hints */
        .animate-card-entrance,
        .animate-logo-entrance,
        .animate-form-slide-in {
          will-change: transform, opacity;
        }

        /* Reduce motion for accessibility and performance */
        @media (prefers-reduced-motion: reduce) {
          .animate-card-entrance,
          .animate-logo-entrance,
          .animate-fade-in,
          .animate-fade-in-delay,
          .animate-fade-in-delay-2,
          .animate-form-slide-in,
          .animate-error-shake {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        /* WebView optimizations */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if props actually change
  return prevProps.onLoginSuccess === nextProps.onLoginSuccess && 
         prevProps.setLanguage === nextProps.setLanguage;
});

GuestLogin.displayName = 'GuestLogin';

