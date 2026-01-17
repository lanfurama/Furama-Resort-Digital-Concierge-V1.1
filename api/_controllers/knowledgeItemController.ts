import { Request, Response } from 'express';
import { knowledgeItemModel } from '../_models/knowledgeItemModel.js';
import { getUserFriendlyError } from '../_utils/errorUtils.js';

export const knowledgeItemController = {
  async getAll(req: Request, res: Response) {
    try {
      const knowledgeItems = await knowledgeItemModel.getAll();
      res.json(knowledgeItems);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const knowledgeItem = await knowledgeItemModel.getById(id);
      if (!knowledgeItem) {
        return res.status(404).json({ error: 'Knowledge item not found' });
      }
      res.json(knowledgeItem);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const knowledgeItem = await knowledgeItemModel.create(req.body);
      res.status(201).json(knowledgeItem);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error) });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const knowledgeItem = await knowledgeItemModel.update(id, req.body);
      if (!knowledgeItem) {
        return res.status(404).json({ error: 'Knowledge item not found' });
      }
      res.json(knowledgeItem);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error) });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await knowledgeItemModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Knowledge item not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },
};

