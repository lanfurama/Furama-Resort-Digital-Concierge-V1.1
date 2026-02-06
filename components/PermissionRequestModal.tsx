import React from 'react';
import { Mic, MapPin, X, Check, Shield } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface PermissionRequestModalProps {
    isOpen: boolean;
    type: 'microphone' | 'location';
    onConfirm: () => void;
    onCancel: () => void;
}

const PermissionRequestModal: React.FC<PermissionRequestModalProps> = ({
    isOpen,
    type,
    onConfirm,
    onCancel
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const content = {
        microphone: {
            icon: <Mic className="w-8 h-8 text-emerald-600" />,
            title: t('permission_mic_title') || 'Microphone Access',
            description: t('permission_mic_desc') || 'Furama Digital Concierge needs microphone access to listen to your voice commands and provide assistance.',
            benefit: t('permission_mic_benefit') || 'Speak naturally to book amenities, ask questions, or request services.',
            button: t('allow_microphone') || 'Allow Microphone'
        },
        location: {
            icon: <MapPin className="w-8 h-8 text-blue-600" />,
            title: t('permission_loc_title') || 'Location Access',
            description: t('permission_loc_desc') || 'We need your location to show where you are on the resort map and finding directions.',
            benefit: t('permission_loc_benefit') || 'Easily find your way around the resort and see nearby facilities.',
            button: t('allow_location') || 'Allow Location'
        }
    };

    const current = content[type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">

                {/* Header Decoration */}
                <div className={`h-2 w-full ${type === 'microphone' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} />

                <div className="p-6">
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        {/* Icon Bubble */}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border-2 ${type === 'microphone' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                            {current.icon}
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2 font-serif tracking-wide">
                            {current.title}
                        </h3>

                        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                            {current.description}
                        </p>

                        {/* Benefit Box */}
                        <div className="bg-gray-50 rounded-xl p-3 w-full mb-6 border border-gray-200/60 flex items-start gap-3 text-left">
                            <div className="mt-0.5 min-w-[18px]">
                                <Shield className="w-4.5 h-4.5 text-gray-400" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-700 block mb-0.5 uppercase tracking-wider">{t('why_is_this_safe') || 'Why is this safe?'}</span>
                                <p className="text-xs text-gray-500 leading-snug">
                                    {t('permission_privacy_note') || 'We only use this permission when you are using the feature. Your data stays private.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={onConfirm}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2
                  ${type === 'microphone'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                                    }`}
                            >
                                <Check size={18} strokeWidth={2.5} />
                                {current.button}
                            </button>

                            <button
                                onClick={onCancel}
                                className="w-full py-3 px-4 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                {t('not_now') || 'Not Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionRequestModal;
