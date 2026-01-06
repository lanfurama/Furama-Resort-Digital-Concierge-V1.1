import { Router } from 'express';
import { driverScheduleController } from '../_controllers/driverScheduleController.js';

const router = Router();

// Get all schedules for a driver
router.get('/driver/:driverId', driverScheduleController.getByDriverId);

// Get schedule for a specific date
router.get('/driver/:driverId/date', driverScheduleController.getByDate);

// Get schedules for a date range
router.get('/driver/:driverId/range', driverScheduleController.getByDateRange);

// Get all schedules for a date range (all drivers)
router.get('/range', driverScheduleController.getAllByDateRange);

// Check if driver is available
router.get('/driver/:driverId/availability', driverScheduleController.checkAvailability);

// Create or update a schedule
router.post('/driver/:driverId', driverScheduleController.upsert);
router.put('/driver/:driverId', driverScheduleController.upsert);

// Delete a schedule
router.delete('/driver/:driverId', driverScheduleController.delete);

export default router;

