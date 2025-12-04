import { Request, Response } from 'express';
import { menuItemModel } from '../models/menuItemModel.js';

export const menuItemController = {
  async getAll(req: Request, res: Response) {
    try {
      const category = req.query.category as string | undefined;
      const language = req.query.language as string | undefined;
      const menuItems = await menuItemModel.getAll(category, language);
      res.json(menuItems);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const menuItem = await menuItemModel.getById(id);
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      res.json(menuItem);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const menuItem = await menuItemModel.create(req.body);
      res.status(201).json(menuItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const menuItem = await menuItemModel.update(id, req.body);
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      res.json(menuItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await menuItemModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

