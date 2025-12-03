import { Request, Response } from 'express';
import { serviceRequestModel } from '../models/serviceRequestModel.js';

export const serviceRequestController = {
  async getAll(req: Request, res: Response) {
    try {
      const services = await serviceRequestModel.getAll();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const service = await serviceRequestModel.getById(id);
      if (!service) {
        return res.status(404).json({ error: 'Service request not found' });
      }
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByRoomNumber(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const services = await serviceRequestModel.getByRoomNumber(roomNumber);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      const services = await serviceRequestModel.getByStatus(status as any);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const services = await serviceRequestModel.getByType(type as any);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const service = await serviceRequestModel.create(req.body);
      res.status(201).json(service);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const service = await serviceRequestModel.update(id, req.body);
      if (!service) {
        return res.status(404).json({ error: 'Service request not found' });
      }
      res.json(service);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await serviceRequestModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Service request not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

