import { Router } from 'express';
import { resortEventController } from '../controllers/resortEventController.js';

const router = Router();

router.get('/', resortEventController.getAll);
router.get('/:id', resortEventController.getById);
router.post('/', resortEventController.create);
router.put('/:id', resortEventController.update);
router.delete('/:id', resortEventController.delete);

export default router;

