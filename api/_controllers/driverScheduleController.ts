import { Request, Response } from 'express';
import { driverScheduleModel } from '../_models/driverScheduleModel.js';
import { getUserFriendlyError } from '../_utils/errorUtils.js';
import logger from '../_utils/logger.js';

export const driverScheduleController = {
  // Get all schedules for a driver
  async getByDriverId(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId);
      if (isNaN(driverId)) {
        return res.status(400).json({ error: 'Invalid driver ID' });
      }

      const schedules = await driverScheduleModel.getByDriverId(driverId);
      res.json(schedules);
    } catch (error: any) {
      logger.error({ err: error, driverId }, 'Error fetching driver schedules');
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  // Get schedule for a specific date
  async getByDate(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId);
      const { date } = req.query;

      if (isNaN(driverId)) {
        return res.status(400).json({ error: 'Invalid driver ID' });
      }

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required' });
      }

      const schedule = await driverScheduleModel.getByDriverIdAndDate(driverId, date);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      res.json(schedule);
    } catch (error: any) {
      logger.error({ err: error, driverId, date }, 'Error fetching driver schedule');
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  // Get schedules for a date range
  async getByDateRange(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId);
      const { startDate, endDate } = req.query;

      if (isNaN(driverId)) {
        return res.status(400).json({ error: 'Invalid driver ID' });
      }

      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ error: 'startDate and endDate parameters are required' });
      }

      const schedules = await driverScheduleModel.getByDriverIdAndDateRange(
        driverId,
        startDate,
        endDate
      );
      res.json(schedules);
    } catch (error: any) {
      logger.error({ err: error, driverId }, 'Error fetching driver schedules');
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  // Get all schedules for a date range (all drivers)
  async getAllByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ error: 'startDate and endDate parameters are required' });
      }

      const schedules = await driverScheduleModel.getByDateRange(startDate, endDate);
      res.json(schedules);
    } catch (error: any) {
      logger.error({ err: error, startDate, endDate }, 'Error fetching all driver schedules');
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  // Check if driver is available
  async checkAvailability(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId);
      const { date, time } = req.query;

      if (isNaN(driverId)) {
        return res.status(400).json({ error: 'Invalid driver ID' });
      }

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required' });
      }

      const isAvailable = await driverScheduleModel.isDriverAvailable(
        driverId,
        date,
        time as string | undefined
      );
      res.json({ isAvailable });
    } catch (error: any) {
      logger.error({ err: error, driverId, date, time }, 'Error checking driver availability');
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  // Create or update a schedule
  async upsert(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId);
      const { date, shift_start, shift_end, is_day_off, notes } = req.body;

      if (isNaN(driverId)) {
        return res.status(400).json({ error: 'Invalid driver ID' });
      }

      if (!date) {
        return res.status(400).json({ error: 'Date is required' });
      }

      const schedule = await driverScheduleModel.upsert({
        driver_id: driverId,
        date,
        shift_start: shift_start || null,
        shift_end: shift_end || null,
        is_day_off: is_day_off || false,
        notes: notes || null,
      });

      res.json(schedule);
    } catch (error: any) {
      logger.error({ err: error, driverId, date }, 'Error upserting driver schedule');
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },

  // Delete a schedule
  async delete(req: Request, res: Response) {
    try {
      const driverId = parseInt(req.params.driverId);
      const { date } = req.query;

      if (isNaN(driverId)) {
        return res.status(400).json({ error: 'Invalid driver ID' });
      }

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required' });
      }

      const deleted = await driverScheduleModel.delete(driverId, date);
      if (!deleted) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      res.json({ message: 'Schedule deleted successfully' });
    } catch (error: any) {
      logger.error({ err: error, driverId, date }, 'Error deleting driver schedule');
      res.status(500).json({ error: getUserFriendlyError(error) });
    }
  },
};

