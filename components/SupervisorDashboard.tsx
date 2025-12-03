
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/dataService';
import { Users, AlertCircle, Car, DollarSign, Clock, Activity, Utensils, Sparkles, Waves, User as UserIcon } from 'lucide-react';

const SupervisorDashboard: React.FC = () => {
    const [stats, setStats] = useState(getDashboardStats());
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Real-time clock
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        // Poll stats
        const dataPoller = setInterval(() => {
            setStats(getDashboardStats());
        }, 3000); // Update every 3 seconds

        return () => {
            clearInterval(timer);
            clearInterval(dataPoller);
        };
    }, []);

    // Department Health Indicators
    const getHealthStatus = (pendingCount: number) => {
        if (pendingCount === 0) return { color: 'bg-green-500', text: 'Idle' };
        if (pendingCount < 3) return { color: 'bg-emerald-500', text: 'Healthy' };
        if (pendingCount < 6) return { color: 'bg-amber-500', text: 'Busy' };
        return { color: 'bg-red-500', text: 'Overload' };
    };

    const diningHealth = getHealthStatus(stats.pendingDining);
    const spaHealth = getHealthStatus(stats.pendingSpa);
    const buggyHealth = getHealthStatus(stats.searchingBuggies);

    // Calculate chart percentages
    const totalPending = stats.pendingDining + stats.pendingSpa + stats.pendingPool + stats.pendingButler;
    const maxVal = Math.max(stats.pendingDining, stats.pendingSpa, stats.pendingPool, stats.pendingButler, 1);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-emerald-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Guests</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.activeGuests}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Pending Actions</p>
                        <h3 className="text-3xl font-bold text-gray-800">{totalPending + stats.searchingBuggies}</h3>
                        <p className="text-[10px] text-amber-600">{stats.searchingBuggies} waiting for buggy</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                        <AlertCircle size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Active Rides</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.activeBuggies}</h3>
                        <p className="text-[10px] text-blue-600">On trip or arriving</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                        <Car size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-purple-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Est. Daily Rev</p>
                        <h3 className="text-3xl font-bold text-gray-800">${stats.totalRevenue}</h3>
                        <p className="text-[10px] text-purple-600">{stats.todayCompletedCount} completed orders</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                        <DollarSign size={24} />
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
                                <div className="text-xs text-gray-500 mb-3">{stats.pendingDining} orders pending</div>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs text-white font-bold ${diningHealth.color}`}>
                                    {diningHealth.text}
                                </div>
                            </div>
                            <div className="p-6 text-center">
                                <div className="flex justify-center mb-2 text-purple-600"><Sparkles /></div>
                                <h4 className="font-bold text-gray-800">Spa</h4>
                                <div className="text-xs text-gray-500 mb-3">{stats.pendingSpa} bookings pending</div>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs text-white font-bold ${spaHealth.color}`}>
                                    {spaHealth.text}
                                </div>
                            </div>
                            <div className="p-6 text-center">
                                <div className="flex justify-center mb-2 text-emerald-600"><Car /></div>
                                <h4 className="font-bold text-gray-800">Buggy</h4>
                                <div className="text-xs text-gray-500 mb-3">{stats.searchingBuggies} requests pending</div>
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
                                { label: 'Dining', val: stats.pendingDining, color: 'bg-orange-500' },
                                { label: 'Spa', val: stats.pendingSpa, color: 'bg-purple-500' },
                                { label: 'Pool', val: stats.pendingPool, color: 'bg-blue-500' },
                                { label: 'Butler', val: stats.pendingButler, color: 'bg-slate-500' },
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
                        {stats.recentActivity.length === 0 ? (
                            <div className="text-center text-gray-400 mt-20 text-sm">No activity today yet.</div>
                        ) : (
                            stats.recentActivity.map((item, i) => (
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
