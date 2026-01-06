import { Router } from 'express';
import { rideRequestController } from '../_controllers/rideRequestController.js';

const router = Router();

router.get('/', rideRequestController.getAll);
router.get('/reports/historical', rideRequestController.getHistoricalReports);
router.get('/reports/statistics', rideRequestController.getReportStatistics);
router.get('/reports/driver-performance', rideRequestController.getDriverPerformanceStats);
router.get('/:id', rideRequestController.getById);
router.get('/room/:roomNumber', rideRequestController.getByRoomNumber);
router.get('/room/:roomNumber/active', rideRequestController.getActiveByRoomNumber);
router.get('/status/:status', rideRequestController.getByStatus);
router.post('/', rideRequestController.create);
router.put('/:id', rideRequestController.update);
router.delete('/:id', rideRequestController.delete);

export default router;

