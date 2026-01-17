import { Request, Response } from 'express';
import { userModel } from '../_models/userModel.js';
import { getUserFriendlyError } from '../_utils/errorUtils.js';

export const userController = {
  async getAll(req: Request, res: Response) {
    try {
      const users = await userModel.getAll();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'user') });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const user = await userModel.getById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'user') });
    }
  },

  async getByRoomNumber(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const user = await userModel.getByRoomNumber(roomNumber);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'user') });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const user = await userModel.create(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'user', 'create') });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      console.log('Updating user:', { id, body: req.body });
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Language value:', req.body.language);

      const user = await userModel.update(id, req.body);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      console.log('User updated successfully:', user);
      console.log('Updated user language:', user.language);
      res.json(user);
    } catch (error: any) {
      console.error('Error updating user:', error);
      console.error('Error stack:', error.stack);
      res.status(400).json({ error: getUserFriendlyError(error, 'user', 'update') });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await userModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'user', 'delete') });
    }
  },

  async markOffline(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const user = await userModel.markOffline(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      console.error('Error marking driver offline:', error);
      res.status(500).json({ error: getUserFriendlyError(error, 'user', 'update') });
    }
  },

  async updateLocation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { lat, lng } = req.body;

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ error: 'lat and lng must be numbers' });
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Invalid latitude or longitude values' });
      }

      const user = await userModel.updateLocation(id, lat, lng);
      if (!user) {
        return res.status(404).json({ error: 'User not found or not a driver' });
      }
      res.json(user);
    } catch (error: any) {
      console.error('Error updating driver location:', error);
      res.status(500).json({ error: getUserFriendlyError(error, 'user', 'update') });
    }
  },

  async getDriversWithLocations(req: Request, res: Response) {
    try {
      const drivers = await userModel.getDriversWithLocations();
      res.json(drivers);
    } catch (error: any) {
      console.error('Error fetching drivers with locations:', error);
      res.status(500).json({ error: getUserFriendlyError(error, 'user') });
    }
  },

  // Generate check-in code for a guest (Admin/Supervisor only)
  async generateCheckInCode(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const id = parseInt(userId);

      // Get the user
      const user = await userModel.getById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Only allow for GUEST role
      if (user.role !== 'GUEST') {
        return res.status(400).json({ error: 'Check-in code can only be generated for guests' });
      }

      // Generate a secure random code (8 characters, alphanumeric)
      const generateCode = (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters like 0, O, I, 1
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let checkInCode = generateCode();

      // Ensure code is unique (very unlikely collision, but check anyway)
      let attempts = 0;
      while (await userModel.getByCheckInCode(checkInCode) && attempts < 10) {
        checkInCode = generateCode();
        attempts++;
      }

      // Update user with the new check-in code
      const updatedUser = await userModel.update(id, { check_in_code: checkInCode });

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update user' });
      }

      res.json({
        success: true,
        checkInCode: checkInCode,
        user: updatedUser
      });
    } catch (error: any) {
      console.error('Error generating check-in code:', error);
      res.status(500).json({ error: getUserFriendlyError(error, 'user', 'update') });
    }
  },

  // Set driver online status to 10 hours from now (for first login)
  async setOnlineFor10Hours(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      console.log('[userController.setOnlineFor10Hours] Received request for driver ID:', id);
      const user = await userModel.setOnlineFor10Hours(id);
      if (!user) {
        console.log('[userController.setOnlineFor10Hours] User not found:', id);
        return res.status(404).json({ error: 'User not found' });
      }
      console.log('[userController.setOnlineFor10Hours] Successfully set driver online for 10 hours:', id, 'updated_at:', user.updated_at);
      res.json(user);
    } catch (error: any) {
      console.error('[userController.setOnlineFor10Hours] Error setting driver online for 10 hours:', error);
      console.error('[userController.setOnlineFor10Hours] Error stack:', error.stack);
      res.status(500).json({ error: getUserFriendlyError(error, 'user', 'update') });
    }
  },
};

