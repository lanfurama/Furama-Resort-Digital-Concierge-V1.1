import { Request, Response } from 'express';
import { notificationModel } from '../_models/notificationModel.js';

export const notificationController = {
  async getAll(req: Request, res: Response) {
    try {
      const notifications = await notificationModel.getAll();
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const notification = await notificationModel.getById(id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByRecipientId(req: Request, res: Response) {
    try {
      const { recipientId } = req.params;
      const notifications = await notificationModel.getByRecipientId(recipientId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUnreadByRecipientId(req: Request, res: Response) {
    try {
      const { recipientId } = req.params;
      const notifications = await notificationModel.getUnreadByRecipientId(recipientId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const notification = await notificationModel.create(req.body);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const notification = await notificationModel.update(id, req.body);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async markAsRead(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const notification = await notificationModel.markAsRead(id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async markAllAsRead(req: Request, res: Response) {
    try {
      const { recipientId } = req.params;
      const count = await notificationModel.markAllAsRead(recipientId);
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await notificationModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

