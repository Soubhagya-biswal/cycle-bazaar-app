import asyncHandler from 'express-async-handler';
import Order from '../models/order.model.js';
import User from '../models/user.model.js'; 
import sendEmail from '../utils/sendEmail.js'; 
import Stripe from 'stripe';
import { calculateEstimatedDelivery } from '../utils/deliveryEstimator.js';
const stripe = new Stripe('sk_test_51QCAw7LLSgFDTQWj0k89K2TCpDmFss4dKJFug3Z84cThg9TUp2mWzjGPb34O14gyNWfZrp0xFyfMHg95mWPVn2r80066Tm0HsH');


const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
    return;
  } else {
    
    const mappedOrderItems = orderItems.map((item) => ({
      ...item,
      qty: Number(item.qty),
      price: Number(item.price),
    }));

    
    const finalTaxPrice = 0;
    const finalShippingPrice = 0;

    const baseItemsPrice = Number(itemsPrice);
    const finalTotalPrice = baseItemsPrice + finalTaxPrice + finalShippingPrice;
    const estimatedDate = await calculateEstimatedDelivery(shippingAddress.postalCode);
    console.log(`Calculated Estimated Delivery Date: ${estimatedDate}`); 

    const order = new Order({
      orderItems: mappedOrderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice: baseItemsPrice,
      taxPrice: finalTaxPrice,
      shippingPrice: finalShippingPrice,
      totalPrice: finalTotalPrice,
      estimatedDeliveryDate: estimatedDate,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  }
});

