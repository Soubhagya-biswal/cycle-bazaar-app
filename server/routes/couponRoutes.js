import express from 'express';
const router = express.Router();
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  getFeaturedCoupon, 
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';


router.route('/featured').get(getFeaturedCoupon); 


router.route('/').post(protect, admin, createCoupon).get(protect, admin, getAllCoupons);
router
  .route('/:id')
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);


router.route('/apply').post(protect, applyCoupon);

export default router;