import asyncHandler from 'express-async-handler';
import Coupon from '../models/coupon.model.js';


const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, expiryDate, isFeatured, bannerTitle, bannerText } = req.body;

  const couponExists = await Coupon.findOne({ code });
  if (couponExists) {
    res.status(400);
    throw new Error('Coupon code already exists');
  }

  
  if (isFeatured) {
    await Coupon.updateMany({}, { $set: { isFeatured: false } });
  }

  const coupon = new Coupon({
    code,
    discountType,
    discountValue,
    expiryDate,
    isFeatured,
    bannerTitle,
    bannerText,
  });

  const createdCoupon = await coupon.save();
  res.status(201).json(createdCoupon);
});

const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({});
  res.json(coupons);
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    
    if (req.body.isFeatured === true) {
      await Coupon.updateMany({ _id: { $ne: req.params.id } }, { $set: { isFeatured: false } });
    }
    
    
    coupon.isActive = req.body.isActive ?? coupon.isActive;
    coupon.isFeatured = req.body.isFeatured ?? coupon.isFeatured;
    coupon.bannerTitle = req.body.bannerTitle || coupon.bannerTitle;
    coupon.bannerText = req.body.bannerText || coupon.bannerText;
   

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

  
  res.json({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });
});
const getFeaturedCoupon = asyncHandler(async (req, res) => {
  const featuredCoupon = await Coupon.findOne({
    isFeatured: true,
    isActive: true,
    
    $or: [
      { expiryDate: { $exists: false } }, 
      { expiryDate: { $gt: new Date() } }   
    ]
  });

  if (featuredCoupon) {
    res.json(featuredCoupon);
  } else {
    
    res.json({});
  }
});
export { createCoupon, getAllCoupons, updateCoupon, deleteCoupon, applyCoupon, getFeaturedCoupon };