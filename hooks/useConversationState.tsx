import { useState, useCallback, useRef } from "react";
import { Location } from "../types";
import {
    ConversationState,
    ConversationStep,
    ParsedVoiceData,
    initConversation,
    getPromptForStep,
    validateStep,
    transitionToNextStep,
    goBackToPreviousStep,
    resetConversation,
    isCancelIntent,
    isRetryLimitExceeded,
    getProgressPercentage,
    getStepInfo,
} from "../services/conversationStateService";
import { parseStepResponse } from "../services/geminiService";
import { apiClient } from "../services/apiClient";

interface UseConversationStateOptions {
    locations: Location[];
    onComplete: (data: ParsedVoiceData) => void;
    onCancel?: () => void;
    onError?: (message: string) => void;
}

interface UseConversationStateReturn {
    state: ConversationState;
    currentPrompt: string;
    progressPercentage: number;
    stepInfo: { current: number; total: number };
    isProcessing: boolean;
    processUserResponse: (transcript: string) => Promise<void>;
    goBack: () => void;
    reset: () => void;
    cancel: () => void;
    retry: () => void;
    confirm: () => void;
}

/**
 * Hook for managing conversational voice ride creation
 */
export const useConversationState = (
    options: UseConversationStateOptions
): UseConversationStateReturn => {
    const { locations, onComplete, onCancel, onError } = options;

    const [state, setState] = useState<ConversationState>(() => initConversation());
    const [isProcessing, setIsProcessing] = useState(false);

    // Ref to prevent duplicate processing
    const processingRef = useRef(false);

    /**
     * Get current AI prompt for the step
     */
    const currentPrompt = getPromptForStep(state.step, state.data, state.retryCount);

    /**
     * Get progress info for UI
     */
    const progressPercentage = getProgressPercentage(state.step);
    const stepInfo = getStepInfo(state.step);

    /**
     * Process user's voice response for current step
     */
    const processUserResponse = useCallback(
        async (transcript: string) => {
            if (processingRef.current) {
                console.warn("[ConversationState] Already processing, skipping duplicate");
                return;
            }

            processingRef.current = true;
            setIsProcessing(true);

            try {
                // Check for cancel intent
                if (isCancelIntent(transcript)) {
                    console.log("[ConversationState] Cancel intent detected");
                    setState(resetConversation());
                    if (onCancel) onCancel();
                    return;
                }

                // Parse response based on current step
                let newData: Partial<ParsedVoiceData> = {};

                switch (state.step) {
                    case "ASKING_PICKUP":
                    case "ASKING_DESTINATION": {
                        const step = state.step === "ASKING_PICKUP" ? "pickup" : "destination";

                        // First try AI parsing
                        const aiResult = await parseStepResponse(transcript, step, locations, {
                            pickup: state.data.pickup,
                            destination: state.data.destination,
                        });

                        if (aiResult && aiResult.locationName) {
                            console.log(`[ConversationState] AI parsed locationName: "${aiResult.locationName}"`);
                            console.log(`[ConversationState] Available locations:`, locations.map(l => ({ name: l.name, id: l.id })));

                            // Then use smart matching API to validate and get best match
                            try {
                                const matchResponse = await apiClient.post("/v1/locations/match/smart-match", {
                                    userInput: aiResult.locationName,
                                    context: {
                                        currentStep: step,
                                        previousPickup: state.data.pickup,
                                    },
                                });

                                console.log(`[ConversationState] API match response:`, matchResponse.data);

                                if (matchResponse.data.topSuggestion) {
                                    const matched = matchResponse.data.topSuggestion;
                                    if (step === "pickup") {
                                        newData.pickup = matched.name;
                                    } else {
                                        newData.destination = matched.name;
                                    }

                                    // Store suggestions for UI
                                    setState((prev) => ({
                                        ...prev,
                                        suggestions: matchResponse.data.alternatives.map((l: Location) => l.name),
                                    }));
                                } else {
                                    // No match found
                                    if (onError) {
                                        onError(`Không tìm thấy địa điểm "${aiResult.locationName}". Vui lòng thử lại.`);
                                    }
                                    // Increment retry count but don't transition
                                    setState((prev) => ({
                                        ...prev,
                                        retryCount: prev.retryCount + 1,
                                        lastTranscript: transcript,
                                    }));
                                    return;
                                }
                            } catch (apiError: any) {
                                console.error(`[ConversationState] API call failed:`, apiError);
                                if (onError) {
                                    onError(`Lỗi khi tra cứu địa điểm. Vui lòng thử lại.`);
                                }
                                setState((prev) => ({
                                    ...prev,
                                    retryCount: prev.retryCount + 1,
                                    lastTranscript: transcript,
                                }));
                                return;
                            }
                        } else {
                            // AI parsing failed
                            if (onError) {
                                onError("Không nghe rõ. Vui lòng nói lại địa điểm.");
                            }
                            setState((prev) => ({
                                ...prev,
                                retryCount: prev.retryCount + 1,
                                lastTranscript: transcript,
                            }));
                            return;
                        }
                        break;
                    }

                    case "ASKING_GUEST_COUNT": {
                        const aiResult = await parseStepResponse(transcript, "guestCount", locations);
                        if (aiResult && aiResult.count && aiResult.count >= 1 && aiResult.count <= 7) {
                            newData.guestCount = aiResult.count;
                        } else {
                            if (onError) {
                                onError("Số khách phải từ 1 đến 7. Vui lòng nói lại.");
                            }
                            setState((prev) => ({
                                ...prev,
                                retryCount: prev.retryCount + 1,
                                lastTranscript: transcript,
                            }));
                            return;
                        }
                        break;
                    }

                    case "ASKING_NOTES": {
                        const aiResult = await parseStepResponse(transcript, "notes", locations);
                        if (aiResult) {
                            if (aiResult.hasNotes && aiResult.notes) {
                                newData.notes = aiResult.notes;
                            } else {
                                newData.notes = ""; // No notes
                            }
                        } else {
                            newData.notes = transcript; // Fallback: use raw transcript
                        }
                        break;
                    }

                    case "CONFIRMING":
                        // User is confirming, move to complete
                        if (transcript.toLowerCase().includes("đúng") || transcript.toLowerCase().includes("yes") || transcript.toLowerCase().includes("ok")) {
                            setState((prev) => ({
                                ...prev,
                                step: "COMPLETED",
                            }));
                            if (onComplete) {
                                onComplete(state.data as ParsedVoiceData);
                            }
                            return;
                        } else {
                            // User wants to edit, go back
                            goBack();
                            return;
                        }

                    default:
                        break;
                }

                // Update state with new data and transition
                setState((prev) => {
                    const newState = transitionToNextStep(prev, newData, locations);

                    // If we reached CONFIRMING step automatically, don't wait for user input
                    if (newState.step === "CONFIRMING") {
                        // Auto-confirm after 3 seconds (can be cancelled)
                        setTimeout(() => {
                            setState((s) => {
                                if (s.step === "CONFIRMING") {
                                    if (onComplete) {
                                        onComplete(s.data as ParsedVoiceData);
                                    }
                                    return { ...s, step: "COMPLETED" };
                                }
                                return s;
                            });
                        }, 3000);
                    }

                    // Check if step transition failed due to validation
                    if (newState.step === prev.step && newState.retryCount > prev.retryCount) {
                        // Validation failed, show error
                        const validation = validateStep(newState.step, newState.data, locations);
                        if (!validation.isValid && onError) {
                            onError(validation.errorMessage || "Thông tin không hợp lệ");
                        }

                        // Check if retry limit exceeded
                        if (isRetryLimitExceeded(newState)) {
                            if (onError) {
                                onError(
                                    "Đã thử quá nhiều lần. Vui lòng nhập thủ công hoặc bắt đầu lại."
                                );
                            }
                        }
                    }

                    return { ...newState, lastTranscript: transcript };
                });
            } catch (error: any) {
                console.error("[ConversationState] Process error:", error);
                if (onError) {
                    onError("Có lỗi xảy ra khi xử lý. Vui lòng thử lại.");
                }
            } finally {
                processingRef.current = false;
                setIsProcessing(false);
            }
        },
        [state, locations, onComplete, onCancel, onError]
    );

    /**
     * Go back to previous step
     */
    const goBack = useCallback(() => {
        setState((prev) => goBackToPreviousStep(prev));
    }, []);

    /**
     * Reset conversation
     */
    const reset = useCallback(() => {
        setState(resetConversation());
    }, []);

    /**
     * Cancel conversation
     */
    const cancel = useCallback(() => {
        setState(resetConversation());
        if (onCancel) onCancel();
    }, [onCancel]);

    /**
     * Retry current step
     */
    const retry = useCallback(() => {
        setState((prev) => ({
            ...prev,
            retryCount: 0,
            suggestions: [],
        }));
    }, []);

    /**
     * Manual confirm (for CONFIRMING step)
     */
    const confirm = useCallback(() => {
        if (state.step === "CONFIRMING") {
            setState((prev) => ({ ...prev, step: "COMPLETED" }));
            if (onComplete) {
                onComplete(state.data as ParsedVoiceData);
            }
        }
    }, [state, onComplete]);

    return {
        state,
        currentPrompt,
        progressPercentage,
        stepInfo,
        isProcessing,
        processUserResponse,
        goBack,
        reset,
        cancel,
        retry,
        confirm,
    };
};
