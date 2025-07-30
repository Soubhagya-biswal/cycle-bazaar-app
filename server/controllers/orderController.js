import asyncHandler from 'express-async-handler';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';
import { calculateEstimatedDelivery } from '../utils/deliveryEstimator.js';
import logActivity from '../services/logActivity.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        couponApplied,
        discountAmount,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        const estimatedDate = await calculateEstimatedDelivery(shippingAddress.postalCode);

        const order = new Order({
            orderItems: orderItems.map((item) => ({ ...item })),
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice: Number(itemsPrice),
            taxPrice: Number(taxPrice),
            shippingPrice: Number(shippingPrice),
            couponApplied,
            discountAmount: Number(discountAmount),
            totalPrice: Number(totalPrice),
            estimatedDeliveryDate: estimatedDate,
        });

        const createdOrder = await order.save();
        logActivity(req.user._id, 'PLACE_ORDER', { orderId: createdOrder._id, total: createdOrder.totalPrice });
        res.status(201).json(createdOrder);
    }
});


const createRazorpayOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order && !order.isPaid) {
        const options = {
            amount: Math.round(order.totalPrice * 100),
            currency: "INR",
            receipt: order._id.toString(),
        };
        const razorpayOrder = await razorpayInstance.orders.create(options);
        res.json({ orderId: razorpayOrder.id, currency: razorpayOrder.currency, amount: razorpayOrder.amount });
    } else if (order && order.isPaid) {
        res.status(400);
        throw new Error('Order is already paid');
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});


const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        const order = await Order.findById(orderId);
        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = { id: razorpay_payment_id, status: 'Success' };
            await order.save();
            res.status(200).json({ message: 'Payment successful' });
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    } else {
        res.status(400);
        throw new Error('Payment verification failed');
    }
});

const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        if (req.body.id && req.body.status) {
            order.paymentResult = {
                id: req.body.id,
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.email_address,
            };
        }
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name email');
    res.json(orders);
});

const getSellerOrders = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;
    console.log(`Fetching orders for seller ID: ${sellerId}`);

    const orders = await Order.find({})
        .populate({
            path: 'orderItems.cycle',
            model: 'Cycle',
            select: 'brand model price seller imageUrl',
            populate: {
                path: 'seller',
                model: 'User',
                select: 'name'
            }
        })
        .populate('user', 'name email');

    console.log(`Total orders fetched from DB (before filtering): ${orders.length}`);

    if (orders.length > 0) {
        console.log('--- Debug: First Populated Order Sample ---');
        console.log(JSON.stringify(orders[0].toObject({ getters: true, virtuals: true }), null, 2));
        console.log('-----------------------------------------');
    }

    const sellerSpecificOrders = orders.map(order => {
        if (!order.isDelivered || !order.isPaid) {
            console.log(`Skipping order ${order._id}: Not Delivered or Not Paid`);
            return null;
        }

        const filteredItems = order.orderItems.filter(item => {
            console.log(`  Processing Order ${order._id}, Item: ${item.name}`);
            console.log(`    Item Cycle Object (Populated?): ${item.cycle ? 'Exists' : 'NULL'}, Type: ${typeof item.cycle}`);
            console.log(`    Item Seller Object (Populated?): ${item.cycle?.seller ? 'Exists' : 'NULL'}, Type: ${typeof item.cycle?.seller}`);
            console.log(`    Item Seller ID: ${item.cycle?.seller?._id}, My Seller ID: ${sellerId.toString()}`);

            return item.cycle && typeof item.cycle === 'object' &&
                   item.cycle.seller && typeof item.cycle.seller === 'object' &&
                   item.cycle.seller._id.toString() === sellerId.toString();
        });

        if (filteredItems.length === 0) {
            console.log(`No items found for seller ${sellerId} in order ${order._id}`);
            return null;
        }

        return {
            ...order.toObject(),
            orderItems: filteredItems,
        };
    }).filter(Boolean);

    console.log(`Seller-specific orders found after filtering: ${sellerSpecificOrders.length}`);
    res.json(sellerSpecificOrders);
});


