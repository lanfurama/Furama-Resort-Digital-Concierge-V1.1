import { Router } from 'express';
import { authController } from '../_controllers/authController.js';

const router = Router();

router.post('/guest', authController.loginGuest); // Legacy: Room Number + Last Name
router.post('/guest/code', authController.loginGuestByCode); // New: Check-in Code
router.post('/staff', authController.loginStaff);

export default router;

