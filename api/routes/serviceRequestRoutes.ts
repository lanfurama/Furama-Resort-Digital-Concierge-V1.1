import { Router } from 'express';
import { serviceRequestController } from '../controllers/serviceRequestController.js';

const router = Router();

router.get('/', serviceRequestController.getAll);
router.get('/:id', serviceRequestController.getById);
router.get('/room/:roomNumber', serviceRequestController.getByRoomNumber);
router.get('/status/:status', serviceRequestController.getByStatus);
router.get('/type/:type', serviceRequestController.getByType);
router.post('/', serviceRequestController.create);
router.put('/:id', serviceRequestController.update);
router.delete('/:id', serviceRequestController.delete);

export default router;

