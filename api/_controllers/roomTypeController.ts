import { Request, Response } from 'express';
import { roomTypeModel } from '../_models/roomTypeModel.js';
import { getUserFriendlyError } from '../_utils/errorUtils.js';

export const roomTypeController = {
  async getAll(req: Request, res: Response) {
    try {
      const roomTypes = await roomTypeModel.getAll();
      res.json(roomTypes);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'room') });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const roomType = await roomTypeModel.getById(id);
      if (!roomType) {
        return res.status(404).json({ error: 'Room type not found' });
      }
      res.json(roomType);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'room') });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const roomType = await roomTypeModel.create(req.body);
      res.status(201).json(roomType);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'room', 'create') });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const roomType = await roomTypeModel.update(id, req.body);
      if (!roomType) {
        return res.status(404).json({ error: 'Room type not found' });
      }
      res.json(roomType);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'room', 'update') });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await roomTypeModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Room type not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'room', 'delete') });
    }
  },
};

