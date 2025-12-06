import { Router } from 'express';
import { roomTypeController } from '../_controllers/roomTypeController.js';

const router = Router();

router.get('/', roomTypeController.getAll);
router.get('/:id', roomTypeController.getById);
router.post('/', roomTypeController.create);
router.put('/:id', roomTypeController.update);
router.delete('/:id', roomTypeController.delete);

export default router;

