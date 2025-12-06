import { Router } from 'express';
import { authController } from '../_controllers/authController.js';

const router = Router();

router.post('/guest', authController.loginGuest);
router.post('/staff', authController.loginStaff);

export default router;

