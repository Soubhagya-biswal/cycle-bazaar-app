import express from 'express';
const router = express.Router();
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon, 
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// Admin routes
router.route('/').post(protect, admin, createCoupon).get(protect, admin, getAllCoupons);
router
  .route('/:id')
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);
// User route
router.route('/apply').post(protect, applyCoupon);

export default router;