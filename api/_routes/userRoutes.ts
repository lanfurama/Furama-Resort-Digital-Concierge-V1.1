import { Router } from 'express';
import { userController } from '../_controllers/userController.js';

const router = Router();

router.get('/', userController.getAll);
router.get('/drivers/locations', userController.getDriversWithLocations);
router.get('/room/:roomNumber', userController.getByRoomNumber);
router.post('/', userController.create);
// Specific routes should come before generic :id routes
router.post('/:id/offline', userController.markOffline);
router.post('/:id/online-10hours', userController.setOnlineFor10Hours);
router.put('/:id/location', userController.updateLocation);
router.post('/:userId/generate-check-in-code', userController.generateCheckInCode);
// Generic routes come last
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

export default router;

