import React, { useMemo } from "react";
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export type VoiceState = "idle" | "listening" | "processing" | "success" | "error";

interface VoiceInputButtonProps {
    state: VoiceState;
    audioLevel: number; // 0-100
    silenceCountdown: number | null;
    silenceRemainingTime: number | null;
    transcript: string;
    onClick: () => void;
    disabled?: boolean;
    errorMessage?: string;
    className?: string;
}

/**
 * Animated Voice Input Button with state-based visual feedback
 * 
 * States:
 * - idle: Gray mic icon, ready to record
 * - listening: Green pulsing with sound waves based on audioLevel
 * - processing: Blue spinner, waiting for AI response
 * - success: Green checkmark
 * - error: Red warning icon with message
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
    state,
    audioLevel,
    silenceCountdown,
    silenceRemainingTime,
    transcript,
    onClick,
    disabled = false,
    errorMessage,
    className = "",
}) => {
    // Calculate wave heights based on audio level (3 bars)
    const waveHeights = useMemo(() => {
        const baseHeight = 4;
        const maxHeight = 20;
        const level = Math.min(100, Math.max(0, audioLevel));

        // Create 3 wave bars with slight variation
        return [
            baseHeight + (level / 100) * (maxHeight - baseHeight) * 0.7,
            baseHeight + (level / 100) * (maxHeight - baseHeight),
            baseHeight + (level / 100) * (maxHeight - baseHeight) * 0.8,
        ];
    }, [audioLevel]);

    // Progress for countdown ring (0-1)
    const countdownProgress = useMemo(() => {
        if (silenceRemainingTime === null) return 1;
        return Math.max(0, Math.min(1, silenceRemainingTime / 5000));
    }, [silenceRemainingTime]);

    // State-based styling
    const stateStyles = {
        idle: {
            button: "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-600",
            ring: "border-gray-300",
            glow: "",
        },
        listening: {
            button: "bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white",
            ring: "border-emerald-400",
            glow: "shadow-lg shadow-emerald-500/50 animate-pulse",
        },
        processing: {
            button: "bg-blue-500 hover:bg-blue-600 border-blue-400 text-white",
            ring: "border-blue-400",
            glow: "shadow-lg shadow-blue-500/30",
        },
        success: {
            button: "bg-green-500 hover:bg-green-600 border-green-400 text-white",
            ring: "border-green-400",
            glow: "shadow-lg shadow-green-500/30",
        },
        error: {
            button: "bg-red-500 hover:bg-red-600 border-red-400 text-white",
            ring: "border-red-400",
            glow: "shadow-lg shadow-red-500/30",
        },
    };

    const currentStyle = stateStyles[state];

    return (
        <div className={`relative inline-flex flex-col items-center gap-2 ${className}`}>
            {/* Main Button Container with Countdown Ring */}
            <div className="relative">
                {/* Countdown Progress Ring (visible during listening) */}
                {state === "listening" && silenceCountdown !== null && (
                    <svg
                        className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90"
                        viewBox="0 0 44 44"
                    >
                        <circle
                            cx="22"
                            cy="22"
                            r="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-emerald-200"
                        />
                        <circle
                            cx="22"
                            cy="22"
                            r="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${countdownProgress * 125.6} 125.6`}
                            strokeLinecap="round"
                            className="text-emerald-500 transition-all duration-100"
                        />
                    </svg>
                )}

                {/* Pulsing Glow Effect */}
                {state === "listening" && (
                    <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                )}

                {/* Main Button */}
                <button
                    onClick={onClick}
                    disabled={disabled || state === "processing"}
                    className={`
            relative z-10 w-14 h-14 rounded-full border-2 
            flex items-center justify-center
            transition-all duration-300 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed
            ${currentStyle.button} ${currentStyle.glow}
          `}
                    aria-label={
                        state === "idle" ? "Start voice input" :
                            state === "listening" ? "Stop voice input" :
                                state === "processing" ? "Processing voice input" :
                                    state === "success" ? "Voice input successful" :
                                        "Voice input error"
                    }
                >
                    {/* Icon based on state */}
                    {state === "idle" && <Mic size={24} />}

                    {state === "listening" && (
                        <div className="flex items-end gap-0.5 h-6">
                            {waveHeights.map((height, i) => (
                                <div
                                    key={i}
                                    className="w-1.5 bg-white rounded-full transition-all duration-75"
                                    style={{ height: `${height}px` }}
                                />
                            ))}
                        </div>
                    )}

                    {state === "processing" && (
                        <Loader2 size={24} className="animate-spin" />
                    )}

                    {state === "success" && <CheckCircle size={24} />}

                    {state === "error" && <AlertCircle size={24} />}
                </button>

                {/* Countdown Number Badge */}
                {state === "listening" && silenceCountdown !== null && silenceCountdown <= 5 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        {silenceCountdown}
                    </div>
                )}
            </div>

            {/* Status Label */}
            <span className={`
        text-xs font-semibold transition-colors duration-300
        ${state === "idle" ? "text-gray-500" : ""}
        ${state === "listening" ? "text-emerald-600" : ""}
        ${state === "processing" ? "text-blue-600" : ""}
        ${state === "success" ? "text-green-600" : ""}
        ${state === "error" ? "text-red-600" : ""}
      `}>
                {state === "idle" && "Nhấn để nói"}
                {state === "listening" && (silenceCountdown !== null ? `Đang nghe... ${silenceCountdown}s` : "Đang nghe...")}
                {state === "processing" && "Đang xử lý..."}
                {state === "success" && "Thành công!"}
                {state === "error" && "Lỗi"}
            </span>

            {/* Real-time Transcript Display (during listening) */}
            {state === "listening" && transcript && (
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-64 max-w-[80vw]">
                    <div className="bg-white/95 backdrop-blur-sm border border-emerald-200 rounded-lg p-3 shadow-lg">
                        <div className="text-xs text-emerald-600 font-semibold mb-1 flex items-center gap-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Đang ghi nhận
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {transcript}
                        </p>
                    </div>
                    {/* Arrow pointing up */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-emerald-200 rotate-45" />
                </div>
            )}

            {/* Error Message */}
            {state === "error" && errorMessage && (
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-64 max-w-[80vw]">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
                        <p className="text-xs text-red-700">{errorMessage}</p>
                        <button
                            onClick={onClick}
                            className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 underline"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceInputButton;
