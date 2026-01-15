import React from 'react';

const BuggyLoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[100] bg-emerald-50 flex flex-col items-center justify-center overflow-hidden">
            {/* Background Elements - Moving Clouds/Trees simulation */}
            <div className="absolute inset-0 opacity-20 overflow-hidden">
                <div className="absolute top-1/4 left-0 w-full h-32 bg-gradient-to-r from-emerald-100 to-transparent animate-slide-right delay-100"></div>
                <div className="absolute top-1/2 left-0 w-full h-24 bg-gradient-to-r from-emerald-200 to-transparent animate-slide-right delay-300" style={{ animationDuration: '3s' }}></div>
            </div>

            {/* Main Buggy Animation */}
            <div className="relative z-10 scale-150 transform transition-transform">
                <div className="relative animate-bounce-slight">
                    {/* Buggy Body */}
                    <svg
                        width="120"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-emerald-700 drop-shadow-xl"
                    >
                        {/* Custom SVG Path for a "Buggy/Golf Cart" look based on Lucide Car but modified if possible, 
                actually Lucide 'Car' is standard sedans. Let's use a composite SVG for a Golf Cart look. 
                Using standard SVG paths for better control than just an icon. */}
                        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" fill="none" className="stroke-emerald-800" />
                        <path d="M6 10h10l2 2" fill="none" className="stroke-emerald-800" /> {/* Roof/Frame */}
                        <rect x="2" y="6" width="12" height="2" className="fill-emerald-200 stroke-none" /> {/* Roof Top */}
                        <circle cx="6.5" cy="16.5" r="2.5" className="animate-spin-slow stroke-emerald-900 fill-gray-200" /> {/* Wheel 1 */}
                        <circle cx="16.5" cy="16.5" r="2.5" className="animate-spin-slow stroke-emerald-900 fill-gray-200" /> {/* Wheel 2 */}
                        <path d="M14 6l2 5" className="stroke-emerald-800" /> {/* Rear Frame */}
                        <path d="M6 6l-2 5" className="stroke-emerald-800" /> {/* Front Frame */}
                    </svg>

                    {/* Wind Lines (Simulating speed) */}
                    <div className="absolute top-1/2 -right-12 space-y-2">
                        <div className="w-8 h-0.5 bg-emerald-400/50 rounded-full animate-wind"></div>
                        <div className="w-12 h-0.5 bg-emerald-400/50 rounded-full animate-wind delay-75"></div>
                        <div className="w-6 h-0.5 bg-emerald-400/50 rounded-full animate-wind delay-150"></div>
                    </div>
                </div>

                {/* Shadow */}
                <div className="w-24 h-2 bg-black/10 rounded-[100%] absolute -bottom-2 left-1/2 -translate-x-1/2 blur-sm animate-pulse"></div>
            </div>

            {/* Loading Text */}
            <div className="mt-12 flex flex-col items-center">
                <h3 className="text-xl font-bold text-emerald-800 tracking-wider">FURAMA RESORT</h3>
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-widest mt-1 animate-pulse">Loading System...</p>
            </div>

            {/* Styles for animations */}
            <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); transform-origin: center; }
          to { transform: rotate(360deg); transform-origin: center; }
        }
        @keyframes bounce-slight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes slide-right {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        @keyframes wind {
           0% { transform: translateX(0); opacity: 0; }
           20% { opacity: 1; }
           100% { transform: translateX(-20px); opacity: 0; }
        }
        .animate-spin-slow {
          animation: spin-slow 0.8s linear infinite;
        }
        .animate-bounce-slight {
          animation: bounce-slight 0.6s ease-in-out infinite;
        }
        .animate-slide-right {
          animation: slide-right 8s linear infinite;
        }
        .animate-wind {
          animation: wind 1s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default BuggyLoadingScreen;
