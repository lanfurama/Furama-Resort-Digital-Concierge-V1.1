
import React, { useState } from 'react';
import { AppView, User, UserRole } from './types';
import { authenticateUser } from './services/authService';
import BuggyBooking from './components/BuggyBooking';
import ConciergeChat from './components/ConciergeChat';
import ServiceMenu from './components/ServiceMenu';
import ServiceBooking from './components/ServiceBooking';
import EventsList from './components/EventsList';
import AdminPortal from './components/AdminPortal';
import DriverPortal from './components/DriverPortal';
import StaffPortal from './components/StaffPortal';
import GuestAccount from './components/GuestAccount';
import NotificationBell from './components/NotificationBell';
import { findUserByCredentials, loginStaff, loginGuest, getPromotions } from './services/dataService';
import { User as UserIcon, LogOut, MessageSquare, Car, Percent, Lock, Eye, EyeOff } from 'lucide-react';

const App: React.FC = () => {
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

  // Load promotions for Guest Home
  const promotions = getPromotions();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    
    // Simulate role-based auth routing
    setTimeout(() => {
        setIsAuthLoading(false);
        
        let foundUser: User | undefined | null;

        // AUTH LOGIC
        if (selectedRole === UserRole.GUEST) {
            // Guest Login: Room # + Last Name
            const guestAuth = loginGuest(lastNameInput, usernameInput);
            
            if (guestAuth.success && guestAuth.user) {
                foundUser = guestAuth.user;
            } else {
                setAuthError(guestAuth.message || 'Login failed');
                return;
            }
        } else {
             // Admin/Staff/Driver Login: Username + Password
             // We use 'usernameInput' to match against the user's roomNumber/ID in mock data
             foundUser = loginStaff(usernameInput, passwordInput);
             
             if (!foundUser) {
                 // Debug/Demo Fallback if they type exactly what's in the placeholder for "quick access"
                 if (passwordInput === '123') {
                     foundUser = {
                        lastName: selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase(), // e.g. "Admin"
                        roomNumber: usernameInput,
                        role: selectedRole,
                        department: 'All', 
                        villaType: 'Staff'
                    };
                 }
             }
        }

        if (foundUser) {
            setUser(foundUser);
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
    }, 800);
  };

  const handleLogout = () => {
      setUser(null);
      setView(AppView.LOGIN);
      setUsernameInput('');
      setLastNameInput('');
      setPasswordInput('');
      setSelectedRole(UserRole.GUEST);
      setAuthError('');
  };

  const handleServiceSelect = (serviceId: string) => {
      if (serviceId === 'DINING') setView(AppView.DINING_ORDER);
      else if (serviceId === 'SPA') setView(AppView.SPA_BOOKING);
      else if (serviceId === 'POOL') setView(AppView.POOL_ORDER);
      else if (serviceId === 'BUTLER') setView(AppView.BUTLER_REQUEST);
      else if (serviceId === 'EVENTS') setView(AppView.EVENTS);
      else if (serviceId === 'CHAT') setView(AppView.CHAT);
  };

  // Debug: Log env vars on mount (only in development)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 App mounted - Checking env vars...');
      // @ts-ignore
      const env = import.meta.env;
      console.log('🔍 All import.meta.env keys:', Object.keys(env));
      console.log('🔍 VITE_GEMINI_API_KEY:', env.VITE_GEMINI_API_KEY ? 'SET (' + env.VITE_GEMINI_API_KEY.length + ' chars)' : 'NOT SET');
    }
  }, []);

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
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-gray-800"
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
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-gray-800"
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
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                <input 
                                    type="text" 
                                    value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-gray-800"
                                    placeholder={`e.g. ${selectedRole.toLowerCase()}`}
                                    required
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-gray-800"
                                    placeholder="••••••"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-gray-400 hover:text-emerald-600"
                                >
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                        </div>
                    </>
                )}
                
                {authError && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md border border-red-100">{authError}</p>}

                <button 
                    type="submit" 
                    disabled={isAuthLoading}
                    className="w-full bg-emerald-800 text-white font-bold py-4 rounded-xl hover:bg-emerald-900 transition shadow-lg active:scale-95 disabled:opacity-70 mt-4"
                >
                    {isAuthLoading ? 'Verifying...' : 'Sign In'}
                </button>
            </form>
            
            <div className="mt-6 text-[10px] text-gray-400 text-center border-t border-gray-100 pt-4">
                <p className="font-bold mb-1">Demo Credentials:</p>
                {selectedRole === UserRole.GUEST ? (
                     <p>Room: 101, Name: Smith</p>
                ) : (
                     <p>User: {selectedRole.toLowerCase()}, Pass: 123</p>
                )}
            </div>
        </div>
      </div>
    );
  }

  // --- Specialized Portals ---

  if (view === AppView.ADMIN_DASHBOARD) {
      return <AdminPortal onLogout={handleLogout} user={user!} />;
  }

  if (view === AppView.DRIVER_DASHBOARD) {
      return <DriverPortal onLogout={handleLogout} />;
  }

  if (view === AppView.STAFF_DASHBOARD) {
      return <StaffPortal onLogout={handleLogout} user={user!} />;
  }

  // --- Guest App View ---

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto shadow-2xl overflow-hidden relative">
      {/* App Content */}
      <div className="flex-1 overflow-hidden relative bg-gray-50">
        {view === AppView.HOME && (
            <div className="h-full overflow-y-auto relative">
                {/* Home Header Container */}
                <div className="relative">
                    {/* Background Layer (Z-10: Behind Quick Actions) */}
                    <div className="absolute inset-0 bg-emerald-900 rounded-b-[2.5rem] shadow-xl z-10"></div>
                    
                    {/* Content Layer (Z-30: In Front of Quick Actions) */}
                    <div className="relative z-30 p-6 pb-12 text-white">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-emerald-200 text-sm">Welcome back,</p>
                                <h2 className="font-serif text-2xl">Mr/Ms {user?.lastName}</h2>
                                <p className="text-xs opacity-80 mt-1">{user?.villaType} • Room {user?.roomNumber}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                {/* NOTIFICATION BELL */}
                                <NotificationBell userId={user?.roomNumber || ''} />
                                <button onClick={handleLogout} className="opacity-80 hover:opacity-100"><LogOut size={20}/></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions (Z-20: Overlaps Background, Under Content) */}
                <div className="-mt-8 px-6 mb-8 relative z-20">
                    <div className="bg-white rounded-2xl shadow-lg p-4 flex justify-around items-center">
                        <button onClick={() => setView(AppView.BUGGY)} className="flex flex-col items-center gap-2 group">
                            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-full group-hover:bg-emerald-100 transition">
                                <Car size={24} />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">Buggy</span>
                        </button>
                        <div className="w-px h-10 bg-gray-100"></div>
                        <button onClick={() => setView(AppView.CHAT)} className="flex flex-col items-center gap-2 group">
                            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-full group-hover:bg-emerald-100 transition">
                                <MessageSquare size={24} />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">Chat AI</span>
                        </button>
                    </div>
                </div>

                {/* PROMOTIONS SECTION */}
                <div className="mb-6 px-4">
                    <div className="flex items-center justify-between mb-3 px-2">
                        <h3 className="font-serif text-lg text-gray-800 flex items-center">
                            <Percent size={18} className="mr-2 text-amber-500" /> Exclusive Offers
                        </h3>
                    </div>
                    <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
                        {promotions.map(p => (
                            <div key={p.id} className="snap-center min-w-[280px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className={`h-24 ${p.imageColor || 'bg-emerald-500'} relative p-4 flex items-end`}>
                                     <span className="bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                                         {p.discount || 'Special'}
                                     </span>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-gray-800 mb-1">{p.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wide">{p.validUntil}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Services Grid */}
                <div className="px-4 pb-20">
                    <h3 className="font-serif text-lg text-gray-800 mb-4 px-2">Resort Services</h3>
                    <ServiceMenu onSelect={handleServiceSelect} />
                </div>
            </div>
        )}

        {view === AppView.BUGGY && <BuggyBooking user={user!} onBack={() => setView(AppView.HOME)} />}
        
        {view === AppView.CHAT && <ConciergeChat onClose={() => setView(AppView.HOME)} />}

        {view === AppView.DINING_ORDER && <ServiceBooking type="DINING" user={user!} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.SPA_BOOKING && <ServiceBooking type="SPA" user={user!} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.POOL_ORDER && <ServiceBooking type="POOL" user={user!} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.BUTLER_REQUEST && <ServiceBooking type="BUTLER" user={user!} onBack={() => setView(AppView.HOME)} />}
        {view === AppView.EVENTS && <EventsList onBack={() => setView(AppView.HOME)} />}
        
        {view === AppView.ACCOUNT && <GuestAccount user={user!} onBack={() => setView(AppView.HOME)} />}

      </div>

      {/* Bottom Nav (Only visible on Home/Account) */}
      {(view === AppView.HOME || view === AppView.ACCOUNT) && (
        <div className="bg-white border-t border-gray-100 p-4 flex justify-around items-center text-gray-400 absolute bottom-0 w-full z-30">
           <button onClick={() => setView(AppView.HOME)} className={`flex flex-col items-center hover:text-emerald-800 transition ${view === AppView.HOME ? 'text-emerald-800' : ''}`}>
              <div className={`w-6 h-6 rounded-full mb-1 ${view === AppView.HOME ? 'bg-emerald-800' : 'bg-gray-300'}`}></div>
              <span className="text-[10px] font-bold">Home</span>
           </button>
           <button onClick={() => setView(AppView.CHAT)} className="flex flex-col items-center hover:text-emerald-600 transition">
              <MessageSquare size={24} className="mb-1" />
              <span className="text-[10px]">Concierge</span>
           </button>
           <button onClick={() => setView(AppView.ACCOUNT)} className={`flex flex-col items-center hover:text-emerald-600 transition ${view === AppView.ACCOUNT ? 'text-emerald-800' : ''}`}>
              <UserIcon size={24} className="mb-1" />
              <span className="text-[10px]">Account</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default App;