const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    const { status } = req.body;

    if (order) {
        const oldStatus = order.status;
        order.status = status;

        // Delivered ka logic
        if (status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            const returnWindowDays = 7;
            const returnDeadlineDate = new Date(order.deliveredAt);
            returnDeadlineDate.setDate(returnDeadlineDate.getDate() + returnWindowDays);
            order.returnDeadline = returnDeadlineDate;
        }

        // Admin cancellation ka logic (ab yeh 'Delivered' ke block ke BAHAR hai)
        if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
            order.cancellationDetails = {
                reason: 'Order Cancelled by Admin',
                status: 'Approved',
                cancelledBy: 'Admin'
            };
            let emailMessage = '';
            let emailSubject = `Your Order #${order._id} has been Cancelled by the Admin`;

            if (order.paymentMethod === 'Razorpay' && order.isPaid) {
                try {
                    const paymentId = order.paymentResult.id;
                    if (!paymentId) throw new Error('Payment ID not found for this order.');

                    const refund = await razorpayInstance.payments.refund(paymentId, {
                        amount: Math.round(order.totalPrice * 100),
                        speed: 'normal',
                    });

                    order.isRefunded = true;
                    order.refundedAt = Date.now();
                    order.status = 'Refund Processed';
                    order.refundResult = { id: refund.id, status: refund.status, update_time: new Date().toISOString() };

                    emailMessage = `<p>Hi ${order.user.name},</p><p>Your order #${order._id} has been cancelled by our team.</p><p>A refund of <b>₹${order.totalPrice}</b> has been processed. It may take 5-10 business days to appear in your account.</p><p>Refund ID: ${refund.id}</p>`;
                    console.log('Razorpay refund successful (Admin Cancel):', refund.id);

                } catch (refundError) {
                    console.error('Razorpay refund failed (Admin Cancel):', refundError);
                    emailMessage = `<p>Hi ${order.user.name},</p><p>Your order #${order._id} has been cancelled, but there was an issue processing your automated refund. Please contact support.</p>`;
                }
            } else {
                emailMessage = `<p>Hi ${order.user.name},</p><p>Your order #${order._id} has been cancelled by our team.</p><p>Since this was a Cash on Delivery order, no refund is necessary.</p>`;
            }

            try {
                await sendEmail({ email: order.user.email, subject: emailSubject, message: emailMessage });
            } catch (emailError) {
                console.error("Failed to send admin cancellation email:", emailError);
            }
        }

        const updatedOrder = await order.save();

        // Invoice bhejne ka logic
        if (status === 'Delivered' && oldStatus !== 'Delivered') {
            const finalOrder = await Order.findById(updatedOrder._id).populate('user', 'name email');

            if (finalOrder && finalOrder.user) {
                const userEmail = finalOrder.user.email;
                const userName = finalOrder.user.name;

                let invoiceItemsHtml = finalOrder.orderItems.map(item => `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.qty}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                `).join('');

                const invoiceHTML = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                        <h2 style="color: #0056b3; text-align: center;">Cycle Bazaar - Order Invoice</h2>
                        <p>Dear ${userName},</p>
                        <p>Your order #${finalOrder._id} has been successfully delivered!</p>
                        <p>Thank you for your purchase. Here are your order details:</p>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Quantity</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Unit Price</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoiceItemsHtml}
                                <tr>
                                    <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Items Price:</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${finalOrder.itemsPrice.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Shipping:</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${finalOrder.shippingPrice.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Tax:</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${finalOrder.taxPrice.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Grand Total:</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${finalOrder.totalPrice.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p><strong>Order ID:</strong> ${finalOrder._id}</p>
                        <p><strong>Order Date:</strong> ${finalOrder.createdAt.toDateString()}</p>
                        <p><strong>Payment Method:</strong> ${finalOrder.paymentMethod}</p>
                        <p><strong>Payment Status:</strong> ${finalOrder.isPaid ? 'Paid' : 'Unpaid'}</p>
                        <p><strong>Delivery Address:</strong> ${finalOrder.shippingAddress.address}, ${finalOrder.shippingAddress.city}, ${finalOrder.shippingAddress.postalCode}, ${finalOrder.shippingAddress.country}</p>
                        <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #777;">
                            Thank you for choosing Cycle Bazaar!
                        </p>
                    </div>
                `;

                try {
                    await sendEmail({
                        email: userEmail,
                        subject: `Cycle Bazaar - Invoice for Order #${finalOrder._id}`,
                        message: invoiceHTML,
                    });
                    console.log(`Invoice email sent to ${userEmail} for order ${finalOrder._id}`);
                } catch (emailError) {
                    console.error(`Failed to send invoice email for order ${finalOrder._id}:`, emailError);
                }
            }
        }
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});


