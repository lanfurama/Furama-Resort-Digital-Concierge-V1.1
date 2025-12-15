import { Router } from 'express';
import { userController } from '../_controllers/userController.js';

const router = Router();

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.get('/room/:roomNumber', userController.getByRoomNumber);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);
router.post('/:id/offline', userController.markOffline);

export default router;

