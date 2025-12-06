import { Request, Response } from 'express';
import { rideRequestModel } from '../_models/rideRequestModel.js';

export const rideRequestController = {
  async getAll(req: Request, res: Response) {
    try {
      const rides = await rideRequestModel.getAll();
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const ride = await rideRequestModel.getById(id);
      if (!ride) {
        return res.status(404).json({ error: 'Ride request not found' });
      }
      res.json(ride);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByRoomNumber(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const rides = await rideRequestModel.getByRoomNumber(roomNumber);
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getActiveByRoomNumber(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const ride = await rideRequestModel.getActiveByRoomNumber(roomNumber);
      if (!ride) {
        return res.status(404).json({ error: 'No active ride found' });
      }
      res.json(ride);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      const rides = await rideRequestModel.getByStatus(status as any);
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const ride = await rideRequestModel.create(req.body);
      res.status(201).json(ride);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const ride = await rideRequestModel.update(id, req.body);
      if (!ride) {
        return res.status(404).json({ error: 'Ride request not found' });
      }
      res.json(ride);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await rideRequestModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Ride request not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

