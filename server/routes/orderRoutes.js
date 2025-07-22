import express from 'express';
const router = express.Router();
import { addOrderItems, getOrderById, createPaymentIntent, updateOrderToPaid, getMyOrders, getAllOrders, updateOrderStatus, deleteOrder, requestOrderCancellation, manageCancellationRequest } from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js'; // <-- ADD 'admin' here

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.route('/')
    .post(protect, addOrderItems) // Existing POST route
    .get(protect, admin, getAllOrders);

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.route('/myorders').get(protect, getMyOrders); // <--- THIS IS THE CORRECT POSITION (BEFORE /:id)

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.route('/:id').get(protect, getOrderById); // <--- THIS SHOULD BE AFTER /myorders

// @desc    Create payment intent (Stripe)
// @route   POST /api/orders/:id/create-payment-intent
// @access  Private
router.route('/:id/create-payment-intent').post(protect, createPaymentIntent);

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id').delete(protect, admin, deleteOrder);
router.route('/:id/cancel').put(protect, requestOrderCancellation);
router.route('/:id/manage-cancellation').put(protect, admin, manageCancellationRequest);
export default router;