const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        await order.deleteOne();
        res.json({ message: 'Order removed' });
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const requestOrderCancellation = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (order && order.user.toString() === req.user._id.toString()) {
        if (order.status !== 'Processing') {
            res.status(400);
            throw new Error('Order cannot be cancelled once it has been shipped.');
        }

        order.status = 'Cancellation Requested';
        order.cancellationDetails = {
            reason: reason,
            status: 'Pending',
            requestedAt: Date.now(),
            cancelledBy: 'User'
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const manageCancellationRequest = asyncHandler(async (req, res) => {
    const { action } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order && order.status === 'Cancellation Requested') {
        let emailMessage = '';
        let emailSubject = '';

        if (action === 'approve') {
            order.status = 'Cancelled';
            order.cancellationDetails.status = 'Approved';
            order.cancellationDetails.cancelledBy = 'User';
            emailSubject = `Your Order #${order._id} Cancellation has been Approved`;

            if (order.paymentMethod === 'Razorpay' && order.isPaid) {
                try {
                    const paymentId = order.paymentResult.id;
                    if (!paymentId) throw new Error('Payment ID not found for this order.');

                    const refund = await razorpayInstance.payments.refund(paymentId, {
                        amount: Math.round(order.totalPrice * 100),
                        speed: 'normal',
                    });

                    order.isRefunded = true;
                    order.refundedAt = Date.now();
                    order.status = 'Refund Processed';
                    order.refundResult = { id: refund.id, status: refund.status, update_time: new Date().toISOString() };

                    emailMessage = `<p>Hi ${order.user.name},</p><p>Your cancellation request for order #${order._id} has been approved.</p><p>A refund of <b>₹${order.totalPrice}</b> has been processed via Razorpay. It may take 5-10 business days to appear in your account.</p><p>Refund ID: ${refund.id}</p>`;
                    console.log('Razorpay refund successful:', refund.id);

                } catch (refundError) {
                    console.error('Razorpay refund failed:', refundError);
                    emailMessage = `<p>Hi ${order.user.name},</p><p>Your cancellation for order #${order._id} is approved, but there was an issue processing your automated refund. Please contact support.</p>`;
                }
            } else {
                emailMessage = `<p>Hi ${order.user.name},</p><p>Your cancellation request for order #${order._id} has been approved.</p><p>Since this was a Cash on Delivery order, no refund is necessary.</p>`;
            }
        } else if (action === 'reject') {
            order.status = 'Processing';
            order.cancellationDetails.status = 'Rejected';
            emailSubject = `Your Order #${order._id} Cancellation has been Rejected`;
            emailMessage = `<p>Hi ${order.user.name},</p><p>We're sorry, but your cancellation request for order #${order._id} has been rejected because the item may have already been shipped.</p>`;
        } else {
            res.status(400);
            throw new Error("Invalid action.");
        }

        const updatedOrder = await order.save();

        try {
            await sendEmail({ email: order.user.email, subject: emailSubject, message: emailMessage });
        } catch (emailError) {
            console.error("Failed to send cancellation status email:", emailError);
        }

        res.json(updatedOrder);

    } else {
        res.status(404);
        throw new Error('Order not found or no pending cancellation request.');
    }
});

export {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
    requestOrderCancellation,
    manageCancellationRequest,
    getSellerOrders,
    createRazorpayOrder,
    verifyPayment
};