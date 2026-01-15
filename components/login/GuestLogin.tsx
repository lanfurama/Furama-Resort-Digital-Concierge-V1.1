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
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-900 rounded-b-[3rem] z-0"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 relative">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-emerald-900 mb-2">FURAMA</h1>
          <p className="text-xs tracking-widest text-emerald-600 uppercase">Resort & Villas Danang</p>
          <div className="w-16 h-1 bg-amber-400 mx-auto mt-4"></div>
          <p className="text-sm text-gray-600 mt-4 font-semibold">Guest Login</p>
        </div>

        {/* Login Method Selection */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('code');
                setAuthError('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${loginMethod === 'code'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
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
              className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${loginMethod === 'room'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Room & Name
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMethod === 'code' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Check-in Code</label>
                <input
                  type="text"
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-black text-center text-2xl font-bold tracking-widest"
                  placeholder="Enter your check-in code"
                  maxLength={8}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Enter the 8-character code provided at check-in
                </p>
                <p className="text-xs text-gray-500 mt-1.5 text-center font-medium">
                  This code will be provided by the administrator
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberCode"
                  checked={rememberCode}
                  onChange={(e) => setRememberCode(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="rememberCode" className="text-xs text-gray-600 cursor-pointer">
                  Remember this code on this device
                </label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-black"
                  placeholder="Enter your last name"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Room Number</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-black"
                  placeholder="Enter your room number"
                  required
                />
              </div>
            </>
          )}

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