const createPaymentIntent = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), 
      currency: 'inr',
      metadata: { order_id: order._id.toString() },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    
    console.log('--- Backend Check: Full Order Object ---');
    console.log(JSON.stringify(order, null, 2));
    console.log('--------------------------------------');

    console.log('--- Backend Check: Order Items Data Types (After DB Fetch) ---');
    if (order.orderItems && order.orderItems.length > 0) {
        order.orderItems.forEach((item, index) => {
            console.log(`Item ${index + 1}: ${item.name}`);
            console.log(`  Quantity: ${item.qty}, Type: ${typeof item.qty}`);
            console.log(`  Price: ${item.price}, Type: ${typeof item.price}`);
            console.log('----------------------------------------------------');
        });
    } else {
        console.log('No order items found for this order.');
    }
    
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

    // --- NAYA POPULATE LOGIC YAHAN ---
    const orders = await Order.find({})
        .populate({
            // Path to the array element. We explicitly populate the 'cycle' field within each orderItem.
            path: 'orderItems.cycle',
            // Specify the model to reference
            model: 'Cycle',
            // Select the fields you need from the Cycle document
            // Crucially, 'seller' is part of the Cycle model and needs to be brought in
            select: 'brand model price seller imageUrl',
            // Now, populate the 'seller' field *inside* the 'cycle' object that we just got
            populate: {
                path: 'seller', // This 'seller' refers to the seller field within the Cycle model
                model: 'User', // Specify the model for the seller (which is a User)
                select: 'name' // Select the 'name' field from the User model
            }
        })
        .populate('user', 'name email'); // This populates the user who made the order

    console.log(`Total orders fetched from DB (before filtering): ${orders.length}`);

    // --- NAYA CONSOLE.LOG YAHAN - Poora populated order object dekho ---
    if (orders.length > 0) {
        console.log('--- Debug: First Populated Order Sample ---');
        // JSON.stringify will show populated objects
        console.log(JSON.stringify(orders[0].toObject({ getters: true, virtuals: true }), null, 2));
        console.log('-----------------------------------------');
    }
    // --- END NAYA CONSOLE.LOG ---


    const sellerSpecificOrders = orders.map(order => {
        // Only consider orders that are delivered and paid
        if (!order.isDelivered || !order.isPaid) {
            console.log(`Skipping order ${order._id}: Not Delivered or Not Paid`);
            return null;
        }

        const filteredItems = order.orderItems.filter(item => {
            console.log(`  Processing Order ${order._id}, Item: ${item.name}`);
            console.log(`    Item Cycle Object (Populated?): ${item.cycle ? 'Exists' : 'NULL'}, Type: ${typeof item.cycle}`);
            console.log(`    Item Seller Object (Populated?): ${item.cycle?.seller ? 'Exists' : 'NULL'}, Type: ${typeof item.cycle?.seller}`);
            console.log(`    Item Seller ID: ${item.cycle?.seller?._id}, My Seller ID: ${sellerId.toString()}`);

            // Crucial check: Does the item's cycle belong to the logged-in seller?
            // Ensure item.cycle is an object and item.cycle.seller is also an object
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
});const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  const { status } = req.body;

  if (order) {
    const oldStatus = order.status; 

    order.status = status;

    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      
      const returnWindowDays = 7; 
      const returnDeadlineDate = new Date(order.deliveredAt); 
      returnDeadlineDate.setDate(returnDeadlineDate.getDate() + returnWindowDays);
      order.returnDeadline = returnDeadlineDate; 
      
    } else {
      order.isDelivered = false;
      order.deliveredAt = undefined;
      order.returnDeadline = undefined;
    }

    const updatedOrder = await order.save();

    // --- Invoice Email Logic (only send if status changed to Delivered) ---
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

  // Check if the order exists and belongs to the user
  if (order && order.user.toString() === req.user._id.toString()) {
    // Check if the order is in a state that can be cancelled
    if (order.status !== 'Processing') {
      res.status(400);
      throw new Error('Order cannot be cancelled once it has been shipped.');
    }

    order.status = 'Cancellation Requested';
    order.cancellationDetails = {
      reason: reason,
      status: 'Pending',
      requestedAt: Date.now(),
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
            emailSubject = `Your Order #${order._id} Cancellation has been Approved`;

            
            if (order.paymentMethod === 'Stripe' && order.isPaid) {
                try {
                    const paymentIntentId = order.paymentResult.id;
                    if (!paymentIntentId) {
                        throw new Error('Payment Intent ID not found for this order.');
                    }
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentIntentId,
                    });
                    order.isRefunded = true;
                    order.refundedAt = Date.now();
                    
                    emailMessage = `
                        <p>Hi ${order.user.name},</p>
                        <p>Your cancellation request for order #${order._id} has been approved.</p>
                        <p>A refund of ₹${order.totalPrice} has been processed via Stripe. It may take 5-10 business days to appear in your account.</p>
                        <p>We are sorry to see you go.</p>
                    `;
                    console.log('Stripe refund successful:', refund.id);
                } catch (refundError) {
                    console.error('Stripe refund failed:', refundError);
                    
                    emailMessage = `<p>Hi ${order.user.name},</p><p>Your cancellation for order #${order._id} is approved, but there was an issue processing your automated refund. Please contact support.</p>`;
                }
            } else {
                emailMessage = `
                    <p>Hi ${order.user.name},</p>
                    <p>Your cancellation request for order #${order._id} has been approved.</p>
                    <p>Since this was a Cash on Delivery order, no refund is necessary.</p>
                `;
            }
        } else if (action === 'reject') {
            order.status = 'Processing'; 
            order.cancellationDetails.status = 'Rejected';
            emailSubject = `Your Order #${order._id} Cancellation has been Rejected`;
            emailMessage = `
                <p>Hi ${order.user.name},</p>
                <p>We're sorry, but your cancellation request for order #${order._id} has been rejected.</p>
                <p>This is likely because the item has already been prepared for shipment. Please contact support for more details.</p>
            `;
        } else {
            res.status(400);
            throw new Error("Invalid action. Action 'approve' ya 'reject' honi chahiye.");
        }

        const updatedOrder = await order.save();

        // User ko final email bhejo
        try {
            await sendEmail({
                email: order.user.email,
                subject: emailSubject,
                message: emailMessage
            });
        } catch (emailError) {
            console.error("Failed to send cancellation status email:", emailError);
        }

        res.json(updatedOrder);

    } else {
        res.status(404);
        throw new Error('Order not found or no pending cancellation request.');
    }
});
export { addOrderItems, getOrderById, createPaymentIntent, updateOrderToPaid, getMyOrders, getAllOrders, updateOrderStatus, deleteOrder, requestOrderCancellation, manageCancellationRequest, getSellerOrders };