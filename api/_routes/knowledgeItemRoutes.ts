import { Router } from 'express';
import { knowledgeItemController } from '../_controllers/knowledgeItemController.js';

const router = Router();

router.get('/', knowledgeItemController.getAll);
router.get('/:id', knowledgeItemController.getById);
router.post('/', knowledgeItemController.create);
router.put('/:id', knowledgeItemController.update);
router.delete('/:id', knowledgeItemController.delete);

export default router;

