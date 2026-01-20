
import React, { useMemo } from 'react';
import { Mic, X, Loader2, CheckCircle, AlertCircle, Sparkles, ArrowLeft, Languages, ArrowRight } from 'lucide-react';
import { ParsedVoiceData } from '../../../services/voiceParsingService';
import { ConversationState, ConversationStep } from '../../../services/conversationStateService';

interface ConversationalVoiceAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    isListening: boolean;
    transcript: string;
    audioLevel: number;
    conversationState: ConversationState;
    currentPrompt: string;
    progressPercentage: number;
    stepInfo: { current: number; total: number };
    isProcessing: boolean;
    onStartListening: () => void;
    onGoBack: () => void;
    onConfirm: () => void;
    silenceCountdown: number | null;
    silenceRemainingTime: number | null;
}

const ConversationalVoiceAssistantModal: React.FC<ConversationalVoiceAssistantModalProps> = ({
    isOpen,
    onClose,
    isListening,
    transcript,
    audioLevel,
    conversationState,
    currentPrompt,
    progressPercentage,
    stepInfo,
    isProcessing,
    onStartListening,
    onGoBack,
    onConfirm,
    silenceCountdown,
    silenceRemainingTime,
}) => {
    if (!isOpen) return null;

    const { step, data, suggestions } = conversationState;

    // Determine UI state
    const showConfirmation = step === 'CONFIRMING';
    const isCompleted = step === 'COMPLETED';
    const canGoBack = step !== 'IDLE' && step !== 'ASKING_PICKUP' && step !== 'COMPLETED';

    // Step icon mapping
    const getStepIcon = (currentStep: ConversationStep) => {
        if (isProcessing) return <Loader2 size={40} className="text-white animate-spin" />;
        if (isCompleted) return <CheckCircle size={40} className="text-white" />;
        return <Mic size={40} className={`text-white ${isListening ? 'animate-bounce' : ''}`} />;
    };

    // Get confirmation summary
    const getConfirmationSummary = () => {
        if (!data.pickup || !data.destination) return null;
        return `${data.guestCount || 1} khách đi từ ${data.pickup} đến ${data.destination}${data.notes ? `, ${data.notes}` : ''}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Main Content */}
            <div className="relative w-full max-w-lg z-10 flex flex-col items-center justify-between min-h-[60vh] max-h-[90vh]">

                {/* Header - Close & Progress */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    {/* Progress Indicator */}
                    {!isCompleted && stepInfo.current > 0 && (
                        <div className="flex items-center gap-2 text-blue-200 text-sm font-medium">
                            <span>Bước {stepInfo.current}/{stepInfo.total}</span>
                            <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="ml-auto text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Visualizer Area (Center) */}
                <div className="flex-1 flex flex-col items-center justify-center w-full space-y-8 mt-16">

                    {/* AI Prompt */}
                    <div className="text-center space-y-2 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
                            <Sparkles size={16} className="animate-pulse" />
                            <span className="text-xs uppercase tracking-wider">Trợ Lý AI</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight max-w-md">
                            {currentPrompt}
                        </h2>
                    </div>

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
                            onClick={isListening ? () => { } : onStartListening}
                            disabled={isListening || isProcessing || isCompleted}
                            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
                ${isListening ? 'bg-gradient-to-br from-red-500 to-pink-600 scale-110 ring-4 ring-red-500/30' :
                                    isProcessing ? 'bg-gradient-to-br from-blue-600 to-indigo-700 scale-95 animate-pulse' :
                                        isCompleted ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                                            'bg-gradient-to-br from-blue-500 to-cyan-500 hover:scale-105 hover:shadow-cyan-500/50'
                                }`}
                        >
                            {getStepIcon(step)}
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
                        ) : isProcessing ? (
                            <span className="text-indigo-300 font-medium tracking-wide flex items-center gap-2 justify-center">
                                <Sparkles size={16} className="animate-pulse" />
                                Đang xử lý với AI...
                            </span>
                        ) : isCompleted ? (
                            <span className="text-emerald-300 font-medium tracking-wide">Hoàn tất!</span>
                        ) : (
                            <span className="text-white/40 text-sm">Chạm micro để trả lời</span>
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
                            <div className="text-white/60 text-center text-sm italic">
                                Chờ bạn trả lời...
                            </div>
                        )}
                    </div>

                    {/* Collected Data Summary (Progressive Disclosure) */}
                    {(data.pickup || data.destination || data.guestCount) && !showConfirmation && (
                        <div className="mb-4 space-y-2">
                            {data.pickup && (
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle size={14} className="text-emerald-400" />
                                    <span className="text-white/70">Điểm đón:</span>
                                    <span className="text-white font-semibold">{data.pickup}</span>
                                </div>
                            )}
                            {data.destination && (
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle size={14} className="text-emerald-400" />
                                    <span className="text-white/70">Điểm đến:</span>
                                    <span className="text-white font-semibold">{data.destination}</span>
                                </div>
                            )}
                            {data.guestCount && (
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle size={14} className="text-emerald-400" />
                                    <span className="text-white/70">Số khách:</span>
                                    <span className="text-white font-semibold">{data.guestCount} người</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Suggestions (Real-time) */}
                    {suggestions.length > 0 && !showConfirmation && (
                        <div className="mb-6 space-y-2">
                            <p className="text-xs text-white/50 uppercase tracking-wider">Gợi ý:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.slice(0, 3).map((suggestion, idx) => (
                                    <div
                                        key={idx}
                                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors cursor-pointer border border-white/10"
                                    >
                                        {suggestion}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confirmation Card */}
                    {showConfirmation && (
                        <div className="bg-white/90 rounded-xl p-4 shadow-lg mb-6 animate-in zoom-in-50 duration-300">
                            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                    <CheckCircle size={16} />
                                    <span>Xác Nhận Thông Tin</span>
                                </div>
                            </div>

                            <div className="text-gray-800 text-sm mb-4 text-center font-medium">
                                {getConfirmationSummary()}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="block font-bold text-gray-500 uppercase mb-1">Điểm đón</span>
                                    <span className="font-semibold text-gray-800">{data.pickup}</span>
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-500 uppercase mb-1">Điểm đến</span>
                                    <span className="font-semibold text-gray-800">{data.destination}</span>
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-500 uppercase mb-1">Số khách</span>
                                    <span className="font-semibold text-gray-800">{data.guestCount || 1} người</span>
                                </div>
                                {data.notes && (
                                    <div>
                                        <span className="block font-bold text-gray-500 uppercase mb-1">Ghi chú</span>
                                        <span className="font-semibold text-gray-800">{data.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        {canGoBack ? (
                            <button
                                onClick={onGoBack}
                                className="px-4 py-3 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Quay lại
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-4 py-3 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
                            >
                                Hủy
                            </button>
                        )}

                        {showConfirmation ? (
                            <button
                                onClick={onConfirm}
                                className="px-4 py-3 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                            >
                                Xác nhận <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={onStartListening}
                                disabled={isListening || isProcessing}
                                className="px-4 py-3 rounded-xl font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isListening ? 'Đang nghe...' : <><Mic size={18} /> Nói</>}
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

export default ConversationalVoiceAssistantModal;
