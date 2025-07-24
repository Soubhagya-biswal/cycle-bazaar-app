import express from 'express';
const router = express.Router();
import asyncHandler from 'express-async-handler'; 
import Cycle from '../models/cycle.model.js'; 
import { protect, admin } from '../middleware/authMiddleware.js'; 
import { getAllCycles, addCycle, getCycleById, updateCycle, deleteCycle, subscribeToStockNotification, unsubscribeFromStockNotification, subscribeToPriceDrop, unsubscribeFromPriceDrop, createCycleReview, deleteReview } from '../controllers/cycleController.js';

router.route('/').get(getAllCycles);


router.route('/add').post(protect, admin, addCycle); 

router.route('/:id').get(getCycleById);


router.route('/update/:id').put(protect, admin, updateCycle); 

router.route('/:id').delete(protect, admin, deleteCycle); 
router.route('/:id/subscribe').post(protect, subscribeToStockNotification);
router.route('/:id/subscribe').delete(protect, unsubscribeFromStockNotification);
router.route('/:id/subscribe-price').post(protect, subscribeToPriceDrop);
router.route('/:id/subscribe-price').delete(protect, unsubscribeFromPriceDrop);
router.route('/:id/reviews').post(protect, createCycleReview);
router.route('/:id/reviews/:reviewId').delete(protect, admin, deleteReview);
export default router;