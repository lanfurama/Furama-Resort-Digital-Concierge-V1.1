import { Request, Response } from 'express';
import { roomModel } from '../_models/roomModel.js';
import { getUserFriendlyError } from '../_utils/errorUtils.js';

export const roomController = {
  async getAll(req: Request, res: Response) {
    try {
      const rooms = await roomModel.getAll();
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'room') });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const room = await roomModel.getById(id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(room);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'room') });
    }
  },

  async getByNumber(req: Request, res: Response) {
    try {
      const { number } = req.params;
      const room = await roomModel.getByNumber(number);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(room);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'room') });
    }
  },

  async getByTypeId(req: Request, res: Response) {
    try {
      const typeId = parseInt(req.params.typeId);
      const rooms = await roomModel.getByTypeId(typeId);
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'room') });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const room = await roomModel.create(req.body);
      res.status(201).json(room);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'room', 'create') });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const room = await roomModel.update(id, req.body);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(room);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'room', 'update') });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await roomModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'room', 'delete') });
    }
  },

  async bulkCreate(req: Request, res: Response) {
    try {
      const { rooms } = req.body;
      if (!Array.isArray(rooms)) {
        return res.status(400).json({ error: 'rooms must be an array' });
      }
      const createdRooms = await roomModel.bulkCreate(rooms);
      res.status(201).json({ count: createdRooms.length, rooms: createdRooms });
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'room', 'create') });
    }
  },
};

