import { Router } from 'express';
import { authController } from '../_controllers/authController';

const router = Router();

console.log('⚡ Defining auth routes...');
console.log('   authController is:', authController ? 'DEFINED' : 'UNDEFINED');
console.log('   authController keys:', authController ? Object.keys(authController) : 'N/A');

router.post('/guest', (req, res, next) => {
    console.log('📥 POST /guest hit');
    authController.loginGuest(req, res).catch(next);
}); // Legacy: Room Number + Last Name

router.post('/guest/code', (req, res, next) => {
    console.log('📥 POST /guest/code hit');
    authController.loginGuestByCode(req, res).catch(next);
}); // New: Check-in Code

router.post('/staff', (req, res, next) => {
    console.log('📥 POST /staff hit');
    authController.loginStaff(req, res).catch(next);
});

export default router;

