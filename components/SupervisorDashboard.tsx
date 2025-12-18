
import React, { useState, useEffect } from 'react';
import { getDashboardStats, getDriverPerformanceStats } from '../services/dataService';
import { Users, AlertCircle, Car, DollarSign, Clock, Activity, Utensils, Sparkles, Waves, User as UserIcon, TrendingUp, Award } from 'lucide-react';

const SupervisorDashboard: React.FC = () => {
    // Initialize with default values to prevent null errors
    const [stats, setStats] = useState<any>({
        activeGuests: 0,
        pendingDining: 0,
        pendingSpa: 0,
        pendingPool: 0,
        pendingButler: 0,
        activeBuggies: 0,
        searchingBuggies: 0,
        onTripBuggies: 0,
        completedBuggies: 0,
        totalRevenue: 0,
        todayCompletedCount: 0,
        recentActivity: []
    });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [driverPerformancePeriod, setDriverPerformancePeriod] = useState<'day' | 'week' | 'month'>('day');
    const [driverStats, setDriverStats] = useState<any[]>([]);

    useEffect(() => {
        // Load initial stats
        const loadStats = async () => {
            try {
                setIsLoading(true);
                const initialStats = await getDashboardStats();
                setStats(initialStats);
            } catch (error) {
                console.error('Failed to load dashboard stats:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();

        // Real-time clock
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        // Load driver performance stats
        const loadDriverStats = async () => {
            try {
                const driverData = await getDriverPerformanceStats(driverPerformancePeriod);
                setDriverStats(driverData);
            } catch (error) {
                console.error('Failed to load driver performance stats:', error);
            }
        };
        loadDriverStats();

        // Poll stats
        const dataPoller = setInterval(async () => {
            try {
                const newStats = await getDashboardStats();
                setStats(newStats);
                const driverData = await getDriverPerformanceStats(driverPerformancePeriod);
                setDriverStats(driverData);
            } catch (error) {
                console.error('Failed to update dashboard stats:', error);
            }
        }, 3000); // Update every 3 seconds

        return () => {
            clearInterval(timer);
            clearInterval(dataPoller);
        };
    }, [driverPerformancePeriod]);

    // Department Health Indicators
    const getHealthStatus = (pendingCount: number) => {
        if (pendingCount === 0) return { color: 'bg-green-500', text: 'Idle' };
        if (pendingCount < 3) return { color: 'bg-emerald-500', text: 'Healthy' };
        if (pendingCount < 6) return { color: 'bg-amber-500', text: 'Busy' };
        return { color: 'bg-red-500', text: 'Overload' };
    };

    // Safe access with default values
    const pendingDining = stats?.pendingDining || 0;
    const pendingSpa = stats?.pendingSpa || 0;
    const pendingPool = stats?.pendingPool || 0;
    const pendingButler = stats?.pendingButler || 0;
    const searchingBuggies = stats?.searchingBuggies || 0;
    const onTripBuggies = stats?.onTripBuggies || 0;
    const completedBuggies = stats?.completedBuggies || 0;
    const activeBuggies = stats?.activeBuggies || 0;
    const activeGuests = stats?.activeGuests || 0;
    const totalRevenue = stats?.totalRevenue || 0;
    const todayCompletedCount = stats?.todayCompletedCount || 0;
    const recentActivity = stats?.recentActivity || [];

    const diningHealth = getHealthStatus(pendingDining);
    const spaHealth = getHealthStatus(pendingSpa);
    const buggyHealth = getHealthStatus(searchingBuggies);

    // Calculate chart percentages
    const totalPending = pendingDining + pendingSpa + pendingPool + pendingButler;
    const maxVal = Math.max(pendingDining, pendingSpa, pendingPool, pendingButler, 1);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Time */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center">
                        <Activity className="w-5 h-5 text-emerald-600 mr-2" /> 
                        Realtime Operations Center
                    </h2>
                    <p className="text-xs text-gray-500">Live monitoring of resort services</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-gray-800 leading-none">
                        {currentTime.toLocaleTimeString([], { hour12: false })}
                    </div>
                    <div className="text-xs text-gray-500">{currentTime.toDateString()}</div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Guests Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500 flex justify-between items-center">
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Total Guests</p>
                        <h3 className="text-2xl font-bold text-gray-800 leading-tight">{activeGuests}</h3>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-full text-emerald-600 ml-3 flex-shrink-0">
                        <Users size={20} />
                    </div>
                </div>

                {/* Buggy Status Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500">
                    <div className="flex justify-between items-center mb-2.5">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Buggy Status</p>
                        <div className="p-2 bg-amber-50 rounded-full text-amber-600">
                            <Car size={18} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                            <p className="text-[9px] text-gray-500 mb-0.5">Waiting</p>
                            <p className="text-base font-bold text-amber-600 leading-tight">{searchingBuggies}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] text-gray-500 mb-0.5">On Trip</p>
                            <p className="text-base font-bold text-blue-600 leading-tight">{onTripBuggies}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] text-gray-500 mb-0.5">Completed</p>
                            <p className="text-base font-bold text-green-600 leading-tight">{completedBuggies}</p>
                        </div>
                    </div>
                </div>

                {/* Estimated Daily Revenue Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500 flex justify-between items-center">
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Est. Daily Rev</p>
                        <h3 className="text-2xl font-bold text-gray-800 leading-tight">${totalRevenue}</h3>
                        <p className="text-[9px] text-purple-600 mt-0.5">{todayCompletedCount} completed orders</p>
                    </div>
                    <div className="p-2.5 bg-purple-50 rounded-full text-purple-600 ml-3 flex-shrink-0">
                        <DollarSign size={20} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Status & Visuals */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Department Status Grid */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-700">Department Status</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                            <div className="p-6 text-center">
                                <div className="flex justify-center mb-2 text-orange-600"><Utensils /></div>
                                <h4 className="font-bold text-gray-800">Dining</h4>
                                <div className="text-xs text-gray-500 mb-3">{pendingDining} orders pending</div>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs text-white font-bold ${diningHealth.color}`}>
                                    {diningHealth.text}
                                </div>
                            </div>
                            <div className="p-6 text-center">
                                <div className="flex justify-center mb-2 text-purple-600"><Sparkles /></div>
                                <h4 className="font-bold text-gray-800">Spa</h4>
                                <div className="text-xs text-gray-500 mb-3">{pendingSpa} bookings pending</div>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs text-white font-bold ${spaHealth.color}`}>
                                    {spaHealth.text}
                                </div>
                            </div>
                            <div className="p-6 text-center">
                                <div className="flex justify-center mb-2 text-emerald-600"><Car /></div>
                                <h4 className="font-bold text-gray-800">Buggy</h4>
                                <div className="text-xs text-gray-500 mb-3">{searchingBuggies} requests pending</div>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs text-white font-bold ${buggyHealth.color}`}>
                                    {buggyHealth.text}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Request Distribution (CSS Charts) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                         <h3 className="font-bold text-gray-700 mb-6">Service Demand Distribution</h3>
                         <div className="space-y-4">
                            {[
                                { label: 'Dining', val: pendingDining, color: 'bg-orange-500' },
                                { label: 'Spa', val: pendingSpa, color: 'bg-purple-500' },
                                { label: 'Pool', val: pendingPool, color: 'bg-blue-500' },
                                { label: 'Butler', val: pendingButler, color: 'bg-slate-500' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center text-sm">
                                    <span className="w-16 font-semibold text-gray-600">{item.label}</span>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full mx-3 overflow-hidden">
                                        <div 
                                            className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                                            style={{ width: `${(item.val / maxVal) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="w-8 text-right font-mono text-gray-500">{item.val}</span>
                                </div>
                            ))}
                         </div>
                    </div>

                    {/* Driver Performance Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-gray-700">Driver Performance</h3>
                            </div>
                            <div className="flex gap-2">
                                {(['day', 'week', 'month'] as const).map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setDriverPerformancePeriod(period)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                            driverPerformancePeriod === period
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {period.charAt(0).toUpperCase() + period.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {driverStats.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                No driver performance data available for this period.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {driverStats.slice(0, 5).map((driver, index) => {
                                    const maxScore = driverStats[0]?.performanceScore || 100;
                                    const percentage = maxScore > 0 ? (driver.performanceScore / maxScore) * 100 : 0;
                                    const isTopDriver = index === 0;
                                    
                                    return (
                                        <div key={driver.driverId} className="relative">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="flex items-center gap-2 min-w-[120px]">
                                                    {isTopDriver && <Award className="w-4 h-4 text-yellow-500" />}
                                                    <span className="text-sm font-semibold text-gray-800 truncate">
                                                        {driver.driverName}
                                                    </span>
                                                </div>
                                                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${
                                                            isTopDriver ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                                            index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                                                            index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400' :
                                                            'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                        }`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                                                        <span className="text-[10px] font-bold text-gray-700">
                                                            {driver.performanceScore.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] text-gray-500 ml-[140px]">
                                                <span className="flex items-center gap-1">
                                                    <Car className="w-3 h-3" />
                                                    {driver.totalRides} rides
                                                </span>
                                                {driver.avgRating > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-yellow-500">★</span>
                                                        {driver.avgRating.toFixed(1)} rating
                                                    </span>
                                                )}
                                                {driver.avgResponseTime > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {Math.round(driver.avgResponseTime / 1000 / 60)}m response
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-700 flex justify-between items-center">
                        <span>Live Activity Feed</span>
                        <span className="text-xs text-emerald-600 flex items-center animate-pulse">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span> Live
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {recentActivity.length === 0 ? (
                            <div className="text-center text-gray-400 mt-20 text-sm">No activity today yet.</div>
                        ) : (
                            recentActivity.map((item, i) => (
                                <div key={item.id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0">
                                    <div className="mt-1">
                                        {item.type === 'DINING' && <div className="p-1.5 bg-orange-100 text-orange-600 rounded-full"><Utensils size={12}/></div>}
                                        {item.type === 'SPA' && <div className="p-1.5 bg-purple-100 text-purple-600 rounded-full"><Sparkles size={12}/></div>}
                                        {item.type === 'BUGGY' && <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-full"><Car size={12}/></div>}
                                        {item.type === 'POOL' && <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full"><Waves size={12}/></div>}
                                        {item.type === 'BUTLER' && <div className="p-1.5 bg-slate-100 text-slate-600 rounded-full"><UserIcon size={12}/></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <p className="text-sm font-bold text-gray-800">Room {item.roomNumber}</p>
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                {new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 truncate">{item.details}</p>
                                        <div className="mt-1">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                item.status === 'PENDING' || item.status === 'SEARCHING' ? 'bg-amber-100 text-amber-700' :
                                                item.status === 'CONFIRMED' || item.status === 'ARRIVING' || item.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupervisorDashboard;
