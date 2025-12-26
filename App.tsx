import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppView, User, UserRole } from './types';
import BuggyBooking from './components/BuggyBooking';
import ConciergeChat from './components/ConciergeChat';
import ServiceMenu from './components/ServiceMenu';
import ServiceBooking from './components/ServiceBooking';
import EventsList from './components/EventsList';
import AdminPortal from './components/AdminPortal';
import DriverPortal from './components/DriverPortal';
import StaffPortal from './components/StaffPortal';
import ReceptionPortal from './components/ReceptionPortal';
import GuestAccount from './components/GuestAccount';
import ActiveOrders from './components/ActiveOrders';
import NotificationBell from './components/NotificationBell';
import SupervisorDashboard from './components/SupervisorDashboard';
import { LoginTypeSelection } from './components/login/LoginTypeSelection';
import { RoleSelection } from './components/login/RoleSelection';
import GuestLoginPage from './pages/GuestLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import StaffLoginPage from './pages/StaffLoginPage';
import DriverLoginPage from './pages/DriverLoginPage';
import ReceptionLoginPage from './pages/ReceptionLoginPage';
import SupervisorLoginPage from './pages/SupervisorLoginPage';
import CollectionLoginPage from './pages/CollectionLoginPage';
import { getPromotions, getActiveGuestOrders, getActiveRideForUser } from './services/dataService';
import { BuggyStatus } from './types';
import { User as UserIcon, LogOut, MessageSquare, Car, Percent, ShoppingCart, Home } from 'lucide-react';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: UserRole[];
  redirectTo?: string;
}> = ({ children, allowedRoles, redirectTo = '/login' }) => {
  const savedUser = localStorage.getItem('furama_user');
  if (!savedUser) {
    return <Navigate to={redirectTo} replace />;
  }
  
  try {
    const user = JSON.parse(savedUser);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{children}</>;
  } catch {
    return <Navigate to={redirectTo} replace />;
  }
};

