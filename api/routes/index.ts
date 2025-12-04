import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import locationRoutes from './locationRoutes.js';
import menuItemRoutes from './menuItemRoutes.js';
import promotionRoutes from './promotionRoutes.js';
import knowledgeItemRoutes from './knowledgeItemRoutes.js';
import resortEventRoutes from './resortEventRoutes.js';
import rideRequestRoutes from './rideRequestRoutes.js';
import serviceRequestRoutes from './serviceRequestRoutes.js';
import chatMessageRoutes from './chatMessageRoutes.js';
import roomTypeRoutes from './roomTypeRoutes.js';
import roomRoutes from './roomRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import hotelReviewRoutes from './hotelReviewRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);
router.use('/menu-items', menuItemRoutes);
router.use('/promotions', promotionRoutes);
router.use('/knowledge-items', knowledgeItemRoutes);
router.use('/resort-events', resortEventRoutes);
router.use('/ride-requests', rideRequestRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/chat-messages', chatMessageRoutes);
router.use('/room-types', roomTypeRoutes);
router.use('/rooms', roomRoutes);
router.use('/notifications', notificationRoutes);
router.use('/hotel-reviews', hotelReviewRoutes);

export default router;

