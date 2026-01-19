
import React from 'react';
import { Mic, X, Loader2, CheckCircle, AlertCircle, Sparkles, Languages } from 'lucide-react';
import { ParsedVoiceData } from '../../../services/voiceParsingService';

interface VoiceAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    isListening: boolean;
    transcript: string;
    voiceResult: { status: string | null; message: string };
    audioLevel: number;
    processing: boolean;
    parsedData: ParsedVoiceData;
    onConfirm: () => void;
    onRetry: () => void;
    silenceCountdown: number | null;
    silenceRemainingTime: number | null;
}

const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
    isOpen,
    onClose,
    isListening,
    transcript,
    voiceResult,
    audioLevel,
    processing,
    parsedData,
    onConfirm,
    onRetry,
    silenceCountdown,
    silenceRemainingTime,
}) => {
    if (!isOpen) return null;

    // Determine current state for UI
    const isSuccess = voiceResult.status === 'success';
    const isError = voiceResult.status === 'error';
    const showResultCard = isSuccess && parsedData.pickup && parsedData.destination;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Main Content */}
            <div className="relative w-full max-w-lg z-10 flex flex-col items-center justify-between min-h-[60vh] max-h-[90vh]">

                {/* Header / Close */}
                <div className="absolute top-0 right-0 p-4">
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Visualizer Area (Center) */}
                <div className="flex-1 flex flex-col items-center justify-center w-full space-y-8">

                    {/* Ambient Title */}
                    {!isListening && !processing && !isSuccess && !isError && (
                        <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                Trợ Lý Furama
                            </h2>
                            <p className="text-blue-200/80">Chạm vào micro để bắt đầu</p>
                        </div>
                    )}

                    {/* Animated Orb / Mic Button */}
                    <div className="relative group">
                        {/* Ripple Effects when listening */}
                        {isListening && (
                            <>
                                <div
                                    className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl transition-transform duration-75"
                                    style={{ transform: `scale(${1 + (audioLevel / 50)})` }}
                                />
                                <div
                                    className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md transition-transform duration-100"
                                    style={{ transform: `scale(${1 + (audioLevel / 30)})` }}
                                />
                            </>
                        )}

                        <button
                            onClick={isListening ? () => { } : onRetry}
                            disabled={isListening || processing}
                            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
                ${isListening ? 'bg-gradient-to-br from-red-500 to-pink-600 scale-110 ring-4 ring-red-500/30' :
                                    processing ? 'bg-gradient-to-br from-blue-600 to-indigo-700 scale-95 animate-pulse' :
                                        isSuccess ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                                            isError ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                                                'bg-gradient-to-br from-blue-500 to-cyan-500 hover:scale-105 hover:shadow-cyan-500/50'
                                }`}
                        >
                            {processing ? (
                                <Loader2 size={40} className="text-white animate-spin" />
                            ) : isSuccess ? (
                                <CheckCircle size={40} className="text-white" />
                            ) : isError ? (
                                <AlertCircle size={40} className="text-white" />
                            ) : (
                                <Mic size={40} className={`text-white ${isListening ? 'animate-bounce' : ''}`} />
                            )}
                        </button>
                    </div>

                    {/* Status Label */}
                    <div className="text-center h-8">
                        {isListening ? (
                            <span className="text-blue-300 font-medium tracking-wide animate-pulse flex items-center gap-2 justify-center">
                                Đang lắng nghe...
                                {silenceCountdown !== null && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-200">
                                        {silenceCountdown}s
                                    </span>
                                )}
                            </span>
                        ) : processing ? (
                            <span className="text-indigo-300 font-medium tracking-wide flex items-center gap-2 justify-center">
                                <Sparkles size={16} className="animate-pulse" />
                                Đang xử lý...
                            </span>
                        ) : isSuccess ? (
                            <span className="text-emerald-300 font-medium tracking-wide">Thành công</span>
                        ) : isError ? (
                            <span className="text-orange-300 font-medium tracking-wide">Thử lại</span>
                        ) : (
                            <span className="text-white/40 text-sm">Sẵn sàng</span>
                        )}
                    </div>
                </div>

                {/* Bottom Sheet / Result Area */}
                <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-10">

                    {/* Live Transcript */}
                    <div className="mb-6 min-h-[60px] max-h-[120px] overflow-y-auto custom-scrollbar">
                        {transcript ? (
                            <p className="text-lg md:text-xl font-medium text-white leading-relaxed text-center">
                                "{transcript}"
                            </p>
                        ) : (
                            <p className="text-white/30 text-center italic">
                                Hãy nói: "Đón tôi ở ACC đi Hồ Bơi" hoặc "Phòng 101 đi Nhà hàng"
                            </p>
                        )}
                    </div>

                    {/* Parsing Result Card */}
                    {showResultCard && (
                        <div className="bg-white/90 rounded-xl p-4 shadow-lg mb-6 animate-in zoom-in-50 duration-300">
                            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                    <Sparkles size={16} />
                                    <span>Thông Tin Chuyến Xe</span>
                                </div>
                                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    Đã xác thực
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm đón</span>
                                    <span className="font-semibold text-gray-800 text-lg truncate">{parsedData.pickup}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm đến</span>
                                    <span className="font-semibold text-gray-800 text-lg truncate">{parsedData.destination}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-gray-100">
                                    <div>
                                        <span className="block text-xs font-bold text-gray-500 uppercase">Số phòng</span>
                                        <span className="font-medium text-gray-800">{parsedData.roomNumber || '---'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-500 uppercase">Số khách</span>
                                        <span className="font-medium text-gray-800">{parsedData.guestCount || 1} {parsedData.guestName ? `(${parsedData.guestName})` : ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {isError && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-center animate-in shake">
                            <p className="text-red-200 font-medium">
                                {voiceResult.message}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
                        >
                            Hủy
                        </button>

                        {showResultCard ? (
                            <button
                                onClick={onConfirm}
                                className="px-4 py-3 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                            >
                                Xác nhận <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={onRetry}
                                disabled={isListening || processing}
                                className="px-4 py-3 rounded-xl font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isListening ? 'Đang nghe...' : <><Mic size={18} /> Chạm để nói</>}
                            </button>
                        )}
                    </div>

                    {/* Language Hint */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-white/30 text-xs">
                        <Languages size={12} />
                        <span>Hỗ trợ Tiếng Việt & Tiếng Anh</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

// Helper for icon (used in button above)
import { ArrowRight } from 'lucide-react';

export default VoiceAssistantModal;
