import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';

const router = Router();

router.get('/', notificationController.getAll);
router.get('/:id', notificationController.getById);
router.get('/recipient/:recipientId', notificationController.getByRecipientId);
router.get('/recipient/:recipientId/unread', notificationController.getUnreadByRecipientId);
router.post('/', notificationController.create);
router.put('/:id', notificationController.update);
router.put('/:id/read', notificationController.markAsRead);
router.put('/recipient/:recipientId/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.delete);

export default router;

