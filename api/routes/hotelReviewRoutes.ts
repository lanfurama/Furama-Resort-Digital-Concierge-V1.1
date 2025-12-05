import express from 'express';
import { hotelReviewController } from '../controllers/hotelReviewController.js';

const router = express.Router();

router.get('/', hotelReviewController.getAll);
router.get('/room/:roomNumber', hotelReviewController.getByRoomNumber);
router.post('/', hotelReviewController.create);
router.put('/:id', hotelReviewController.update);
router.delete('/:id', hotelReviewController.delete);

export default router;



