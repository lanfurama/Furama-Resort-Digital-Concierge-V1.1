import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI to notify the user they can add to home screen
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, so clearing it
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 md:bottom-4 z-50 animate-in slide-in-from-bottom flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-md border border-emerald-100 rounded-2xl shadow-2xl p-4 flex items-center justify-between mx-auto md:mx-0 max-w-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-xl">
                        <Download className="text-emerald-600" size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Install App</h4>
                        <p className="text-xs text-gray-500">For a better experience</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition"
                    >
                        <X size={16} />
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition active:scale-95"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
