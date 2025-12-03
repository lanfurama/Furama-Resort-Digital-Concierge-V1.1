import { Request, Response } from 'express';
import { promotionModel } from '../models/promotionModel.js';

export const promotionController = {
  async getAll(req: Request, res: Response) {
    try {
      const promotions = await promotionModel.getAll();
      res.json(promotions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const promotion = await promotionModel.getById(id);
      if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
      }
      res.json(promotion);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const promotion = await promotionModel.create(req.body);
      res.status(201).json(promotion);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const promotion = await promotionModel.update(id, req.body);
      if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
      }
      res.json(promotion);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await promotionModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Promotion not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

