/**
 * Error Utilities - User-friendly Error Messages
 * 
 * This module provides functions to transform technical database and system errors
 * into user-friendly messages suitable for display in the frontend.
 */

// PostgreSQL error codes mapping
// Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_ERROR_CODES: Record<string, string> = {
    '23505': 'This item already exists. Please use a different value.',
    '23502': 'Please fill in all required fields.',
    '23503': 'This action cannot be completed because the item is linked to other data.',
    '23514': 'The provided value does not meet the required format.',
    '22P02': 'Please enter a valid value for this field.',
    '22003': 'The number you entered is too large or too small.',
    '42P01': 'System configuration error. Please contact support.',
    '42703': 'System configuration error. Please contact support.',
    '08006': 'Unable to connect to the server. Please try again later.',
    '08001': 'Unable to connect to the server. Please try again later.',
    '57014': 'The request took too long. Please try again.',
};

// Common error message patterns for PostgreSQL
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string | ((match: RegExpMatchArray) => string) }> = [
    // Duplicate key violations
    {
        pattern: /duplicate key value violates unique constraint "(\w+)_room_number_key"/i,
        message: 'This room number is already registered.',
    },
    {
        pattern: /duplicate key value violates unique constraint "(\w+)_email_key"/i,
        message: 'This email address is already in use.',
    },
    {
        pattern: /duplicate key value violates unique constraint/i,
        message: 'This item already exists. Please use a different value.',
    },

    // Not-null violations
    {
        pattern: /null value in column "(\w+)" .* not-null constraint/i,
        message: (match) => `Please provide a value for ${formatFieldName(match[1])}.`,
    },
    {
        pattern: /violates not-null constraint/i,
        message: 'Please fill in all required fields.',
    },

    // Foreign key violations
    {
        pattern: /insert or update on table "(\w+)" violates foreign key constraint/i,
        message: 'The selected reference does not exist.',
    },
    {
        pattern: /update or delete on table "(\w+)" violates foreign key constraint/i,
        message: 'This item cannot be deleted because it is being used elsewhere.',
    },

    // Check constraint violations
    {
        pattern: /violates check constraint "(\w+)_(\w+)_check"/i,
        message: (match) => `Invalid value for ${formatFieldName(match[2])}.`,
    },

    // Type/format errors
    {
        pattern: /invalid input syntax for type (\w+)/i,
        message: (match) => `Please enter a valid ${match[1].toLowerCase()}.`,
    },

    // Connection errors
    {
        pattern: /connection refused|ECONNREFUSED/i,
        message: 'Unable to connect to the server. Please try again later.',
    },
    {
        pattern: /timeout|ETIMEDOUT/i,
        message: 'The request took too long. Please try again.',
    },
];

// Context-specific error messages
const CONTEXT_MESSAGES: Record<string, Record<string, string>> = {
    user: {
        create: 'Unable to create user. Please check the information and try again.',
        update: 'Unable to update user information. Please try again.',
        delete: 'Unable to delete user. They may have active bookings or requests.',
        notFound: 'User not found. They may have been removed from the system.',
    },
    ride: {
        create: 'Unable to create ride request. Please try again.',
        update: 'Unable to update ride request. Please try again.',
        delete: 'Unable to cancel ride request. Please try again.',
        notFound: 'Ride request not found.',
        duplicate: 'You already have an active ride request. Please wait for it to complete.',
    },
    service: {
        create: 'Unable to create service request. Please try again.',
        update: 'Unable to update service request. Please try again.',
        delete: 'Unable to cancel service request. Please try again.',
        notFound: 'Service request not found.',
    },
    room: {
        create: 'Unable to add room. Please check the room number.',
        update: 'Unable to update room information. Please try again.',
        delete: 'Unable to delete room. It may have active guests.',
        notFound: 'Room not found.',
    },
    notification: {
        create: 'Unable to send notification. Please try again.',
        notFound: 'Notification not found.',
    },
    location: {
        create: 'Unable to add location. Please check the coordinates.',
        update: 'Unable to update location. Please try again.',
        delete: 'Unable to delete location. It may be in use.',
        notFound: 'Location not found.',
    },
    menu: {
        create: 'Unable to add menu item. Please try again.',
        update: 'Unable to update menu item. Please try again.',
        delete: 'Unable to delete menu item. Please try again.',
        notFound: 'Menu item not found.',
    },
    promotion: {
        create: 'Unable to create promotion. Please try again.',
        update: 'Unable to update promotion. Please try again.',
        delete: 'Unable to delete promotion. Please try again.',
        notFound: 'Promotion not found.',
    },
    event: {
        create: 'Unable to create event. Please try again.',
        update: 'Unable to update event. Please try again.',
        delete: 'Unable to delete event. Please try again.',
        notFound: 'Event not found.',
    },
};

/**
 * Convert snake_case or camelCase field name to human-readable format
 */
function formatFieldName(fieldName: string): string {
    return fieldName
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());
}

/**
 * Get user-friendly error message from a database/system error
 * 
 * @param error - The original error object
 * @param context - Optional context (e.g., 'user', 'ride', 'service')
 * @param operation - Optional operation type (e.g., 'create', 'update', 'delete')
 * @returns User-friendly error message
 */
export function getUserFriendlyError(
    error: any,
    context?: string,
    operation?: string
): string {
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code;

    // 1. Check PostgreSQL error code first
    if (errorCode && PG_ERROR_CODES[errorCode]) {
        return PG_ERROR_CODES[errorCode];
    }

    // 2. Check error patterns
    for (const { pattern, message } of ERROR_PATTERNS) {
        const match = errorMessage.match(pattern);
        if (match) {
            return typeof message === 'function' ? message(match) : message;
        }
    }

    // 3. Check context-specific messages
    if (context && operation && CONTEXT_MESSAGES[context]?.[operation]) {
        return CONTEXT_MESSAGES[context][operation];
    }

    // 4. Check if error message contains "Duplicate ride request"
    if (errorMessage.includes('Duplicate ride request') || errorMessage.includes('already has an active ride')) {
        return errorMessage; // This is already user-friendly
    }

    // 5. Default fallback based on operation
    if (operation === 'create') {
        return 'Unable to create this item. Please check your input and try again.';
    } else if (operation === 'update') {
        return 'Unable to update this item. Please try again.';
    } else if (operation === 'delete') {
        return 'Unable to delete this item. Please try again.';
    }

    // 6. Generic fallback
    return 'Something went wrong. Please try again later.';
}

/**
 * Create a standardized error response object
 */
export function createErrorResponse(
    error: any,
    context?: string,
    operation?: string
): { error: string; code?: string } {
    const friendlyMessage = getUserFriendlyError(error, context, operation);

    // Log the original error for debugging (server-side only)
    console.error(`[ErrorUtils] Original error:`, error?.message || error);
    console.error(`[ErrorUtils] Friendly message:`, friendlyMessage);

    return {
        error: friendlyMessage,
        code: error?.code, // Include error code for specific handling if needed
    };
}

/**
 * Express middleware-style error handler
 * Use in controllers: catch (error) { res.status(400).json(createErrorResponse(error, 'user', 'create')); }
 */
export default {
    getUserFriendlyError,
    createErrorResponse,
};
