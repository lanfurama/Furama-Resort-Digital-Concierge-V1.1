import { User } from '../types';
import { apiClient } from './apiClient';
import { logger } from '../utils/logger';

// Guest Login by Check-in Code - Calls API (new secure method)
export const authenticateUserByCode = async (checkInCode: string): Promise<User | null> => {
  try {
    const response = await apiClient.post<{ success: boolean; user?: User; message?: string }>('/auth/guest/code', {
      checkInCode
    });
    
    if (response.success && response.user) {
      return response.user;
    }
    
    // If not successful, throw error with message from backend
    if (response.message) {
      throw new Error(response.message);
    }
    
    return null;
  } catch (error: any) {
    logger.error('Guest authentication by code failed', { error });
    // Re-throw error so frontend can display the message
    if (error.message) {
      throw error;
    }
    throw new Error('Login failed. Please try again.');
  }
};

// Guest Login - Calls API (legacy method, kept for backward compatibility)
export const authenticateUser = async (lastName: string, roomNumber: string): Promise<User | null> => {
  try {
    const response = await apiClient.post<{ success: boolean; user?: User; message?: string }>('/auth/guest', {
      lastName,
      roomNumber
    });
    
    if (response.success && response.user) {
      return response.user;
    }
    
    // If not successful, throw error with message from backend
    if (response.message) {
      throw new Error(response.message);
    }
    
    return null;
  } catch (error: any) {
    logger.error('Guest authentication failed', { error });
    // Re-throw error so frontend can display the message
    if (error.message) {
      throw error;
    }
    throw new Error('Login failed. Please try again.');
  }
};

// Staff/Admin/Driver/Supervisor Login - Calls API
export const authenticateStaff = async (username: string, password: string): Promise<User | null> => {
  try {
    const response = await apiClient.post<{ success: boolean; user: User }>('/auth/staff', {
      username,
      password
    });
    
    if (response.success && response.user) {
      return response.user;
    }
    return null;
  } catch (error) {
    logger.error('Staff authentication failed', { error });
    return null;
  }
};