import { Location } from "../types";

/**
 * Conversation State Machine for Voice Ride Creation
 * Manages multi-turn conversational flow with validation and state transitions
 */

export type ConversationStep =
    | "IDLE"
    | "LISTENING_INITIAL"
    | "ASKING_PICKUP"
    | "ASKING_DESTINATION"
    | "ASKING_GUEST_COUNT"
    | "ASKING_NOTES"
    | "CONFIRMING"
    | "COMPLETED";

export interface ParsedVoiceData {
    roomNumber?: string;
    guestName?: string;
    pickup?: string;
    destination?: string;
    guestCount?: number;
    notes?: string;
}

export interface ConversationState {
    step: ConversationStep;
    data: Partial<ParsedVoiceData>;
    suggestions: string[];
    lastTranscript: string;
    retryCount: number;
    history: Array<{
        step: ConversationStep;
        data: Partial<ParsedVoiceData>;
        timestamp: number;
    }>;
}

export interface StepValidationResult {
    isValid: boolean;
    errorMessage?: string;
    suggestions?: string[];
}

const INITIAL_STATE: ConversationState = {
    step: "IDLE",
    data: {},
    suggestions: [],
    lastTranscript: "",
    retryCount: 0,
    history: [],
};

const MAX_RETRY_COUNT = 3;

/**
 * Initialize a new conversation
 */
export const initConversation = (): ConversationState => {
    return {
        ...INITIAL_STATE,
        step: "LISTENING_INITIAL",
        history: [
            {
                step: "IDLE",
                data: {},
                timestamp: Date.now(),
            },
        ],
    };
};

/**
 * Get AI prompt for current conversation step
 */
export const getPromptForStep = (
    step: ConversationStep,
    data: Partial<ParsedVoiceData>,
    retryCount: number
): string => {
    // First attempt vs retry prompts
    const isRetry = retryCount > 0;

    switch (step) {
        case "LISTENING_INITIAL":
            return "Xin chào! Bạn muốn đặt xe đi đâu? (Ví dụ: 5 khách từ Lobby đến Hồ Bơi)";

        case "ASKING_PICKUP":
            if (isRetry) {
                return "Xin lỗi, tôi không nghe rõ. Bạn có thể nói lại điểm đón khách không? Ví dụ: ACC, Lobby, hoặc số phòng như D1, B11.";
            }
            // If we fell back to this step, acknowledge what we might have missed
            return "Tôi chưa rõ điểm đón. Khách đang ở đâu ạ?";

        case "ASKING_DESTINATION":
            if (isRetry) {
                return `Xin lỗi, tôi không nghe rõ điểm đến. Bạn có thể nói lại không? Ví dụ: ICP, Lagoon Pool, Beach Access.`;
            }
            return `Đã ghi nhận điểm đón: ${data.pickup}. Điểm đến là đâu ạ?`;

        case "ASKING_GUEST_COUNT":
            if (isRetry) {
                return "Xin lỗi, tôi không nghe rõ số khách. Bạn có thể nói lại số lượng khách không? Ví dụ: 1 khách, 5 người, hoặc năm khách.";
            }
            return `Rất tốt! Từ ${data.pickup} đến ${data.destination}. Có bao nhiêu khách ạ?`;

        case "ASKING_NOTES":
            if (isRetry) {
                return 'Bạn có ghi chú gì thêm không? Ví dụ: "có hành lý", "có trẻ em", hoặc nói "không" nếu không có.';
            }
            return `Đã ghi nhận ${data.guestCount || 1} khách. Có ghi chú gì thêm không? Ví dụ: hành lý, trẻ em, cần gấp... Hoặc nói "không" nếu không có.`;

        case "CONFIRMING":
            const summary = `Xác nhận thông tin: ${data.guestCount || 1} khách đi từ ${data.pickup} đến ${data.destination}${data.notes ? `, ${data.notes}` : ""}. Đúng chưa ạ?`;
            return summary;

        case "COMPLETED":
            return "Đã tạo chuyến xe thành công! Cảm ơn bạn.";

        default:
            return "Xin chào! Tôi là trợ lý đặt xe Furama. Bạn cần gì ạ?";
    }
};

/**
 * Validate step data before transitioning
 */
export const validateStep = (
    step: ConversationStep,
    data: Partial<ParsedVoiceData>,
    locations: Location[]
): StepValidationResult => {
    switch (step) {
        case "LISTENING_INITIAL":
            // Always valid, we parse whatever we get
            return { isValid: true };

        case "ASKING_PICKUP":
            if (!data.pickup || data.pickup.trim().length === 0) {
                return {
                    isValid: false,
                    errorMessage: "Chưa có thông tin điểm đón",
                    suggestions: locations.slice(0, 5).map((l) => l.name),
                };
            }
            return { isValid: true };

        case "ASKING_DESTINATION":
            if (!data.destination || data.destination.trim().length === 0) {
                return {
                    isValid: false,
                    errorMessage: "Chưa có thông tin điểm đến",
                    suggestions: locations
                        .filter((l) => l.name !== data.pickup)
                        .slice(0, 5)
                        .map((l) => l.name),
                };
            }
            if (data.pickup === data.destination) {
                return {
                    isValid: false,
                    errorMessage: "Điểm đón và điểm đến không thể giống nhau",
                    suggestions: locations
                        .filter((l) => l.name !== data.pickup)
                        .slice(0, 5)
                        .map((l) => l.name),
                };
            }
            return { isValid: true };

        case "ASKING_GUEST_COUNT":
            if (!data.guestCount || data.guestCount < 1 || data.guestCount > 7) {
                return {
                    isValid: false,
                    errorMessage: "Số khách phải từ 1 đến 7",
                };
            }
            return { isValid: true };

        case "ASKING_NOTES":
            // Notes are optional, always valid
            return { isValid: true };

        case "CONFIRMING":
            // Final validation: must have pickup, destination, and guest count
            if (!data.pickup || !data.destination) {
                return {
                    isValid: false,
                    errorMessage: "Thiếu thông tin điểm đón hoặc điểm đến",
                };
            }
            if (!data.guestCount || data.guestCount < 1) {
                return {
                    isValid: false,
                    errorMessage: "Thiếu thông tin số khách",
                };
            }
            return { isValid: true };

        default:
            return { isValid: true };
    }
};

