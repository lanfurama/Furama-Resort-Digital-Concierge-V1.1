import { Router } from 'express';
import { promotionController } from '../_controllers/promotionController.js';

const router = Router();

router.get('/', promotionController.getAll);
router.get('/:id', promotionController.getById);
router.post('/', promotionController.create);
router.put('/:id', promotionController.update);
router.delete('/:id', promotionController.delete);

export default router;

