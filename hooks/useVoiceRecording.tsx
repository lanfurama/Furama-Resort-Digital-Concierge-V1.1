import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceRecordingOptions {
    language?: string;
    onTranscriptReady?: (transcript: string) => void;
    silenceTimeout?: number; // milliseconds
    onError?: (error: { type: 'microphone' | 'speech-api' | 'network' | 'unknown', message: string }) => void;
    t?: (key: string) => string; // Translation function for multilingual error messages
}

interface UseVoiceRecordingReturn {
    isListening: boolean;
    transcript: string;
    audioLevel: number; // 0-100 for animation
    silenceCountdown: number | null; // Countdown seconds (5, 4, 3, 2, 1) or null if not counting
    silenceRemainingTime: number | null; // Remaining time in milliseconds (0-5000) for accurate progress bar
    handleToggleListening: () => void;
    stopRecording: () => void;
}

export const useVoiceRecording = (
    options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn => {
    const {
        language = "vi-VN",
        onTranscriptReady,
        silenceTimeout = 5000, // 5 seconds default
        onError,
        t,
    } = options;

    // Helper to get translated error message with fallback
    const getTranslatedError = useCallback((key: string, fallback: string): string => {
        return t ? t(key) : fallback;
    }, [t]);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [audioLevel, setAudioLevel] = useState(0); // For animation (0-100)
    const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null); // Countdown when silence detected
    const [silenceRemainingTime, setSilenceRemainingTime] = useState<number | null>(null); // Remaining time in ms for progress bar

    // Refs for SpeechRecognition and timers
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastSpeechTimeRef = useRef<number>(0);
    const hasSpeechStartedRef = useRef<boolean>(false);
    const currentTranscriptRef = useRef<string>("");
    const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Refs for AudioContext and audio analysis
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Helper function to calculate audio level from audio data
    const calculateAudioLevel = useCallback((analyser: AnalyserNode): number => {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS (Root Mean Square) for more accurate audio level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const normalized = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
            sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Convert RMS (0-1) to audio level (0-100)
        // Apply smoothing and scaling for better visualization
        const level = Math.min(100, Math.max(0, rms * 200)); // Scale RMS to 0-100 range

        return level;
    }, []);

    // Helper function to get user-friendly error message with translation
    const getMicrophoneErrorMessage = useCallback((error: any): string => {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            return getTranslatedError('error_mic_permission_denied', 'Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            return getTranslatedError('error_mic_not_found', 'No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            return getTranslatedError('error_mic_in_use', 'Microphone is already in use by another application. Please close other applications and try again.');
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            return getTranslatedError('error_mic_constraints', 'Microphone constraints could not be satisfied. Please check your microphone settings.');
        } else if (error.name === 'SecurityError') {
            return getTranslatedError('error_mic_security', 'Microphone access blocked due to security restrictions. Please use HTTPS or localhost.');
        } else if (error.name === 'TypeError') {
            return getTranslatedError('error_mic_not_supported', 'getUserMedia is not supported in this browser. Please use a modern browser.');
        } else {
            const baseMessage = getTranslatedError('error_mic_access_failed', 'Failed to access microphone.');
            return `${baseMessage} ${error.message ? `(${error.message})` : ''}`;
        }
    }, [getTranslatedError]);

    // Helper function to start audio level monitoring
    const startAudioLevelMonitoring = useCallback(async () => {
        try {
            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error(getTranslatedError('error_mic_not_supported', 'getUserMedia is not supported in this browser'));
            }

            // Get microphone stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Create AudioContext
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error(getTranslatedError('error_audio_context_not_supported', 'AudioContext is not supported in this browser'));
            }

            audioContextRef.current = new AudioContextClass();

            // Resume AudioContext if suspended (required for autoplay policies)
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            // Create AnalyserNode
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048; // Higher FFT size for better accuracy
            analyserRef.current.smoothingTimeConstant = 0.8; // Smoothing for less jitter

            // Connect microphone to analyser
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            // Start monitoring audio level with requestAnimationFrame for smooth updates
            const monitorAudioLevel = () => {
                // Check if analyser still exists (recording might have stopped)
                if (analyserRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
                    const level = calculateAudioLevel(analyserRef.current);
                    setAudioLevel(level);

                    // SMART SILENCE DETECTION:
                    // If audio level is above threshold (speech detected), reset the silence timer.
                    // This ensures we only stop recording when there is ACTUAL silence,
                    // not just because the Speech API hasn't returned a result recently.
                    if (level > 5) { // Threshold for speech (adjustable)
                        lastSpeechTimeRef.current = Date.now();
                        hasSpeechStartedRef.current = true;

                        // Clear countdown if it was active, as user started speaking again
                        // We use a ref check or state updater to avoid unnecessary re-renders would be ideal,
                        // but React batched updates handle this reasonably well.
                        // To be safe against render loops, we could check the ref approach but state is fine here.
                        setSilenceCountdown((prev) => (prev !== null ? null : prev));
                        setSilenceRemainingTime((prev) => (prev !== null ? null : prev));
                    }

                    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
                } else {
                    // Stop monitoring if analyser is no longer available
                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                        animationFrameRef.current = null;
                    }
                }
            };

            monitorAudioLevel();
        } catch (error: any) {
            console.error("Failed to access microphone for audio level:", error);

            // Notify error callback
            if (onError) {
                onError({
                    type: 'microphone',
                    message: getMicrophoneErrorMessage(error)
                });
            } else {
                // Fallback to alert if no error callback provided
                alert(getMicrophoneErrorMessage(error));
            }

            // Fallback to gradual decrease if microphone access fails
            if (audioLevelIntervalRef.current) {
                clearInterval(audioLevelIntervalRef.current);
            }
            audioLevelIntervalRef.current = setInterval(() => {
                setAudioLevel((prev) => {
                    if (prev > 20) {
                        return Math.max(20, prev - 2);
                    }
                    return prev;
                });
            }, 100);
        }
    }, [calculateAudioLevel, onError, getMicrophoneErrorMessage]);

    // Helper function to stop audio level monitoring
    const stopAudioLevelMonitoring = useCallback(() => {
        // Stop animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Stop audio level interval
        if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current);
            audioLevelIntervalRef.current = null;
        }

        // Stop media stream tracks
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Close AudioContext
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(err =>
                console.warn("Error closing AudioContext:", err)
            );
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        setAudioLevel(0);
    }, []);

    // Helper function to stop recording
    const stopRecording = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
        setIsListening(false);

        // Stop audio level monitoring
        stopAudioLevelMonitoring();

        // Clear all timers
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (silenceCheckIntervalRef.current) {
            clearInterval(silenceCheckIntervalRef.current);
            silenceCheckIntervalRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        // Clear countdown
        setSilenceCountdown(null);
        setSilenceRemainingTime(null);

        // Call callback with final transcript
        const finalTranscript = currentTranscriptRef.current;
        if (finalTranscript.trim() && onTranscriptReady) {
            onTranscriptReady(finalTranscript);
        }
    }, [isListening, onTranscriptReady, stopAudioLevelMonitoring]);

    // Voice recognition logic
    const handleToggleListening = useCallback(() => {
        if (isListening) {
            stopRecording();
        } else {
            // Check if Web Speech API is available
            const SpeechRecognition =
                (window as any).SpeechRecognition ||
                (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                const errorMessage = getTranslatedError('error_speech_api_not_supported', 'Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari (latest version).');
                console.error(errorMessage);

                if (onError) {
                    onError({
                        type: 'speech-api',
                        message: errorMessage
                    });
                } else {
                    alert(errorMessage);
                }
                return;
            }

            // Check if running on HTTPS or localhost (required for Web Speech API)
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                const errorMessage = getTranslatedError('error_speech_https_required', 'Web Speech API requires HTTPS connection. Please use HTTPS or localhost.');
                console.error(errorMessage);

                if (onError) {
                    onError({
                        type: 'speech-api',
                        message: errorMessage
                    });
                } else {
                    alert(errorMessage);
                }
                return;
            }

            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = language;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.continuous = true;

            recognitionRef.current.onstart = async () => {
                setIsListening(true);
                setTranscript("");
                currentTranscriptRef.current = "";
                lastSpeechTimeRef.current = Date.now();
                hasSpeechStartedRef.current = false;
                setAudioLevel(0); // Start with 0, will be updated by real audio level
                setSilenceCountdown(null); // Reset countdown
                setSilenceRemainingTime(null); // Reset remaining time

                // Clear any existing timers
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
                if (silenceCheckIntervalRef.current) {
                    clearInterval(silenceCheckIntervalRef.current);
                    silenceCheckIntervalRef.current = null;
                }
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }

                // Start audio level monitoring with real microphone data
                await startAudioLevelMonitoring();

                // Start silence check interval - check every 100ms for smoother countdown and progress bar
                silenceCheckIntervalRef.current = setInterval(() => {
                    // Check if recognition is still active
                    if (recognitionRef.current) {
                        const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
                        // Use different timeouts:
                        // 1. Initial timeout (waiting for user to speak): 5000ms
                        // 2. Subsequent timeout (silence after speech): silenceTimeout (e.g., 1000ms)
                        const activeSilenceTimeout = hasSpeechStartedRef.current ? silenceTimeout : 5000;

                        const remainingTime = activeSilenceTimeout - timeSinceLastSpeech;

                        // Show countdown when silence is detected (last 5 seconds)
                        if (remainingTime <= 5000 && remainingTime > 0) {
                            const secondsRemaining = Math.ceil(remainingTime / 1000);
                            setSilenceCountdown(secondsRemaining);
                            setSilenceRemainingTime(remainingTime); // Store remaining time for accurate progress bar
                        } else if (remainingTime <= 0) {
                            // Timeout reached, stop recording
                            console.log(
                                `${activeSilenceTimeout / 1000} seconds of silence detected (${hasSpeechStartedRef.current ? 'post-speech' : 'initial'}), stopping recording...`
                            );
                            setSilenceCountdown(null);
                            setSilenceRemainingTime(null);
                            stopRecording();
                        } else {
                            // Still within timeout, no countdown needed
                            setSilenceCountdown(null);
                            setSilenceRemainingTime(null);
                        }
                    }
                }, 100); // Check every 100ms for smoother updates
            };

            recognitionRef.current.onresult = (event: any) => {
                // Build complete transcript from all results
                // This approach avoids duplicates by reconstructing the full transcript each time
                let fullTranscript = "";
                let hasSpeech = false;

                for (let i = 0; i < event.results.length; ++i) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        fullTranscript += result[0].transcript + " ";
                        hasSpeech = true;
                    } else {
                        // Only show the last interim result (most recent)
                        if (i === event.results.length - 1) {
                            fullTranscript += result[0].transcript;
                            hasSpeech = true;
                        }
                    }
                }

                // Update transcript with the complete version (no duplicates)
                const trimmedTranscript = fullTranscript.trim();
                if (trimmedTranscript) {
                    currentTranscriptRef.current = trimmedTranscript;
                    setTranscript(trimmedTranscript);

                    // Reset silence timer whenever we get speech input
                    // Audio level is already being updated by real-time monitoring
                    lastSpeechTimeRef.current = Date.now();

                    // Clear countdown when speech is detected
                    setSilenceCountdown(null);
                    setSilenceRemainingTime(null);
                }
                // Note: Audio level is continuously updated by startAudioLevelMonitoring()
                // No need to manually update it here
            };

            recognitionRef.current.onerror = (event: any) => {
                const error = event.error;
                let errorType: 'microphone' | 'speech-api' | 'network' | 'unknown' = 'unknown';
                let errorMessage = getTranslatedError('error_speech_unknown', 'Speech recognition error occurred.');

                // Map Web Speech API error codes to user-friendly messages with translation
                switch (error) {
                    case 'no-speech':
                        errorMessage = getTranslatedError('error_speech_no_speech', 'No speech detected. Please speak clearly into the microphone.');
                        errorType = 'microphone';
                        break;
                    case 'audio-capture':
                        errorMessage = getTranslatedError('error_speech_audio_capture', 'No microphone found or microphone is not accessible. Please check your microphone settings.');
                        errorType = 'microphone';
                        break;
                    case 'not-allowed':
                        errorMessage = getTranslatedError('error_speech_not_allowed', 'Microphone permission denied. Please allow microphone access in your browser settings.');
                        errorType = 'microphone';
                        break;
                    case 'network':
                        errorMessage = getTranslatedError('error_speech_network', 'Network error occurred. Please check your internet connection and try again.');
                        errorType = 'network';
                        break;
                    case 'aborted':
                        errorMessage = getTranslatedError('error_speech_aborted', 'Speech recognition was aborted.');
                        errorType = 'unknown';
                        break;
                    case 'service-not-allowed':
                        errorMessage = getTranslatedError('error_speech_service_not_allowed', 'Speech recognition service is not allowed. Please check your browser settings.');
                        errorType = 'speech-api';
                        break;
                    case 'bad-grammar':
                        errorMessage = getTranslatedError('error_speech_grammar', 'Speech recognition grammar error.');
                        errorType = 'speech-api';
                        break;
                    case 'language-not-supported':
                        errorMessage = getTranslatedError('error_speech_language_not_supported', `Language "${language}" is not supported. Please try a different language.`);
                        errorType = 'speech-api';
                        break;
                    default:
                        const baseMessage = getTranslatedError('error_speech_unknown', 'Speech recognition error occurred.');
                        errorMessage = `${baseMessage} (${error || 'Unknown error'})`;
                        errorType = 'unknown';
                }

                console.error("Speech recognition error:", error, errorMessage);
                setIsListening(false);
                stopAudioLevelMonitoring();

                // Clear timers
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
                if (silenceCheckIntervalRef.current) {
                    clearInterval(silenceCheckIntervalRef.current);
                    silenceCheckIntervalRef.current = null;
                }
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }

                // Clear countdown
                setSilenceCountdown(null);

                // Notify error callback
                if (onError) {
                    onError({
                        type: errorType,
                        message: errorMessage
                    });
                } else {
                    // Fallback to alert if no error callback provided
                    alert(errorMessage);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                stopAudioLevelMonitoring();
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
                if (silenceCheckIntervalRef.current) {
                    clearInterval(silenceCheckIntervalRef.current);
                    silenceCheckIntervalRef.current = null;
                }
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }
                setSilenceCountdown(null);
            };

            recognitionRef.current.start();
        }
    }, [isListening, language, silenceTimeout, stopRecording, startAudioLevelMonitoring, getTranslatedError]);

    // Cleanup timers and audio resources on unmount
    useEffect(() => {
        return () => {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
            if (silenceCheckIntervalRef.current) {
                clearInterval(silenceCheckIntervalRef.current);
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
            if (recognitionRef.current && isListening) {
                recognitionRef.current.stop();
            }
            // Cleanup audio resources
            stopAudioLevelMonitoring();
        };
    }, [isListening, stopAudioLevelMonitoring]);

    return {
        isListening,
        transcript,
        audioLevel,
        silenceCountdown,
        silenceRemainingTime,
        handleToggleListening,
        stopRecording,
    };
};

