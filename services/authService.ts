import { User } from '../types';
import { MOCK_USERS } from '../constants';

// Simulating an API call or CSV lookup
export const authenticateUser = async (lastName: string, roomNumber: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Case insensitive check
      const user = MOCK_USERS.find(
        u => u.lastName.toLowerCase() === lastName.toLowerCase() && u.roomNumber === roomNumber
      );
      resolve(user || null);
    }, 800); // Simulate network delay
  });
};