import { Request, Response } from 'express';
import { resortEventModel } from '../_models/resortEventModel.js';

export const resortEventController = {
  async getAll(req: Request, res: Response) {
    try {
      const language = req.query.language as string | undefined;
      const events = await resortEventModel.getAll(language);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const event = await resortEventModel.getById(id);
      if (!event) {
        return res.status(404).json({ error: 'Resort event not found' });
      }
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const event = await resortEventModel.create(req.body);
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const event = await resortEventModel.update(id, req.body);
      if (!event) {
        return res.status(404).json({ error: 'Resort event not found' });
      }
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await resortEventModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Resort event not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

