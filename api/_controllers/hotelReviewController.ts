import { Request, Response } from 'express';
import { hotelReviewModel } from '../_models/hotelReviewModel.js';

export const hotelReviewController = {
  async getAll(req: Request, res: Response) {
    try {
      const reviews = await hotelReviewModel.getAll();
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByRoomNumber(req: Request, res: Response) {
    try {
      const roomNumber = req.params.roomNumber;
      const review = await hotelReviewModel.getByRoomNumber(roomNumber);
      if (!review) {
        return res.status(404).json({ error: 'Hotel review not found' });
      }
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const review = await hotelReviewModel.create(req.body);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const review = await hotelReviewModel.update(id, req.body);
      if (!review) {
        return res.status(404).json({ error: 'Hotel review not found' });
      }
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await hotelReviewModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Hotel review not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};








