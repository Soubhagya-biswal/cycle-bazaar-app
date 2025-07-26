import express from 'express';
const router = express.Router();
import { addOrderItems, getOrderById, createPaymentIntent, updateOrderToPaid, getMyOrders, getAllOrders, updateOrderStatus, deleteOrder, requestOrderCancellation, manageCancellationRequest, getSellerOrders } from '../controllers/orderController.js';
import { protect, admin, seller } from '../middleware/authMiddleware.js'; 


router.route('/')
    .post(protect, addOrderItems) 
    .get(protect, admin, getAllOrders);

router.route('/myorders').get(protect, getMyOrders);
router.route('/sellerorders').get(protect, seller, getSellerOrders); 
router.route('/:id').get(protect, getOrderById); 

router.route('/:id/create-payment-intent').post(protect, createPaymentIntent);


router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id').delete(protect, admin, deleteOrder);
router.route('/:id/cancel').put(protect, requestOrderCancellation);
router.route('/:id/manage-cancellation').put(protect, admin, manageCancellationRequest);
export default router;