import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { authenticateStaff } from './services/authService';
import DriverPortal from './components/DriverPortal';
import { markDriverOffline } from './services/dataService';
import { Eye, EyeOff } from 'lucide-react';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';

// Main Inner Component to access Context
const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Translation hook
  const { setLanguage } = useTranslation();

  // Restore user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Only restore if user is a DRIVER
        if (parsedUser.role === UserRole.DRIVER) {
          setUser(parsedUser);
          // Restore language if available
          if (parsedUser.language) {
            setLanguage(parsedUser.language as any);
          }
        } else {
          // Clear invalid user
          localStorage.removeItem('furama_user');
        }
      } catch (error) {
        console.error('Failed to restore user from localStorage:', error);
        localStorage.removeItem('furama_user');
      }
    }
  }, [setLanguage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    
    try {
      // Staff/Driver Login: Username + Password - Calls API
      const foundUser = await authenticateStaff(usernameInput, passwordInput);
      
      if (!foundUser) {
        setAuthError('Invalid credentials. Please check Username and Password.');
        setIsAuthLoading(false);
        return;
      }

      // Only allow DRIVER role
      if (foundUser.role !== UserRole.DRIVER) {
        setAuthError('This app is for drivers only. Please use the main app for other roles.');
        setIsAuthLoading(false);
        return;
      }

      if (foundUser) {
        setUser(foundUser);
        // Save user to localStorage to persist across page refreshes
        localStorage.setItem('furama_user', JSON.stringify(foundUser));

        // Set language from user's database preference
        if (foundUser.language) {
          setLanguage(foundUser.language as any);
        }
      } else {
        setAuthError('Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    // Mark driver as offline before clearing user state
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.id && userData.role === UserRole.DRIVER) {
          await markDriverOffline(String(userData.id)).catch(err => {
            console.error('Failed to mark driver offline on logout:', err);
          });
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }
    
    setUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setAuthError('');
    setLanguage('English'); // Reset to default
    // Clear user from localStorage
    localStorage.removeItem('furama_user');
  };

  // LOGIN VIEW
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-900 rounded-b-[3rem] z-0"></div>
        
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 relative">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold text-emerald-900 mb-2">FURAMA</h1>
            <p className="text-xs tracking-widest text-emerald-600 uppercase">Driver App</p>
            <div className="w-16 h-1 bg-amber-400 mx-auto mt-4"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Username</label>
              <input 
                type="text" 
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-black"
                placeholder="Driver ID"
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
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
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
  }

  // DRIVER VIEW
  return <DriverPortal onLogout={handleLogout} />;
};

// Main App Wrapper for Providers
const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;

