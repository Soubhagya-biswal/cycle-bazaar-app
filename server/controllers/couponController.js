import asyncHandler from 'express-async-handler';
import Coupon from '../models/coupon.model.js';


const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, expiryDate } = req.body;

  
  const couponExists = await Coupon.findOne({ code });
  if (couponExists) {
    res.status(400);
    throw new Error('Coupon code already exists');
  }

  const coupon = new Coupon({
    code,
    discountType,
    discountValue,
    expiryDate,
  });

  const createdCoupon = await coupon.save();
  res.status(201).json(createdCoupon);
});

const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({});
  res.json(coupons);
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { isActive, expiryDate } = req.body;
  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    coupon.isActive = isActive;
    if (expiryDate) {
        coupon.expiryDate = expiryDate;
    }
    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } else {
    res.status(404);
    throw new Error('Coupon not found');
  }
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    await coupon.deleteOne();
    res.json({ message: 'Coupon removed' });
  } else {
    res.status(404);
    throw new Error('Coupon not found');
  }
});
const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    res.status(400);
    throw new Error('Coupon code is required');
  }

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

  // Coupon ko check karo
  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }
  if (!coupon.isActive) {
    res.status(400);
    throw new Error('This coupon is no longer active');
  }
  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    res.status(400);
    throw new Error('This coupon has expired');
  }

  // Agar sab theek hai, to discount details bhej do
  res.json({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });
});
export { createCoupon, getAllCoupons, updateCoupon, deleteCoupon, applyCoupon };