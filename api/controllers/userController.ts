import { Request, Response } from 'express';
import { userModel } from '../models/userModel.js';

export const userController = {
  async getAll(req: Request, res: Response) {
    try {
      const users = await userModel.getAll();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const user = await userModel.create(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
      res.status(400).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },
};

