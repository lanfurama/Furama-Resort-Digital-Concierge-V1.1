import React, { useMemo, useEffect, useRef } from "react";
import { X, ChevronLeft, Check, Volume2, VolumeX } from "lucide-react";
import { VoiceInputButton, VoiceState } from "./VoiceInputButton";

interface VoiceInputOverlayProps {
    isOpen: boolean;
    onClose: () => void;

    // Voice Recording State
    isListening: boolean;
    audioLevel: number;
    silenceCountdown: number | null;
    silenceRemainingTime: number | null;
    transcript: string;
    onToggleListening: () => void;

    // Conversation State
    currentStep: string;
    currentPrompt: string;
    progressPercentage: number;
    stepInfo: { current: number; total: number };
    isProcessing: boolean;
    collectedData: {
        pickup?: string;
        destination?: string;
        guestCount?: number;
        notes?: string;
        roomNumber?: string;
    };

    // Conversation Actions
    onGoBack: () => void;
    onConfirm: () => void;
    onCancel: () => void;

    // Voice Result
    voiceResult: {
        status: "success" | "error" | null;
        message: string;
    };
}

/**
 * Full-screen overlay for voice input with conversational flow
 */
export const VoiceInputOverlay: React.FC<VoiceInputOverlayProps> = ({
    isOpen,
    onClose,
    isListening,
    audioLevel,
    silenceCountdown,
    silenceRemainingTime,
    transcript,
    onToggleListening,
    currentStep,
    currentPrompt,
    progressPercentage,
    stepInfo,
    isProcessing,
    collectedData,
    onGoBack,
    onConfirm,
    onCancel,
    voiceResult,
}) => {
    const promptRef = useRef<HTMLDivElement>(null);

    // Determine voice button state
    const voiceState = useMemo((): VoiceState => {
        if (voiceResult.status === "success") return "success";
        if (voiceResult.status === "error") return "error";
        if (isProcessing) return "processing";
        if (isListening) return "listening";
        return "idle";
    }, [isListening, isProcessing, voiceResult]);

    // Auto-scroll prompt when it changes
    useEffect(() => {
        if (promptRef.current) {
            promptRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [currentPrompt]);

    // Get step label
    const getStepLabel = (step: string): string => {
        const labels: Record<string, string> = {
            LISTENING_INITIAL: "Đang lắng nghe...",
            ASKING_PICKUP: "Điểm đón",
            ASKING_DESTINATION: "Điểm đến",
            ASKING_GUEST_COUNT: "Số khách",
            ASKING_NOTES: "Ghi chú",
            CONFIRMING: "Xác nhận",
            COMPLETED: "Hoàn thành",
        };
        return labels[step] || step;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900">
            {/* Header */}
            <header className="flex items-center justify-between p-4 text-white">
                <button
                    onClick={onGoBack}
                    disabled={currentStep === "ASKING_PICKUP" || currentStep === "LISTENING_INITIAL" || currentStep === "COMPLETED"}
                    className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Go back"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="text-center">
                    <h2 className="text-lg font-bold">Tạo chuyến bằng giọng nói</h2>
                    {currentStep === "LISTENING_INITIAL" ? (
                        <p className="text-xs text-emerald-200 animate-pulse">
                            Hãy nói yêu cầu của bạn
                        </p>
                    ) : (
                        <p className="text-xs text-emerald-200">
                            Bước {stepInfo.current}/{stepInfo.total}: {getStepLabel(currentStep)}
                        </p>
                    )}
                </div>

                <button
                    onClick={onCancel}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>
            </header>

            {/* Progress Bar */}
            <div className="px-4">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-400 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-auto">
                {/* AI Prompt */}
                <div
                    ref={promptRef}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md text-center border border-white/20 shadow-xl"
                >
                    <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm font-semibold mb-3">
                        <Volume2 size={16} />
                        <span>AI Hỗ trợ</span>
                    </div>
                    <p className="text-white text-lg leading-relaxed">
                        {currentPrompt}
                    </p>
                </div>

                {/* Collected Data Summary */}
                {(collectedData.pickup || collectedData.destination || collectedData.roomNumber) && (
                    <div className="bg-white/5 rounded-xl p-4 mb-6 w-full max-w-md border border-white/10">
                        <p className="text-emerald-300 text-xs font-semibold mb-2">Đã nhận diện:</p>
                        <div className="space-y-1 text-white text-sm">
                            {collectedData.roomNumber && (
                                <div className="flex justify-between">
                                    <span className="text-emerald-200/70">Phòng:</span>
                                    <span className="font-medium">{collectedData.roomNumber}</span>
                                </div>
                            )}
                            {collectedData.pickup && (
                                <div className="flex justify-between">
                                    <span className="text-emerald-200/70">Đón tại:</span>
                                    <span className="font-medium">{collectedData.pickup}</span>
                                </div>
                            )}
                            {collectedData.destination && (
                                <div className="flex justify-between">
                                    <span className="text-emerald-200/70">Đến:</span>
                                    <span className="font-medium">{collectedData.destination}</span>
                                </div>
                            )}
                            {collectedData.guestCount && collectedData.guestCount > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-emerald-200/70">Số khách:</span>
                                    <span className="font-medium">{collectedData.guestCount}</span>
                                </div>
                            )}
                            {collectedData.notes && (
                                <div className="flex justify-between">
                                    <span className="text-emerald-200/70">Ghi chú:</span>
                                    <span className="font-medium truncate max-w-[60%]">{collectedData.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Voice Input Button */}
                <VoiceInputButton
                    state={voiceState}
                    audioLevel={audioLevel}
                    silenceCountdown={silenceCountdown}
                    silenceRemainingTime={silenceRemainingTime}
                    transcript={transcript}
                    onClick={onToggleListening}
                    disabled={isProcessing || voiceResult.status === "success"}
                    errorMessage={voiceResult.status === "error" ? voiceResult.message : undefined}
                />
            </div>

            {/* Bottom Actions (for CONFIRMING step) */}
            {currentStep === "CONFIRMING" && (
                <div className="p-4 flex gap-3">
                    <button
                        onClick={onGoBack}
                        className="flex-1 py-3 px-4 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
                    >
                        Sửa lại
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Xác nhận
                    </button>
                </div>
            )}

            {/* Auto-close indicator for success */}
            {voiceResult.status === "success" && (
                <div className="p-4 text-center">
                    <p className="text-emerald-300 text-sm animate-pulse">
                        {voiceResult.message}
                    </p>
                </div>
            )}
        </div>
    );
};

export default VoiceInputOverlay;
