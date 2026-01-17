import { Request, Response } from 'express';
import { chatMessageModel } from '../_models/chatMessageModel.js';
import { getUserFriendlyError } from '../_utils/errorUtils.js';

export const chatMessageController = {
  async getAll(req: Request, res: Response) {
    try {
      const messages = await chatMessageModel.getAll();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const message = await chatMessageModel.getById(id);
      if (!message) {
        return res.status(404).json({ error: 'Chat message not found' });
      }
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  async getByUserId(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const messages = await chatMessageModel.getByUserId(userId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  async getByRoomNumber(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const { service_type } = req.query;

      let messages;
      if (service_type) {
        messages = await chatMessageModel.getByRoomNumberAndService(roomNumber, service_type as string);
      } else {
        messages = await chatMessageModel.getByRoomNumber(roomNumber);
      }
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const message = await chatMessageModel.create(req.body);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error) });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await chatMessageModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Chat message not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  async markAsRead(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const { service_type, message_id, user_role } = req.body;

      if (!service_type || !message_id || !user_role) {
        return res.status(400).json({ error: 'service_type, message_id, and user_role are required' });
      }

      await chatMessageModel.markAsRead(roomNumber, service_type, parseInt(message_id), user_role);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  async getUnreadCount(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const { service_type, user_role } = req.query;

      if (!service_type || !user_role) {
        return res.status(400).json({ error: 'service_type and user_role are required' });
      }

      const count = await chatMessageModel.getUnreadCount(roomNumber, service_type as string, user_role as 'user' | 'staff');
      res.json({ unreadCount: count });
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },
};

