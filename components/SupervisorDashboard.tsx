
import React, { useState, useEffect } from 'react';
import { getDashboardStats, getDriverPerformanceStats } from '../services/dataService';
import { Users, AlertCircle, Car, DollarSign, Clock, Activity, Utensils, Sparkles, Waves, User as UserIcon, TrendingUp, Award, BarChart3, Inbox } from 'lucide-react';

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
                const driverData = await getDriverPerformanceStats({ period: driverPerformancePeriod });
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
                const driverData = await getDriverPerformanceStats({ period: driverPerformancePeriod });
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

    // Show loading skeleton with Modern Premium design
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-6 space-y-8 animate-pulse font-sans">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center">
                    <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 w-40 bg-gray-200 rounded-full"></div>
                </div>

                {/* KPI Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                            <div className="w-10 h-10 bg-gray-200 rounded-full mb-4"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                <div className="h-8 w-16 bg-gray-300 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        {/* Department Status Skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white p-5 rounded-2xl shadow-sm h-24 border border-gray-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-16 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                                    <div className="h-5 w-32 bg-gray-200 rounded mb-6"></div>
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4].map((j) => (
                                            <div key={j} className="h-8 bg-gray-100 rounded-full"></div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Feed Skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[600px] xl:h-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div className="h-5 w-32 bg-gray-200 rounded"></div>
                            <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                                        <div className="h-3 w-3/4 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-8 animate-in fade-in duration-500 font-sans text-gray-800">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg shadow-emerald-600/20">
                            <Activity size={24} />
                        </div>
                        Operations Center
                    </h1>
                    <p className="text-gray-500 mt-1 ml-1">Real-time resort monitoring & dispatch</p>
                </div>

                <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200/60">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <div className="text-right">
                        <div className="text-sm font-bold font-mono text-gray-900 leading-none">
                            {currentTime.toLocaleTimeString([], { hour12: false })}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            {currentTime.toDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main KPI Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Guests */}
                <div className="group bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <Users size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Active Guests</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">{activeGuests}</span>
                            <span className="text-sm text-gray-400">in resort</span>
                        </div>
                    </div>
                </div>

                {/* Buggy Fleet Status */}
                <div className="group bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Car size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-gray-500 mb-4">
                            <Car size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Buggy Fleet</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{searchingBuggies}</div>
                                <div className="text-[10px] text-amber-600 font-bold bg-amber-50 inline-block px-2 py-0.5 rounded-full mt-1">WAITING</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{onTripBuggies}</div>
                                <div className="text-[10px] text-blue-600 font-bold bg-blue-50 inline-block px-2 py-0.5 rounded-full mt-1">BUSY</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{completedBuggies}</div>
                                <div className="text-[10px] text-green-600 font-bold bg-green-50 inline-block px-2 py-0.5 rounded-full mt-1">DONE</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue */}
                <div className="group bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <DollarSign size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Est. Revenue</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">${totalRevenue}</span>
                            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                +{todayCompletedCount} orders
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Department Status & Charts */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Department Health Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { name: 'Dining', icon: Utensils, count: pendingDining, health: diningHealth, color: 'text-orange-500', bg: 'bg-orange-50' },
                            { name: 'Spa', icon: Sparkles, count: pendingSpa, health: spaHealth, color: 'text-purple-500', bg: 'bg-purple-50' },
                            { name: 'Buggy', icon: Car, count: searchingBuggies, health: buggyHealth, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        ].map((dept) => (
                            <div key={dept.name} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${dept.bg} ${dept.color}`}>
                                        <dept.icon size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{dept.name}</div>
                                        <div className="text-xs text-gray-500 font-medium">{dept.count} pending</div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm ${dept.health.color}`}>
                                    {dept.health.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Container */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Service Demand */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Activity size={18} className="text-gray-400" />
                                Service Demand
                            </h3>
                            <div className="flex-1 flex flex-col justify-center space-y-5">
                                {[
                                    { label: 'Dining', val: pendingDining, color: 'bg-orange-500' },
                                    { label: 'Spa', val: pendingSpa, color: 'bg-purple-500' },
                                    { label: 'Pool', val: pendingPool, color: 'bg-blue-500' },
                                    { label: 'Butler', val: pendingButler, color: 'bg-slate-500' },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                                            <span className="text-gray-600">{item.label}</span>
                                            <span className="text-gray-900">{item.val}</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                                                style={{ width: `${(item.val / maxVal) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Driver Performance */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-gray-400" />
                                    Top Drivers
                                </h3>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    {(['day', 'week', 'month'] as const).map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setDriverPerformancePeriod(period)}
                                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wide ${driverPerformancePeriod === period
                                                ? 'bg-white text-emerald-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {driverStats.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                                        <BarChart3 className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-xs font-medium">No performance data</p>
                                </div>
                            ) : (
                                <div className="space-y-4 flex-1">
                                    {driverStats.slice(0, 4).map((driver, index) => {
                                        const maxScore = driverStats[0]?.performance_score || 100;
                                        const percentage = maxScore > 0 ? (driver.performance_score / maxScore) * 100 : 0;
                                        return (
                                            <div key={driver.driver_id} className="group">
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                                        {index === 0 && <Award size={12} className="text-yellow-500" />}
                                                        {driver.driver_name}
                                                    </div>
                                                    <div className="font-mono text-gray-500">{(driver.performance_score ?? 0).toFixed(1)}</div>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-gray-400">
                                                    <span>{driver.total_rides ?? 0} rides</span>
                                                    <span>{(driver.avg_rating ?? 0).toFixed(1)} ★</span>
                                                    {(driver.avg_response_time ?? 0) > 0 && (
                                                        <span className="flex items-center gap-1 ml-2">
                                                            <Clock size={10} />
                                                            {Math.round((driver.avg_response_time ?? 0) / 60000)}m
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
                </div>

                {/* Right Column: Live Feed */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px] xl:h-auto">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                        <h3 className="font-bold text-gray-900">Live Activity</h3>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-100 rounded-full shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Live</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {recentActivity.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                <Inbox className="w-10 h-10 text-gray-300 mb-3" />
                                <p className="text-sm font-medium text-gray-500">All quiet for now</p>
                                <p className="text-xs text-gray-400">Real-time updates will stream here</p>
                            </div>
                        ) : (
                            recentActivity.map((item) => (
                                <div key={item.id} className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="mt-1">
                                        {item.type === 'DINING' && <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Utensils size={14} /></div>}
                                        {item.type === 'SPA' && <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Sparkles size={14} /></div>}
                                        {item.type === 'BUGGY' && <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Car size={14} /></div>}
                                        {item.type === 'POOL' && <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Waves size={14} /></div>}
                                        {item.type === 'BUTLER' && <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><UserIcon size={14} /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <span className="font-bold text-gray-900 text-sm">Room {item.roomNumber}</span>
                                            <span className="text-[10px] font-mono text-gray-400">
                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2">{item.details}</p>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${item.status === 'PENDING' || item.status === 'SEARCHING' ? 'bg-amber-100 text-amber-700' :
                                            item.status === 'CONFIRMED' || item.status === 'ARRIVING' || item.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {item.status}
                                        </span>
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
