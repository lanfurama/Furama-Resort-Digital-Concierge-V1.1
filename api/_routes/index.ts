import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import locationRoutes from './locationRoutes';
import menuItemRoutes from './menuItemRoutes';
import promotionRoutes from './promotionRoutes';
import knowledgeItemRoutes from './knowledgeItemRoutes';
import resortEventRoutes from './resortEventRoutes';
import rideRequestRoutes from './rideRequestRoutes';
import serviceRequestRoutes from './serviceRequestRoutes';
import chatMessageRoutes from './chatMessageRoutes';
import roomTypeRoutes from './roomTypeRoutes';
import roomRoutes from './roomRoutes';
import notificationRoutes from './notificationRoutes';
import hotelReviewRoutes from './hotelReviewRoutes';
import driverScheduleRoutes from './driverScheduleRoutes';

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
router.use('/driver-schedules', driverScheduleRoutes);

export default router;

