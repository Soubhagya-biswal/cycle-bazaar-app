import express from 'express';
import asyncHandler from 'express-async-handler'; 
import Cycle from '../models/cycle.model.js'; 
import { protect, seller } from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/', protect, seller, asyncHandler(async (req, res) => {
    
    const products = await Cycle.find({ seller: req.user._id });
    res.json(products);
}));
  router.get('/:id', protect, seller, asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id); 

    if (cycle) { 
        if (cycle.seller.toString() !== req.user._id.toString()) {
            res.status(401); 
            throw new Error('Not authorized: You do not own this product');
        }
        res.json(cycle); 
    } else { 
        res.status(404); 
        throw new Error('Product not found');
    }
}));

router.post('/', protect, seller, asyncHandler(async (req, res) => {
    console.log('--- Debug: Incoming Request Body for POST /seller/products ---');
    console.log(req.body);
    console.log('------------------------------------------------------------');

    // CHANGE 1: Naye fields yahan nikale
    const { brand, model, marketPrice, ourPrice, stock, imageUrl, description, variants } = req.body;

    // CHANGE 2: Validation mein naye fields check kiye
    if (!brand || !model || marketPrice === undefined || ourPrice === undefined || stock === undefined || !description) {
        res.status(400);
        throw new Error('Please provide all required product details: brand, model, prices, stock, and description.');
    }

    // Individual variants ke andar ki details ki validation (yeh theek hai)
    if (variants && variants.length > 0) {
        for (const variant of variants) {
            if (!variant.color || !variant.size || variant.additionalPrice === undefined || variant.variantStock === undefined) {
                res.status(400);
                throw new Error('Each variant must have a color, size, additional price, and stock.');
            }
        }
    }
    
    // CHANGE 3: Naye fields use karke naya cycle banaya
    const cycle = new Cycle({
        brand,
        model,
        marketPrice,
        ourPrice,
        stock, // Base stock from the form
        imageUrl: imageUrl || '/images/sample.jpg',
        description,
        seller: req.user._id,
        numReviews: 0,
        rating: 0,
        reviews: [],
        variants
    });

    const createdCycle = await cycle.save();
    res.status(201).json(createdCycle);

}));

router.put('/:id', protect, seller, asyncHandler(async (req, res) => {
    const { brand, model, price, imageUrl, description, variants } = req.body;
    const cycleId = req.params.id;

    const cycle = await Cycle.findById(cycleId);

    if (cycle) {
        
        if (cycle.seller.toString() !== req.user._id.toString()) {
            res.status(401); 
            throw new Error('You are not authorized to update this product');
        }

        cycle.brand = brand || cycle.brand;
        cycle.model = model || cycle.model;
        cycle.price = price || cycle.price;
        cycle.imageUrl = imageUrl || cycle.imageUrl;
        cycle.description = description || cycle.description;
        if (variants && Array.isArray(variants)) {
            cycle.variants = variants;
            
            cycle.stock = variants.reduce((acc, variant) => acc + (variant.variantStock || 0), 0);
        } else {
            
            res.status(400);
            throw new Error('Variants must be provided as a valid array.');
        }

        const updatedCycle = await cycle.save();
        res.json(updatedCycle);

    } else {
        res.status(404);
        throw new Error('Product not found');
    }
}));
router.delete('/:id', protect, seller, asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id);

    if (cycle) {
        
        if (cycle.seller.toString() !== req.user._id.toString()) {
            res.status(401); 
            throw new Error('You are not authorized to delete this product');
        }
        await cycle.deleteOne(); 
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
}));

export default router;