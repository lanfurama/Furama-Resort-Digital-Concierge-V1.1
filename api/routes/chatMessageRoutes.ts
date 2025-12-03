import { Router } from 'express';
import { chatMessageController } from '../controllers/chatMessageController.js';

const router = Router();

router.get('/', chatMessageController.getAll);
router.get('/:id', chatMessageController.getById);
router.get('/user/:userId', chatMessageController.getByUserId);
router.get('/room/:roomNumber', chatMessageController.getByRoomNumber);
router.post('/', chatMessageController.create);
router.delete('/:id', chatMessageController.delete);

export default router;

