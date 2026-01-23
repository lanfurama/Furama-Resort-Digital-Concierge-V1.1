import { Router } from 'express';
import { authController } from '../_controllers/authController';
import logger from '../_utils/logger.js';

const router = Router();

logger.debug({ 
  authControllerDefined: !!authController,
  authControllerKeys: authController ? Object.keys(authController) : []
}, '⚡ Defining auth routes...');

router.post('/guest', (req, res, next) => {
    logger.debug('📥 POST /guest hit');
    authController.loginGuest(req, res).catch(next);
}); // Legacy: Room Number + Last Name

router.post('/guest/code', (req, res, next) => {
    logger.debug('📥 POST /guest/code hit');
    authController.loginGuestByCode(req, res).catch(next);
}); // New: Check-in Code

router.post('/staff', (req, res, next) => {
    logger.debug('📥 POST /staff hit');
    authController.loginStaff(req, res).catch(next);
});

export default router;

