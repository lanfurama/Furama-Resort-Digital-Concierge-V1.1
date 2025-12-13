import { Request, Response } from 'express';
import { userModel } from '../_models/userModel.js';

export const authController = {
  // Guest Login: Room Number + Last Name
  async loginGuest(req: Request, res: Response) {
    try {
      const { lastName, roomNumber } = req.body;
      
      if (!lastName || !roomNumber) {
        return res.status(400).json({ 
          success: false,
          error: 'Last name and room number are required' 
        });
      }

      const user = await userModel.getByRoomNumber(roomNumber);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'Room not found' 
        });
      }

      // Check if user is a guest and last name matches (case insensitive)
      if (user.role !== 'GUEST') {
        return res.status(403).json({ 
          success: false,
          message: 'Invalid login method for this account' 
        });
      }

      if (user.last_name.toLowerCase() !== lastName.toLowerCase()) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid last name' 
        });
      }

      // Map database user to frontend User format
      const frontendUser = {
        id: user.id.toString(),
        lastName: user.last_name,
        roomNumber: user.room_number,
        villaType: user.villa_type,
        role: user.role as any,
        language: user.language || 'English', // Include language from database
      };

      res.json({ 
        success: true,
        user: frontendUser 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  },

  // Staff/Admin/Driver Login: Username (roomNumber) + Password
  async loginStaff(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false,
          error: 'Username and password are required' 
        });
      }

      const user = await userModel.getByRoomNumber(username);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      // Check if user is staff/admin/driver/supervisor/reception
      if (user.role === 'GUEST') {
        return res.status(403).json({ 
          success: false,
          message: 'Invalid login method for guest account' 
        });
      }

      // Verify password
      if (!user.password) {
        return res.status(401).json({ 
          success: false,
          message: 'Password not set for this account. Please contact administrator.' 
        });
      }

      if (user.password !== password) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid password' 
        });
      }
      
      // Map database user to frontend User format
      const frontendUser = {
        id: user.id.toString(),
        lastName: user.last_name,
        roomNumber: user.room_number,
        villaType: user.villa_type,
        role: user.role as any,
        department: 'All' as any, // Default, can be updated later
        language: user.language || 'English', // Include language from database
      };

      res.json({ 
        success: true,
        user: frontendUser 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  },
};

