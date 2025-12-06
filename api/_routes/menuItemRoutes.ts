import { Router } from 'express';
import { menuItemController } from '../_controllers/menuItemController.js';

const router = Router();

router.get('/', menuItemController.getAll);
router.get('/:id', menuItemController.getById);
router.post('/', menuItemController.create);
router.put('/:id', menuItemController.update);
router.delete('/:id', menuItemController.delete);

export default router;

