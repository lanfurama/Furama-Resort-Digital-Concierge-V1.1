import { Router } from 'express';
import { roomController } from '../_controllers/roomController.js';

const router = Router();

router.get('/', roomController.getAll);
router.get('/number/:number', roomController.getByNumber);
router.get('/type/:typeId', roomController.getByTypeId);
router.get('/:id', roomController.getById);
router.post('/', roomController.create);
router.post('/bulk', roomController.bulkCreate);
router.put('/:id', roomController.update);
router.delete('/:id', roomController.delete);

export default router;

