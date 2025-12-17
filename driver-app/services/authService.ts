import { User } from '../types';
import { apiClient } from './apiClient';

// Guest Login - Calls API
export const authenticateUser = async (lastName: string, roomNumber: string): Promise<User | null> => {
  try {
    const response = await apiClient.post<{ success: boolean; user: User }>('/auth/guest', {
      lastName,
      roomNumber
    });
    
    if (response.success && response.user) {
      return response.user;
    }
    return null;
  } catch (error) {
    console.error('Guest authentication failed:', error);
    return null;
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
    console.error('Staff authentication failed:', error);
    return null;
  }
};