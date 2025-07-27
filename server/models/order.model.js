import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        cycle: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Cycle',
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    estimatedDeliveryDate: { type: Date },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },

    // --- NAYE FIELDS CANCELLATION KE LIYE ---
    status: {
  type: String,
  required: true,
  default: 'Processing',
  enum: [
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancellation Requested',
    'Cancelled',
    'Return Requested',     
    'Return Approved',      
    'Return Rejected',      
    'Refund Processed'    
  ],
},
    isRefunded: {
      type: Boolean,
      required: true,
      default: false,
    },
    refundedAt: {
      type: Date,
    },
    cancellationDetails: {
      reason: { type: String },
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected'] },
      requestedAt: { type: Date },
    },

returnInitiated: {
  type: Boolean,
  default: false, 
},
returnRequestDate: {
  type: Date, 
  default: null 
},
returnId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Return', 
  default: null 
},
returnDeadline: {
  type: Date, 
  default: null 
    },

  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;