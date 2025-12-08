import { Router } from 'express';
import { chatMessageController } from '../_controllers/chatMessageController.js';

const router = Router();

router.get('/', chatMessageController.getAll);
router.get('/:id', chatMessageController.getById);
router.get('/user/:userId', chatMessageController.getByUserId);
router.get('/room/:roomNumber', chatMessageController.getByRoomNumber);
router.get('/room/:roomNumber/unread', chatMessageController.getUnreadCount);
router.post('/', chatMessageController.create);
router.post('/room/:roomNumber/mark-read', chatMessageController.markAsRead);
router.delete('/:id', chatMessageController.delete);

export default router;

