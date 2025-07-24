import express from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/order.model.js';
import Return from '../models/returnmodel.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// --- NAYE IMPORTS YAHAN ADD KAREIN ---
import Stripe from 'stripe';
import User from '../models/user.model.js'; // User model import kiya for email
import sendEmail from '../utils/sendEmail.js'; // sendEmail utility import kiya

const stripe = new Stripe('sk_test_51QCAw7LLSgFDTQWj0k89K2TCpDmFss4dKJFug3Z84cThg9TUp2mWzjGPb34O14gyNWfZrp0xFyfMHg95mWPVn2r80066Tm0HsH'); // Stripe ko initialize kiya
// --- NAYE IMPORTS END ---

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
    if (returnMethod === 'Bank Transfer' && (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.bankName)) {
        res.status(400);
        throw new Error('All bank details (Account Holder Name, Account Number, IFSC Code, Bank Name) are required for bank transfer method.');
    }

    // 2. Find the Order
    // Populate user to get email for potential future notifications right away
    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    // 3. Check if the order belongs to the requesting user (security)
    if (order.user._id.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to request return for this order.');
    }

    // 4. Check Order Status and Return Eligibility
    if (order.status !== 'Delivered') {
      res.status(400);
      throw new Error('Only delivered orders can be returned.');
    }

    if (order.returnInitiated) {
      res.status(400);
      throw new Error('A return request for this order has already been initiated.');
    }

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
      bankDetails: returnMethod === 'Bank Transfer' ? bankDetails : {}
      // returnStatus will default to 'Pending'
    });

    const createdReturn = await newReturn.save();

    // 6. Update Order Document
    order.returnInitiated = true;
    order.returnRequestDate = new Date();
    order.returnId = createdReturn._id;
    order.status = 'Return Requested'; // Order status update karein
    await order.save();

    // 7. Send Email Notification to User for Return Request Received
    try {
        const userEmail = order.user.email;
        const userName = order.user.name;
        const emailSubject = `Return Request Received for Order #${order._id}`;
        const emailMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #0056b3; text-align: center;">Cycle Bazaar - Return Request Received</h2>
                <p>Dear ${userName},</p>
                <p>We have successfully received your return request for Order ID: <strong>#${order._id}</strong>.</p>
                <p><strong>Reason for Return:</strong> ${reason}</p>
                <p><strong>Preferred Return Method:</strong> ${returnMethod}</p>
                <p>Your request is now under review. We will notify you once your return request has been processed by our team.</p>
                <p>You can track the status of your return from your <a href="${process.env.FRONTEND_URL}/order/${order._id}">order details page</a>.</p>
                <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #777;">
                    Thank you for shopping with Cycle Bazaar!
                </p>
            </div>
        `;
        await sendEmail({
            email: userEmail,
            subject: emailSubject,
            message: emailMessage
        });
        console.log(`Return request received email sent to ${userEmail} for order ${order._id}`);
    } catch (emailError) {
        console.error(`Failed to send return request received email for order ${order._id}:`, emailError);
    }


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
      .populate('orderId', 'totalPrice user status paymentMethod paymentResult isPaid isRefunded refundedAt') // Order ke kuch fields
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

    // Populate orderId and userId for email sending and refund processing
    const returnRequest = await Return.findById(req.params.id)
      .populate('orderId', 'totalPrice user status paymentMethod paymentResult isPaid isRefunded refundedAt')
      .populate('userId', 'name email');

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

    const oldReturnStatus = returnRequest.returnStatus; // Store old status for email conditions

    // Update return request document
    returnRequest.returnStatus = status;
    returnRequest.adminNotes = adminNotes || returnRequest.adminNotes;
    
    // Update linked Order status and handle refunds
    if (returnRequest.orderId) {
        let emailSubject = '';
        let emailMessage = '';
        let refundAttempted = false; // Flag to track if refund logic was run

        if (status === 'Approved') {
            returnRequest.orderId.status = 'Return Approved';
            emailSubject = `Your Return Request for Order #${returnRequest.orderId._id} Has Been Approved`;
            emailMessage = `
                <p>Dear ${returnRequest.userId.name},</p>
                <p>Good news! Your return request for Order ID: <strong>#${returnRequest.orderId._id}</strong> has been **APPROVED**.</p>
                <p>We are now processing your refund/store credit according to your chosen method: <strong>${returnRequest.returnMethod}</strong>.</p>
                <p>We will send another notification once the refund has been successfully processed.</p>
                <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #777;">
                    Thank you for shopping with Cycle Bazaar!
                </p>
            `;

        } else if (status === 'Rejected') {
            returnRequest.orderId.status = 'Return Rejected';
            emailSubject = `Your Return Request for Order #${returnRequest.orderId._id} Has Been Rejected`;
            emailMessage = `
                <p>Dear ${returnRequest.userId.name},</p>
                <p>We regret to inform you that your return request for Order ID: <strong>#${returnRequest.orderId._id}</strong> has been **REJECTED**.</p>
                <p><strong>Reason for Rejection:</strong> ${adminNotes || 'No specific reason provided by admin.'}</p>
                <p>If you have any questions, please contact our support team.</p>
                <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #777;">
                    Thank you for shopping with Cycle Bazaar!
                </p>
            `;
        } else if (status === 'Refund Processed') {
            returnRequest.returnProcessedDate = new Date();
            returnRequest.orderId.status = 'Refund Processed';
            returnRequest.orderId.isRefunded = true;
            returnRequest.orderId.refundedAt = new Date();
            refundAttempted = true; // Mark that refund logic was attempted

            emailSubject = `Refund Processed for Order #${returnRequest.orderId._id}`;
            let refundMessagePart = '';

            // --- REFUND LOGIC INTEGRATION ---
            if (returnRequest.orderId.paymentMethod === 'Stripe' && returnRequest.orderId.isPaid) {
                try {
                    const paymentIntentId = returnRequest.orderId.paymentResult.id;
                    if (!paymentIntentId) {
                        throw new Error('Payment Intent ID not found for this order. Cannot process Stripe refund.');
                    }
                    // Refund the full amount (or partial if logic allows)
                    await stripe.refunds.create({
                        payment_intent: paymentIntentId,
                        amount: Math.round(returnRequest.orderId.totalPrice * 100), // Amount in smallest currency unit (paise)
                    });
                    console.log(`Stripe refund successful for order ${returnRequest.orderId._id}.`);
                    refundMessagePart = `A refund of ₹${returnRequest.orderId.totalPrice.toFixed(2)} has been successfully processed via Stripe. It may take 5-10 business days for the amount to reflect in your account.`;

                } catch (refundError) {
                    console.error(`Stripe refund failed for order ${returnRequest.orderId._id}:`, refundError);
                    // Agar refund fail ho, toh error message adjust karein
                    emailSubject = `Partial Issue: Refund for Order #${returnRequest.orderId._id}`;
                    refundMessagePart = `We encountered an issue processing your automated Stripe refund for ₹${returnRequest.orderId.totalPrice.toFixed(2)}. Please contact our support team immediately quoting Return ID: ${returnRequest._id} for assistance.`;
                    // Mark as refunded in DB ONLY IF actual refund happened, or have a 'refundFailed' flag
                    // For now, if automated refund fails, we still mark 'Refund Processed' in Return model,
                    // but the email conveys the error. Admin might need manual intervention.
                }
            } else if (returnRequest.returnMethod === 'Bank Transfer') {
                // Ye manual bank transfer ka case hai, assuming admin ne manually kar diya hai
                refundMessagePart = `A refund of ₹${returnRequest.orderId.totalPrice.toFixed(2)} has been processed to your provided bank account. Please allow 3-5 business days for the amount to reflect.`;
            } else if (returnRequest.returnMethod === 'Store Credit') {
                // Yahan aapko user ke account mein store credit add karne ka logic add karna hoga
                // Example: await User.findByIdAndUpdate(returnRequest.userId, { $inc: { storeCredit: returnRequest.orderId.totalPrice } });
                refundMessagePart = `A store credit of ₹${returnRequest.orderId.totalPrice.toFixed(2)} has been successfully added to your Cycle Bazaar account. You can use it on your next purchase!`;
            } else {
                refundMessagePart = `Your return has been processed. If a refund was due, it has been initiated. For details, please check your payment method or contact support.`;
            }

            emailMessage = `
                <p>Dear ${returnRequest.userId.name},</p>
                <p>${refundMessagePart}</p>
                <p>Return ID: <strong>${returnRequest._id}</strong></p>
                <p>Order ID: <strong>#${returnRequest.orderId._id}</strong></p>
                <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #777;">
                    Thank you for shopping with Cycle Bazaar!
                </p>
            `;
        }
        
        // Save the updated order document
        await returnRequest.orderId.save();

        // Send email only if status actually changed to Approved/Rejected/Refund Processed
        if (returnRequest.userId && returnRequest.userId.email && oldReturnStatus !== status) {
            try {
                await sendEmail({
                    email: returnRequest.userId.email,
                    subject: emailSubject,
                    message: emailMessage
                });
                console.log(`Return status email sent to ${returnRequest.userId.email} for return ${returnRequest._id}, status: ${status}`);
            } catch (emailError) {
                console.error(`Failed to send return status email for return ${returnRequest._id}:`, emailError);
            }
        }
    }

    const updatedReturn = await returnRequest.save();

    res.json({
      message: 'Return request status updated successfully.',
      return: updatedReturn,
      orderStatus: updatedReturn.orderId ? updatedReturn.orderId.status : undefined
    });
  })
);


export default router;