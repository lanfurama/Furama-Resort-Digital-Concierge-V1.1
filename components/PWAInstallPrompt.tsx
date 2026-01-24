import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const PWAInstallPrompt: React.FC = () => {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || 
            (window.navigator as any).standalone === true) {
            setIsInstalled(true);
            return;
        }

        // Check localStorage for dismissed state
        const wasDismissed = localStorage.getItem('pwa-install-dismissed');
        if (wasDismissed) {
            const dismissedTime = parseInt(wasDismissed, 10);
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            // Show again after 7 days
            if (daysSinceDismissed < 7) {
                setDismissed(true);
                return;
            }
        }

        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            // Show our custom prompt after a short delay for better UX
            setTimeout(() => {
                setIsVisible(true);
            }, 2000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Also check for iOS install prompt
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS && !wasDismissed) {
            // Show iOS install instructions after delay
            setTimeout(() => {
                setIsVisible(true);
            }, 3000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // iOS or other browsers - show instructions
            showIOSInstructions();
            return;
        }

        try {
            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);

            if (outcome === 'accepted') {
                setIsInstalled(true);
                setIsVisible(false);
            }

            // We've used the prompt, so clear it
            setDeferredPrompt(null);
            setIsVisible(false);
        } catch (error) {
            console.error('Error showing install prompt:', error);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setDismissed(true);
        // Store dismissal time in localStorage
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    const showIOSInstructions = () => {
        // For iOS, we can show a modal with instructions
        alert(
            'To install this app on your iOS device:\n\n' +
            '1. Tap the Share button (square with arrow)\n' +
            '2. Scroll down and tap "Add to Home Screen"\n' +
            '3. Tap "Add" in the top right corner\n\n' +
            'Enjoy a better app experience!'
        );
        handleDismiss();
    };

    if (isInstalled || dismissed || !isVisible) return null;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 md:bottom-4 z-50 animate-in slide-in-from-bottom">
            <div className="bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-md border-2 border-emerald-200 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 mx-auto md:mx-0 max-w-sm">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5 rounded-xl shadow-lg">
                            <Smartphone className="text-white" size={22} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm mb-0.5">
                                {t('install_app') || 'Install App'}
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {isIOS 
                                    ? (t('install_ios_instructions') || 'Add to Home Screen for a better experience')
                                    : (t('install_benefits') || 'Get faster access and offline support')
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                        aria-label="Dismiss"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition active:scale-95"
                    >
                        {t('not_now') || 'Not Now'}
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                        <Download size={14} />
                        {t('install') || 'Install'}
                    </button>
                </div>
                {isIOS && (
                    <div className="text-[10px] text-gray-500 text-center pt-1 border-t border-gray-200">
                        {t('ios_install_hint') || 'Tap Share → Add to Home Screen'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
