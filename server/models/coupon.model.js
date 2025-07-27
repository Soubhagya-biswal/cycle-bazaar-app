import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // Saare coupon codes apne aap capital letters mein save honge
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed'], // Discount ya to percentage hoga ya fixed amount
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true, // Naya coupon hamesha active hoga
    },
    expiryDate: {
      type: Date,
      required: false, // Expiry date optional hai
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;