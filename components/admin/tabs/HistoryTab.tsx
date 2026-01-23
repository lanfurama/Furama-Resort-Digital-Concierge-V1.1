import React, { useMemo } from 'react';
import { History, Clock, Star, Filter, Calendar, X } from 'lucide-react';

interface HistoryTabProps {
    serviceHistory: any[];
    historyFilterType: string;
    setHistoryFilterType: (type: string) => void;
    historyFilterDate: string;
    setHistoryFilterDate: (date: string) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
    serviceHistory,
    historyFilterType,
    setHistoryFilterType,
    historyFilterDate,
    setHistoryFilterDate
}) => {
    const filteredHistory = useMemo(() => {
        return serviceHistory.filter(req => {
            const matchesType = historyFilterType === 'ALL' || req.type === historyFilterType;
            const reqDate = new Date(req.timestamp).toISOString().split('T')[0];
            const matchesDate = !historyFilterDate || reqDate === historyFilterDate;
            return matchesType && matchesDate;
        });
    }, [serviceHistory, historyFilterType, historyFilterDate]);

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">Service Order History</h2>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="flex space-x-2 bg-white p-1.5 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-1 px-2 border-r border-gray-200">
                            <Filter size={14} className="text-gray-400" />
                            <select
                                className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
                                value={historyFilterType}
                                onChange={(e) => setHistoryFilterType(e.target.value)}
                            >
                                <option value="ALL">All Services</option>
                                <option value="BUGGY">Buggy</option>
                                <option value="DINING">Dining</option>
                                <option value="SPA">Spa</option>
                                <option value="POOL">Pool</option>
                                <option value="BUTLER">Butler</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-1 px-2">
                            <Calendar size={14} className="text-gray-400" />
                            <input
                                type="date"
                                className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
                                value={historyFilterDate}
                                onChange={(e) => setHistoryFilterDate(e.target.value)}
                            />
                            {historyFilterDate && (
                                <button onClick={() => setHistoryFilterDate('')} className="text-gray-400 hover:text-red-500">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {filteredHistory.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                        <History size={48} className="mb-4 opacity-20" />
                        <p>No service history found matching your filters.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600">Time</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Room</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Service Type</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Details</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((req, i) => (
                                <tr key={req.id || i} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Clock size={12} className="mr-1.5 text-gray-400" />
                                            {new Date(req.timestamp).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-gray-800">{req.roomNumber}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${req.type === 'DINING' ? 'bg-orange-100 text-orange-700' :
                                            req.type === 'SPA' ? 'bg-purple-100 text-purple-700' :
                                                req.type === 'POOL' ? 'bg-blue-100 text-blue-700' :
                                                    req.type === 'BUGGY' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            {req.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="truncate max-w-xs">{req.details}</div>
                                        {req.rating && (
                                            <div className="mt-1 flex items-center text-xs text-amber-500">
                                                <div className="flex mr-1">
                                                    {[...Array(req.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                                </div>
                                                {req.feedback && <span className="text-gray-400 italic truncate max-w-[150px]">"{req.feedback}"</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${req.status === 'COMPLETED' ? 'text-green-600 bg-green-50' :
                                            req.status === 'CONFIRMED' ? 'text-blue-600 bg-blue-50' :
                                                'text-orange-600 bg-orange-50'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};