/**
 * Get next step in conversation flow
 */
export const getNextStep = (
    currentStep: ConversationStep
): ConversationStep => {
    const stepOrder: ConversationStep[] = [
        "IDLE",
        "LISTENING_INITIAL",
        "ASKING_PICKUP",
        "ASKING_DESTINATION",
        "ASKING_GUEST_COUNT",
        "ASKING_NOTES",
        "CONFIRMING",
        "COMPLETED",
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex === -1 || currentIndex >= stepOrder.length - 1) {
        return "COMPLETED";
    }

    return stepOrder[currentIndex + 1];
};

/**
 * Get previous step (for "Go Back" functionality)
 */
export const getPreviousStep = (
    currentStep: ConversationStep
): ConversationStep => {
    const stepOrder: ConversationStep[] = [
        "IDLE",
        "LISTENING_INITIAL",
        "ASKING_PICKUP",
        "ASKING_DESTINATION",
        "ASKING_GUEST_COUNT",
        "ASKING_NOTES",
        "CONFIRMING",
        "COMPLETED",
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex <= 0) {
        return "IDLE";
    }

    return stepOrder[currentIndex - 1];
};

/**
 * Transition to next step with validation
 */
export const transitionToNextStep = (
    state: ConversationState,
    newData: Partial<ParsedVoiceData>,
    locations: Location[]
): ConversationState => {
    // Merge new data with existing
    const mergedData = { ...state.data, ...newData };

    // Validate current step before transitioning
    const validation = validateStep(state.step, mergedData, locations);

    if (!validation.isValid) {
        // Stay on current step, increment retry count
        return {
            ...state,
            data: mergedData,
            retryCount: state.retryCount + 1,
            suggestions: validation.suggestions || [],
        };
    }

    // Valid: move to next step
    const nextStep = getNextStep(state.step);

    return {
        ...state,
        step: nextStep,
        data: mergedData,
        retryCount: 0, // Reset retry count on successful transition
        suggestions: [],
        history: [
            ...state.history,
            {
                step: state.step,
                data: mergedData,
                timestamp: Date.now(),
            },
        ],
    };
};

/**
 * Go back to previous step
 */
export const goBackToPreviousStep = (
    state: ConversationState
): ConversationState => {
    const previousStep = getPreviousStep(state.step);

    // Find the last saved state for this step
    const lastStateForPreviousStep = [...state.history]
        .reverse()
        .find((h) => h.step === previousStep);

    return {
        ...state,
        step: previousStep,
        data: lastStateForPreviousStep?.data || state.data,
        retryCount: 0,
        suggestions: [],
    };
};

/**
 * Reset conversation to initial state
 */
export const resetConversation = (): ConversationState => {
    return INITIAL_STATE;
};

/**
 * Check if user wants to cancel
 */
export const isCancelIntent = (transcript: string): boolean => {
    const cancelKeywords = [
        "hủy",
        "hủy bỏ",
        "dừng",
        "thôi",
        "cancel",
        "stop",
        "quit",
        "thoát",
        "không cần",
        "bỏ qua",
    ];

    const normalizedTranscript = transcript.toLowerCase().trim();
    return cancelKeywords.some((keyword) =>
        normalizedTranscript.includes(keyword)
    );
};

/**
 * Check if retry limit exceeded
 */
export const isRetryLimitExceeded = (state: ConversationState): boolean => {
    return state.retryCount >= MAX_RETRY_COUNT;
};

/**
 * Get progress percentage (for UI)
 */
export const getProgressPercentage = (step: ConversationStep): number => {
    const stepProgress: Record<ConversationStep, number> = {
        IDLE: 0,
        LISTENING_INITIAL: 10,
        ASKING_PICKUP: 20,
        ASKING_DESTINATION: 40,
        ASKING_GUEST_COUNT: 60,
        ASKING_NOTES: 80,
        CONFIRMING: 90,
        COMPLETED: 100,
    };

    return stepProgress[step] || 0;
};

/**
 * Get step number and total (e.g., "2 / 5")
 */
export const getStepInfo = (
    step: ConversationStep
): { current: number; total: number } => {
    const stepMap: Record<ConversationStep, number> = {
        IDLE: 0,
        LISTENING_INITIAL: 1,
        ASKING_PICKUP: 2,
        ASKING_DESTINATION: 3,
        ASKING_GUEST_COUNT: 4,
        ASKING_NOTES: 5,
        CONFIRMING: 6,
        COMPLETED: 6,
    };

    return {
        current: stepMap[step] || 0,
        total: 6,
    };
};
