
import React, { useState, useEffect } from 'react';
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
import { RoleSelection } from './components/login/RoleSelection';
import { GuestLogin } from './components/login/GuestLogin';
import { StaffLogin } from './components/login/StaffLogin';
import { getPromotions, getActiveGuestOrders, getActiveRideForUser } from './services/dataService';
import { BuggyStatus } from './types';
import { User as UserIcon, LogOut, MessageSquare, Car, Percent, ShoppingCart, Home } from 'lucide-react';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';

// Main Inner Component to access Context
const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.ROLE_SELECTION);
  const [selectedLoginRole, setSelectedLoginRole] = useState<UserRole | null>(null);
  
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
          case UserRole.RECEPTION:
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

  const handleLoginSuccess = (foundUser: User) => {
    setUser(foundUser);
    // Save user to localStorage to persist across page refreshes
    localStorage.setItem('furama_user', JSON.stringify(foundUser));

    // Set language from user's database preference
    if (foundUser.language) {
      setLanguage(foundUser.language as any);
    }

    // Route to appropriate view based on Role
    switch (foundUser.role) {
      case UserRole.ADMIN: 
        setView(AppView.ADMIN_DASHBOARD); 
        break;
      case UserRole.SUPERVISOR: 
        setView(AppView.ADMIN_DASHBOARD); 
        break; // Supervisors use Admin Dashboard (Restricted)
      case UserRole.DRIVER: 
        setView(AppView.DRIVER_DASHBOARD); 
        break;
      case UserRole.STAFF: 
        setView(AppView.STAFF_DASHBOARD); 
        break;
      case UserRole.RECEPTION: 
        setView(AppView.STAFF_DASHBOARD); 
        break; // Reception uses Staff Dashboard
      default: 
        setView(AppView.HOME); 
        break;
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedLoginRole(role);
    setView(AppView.LOGIN);
  };

  const handleBackToRoleSelection = () => {
    setSelectedLoginRole(null);
    setView(AppView.ROLE_SELECTION);
  };

  const handleLogout = () => {
    setUser(null);
    setView(AppView.ROLE_SELECTION);
    setSelectedLoginRole(null);
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
  const [buggyStatus, setBuggyStatus] = useState<BuggyStatus | null>(null); // Current buggy status
  
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

  // Track buggy wait time and status for badge notification
  useEffect(() => {
    if (user && user.role === UserRole.GUEST) {
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
      
      checkBuggyStatus();
      // Poll every 3 seconds for real-time updates
      const interval = setInterval(checkBuggyStatus, 3000);
      return () => clearInterval(interval);
    } else {
      setBuggyStatus(null);
      setBuggyWaitTime(0);
    }
  }, [user]);

  // Role Selection View
  if (view === AppView.ROLE_SELECTION) {
    return <RoleSelection onSelectRole={handleRoleSelect} />;
  }

  // Login Views - Show specific login page based on selected role
  if (view === AppView.LOGIN) {
    if (selectedLoginRole === UserRole.GUEST) {
      return (
        <GuestLogin 
          onLoginSuccess={handleLoginSuccess}
          onBack={handleBackToRoleSelection}
          setLanguage={setLanguage}
        />
      );
    } else if (selectedLoginRole) {
      return (
        <StaffLogin 
          role={selectedLoginRole}
          onLoginSuccess={handleLoginSuccess}
          onBack={handleBackToRoleSelection}
          setLanguage={setLanguage}
        />
      );
    } else {
      // Fallback: if no role selected, go back to role selection
      setView(AppView.ROLE_SELECTION);
      return null;
    }
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
      if (user.role === UserRole.RECEPTION) {
          return <ReceptionPortal user={user} onLogout={handleLogout} />;
      }
      return <StaffPortal user={user} onLogout={handleLogout} />;
  }

  // --- GUEST VIEW (MOBILE APP LAYOUT) ---
  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* 1. Modern Header with Gradient & Glassmorphism */}
      <div 
        className="backdrop-blur-md bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white pt-3 pb-3 px-4 flex justify-between items-center shadow-xl z-30 shrink-0 border-b border-white/10"
        style={{
          boxShadow: '0 4px 20px -5px rgba(0,0,0,0.3)'
        }}
      >
          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
              {/* Modern Avatar */}
              <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center border-2 border-white/30 shadow-lg backdrop-blur-sm">
                      <span className="font-bold text-lg text-white">{user.lastName.charAt(0)}</span>
                  </div>
                  {/* Active indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-emerald-800 shadow-md"></div>
              </div>
              
              {/* Welcome Text */}
              <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-emerald-200 uppercase tracking-wider font-semibold mb-0.5">{t('welcome_back')}</p>
                  <h1 className="font-bold text-base leading-tight truncate text-white">{user.lastName}</h1>
                  {user.roomNumber && (
                      <p className="text-[10px] text-emerald-200/80 mt-0.5">Room {user.roomNumber}</p>
                  )}
              </div>
          </div>
          
          {/* Action Buttons */}
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

      {/* 3. Fixed Bottom Navigation Bar - Modern glassmorphism design */}
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
                urgentBadge={buggyWaitTime >= 600} // Show urgent badge if waiting over 10 minutes
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
};

// Helper Component for Bottom Nav Buttons - Modern 2025 Design
const NavButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    icon: React.ElementType; 
    label: string; 
    special?: boolean;
    badge?: number;
    urgentBadge?: boolean; // Red urgent badge for critical alerts
    statusLabel?: string; // Status label to show when active (e.g., "Finding Driver")
}> = ({ active, onClick, icon: Icon, label, special, badge, urgentBadge, statusLabel }) => (
    <button 
        onClick={onClick}
        className={`group flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${
            active ? 'text-emerald-600' : 'text-gray-400'
        }`}
    >
        {special ? (
            // Special center button with modern design
            <div className="relative mb-1">
                <div className={`p-3.5 rounded-2xl shadow-2xl transform -translate-y-4 border-2 transition-all duration-300 ${
                    active 
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-emerald-300/50' 
                        : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-300 shadow-emerald-200/30'
                }`}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
                {/* Glow effect when active */}
                {active && (
                    <div className="absolute inset-0 -translate-y-4 rounded-2xl bg-emerald-400/20 blur-xl -z-10 animate-pulse"></div>
                )}
            </div>
        ) : (
            // Regular nav buttons
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
                
                {/* Badge indicators */}
                {urgentBadge ? (
                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-pulse">
                        !
                    </span>
                ) : badge && badge > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                        {badge > 9 ? '9+' : badge}
                    </span>
                ) : null}
                
                {/* Active indicator dot */}
                {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full"></div>
                )}
            </div>
        )}
        
        {/* Label with modern typography */}
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

// Main App Wrapper for Providers
const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
  );
};

export default App;
