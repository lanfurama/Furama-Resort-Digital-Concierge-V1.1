
import React, { useState, useEffect } from 'react';
import { AppView, User, UserRole } from './types';
import { authenticateUser, authenticateStaff } from './services/authService';
import BuggyBooking from './components/BuggyBooking';
import ConciergeChat from './components/ConciergeChat';
import ServiceMenu from './components/ServiceMenu';
import ServiceBooking from './components/ServiceBooking';
import EventsList from './components/EventsList';
import AdminPortal from './components/AdminPortal';
import DriverPortal from './components/DriverPortal';
import StaffPortal from './components/StaffPortal';
import GuestAccount from './components/GuestAccount';
import ActiveOrders from './components/ActiveOrders';
import NotificationBell from './components/NotificationBell';
import SupervisorDashboard from './components/SupervisorDashboard';
import { findUserByCredentials, loginStaff, loginGuest, getPromotions, getActiveGuestOrders, getActiveRideForUser } from './services/dataService';
import { BuggyStatus } from './types';
import { User as UserIcon, LogOut, MessageSquare, Car, Percent, Lock, Eye, EyeOff, ShoppingCart, Home } from 'lucide-react';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';

// Main Inner Component to access Context
const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  
  // Login State
  const [usernameInput, setUsernameInput] = useState(''); // Used for Room# (Guest) or Username (Staff)
  const [lastNameInput, setLastNameInput] = useState(''); // Used for Last Name (Guest)
  const [passwordInput, setPasswordInput] = useState(''); // Used for Password (Staff)
  
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.GUEST);
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Translation hook
  const { t, setLanguage, language } = useTranslation();

  // Load promotions for Guest Home
  const [promotions, setPromotions] = useState<any[]>([]);
  
  useEffect(() => {
    if (view === AppView.HOME && user) {
      getPromotions().then(setPromotions).catch(console.error);
    }
  }, [view, user]);

  // Restore user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Set view based on user role
        switch (parsedUser.role) {
          case UserRole.ADMIN:
          case UserRole.SUPERVISOR:
            setView(AppView.ADMIN_DASHBOARD);
            break;
          case UserRole.DRIVER:
            setView(AppView.DRIVER_DASHBOARD);
            break;
          case UserRole.STAFF:
            setView(AppView.STAFF_DASHBOARD);
            break;
          default:
            setView(AppView.HOME);
            break;
        }
        
        // Restore language if available
        if (parsedUser.language) {
          setLanguage(parsedUser.language as any);
        }
      } catch (error) {
        console.error('Failed to restore user from localStorage:', error);
        localStorage.removeItem('furama_user');
      }
    }
  }, [setLanguage]);

  // Sync Language Context when User logs in or updates profile
  useEffect(() => {
      if (user && user.role === UserRole.GUEST && user.language) {
          setLanguage(user.language as any);
      }
  }, [user, setLanguage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    
    try {
        let foundUser: User | null = null;

        // AUTH LOGIC - Now uses API
        if (selectedRole === UserRole.GUEST) {
            // Guest Login: Room # + Last Name - Calls API
            foundUser = await authenticateUser(lastNameInput, usernameInput);
            
            if (!foundUser) {
                setAuthError('Invalid guest credentials. Please check Room # and Last Name.');
                setIsAuthLoading(false);
                return;
            }
        } else {
             // Admin/Staff/Driver/Supervisor Login: Username + Password - Calls API
             foundUser = await authenticateStaff(usernameInput, passwordInput);
             
             if (!foundUser) {
                 setAuthError('Invalid staff credentials. Please check Username and Password.');
        setIsAuthLoading(false);
                 return;
             }
        }

        if (foundUser) {
            setUser(foundUser);
            // Save user to localStorage to persist across page refreshes
            localStorage.setItem('furama_user', JSON.stringify(foundUser));

            // Set language from user's database preference
            if (foundUser.language) {
                setLanguage(foundUser.language as any);
            }

            // Route to appropriate view based on Role
            switch (foundUser.role) {
            case UserRole.ADMIN: setView(AppView.ADMIN_DASHBOARD); break;
                case UserRole.SUPERVISOR: setView(AppView.ADMIN_DASHBOARD); break; // Supervisors use Admin Dashboard (Restricted)
            case UserRole.DRIVER: setView(AppView.DRIVER_DASHBOARD); break;
            case UserRole.STAFF: setView(AppView.STAFF_DASHBOARD); break;
            default: setView(AppView.HOME); break;
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

  const handleLogout = () => {
      setUser(null);
      setView(AppView.LOGIN);
      setUsernameInput('');
      setLastNameInput('');
      setPasswordInput('');
      setSelectedRole(UserRole.GUEST);
      setAuthError('');
      setLanguage('English'); // Reset to default
      // Clear user from localStorage
      localStorage.removeItem('furama_user');
  };

  const handleServiceSelect = (serviceId: string) => {
      if (serviceId === 'DINING') setView(AppView.DINING_ORDER);
      else if (serviceId === 'SPA') setView(AppView.SPA_BOOKING);
      else if (serviceId === 'POOL') setView(AppView.POOL_ORDER);
      else if (serviceId === 'BUTLER') setView(AppView.BUTLER_REQUEST);
      else if (serviceId === 'EVENTS') setView(AppView.EVENTS);
      else if (serviceId === 'CHAT') setView(AppView.CHAT);
  };

  // Helper for Nav Bar Active State
  const isActive = (v: AppView) => view === v;
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [buggyWaitTime, setBuggyWaitTime] = useState<number>(0); // Wait time in seconds
  
  // Load active order count
  useEffect(() => {
    if (user) {
      getActiveGuestOrders(user.roomNumber).then(orders => setActiveOrderCount(orders.length)).catch(console.error);
      // Poll for updates every 10 seconds
      const interval = setInterval(() => {
        getActiveGuestOrders(user.roomNumber).then(orders => setActiveOrderCount(orders.length)).catch(console.error);
      }, 10000);
      return () => clearInterval(interval);
    } else {
      setActiveOrderCount(0);
    }
  }, [user]);

  // Track buggy wait time for badge notification
  useEffect(() => {
    if (user && user.role === UserRole.GUEST) {
      const checkBuggyStatus = async () => {
        try {
          const activeRide = await getActiveRideForUser(user.roomNumber);
          if (activeRide && activeRide.status === BuggyStatus.SEARCHING) {
            const now = Date.now();
            const elapsed = Math.max(0, Math.floor((now - activeRide.timestamp) / 1000));
            setBuggyWaitTime(elapsed);
          } else {
            setBuggyWaitTime(0);
          }
        } catch (error) {
          console.error('Failed to check buggy status:', error);
          setBuggyWaitTime(0);
        }
      };
      
      checkBuggyStatus();
      // Poll every 3 seconds for real-time updates
      const interval = setInterval(checkBuggyStatus, 3000);
      return () => clearInterval(interval);
    } else {
      setBuggyWaitTime(0);
    }
  }, [user]);

  if (view === AppView.LOGIN) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-900 rounded-b-[3rem] z-0"></div>
        
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 relative">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-emerald-900 mb-2">FURAMA</h1>
                <p className="text-xs tracking-widest text-emerald-600 uppercase">Resort & Villas Danang</p>
                <div className="w-16 h-1 bg-amber-400 mx-auto mt-4"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                {/* Role Switcher (For Demo) */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                    {Object.values(UserRole).map((role) => (
                        <button
                            key={role}
                            type="button"
                            onClick={() => {
                                setSelectedRole(role);
                                setAuthError('');
                                setUsernameInput('');
                                setPasswordInput('');
                            }}
                            className={`flex-1 py-2 text-[10px] font-bold rounded-md transition ${selectedRole === role ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-400'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                {selectedRole === UserRole.GUEST ? (
                    /* GUEST LOGIN FORM */
                    <>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Room Number</label>
                            <input 
                                type="text" 
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-black"
                                placeholder="e.g. 101"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Guest Last Name</label>
                            <input 
                                type="text" 
                                value={lastNameInput}
                                onChange={(e) => setLastNameInput(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-black"
                                placeholder="e.g. Smith"
                                required
                            />
                        </div>
                    </>
                ) : (
                    /* STAFF/ADMIN LOGIN FORM */
                    <>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Username</label>
                            <input 
                                type="text" 
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
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
                        <span>{t('submit')}</span>
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

  // --- AUTHENTICATED VIEWS ---

  if (!user) return null; // Should not happen based on logic

  // ADMIN VIEW
  if (view === AppView.ADMIN_DASHBOARD) {
      if (user.role === UserRole.SUPERVISOR) {
          // Supervisor Dashboard wrap
          return (
              <div className="min-h-screen bg-gray-100 flex flex-col">
                  <header className="bg-white p-4 flex justify-between items-center shadow-sm border-b border-gray-200">
                        <h1 className="font-bold text-gray-800">Supervisor Dashboard</h1>
                        <button onClick={handleLogout} className="text-sm font-semibold text-gray-500">Logout</button>
                  </header>
                  <div className="p-6">
                    <SupervisorDashboard />
                  </div>
                  {/* Reuse Admin Portal for management but restricted inside component */}
                  <div className="p-6 pt-0">
                    <AdminPortal user={user} onLogout={handleLogout} />
                  </div>
              </div>
          );
  }
      return <AdminPortal user={user} onLogout={handleLogout} />;
  }

  // DRIVER VIEW
  if (view === AppView.DRIVER_DASHBOARD) {
      return <DriverPortal onLogout={handleLogout} />;
  }

  // STAFF VIEW
  if (view === AppView.STAFF_DASHBOARD) {
      return <StaffPortal user={user} onLogout={handleLogout} />;
  }

  // --- GUEST VIEW (MOBILE APP LAYOUT) ---
  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* 1. Compact Header */}
      <div className="bg-emerald-900 text-white pt-4 pb-4 px-5 flex justify-between items-center shadow-md z-30 shrink-0">
          <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                   <span className="font-serif text-lg font-bold">{user.lastName.charAt(0)}</span>
              </div>
              <div>
                  <p className="text-[10px] text-emerald-300 uppercase tracking-widest">{t('welcome_back')}</p>
                  <h1 className="font-bold text-lg leading-tight truncate max-w-[150px]">{user.lastName}</h1>
              </div>
          </div>
          <div className="flex items-center space-x-2">
               <NotificationBell userId={user.roomNumber} />
               <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/10 text-emerald-200 hover:text-white transition" title="Logout">
                  <LogOut size={20} />
               </button>
          </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20 relative bg-gray-50 scrollbar-hide">
        {/* Render View Content */}
        {view === AppView.HOME && (
             <div className="flex flex-col min-h-full">
                {/* Hero Banner (Smaller) */}
                <div className="mx-4 mt-4 h-40 rounded-2xl overflow-hidden relative shadow-lg mb-6">
                    <img 
                        src="https://furamavietnam.com/wp-content/uploads/2025/10/furama-resort-danang.jpg" 
                        className="absolute inset-0 w-full h-full object-cover" 
                        alt="Furama Resort Danang"
                        onError={(e) => {
                            // Fallback images
                            const img = e.target as HTMLImageElement;
                            if (img.src.includes('furama-resort-danang.jpg')) {
                                img.src = "https://furamavietnam.com/wp-content/uploads/2018/07/Furama-Resort-Danang-Exterior-1920x1080.jpg";
                            } else if (img.src.includes('Exterior')) {
                                img.src = "https://furamavietnam.com/wp-content/uploads/2018/07/Furama-Resort-Danang-Pool-768x552.jpg";
                            }
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-900/70 to-transparent flex items-center p-6">
                        <div>
                             <h2 className="text-white font-serif text-2xl font-bold mb-1 drop-shadow-lg">Furama Danang</h2>
                             <p className="text-emerald-100 text-xs drop-shadow-md">A Culinary Beach Resort</p>
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="px-4">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <h3 className="font-bold text-gray-800 text-lg">{t('resort_services')}</h3>
                            </div>
                    {/* Using negative margin to counteract default padding of ServiceMenu if needed, or just standard render */}
                    <div className="-mx-4">
                        <ServiceMenu onSelect={handleServiceSelect} />
                    </div>
                </div>

                {/* Promotions Carousel */}
                <div className="p-6 pt-2 pb-8">
                    <h3 className="font-bold text-gray-800 text-lg mb-4 px-1">{t('exclusive_offers')}</h3>
                    <div className="flex space-x-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                        {promotions.map(promo => {
                            const tr = promo.translations?.[language];
                            const title = tr?.title || promo.title;
                            const desc = tr?.description || promo.description;
                            const discount = tr?.discount || promo.discount;

                            return (
                                <div 
                                    key={promo.id} 
                                    className={`min-w-[260px] p-5 rounded-2xl text-white shadow-lg snap-center relative overflow-hidden shrink-0 ${
                                        promo.imageUrl ? '' : (promo.imageColor || 'bg-emerald-500')
                                    }`}
                                    style={promo.imageUrl ? {
                                        backgroundImage: `url(${promo.imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    } : {}}
                                >
                                    {/* Overlay for better text readability when using image */}
                                    {promo.imageUrl && (
                                        <div className="absolute inset-0 bg-black/40 rounded-2xl shadow-lg"></div>
                                    )}
                                    <div className="relative z-10">
                                        <div className="bg-white/20 w-fit px-2 py-1 rounded text-[10px] font-bold mb-2 backdrop-blur-sm">{discount}</div>
                                        <h4 className="font-bold text-lg mb-1">{title}</h4>
                                        <p className="text-xs opacity-90 line-clamp-2">{desc}</p>
                                        <p className="text-[10px] mt-3 opacity-75">{promo.validUntil}</p>
                    </div>
                                    <div className="absolute -bottom-4 -right-4 text-white/10">
                                        <Percent size={100} />
                                </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* Sub-Views rendered in content area */}
        {view === AppView.BUGGY && <BuggyBooking user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.CHAT && <ConciergeChat onClose={() => setView(AppView.HOME)} />}
        {view === AppView.ACTIVE_ORDERS && <ActiveOrders user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.ACCOUNT && <GuestAccount user={user} onBack={() => setView(AppView.HOME)} />}
        
        {/* Service Booking Views */}
        {view === AppView.DINING_ORDER && <ServiceBooking type="DINING" user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.SPA_BOOKING && <ServiceBooking type="SPA" user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.POOL_ORDER && <ServiceBooking type="POOL" user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.BUTLER_REQUEST && <ServiceBooking type="BUTLER" user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.EVENTS && <EventsList onBack={() => setView(AppView.HOME)} />}
      </div>

      {/* 3. Fixed Bottom Navigation Bar - Always fixed on mobile */}
      <div 
        className="bg-white border-t border-gray-200 h-20 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 flex justify-around items-center px-2 safe-area-bottom" 
        style={{ 
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
          position: 'fixed',
          willChange: 'transform',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
           <NavButton 
                active={view === AppView.HOME} 
                onClick={() => setView(AppView.HOME)} 
                icon={Home} 
                label={t('home')} 
           />
           <NavButton 
                active={view === AppView.BUGGY} 
                onClick={() => setView(AppView.BUGGY)} 
                icon={Car} 
                label={t('buggy')}
                urgentBadge={buggyWaitTime >= 600} // Show urgent badge if waiting over 10 minutes
           />
           <NavButton 
                active={view === AppView.CHAT} 
                onClick={() => setView(AppView.CHAT)} 
                icon={MessageSquare} 
                label={t('concierge')} 
                special 
           />
           <NavButton 
                active={view === AppView.ACTIVE_ORDERS} 
                onClick={() => setView(AppView.ACTIVE_ORDERS)} 
                icon={ShoppingCart} 
                label={t('shopping_cart')}
                badge={activeOrderCount}
           />
           <NavButton 
                active={view === AppView.ACCOUNT} 
                onClick={() => setView(AppView.ACCOUNT)} 
                icon={UserIcon} 
                label={t('account')} 
           />
        </div>
    </div>
  );
};

// Helper Component for Bottom Nav Buttons
const NavButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    icon: React.ElementType; 
    label: string; 
    special?: boolean;
    badge?: number;
    urgentBadge?: boolean; // Red urgent badge for critical alerts
}> = ({ active, onClick, icon: Icon, label, special, badge, urgentBadge }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-full relative ${
            active ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
        }`}
    >
        {special ? (
            <div className={`p-3 rounded-full mb-1 shadow-lg transform -translate-y-4 border-4 border-gray-50 transition ${active ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white'}`}>
                <Icon size={24} />
            </div>
        ) : (
            <div className="mb-1 relative">
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                {urgentBadge ? (
                    <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        !
                    </span>
                ) : badge && badge > 0 ? (
                    <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                        {badge}
                    </span>
                ) : null}
            </div>
        )}
        <span className={`text-[10px] font-medium ${special ? '-mt-3' : ''} ${urgentBadge ? 'text-red-600 font-bold' : ''}`}>
            {label}
        </span>
    </button>
);

// Main App Wrapper for Providers
const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
  );
};

export default App;
