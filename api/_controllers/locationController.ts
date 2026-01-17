import { Request, Response } from 'express';
import { locationModel } from '../_models/locationModel.js';
import { getUserFriendlyError } from '../_utils/errorUtils.js';

export const locationController = {
  async getAll(req: Request, res: Response) {
    try {
      const locations = await locationModel.getAll();
      res.json(locations);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'location') });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const location = await locationModel.getById(id);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'location') });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const location = await locationModel.create(req.body);
      res.status(201).json(location);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'location', 'create') });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const location = await locationModel.update(id, req.body);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }
      res.json(location);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'location', 'update') });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await locationModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Location not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'location', 'delete') });
    }
  },
};

