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
      {/* Animated Background Sections - Smooth Transition */}
      {/* Emerald Green Section */}
      <div 
        className={`absolute left-0 w-full h-1/2 bg-emerald-900 z-0 transition-all duration-700 ease-in-out ${
          loginMethod === 'code' 
            ? 'top-0 rounded-b-[3rem]' 
            : 'top-1/2 rounded-t-[3rem]'
        }`}
      ></div>
      
      {/* White Section */}
      <div 
        className={`absolute left-0 w-full h-1/2 bg-stone-100 z-0 transition-all duration-700 ease-in-out ${
          loginMethod === 'code' 
            ? 'top-1/2 rounded-t-[3rem]' 
            : 'top-0 rounded-b-[3rem]'
        }`}
      ></div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 z-10 relative border border-emerald-100/50">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 rounded-xl mb-4 shadow-md">
            <h1 className="font-serif text-3xl font-bold text-white">FURAMA</h1>
          </div>
          <p className="text-xs tracking-widest text-emerald-800 uppercase font-semibold">Resort & Villas Danang</p>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-4"></div>
          <p className="text-sm text-gray-700 mt-4 font-semibold">Guest Login</p>
        </div>

        {/* Login Method Selection */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1 relative">
            {/* Animated sliding indicator */}
            <div 
              className={`absolute top-1 bottom-1 bg-emerald-800 rounded-md shadow-lg transition-all duration-500 ease-out ${
                loginMethod === 'code' 
                  ? 'left-1 right-1/2' 
                  : 'left-1/2 right-1'
              }`}
            ></div>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('code');
                setAuthError('');
              }}
              className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-500 ${
                loginMethod === 'code'
                  ? 'text-white transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              Check-in Code
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('room');
                setAuthError('');
              }}
              className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-500 ${
                loginMethod === 'room'
                  ? 'text-white transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              Room & Name
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative min-h-[200px]">
            {loginMethod === 'code' ? (
              <div className="space-y-5 animate-fade-in-slide-up">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Check-in Code</label>
                  <input
                    type="text"
                    value={checkInCode}
                    onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                    className="w-full px-5 py-4 rounded-lg border-2 border-gray-200 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-all duration-200 text-black text-center text-2xl font-bold tracking-widest hover:border-emerald-300"
                    placeholder="Enter code"
                    maxLength={8}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Enter the 8-character code provided at check-in
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="rememberCode"
                    checked={rememberCode}
                    onChange={(e) => setRememberCode(e.target.checked)}
                    className="w-4 h-4 text-emerald-800 border-gray-300 rounded focus:ring-emerald-800 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="rememberCode" className="text-sm text-gray-700 cursor-pointer font-medium">
                    Remember this code on this device
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in-slide-up">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-5 py-4 rounded-lg border-2 border-gray-200 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-all duration-200 text-black hover:border-emerald-300"
                    placeholder="Enter your last name"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Room Number</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-5 py-4 rounded-lg border-2 border-gray-200 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-all duration-200 text-black hover:border-emerald-300"
                    placeholder="Enter your room number"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {authError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthLoading}
            className="w-full bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold py-4 rounded-lg shadow-md hover:shadow-lg hover:from-emerald-900 hover:to-emerald-950 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2"
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

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-slide-up {
          animation: fade-in-slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

