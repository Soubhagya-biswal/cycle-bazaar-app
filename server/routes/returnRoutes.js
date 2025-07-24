import express from 'express';
import asyncHandler from 'express-async-handler'; // For handling async errors without try-catch blocks everywhere
import Order from '../models/order.model.js'; // Order model import karein
import Return from '../models/returnmodel.js'; // Naya Return model import karein
import { protect, admin } from '../middleware/authMiddleware.js'; // Authentication and Admin middleware

const router = express.Router();

// @desc    Request a return for an order
// @route   POST /api/returns/request
// @access  Private (User)
router.post(
  '/request',
  protect, // User authenticated hona chahiye
  asyncHandler(async (req, res) => {
    const { orderId, reason, returnMethod, bankDetails } = req.body;

    // 1. Validate Input
    if (!orderId || !reason || !returnMethod) {
      res.status(400);
      throw new Error('Please provide order ID, reason, and return method.');
    }
    if (returnMethod === 'Bank Transfer' && (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode)) {
        res.status(400);
        throw new Error('Bank details (Account Number, IFSC Code) are required for bank transfer method.');
    }

    // 2. Find the Order
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    // 3. Check if the order belongs to the requesting user (security)
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to request return for this order.');
    }

    // 4. Check Order Status and Return Eligibility
    // Only 'Delivered' orders can be returned, and only if return not already initiated
    if (order.status !== 'Delivered') {
      res.status(400);
      throw new Error('Only delivered orders can be returned.');
    }

    if (order.returnInitiated) {
      res.status(400);
      throw new Error('A return request for this order has already been initiated.');
    }

    // Check return deadline (assuming returnDeadline is set on the order when delivered)
    if (order.returnDeadline && new Date() > new Date(order.returnDeadline)) {
      res.status(400);
      throw new Error(`Return window for this order has closed. Deadline was: ${new Date(order.returnDeadline).toLocaleDateString()}`);
    }


    // 5. Create New Return Document
    const newReturn = new Return({
      orderId: order._id,
      userId: req.user._id,
      reason,
      returnMethod,
      bankDetails: returnMethod === 'Bank Transfer' ? bankDetails : {} // Sirf bank transfer ke liye bank details save karein
      // returnStatus will default to 'Pending'
    });

    const createdReturn = await newReturn.save();

    // 6. Update Order Document
    order.returnInitiated = true;
    order.returnRequestDate = new Date();
    order.returnId = createdReturn._id;
    order.status = 'Return Requested'; // Order status update karein
    await order.save();

    res.status(201).json({
      message: 'Return request submitted successfully!',
      return: createdReturn,
      orderStatus: order.status
    });
  })
);


// @desc    Get all return requests (Admin only)
// @route   GET /api/returns
// @access  Private/Admin
router.get(
  '/',
  protect, // Authenticated user
  admin,   // Must be an admin
  asyncHandler(async (req, res) => {
    // Populate order and user details for easier review
    const returns = await Return.find({})
      .populate('orderId', 'totalPrice user status') // Order ke kuch fields
      .populate('userId', 'name email'); // User ke name aur email

    res.json(returns);
  })
);

// @desc    Update return request status (Admin only)
// @route   PUT /api/returns/:id/status
// @access  Private/Admin
router.put(
  '/:id/status',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { status, adminNotes } = req.body; // 'status' could be 'Approved', 'Rejected', 'Refund Processed'

    const returnRequest = await Return.findById(req.params.id).populate('orderId');

    if (!returnRequest) {
      res.status(404);
      throw new Error('Return request not found.');
    }

    // Status validation
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Refund Processed'];
    if (!validStatuses.includes(status)) {
        res.status(400);
        throw new Error('Invalid return status provided.');
    }

    // Update return request
    returnRequest.returnStatus = status;
    returnRequest.adminNotes = adminNotes || returnRequest.adminNotes; // Agar notes hain to update karein

    if (status === 'Refund Processed') {
        returnRequest.returnProcessedDate = new Date();
        // Here you would typically integrate with a payment gateway to process the refund.
        // For now, this is a placeholder. You'd use returnRequest.orderId.paymentResult.id
        // or a similar transaction ID to trigger the refund via your payment gateway API.
        // Example: await stripe.refunds.create({ payment_intent: returnRequest.orderId.paymentResult.id });
        // Or if it's a manual bank transfer, admin manually does it and marks as processed.
        
        // Update order status to 'Refund Processed'
        if (returnRequest.orderId) {
            returnRequest.orderId.status = 'Refund Processed';
            returnRequest.orderId.isRefunded = true; // Mark order as refunded
            returnRequest.orderId.refundedAt = new Date();
            await returnRequest.orderId.save();
        }
    } else if (status === 'Approved') {
        // If approved, you might want to change order status to 'Return Approved'
        if (returnRequest.orderId) {
            returnRequest.orderId.status = 'Return Approved';
            await returnRequest.orderId.save();
        }
    } else if (status === 'Rejected') {
        // If rejected, you might want to change order status back to 'Delivered' or 'Return Rejected'
        if (returnRequest.orderId) {
            returnRequest.orderId.status = 'Return Rejected';
            await returnRequest.orderId.save();
        }
    }

    const updatedReturn = await returnRequest.save();

    res.json({
      message: 'Return request status updated successfully.',
      return: updatedReturn,
      orderStatus: updatedReturn.orderId ? updatedReturn.orderId.status : undefined // Send updated order status if populated
    });
  })
);


export default router;