// Main Inner Component to access Context
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.HOME);
  
  // Translation hook
  const { t, setLanguage, language } = useTranslation();

  // Load promotions for Guest Home
  const [promotions, setPromotions] = useState<any[]>([]);
  const promotionsLoadedRef = useRef(false);
  
  useEffect(() => {
    if (view === AppView.HOME && user && !promotionsLoadedRef.current) {
      getPromotions().then(setPromotions).catch(console.error);
      promotionsLoadedRef.current = true;
    }
    // Reset when view changes
    if (view !== AppView.HOME) {
      promotionsLoadedRef.current = false;
    }
  }, [view, user?.roomNumber]); // Only depend on roomNumber, not entire user object

  // Restore user from localStorage on mount (only once - no dependencies)
  useEffect(() => {
    const savedUser = localStorage.getItem('furama_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Restore language if available (only once)
        if (parsedUser.language) {
          setLanguage(parsedUser.language as any);
        }
      } catch (error) {
        console.error('Failed to restore user from localStorage:', error);
        localStorage.removeItem('furama_user');
      }
    }
  }, []); // Empty array - only run once on mount
  
  // Handle redirect if on login page and user exists (separate effect)
  useEffect(() => {
    if (location.pathname.includes('/login') && user) {
      switch (user.role) {
        case UserRole.ADMIN:
        case UserRole.SUPERVISOR:
          navigate('/admin', { replace: true });
          break;
        case UserRole.DRIVER:
          navigate('/driver', { replace: true });
          break;
        case UserRole.STAFF:
          navigate('/staff', { replace: true });
          break;
        case UserRole.RECEPTION:
          navigate('/reception', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
          break;
      }
    }
  }, [location.pathname, user?.role, navigate]); // Only redirect when pathname or role changes for redirect logic

  // Sync Language Context when User logs in or updates profile
  const prevUserLanguageRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
      if (user && user.role === UserRole.GUEST && user.language && user.language !== prevUserLanguageRef.current) {
          setLanguage(user.language as any);
          prevUserLanguageRef.current = user.language;
      }
  }, [user?.language]); // Only depend on language string, not entire user object

  const handleLogout = () => {
    // Lưu role trước khi xóa user để redirect đúng trang
    const savedUser = localStorage.getItem('furama_user');
    let userRole: UserRole | null = null;
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        userRole = parsedUser.role;
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }
    
    setUser(null);
    setLanguage('English'); // Reset to default
    localStorage.removeItem('furama_user');
    
    // Redirect về trang login của role tương ứng
    switch (userRole) {
      case UserRole.RECEPTION:
        navigate('/reception/login');
        break;
      case UserRole.STAFF:
        navigate('/staff/login');
        break;
      case UserRole.DRIVER:
        navigate('/driver/login');
        break;
      case UserRole.SUPERVISOR:
        navigate('/supervisor/login');
        break;
      case UserRole.ADMIN:
        navigate('/admin/login');
        break;
      default:
        navigate('/');
        break;
    }
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
  const [buggyWaitTime, setBuggyWaitTime] = useState<number>(0);
  const [buggyStatus, setBuggyStatus] = useState<BuggyStatus | null>(null);
  
  // Load active order count
  useEffect(() => {
    if (user && user.role === UserRole.GUEST && user.roomNumber) {
      // Initial load
      getActiveGuestOrders(user.roomNumber).then(orders => setActiveOrderCount(orders.length)).catch(console.error);
      
      // Poll every 10 seconds
      const interval = setInterval(() => {
        getActiveGuestOrders(user.roomNumber).then(orders => setActiveOrderCount(orders.length)).catch(console.error);
      }, 10000);
      
      return () => clearInterval(interval);
    } else {
      setActiveOrderCount(0);
    }
  }, [user?.roomNumber]); // Only depend on roomNumber, not entire user object

  // Track buggy wait time and status for badge notification
  useEffect(() => {
    if (user && user.role === UserRole.GUEST && user.roomNumber) {
      const checkBuggyStatus = async () => {
        try {
          const activeRide = await getActiveRideForUser(user.roomNumber);
          if (activeRide) {
            setBuggyStatus(activeRide.status);
            if (activeRide.status === BuggyStatus.SEARCHING) {
              const now = Date.now();
              const elapsed = Math.max(0, Math.floor((now - activeRide.timestamp) / 1000));
              setBuggyWaitTime(elapsed);
            } else {
              setBuggyWaitTime(0);
            }
          } else {
            setBuggyStatus(null);
            setBuggyWaitTime(0);
          }
        } catch (error) {
          console.error('Failed to check buggy status:', error);
          setBuggyStatus(null);
          setBuggyWaitTime(0);
        }
      };
      
      // Initial check
      checkBuggyStatus();
      
      // Poll every 3 seconds
      const interval = setInterval(checkBuggyStatus, 3000);
      return () => clearInterval(interval);
    } else {
      setBuggyStatus(null);
      setBuggyWaitTime(0);
    }
  }, [user?.roomNumber]); // Only depend on roomNumber, not entire user object

  // Wrapper Components to load user from localStorage
  const AdminDashboardWrapper: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    useEffect(() => {
      const savedUser = localStorage.getItem('furama_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to load user:', e);
        }
      }
    }, []);
    
    if (!currentUser) return null;
    
    if (currentUser.role === UserRole.SUPERVISOR) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <header className="bg-white p-4 flex justify-between items-center shadow-sm border-b border-gray-200">
            <h1 className="font-bold text-gray-800">Supervisor Dashboard</h1>
            <button onClick={onLogout} className="text-sm font-semibold text-gray-500">Logout</button>
          </header>
          <div className="p-6">
            <SupervisorDashboard />
          </div>
          <div className="p-6 pt-0">
            <AdminPortal user={currentUser} onLogout={onLogout} />
          </div>
        </div>
      );
    }
    
    return <AdminPortal user={currentUser} onLogout={onLogout} />;
  };

  const StaffDashboardWrapper: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    useEffect(() => {
      const savedUser = localStorage.getItem('furama_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to load user:', e);
        }
      }
    }, []);
    
    if (!currentUser) return null;
    return <StaffPortal user={currentUser} onLogout={onLogout} />;
  };

  const ReceptionDashboardWrapper: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    useEffect(() => {
      const savedUser = localStorage.getItem('furama_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to load user:', e);
        }
      }
    }, []);
    
    if (!currentUser) return null;
    return <ReceptionPortal user={currentUser} onLogout={onLogout} />;
  };

  const GuestHomeWrapper: React.FC = () => {
    // Simply use the user from parent state, don't duplicate it
    // The user is already loaded in the main useEffect above
    if (!user) return null;
    return <GuestHome user={user} />;
  };

  // Guest Home Component
  const GuestHome: React.FC<{ user: User }> = ({ user }) => (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <div 
        className="backdrop-blur-md bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white pt-3 pb-3 px-4 flex justify-between items-center shadow-xl z-30 shrink-0 border-b border-white/10"
        style={{ boxShadow: '0 4px 20px -5px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center border-2 border-white/30 shadow-lg backdrop-blur-sm">
              <span className="font-bold text-lg text-white">{user.lastName.charAt(0)}</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-emerald-800 shadow-md"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-emerald-200 uppercase tracking-wider font-semibold mb-0.5">{t('welcome_back')}</p>
            <h1 className="font-bold text-base leading-tight truncate text-white">{user.lastName}</h1>
            {user.roomNumber && (
              <p className="text-[10px] text-emerald-200/80 mt-0.5">Room {user.roomNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
          <NotificationBell userId={user.roomNumber} />
          <button 
            onClick={handleLogout} 
            className="p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/20 backdrop-blur-sm" 
            title="Logout"
          >
            <LogOut size={17} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20 relative bg-gray-50 scrollbar-hide">
        {view === AppView.HOME && (
          <div className="flex flex-col min-h-full">
            {/* Hero Banner */}
            <div className="mx-4 mt-4 h-40 rounded-2xl overflow-hidden relative shadow-lg mb-6">
              <img 
                src="https://furamavietnam.com/wp-content/uploads/2025/10/furama-resort-danang.jpg" 
                className="absolute inset-0 w-full h-full object-cover" 
                alt="Furama Resort Danang"
                onError={(e) => {
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

        {/* Sub-Views */}
        {view === AppView.BUGGY && user && <BuggyBooking user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.CHAT && <ConciergeChat onClose={() => setView(AppView.HOME)} />}
        {view === AppView.ACTIVE_ORDERS && user && <ActiveOrders user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.ACCOUNT && user && <GuestAccount user={user} onBack={() => setView(AppView.HOME)} />}
        
        {view === AppView.DINING_ORDER && user && <ServiceBooking type="DINING" user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.SPA_BOOKING && user && <ServiceBooking type="SPA" user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.POOL_ORDER && user && <ServiceBooking type="POOL" user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.BUTLER_REQUEST && user && <ServiceBooking type="BUTLER" user={user} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.EVENTS && <EventsList onBack={() => setView(AppView.HOME)} />}
      </div>

      {/* Bottom Navigation */}
      <div 
        className="backdrop-blur-xl bg-white/95 border-t-2 border-gray-200/60 h-20 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 flex justify-around items-center px-2 safe-area-bottom" 
        style={{ 
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
          position: 'fixed',
          willChange: 'transform',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)'
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
          urgentBadge={buggyWaitTime >= 600}
          statusLabel={
            buggyStatus === BuggyStatus.SEARCHING 
              ? t('finding_driver') 
              : (buggyStatus === BuggyStatus.ASSIGNED || buggyStatus === BuggyStatus.ARRIVING)
                ? t('driver_arriving')
                : buggyStatus === BuggyStatus.ON_TRIP
                  ? t('en_route')
                  : undefined
          }
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

  // NavButton Component
  const NavButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    icon: React.ElementType; 
    label: string; 
    special?: boolean;
    badge?: number;
    urgentBadge?: boolean;
    statusLabel?: string;
  }> = ({ active, onClick, icon: Icon, label, special, badge, urgentBadge, statusLabel }) => (
    <button 
      onClick={onClick}
      className={`group flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${
        active ? 'text-emerald-600' : 'text-gray-400'
      }`}
    >
      {special ? (
        <div className="relative mb-1">
          <div className={`p-3.5 rounded-2xl shadow-2xl transform -translate-y-4 border-2 transition-all duration-300 ${
            active 
              ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-emerald-300/50' 
              : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-300 shadow-emerald-200/30'
          }`}>
            <Icon size={22} strokeWidth={2.5} />
          </div>
          {active && (
            <div className="absolute inset-0 -translate-y-4 rounded-2xl bg-emerald-400/20 blur-xl -z-10 animate-pulse"></div>
          )}
        </div>
      ) : (
        <div className="mb-1 relative">
          <div className={`p-2 rounded-xl transition-all duration-300 ${
            active 
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50' 
              : 'group-hover:bg-gray-50'
          }`}>
            <Icon 
              size={22} 
              strokeWidth={active ? 2.5 : 2} 
              className={`transition-all duration-300 ${
                active ? 'text-emerald-600' : 'text-gray-500 group-hover:text-gray-600'
              }`}
            />
          </div>
          {urgentBadge ? (
            <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-pulse">
              !
            </span>
          ) : badge && badge > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
              {badge > 9 ? '9+' : badge}
            </span>
          ) : null}
          {active && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full"></div>
          )}
        </div>
      )}
      <div className={`flex flex-col items-center transition-all duration-300 ${special ? '-mt-3' : ''}`}>
        <span className={`text-[10px] font-semibold transition-all duration-300 ${
          active 
            ? 'text-emerald-600' 
            : urgentBadge 
              ? 'text-red-600 font-bold' 
              : 'text-gray-500 group-hover:text-gray-600'
        }`}>
          {label}
        </span>
        {statusLabel && !active && (
          <span className="text-[9px] font-bold text-orange-600 mt-0.5 animate-pulse">
            {statusLabel}
          </span>
        )}
      </div>
    </button>
  );

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<GuestLoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route path="/driver/login" element={<DriverLoginPage />} />
      <Route path="/reception/login" element={<ReceptionLoginPage />} />
      <Route path="/supervisor/login" element={<SupervisorLoginPage />} />
      <Route path="/fu25ad/login" element={<CollectionLoginPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPERVISOR]} redirectTo="/admin/login">
            <AdminDashboardWrapper onLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/driver" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.DRIVER]} redirectTo="/driver/login">
            <DriverPortal onLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/staff" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.STAFF]} redirectTo="/staff/login">
            <StaffDashboardWrapper onLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/reception" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.RECEPTION]} redirectTo="/reception/login">
            <ReceptionDashboardWrapper onLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />
      
      {/* Guest Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.GUEST]} redirectTo="/login">
            <GuestHomeWrapper />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
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
